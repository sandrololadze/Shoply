// src/hooks/useItems.ts
// Real-time items with optimistic updates, offline queuing, conflict resolution

import { useEffect, useRef } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import type {
  CreateItemInput,
  Item,
  RealtimeItemEvent,
  UpdateItemInput,
} from '../types';

// ─── Query Keys ─────────────────────────────────────────────
export const itemKeys = {
  all: ['items'] as const,
  list: (groupId: string) => [...itemKeys.all, groupId] as const,
};

// ─── Fetch items for a group ─────────────────────────────────
export const useItems = (groupId: string) => {
  const queryClient = useQueryClient();
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch query
  const query = useQuery({
    queryKey: itemKeys.list(groupId),
    enabled: !!groupId,
    staleTime: 10_000,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          added_by_profile:profiles!items_added_by_fkey(*),
          completed_by_profile:profiles!items_completed_by_fkey(*)
        `)
        .eq('group_id', groupId)
        .neq('status', 'deleted')        // Don't show deleted items
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Real-time subscription ──────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    // Subscribe to changes on this group's items
    const channel = supabase
      .channel(`items:${groupId}`)           // Unique channel per group
      .on(
        'postgres_changes',
        {
          event: '*',                        // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'items',
          filter: `group_id=eq.${groupId}`, // Only this group
        },
        async (payload) => {
          const event = payload as unknown as RealtimeItemEvent;
          handleRealtimeEvent(queryClient, groupId, event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RT] Subscribed to items:${groupId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RT] Channel error for items:${groupId}`);
        }
      });

    realtimeRef.current = channel;

    // Cleanup on unmount or groupId change
    return () => {
      supabase.removeChannel(channel);
      realtimeRef.current = null;
    };
  }, [groupId, queryClient]);

  return query;
};

// ─── Handle real-time events (INSERT/UPDATE/DELETE) ─────────
// This function applies changes from OTHER users to our local cache
function handleRealtimeEvent(
  queryClient: QueryClient,
  groupId: string,
  event: RealtimeItemEvent
) {
  queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) => {
    if (!old) return old;

    switch (event.eventType) {
      case 'INSERT': {
        const newItem = event.new!;
        // Avoid duplicates (in case we added it ourselves via optimistic update)
        if (old.some((item) => item.id === newItem.id)) {
          // Update with server-confirmed data (may have different version/timestamps)
          return old.map((item) => (item.id === newItem.id ? { ...item, ...newItem } : item));
        }
        // Fetch with profile data (real-time doesn't include joins)
        fetchItemWithProfile(queryClient, groupId, newItem.id);
        return old; // Will update after profile fetch
      }

      case 'UPDATE': {
        const updatedItem = event.new!;
        return old.map((item) => {
          if (item.id !== updatedItem.id) return item;
          // CONFLICT RESOLUTION: Only apply if server version is newer
          // This prevents a race condition where our optimistic update
          // gets overwritten by a stale event from the server
          if (updatedItem.version > (item.version ?? 0)) {
            return { ...item, ...updatedItem };
          }
          return item; // Keep local state if we have a newer version
        });
      }

      case 'DELETE': {
        const deletedId = event.old?.id;
        return old.filter((item) => item.id !== deletedId);
      }

      default:
        return old;
    }
  });
}

// Fetch a single item with profile joins after real-time INSERT
async function fetchItemWithProfile(
  queryClient: QueryClient,
  groupId: string,
  itemId: string
) {
  const { data } = await supabase
    .from('items')
    .select('*, added_by_profile:profiles!items_added_by_fkey(*)')
    .eq('id', itemId)
    .single();

  if (data) {
    queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
      old
        ? old.map((item) => (item.id === itemId ? { ...item, ...data } : item)).concat(
            old.some((i) => i.id === itemId) ? [] : [data]
          )
        : [data]
    );
  }
}

// ─── Add an item (optimistic update) ────────────────────────
export const useAddItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;
  const isOnline = useNetworkStore((s) => s.isOnline);

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      if (!isOnline) throw new Error('OFFLINE');

      const { data, error } = await supabase
        .from('items')
        .insert({
          group_id: groupId,
          name: input.name,
          quantity: input.quantity ?? null,
          notes: input.notes ?? null,
          url: input.url ?? null,
          added_by: user.id,
          status: 'active',
        })
        .select('*, added_by_profile:profiles!items_added_by_fkey(*)')
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: user.id,
        type: 'item_added',
        item_id: data.id,
        metadata: { name: data.name },
      });

      return data as Item;
    },

    // ─── OPTIMISTIC UPDATE ─────────────────────────────────
    // Show item immediately before server responds
    onMutate: async (input) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: itemKeys.list(groupId) });

      // Snapshot previous state for rollback
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list(groupId));

      // Create a temporary item with a local ID
      const optimisticItem: Item = {
        id: `temp-${Date.now()}`,           // Temporary ID
        group_id: groupId,
        name: input.name,
        quantity: input.quantity ?? null,
        notes: input.notes ?? null,
        url: input.url ?? null,
        status: 'active',
        added_by: user.id,
        added_by_profile: user.profile,
        completed_by: null,
        completed_by_profile: undefined,
        completed_at: null,
        sort_order: (previousItems?.length ?? 0) * 10,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Apply optimistic update to cache
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) => [
        ...(old ?? []),
        optimisticItem,
      ]);

      return { previousItems, optimisticId: optimisticItem.id };
    },

    // Replace temp item with real server item on success
    onSuccess: (serverItem, _input, context) => {
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).map((item) =>
          item.id === context?.optimisticId ? serverItem : item
        )
      );
    },

    // Roll back optimistic update on error
    onError: (_error, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(groupId), context.previousItems);
      }
    },
  });
};

// ─── Toggle item completion (optimistic) ────────────────────
export const useToggleItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;

  return useMutation({
    mutationFn: async (item: Item) => {
      const newStatus = item.status === 'completed' ? 'active' : 'completed';

      const { data, error } = await supabase
        .from('items')
        .update({
          status: newStatus,
          completed_by: newStatus === 'completed' ? user.id : null,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          version: item.version + 1,
        })
        .eq('id', item.id)
        .eq('version', item.version)       // Optimistic locking check
        .select()
        .single();

      if (error) throw error;

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: user.id,
        type: newStatus === 'completed' ? 'item_completed' : 'item_uncompleted',
        item_id: item.id,
      });

      return data as Item;
    },

    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(groupId) });
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list(groupId));

      // Apply optimistic toggle immediately
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: i.status === 'completed' ? 'active' : 'completed',
                completed_by: i.status !== 'completed' ? user.id : null,
                completed_at: i.status !== 'completed' ? new Date().toISOString() : null,
                version: i.version + 1,
              }
            : i
        )
      );

      return { previousItems };
    },

    onError: (_error, _item, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(groupId), context.previousItems);
      }
    },

    onSuccess: (serverItem) => {
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).map((item) => (item.id === serverItem.id ? { ...item, ...serverItem } : item))
      );
    },
  });
};

// ─── Edit item (with conflict resolution) ───────────────────
export const useEditItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: UpdateItemInput;
    }) => {
      // Use our safe update function with version check
      const { data: success, error } = await supabase.rpc('update_item_safe', {
        p_item_id: itemId,
        p_name: updates.name,
        p_quantity: updates.quantity ?? null,
        p_notes: updates.notes ?? null,
        p_url: updates.url ?? null,
        p_expected_version: updates.version,
      });

      if (error) throw error;

      // If version mismatch, fetch latest and return conflict error
      if (!success) {
        const { data: current } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single();

        throw Object.assign(new Error('CONFLICT'), { currentItem: current });
      }

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: user.id,
        type: 'item_edited',
        item_id: itemId,
        metadata: { new_name: updates.name },
      });

      return { success: true };
    },

    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(groupId) });
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list(groupId));

      // Optimistic update
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).map((item) =>
          item.id === itemId
            ? { ...item, name: updates.name, quantity: updates.quantity ?? null, notes: updates.notes ?? null, url: updates.url ?? null }
            : item
        )
      );

      return { previousItems };
    },

    onError: (_error, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(groupId), context.previousItems);
      }
    },

    onSettled: () => {
      // Always refetch to get authoritative server state
      queryClient.invalidateQueries({ queryKey: itemKeys.list(groupId) });
    },
  });
};

// ─── Delete item ─────────────────────────────────────────────
export const useDeleteItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;

  return useMutation({
    mutationFn: async (itemId: string) => {
      // Soft delete — set status to 'deleted' for audit trail
      const { error } = await supabase
        .from('items')
        .update({ status: 'deleted' })
        .eq('id', itemId);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: user.id,
        type: 'item_deleted',
        item_id: itemId,
      });
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(groupId) });
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list(groupId));

      // Immediately remove from UI
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).filter((item) => item.id !== itemId)
      );

      return { previousItems };
    },

    onError: (_error, _itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(groupId), context.previousItems);
      }
    },
  });
};
