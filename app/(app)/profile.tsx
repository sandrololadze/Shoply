// app/(app)/profile.tsx
// User profile screen — edit name, manage notifications, sign out

import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!user?.profile.push_token);
  const [modalContent, setModalContent] = useState<null | 'about' | 'privacy' | 'terms'>(null);

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
        Toast.show({ type: 'info', text1: 'Permission required', text2: 'Enable notifications in your device settings' });
      }
    } else {
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

  const MODAL_CONTENT = {
    about: {
      title: 'About Shoply',
      text: `Shoply is a real-time shared shopping list app that makes grocery shopping easier for families, roommates, and friends.\n\nWith Shoply you can:\n• Create multiple shared shopping lists\n• Invite others with a simple invite code\n• See live updates when items are added or checked off\n• Track who added each item and when\n• Use it on any device — phone, tablet, or computer\n\nShoply was built with React Native, Expo, and Supabase.\n\nVersion 1.0.0\n© 2026 Shoply. All rights reserved.`,
    },
    privacy: {
      title: 'Privacy Policy',
      text: `Last updated: May 2026\n\nYour privacy is important to us.\n\n1. DATA WE COLLECT\nWe collect your email address, display name, and username when you create an account. We also store the shopping lists and items you create.\n\n2. HOW WE USE YOUR DATA\nYour data is used only to provide the Shoply service. We do not sell your personal information to third parties.\n\n3. DATA STORAGE\nYour data is stored securely on Supabase servers with encryption at rest and in transit.\n\n4. DATA SHARING\nYour display name is visible to other members of groups you join. Your email address is never shared.\n\n5. YOUR RIGHTS\nYou can delete your account and all associated data at any time by contacting us.\n\n6. COOKIES\nWe use cookies only for authentication purposes.\n\nContact: privacy@shoply.app`,
    },
    terms: {
      title: 'Terms of Service',
      text: `Last updated: May 2026\n\n1. ACCEPTANCE\nBy using Shoply, you agree to these terms.\n\n2. USE OF SERVICE\nShoply is provided for personal, non-commercial use. You may not use Shoply for illegal purposes or to harm others.\n\n3. YOUR ACCOUNT\nYou are responsible for keeping your account secure. Do not share your password.\n\n4. CONTENT\nYou own the content you create in Shoply. By using the service, you grant us a license to store and display your content to provide the service.\n\n5. PROHIBITED CONDUCT\nYou may not:\n• Use Shoply for spam or harassment\n• Attempt to hack or disrupt the service\n• Create fake accounts\n\n6. TERMINATION\nWe reserve the right to suspend accounts that violate these terms.\n\n7. DISCLAIMER\nShoply is provided "as is" without warranties of any kind.\n\n8. CONTACT\nterms@shoply.app`,
    },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <Avatar userId={user.id} displayName={user.profile.display_name} size={80} />
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
            <Button label="Cancel" onPress={() => { setEditing(false); setDisplayName(user.profile.display_name); }} variant="secondary" style={styles.halfBtn} />
          </>
        ) : (
          <Button label="Edit Name" onPress={() => setEditing(true)} variant="secondary" icon={<Ionicons name="pencil-outline" size={16} color={Colors.text} />} />
        )}
      </View>

      {/* Notifications */}
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
          <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor="#FFFFFF" />
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingLink icon="information-circle-outline" label="About Shoply" onPress={() => setModalContent('about')} />
        <SettingLink icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => setModalContent('privacy')} />
        <SettingLink icon="document-text-outline" label="Terms of Service" onPress={() => setModalContent('terms')} />
      </View>

      <Text style={styles.version}>Shoply v1.0.0</Text>
 <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, {backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center'}]}>
  <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>Sign Out</Text>
</TouchableOpacity>

      {/* Info Modal */}
      <Modal visible={!!modalContent} transparent animationType="slide" onRequestClose={() => setModalContent(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalContent ? MODAL_CONTENT[modalContent].title : ''}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>
                {modalContent ? MODAL_CONTENT[modalContent].text : ''}
              </Text>
            </ScrollView>
            <Button label="Close" onPress={() => setModalContent(null)} variant="secondary" style={styles.modalCloseBtn} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingLink({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
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
    fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text,
    borderBottomWidth: 2, borderBottomColor: Colors.primary, textAlign: 'center', minWidth: 200, paddingVertical: 4,
  },
  displayName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  username: { fontSize: Typography.base, color: Colors.textSecondary },
  email: { fontSize: Typography.sm, color: Colors.textTertiary },
  editActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  halfBtn: { flex: 1 },
  section: { backgroundColor: Colors.bgCard, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.sm },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingLabel: { fontSize: Typography.base, color: Colors.text, fontWeight: Typography.medium },
  settingHint: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  version: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textTertiary },
  signOutBtn: { marginTop: Spacing.sm },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '80%',
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.base },
  modalScroll: { marginBottom: Spacing.base },
  modalText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 22 },
  modalCloseBtn: { marginTop: Spacing.sm },
});
