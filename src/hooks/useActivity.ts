// src/hooks/useActivity.ts
// Fetch activity log for a group (history/audit trail)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ActivityLog } from '../types';

export const activityKeys = {
  list: (groupId: string) => ['activity', groupId] as const,
};

export const useActivity = (groupId: string, limit = 50) =>
  useQuery({
    queryKey: activityKeys.list(groupId),
    enabled: !!groupId,
    staleTime: 15_000,
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profiles (id, display_name, avatar_url),
          items (id, name)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });

// ─── Human-readable activity descriptions ─────────────────
export function getActivityDescription(log: ActivityLog): string {
  const actor = log.profiles?.display_name ?? 'Someone';
  const itemName = log.items?.name ?? (log.metadata?.name as string) ?? 'an item';

  switch (log.type) {
    case 'item_added':      return `${actor} added "${itemName}"`;
    case 'item_edited':     return `${actor} updated "${itemName}"`;
    case 'item_completed':  return `${actor} checked off "${itemName}"`;
    case 'item_uncompleted':return `${actor} unchecked "${itemName}"`;
    case 'item_deleted':    return `${actor} removed "${itemName}"`;
    case 'member_joined':   return `${actor} joined the group`;
    case 'member_left':     return `${actor} left the group`;
    case 'member_role_changed': {
      const role = log.metadata?.new_role as string ?? 'member';
      return `${actor} was made ${role}`;
    }
    case 'group_created':   return `${actor} created this group`;
    case 'group_updated':   return `${actor} updated group settings`;
    default:                return `${actor} made a change`;
  }
}
