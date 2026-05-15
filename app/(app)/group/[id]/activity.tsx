// app/(app)/group/[id]/activity.tsx
// Activity/history log screen for a group

import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useActivity, getActivityDescription } from '../../../../src/hooks/useActivity';
import { Avatar, EmptyState, ErrorState, LoadingScreen } from '../../../../src/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../../../src/lib/design';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog } from '../../../../src/types';

const ACTIVITY_ICONS: Record<string, string> = {
  item_added: '➕',
  item_edited: '✏️',
  item_completed: '✅',
  item_uncompleted: '↩️',
  item_deleted: '🗑️',
  member_joined: '👋',
  member_left: '🚪',
  member_role_changed: '⭐',
  group_created: '🎉',
  group_updated: '⚙️',
};

export default function ActivityScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { data: logs, isLoading, isError, refetch, isFetching } = useActivity(groupId!);

  if (isLoading) return <LoadingScreen message="Loading history..." />;
  if (isError) return <ErrorState message="Failed to load activity" onRetry={refetch} />;

  return (
    <FlatList
      data={logs}
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
        <Text style={styles.header}>Recent Activity</Text>
      }
      ListEmptyComponent={
        <EmptyState
          icon="📜"
          title="No activity yet"
          subtitle="Changes to this list will appear here."
        />
      }
      renderItem={({ item }) => <ActivityRow log={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const icon = ACTIVITY_ICONS[log.type] ?? '•';
  const description = getActivityDescription(log);
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });

  return (
    <View style={styles.row}>
      {/* Left: avatar or icon */}
      <View style={styles.rowLeft}>
        {log.profiles ? (
          <Avatar
            userId={log.user_id!}
            displayName={log.profiles.display_name}
            size={36}
          />
        ) : (
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        {/* Connecting line */}
        <View style={styles.line} />
      </View>

      {/* Right: description + time */}
      <View style={styles.rowContent}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.base,
    paddingBottom: 48,
    flexGrow: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.base,
  },
  separator: { height: 0 }, // Lines connect rows visually
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: 64,
  },
  rowLeft: {
    alignItems: 'center',
    width: 36,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconText: { fontSize: 16 },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: -4,
  },
  rowContent: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: Spacing.base,
    gap: 4,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  time: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
});
