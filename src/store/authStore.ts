// src/store/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AuthUser, Profile, SignInInput, SignUpInput } from '../types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const isAnon = session.user.is_anonymous === true;

        if (isAnon) {
          set({
            user: {
              id: session.user.id,
              email: '',
              is_anonymous: true,
              profile: {
                id: session.user.id,
                username: 'guest',
                display_name: 'Guest',
                avatar_url: null,
                push_token: null,
                created_at: session.user.created_at,
              },
            },
          });
        } else {
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
                is_anonymous: false,
                profile,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isInitialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isAnon = session.user.is_anonymous === true;

        if (isAnon) {
          set({
            user: {
              id: session.user.id,
              email: '',
              is_anonymous: true,
              profile: {
                id: session.user.id,
                username: 'guest',
                display_name: 'Guest',
                avatar_url: null,
                push_token: null,
                created_at: session.user.created_at,
              },
            },
          });
        } else {
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
                is_anonymous: false,
                profile,
              },
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      }
    });
  },

  signUp: async ({ email, password, username, display_name }) => {
    set({ isLoading: true });
    try {
      const currentUser = get().user;
      let data, error;

      if (currentUser?.is_anonymous) {
        // Koppel het anonieme account aan een echt account
        ({ data, error } = await supabase.auth.updateUser({
          email,
          password,
          data: { username, display_name },
        }));
        if (error) throw error;

        // Maak alsnog een profiel aan
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          username,
          display_name,
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        set({
          user: {
            id: currentUser.id,
            email,
            is_anonymous: false,
            profile: profile!,
          },
        });
      } else {
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name } },
        }));

        if (error) throw error;
        if (!data.user) throw new Error('Sign up failed');

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
            is_anonymous: false,
            profile,
          },
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
          is_anonymous: false,
          profile,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signInAsGuest: async () => {
    set({ isLoading: true });
    try {
      console.log('Guest sign in starting...');
      const { data, error } = await supabase.auth.signInAnonymously();
      console.log('Guest result:', { data, error });
      if (error) throw error;

      set({
        user: {
          id: data.user!.id,
          email: '',
          is_anonymous: true,
          profile: {
            id: data.user!.id,
            username: 'guest',
            display_name: 'Guest',
            avatar_url: null,
            push_token: null,
            created_at: data.user!.created_at,
          },
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

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

  updatePushToken: async (token) => {
    const { user } = get();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  },
}));