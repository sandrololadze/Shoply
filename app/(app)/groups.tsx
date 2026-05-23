// app/(app)/groups.tsx
import React, { useState } from 'react';
import {
  FlatList, Modal, RefreshControl,
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
import { useColors, Radii, Shadows, Spacing, Typography } from '../../src/lib/design';
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
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {isGuest && (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: C.primarySurface, margin: Spacing.base, marginBottom: 0, padding: Spacing.base, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: C.primaryLight + '40' }}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color={C.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.primary }}>{t('guestTitle')}</Text>
            <Text style={{ fontSize: Typography.xs, color: C.primary, opacity: 0.8 }}>{t('guestSub')}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, paddingTop: Spacing.md }}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radii.md, paddingVertical: Spacing.md, borderWidth: 1.5, backgroundColor: C.primarySurface, borderColor: C.primaryLight + '40' }}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add-circle" size={20} color={C.primary} />
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.primary }}>{t('newList')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radii.md, paddingVertical: Spacing.md, borderWidth: 1.5, backgroundColor: C.primarySurface, borderColor: C.primaryLight + '40' }}
          onPress={() => setShowJoin(true)}
        >
          <Ionicons name="enter-outline" size={20} color={C.primary} />
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.primary }}>{t('joinList')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.base, paddingTop: 0, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={C.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title={t('noLists')}
            subtitle={t('noListsSubtitle')}
            action={{ label: t('createFirstList'), onPress: () => setShowCreate(true) }}
          />
        }
        renderItem={({ item }) => (
          <GroupCard group={item} C={C} onPress={() => router.push(`/(app)/group/${item.id}/`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />

      <FormModal visible={showCreate} title={t('newShoppingList')} onClose={() => { setShowCreate(false); createForm.reset(); }} C={C}>
        <Controller
          control={createForm.control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('listName')}</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg }}
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder={t('listNamePlaceholder')} placeholderTextColor={C.textTertiary} autoFocus
              />
              {createForm.formState.errors.name && <Text style={{ fontSize: Typography.xs, color: '#EF4444' }}>{createForm.formState.errors.name.message}</Text>}
            </View>
          )}
        />
        <Controller
          control={createForm.control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('descriptionOptional')}</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg, height: 80, textAlignVertical: 'top' }}
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder={t('descriptionPlaceholder')} placeholderTextColor={C.textTertiary} multiline numberOfLines={3}
              />
            </View>
          )}
        />
        <Button label={t('createList')} onPress={createForm.handleSubmit(handleCreate)} loading={createGroup.isPending} />
      </FormModal>

      <FormModal visible={showJoin} title={t('joinAList')} onClose={() => { setShowJoin(false); joinForm.reset(); }} C={C}>
        <Text style={{ fontSize: Typography.sm, color: C.textSecondary, lineHeight: 20 }}>{t('joinHint')}</Text>
        <Controller
          control={joinForm.control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('inviteCode')}</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text, backgroundColor: C.bg, letterSpacing: 4, textAlign: 'center' }}
                value={value} onChangeText={(text) => onChange(text.toUpperCase())} onBlur={onBlur}
                placeholder="AB3F9C2D" placeholderTextColor={C.textTertiary} autoCapitalize="characters" maxLength={10} autoFocus
              />
              {joinForm.formState.errors.code && <Text style={{ fontSize: Typography.xs, color: '#EF4444' }}>{joinForm.formState.errors.code.message}</Text>}
            </View>
          )}
        />
        <Button label={t('joinList')} onPress={joinForm.handleSubmit(handleJoin)} loading={joinGroup.isPending} />
      </FormModal>
    </View>
  );
}

function GroupCard({ group, onPress, C }: { group: GroupWithMeta; onPress: () => void; C: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm }}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={{ width: 44, height: 44, borderRadius: Radii.md, backgroundColor: C.primarySurface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>🛒</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: C.text }} numberOfLines={1}>{group.name}</Text>
          {group.myRole === 'admin' && (
            <View style={{ backgroundColor: C.adminSurface, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: C.admin }}>Admin</Text>
            </View>
          )}
        </View>
        {group.description && <Text style={{ fontSize: Typography.sm, color: C.textSecondary }} numberOfLines={1}>{group.description}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{group.activeItemCount} items</Text>
          <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>·</Text>
          <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{group.memberCount} members</Text>
          <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>·</Text>
          <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
    </TouchableOpacity>
  );
}

function FormModal({ visible, title, onClose, children, C }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode; C: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={{ backgroundColor: C.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.base }} activeOpacity={1} onPress={() => {}}>
          <View style={{ width: 36, height: 4, backgroundColor: C.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.sm }} />
          <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text, marginBottom: Spacing.sm }}>{title}</Text>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}