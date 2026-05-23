// src/hooks/useItems.ts
import { useEffect, useRef } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { detectCategory } from '../lib/categories';
import { useNetworkStore } from '../store/networkStore';
import type {
  CreateItemInput,
  Item,
  RealtimeItemEvent,
  UpdateItemInput,
} from '../types';

export const itemKeys = {
  all: ['items'] as const,
  list: (groupId: string) => [...itemKeys.all, groupId] as const,
};

// Global map to track active channels — prevents duplicate subscriptions
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const useItems = (groupId: string) => {
  const queryClient = useQueryClient();

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
        .neq('status', 'deleted')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!groupId) return;

    // If a channel for this group already exists, don't create another
    if (activeChannels.has(groupId)) return;

    const channel = supabase
      .channel(`items:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const event = payload as unknown as RealtimeItemEvent;
          handleRealtimeEvent(queryClient, groupId, event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RT] Subscribed to items:${groupId}`);
        }
      });

    activeChannels.set(groupId, channel);

    return () => {
      const ch = activeChannels.get(groupId);
      if (ch) {
        supabase.removeChannel(ch);
        activeChannels.delete(groupId);
      }
    };
  }, [groupId, queryClient]);

  return query;
};

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
        if (old.some((item) => item.id === newItem.id)) {
          return old.map((item) => (item.id === newItem.id ? { ...item, ...newItem } : item));
        }
        fetchItemWithProfile(queryClient, groupId, newItem.id);
        return old;
      }
      case 'UPDATE': {
        const updatedItem = event.new!;
        return old.map((item) => {
          if (item.id !== updatedItem.id) return item;
          if (updatedItem.version > (item.version ?? 0)) {
            return { ...item, ...updatedItem };
          }
          return item;
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
          category: input.category ?? detectCategory(input.name).id,
        })
        .select('*, added_by_profile:profiles!items_added_by_fkey(*)')
        .single();

      if (error) throw error;

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: user.id,
        type: 'item_added',
        item_id: data.id,
        metadata: { name: data.name },
      });

      return data as Item;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(groupId) });
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list(groupId));

      const optimisticItem: Item = {
        id: `temp-${Date.now()}`,
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
category: input.category ?? detectCategory(input.name).id,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) => [
        ...(old ?? []),
        optimisticItem,
      ]);

      return { previousItems, optimisticId: optimisticItem.id };
    },

    onSuccess: (serverItem, _input, context) => {
      queryClient.setQueryData<Item[]>(itemKeys.list(groupId), (old) =>
        (old ?? []).map((item) =>
          item.id === context?.optimisticId ? serverItem : item
        )
      );
    },

    onError: (_error, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(groupId), context.previousItems);
      }
    },
  });
};

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
        .eq('version', item.version)
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

export const useEditItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: UpdateItemInput }) => {
      const { data: success, error } = await supabase.rpc('update_item_safe', {
        p_item_id: itemId,
        p_name: updates.name,
        p_quantity: updates.quantity ?? null,
        p_notes: updates.notes ?? null,
        p_url: updates.url ?? null,
        p_expected_version: updates.version,
      });

      if (error) throw error;

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
      queryClient.invalidateQueries({ queryKey: itemKeys.list(groupId) });
    },
  });
};

export const useDeleteItem = (groupId: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user)!;

  return useMutation({
    mutationFn: async (itemId: string) => {
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