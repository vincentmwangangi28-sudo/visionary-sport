import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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

/** Sync Google avatar + display name into our profiles table on first OAuth login */
async function syncOAuthProfile(user: User) {
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;

  if (!avatarUrl && !fullName) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      ...(fullName ? { full_name: fullName } : {}),
    })
    .eq('id', user.id)
    // Only update if avatar_url is still null (first Google login)
    .is('avatar_url', null);

  if (error) console.error('Profile sync error:', error);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialise from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider;

          // Sync Google profile data (avatar, name) on OAuth sign-in
          if (provider === 'google') {
            await syncOAuthProfile(session.user);
          }

          // GA4 event
          if (typeof window !== 'undefined' && (window as Window & { gtag?: (...a: unknown[]) => void }).gtag) {
            (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'login', {
              method: provider ?? 'email',
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message || 'Failed to sign in'); throw error; }
    toast.success('Welcome back!');
    navigate('/');
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          // Request offline access so Supabase can refresh tokens
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) { toast.error(error.message || 'Failed to sign in with Google'); throw error; }
    // No navigate here — Supabase redirects the browser automatically
  }, []);

  const signOut = useCallback(async () => {
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
