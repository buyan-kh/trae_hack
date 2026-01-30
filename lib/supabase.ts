import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Helper to ensure we always have a valid URL to prevent crashes
const getValidUrl = (url: string | undefined) => {
  if (url && url.includes('://')) {
    return url;
  }
  return 'https://placeholder.supabase.co';
}

const url = getValidUrl(supabaseUrl);
const key = supabaseAnonKey || 'placeholder';

export const supabase = createClient(url, key);
