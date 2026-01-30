import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSession } from '@/lib/session';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [username, setUsername] = useState('');
  const { signIn, isLoading } = useSession();

  async function handleAuth() {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      await signIn(username.trim().toLowerCase());
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-10">
          <Text className="text-text-primary text-4xl font-bold mb-2">
            Welcome to Peerly
          </Text>
          <Text className="text-text-secondary text-lg">
            Enter your username to get started. No password required.
          </Text>
        </View>

        <View className="gap-4">
          <View>
             <Input
                label="Username"
                placeholder="johndoe"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
          </View>

          <Button 
            title="Continue"
            onPress={handleAuth}
            disabled={isLoading}
            loading={isLoading}
            className="mt-2"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
