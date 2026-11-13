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

const PERSISTED_MEMBER_SESSION_KEY = 'predictpro_member_session_v1';
const KNOWN_ACCOUNT_STORAGE_KEY = 'predictpro_known_account_v1';
const EXPLICIT_SIGNOUT_KEY = 'predictpro_explicit_signout_v1';
const SIGNUP_POPUP_COMPLETED_KEY = 'predictpro_signup_popup_completed_v1';
const GUEST_GATE_LOCKED_KEY = 'predictpro_guest_gate_locked_v3';
const MEMBER_COOKIE_NAME = 'predictpro_member_v1';
const KNOWN_ACCOUNT_COOKIE_NAME = 'predictpro_has_account';

export interface KnownAccountInfo {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider?: string;
  updatedAt: string;
}

function getCookieDomainAttribute(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host === 'predictpro.guru' || host.endsWith('.predictpro.guru')) {
    return '; domain=.predictpro.guru';
  }
  return '';
}

function setCrossSubdomainCookie(name: string, value: string, maxAgeSeconds = 31536000): void {
  if (typeof document === 'undefined') return;
  try {
    const encoded = encodeURIComponent(value);
    const domainAttr = getCookieDomainAttribute();
    const secureAttr =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${domainAttr}${secureAttr}`;
  } catch {
    // ignore cookie write errors
  }
}

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  try {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(prefix)) {
        return decodeURIComponent(trimmed.slice(prefix.length));
      }
    }
  } catch {
    // ignore cookie read errors
  }
  return null;
}

function unlockGuestPreviewGate(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIGNUP_POPUP_COMPLETED_KEY, 'true');
    window.localStorage.removeItem(GUEST_GATE_LOCKED_KEY);
    setCrossSubdomainCookie(KNOWN_ACCOUNT_COOKIE_NAME, '1');
  } catch {
    // ignore storage errors
  }
}

/**
 * Persists the authenticated user identity across localStorage and first-party cookies
 * (.predictpro.guru) so returning users are automatically logged in on every visit
 * without having to re-authenticate.
 */
export function savePersistedMemberUser(user: User | null | undefined): void {
  if (typeof window === 'undefined' || !user?.id) return;
  try {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split('@')[0] ||
      'PredictPro Member';
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const provider = (user.app_metadata?.provider as string | undefined) || 'email';

    const knownInfo: KnownAccountInfo = {
      id: user.id,
      email: user.email || '',
      fullName,
      avatarUrl,
      provider,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      PERSISTED_MEMBER_SESSION_KEY,
      JSON.stringify({ user, savedAt: Date.now() })
    );
    window.localStorage.setItem(KNOWN_ACCOUNT_STORAGE_KEY, JSON.stringify(knownInfo));
    window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
    unlockGuestPreviewGate();

    setCrossSubdomainCookie(MEMBER_COOKIE_NAME, JSON.stringify(knownInfo));
  } catch {
    // ignore storage quota errors
  }
}

function buildUserFromKnownAccount(info: KnownAccountInfo): User {
  return {
    id: info.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: info.email,
    email_confirmed_at: info.updatedAt,
    app_metadata: { provider: info.provider || 'email', providers: [info.provider || 'email'] },
    user_metadata: {
      full_name: info.fullName || info.email?.split('@')[0] || 'PredictPro Member',
      avatar_url: info.avatarUrl,
    },
    identities: [],
    created_at: info.updatedAt,
    updated_at: info.updatedAt,
  } as User;
}

/**
 * Synchronously inspects localStorage, Supabase token keys, and cross-subdomain cookies
 * to auto-detect and restore an authenticated member session immediately on page load.
 */
export function getPersistedMemberUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const explicitlySignedOut = window.localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true';

    // 1. Check active Supabase sb-*-auth-token in localStorage first
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = window.localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const sbUser = (parsed?.user || parsed?.currentSession?.user) as User | undefined;
          if (sbUser?.id) {
            savePersistedMemberUser(sbUser);
            return sbUser;
          }
        }
      }
    }

    if (explicitlySignedOut) {
      return null;
    }

    // 2. Check persisted PredictPro member session in localStorage
    const savedSessionRaw = window.localStorage.getItem(PERSISTED_MEMBER_SESSION_KEY);
    if (savedSessionRaw) {
      const parsed = JSON.parse(savedSessionRaw);
      if (parsed?.user?.id) {
        unlockGuestPreviewGate();
        return parsed.user as User;
      }
    }

    // 3. Check known account info in localStorage (auto-restore unless user explicitly signed out)
    const knownRaw = window.localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY);
    if (knownRaw) {
      const knownInfo = JSON.parse(knownRaw) as KnownAccountInfo;
      if (knownInfo?.id && knownInfo?.email) {
        const restored = buildUserFromKnownAccount(knownInfo);
        unlockGuestPreviewGate();
        return restored;
      }
    }

    // 4. Check cross-subdomain cookie (.predictpro.guru) so switching between predictpro.guru and www.predictpro.guru stays logged in
    const cookieRaw = readCookieValue(MEMBER_COOKIE_NAME);
    if (cookieRaw) {
      const cookieInfo = JSON.parse(cookieRaw) as KnownAccountInfo;
      if (cookieInfo?.id && cookieInfo?.email) {
        const restored = buildUserFromKnownAccount(cookieInfo);
        savePersistedMemberUser(restored);
        return restored;
      }
    }
  } catch {
    // ignore storage/parse errors
  }
  return null;
}

/**
 * Smart detection of whether this browser/device belongs to a user who already has an account
 * (even if they explicitly signed out), or has existing member activity, so we never annoy them
 * with the "Create Account" popup.
 */
export function hasKnownAccountOnDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (getPersistedMemberUser() !== null) return true;
    if (window.localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY) !== null) return true;
    if (window.localStorage.getItem(SIGNUP_POPUP_COMPLETED_KEY) === 'true') return true;
    if (window.localStorage.getItem('predictpro_popup_dismissed_v1') === 'true') return true;
    if (readCookieValue(KNOWN_ACCOUNT_COOKIE_NAME) === '1') return true;
    if (readCookieValue(MEMBER_COOKIE_NAME) !== null) return true;

    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        return true;
      }
    }

    // Also check if the user has saved member data on this device
    if (
      window.localStorage.getItem('predictpro_custom_admins') !== null ||
      window.localStorage.getItem('predictpro_bet_tracker_entries_v1') !== null ||
      window.localStorage.getItem('predictpro_pinned_favorites_v1') !== null
    ) {
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

export function getKnownAccountEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const persisted = getPersistedMemberUser();
    if (persisted?.email) return persisted.email;

    const knownRaw = window.localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY);
    if (knownRaw) {
      const parsed = JSON.parse(knownRaw) as KnownAccountInfo;
      if (parsed?.email) return parsed.email;
    }

    const cookieRaw = readCookieValue(MEMBER_COOKIE_NAME);
    if (cookieRaw) {
      const parsed = JSON.parse(cookieRaw) as KnownAccountInfo;
      if (parsed?.email) return parsed.email;
    }
  } catch {
    // ignore
  }
  return null;
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
    if (getPersistedMemberUser() !== null) {
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
  savePersistedMemberUser(user);
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
  const [user, setUser] = useState<User | null>(() => getPersistedMemberUser());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

        // CRITICAL: Always attach onAuthStateChange so signing up or signing in immediately updates user & session.
        // If a background token refresh fails or returns null, preserve the persisted member user unless explicitly signed out.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (unsubscribed) return;
            if (nextSession?.user) {
              savePersistedMemberUser(nextSession.user);
              setSession(nextSession);
              setUser(nextSession.user);
            } else if (event === 'SIGNED_OUT') {
              const explicitlySignedOut =
                typeof window !== 'undefined' &&
                window.localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true';
              if (explicitlySignedOut) {
                setSession(null);
                setUser(null);
              } else {
                const fallbackUser = getPersistedMemberUser();
                if (fallbackUser) {
                  setUser(fallbackUser);
                }
              }
            }
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
        if (activeSession?.user) {
          savePersistedMemberUser(activeSession.user);
          setSession(activeSession);
          setUser(activeSession.user);
        } else {
          // Preserve auto-detected returning member user so they never have to re-login on every visit
          const persistedUser = getPersistedMemberUser();
          if (persistedUser) {
            setUser(persistedUser);
          }
        }
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

    const hasOAuthUrlParams =
      typeof window !== 'undefined' &&
      (window.location.hash.includes('access_token=') ||
        window.location.search.includes('code=') ||
        window.location.search.includes('error_description='));

    if (
      hasOAuthUrlParams ||
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
    window.addEventListener('scroll', onInteract, { passive: true, once: true });
    window.addEventListener('pointerdown', onInteract, { passive: true, once: true });
    window.addEventListener('touchstart', onInteract, { passive: true, once: true });
    window.addEventListener('keydown', onInteract, { passive: true, once: true });

    return () => {
      unsubscribed = true;
      window.removeEventListener('scroll', onInteract);
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
    savePersistedMemberUser(data.session.user);
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
      savePersistedMemberUser(data.session.user);
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
        savePersistedMemberUser(signInData.session.user);
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

    unlockGuestPreviewGate();
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
          prompt: 'select_account',
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
        savePersistedMemberUser(current.session.user);
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
      savePersistedMemberUser(data.session.user);
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
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(EXPLICIT_SIGNOUT_KEY, 'true');
        window.localStorage.removeItem(PERSISTED_MEMBER_SESSION_KEY);
        // Keep KNOWN_ACCOUNT_STORAGE_KEY and SIGNUP_POPUP_COMPLETED_KEY intact so we know
        // this user already has an account and never show the Create Account popup!
        unlockGuestPreviewGate();
      } catch {
        // ignore
      }
    }
    const supabase = await getSupabase();
    await supabase.auth.signOut().catch(() => {});
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
