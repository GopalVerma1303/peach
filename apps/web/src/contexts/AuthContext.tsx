import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseClient } from '@gopx-drive/core';
import { createSupabaseApi } from '@gopx-drive/core';
import { createIndexedDBCache, createSyncService } from '@gopx-drive/cache-web';

const supabase = createSupabaseClient();
const api = createSupabaseApi(supabase);
const cache = createIndexedDBCache();
const syncService = createSyncService(api, cache);

interface User {
  id: string;
  email?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  api: typeof api;
  cache: typeof cache;
  syncService: typeof syncService;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSession().then(({ user: u }) => {
      setUser(u);
      setLoading(false);
      if (u && syncService.isOnline()) {
        syncService.sync().catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
      if (session?.user && syncService.isOnline()) {
        syncService.sync().catch(() => {});
      }
    });

    const onOnline = () => {
      syncService.sync().catch(() => {});
    };
    window.addEventListener('online', onOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await api.signIn(email, password);
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await api.signUp(email, password);
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await api.signOut();
    await cache.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        api,
        cache,
        syncService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
