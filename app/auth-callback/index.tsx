// app/auth-callback/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { View } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (!error) {
          router.replace('/(app)/groups');
          return;
        }
      }

      router.replace('/(auth)/login');
    };

    handleCallback();
  }, []);

  return <View />;
}