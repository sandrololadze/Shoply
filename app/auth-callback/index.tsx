// app/auth-callback/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { View } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/groups');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return <View />;
}