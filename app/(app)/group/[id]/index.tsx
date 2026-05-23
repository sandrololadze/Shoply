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
import { useColors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import { detectCategory } from '../../../../src/lib/categories';
import type { Item } from '../../../../src/types';
import { formatDistanceToNow } from 'date-fns';

// Extracts a numeric price from strings like "€2.50", "2,99", "3x €1.20", "€1.50 x2"
function parsePrice(quantity?: string | null): number {
  if (!quantity) return 0;
  // Handle "3x €1.20" or "€1.20 x3" patterns
  const multiMatch = quantity.match(/(\d+)\s*[xX×]\s*[€$£]?\s*(\d+[.,]\d{1,2})|[€$£]?\s*(\d+[.,]\d{1,2})\s*[xX×]\s*(\d+)/);
  if (multiMatch) {
    const count = parseFloat(multiMatch[1] || multiMatch[4]);
    const price = parseFloat((multiMatch[2] || multiMatch[3]).replace(',', '.'));
    return count * price;
  }
  // Handle plain price like "€2.50" or "2,99"
  const match = quantity.match(/[€$£]?\s*(\d+[.,]\d{1,2})/);
  if (match) return parseFloat(match[1].replace(',', '.'));
  return 0;
}

const itemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  quantity: z.string().max(50).optional(),
  price: z.string().max(20).optional(),
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
  const C = useColors();

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
      headerStyle: { backgroundColor: C.bgCard },
      headerTitleStyle: { color: C.text },
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          {!isOnline && (
            <View style={{ backgroundColor: C.warningLight, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: C.warning }}>{t('offline')}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.push(`/(app)/group/${groupId}/activity`)} style={{ padding: 8 }}>
            <Ionicons name="time-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/(app)/group/${groupId}/members`)} style={{ padding: 8 }}>
            <Ionicons name="people-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, group?.name, groupId, isOnline, t, C]);

  const addForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });
  const editForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  const handleAddItem = async (data: ItemForm) => {
    try {
      await addItem.mutateAsync({ name: data.name, quantity: data.quantity, price: data.price ? parseFloat(data.price.replace(',', '.')) : null, notes: data.notes, url: data.url || undefined });
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

  const openEdit = (item: Item) => {
    setEditingItem(item);
    editForm.reset({ name: item.name, quantity: item.quantity ?? '', price: item.price != null ? String(item.price) : '', notes: item.notes ?? '', url: item.url ?? '' });
  };

  const handleEditItem = async (data: ItemForm) => {
    if (!editingItem) return;
    try {
      await editItem.mutateAsync({ itemId: editingItem.id, updates: { ...data, price: data.price ? parseFloat(data.price.replace(',', '.')) : null, url: data.url || undefined, version: editingItem.version } });
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
    Alert.alert(t('deleteItem'), `"${item.name}" ${t('deleteConfirm')}`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => {
        deleteItem.mutate(item.id, {
          onSuccess: () => Toast.show({ type: 'success', text1: 'Item deleted' }),
          onError: () => Toast.show({ type: 'error', text1: 'Failed to delete item' }),
        });
      }},
    ]);
  };

  const handleShare = async () => {
    const { Share } = require('react-native');
    if (!group) return;
    try {
      await Share.share({ message: `Join my shopping list "${group.name}" on Shoply!\nInvite code: ${group.invite_code}` });
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
    } catch {
      addForm.setValue('name', barcode);
    }
    setShowAddItem(true);
  };

  const activeItems = items?.filter((i) => i.status === 'active') ?? [];
  const completedItems = items?.filter((i) => i.status === 'completed') ?? [];

  const totalActive = activeItems.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const totalCompleted = completedItems.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const totalAll = totalActive + totalCompleted;
  const hasPrices = [...activeItems, ...completedItems].some((i) => i.price != null && i.price > 0);

  const itemLabels = {
    productUrl: t('productUrl'), urlPlaceholder: t('urlPlaceholder'), autoFillHint: t('autoFillHint'),
    itemName: t('itemName'), itemNamePlaceholder: t('itemNamePlaceholder'),
    quantityPrice: t('quantityPrice'), quantityPlaceholder: t('quantityPlaceholder'),
    notes: t('notes'), notesPlaceholder: t('notesPlaceholder'),
  };

  if (isLoading) return <LoadingScreen message={t('loadingLists')} />;
  if (isError) return <ErrorState message="Failed to load items" onRetry={refetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {group && (
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.primarySurface, marginHorizontal: Spacing.base, marginTop: Spacing.base, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: C.primaryLight + '40' }}
          onPress={handleShare}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="link-outline" size={16} color={C.primary} />
            <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: C.primary, letterSpacing: 2 }}>{group.invite_code}</Text>
          </View>
          <Text style={{ fontSize: Typography.xs, color: C.primary }}>{t('tapToInvite')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={[...activeItems, ...(completedItems.length > 0 ? [{ id: '__divider__', name: '' } as Item] : []), ...completedItems]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: 100, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState icon="📝" title={t('listEmpty')} subtitle={t('listEmptySubtitle')} action={{ label: t('addFirstItem'), onPress: () => setShowAddItem(true) }} />
        }
        renderItem={({ item }) => {
          if (item.id === '__divider__') {
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.md }}>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>{t('completed')} ({completedItems.length})</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
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
              C={C}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />

      {hasPrices && (
        <View style={{ position: 'absolute', bottom: 110, left: Spacing.base, right: 90, backgroundColor: C.bgCard, borderRadius: Radii.lg, padding: Spacing.md, ...Shadows.md, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>💰 Total</Text>
            <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: C.primary }}>€{totalAll.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.base }}>
            <View style={{ flex: 1, backgroundColor: C.bgElevated, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>Still needed</Text>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: C.warning }}>€{totalActive.toFixed(2)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.bgElevated, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>In basket</Text>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: C.success }}>€{totalCompleted.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ position: 'absolute', bottom: 24, right: 24, gap: 12, alignItems: 'center' }}>
        <TouchableOpacity
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary, ...Shadows.md }}
          onPress={() => setShowScanner(true)} activeOpacity={0.85}
        >
          <Ionicons name="barcode-outline" size={24} color={C.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.lg }}
          onPress={() => setShowAddItem(true)} activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <BarcodeScanner visible={showScanner} onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />

      <ItemFormModal
        visible={showAddItem} title={t('addItem')} submitLabel={t('addToList')}
        form={addForm} onSubmit={handleAddItem}
        onClose={() => { setShowAddItem(false); addForm.reset(); }}
        isLoading={addItem.isPending} labels={itemLabels}
        suggestions={results} isSearching={isSearching} onSearch={search} onClearSearch={clear} C={C}
      />

      <ItemFormModal
        visible={!!editingItem} title={t('editItem')} submitLabel={t('saveChanges')}
        form={editForm} onSubmit={handleEditItem}
        onClose={() => setEditingItem(null)}
        isLoading={editItem.isPending} labels={itemLabels}
        suggestions={[]} isSearching={false} onSearch={() => {}} onClearSearch={() => {}} C={C}
      />
    </View>
  );
}

function ItemRow({ item, currentUserId, onToggle, onEdit, onDelete, youLabel, C }: {
  item: Item; currentUserId: string; youLabel: string; C: ReturnType<typeof useColors>;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const isCompleted = item.status === 'completed';
  const addedByName = item.added_by_profile?.display_name ?? 'Unknown';
  const isMyItem = item.added_by === currentUserId;
  const category = detectCategory(item.name);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: isCompleted ? C.border : category.color, opacity: isCompleted ? 0.6 : 1 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isCompleted ? C.bgElevated : category.surface }}>
        <Text style={{ fontSize: 20 }}>{category.emoji}</Text>
      </View>
      <TouchableOpacity
        style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isCompleted ? C.success : category.color, alignItems: 'center', justifyContent: 'center', backgroundColor: isCompleted ? C.success : 'transparent' }}
        onPress={onToggle} activeOpacity={0.7}
      >
        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </TouchableOpacity>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: Typography.base, fontWeight: Typography.medium, color: isCompleted ? C.textTertiary : C.text, lineHeight: 22, textDecorationLine: isCompleted ? 'line-through' : 'none' }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' }}>
          {item.quantity && (
            <Text style={{ fontSize: Typography.xs, color: C.textSecondary, backgroundColor: C.bgElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full }}>📦 {item.quantity}</Text>
          )}
          {item.price != null && (
            <Text style={{ fontSize: Typography.xs, color: C.success, backgroundColor: C.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full, fontWeight: Typography.semibold }}>€{Number(item.price).toFixed(2)}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Avatar userId={item.added_by} displayName={addedByName} size={16} />
            <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>
              {isMyItem ? youLabel : addedByName}{' · '}{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        {item.notes && <Text style={{ fontSize: Typography.sm, color: C.textSecondary, fontStyle: 'italic', marginTop: 2 }}>{item.notes}</Text>}
        {item.url && (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primarySurface, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 }} onPress={() => Linking.openURL(item.url!)} activeOpacity={0.7}>
            <Ionicons name="open-outline" size={12} color={C.primary} />
            <Text style={{ fontSize: Typography.xs, color: C.primary, maxWidth: 200 }} numberOfLines={1}>{item.url.replace(/^https?:\/\/(www\.)?/, '')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <TouchableOpacity style={{ padding: 8, borderRadius: Radii.sm }} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={C.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 8, borderRadius: Radii.sm }} onPress={onDelete} activeOpacity={0.6}>
          <Ionicons name="trash-outline" size={16} color={C.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ItemFormModal({ visible, title, submitLabel, form, onSubmit, onClose, isLoading, labels, suggestions, isSearching, onSearch, onClearSearch, C }: {
  visible: boolean; title: string; submitLabel: string;
  form: ReturnType<typeof useForm<ItemForm>>;
  onSubmit: (data: ItemForm) => void;
  onClose: () => void; isLoading: boolean;
  labels: Record<string, string>;
  suggestions: { name: string; quantity?: string; source: string }[];
  isSearching: boolean;
  onSearch: (q: string) => void;
  onClearSearch: () => void;
  C: ReturnType<typeof useColors>;
}) {
  const t = (key: string) => labels[key] ?? key;
  const [fetching, setFetching] = useState(false);

  const fetchProduct = async () => {
    const url = form.getValues('url');
    if (!url) { Toast.show({ type: 'error', text1: 'Enter a URL first' }); return; }
    setFetching(true);
    try {
      const res = await fetch('https://shoply-steel.vercel.app/api/fetch-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
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
      <TouchableOpacity style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={{ backgroundColor: C.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.base }} activeOpacity={1}>
          <View style={{ width: 36, height: 4, backgroundColor: C.border, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.sm }} />
          <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text, marginBottom: Spacing.sm }}>{title}</Text>

          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('productUrl')}</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Controller control={form.control} name="url" render={({ field: { value, onChange, onBlur } }) => (
                <TextInput style={{ flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg }} value={value} onChangeText={onChange} onBlur={onBlur} placeholder={t('urlPlaceholder')} placeholderTextColor={C.textTertiary} autoCapitalize="none" keyboardType="url" />
              )} />
              <TouchableOpacity style={{ backgroundColor: C.primary, borderRadius: Radii.md, paddingHorizontal: Spacing.base, alignItems: 'center', justifyContent: 'center', minWidth: 44 }} onPress={fetchProduct} disabled={fetching}>
                {fetching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: Typography.xs, color: C.textTertiary, marginTop: 2 }}>{t('autoFillHint')}</Text>
          </View>

          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('itemName')} *</Text>
            <Controller control={form.control} name="name" render={({ field: { value, onChange, onBlur } }) => (
              <TextInput style={{ borderWidth: 1.5, borderColor: form.formState.errors.name ? C.danger : C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg }} value={value} onChangeText={(text) => { onChange(text); onSearch(text); }} onBlur={onBlur} placeholder={t('itemNamePlaceholder')} placeholderTextColor={C.textTertiary} />
            )} />
            {suggestions.length > 0 && (
              <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: Radii.md, backgroundColor: C.bgCard, overflow: 'hidden' }}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border }} onPress={() => { form.setValue('name', s.name); if (s.quantity) form.setValue('quantity', s.quantity); onClearSearch(); }}>
                    <Text style={{ fontSize: 16 }}>{s.source === 'history' ? '🕐' : '🌍'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.sm, color: C.text, fontWeight: Typography.medium }} numberOfLines={1}>{s.name}</Text>
                      {s.quantity && <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{s.quantity}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('quantityPrice')}</Text>
              <Controller control={form.control} name="quantity" render={({ field: { value, onChange, onBlur } }) => (
                <TextInput style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg }} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="2 stuks" placeholderTextColor={C.textTertiary} />
              )} />
            </View>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>Prijs (€)</Text>
              <Controller control={form.control} name="price" render={({ field: { value, onChange, onBlur } }) => (
                <TextInput style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg }} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="0.00" placeholderTextColor={C.textTertiary} keyboardType="decimal-pad" />
              )} />
            </View>
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.text }}>{t('notes')}</Text>
            <Controller control={form.control} name="notes" render={({ field: { value, onChange, onBlur } }) => (
              <TextInput style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: 13, fontSize: Typography.base, color: C.text, backgroundColor: C.bg, height: 80, textAlignVertical: 'top' }} value={value} onChangeText={onChange} onBlur={onBlur} placeholder={t('notesPlaceholder')} placeholderTextColor={C.textTertiary} multiline numberOfLines={2} />
            )} />
          </View>

          <Button label={submitLabel} onPress={form.handleSubmit(onSubmit)} loading={isLoading} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  separator: { height: Spacing.sm },
});