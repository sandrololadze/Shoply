// app/(auth)/signup.tsx
// Sign up screen with username + display name

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui';
import { Colors, Radii, Spacing, Typography } from '../../src/lib/design';

const schema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username too long')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
});

type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const { signUp, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: '',
      username: '',
      email: '',
      password: '',
    },
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
        text2: message.includes('already registered')
          ? 'This email is already registered'
          : message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🛒</Text>
          <Text style={styles.appName}>Shoply</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.card}>
          {/* Display Name */}
          <FormField
            control={control}
            name="display_name"
            label="Your Name"
            placeholder="Alice Smith"
            error={errors.display_name?.message}
            autoComplete="name"
            textContentType="name"
          />

          {/* Username */}
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

          {/* Email */}
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

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
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
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          <Button
            label="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Reusable form field ─────────────────────────────────
function FormField({
  control,
  name,
  label,
  placeholder,
  error,
  hint,
  ...inputProps
}: {
  control: Parameters<typeof Controller>[0]['control'];
  name: string;
  label: string;
  placeholder: string;
  error?: string;
  hint?: string;
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
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.base,
    paddingTop: Spacing['3xl'],
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { fontSize: 48 },
  appName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: { fontSize: Typography.base, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    gap: Spacing.base,
    ...{
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  field: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    fontSize: Typography.base,
    color: Colors.text,
    backgroundColor: Colors.bg,
  },
  inputError: { borderColor: Colors.danger },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },
  errorText: { fontSize: Typography.xs, color: Colors.danger },
  hintText: { fontSize: Typography.xs, color: Colors.textTertiary },
  submitBtn: { marginTop: Spacing.sm },
  terms: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: Typography.base, color: Colors.textSecondary },
  footerLink: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
});
