import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  balance?: number;
  trust_score?: number;
};

type SessionContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  isLoading: true,
  signIn: async () => { },
  signOut: async () => { },
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('peerly_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string) => {
    setIsLoading(true);
    try {
      const email = `${username.toLowerCase().replace(/\s/g, '')}@example.com`; // Simple email generation
      const password = 'peerly-default-password'; // Fixed password for simplicity

      // 1. Try to sign in
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. If sign in fails (likely user doesn't exist), try to sign up
      if (authError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          // If sign up fails, it might be unrelated (e.g. rate limit), but let's handle it
          throw signUpError;
        }
        authData = signUpData;
      }

      const authUser = authData.user;
      if (!authUser) throw new Error('Authentication failed');

      // 3. Ensure profile exists linked to this Auth ID
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let currentUser = existingProfile;

      if (!currentUser) {
        // Create new profile with the SAME ID as the auth user
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username,
            full_name: username,
            balance: 1000,
            trust_score: 650
          })
          .select()
          .single();

        if (createError) throw createError;
        currentUser = newProfile;
      }

      // Save session
      await AsyncStorage.setItem('peerly_user', JSON.stringify(currentUser));
      setUser(currentUser);

    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('peerly_user');
    setUser(null);
  };

  return (
    <SessionContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};
