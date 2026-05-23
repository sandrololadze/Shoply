// app/(app)/group/[id]/store.tsx
import React, { useState } from 'react';
import {
  FlatList, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAddItem } from '../../../../src/hooks/useItems';
import { useColors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import { STORES, type Store, type StoreProduct } from '../../../../src/lib/storeProducts';
import { CATEGORIES } from '../../../../src/lib/categories';

export default function StoreScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const C = useColors();
  const addItem = useAddItem(groupId!);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAdd = async (product: StoreProduct) => {
    try {
      await addItem.mutateAsync({
        name: product.name,
        quantity: product.unit ?? null,
        price: product.price ?? null,
      });
      setAdded((prev) => new Set(prev).add(product.name));
      Toast.show({ type: 'success', text1: `${product.name} toegevoegd!` });
    } catch {
      Toast.show({ type: 'error', text1: 'Kon niet toevoegen' });
    }
  };

  const filteredProducts = selectedStore?.products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }) ?? [];

  const availableCategories = selectedStore
    ? ['all', ...new Set(selectedStore.products.map((p) => p.category))]
    : [];

  const getCategoryLabel = (id: string) => {
    if (id === 'all') return '🛒 Alles';
    return CATEGORIES.find((c) => c.id === id)?.emoji + ' ' + CATEGORIES.find((c) => c.id === id)?.label ?? id;
  };

  if (!selectedStore) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ padding: Spacing.base, paddingTop: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl }}
          >
            <Ionicons name="arrow-back" size={22} color={C.primary} />
            <Text style={{ fontSize: Typography.base, color: C.primary, fontWeight: Typography.semibold }}>Terug</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text, marginBottom: Spacing.sm }}>
            🏪 Kies een winkel
          </Text>
          <Text style={{ fontSize: Typography.sm, color: C.textSecondary, marginBottom: Spacing.xl }}>
            Selecteer een winkel om producten toe te voegen aan je lijst
          </Text>
        </View>
        <FlatList
          data={STORES}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: Spacing.base, gap: Spacing.sm }}
          renderItem={({ item: store }) => (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm, borderLeftWidth: 4, borderLeftColor: store.color }}
              onPress={() => setSelectedStore(store)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 32 }}>{store.logo}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.md, fontWeight: Typography.bold, color: C.text }}>{store.name}</Text>
                <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{store.products.length} producten beschikbaar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.bgCard, padding: Spacing.base, paddingTop: Spacing.xl, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity
          onPress={() => { setSelectedStore(null); setSelectedCategory('all'); setSearch(''); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}
        >
          <Ionicons name="arrow-back" size={22} color={C.primary} />
          <Text style={{ fontSize: Typography.base, color: C.primary, fontWeight: Typography.semibold }}>Alle winkels</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
          <Text style={{ fontSize: 28 }}>{selectedStore.logo}</Text>
          <View>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: C.text }}>{selectedStore.name}</Text>
            <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>{filteredProducts.length} producten</Text>
          </View>
        </View>

        {/* Zoekbalk */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: Radii.md, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          <Ionicons name="search-outline" size={18} color={C.textTertiary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: Spacing.sm, fontSize: Typography.base, color: C.text }}
            value={search}
            onChangeText={setSearch}
            placeholder="Zoek product..."
            placeholderTextColor={C.textTertiary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categorieën */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {availableCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{ paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: selectedCategory === cat ? C.primary : C.bgElevated }}
              >
                <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: selectedCategory === cat ? '#FFFFFF' : C.textSecondary }}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Productenlijst */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(p) => p.name}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>🔍</Text>
            <Text style={{ fontSize: Typography.base, color: C.textTertiary }}>Geen producten gevonden</Text>
          </View>
        }
        renderItem={({ item: product }) => {
          const isAdded = added.has(product.name);
          const category = CATEGORIES.find((c) => c.id === product.category);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm, borderLeftWidth: 3, borderLeftColor: category?.color ?? C.border }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: category?.surface ?? C.bgElevated }}>
                <Text style={{ fontSize: 20 }}>{category?.emoji ?? '🛒'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.medium, color: C.text }}>{product.name}</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: 2 }}>
                  {product.unit && (
                    <Text style={{ fontSize: Typography.xs, color: C.textTertiary }}>📦 {product.unit}</Text>
                  )}
                  {product.price && (
                    <Text style={{ fontSize: Typography.xs, color: C.success, fontWeight: Typography.semibold }}>€{product.price.toFixed(2)}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => !isAdded && handleAdd(product)}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isAdded ? C.successLight : C.primary }}
                activeOpacity={isAdded ? 1 : 0.7}
              >
                <Ionicons name={isAdded ? 'checkmark' : 'add'} size={20} color={isAdded ? C.success : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}