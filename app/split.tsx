import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

import { useSession } from '@/lib/session';

type Friend = {
  id: string;
  username: string;
  full_name: string;
  selected: boolean;
};

export default function SplitBillScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useSession();

  useEffect(() => {
    fetchFriends();
  }, [currentUser]);

  async function fetchFriends() {
    try {
      setLoading(true);
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('friends')
        .select(`
          user_id,
          friend_id,
          inviter:user_id(id, username, full_name),
          invitee:friend_id(id, username, full_name)
        `)
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const formattedFriends: Friend[] = data.map((item: any) => {
        const isSender = item.user_id === currentUser.id;
        const profile = isSender ? item.invitee : item.inviter;
        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          selected: false
        };
      });

      setFriends(formattedFriends);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleFriend = (id: string) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const selectedFriends = friends.filter(f => f.selected);

  const splitCalculations = useMemo(() => {
    const val = parseFloat(amount) || 0;
    if (val === 0 || selectedFriends.length === 0) return { perPerson: 0, total: 0 };

    // Split between me + selected friends
    const count = selectedFriends.length + 1;
    const perPerson = val / count;

    return { perPerson, count };
  }, [amount, selectedFriends]);

  const handleSplit = async () => {
    if (!amount || selectedFriends.length === 0) {
      Alert.alert('Error', 'Please enter amount and select at least one friend');
      return;
    }

    setSubmitting(true);
    try {
      if (!currentUser) throw new Error('Not authenticated');

      // Create a loan request for each friend
      // I am the Lender (I paid), they are Borrowers (they owe me)

      const requests = selectedFriends.map(friend => ({
        lender_id: currentUser.id,
        borrower_id: friend.id,
        amount: splitCalculations.perPerson,
        status: 'pending',
        interest_rate: 0, // Usually 0 for splits
        service_fee: 0
      }));

      const { error } = await supabase
        .from('loans')
        .insert(requests);

      if (error) throw error;

      Alert.alert('Success', `Sent ${selectedFriends.length} split requests!`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 px-5">
        <View className="mt-4 mb-6 flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-surface rounded-full">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Split Bill</Text>
        </View>

        <Card className="mb-6 p-6 items-center">
          <Text className="text-text-secondary text-sm mb-2">Total Bill Amount</Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-text-primary text-4xl font-bold mr-1">$</Text>
            <Input
              className="text-4xl font-bold text-text-primary w-40 text-center bg-transparent border-0 p-0"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </Card>

        <View className="mb-6">
          <Text className="text-text-secondary text-sm font-medium mb-3 uppercase">Select Friends</Text>
          {friends.length === 0 ? (
            <Text className="text-text-secondary">No friends found. Add friends first!</Text>
          ) : (
            friends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                onPress={() => toggleFriend(friend.id)}
                className={`p-4 mb-3 rounded-xl border flex-row items-center justify-between ${friend.selected ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-background rounded-full items-center justify-center mr-3 border border-border">
                    <Text className="text-text-primary font-bold">{friend.username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text className="text-text-primary font-bold">{friend.full_name || friend.username}</Text>
                    <Text className="text-text-secondary text-xs">@{friend.username}</Text>
                  </View>
                </View>
                {friend.selected && <Check size={20} color="#E8B017" />}
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedFriends.length > 0 && amount ? (
          <View className="mb-8 p-4 bg-surface rounded-xl">
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Total Amount</Text>
              <Text className="text-text-primary font-bold">${parseFloat(amount).toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Split with</Text>
              <Text className="text-text-primary font-bold">{selectedFriends.length} friends + You</Text>
            </View>
            <View className="h-[1px] bg-border my-2" />
            <View className="flex-row justify-between">
              <Text className="text-text-primary font-bold">Each pays</Text>
              <Text className="text-primary text-xl font-bold">${splitCalculations.perPerson.toFixed(2)}</Text>
            </View>
          </View>
        ) : null}

        <Button
          title={`Split $${amount || '0'} with ${selectedFriends.length} friends`}
          onPress={handleSplit}
          loading={submitting}
          disabled={!amount || selectedFriends.length === 0}
          className="mb-8"
        />

      </ScrollView>
    </SafeAreaView>
  );
}
