import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) Alert.alert(error.message);
      else Alert.alert('Check your inbox for email verification!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) Alert.alert(error.message);
    }
    setLoading(false);
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
            {isSignUp ? 'Create account' : 'Welcome back'}
          </Text>
          <Text className="text-text-secondary text-lg">
            {isSignUp ? 'Enter your details below to sign up.' : 'Enter your email to sign in to your account.'}
          </Text>
        </View>

        <View className="gap-4">
          <View>
             <Input
                label="Email"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
          </View>
          <View>
             <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
          </View>

          <Button 
            title={isSignUp ? 'Sign up' : 'Sign in'}
            onPress={handleAuth}
            disabled={loading}
            className="mt-2"
          />

          <View className="flex-row justify-center mt-4">
            <Text className="text-text-secondary">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text className="text-primary font-medium">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
