// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(app)/groups');
      } else if (event === 'SIGNED_OUT' || !session) {
        router.replace('/(auth)/login');
      }
    });

    // Also check existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/groups');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return null;
}