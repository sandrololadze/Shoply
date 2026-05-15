// app/(app)/profile.tsx
// User profile screen — edit name, manage notifications, sign out

import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { registerForPushNotifications } from '../../src/lib/notifications';
import { Avatar, Button } from '../../src/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../src/lib/design';

export default function ProfileScreen() {
  const { user, updateProfile, signOut, isLoading } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.profile.display_name ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    !!user?.profile.push_token
  );

  if (!user) return null;

  const handleSave = async () => {
    if (!displayName.trim()) {
      Toast.show({ type: 'error', text1: 'Name cannot be empty' });
      return;
    }
    try {
      await updateProfile({ display_name: displayName.trim() });
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled) {
      const token = await registerForPushNotifications();
      if (!token) {
        setNotificationsEnabled(false);
        Toast.show({
          type: 'info',
          text1: 'Permission required',
          text2: 'Enable notifications in your device settings',
        });
      }
    } else {
      // Clear token to stop receiving notifications
      await updateProfile({ push_token: null });
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <Avatar
          userId={user.id}
          displayName={user.profile.display_name}
          size={80}
        />
        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={displayName}
            onChangeText={setDisplayName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        ) : (
          <Text style={styles.displayName}>{user.profile.display_name}</Text>
        )}
        <Text style={styles.username}>@{user.profile.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Edit actions */}
      <View style={styles.editActions}>
        {editing ? (
          <>
            <Button label="Save" onPress={handleSave} loading={isLoading} style={styles.halfBtn} />
            <Button
              label="Cancel"
              onPress={() => { setEditing(false); setDisplayName(user.profile.display_name); }}
              variant="secondary"
              style={styles.halfBtn}
            />
          </>
        ) : (
          <Button
            label="Edit Name"
            onPress={() => setEditing(true)}
            variant="secondary"
            icon={<Ionicons name="pencil-outline" size={16} color={Colors.text} />}
          />
        )}
      </View>

      {/* Settings section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingHint}>Get notified when items are added</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingLink
          icon="information-circle-outline"
          label="About Shoply"
          onPress={() => {}}
        />
        <SettingLink
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => {}}
        />
        <SettingLink
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => {}}
        />
      </View>

      {/* Version */}
      <Text style={styles.version}>Shoply v1.0.0</Text>

      {/* Sign out */}
      <Button
        label="Sign Out"
        onPress={handleSignOut}
        variant="danger"
        style={styles.signOutBtn}
      />
    </ScrollView>
  );
}

function SettingLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={Colors.text} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.base, paddingBottom: 48, gap: Spacing.xl },

  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  nameInput: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    textAlign: 'center',
    minWidth: 200,
    paddingVertical: 4,
  },
  displayName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  username: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  email: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },

  editActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  halfBtn: { flex: 1 },

  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingLabel: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  settingHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  version: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  signOutBtn: { marginTop: Spacing.sm },
});
