// src/hooks/useGroups.ts
// React Query hooks for group data — includes optimistic updates

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type {
  CreateGroupInput,
  Group,
  GroupMember,
  GroupWithMeta,
} from '../types';

// ─── Query Keys ─────────────────────────────────────────────
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  detail: (id: string) => [...groupKeys.all, 'detail', id] as const,
  members: (id: string) => [...groupKeys.all, 'members', id] as const,
};

// ─── Fetch user's groups with metadata ──────────────────────
export const useGroups = () => {
  const userId = useAuthStore(s => s.user?.id);

  return useQuery({
    queryKey: groupKeys.lists(),
    enabled: !!userId,
    queryFn: async (): Promise<GroupWithMeta[]> => {
      // Fetch groups where user is a member, with item counts
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          groups (
            id, name, description, invite_code, created_by, created_at, updated_at
          )
        `)
        .eq('user_id', userId!);

      if (error) throw error;

      // For each group, get member count and active item count
      const groupsWithMeta: GroupWithMeta[] = await Promise.all(
        (data ?? []).map(async (member) => {
          const group = member.groups as unknown as Group;

          const [{ count: memberCount }, { count: activeItemCount }] = await Promise.all([
            supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id),
            supabase
              .from('items')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .eq('status', 'active'),
          ]);

          return {
            ...group,
            myRole: member.role,
            memberCount: memberCount ?? 0,
            activeItemCount: activeItemCount ?? 0,
          };
        })
      );

      // Sort by most recently updated
      return groupsWithMeta.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    },
    staleTime: 30_000, // Consider fresh for 30s
  });
};

// ─── Fetch group members ─────────────────────────────────────
export const useGroupMembers = (groupId: string) =>
  useQuery({
    queryKey: groupKeys.members(groupId),
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, profiles(*)')
        .eq('group_id', groupId)
        .order('joined_at');

      if (error) throw error;
      return data ?? [];
    },
  });

// ─── Create a new group ──────────────────────────────────────
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore(s => s.user?.id)!;

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      // 1. Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: input.name,
          description: input.description,
          created_by: userId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // 3. Log activity
      await supabase.from('activity_log').insert({
        group_id: group.id,
        user_id: userId,
        type: 'group_created',
        metadata: { name: group.name },
      });

      return group;
    },
    onSuccess: () => {
      // Invalidate group list to refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// ─── Join group by invite code ───────────────────────────────
export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // Call our PostgreSQL function — handles idempotency and logging
      const { data, error } = await supabase
        .rpc('join_group_by_code', { p_invite_code: inviteCode });

      if (error) throw error;
      return data as string; // Returns group_id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// ─── Leave group ─────────────────────────────────────────────
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore(s => s.user?.id)!;

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: userId,
        type: 'member_left',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// ─── Change member role (admin only) ────────────────────────
export const useChangeMemberRole = (groupId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore(s => s.user?.id)!;

  return useMutation({
    mutationFn: async ({ targetUserId, newRole }: { targetUserId: string; newRole: 'admin' | 'member' }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('group_id', groupId)
        .eq('user_id', targetUserId);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        group_id: groupId,
        user_id: userId,
        type: 'member_role_changed',
        metadata: { target_user_id: targetUserId, new_role: newRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
};
