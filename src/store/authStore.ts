// src/store/authStore.ts
// Zustand store for auth state — single source of truth for current user

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AuthUser, Profile, SignInInput, SignUpInput } from '../types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  // ─── Initialize: restore session on app start ──────────────
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              profile,
            },
          });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isInitialized: true });
    }

    // Listen for auth state changes (token refresh, sign out from another device)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              profile,
            },
          });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      } else if (event === 'TOKEN_REFRESHED') {
        // Session silently refreshed — no action needed
        console.log('Token refreshed silently');
      }
    });
  },

  // ─── Sign Up ─────────────────────────────────────────────
  signUp: async ({ email, password, username, display_name }) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name }, // Passed to handle_new_user trigger
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed — no user returned');

      // Profile is created by the DB trigger (handle_new_user)
      // Wait briefly for trigger to complete, then fetch profile
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          profile,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Sign In ─────────────────────────────────────────────
  signIn: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          profile,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Sign Out ────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Update Profile ───────────────────────────────────────
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    set({ user: { ...user, profile: data } });
  },

  // ─── Store push notification token ──────────────────────
  updatePushToken: async (token) => {
    const { user } = get();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  },
}));
