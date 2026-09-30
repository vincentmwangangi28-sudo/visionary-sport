import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hasStoredAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
      return true;
    }
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        return true;
      }
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

/** Sync Google avatar + display name into our profiles table on first OAuth login */
async function syncOAuthProfile(user: User) {
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;

  if (!avatarUrl && !fullName) return;

  const { supabase } = await import('@/integrations/supabase/client');
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      ...(fullName ? { full_name: fullName } : {}),
    })
    .eq('id', user.id)
    .is('avatar_url', null);

  if (error) console.error('Profile sync error:', error);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(() => hasStoredAuthSession());
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribed = false;
    let authSub: { unsubscribe: () => void } | null = null;
    let initialized = false;

    const initAuth = async () => {
      if (initialized || unsubscribed) return;
      initialized = true;
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        if (unsubscribed) return;
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (unsubscribed) return;
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        setLoading(false);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (unsubscribed) return;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);

            if (event === 'SIGNED_IN' && nextSession?.user) {
              const provider = nextSession.user.app_metadata?.provider;
              if (provider === 'google') {
                await syncOAuthProfile(nextSession.user);
              }
              if (typeof window !== 'undefined' && (window as Window & { gtag?: (...a: unknown[]) => void }).gtag) {
                (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'login', {
                  method: provider ?? 'email',
                });
              }
            }
          }
        );
        authSub = subscription;
      } catch {
        if (!unsubscribed) setLoading(false);
      }
    };

    if (hasStoredAuthSession()) {
      initAuth();
      return () => {
        unsubscribed = true;
        authSub?.unsubscribe();
      };
    }

    const timer = setTimeout(initAuth, 12000);
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((evt) => window.addEventListener(evt, initAuth, { once: true, passive: true }));

    return () => {
      unsubscribed = true;
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, initAuth));
      authSub?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message || 'Failed to sign in'); throw error; }
    toast.success('Welcome back!');
    navigate('/');
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) { toast.error(error.message || 'Failed to sign up'); throw error; }
    toast.success('Account created! You can now sign in.');
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) { toast.error(error.message || 'Failed to sign in with Google'); throw error; }
  }, []);

  const signOut = useCallback(async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message || 'Failed to sign out'); return; }
    toast.success('Signed out successfully');
    navigate('/auth');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
