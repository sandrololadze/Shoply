// app/auth-callback/index.tsx
import { useEffect } from 'react';
import { View } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      // Sla op in localStorage zodat Supabase het oppikt
      const key = 'sb-dcntghewfrtvjlflouyf-auth-token';
      const tokenData = {
        access_token,
        refresh_token,
        token_type: 'bearer',
      };
      localStorage.setItem(key, JSON.stringify(tokenData));
      
      // Redirect naar de app
      window.location.href = 'https://shoply-steel.vercel.app/(app)/groups';
    } else {
      window.location.href = 'https://shoply-steel.vercel.app/(auth)/login';
    }
  }, []);

  return <View />;
}