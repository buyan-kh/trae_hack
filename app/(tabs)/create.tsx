import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import '../../global.css';

export default function CreateLoanScreen() {
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [friend, setFriend] = React.useState('');

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
                placeholder="Name, @username, or phone"
                value={friend}
                onChangeText={setFriend}
             />
             
             <Input
                label="What is it for?"
                placeholder="Dinner, Rent, etc."
                value={description}
                onChangeText={setDescription}
             />
          </View>

          <View className="mt-8 flex-row gap-4">
             <Button title="Request" variant="outline" className="flex-1" />
             <Button title="Send" className="flex-1" />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
