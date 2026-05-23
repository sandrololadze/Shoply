// app/(app)/group/[id]/index.tsx
import React, { useState } from 'react';
import {
  Alert, FlatList, Linking, Modal,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
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
import { useLanguageStore } from '../../../../src/store/languageStore';
import { useProductSearch } from '../../../../src/hooks/useProductSearch';
import { BarcodeScanner } from '../../../../src/components/BarcodeScanner';
import { Avatar, Button, EmptyState, ErrorState, LoadingScreen } from '../../../../src/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import { detectCategory } from '../../../../src/lib/categories';
import type { Item } from '../../../../src/types';
import { formatDistanceToNow } from 'date-fns';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  quantity: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  url: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
});
type ItemForm = z.infer<typeof itemSchema>;

export default function GroupDetailScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user)!;
  const isOnline = useNetworkStore((s) => s.isOnline);
  const { t } = useLanguageStore();

  const { data: groups } = useGroups();
  const group = groups?.find((g) => g.id === groupId);

  const { data: items, isLoading, isError, refetch } = useItems(groupId!);
  const addItem = useAddItem(groupId!);
  const toggleItem = useToggleItem(groupId!);
  const deleteItem = useDeleteItem(groupId!);
  const editItem = useEditItem(groupId!);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { results, isSearching, search, clear } = useProductSearch(groupId!);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name ?? 'Shopping List',
      headerRight: () => (
        <View style={styles.headerActions}>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>{t('offline')}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.push(`/(app)/group/${groupId}/activity`)} style={styles.headerBtn}>
            <Ionicons name="time-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/(app)/group/${groupId}/members`)} style={styles.headerBtn}>
            <Ionicons name="people-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, group?.name, groupId, isOnline, t]);

  const addForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  const handleAddItem = async (data: ItemForm) => {
    try {
      await addItem.mutateAsync({
        name: data.name,
        quantity: data.quantity,
        notes: data.notes,
        url: data.url || undefined,
      });
      setShowAddItem(false);
      addForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add item';
      if (msg === 'OFFLINE') {
        Toast.show({ type: 'info', text1: "You're offline", text2: 'Item will sync when back online' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to add item' });
      }
    }
  };

  const editForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  const openEdit = (item: Item) => {
    setEditingItem(item);
    editForm.reset({
      name: item.name,
      quantity: item.quantity ?? '',
      notes: item.notes ?? '',
      url: item.url ?? '',
    });
  };

  const handleEditItem = async (data: ItemForm) => {
    if (!editingItem) return;
    try {
      await editItem.mutateAsync({
        itemId: editingItem.id,
        updates: { ...data, url: data.url || undefined, version: editingItem.version },
      });
      setEditingItem(null);
      Toast.show({ type: 'success', text1: 'Item updated' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CONFLICT') {
        Toast.show({ type: 'error', text1: 'Edit conflict', text2: 'Someone else edited this item' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to update item' });
      }
      setEditingItem(null);
    }
  };

  const handleDelete = (item: Item) => {
    Alert.alert(
      t('deleteItem'),
      `"${item.name}" ${t('deleteConfirm')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteItem.mutate(item.id, {
              onSuccess: () => Toast.show({ type: 'success', text1: 'Item deleted' }),
              onError: () => Toast.show({ type: 'error', text1: 'Failed to delete item' }),
            });
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    const { Share } = require('react-native');
    if (!group) return;
    try {
      await Share.share({
        message: `Join my shopping list "${group.name}" on Shoply!\nInvite code: ${group.invite_code}`,
        title: `Join ${group.name} on Shoply`,
      });
    } catch {}
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        addForm.setValue('name', data.product.product_name ?? barcode);
        addForm.setValue('quantity', data.product.quantity ?? '');
      } else {
        addForm.setValue('name', barcode);
      }
      setShowAddItem(true);
    } catch {
      addForm.setValue('name', barcode);
      setShowAddItem(true);
    }
  };

  const activeItems = items?.filter((i) => i.status === 'active') ?? [];
  const completedItems = items?.filter((i) => i.status === 'completed') ?? [];

  const itemLabels = {
    productUrl: t('productUrl'),
    urlPlaceholder: t('urlPlaceholder'),
    autoFillHint: t('autoFillHint'),
    itemName: t('itemName'),
    itemNamePlaceholder: t('itemNamePlaceholder'),
    quantityPrice: t('quantityPrice'),
    quantityPlaceholder: t('quantityPlaceholder'),
    notes: t('notes'),
    notesPlaceholder: t('notesPlaceholder'),
  };

  if (isLoading) return <LoadingScreen message={t('loadingLists')} />;
  if (isError) return <ErrorState message="Failed to load items" onRetry={refetch} />;

  return (
    <View style={styles.container}>
      {group && (
        <TouchableOpacity style={styles.shareBanner} onPress={handleShare}>
          <View style={styles.shareLeft}>
            <Ionicons name="link-outline" size={16} color={Colors.primary} />
            <Text style={styles.shareCode}>{group.invite_code}</Text>
          </View>
          <Text style={styles.shareHint}>{t('tapToInvite')}</Text>
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
            title={t('listEmpty')}
            subtitle={t('listEmptySubtitle')}
            action={{ label: t('addFirstItem'), onPress: () => setShowAddItem(true) }}
          />
        }
        renderItem={({ item }) => {
          if (item.id === '__divider__') {
            return (
              <View style={styles.sectionDivider}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionLabel}>{t('completed')} ({completedItems.length})</Text>
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
              youLabel={t('you')}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowScanner(true)} activeOpacity={0.85}>
          <Ionicons name="barcode-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddItem(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <BarcodeScanner
        visible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />

      <ItemFormModal
        visible={showAddItem}
        title={t('addItem')}
        submitLabel={t('addToList')}
        form={addForm}
        onSubmit={handleAddItem}
        onClose={() => { setShowAddItem(false); addForm.reset(); }}
        isLoading={addItem.isPending}
        labels={itemLabels}
        suggestions={results}
        isSearching={isSearching}
        onSearch={search}
        onClearSearch={clear}
      />

      <ItemFormModal
        visible={!!editingItem}
        title={t('editItem')}
        submitLabel={t('saveChanges')}
        form={editForm}
        onSubmit={handleEditItem}
        onClose={() => setEditingItem(null)}
        isLoading={editItem.isPending}
        labels={itemLabels}
        suggestions={[]}
        isSearching={false}
        onSearch={() => {}}
        onClearSearch={() => {}}
      />
    </View>
  );
}

function ItemRow({ item, currentUserId, onToggle, onEdit, onDelete, youLabel }: {
  item: Item; currentUserId: string; youLabel: string;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const isCompleted = item.status === 'completed';
  const addedByName = item.added_by_profile?.display_name ?? 'Unknown';
  const isMyItem = item.added_by === currentUserId;
  const category = detectCategory(item.name);

  return (
    <View style={[styles.itemRow, isCompleted && styles.itemRowCompleted, { borderLeftWidth: 4, borderLeftColor: isCompleted ? Colors.border : category.color }]}>
      <View style={[styles.categoryIcon, { backgroundColor: isCompleted ? Colors.bgElevated : category.surface }]}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkbox, isCompleted && styles.checkboxChecked, !isCompleted && { borderColor: category.color }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </TouchableOpacity>
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, isCompleted && styles.itemNameCompleted]}>{item.name}</Text>
        <View style={styles.itemMeta}>
          {item.quantity && (
            <Text style={styles.itemQuantity}>📦 {item.quantity}</Text>
          )}
          <View style={styles.itemAuthor}>
            <Avatar userId={item.added_by} displayName={addedByName} size={16} />
            <Text style={styles.itemMetaText}>
              {isMyItem ? youLabel : addedByName}{' · '}
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
        {item.url && (
          <TouchableOpacity style={styles.urlChip} onPress={() => Linking.openURL(item.url!)} activeOpacity={0.7}>
            <Ionicons name="open-outline" size={12} color={Colors.primary} />
            <Text style={styles.urlChipText} numberOfLines={1}>
              {item.url.replace(/^https?:\/\/(www\.)?/, '')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.itemActionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemActionBtn} onPress={onDelete} activeOpacity={0.6}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ItemFormModal({ visible, title, submitLabel, form, onSubmit, onClose, isLoading, labels, suggestions, isSearching, onSearch, onClearSearch }: {
  visible: boolean; title: string; submitLabel: string;
  form: ReturnType<typeof useForm<ItemForm>>;
  onSubmit: (data: ItemForm) => void;
  onClose: () => void; isLoading: boolean;
  labels: Record<string, string>;
  suggestions: { name: string; quantity?: string; source: string }[];
  isSearching: boolean;
  onSearch: (q: string) => void;
  onClearSearch: () => void;
}) {
  const t = (key: string) => labels[key] ?? key;
  const [fetching, setFetching] = useState(false);

  const fetchProduct = async () => {
    const url = form.getValues('url');
    if (!url) { Toast.show({ type: 'error', text1: 'Enter a URL first' }); return; }
    setFetching(true);
    try {
      const res = await fetch('https://shoply-steel.vercel.app/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.name) form.setValue('name', data.name);
      if (data.price) form.setValue('quantity', `€${data.price}`);
      Toast.show({ type: 'success', text1: 'Product info fetched!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not fetch product info' });
    } finally {
      setFetching(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('productUrl')}</Text>
            <View style={styles.urlRow}>
              <Controller
                control={form.control}
                name="url"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, styles.urlInput, form.formState.errors.url && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('urlPlaceholder')}
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="done"
                  />
                )}
              />
              <TouchableOpacity style={styles.fetchBtn} onPress={fetchProduct} disabled={fetching}>
                {fetching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHint}>{t('autoFillHint')}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('itemName')} *</Text>
            <Controller
              control={form.control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, form.formState.errors.name && styles.inputError]}
                  value={value}
                  onChangeText={(text) => { onChange(text); onSearch(text); }}
                  onBlur={onBlur}
                  placeholder={t('itemNamePlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />
              )}
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionItem}
                    onPress={() => {
                      form.setValue('name', s.name);
                      if (s.quantity) form.setValue('quantity', s.quantity);
                      onClearSearch();
                    }}
                  >
                    <Text style={styles.suggestionSource}>{s.source === 'history' ? '🕐' : '🌍'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      {s.quantity && <Text style={styles.suggestionQty}>{s.quantity}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('quantityPrice')}</Text>
            <Controller
              control={form.control}
              name="quantity"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t('quantityPlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('notes')}</Text>
            <Controller
              control={form.control}
              name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t('notesPlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          <Button label={submitLabel} onPress={form.handleSubmit(onSubmit)} loading={isLoading} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  headerBtn: { padding: 8 },
  offlineBadge: { backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  offlineBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.warning },
  shareBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface, marginHorizontal: Spacing.base,
    marginTop: Spacing.base, borderRadius: Radii.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.primaryLight + '40',
  },
  shareLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shareCode: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 2 },
  shareHint: { fontSize: Typography.xs, color: Colors.primary },
  list: { padding: Spacing.base, paddingBottom: 100, flexGrow: 1 },
  separator: { height: Spacing.sm },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.md },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm,
    overflow: 'hidden',
  },
  itemRowCompleted: { opacity: 0.6 },
  categoryIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  itemContent: { flex: 1, gap: 4 },
  itemName: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.text, lineHeight: 22 },
  itemNameCompleted: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  itemQuantity: { fontSize: Typography.xs, color: Colors.textSecondary, backgroundColor: Colors.bgElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  itemAuthor: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemMetaText: { fontSize: Typography.xs, color: Colors.textTertiary },
  itemNotes: { fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  urlChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySurface, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2,
  },
  urlChipText: { fontSize: Typography.xs, color: Colors.primary, maxWidth: 200 },
  itemActions: { flexDirection: 'row', gap: 4 },
  itemActionBtn: { padding: 8, borderRadius: Radii.sm },
  fabContainer: { position: 'absolute', bottom: 24, right: 24, gap: 12, alignItems: 'center' },
  fabSecondary: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary, ...Shadows.md,
  },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.lg,
  },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.base,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  fieldHint: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  urlRow: { flexDirection: 'row', gap: Spacing.sm },
  urlInput: { flex: 1 },
  fetchBtn: {
    backgroundColor: Colors.primary, borderRadius: Radii.md,
    paddingHorizontal: Spacing.base, alignItems: 'center', justifyContent: 'center', minWidth: 44,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.bg,
  },
  inputError: { borderColor: Colors.danger },
  notesInput: { height: 80, textAlignVertical: 'top', paddingTop: 13 },
  errorText: { fontSize: Typography.xs, color: Colors.danger },
  suggestions: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestionSource: { fontSize: 16 },
  suggestionName: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
  suggestionQty: { fontSize: Typography.xs, color: Colors.textTertiary },
});