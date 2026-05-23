// src/types/index.ts
// Central type definitions matching the database schema

export type MemberRole = 'admin' | 'member';
export type ItemStatus = 'active' | 'completed' | 'deleted';
export type ActivityType =
  | 'item_added'
  | 'item_edited'
  | 'item_completed'
  | 'item_uncompleted'
  | 'item_deleted'
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  | 'group_created'
  | 'group_updated';

// ─── Database row types ─────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
category?: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}
category?: string;
export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  // Joined data
  profiles?: Profile;
}

export interface Item {
  id: string;
  group_id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  url: string | null;
  status: ItemStatus;
  added_by: string;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  // Joined data
  added_by_profile?: Profile;
  completed_by_profile?: Profile;
}

export interface ActivityLog {
  id: string;
  group_id: string;
  user_id: string | null;
  type: ActivityType;
  item_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  profiles?: Profile;
  items?: Item;
}

// ─── App-level types ────────────────────────────────────────

export interface GroupWithMeta extends Group {
  myRole: MemberRole;
  memberCount: number;
  activeItemCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

// Form input types
export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface CreateItemInput {
  name: string;
  quantity?: string;
  notes?: string;
  url?: string;
}

export interface UpdateItemInput {
  name: string;
  quantity?: string;
  notes?: string;
  url?: string;
  version: number;
}

// Offline queue entry
export interface OfflineMutation {
  id: string;
  type: 'create_item' | 'update_item' | 'delete_item' | 'toggle_item';
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

// Real-time event from Supabase
export interface RealtimeItemEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Item | null;
  old: Partial<Item> | null;
}
