// app/(app)/group/[id]/index.tsx
// The main shopping list view — real-time, swipeable items, offline-aware

import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useItems, useAddItem, useToggleItem, useDeleteItem, useEditItem } from '../../../../src/hooks/useItems';
import { useGroups } from '../../../../src/hooks/useGroups';
import { useAuthStore } from '../../../../src/store/authStore';
import { useNetworkStore } from '../../../../src/store/networkStore';
import { Avatar, Button, EmptyState, ErrorState, LoadingScreen } from '../../../../src/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import type { Item } from '../../../../src/types';
import { formatDistanceToNow } from 'date-fns';

// ─── Item form schema ─────────────────────────────────────
const itemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  quantity: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
type ItemForm = z.infer<typeof itemSchema>;

export default function GroupDetailScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user)!;
  const isOnline = useNetworkStore((s) => s.isOnline);

  const { data: groups } = useGroups();
  const group = groups?.find((g) => g.id === groupId);

  const { data: items, isLoading, isError, refetch } = useItems(groupId!);
  const addItem = useAddItem(groupId!);
  const toggleItem = useToggleItem(groupId!);
  const deleteItem = useDeleteItem(groupId!);
  const editItem = useEditItem(groupId!);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Set header title and actions
  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name ?? 'Shopping List',
      headerRight: () => (
        <View style={styles.headerActions}>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push(`/(app)/group/${groupId}/activity`)}
            style={styles.headerBtn}
          >
            <Ionicons name="time-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/group/${groupId}/members`)}
            style={styles.headerBtn}
          >
            <Ionicons name="people-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, group?.name, groupId, isOnline]);

  // ─── Add item form ─────────────────────────────────────
  const addForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  const handleAddItem = async (data: ItemForm) => {
    try {
      await addItem.mutateAsync(data);
      setShowAddItem(false);
      addForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add item';
      if (msg === 'OFFLINE') {
        Toast.show({ type: 'info', text1: 'You\'re offline', text2: 'Item will sync when back online' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to add item' });
      }
    }
  };

  // ─── Edit item form ────────────────────────────────────
  const editForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  const openEdit = (item: Item) => {
    setEditingItem(item);
    editForm.reset({
      name: item.name,
      quantity: item.quantity ?? '',
      notes: item.notes ?? '',
    });
  };

  const handleEditItem = async (data: ItemForm) => {
    if (!editingItem) return;
    try {
      await editItem.mutateAsync({
        itemId: editingItem.id,
        updates: { ...data, version: editingItem.version },
      });
      setEditingItem(null);
      Toast.show({ type: 'success', text1: 'Item updated' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CONFLICT') {
        Toast.show({
          type: 'error',
          text1: 'Edit conflict',
          text2: 'Someone else edited this item — refreshing',
        });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to update item' });
      }
      setEditingItem(null);
    }
  };

  const handleDelete = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.id),
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my shopping list "${group.name}" on Shoply!\nInvite code: ${group.invite_code}\n\nDownload Shoply: https://shoply.app`,
        title: `Join ${group.name} on Shoply`,
      });
    } catch {}
  };

  // ─── Separate active and completed items ─────────────
  const activeItems = items?.filter((i) => i.status === 'active') ?? [];
  const completedItems = items?.filter((i) => i.status === 'completed') ?? [];

  if (isLoading) return <LoadingScreen message="Loading list..." />;
  if (isError) return <ErrorState message="Failed to load items" onRetry={refetch} />;

  return (
    <View style={styles.container}>
      {/* Share banner */}
      {group && (
        <TouchableOpacity style={styles.shareBanner} onPress={handleShare}>
          <View style={styles.shareLeft}>
            <Ionicons name="link-outline" size={16} color={Colors.primary} />
            <Text style={styles.shareCode}>{group.invite_code}</Text>
          </View>
          <Text style={styles.shareHint}>Tap to invite friends</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={[
          ...activeItems,
          ...(completedItems.length > 0 ? [{ id: '__divider__', name: '' } as Item] : []),
          ...completedItems,
        ]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="List is empty"
            subtitle="Add items to start your shopping list."
            action={{ label: 'Add First Item', onPress: () => setShowAddItem(true) }}
          />
        }
        renderItem={({ item }) => {
          if (item.id === '__divider__') {
            return (
              <View style={styles.sectionDivider}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionLabel}>Completed ({completedItems.length})</Text>
                <View style={styles.sectionLine} />
              </View>
            );
          }
          return (
            <ItemRow
              item={item}
              currentUserId={user.id}
              onToggle={() => toggleItem.mutate(item)}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB — Add Item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddItem(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <ItemFormModal
        visible={showAddItem}
        title="Add Item"
        submitLabel="Add to List"
        form={addForm}
        onSubmit={handleAddItem}
        onClose={() => { setShowAddItem(false); addForm.reset(); }}
        isLoading={addItem.isPending}
      />

      {/* Edit Item Modal */}
      <ItemFormModal
        visible={!!editingItem}
        title="Edit Item"
        submitLabel="Save Changes"
        form={editForm}
        onSubmit={handleEditItem}
        onClose={() => setEditingItem(null)}
        isLoading={editItem.isPending}
      />
    </View>
  );
}

// ─── Item row with swipe-to-delete ──────────────────────
function ItemRow({
  item,
  currentUserId,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: Item;
  currentUserId: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCompleted = item.status === 'completed';
  const addedByName = item.added_by_profile?.display_name ?? 'Unknown';
  const isMyItem = item.added_by === currentUserId;

  return (
    <View style={[styles.itemRow, isCompleted && styles.itemRowCompleted]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {isCompleted && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, isCompleted && styles.itemNameCompleted]}>
          {item.name}
        </Text>
        <View style={styles.itemMeta}>
          {item.quantity && (
            <Text style={styles.itemQuantity}>📦 {item.quantity}</Text>
          )}
          <View style={styles.itemAuthor}>
            <Avatar
              userId={item.added_by}
              displayName={addedByName}
              size={16}
            />
            <Text style={styles.itemMetaText}>
              {isMyItem ? 'You' : addedByName}
              {' · '}
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        {item.notes && (
          <Text style={styles.itemNotes}>{item.notes}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.itemActionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemActionBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Item form modal (shared for add + edit) ─────────────
function ItemFormModal({
  visible,
  title,
  submitLabel,
  form,
  onSubmit,
  onClose,
  isLoading,
}: {
  visible: boolean;
  title: string;
  submitLabel: string;
  form: ReturnType<typeof useForm<ItemForm>>;
  onSubmit: (data: ItemForm) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Item Name *</Text>
            <Controller
              control={form.control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, form.formState.errors.name && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Whole milk"
                  placeholderTextColor={Colors.textTertiary}
                  autoFocus
                  returnKeyType="next"
                />
              )}
            />
            {form.formState.errors.name && (
              <Text style={styles.errorText}>{form.formState.errors.name.message}</Text>
            )}
          </View>

          {/* Quantity */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Quantity (optional)</Text>
            <Controller
              control={form.control}
              name="quantity"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. 2L, 3 packs, 500g"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />
              )}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <Controller
              control={form.control}
              name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Brand preference, aisle, etc."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          <Button
            label={submitLabel}
            onPress={form.handleSubmit(onSubmit)}
            loading={isLoading}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  headerBtn: { padding: 8 },
  offlineBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offlineBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.warning,
  },

  // Share banner
  shareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '40',
  },
  shareLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shareCode: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  shareHint: { fontSize: Typography.xs, color: Colors.primary },

  // List
  list: { padding: Spacing.base, paddingBottom: 100, flexGrow: 1 },
  separator: { height: Spacing.sm },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  itemRowCompleted: { opacity: 0.7 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  itemContent: { flex: 1, gap: 4 },
  itemName: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text,
    lineHeight: 22,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  itemQuantity: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  itemAuthor: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemMetaText: { fontSize: Typography.xs, color: Colors.textTertiary },
  itemNotes: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemActions: { flexDirection: 'row', gap: 4 },
  itemActionBtn: { padding: 6, borderRadius: Radii.sm },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.base,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  field: { gap: Spacing.xs },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
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
  notesInput: { height: 80, textAlignVertical: 'top', paddingTop: 13 },
  errorText: { fontSize: Typography.xs, color: Colors.danger },
});
