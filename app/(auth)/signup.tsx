// app/(auth)/signup.tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui';
import { Colors, Radii, Spacing, Typography } from '../../src/lib/design';
import { Ionicons } from '@expo/vector-icons';

const schema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50),
  username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8).regex(/[A-Z]/, 'Include at least one uppercase letter').regex(/[0-9]/, 'Include at least one number'),
});

type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const { signUp, isLoading, user } = useAuthStore();
  const isGuest = user?.is_anonymous === true;
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: '', username: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signUp(data);
      router.replace('/(app)/groups');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      Toast.show({
        type: 'error',
        text1: 'Sign up failed',
        text2: message.includes('already registered') ? 'This email is already registered' : message,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🛒</Text>
          <Text style={styles.appName}>Shoply</Text>
          <Text style={styles.tagline}>
            {isGuest ? 'Bewaar je data met een account' : 'Create your account'}
          </Text>
        </View>

        {/* Banner voor gastgebruikers */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.guestBannerText}>
              Je lijsten en items blijven bewaard — je account wordt gekoppeld aan je gastprofiel.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <FormField
            control={control}
            name="display_name"
            label="Your Name"
            placeholder="Alice Smith"
            error={errors.display_name?.message}
            autoComplete="name"
            textContentType="name"
          />
          <FormField
            control={control}
            name="username"
            label="Username"
            placeholder="alice_smith"
            error={errors.username?.message}
            autoCapitalize="none"
            autoComplete="username"
            hint="Lowercase letters, numbers, underscores only"
          />
          <FormField
            control={control}
            name="email"
            label="Email"
            placeholder="alice@example.com"
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          <Button
            label={isGuest ? 'Account aanmaken & data bewaren' : 'Create Account'}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        {!isGuest && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({ control, name, label, placeholder, error, hint, ...inputProps }: {
  control: Parameters<typeof Controller>[0]['control'];
  name: string; label: string; placeholder: string; error?: string; hint?: string;
  [key: string]: unknown;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            returnKeyType="next"
            {...inputProps}
          />
        )}
      />
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.base, paddingTop: Spacing['3xl'], gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { fontSize: 48 },
  appName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.text, letterSpacing: -1 },
  tagline: { fontSize: Typography.base, color: Colors.textSecondary },
  guestBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primarySurface, borderRadius: Radii.lg,
    padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.primaryLight + '40',
  },
  guestBannerText: { flex: 1, fontSize: Typography.sm, color: Colors.primary, lineHeight: 20 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.xl, padding: Spacing.xl, gap: Spacing.base,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.bg,
  },
  inputError: { borderColor: Colors.danger },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 18 },
  errorText: { fontSize: Typography.xs, color: Colors.danger },
  hintText: { fontSize: Typography.xs, color: Colors.textTertiary },
  submitBtn: { marginTop: Spacing.sm },
  terms: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: Typography.base, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.primary },
});