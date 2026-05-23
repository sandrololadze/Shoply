// app/(app)/groups.tsx
import React, { useState } from 'react';
import {
  FlatList, Modal, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useGroups, useCreateGroup, useJoinGroup } from '../../src/hooks/useGroups';
import { useAuthStore } from '../../src/store/authStore';
import { useColors, Colors, Radii, Shadows, Spacing, Typography } from '../../src/lib/design';
import { useLanguageStore } from '../../src/store/languageStore';
import { Button, EmptyState, ErrorState, LoadingScreen } from '../../src/components/ui';
import type { GroupWithMeta } from '../../src/types';
import { formatDistanceToNow } from 'date-fns';

const createSchema = z.object({
  name: z.string().min(1, 'List name required').max(100),
  description: z.string().max(500).optional(),
});

const joinSchema = z.object({
  code: z.string().min(6, 'Enter the 8-character invite code').max(10),
});

type CreateForm = z.infer<typeof createSchema>;
type JoinForm = z.infer<typeof joinSchema>;

export default function GroupsScreen() {
  const C = useColors();
  const { t } = useLanguageStore();
const bgStyle = { flex: 1, backgroundColor: C.bg };
  const cardStyle = { backgroundColor: C.bgCard };
  const { data: groups, isLoading, isError, error, refetch, isFetching } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const user = useAuthStore((s) => s.user);
  const isGuest = user?.is_anonymous === true;

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<JoinForm>({ resolver: zodResolver(joinSchema) });

  const handleCreate = async (data: CreateForm) => {
    try {
      const group = await createGroup.mutateAsync(data);
      setShowCreate(false);
      createForm.reset();
      router.push(`/(app)/group/${group.id}/`);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create list' });
    }
  };

  const handleJoin = async (data: JoinForm) => {
    try {
      const groupId = await joinGroup.mutateAsync(data.code.trim().toUpperCase());
      setShowJoin(false);
      joinForm.reset();
      router.push(`/(app)/group/${groupId}/`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      Toast.show({ type: 'error', text1: 'Could not join', text2: message });
    }
  };

  if (isLoading) return <LoadingScreen message={t('loadingLists')} />;
  if (isError) return <ErrorState message={String(error)} onRetry={refetch} />;

  return (
    <View style={[styles.container, bgStyle]}>
      {isGuest && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
          <View style={styles.guestBannerText}>
            <Text style={styles.guestBannerTitle}>{t('guestTitle')}</Text>
            <Text style={styles.guestBannerSub}>{t('guestSub')}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.primarySurface, borderColor: C.primaryLight + '40' }]}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add-circle" size={20} color={C.primary} />
          <Text style={[styles.actionBtnText, { color: C.primary }]}>{t('newList')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.primarySurface, borderColor: C.primaryLight + '40' }]}
          onPress={() => setShowJoin(true)}
        >
          <Ionicons name="enter-outline" size={20} color={C.primary} />
          <Text style={[styles.actionBtnText, { color: C.primary }]}>{t('joinList')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={C.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title={t('noLists')}
            subtitle={t('noListsSubtitle')}
            action={{ label: t('createFirstList'), onPress: () => setShowCreate(true) }}
          />
        }
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={() => router.push(`/(app)/group/${item.id}/`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FormModal
        visible={showCreate}
        title={t('newShoppingList')}
        onClose={() => { setShowCreate(false); createForm.reset(); }}
      >
        <Controller
          control={createForm.control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('listName')}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('listNamePlaceholder')}
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />
              {createForm.formState.errors.name && (
                <Text style={styles.errorText}>{createForm.formState.errors.name.message}</Text>
              )}
            </View>
          )}
        />
        <Controller
          control={createForm.control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('descriptionOptional')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        />
        <Button label={t('createList')} onPress={createForm.handleSubmit(handleCreate)} loading={createGroup.isPending} />
      </FormModal>

      <FormModal
        visible={showJoin}
        title={t('joinAList')}
        onClose={() => { setShowJoin(false); joinForm.reset(); }}
      >
        <Text style={styles.joinHint}>{t('joinHint')}</Text>
        <Controller
          control={joinForm.control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('inviteCode')}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={value}
                onChangeText={(text) => onChange(text.toUpperCase())}
                onBlur={onBlur}
                placeholder="AB3F9C2D"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="characters"
                maxLength={10}
                autoFocus
              />
              {joinForm.formState.errors.code && (
                <Text style={styles.errorText}>{joinForm.formState.errors.code.message}</Text>
              )}
            </View>
          )}
        />
        <Button label={t('joinList')} onPress={joinForm.handleSubmit(handleJoin)} loading={joinGroup.isPending} />
      </FormModal>
    </View>
  );
}

function GroupCard({ group, onPress }: { group: GroupWithMeta; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>🛒</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{group.name}</Text>
          {group.myRole === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        {group.description && (
          <Text style={styles.cardDescription} numberOfLines={1}>{group.description}</Text>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{group.activeItemCount} {group.activeItemCount === 1 ? 'item' : 'items'}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

function FormModal({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primarySurface, margin: Spacing.base,
    marginBottom: 0, padding: Spacing.base, borderRadius: Radii.lg,
    borderWidth: 1.5, borderColor: Colors.primaryLight + '40',
  },
  guestBannerText: { flex: 1 },
  guestBannerTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },
  guestBannerSub: { fontSize: Typography.xs, color: Colors.primary, opacity: 0.8 },
  actions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, paddingTop: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radii.md, paddingVertical: Spacing.md, borderWidth: 1.5,
  },
  actionBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  list: { padding: Spacing.base, paddingTop: 0, flexGrow: 1 },
  separator: { height: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm,
  },
  cardLeft: {},
  cardIcon: {
    width: 44, height: 44, borderRadius: Radii.md,
    backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { fontSize: 22 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardName: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  adminBadge: { backgroundColor: Colors.adminSurface, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  adminBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.admin },
  cardDescription: { fontSize: Typography.sm, color: Colors.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: Typography.xs, color: Colors.textTertiary },
  cardMetaDot: { fontSize: Typography.xs, color: Colors.textTertiary },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.base,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.bg,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 13 },
  codeInput: { letterSpacing: 4, fontSize: Typography.xl, fontWeight: Typography.bold, textAlign: 'center' },
  errorText: { fontSize: Typography.xs, color: Colors.danger },
  joinHint: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});