// app/index.tsx
// Root redirect — sends users to the right place based on auth state

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  // If logged in → app, otherwise → auth flow
  return <Redirect href={user ? '/(app)/groups' : '/(auth)/login'} />;
}
// app/index.tsx
// Handles OAuth callback and redirects to correct screen

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