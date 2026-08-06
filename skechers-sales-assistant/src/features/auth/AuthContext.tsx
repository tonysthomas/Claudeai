// Associate authentication + store context. In DEMO_MODE (default for local dev
// and tests) it provides a synthetic authenticated associate WITHOUT calling
// Supabase, so the app and Phase 4/5 tests work offline. In production mode it
// uses Supabase Auth (email/password), persists the session, and loads the
// associate profile + store.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { isDemoMode } from '../../lib/format';
import type { AssociateProfile, StoreInfo } from './types';

const DEMO_UID = '00000000-0000-0000-0000-000000000001';
const DEMO_PROFILE: AssociateProfile = {
  id: 'demo-associate', auth_user_id: DEMO_UID, employee_number: 'DEMO-EMP-001',
  display_name: 'Demo Associate', store_id: 'demo-store', role: 'associate', language: 'en', active: true,
};
const DEMO_STORE: StoreInfo = { id: 'demo-store', name: 'Demo Store 1', region: 'DEMO' };

export interface AuthState {
  loading: boolean;
  isDemo: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  profile: AssociateProfile | null;
  store: StoreInfo | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, demoMode = isDemoMode }: { children: ReactNode; demoMode?: boolean }) {
  const [loading, setLoading] = useState(!demoMode);
  const [userId, setUserId] = useState<string | null>(demoMode ? DEMO_UID : null);
  const [profile, setProfile] = useState<AssociateProfile | null>(demoMode ? DEMO_PROFILE : null);
  const [store, setStore] = useState<StoreInfo | null>(demoMode ? DEMO_STORE : null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setStore(null);
      return;
    }
    const { data: prof } = await supabase
      .from('associate_profiles')
      .select('id, auth_user_id, employee_number, display_name, store_id, role, language, active')
      .eq('auth_user_id', uid)
      .maybeSingle();
    setProfile((prof as AssociateProfile | null) ?? null);
    if (prof?.store_id) {
      const { data: st } = await supabase.from('stores').select('id, name, region').eq('id', prof.store_id).maybeSingle();
      setStore((st as StoreInfo | null) ?? null);
    } else {
      setStore(null);
    }
  }, []);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      await loadProfile(uid);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      await loadProfile(uid);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [demoMode, loadProfile]);

  const signIn = useCallback<AuthState['signIn']>(async (email, password) => {
    setError(null);
    if (demoMode) return { error: null };
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return { error: err.message };
    }
    return { error: null };
  }, [demoMode]);

  const signOut = useCallback(async () => {
    if (demoMode) return;
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
    setStore(null);
  }, [demoMode]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      isDemo: demoMode,
      isAuthenticated: demoMode || userId !== null,
      userId,
      profile,
      store,
      error,
      signIn,
      signOut,
    }),
    [loading, demoMode, userId, profile, store, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
