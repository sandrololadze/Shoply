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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const { user, updateProfile, signOut, isLoading } = useAuthStore();
  const { themeIndex, setTheme, darkMode, toggleDarkMode } = useThemeStore();
  const { languageCode, setLanguage } = useLanguageStore();
  const C = useColors();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.profile.display_name ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!user?.profile.push_token);
  const [modalContent, setModalContent] = useState<null | 'about' | 'privacy' | 'terms'>(null);

  const [uploading, setUploading] = useState(false);
  const avatarUrl = user?.profile?.avatar_url;

  const pickAndUploadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user!.id}/avatar.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
      Toast.show({ type: 'success', text1: 'Profielfoto bijgewerkt!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Upload mislukt' });
    } finally {
      setUploading(false);
    }
  };

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

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: C.bg },
    section: { backgroundColor: C.bgCard, borderRadius: Radii.lg, overflow: 'hidden' as const, ...Shadows.sm },
    sectionTitle: {
      fontSize: Typography.xs, fontWeight: Typography.semibold, color: C.textTertiary,
      textTransform: 'uppercase' as const, letterSpacing: 1, paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    settingRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    settingLabel: { fontSize: Typography.base, color: C.text, fontWeight: Typography.medium },
    settingHint: { fontSize: Typography.xs, color: C.textTertiary, marginTop: 2 },
    displayName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text },
    username: { fontSize: Typography.base, color: C.textSecondary },
    email: { fontSize: Typography.sm, color: C.textTertiary },
    version: { textAlign: 'center' as const, fontSize: Typography.sm, color: C.textTertiary },
    modalBackdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' as const },
    modalContent: {
      backgroundColor: C.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl,
      padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '80%' as const,
    },
    modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text, marginBottom: Spacing.base },
    modalText: { fontSize: Typography.sm, color: C.text, lineHeight: 22 },
  };

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.content}>

      {/* Avatar + name */}
      <View style={styles.avatarSection}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primary }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 78, height: 78, borderRadius: 39 }} resizeMode="cover" />
            ) : (
              <Avatar userId={user.id} displayName={user.profile.display_name} size={80} />
            )}
            {uploading && (
              <View style={{ position: 'absolute', width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
              </View>
            )}
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg }}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </TouchableOpacity>
        {editing ? (
          <TextInput
            style={[styles.nameInput, { borderBottomColor: C.primary, color: C.text }]}
            value={displayName}
            onChangeText={setDisplayName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        ) : (
          <Text style={dynamicStyles.displayName}>{user.profile.display_name}</Text>
        )}
        <Text style={dynamicStyles.username}>@{user.profile.username}</Text>
        <Text style={dynamicStyles.email}>{user.email}</Text>
      </View>

      {/* Edit actions */}
      <View style={styles.editActions}>
        {editing ? (
          <>
            <Button label="Save" onPress={handleSave} loading={isLoading} style={styles.halfBtn} />
            <Button label="Cancel" onPress={() => { setEditing(false); setDisplayName(user.profile.display_name); }} variant="secondary" style={styles.halfBtn} />
          </>
        ) : (
          <Button label="Edit Name" onPress={() => setEditing(true)} variant="secondary" icon={<Ionicons name="pencil-outline" size={16} color={C.text} />} />
        )}
      </View>

      {/* Appearance */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Appearance</Text>

        {/* Dark mode toggle */}
        <View style={dynamicStyles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={darkMode ? 'moon' : 'sunny-outline'} size={20} color={C.text} />
            <View>
              <Text style={dynamicStyles.settingLabel}>Dark Mode</Text>
              <Text style={dynamicStyles.settingHint}>{darkMode ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
            </View>
          </View>
          <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ true: C.primary, false: C.border }} thumbColor="#FFFFFF" />
        </View>

        {/* Theme kleuren */}
        <View style={[dynamicStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
          <Text style={dynamicStyles.settingLabel}>Color Theme</Text>
          <View style={styles.themeRow}>
            {THEMES.map((theme, index) => (
              <TouchableOpacity
                key={theme.name}
                onPress={() => setTheme(index)}
                style={[styles.themeCircle, { backgroundColor: theme.primary }, themeIndex === index && styles.themeCircleActive]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Language */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Language / Taal</Text>
        <View style={[dynamicStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
          <View style={styles.themeRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[styles.langBtn, languageCode === lang.code && { backgroundColor: C.primary, borderColor: C.primary }]}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, languageCode === lang.code && { color: '#FFFFFF' }]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Notifications</Text>
        <View style={dynamicStyles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={C.text} />
            <View>
              <Text style={dynamicStyles.settingLabel}>Push Notifications</Text>
              <Text style={dynamicStyles.settingHint}>Get notified when items are added</Text>
            </View>
          </View>
          <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ true: C.primary, false: C.border }} thumbColor="#FFFFFF" />
        </View>
      </View>

      {/* App info */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>App</Text>
        <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setModalContent('about')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={20} color={C.text} />
            <Text style={dynamicStyles.settingLabel}>About Shoply</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setModalContent('privacy')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color={C.text} />
            <Text style={dynamicStyles.settingLabel}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setModalContent('terms')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <Ionicons name="document-text-outline" size={20} color={C.text} />
            <Text style={dynamicStyles.settingLabel}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={dynamicStyles.version}>Shoply v1.0.0</Text>
      <Button label="Sign Out" onPress={handleSignOut} variant="danger" style={styles.signOutBtn} />

      {/* Info Modal */}
      <Modal visible={!!modalContent} transparent animationType="slide" onRequestClose={() => setModalContent(null)}>
        <View style={dynamicStyles.modalBackdrop}>
          <View style={dynamicStyles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={dynamicStyles.modalTitle}>
              {modalContent ? MODAL_CONTENT[modalContent].title : ''}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={dynamicStyles.modalText}>
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

const styles = StyleSheet.create({
  content: { padding: Spacing.base, paddingBottom: 48, gap: Spacing.xl },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  nameInput: {
    fontSize: Typography.xl, fontWeight: Typography.bold,
    borderBottomWidth: 2, textAlign: 'center', minWidth: 200, paddingVertical: 4,
  },
  editActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  halfBtn: { flex: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  themeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', paddingBottom: 4 },
  themeCircle: { width: 36, height: 36, borderRadius: 18 },
  themeCircleActive: { borderWidth: 3, borderColor: '#0F172A' },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  signOutBtn: { marginTop: Spacing.sm },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.md },
  modalScroll: { marginBottom: Spacing.base },
  modalCloseBtn: { marginTop: Spacing.sm },
});