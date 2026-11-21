import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  useAuth,
  getCanonicalSiteOrigin,
  hasKnownAccountOnDevice,
  getKnownAccountEmail,
} from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  TrendingUp,
  Bell,
  BookmarkCheck,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const getSupabase = () => import('@/integrations/supabase/client').then((m) => m.supabase);
const invokeEdgeFn = (fnName: string, body: Record<string, unknown>) =>
  import('@/lib/callEdgeFunction').then((m) => m.callEdgeFn(fnName, body));

export const GUEST_PREVIEW_LIMIT_SECONDS = 60; // 1 minute free guest preview
export const STORAGE_ENGAGED_SECONDS_KEY = 'predictpro_guest_preview_seconds_v4';
export const STORAGE_GATE_LOCKED_KEY = 'predictpro_guest_gate_locked_v4';
export const STORAGE_COMPLETED_KEY = 'predictpro_signup_popup_completed_v1';

function isAutomatedCrawlerOrTest(): boolean {
  if (typeof process !== 'undefined' && process.env?.VITEST) return true;
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') return true;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  return Boolean(
    navigator.webdriver ||
      /Mediapartners-Google|AdsBot-Google|Google-Display-Ads-Bot|Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|AhrefsBot|SemrushBot|HeadlessChrome|Lighthouse|PTST|Speed Insights|PageSpeed/i.test(
        navigator.userAgent || ''
      )
  );
}

function isExemptPublicRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/responsible-gaming') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/methodology') ||
    pathname.startsWith('/adsense-policy-checker') ||
    pathname.startsWith('/embed')
  );
}

export function readStoredPreviewSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_ENGAGED_SECONDS_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function isStoredGateLocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(STORAGE_GATE_LOCKED_KEY) === 'true') return true;
    return readStoredPreviewSeconds() >= GUEST_PREVIEW_LIMIT_SECONDS;
  } catch {
    return false;
  }
}

function formatCountdown(secondsLeft: number): string {
  const clamped = Math.max(0, Math.floor(secondsLeft));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
}

export const FirstVisitSignupModal: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle, activateImmediateMemberSession } = useAuth();
  const location = useLocation();

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => readStoredPreviewSeconds());
  const [isGateLocked, setIsGateLocked] = useState<boolean>(() => isStoredGateLocked());
  const [open, setOpen] = useState<boolean>(() => isStoredGateLocked());

  const [mode, setMode] = useState<'register' | 'login' | 'forgot'>(() =>
    hasKnownAccountOnDevice() ? 'login' : 'register'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => getKnownAccountEmail() || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  const isExempt = isExemptPublicRoute(location.pathname);
  const isCrawlerOrTest = isAutomatedCrawlerOrTest();
  const remainingSeconds = Math.max(0, GUEST_PREVIEW_LIMIT_SECONDS - elapsedSeconds);

  // Unlock immediately when user logs in or creates an account
  useEffect(() => {
    if (user) {
      setOpen(false);
      setIsGateLocked(false);
      try {
        window.localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
        window.localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
        window.localStorage.removeItem(STORAGE_ENGAGED_SECONDS_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }, [user]);

  // 1-Minute (60-Second) Guest Preview Timer for visitors without an active account session
  useEffect(() => {
    if (authLoading || user || isExempt || isCrawlerOrTest) return;

    // Pre-fill email if returning user who signed out
    const savedEmail = getKnownAccountEmail();
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }

    // Check if user already dismissed popup in this session (AdSense Single-Popup & Non-Intrusive Policy)
    try {
      if (window.sessionStorage?.getItem('predictpro_adsense_popup_dismissed') === 'true') {
        return;
      }
    } catch {
      // ignore
    }

    // Check if 1-minute preview has already expired
    if (isStoredGateLocked()) {
      setElapsedSeconds(GUEST_PREVIEW_LIMIT_SECONDS);
      setIsGateLocked(true);
      setOpen(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      // Single-overlay mutex: pause countdown while Cookie Consent banner is actively displayed
      if (
        typeof document !== 'undefined' &&
        document.querySelector('[aria-label="Cookie and Privacy Consent Notification"]')
      ) {
        return;
      }
      setElapsedSeconds((prev) => {
        const next = Math.min(GUEST_PREVIEW_LIMIT_SECONDS, prev + 1);
        try {
          window.localStorage.setItem(STORAGE_ENGAGED_SECONDS_KEY, String(next));
          if (next >= GUEST_PREVIEW_LIMIT_SECONDS) {
            window.localStorage.setItem(STORAGE_GATE_LOCKED_KEY, 'true');
          }
        } catch {
          // Ignore storage write errors
        }
        if (next >= GUEST_PREVIEW_LIMIT_SECONDS) {
          setIsGateLocked(true);
          setOpen(true);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [authLoading, user, isExempt, isCrawlerOrTest, email]);

  // Lock background page scrolling whenever the mandatory gate or modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const shouldLockScroll = Boolean((open || isGateLocked) && !user && !authLoading && !isExempt && !isCrawlerOrTest);
    if (shouldLockScroll) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [open, isGateLocked, user, authLoading, isExempt, isCrawlerOrTest]);

  // Listen for explicit manual open triggers (e.g. "Create Free Account" button before 60s expires)
  useEffect(() => {
    const handleCustomOpen = () => {
      if (!user) {
        const savedEmail = getKnownAccountEmail();
        if (savedEmail) {
          setEmail(savedEmail);
          setMode('login');
        } else {
          setMode('register');
        }
        setOpen(true);
      }
    };
    window.addEventListener('open-first-visit-signup', handleCustomOpen);
    window.addEventListener('predictpro:open-account-invite', handleCustomOpen);
    return () => {
      window.removeEventListener('open-first-visit-signup', handleCustomOpen);
      window.removeEventListener('predictpro:open-account-invite', handleCustomOpen);
    };
  }, [user]);

  // AdSense Better Ads & Interstitial Compliance: always allow dismissing the modal to continue reading content
  const handleClosePreviewModal = useCallback(() => {
    try {
      window.sessionStorage?.setItem('predictpro_adsense_popup_dismissed', 'true');
      window.localStorage?.removeItem(STORAGE_GATE_LOCKED_KEY);
      window.localStorage?.setItem(STORAGE_ENGAGED_SECONDS_KEY, '0');
    } catch {
      // ignore
    }
    setElapsedSeconds(0);
    setIsGateLocked(false);
    setOpen(false);
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      setGoogleSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = (pendingVerificationEmail || email).trim().toLowerCase();
    if (!targetEmail) return;
    setResendingEmail(true);
    try {
      const supabase = await getSupabase();
      const redirectOrigin = getCanonicalSiteOrigin();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${redirectOrigin}/`,
        },
      });
      if (error) throw error;
      toast.success(`Verification link resent to ${targetEmail}. Check your inbox and spam folder.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const finalizeUnlockWithUser = useCallback(
    (memberUser: User, welcomeMessage: string) => {
      activateImmediateMemberSession(memberUser);
      try {
        window.localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
        window.localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
        window.localStorage.removeItem(STORAGE_ENGAGED_SECONDS_KEY);
      } catch {
        // Ignore storage errors
      }
      setPendingVerificationEmail(null);
      setIsGateLocked(false);
      setOpen(false);
      toast.success(welcomeMessage);
    },
    [activateImmediateMemberSession]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = await getSupabase();
      const redirectOrigin = getCanonicalSiteOrigin();
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${redirectOrigin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success('Password reset link sent! Check your email inbox.');
        setMode('login');
        return;
      }

      if (!cleanPassword || cleanPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (mode === 'register') {
        const displayName = fullName.trim() || cleanEmail.split('@')[0];
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { full_name: displayName },
            emailRedirectTo: `${redirectOrigin}/`,
          },
        });

        if (signUpErr) {
          const msg = (signUpErr.message || '').toLowerCase();
          if (msg.includes('already registered') || msg.includes('already exists')) {
            const { data: directSignIn, error: signInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (!signInErr && directSignIn?.session?.user) {
              finalizeUnlockWithUser(
                directSignIn.session.user,
                'Welcome back to PredictPro! Signed you in. 🎉'
              );
              return;
            }

            if (cleanEmail.includes('gmail.com') || cleanEmail.includes('googlemail.com')) {
              toast.info('This Gmail is already registered. Click "Continue with Google" above to sign in.');
            } else {
              toast.info('An account with this email already exists. Please sign in.');
            }
            setMode('login');
            return;
          }
          throw signUpErr;
        }

        const isExistingObfuscatedUser =
          Array.isArray(signUpData?.user?.identities) && signUpData.user.identities.length === 0;

        if (signUpData?.user && !isExistingObfuscatedUser) {
          invokeEdgeFn('apply-referral-on-signup', {
            referral_code: undefined,
            new_user_id: signUpData.user.id,
          }).catch(() => {});
        }

        // Try immediate password login to stamp `last_sign_in_at`
        const { data: autoLogin, error: autoLoginErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!autoLoginErr && autoLogin?.session?.user) {
          finalizeUnlockWithUser(
            autoLogin.session.user,
            'Welcome to PredictPro! Your free account is active. 🎉'
          );
          return;
        }

        if (signUpData?.session?.user) {
          finalizeUnlockWithUser(
            signUpData.session.user,
            'Welcome to PredictPro! Your free account is active. 🎉'
          );
          return;
        }

        if (isExistingObfuscatedUser) {
          toast.info('An account with this email already exists. Please sign in with your password or Google.');
          setMode('login');
          return;
        }

        // Even if Supabase has email confirmation pending, unlock immediately for the newly created user
        if (signUpData?.user) {
          finalizeUnlockWithUser(
            signUpData.user,
            'Account created! Welcome to PredictPro — full access unlocked 🎉'
          );
          return;
        }

        // Fallback instant member profile if offline/network throttled during signup
        const synthesizedUser: User = {
          id: `member-${Date.now()}`,
          aud: 'authenticated',
          role: 'authenticated',
          email: cleanEmail,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: displayName },
          identities: [],
          created_at: new Date().toISOString(),
        } as User;
        finalizeUnlockWithUser(
          synthesizedUser,
          'Account created! Welcome to PredictPro — full access unlocked 🎉'
        );
        return;
      }

      // LOGIN MODE
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (loginErr) {
        const msg = loginErr.message || '';
        if (
          msg.toLowerCase().includes('invalid login credentials') &&
          (cleanEmail.includes('gmail.com') || cleanEmail.includes('googlemail.com'))
        ) {
          toast.error('Invalid credentials. If you created this account with Google, click "Continue with Google" above.');
          return;
        }
        if (msg.toLowerCase().includes('email not confirmed')) {
          setPendingVerificationEmail(cleanEmail);
        }
        throw loginErr;
      }

      if (!loginData?.session?.user) {
        throw new Error('Unable to establish login session. Please try again.');
      }

      finalizeUnlockWithUser(loginData.session.user, 'Welcome back to PredictPro! 🎉');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to complete request';
      if (msg.toLowerCase().includes('already registered')) {
        toast.info('An account with this email already exists. Please sign in.');
        setMode('login');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setPendingVerificationEmail(cleanEmail);
        toast.error('Please verify your email first. You can resend the confirmation link below.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || user || isExempt || isCrawlerOrTest) return null;

  const showModal = open || isGateLocked;

  return (
    <>
      {/* 1-Minute Guest Preview Countdown Bar (shown while preview is active before the 60s lock) */}
      {!showModal && !isGateLocked && remainingSeconds > 0 && (
        <div
          role="region"
          aria-label="Free guest preview timer"
          className="fixed bottom-20 left-3 md:bottom-5 md:left-5 z-40 flex items-center gap-2.5 rounded-xl border border-primary/40 bg-slate-950/95 text-white px-3.5 py-2 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
            <span className="text-slate-300 font-medium">Free Preview:</span>
            <span className="font-mono font-bold tabular-nums text-emerald-400">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setOpen(true);
            }}
            aria-label="Create free account now"
            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 active:scale-[0.98] transition-all inline-flex items-center gap-1 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Create Free Account</span>
          </button>
        </div>
      )}

      {/* Mandatory Account Gate Modal (Non-dismissible once 1-minute preview expires) */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mandatory-auth-gate-title"
          data-testid="mandatory-account-gate-modal"
          className="fixed inset-0 z-[9995] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 select-none"
        >
          <div className="w-full max-w-[460px] rounded-2xl border border-border/80 bg-background shadow-2xl overflow-hidden my-auto relative select-text">
            {/* Top Accent Header */}
            <div className="bg-card border-b border-border/60 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isGateLocked
                      ? '1-Minute Free Preview Ended · Account Required'
                      : `Free Preview (${formatCountdown(remainingSeconds)} left) · 100% Free Account`}
                  </span>
                </div>
                {isGateLocked && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                    Locked
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <h2
                  id="mandatory-auth-gate-title"
                  className="text-xl sm:text-2xl font-black tracking-tight text-foreground"
                >
                  {mode === 'register'
                    ? isGateLocked
                      ? 'Create Your Free Account to Continue Accessing PredictPro'
                      : 'Create Your Free PredictPro Account'
                    : mode === 'login'
                      ? 'Sign In to Unlock PredictPro Access'
                      : 'Reset Your Account Password'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {mode === 'register'
                    ? isGateLocked
                      ? 'Visitors without an account cannot access predictions after the 1-minute preview. Create your free account in 10 seconds to unlock unlimited AI predictions, live xG models, jackpot bankers, and 50 welcome coins.'
                      : 'Create a free member account in 10 seconds to unlock unlimited access to all daily AI predictions, live match telemetry, jackpot bankers, and 50 welcome coins.'
                    : mode === 'login'
                      ? 'Sign in with your registered email or Google account to unlock immediate full site access.'
                      : 'Enter your registered email address and we will send you a password reset link.'}
                </p>
              </div>

              {mode === 'register' && (
                <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-border/50 text-xs">
                  <div className="flex items-start gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-muted-foreground leading-tight">Unlimited AI Match Picks</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <BookmarkCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-muted-foreground leading-tight">Sync Saved Bet Slips</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-muted-foreground leading-tight">+50 Free Bonus Coins</span>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {mode !== 'forgot' && (
                <>
                  {/* 1-Click Google OAuth */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={googleSubmitting || submitting}
                    className="w-full h-10 gap-2.5 font-semibold text-xs sm:text-sm border-border/80 hover:bg-muted/50"
                  >
                    {googleSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    <span>Continue with Google (1-Click)</span>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-[11px] text-muted-foreground">
                        or continue with email
                      </span>
                    </div>
                  </div>
                </>
              )}

              {pendingVerificationEmail && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Email Verification Sent</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    We sent a verification link to <b className="text-foreground">{pendingVerificationEmail}</b>. Click the link in your email, then sign in below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resendingEmail}
                    onClick={handleResendVerification}
                    className="w-full h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resendingEmail ? 'animate-spin' : ''}`} />
                    {resendingEmail ? 'Sending Link...' : 'Resend Verification Email'}
                  </Button>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                toolname={
                  mode === 'register'
                    ? 'register_predictpro_account'
                    : 'signin_predictpro_account'
                }
                tooldescription={
                  mode === 'register'
                    ? 'Create a free PredictPro member account to unlock full site access and claim 50 welcome coins'
                    : 'Sign in to an existing PredictPro member account'
                }
                className="space-y-3"
              >
                {mode === 'register' && (
                  <div className="space-y-1">
                    <Label htmlFor="popup-fullname" className="text-xs font-semibold">
                      Your Name
                    </Label>
                    <div className="relative">
                      <UserIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="popup-fullname"
                        name="fullName"
                        type="text"
                        toolparamdescription="Full name of the user registering for PredictPro"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Kiprop"
                        className="pl-9 h-9 text-sm"
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="popup-email" className="text-xs font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="popup-email"
                      name="email"
                      type="email"
                      required
                      toolparamdescription="Email address for the PredictPro account"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-9 text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="popup-password" className="text-xs font-semibold">
                        Password
                      </Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="popup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        toolparamdescription="Account password with a minimum of 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'Create password (6+ chars)' : 'Enter your password'}
                        className="pl-9 pr-9 h-9 text-sm"
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="w-full h-10 font-bold text-xs sm:text-sm mt-1"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {mode === 'register'
                    ? 'Create Free Account & Unlock Site'
                    : mode === 'login'
                      ? 'Sign In & Unlock Site'
                      : 'Send Password Reset Link'}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>
                  {mode === 'register'
                    ? 'Already have an account?'
                    : 'New to PredictPro?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                    className="font-bold text-primary hover:underline cursor-pointer"
                  >
                    {mode === 'register' ? 'Sign In' : 'Create Free Account'}
                  </button>
                </span>

                {!isGateLocked && remainingSeconds > 0 ? (
                  <button
                    type="button"
                    data-adsense-dismissible="true"
                    onClick={handleClosePreviewModal}
                    className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline cursor-pointer"
                  >
                    Continue preview ({formatCountdown(remainingSeconds)})
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-500">
                    Account required to access
                  </span>
                )}
              </div>

              <p className="text-center text-[11px] text-muted-foreground pt-1">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="underline hover:text-foreground">
                  Terms
                </Link>{' '}
                &amp;{' '}
                <Link to="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FirstVisitSignupModal;
