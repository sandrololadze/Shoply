// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../src/lib/design';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
