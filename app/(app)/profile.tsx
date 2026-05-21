// app/(app)/profile.tsx
import React, { useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore, THEMES } from '../../src/store/themeStore';
import { useLanguageStore, LANGUAGES } from '../../src/store/languageStore';
import { registerForPushNotifications } from '../../src/lib/notifications';
import { Avatar, Button } from '../../src/components/ui';
import { useColors, Colors, Radii, Shadows, Spacing, Typography } from '../../src/lib/design';

export default function ProfileScreen() {
  const { user, updateProfile, signOut, isLoading } = useAuthStore();
  const { themeIndex, setTheme } = useThemeStore();
  const { languageCode, setLanguage } = useLanguageStore();
  const C = useColors();
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

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const MODAL_CONTENT = {
    about: { title: 'About Shoply', text: 'Shoply is a real-time shared shopping list app.\n\nVersion 1.0.0\n© 2026 Shoply.' },
    privacy: { title: 'Privacy Policy', text: 'Your privacy is important to us. We do not sell your data.' },
    terms: { title: 'Terms of Service', text: 'By using Shoply, you agree to use it for personal, non-commercial purposes.' },
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
{/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language / Taal</Text>
        <View style={styles.themeRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={[
                styles.langBtn,
                languageCode === lang.code && { backgroundColor: C.primary, borderColor: C.primary },
              ]}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[
                styles.langLabel,
                languageCode === lang.code && { color: '#FFFFFF' },
              ]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeRow}>
          {THEMES.map((theme, index) => (
            <TouchableOpacity
              key={theme.name}
              onPress={() => setTheme(index)}
              style={[
                styles.themeCircle,
                { backgroundColor: theme.primary },
                themeIndex === index && styles.themeCircleActive,
              ]}
            />
          ))}
        </View>
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
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: C.primary, false: Colors.border }}
            thumbColor="#FFFFFF"
          />
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

      <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
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
  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.lg,
    overflow: 'hidden', padding: Spacing.base, gap: Spacing.md, ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  themeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', paddingVertical: 4 },
  themeCircle: { width: 36, height: 36, borderRadius: 18 },
  themeCircleActive: { borderWidth: 3, borderColor: '#0F172A' },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingLabel: { fontSize: Typography.base, color: Colors.text, fontWeight: Typography.medium },
  settingHint: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  version: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textTertiary },
  signOutBtn: {
    backgroundColor: '#EF4444', padding: 16, borderRadius: Radii.lg, alignItems: 'center',
  },
  signOutText: { color: 'white', fontWeight: Typography.bold, fontSize: Typography.base },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '80%',
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.base },
  modalScroll: { flex: 1 },
  modalText: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 24 },
  modalCloseBtn: { marginTop: Spacing.sm },
});