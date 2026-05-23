// src/hooks/useProductSearch.ts
import { useState, useCallback } from 'react';
import { useItems } from './useItems';

export interface ProductSuggestion {
  name: string;
  quantity?: string;
  source: 'history' | 'openfoodfacts';
  image?: string;
}

export function useProductSearch(groupId: string) {
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { data: items } = useItems(groupId);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // 1. Zoek in geschiedenis
    const historyResults: ProductSuggestion[] = (items ?? [])
      .filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .map((item) => ({
        name: item.name,
        quantity: item.quantity ?? undefined,
        source: 'history' as const,
      }))
      .filter((item, index, self) =>
        index === self.findIndex((t) => t.name === item.name)
      )
      .slice(0, 3);

    // 2. Zoek in Open Food Facts
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,quantity,image_small_url`
      );
      const data = await res.json();
      const foodResults: ProductSuggestion[] = (data.products ?? [])
        .filter((p: any) => p.product_name)
        .map((p: any) => ({
          name: p.product_name,
          quantity: p.quantity ?? undefined,
          source: 'openfoodfacts' as const,
          image: p.image_small_url ?? undefined,
        }))
        .slice(0, 5);

      setResults([...historyResults, ...foodResults]);
    } catch {
      setResults(historyResults);
    } finally {
      setIsSearching(false);
    }
  }, [items]);

  const clear = useCallback(() => setResults([]), []);

  return { results, isSearching, search, clear };
}