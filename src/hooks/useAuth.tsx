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
  exchangeOAuthCode: (rawUrlOrCode: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Resolves the canonical origin for Supabase OAuth and email redirects.
 * Repairs the "predicpro.guru" typo domain and normalizes naked "predictpro.guru"
 * to "https://www.predictpro.guru" so redirects match the primary canonical domain.
 */
export function getCanonicalSiteOrigin(rawOrigin?: string): string {
  const origin =
    rawOrigin?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.predictpro.guru');
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'predicpro.guru' ||
      host === 'www.predicpro.guru' ||
      host === 'predictpro.guru' ||
      host === 'www.predictpro.guru'
    ) {
      return 'https://www.predictpro.guru';
    }
    return parsed.origin;
  } catch {
    return 'https://www.predictpro.guru';
  }
}

/**
 * Extracts a Supabase PKCE authorization `code` from a full redirect URL
 * (such as `https://predicpro.guru/?code=93bcc669-3acf-4a84-8abd-58d3d5c4f3c2`),
 * a query string (`?code=...`), or a raw code string.
 */
export function extractOAuthCodeFromInput(rawInput: string): string | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Try parsing as a full URL or relative query string
  try {
    const urlToParse = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : trimmed.includes('code=')
        ? `https://www.predictpro.guru/${trimmed.replace(/^\/+/, '')}`
        : null;
    if (urlToParse) {
      const parsed = new URL(urlToParse);
      const codeParam = parsed.searchParams.get('code')?.trim();
      if (codeParam) return codeParam;
    }
  } catch {
    // Fall through to regex extraction
  }

  const codeMatch = trimmed.match(/[?&]code=([^&#\s]+)/i);
  if (codeMatch?.[1]) {
    try {
      return decodeURIComponent(codeMatch[1].trim());
    } catch {
      return codeMatch[1].trim();
    }
  }

  // Raw UUID or PKCE authorization code
  if (/^[a-zA-Z0-9_-]{16,128}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function cleanOAuthParamsFromWindowUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const hadAuthParams =
      url.searchParams.has('code') ||
      url.searchParams.has('error') ||
      url.searchParams.has('error_code') ||
      url.searchParams.has('error_description');
    if (hadAuthParams) {
      url.searchParams.delete('code');
      url.searchParams.delete('error');
      url.searchParams.delete('error_code');
      url.searchParams.delete('error_description');
      const nextSearch = url.searchParams.toString();
      const cleanPath = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
      window.history.replaceState({}, document.title, cleanPath);
    }
  } catch {
    // ignore URL cleanup errors
  }
}

function unlockGuestPreviewGate(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('predictpro_signup_popup_completed_v1', 'true');
    window.localStorage.removeItem('predictpro_guest_gate_locked_v3');
  } catch {
    // ignore storage errors
  }
}

function hasStoredAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (
      window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error_description=')
    ) {
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

/**
 * Sync user metadata (Google avatar + display name) and stamp `updated_at` (Last Seen)
 * in `public.profiles` on sign-up, sign-in, and active session checks.
 * Note: Only updates non-protected columns (`updated_at`, `full_name`, `avatar_url`)
 * to comply with the `protect_profile_sensitive_fields` trigger.
 */
export async function syncUserProfileActivity(user: User) {
  if (!user?.id) return;
  try {
    const supabase = await getSupabase();
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
    const nowIso = new Date().toISOString();

    const updatePayload: Record<string, string> = {
      updated_at: nowIso,
    };
    if (avatarUrl) {
      updatePayload.avatar_url = avatarUrl;
    }
    if (fullName && fullName.trim()) {
      updatePayload.full_name = fullName.trim();
    }

    await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);
  } catch {
    // Non-fatal when profiles table RLS is in read-only / standby mode
  }
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
        const supabase = await getSupabase();
        if (unsubscribed) return;

        // CRITICAL: Always attach onAuthStateChange even if hasStoredAuthSession() is initially false,
        // so that signing up or signing in on /auth immediately updates user & session across the app.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (unsubscribed) return;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);

            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && nextSession?.user) {
              unlockGuestPreviewGate();
              await syncUserProfileActivity(nextSession.user);
              if (event === 'SIGNED_IN') {
                const provider = nextSession.user.app_metadata?.provider;
                if (typeof window !== 'undefined' && (window as Window & { gtag?: (...a: unknown[]) => void }).gtag) {
                  (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'login', {
                    method: provider ?? 'email',
                  });
                }
              }
            }
          }
        );
        authSub = subscription;

        // Inspect URL for OAuth PKCE ?code= or ?error_description=
        const searchParams =
          typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const oauthError =
          searchParams?.get('error_description') || searchParams?.get('error') || null;
        const oauthCode = searchParams?.get('code')?.trim() || null;

        if (oauthError) {
          notifyToast.error(`Sign-in error: ${oauthError}`);
          cleanOAuthParamsFromWindowUrl();
        }

        if (!hasStoredAuthSession() && !oauthCode) {
          setLoading(false);
          return;
        }

        let { data: { session: activeSession } } = await supabase.auth.getSession();

        // If URL has ?code= and getSession() hasn't already exchanged it, perform explicit PKCE exchange
        if (!activeSession && oauthCode) {
          const { data: exchangeData, error: exchangeErr } =
            await supabase.auth.exchangeCodeForSession(oauthCode);
          if (!exchangeErr && exchangeData?.session) {
            activeSession = exchangeData.session;
          } else if (exchangeErr) {
            // Re-check getSession in case detectSessionInUrl finished concurrently
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData?.session) {
              activeSession = retryData.session;
            } else {
              console.warn('[Auth] OAuth PKCE code exchange warning:', exchangeErr.message);
            }
          }
        }

        if (oauthCode) {
          cleanOAuthParamsFromWindowUrl();
        }

        if (unsubscribed) return;
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        setLoading(false);

        if (activeSession?.user) {
          unlockGuestPreviewGate();
          syncUserProfileActivity(activeSession.user).catch(() => {});
          if (oauthCode) {
            notifyToast.success('Signed in successfully! Welcome to PredictPro 🎉');
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
              navigate('/');
            }
          }
        }
      } catch {
        if (!unsubscribed) setLoading(false);
      }
    };

    if (
      hasStoredAuthSession() ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth'))
    ) {
      initAuth();
      return () => {
        unsubscribed = true;
        authSub?.unsubscribe();
      };
    }

    setLoading(false);
    const onInteract = () => {
      initAuth();
    };
    window.addEventListener('pointerdown', onInteract, { passive: true, once: true });
    window.addEventListener('touchstart', onInteract, { passive: true, once: true });
    window.addEventListener('keydown', onInteract, { passive: true, once: true });

    return () => {
      unsubscribed = true;
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('keydown', onInteract);
      authSub?.unsubscribe();
    };
  }, [navigate]);

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
    if (!data?.session || !data?.user) {
      const standbyErr = new Error('Unable to establish authentication session. Please check your connection and try again.');
      notifyToast.error(standbyErr.message);
      throw standbyErr;
    }
    setSession(data.session);
    setUser(data.session.user);
    unlockGuestPreviewGate();
    await syncUserProfileActivity(data.session.user);
    notifyToast.success('Welcome back!');
    navigate('/');
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, referralCode?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

    const supabase = await getSupabase();
    const redirectOrigin = getCanonicalSiteOrigin();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanName,
          referral_code: referralCode || undefined,
        },
        emailRedirectTo: `${redirectOrigin}/`,
      },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (!signInErr && signInData?.session) {
          setSession(signInData.session);
          setUser(signInData.session.user);
          unlockGuestPreviewGate();
          await syncUserProfileActivity(signInData.session.user);
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

    // Ensure an explicit password sign-in is performed or session is active so Supabase auth.users.last_sign_in_at is always populated
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      unlockGuestPreviewGate();
      await syncUserProfileActivity(data.session.user);
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
        unlockGuestPreviewGate();
        await syncUserProfileActivity(signInData.session.user);
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
    const redirectOrigin = getCanonicalSiteOrigin();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectOrigin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      notifyToast.error(error.message || 'Failed to sign in with Google');
      throw error;
    }
  }, []);

  const exchangeOAuthCode = useCallback(async (rawUrlOrCode: string): Promise<boolean> => {
    const extractedCode = extractOAuthCodeFromInput(rawUrlOrCode);
    if (!extractedCode) {
      notifyToast.error('Could not find a valid ?code=... parameter in that link.');
      return false;
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(extractedCode);
    if (error) {
      // Check if session was already established
      const { data: current } = await supabase.auth.getSession();
      if (current?.session) {
        setSession(current.session);
        setUser(current.session.user);
        unlockGuestPreviewGate();
        cleanOAuthParamsFromWindowUrl();
        await syncUserProfileActivity(current.session.user);
        notifyToast.success('Signed in with Google! Welcome to PredictPro 🎉');
        navigate('/');
        return true;
      }
      notifyToast.error(
        error.message ||
          'Code expired or was initiated in a different browser tab. Please click "Continue with Google" again.'
      );
      return false;
    }

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      unlockGuestPreviewGate();
      cleanOAuthParamsFromWindowUrl();
      await syncUserProfileActivity(data.session.user);
      notifyToast.success('Signed in with Google! Welcome to PredictPro 🎉');
      navigate('/');
      return true;
    }

    return false;
  }, [navigate]);

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
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, exchangeOAuthCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
