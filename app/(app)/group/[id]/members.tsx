// app/(app)/group/[id]/members.tsx
// Group members screen — view, promote/demote, remove members

import React from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import {
  useGroupMembers,
  useGroups,
  useChangeMemberRole,
  useLeaveGroup,
} from '../../../../src/hooks/useGroups';
import { useAuthStore } from '../../../../src/store/authStore';
import { Avatar, RoleBadge, EmptyState, ErrorState, LoadingScreen } from '../../../../src/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import type { GroupMember } from '../../../../src/types';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';

export default function MembersScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user)!;

  const { data: groups } = useGroups();
  const group = groups?.find((g) => g.id === groupId);
  const myRole = group?.myRole ?? 'member';
  const isAdmin = myRole === 'admin';

  const { data: members, isLoading, isError, refetch, isFetching } = useGroupMembers(groupId!);
  const changeRole = useChangeMemberRole(groupId!);
  const leaveGroup = useLeaveGroup();

  if (isLoading) return <LoadingScreen message="Loading members..." />;
  if (isError) return <ErrorState message="Failed to load members" onRetry={refetch} />;

  const handleRoleChange = (member: GroupMember) => {
    if (!isAdmin) return;
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const action = newRole === 'admin' ? 'Make Admin' : 'Remove Admin';

    Alert.alert(
      action,
      `${action} for ${member.profiles?.display_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              await changeRole.mutateAsync({ targetUserId: member.user_id, newRole });
              Toast.show({ type: 'success', text1: 'Role updated' });
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to update role' });
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup.mutateAsync(groupId!);
              router.replace('/(app)/groups');
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to leave group' });
            }
          },
        },
      ]
    );
  };

  const handleShareInvite = async () => {
    if (!group) return;
    await Share.share({
      message: `Join my shopping list "${group.name}" on Shoply!\nInvite code: ${group.invite_code}`,
    });
  };

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerSection}>
          {/* Invite card */}
          {isAdmin && group && (
            <TouchableOpacity style={styles.inviteCard} onPress={handleShareInvite}>
              <View style={styles.inviteLeft}>
                <Ionicons name="share-social-outline" size={22} color={Colors.primary} />
                <View>
                  <Text style={styles.inviteTitle}>Invite People</Text>
                  <Text style={styles.inviteCode}>{group.invite_code}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.sectionTitle}>
            Members ({members?.length ?? 0})
          </Text>
        </View>
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Ionicons name="exit-outline" size={18} color={Colors.danger} />
          <Text style={styles.leaveBtnText}>Leave Group</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <MemberRow
          member={item}
          isCurrentUser={item.user_id === currentUser.id}
          isAdmin={isAdmin}
          onRoleChange={() => handleRoleChange(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function MemberRow({
  member,
  isCurrentUser,
  isAdmin,
  onRoleChange,
}: {
  member: GroupMember;
  isCurrentUser: boolean;
  isAdmin: boolean;
  onRoleChange: () => void;
}) {
  const profile = member.profiles;
  if (!profile) return null;

  return (
    <View style={styles.memberRow}>
      <Avatar userId={member.user_id} displayName={profile.display_name} size={44} />
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>
            {profile.display_name}
            {isCurrentUser && <Text style={styles.youLabel}> (you)</Text>}
          </Text>
          <RoleBadge role={member.role} />
        </View>
        <Text style={styles.memberUsername}>@{profile.username}</Text>
        <Text style={styles.memberJoined}>
          Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
        </Text>
      </View>

      {/* Admin can toggle roles for other members */}
      {isAdmin && !isCurrentUser && (
        <TouchableOpacity style={styles.roleBtn} onPress={onRoleChange}>
          <Ionicons
            name={member.role === 'admin' ? 'star' : 'star-outline'}
            size={20}
            color={member.role === 'admin' ? Colors.admin : Colors.textTertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.base,
    paddingBottom: 48,
    flexGrow: 1,
    backgroundColor: Colors.bg,
    gap: Spacing.sm,
  },
  headerSection: { gap: Spacing.base, marginBottom: Spacing.sm },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '50',
  },
  inviteLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  inviteTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  inviteCode: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primaryDark,
    letterSpacing: 3,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  separator: { height: Spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  youLabel: {
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  memberUsername: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  memberJoined: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  roleBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgElevated,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.base,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  leaveBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.danger,
  },
});
