// app/auth-callback/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { View } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      // Get hash from URL and let Supabase process it
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const { data, error } = await supabase.auth.getSession();
          if (data.session) {
            router.replace('/(app)/groups');
            return;
          }
        }
      }

      // Wait a moment for Supabase to process the token
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(app)/groups');
      } else {
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, []);

  return <View />;
}