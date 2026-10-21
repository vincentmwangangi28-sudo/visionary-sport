import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const getSupabase = () => import('@/integrations/supabase/client').then((m) => m.supabase);
const notifyToast = {
  success: (msg: string) => import('sonner').then(({ toast }) => toast.success(msg)).catch(() => {}),
  error: (msg: string) => import('sonner').then(({ toast }) => toast.error(msg)).catch(() => {}),
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, referralCode?: string) => Promise<void>;
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

  const supabase = await getSupabase();
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
        if (unsubscribed) return;
        if (!hasStoredAuthSession()) {
          setLoading(false);
          return;
        }
        const supabase = await getSupabase();
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

    initAuth();

    return () => {
      unsubscribed = true;
      authSub?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
    if (error) {
      const msg = error.message || 'Failed to sign in';
      if (msg.toLowerCase().includes('invalid login credentials') && (cleanEmail.includes('gmail.com') || cleanEmail.includes('googlemail.com'))) {
        notifyToast.error('Invalid credentials. If you created your account with Google, please click "Continue with Google".');
      } else {
        notifyToast.error(msg);
      }
      throw error;
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    notifyToast.success('Welcome back!');
    navigate('/');
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, referralCode?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanName,
          referral_code: referralCode || undefined,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (!signInErr && signInData.session) {
          setSession(signInData.session);
          setUser(signInData.session.user);
          notifyToast.success('Welcome back! Signed you into your account. 🎉');
          navigate('/');
          return;
        }
        const friendlyMsg = cleanEmail.includes('gmail.com')
          ? 'An account with this Gmail already exists. Click "Continue with Google" to sign in.'
          : 'An account with this email already exists. Please sign in or reset your password.';
        notifyToast.error(friendlyMsg);
        throw error;
      }
      notifyToast.error(error.message || 'Failed to sign up');
      throw error;
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      notifyToast.success('Account created! Welcome to PredictPro 🎉');
      navigate('/');
      return;
    }

    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      if (!signInErr && signInData?.session) {
        setSession(signInData.session);
        setUser(signInData.session.user);
        notifyToast.success('Account created! Welcome to PredictPro 🎉');
        navigate('/');
        return;
      }
    } catch {
      // ignore
    }

    notifyToast.success('Account created! Please check your email to verify.');
  }, [navigate]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = await getSupabase();
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
    if (error) { notifyToast.error(error.message || 'Failed to sign in with Google'); throw error; }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) { notifyToast.error(error.message || 'Failed to sign out'); return; }
    setSession(null);
    setUser(null);
    notifyToast.success('Signed out successfully');
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
