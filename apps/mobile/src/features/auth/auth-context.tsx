import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  isInitializing: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let mounted = true;
    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      const nextUserId = nextSession?.user.id ?? null;
      if (currentUserId.current && currentUserId.current !== nextUserId) {
        queryClient.clear();
      }
      currentUserId.current = nextUserId;
      setSession(nextSession);
      setIsInitializing(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((error: unknown) => {
        console.warn('Failed to restore the Supabase session.', error);
        if (mounted) setIsInitializing(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isInitializing,
      signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        queryClient.clear();
      },
    }),
    [isInitializing, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
