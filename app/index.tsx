// app/index.tsx
// Root redirect — handles OAuth callback and auth state
import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    const handleRedirect = async () => {
      await initialize();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(app)/groups');
      } else {
        router.replace('/(auth)/login');
      }
    };
    handleRedirect();
  }, []);

  return null;
}