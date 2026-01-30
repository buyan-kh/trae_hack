import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function CreateLoanScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [interestRate, setInterestRate] = useState('5'); // Default 5%
  const [loading, setLoading] = useState(false);

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

  const handleTransaction = async (type: 'lend' | 'borrow') => {
    if (!amount || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: friends, error: searchError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .limit(1);

      if (searchError || !friends || friends.length === 0) {
        throw new Error('User not found. Please check the username.');
      }

      const friend = friends[0];
      if (friend.id === user.id) {
        throw new Error('You cannot transact with yourself.');
      }

      const loanData = {
        lender_id: type === 'lend' ? user.id : friend.id,
        borrower_id: type === 'borrow' ? user.id : friend.id,
        amount: parseFloat(amount),
        status: 'pending',
        interest_rate: parseFloat(interestRate),
        service_fee: calculations.serviceFee
      };

      const { error } = await supabase
        .from('loans')
        .insert(loanData);

      if (error) {
        if (error.message.includes('Trust score')) {
           Alert.alert('Limit Reached', error.message);
        } else {
           throw error;
        }
      } else {
        Alert.alert('Success', `Transaction ${type === 'lend' ? 'sent' : 'requested'} successfully!`);
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
          <View className="mt-8 mb-6">
            <Text className="text-text-primary text-2xl font-bold">New Transaction</Text>
            <Text className="text-text-secondary mt-1">Send or request money from friends</Text>
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
                placeholder="Username (e.g. johndoe)"
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

          <View className="mt-8 flex-row gap-4">
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

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
