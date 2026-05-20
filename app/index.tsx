// app/index.tsx
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(app)/groups');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/groups');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
}