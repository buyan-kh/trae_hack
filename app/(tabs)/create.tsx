import { LoanReceipt, LoanReceiptProps } from '@/components/LoanReceipt';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function CreateLoanScreen() {
  const { user: currentUser } = useSession();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [interestRate, setInterestRate] = useState('5'); // Default 5%
  const [loading, setLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ username: string } | null>(null);
  
  // Receipt State
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<LoanReceiptProps | null>(null);
  const viewShotRef = useRef<View>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (data) setCurrentUserProfile(data);
    }
  };

  const handleShareReceipt = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 0.9,
        });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt.');
    }
  };

  // Constants
  const SERVICE_FEE_PERCENT = 0.02; // 2% Service Fee

  // Calculations
  const calculations = useMemo(() => {
    const val = parseFloat(amount) || 0;
    const rate = parseFloat(interestRate) || 0;

    const serviceFee = val * SERVICE_FEE_PERCENT;
    const totalRepayment = val + (val * (rate / 100));

    // Borrower receives: Amount - Service Fee
    // But usually, fee is added on top or deducted. 
    // User said: "percentaging the balance they got" -> imply deduction from received amount?
    // Let's assume: Request $100 -> Get $98. Pay back $100 + Interest.
    const amountReceived = val - serviceFee;

    return { val, serviceFee, totalRepayment, amountReceived };
  }, [amount, interestRate]);

  const handleTransaction = async (type: 'lend' | 'borrow' | 'link') => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    // For direct lend/borrow, username is required
    if (type !== 'link' && !username) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      if (!currentUser) throw new Error('Not authenticated');

      let friendId = null;

      if (type !== 'link') {
        const { data: friends, error: searchError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', username)
          .limit(1);

        if (searchError || !friends || friends.length === 0) {
          throw new Error('User not found. Please check the username.');
        }
        friendId = friends[0].id;
        if (friendId === currentUser.id) throw new Error('You cannot transact with yourself.');
      }

      const loanData = {
        lender_id: type === 'borrow' ? friendId : currentUser.id,
        borrower_id: type === 'borrow' ? currentUser.id : (type === 'link' ? null : friendId),
        amount: parseFloat(amount),
        status: type === 'link' ? 'pending_acceptance' : 'pending',
        interest_rate: parseFloat(interestRate),
        service_fee: calculations.serviceFee
      };

      const { data, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (error) {
        if (error.message.includes('Trust score')) {
          Alert.alert('Limit Reached', error.message);
        } else {
          throw error;
        }
        return;
      }

      if (type === 'link' && data) {
        const link = Linking.createURL(`loan/${data.id}`);

        // Start listening for acceptance
        const channel = supabase
          .channel(`loan_${data.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'loans',
              filter: `id=eq.${data.id}`
            },
            (payload) => {
              if (payload.new.status === 'active') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Contract Signed!', 'The borrower has accepted the loan.');
                setAmount('');
                setDescription('');
                // Clean up
                supabase.removeChannel(channel);
              }
            }
          )
          .subscribe();

        // Share the link
        try {
          const result = await Share.share({
            message: `Hey, I created a loan contract for $${amount}. Click to review and accept: ${link}`,
            url: link, // iOS only
            title: 'Peerly Loan Contract'
          });
        } catch (e) {
          console.log('Error sharing:', e);
        }

        Alert.alert('Link Generated', 'Share this link with potential borrowers.');

      } else {
        if (type === 'lend') {
           // Prepare receipt data
           setReceiptData({
             amount: calculations.val,
             date: new Date().toLocaleDateString(),
             lender: currentUserProfile?.username || 'Me',
             borrower: username,
             description: description,
             totalRepayment: calculations.totalRepayment,
             type: 'lend'
           });
           setReceiptVisible(true);
           // Auto trigger share after a short delay to allow render
           setTimeout(() => {
             // Optional: automatically prompt share. User might prefer manual.
             // handleShareReceipt(); 
           }, 500);
        } else {
           Alert.alert('Success', `Transaction requested successfully!`);
        }
        
        setAmount('');
        setDescription('');
        setUsername('');
      }

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5">
          <View className="mt-8 mb-6 flex-row justify-between items-start">
            <View>
              <Text className="text-text-primary text-2xl font-bold">New Transaction</Text>
              <Text className="text-text-secondary mt-1">Send or request money from friends</Text>
            </View>
            {/* Split bill button removed or kept as per original file, assuming kept */}
            <Button
              variant="secondary"
              title="Split Bill"
              size="sm"
            // onPress={() => router.push('/split')} 
            />
          </View>

          <Card className="mb-6">
            <View className="items-center py-6">
              <Text className="text-text-secondary text-sm mb-2">Amount</Text>
              <View className="flex-row items-center">
                <Text className="text-text-primary text-5xl font-bold mr-1">$</Text>
                <Input
                  className="text-5xl font-bold text-text-primary w-40 text-center bg-transparent border-0 p-0"
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
            </View>
          </Card>

          <View className="gap-4">
            <Input
              label="Who is this for?"
              placeholder="Username (e.g. johndoe) - Optional for Links"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Interest Rate (%)"
                  placeholder="5.0"
                  keyboardType="numeric"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-text-secondary text-xs mb-1">Service Fee (2%)</Text>
                <Text className="text-text-primary font-bold">${calculations.serviceFee.toFixed(2)}</Text>
              </View>
            </View>

            {amount ? (
              <Card variant="outlined" className="p-4 bg-surface/50">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-text-secondary">Borrower Receives:</Text>
                  <Text className="text-text-primary font-bold">${calculations.amountReceived.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Total Repayment:</Text>
                  <Text className="text-success font-bold">${calculations.totalRepayment.toFixed(2)}</Text>
                </View>
              </Card>
            ) : null}

            <Input
              label="What is it for?"
              placeholder="Dinner, Rent, etc."
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View className="mt-8">
            <View className="flex-row gap-4 mb-4">
              <Button
                title="Request"
                variant="outline"
                className="flex-1"
                onPress={() => handleTransaction('borrow')}
                loading={loading}
              />
              <Button
                title="Send"
                className="flex-1"
                onPress={() => handleTransaction('lend')}
                loading={loading}
              />
            </View>
            <Button
              title="Generate Loan Link"
              variant="secondary"
              className="w-full"
              icon={<Share2 size={18} color="white" />}
              onPress={() => handleTransaction('link')}
              loading={loading}
            />
          </View>

          {/* Receipt Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={receiptVisible}
            onRequestClose={() => setReceiptVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/80 p-5">
              <View className="w-full bg-background rounded-3xl overflow-hidden">
                <View className="p-4 border-b border-border flex-row justify-between items-center">
                   <ThemedText type="defaultSemiBold">Transaction Successful</ThemedText>
                   <TouchableOpacity onPress={() => setReceiptVisible(false)}>
                      <ThemedText className="text-primary">Close</ThemedText>
                   </TouchableOpacity>
                </View>
                
                <ScrollView className="p-4">
                   {receiptData && (
                     <LoanReceipt 
                        ref={viewShotRef}
                        {...receiptData}
                     />
                   )}
                </ScrollView>

                <View className="p-4 border-t border-border">
                   <Button 
                      title="Share Receipt" 
                      onPress={handleShareReceipt}
                      icon={<Share2 size={18} color="white" />}
                   />
                </View>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
