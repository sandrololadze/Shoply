// app/index.tsx
// Root redirect — sends users to the right place based on auth state

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  // If logged in → app, otherwise → auth flow
  return <Redirect href={user ? '/(app)/groups' : '/(auth)/login'} />;
}
