// src/components/ui/index.tsx
// Reusable design system components

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing, Typography, getAvatarColor, getInitials } from '../../lib/design';
import type { MemberRole } from '../../types';

// ─── Button ───────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.btn,
    styles[`btn_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`btn_${size}` as keyof typeof styles] as ViewStyle,
    isDisabled && styles.btn_disabled,
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.btnText,
    styles[`btnText_${variant}` as keyof typeof styles] as TextStyle,
    styles[`btnText_${size}` as keyof typeof styles] as TextStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={styles.btnIcon}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Avatar ───────────────────────────────────────────────
interface AvatarProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ userId, displayName, size = 36 }: AvatarProps) {
  const bgColor = getAvatarColor(userId);
  const initials = getInitials(displayName);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ─── RoleBadge ────────────────────────────────────────────
export function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <View style={[styles.badge, role === 'admin' ? styles.badgeAdmin : styles.badgeMember]}>
      <Text style={[styles.badgeText, role === 'admin' ? styles.badgeTextAdmin : styles.badgeTextMember]}>
        {role === 'admin' ? '★ Admin' : 'Member'}
      </Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          style={styles.emptyAction}
        />
      )}
    </View>
  );
}

// ─── LoadingScreen ────────────────────────────────────────
export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={Colors.primary} size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ─── ErrorState ───────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
      {onRetry && <Button label="Try Again" onPress={onRetry} variant="secondary" />}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  // Button
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  btn_primary: {
    backgroundColor: Colors.primary,
  },
  btn_secondary: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_danger: {
    backgroundColor: Colors.danger,
  },
  btn_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 36 },
  btn_md: { paddingHorizontal: Spacing.lg, paddingVertical: 13, minHeight: 48 },
  btn_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] / 2, minHeight: 56 },
  btn_disabled: { opacity: 0.5 },
  btnText: {
    fontWeight: Typography.semibold,
    letterSpacing: 0.2,
  },
  btnText_primary: { color: Colors.textInverse },
  btnText_secondary: { color: Colors.text },
  btnText_ghost: { color: Colors.primary },
  btnText_danger: { color: Colors.textInverse },
  btnText_sm: { fontSize: Typography.sm },
  btnText_md: { fontSize: Typography.base },
  btnText_lg: { fontSize: Typography.md },
  btnIcon: { marginRight: Spacing.sm },

  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  badgeAdmin: { backgroundColor: Colors.adminSurface },
  badgeMember: { backgroundColor: Colors.memberSurface },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  badgeTextAdmin: { color: Colors.admin },
  badgeTextMember: { color: Colors.member },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.normal,
    marginBottom: Spacing.xl,
  },
  emptyAction: {
    minWidth: 160,
  },

  // Loading
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
