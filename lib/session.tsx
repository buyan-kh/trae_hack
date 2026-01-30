import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  email?: string;
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
  signIn: async () => {},
  signOut: async () => {},
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
      // 1. Check if user exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (searchError) throw searchError;

      let currentUser;

      if (existingUsers && existingUsers.length > 0) {
        // User exists
        currentUser = existingUsers[0];
      } else {
        // Create new user
        // Generate a random UUID? Postgres handles it with default uuid_generate_v4() if we set it,
        // or we let Supabase return it.
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            username,
            full_name: username, // Default full name to username
            balance: 1000,
            trust_score: 650
          })
          .select()
          .single();

        if (createError) throw createError;
        currentUser = newUser;
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
