import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  useAuth,
  syncUserProfileActivity,
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
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const getSupabase = () => import('@/integrations/supabase/client').then((m) => m.supabase);
const invokeEdgeFn = (fnName: string, body: Record<string, unknown>) =>
  import('@/lib/callEdgeFunction').then((m) => m.callEdgeFn(fnName, body));

const STORAGE_ENGAGED_SECONDS_KEY = 'predictpro_guest_preview_seconds_v3';
const STORAGE_PAGE_VIEWS_KEY = 'predictpro_guest_page_views_v3';
const STORAGE_GATE_LOCKED_KEY = 'predictpro_guest_gate_locked_v3';
const STORAGE_COMPLETED_KEY = 'predictpro_signup_popup_completed_v1';
const STORAGE_DISMISSED_KEY = 'predictpro_popup_dismissed_v1';

function isAutomatedCrawler(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return Boolean(
    navigator.webdriver ||
      /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|HeadlessChrome|Lighthouse|PTST|Speed Insights|PageSpeed/i.test(
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
    pathname.startsWith('/embed')
  );
}

export const FirstVisitSignupModal: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [isGateLocked, setIsGateLocked] = useState(false);
  const [knownAccount, setKnownAccount] = useState<boolean>(() => hasKnownAccountOnDevice());

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

  // Clean up any legacy guest gate locks so returning users or visitors are never trapped by a mandatory popup
  useEffect(() => {
    if (isAutomatedCrawler()) return;
    try {
      localStorage.removeItem('predictpro_visitor_engaged_seconds_v1');
      localStorage.removeItem('predictpro_visitor_page_views_v1');
      localStorage.removeItem('predictpro_guest_gate_locked_v2');
      localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
      localStorage.removeItem(STORAGE_ENGAGED_SECONDS_KEY);
      localStorage.removeItem(STORAGE_PAGE_VIEWS_KEY);

      if (hasKnownAccountOnDevice()) {
        setKnownAccount(true);
        setOpen(false);
        setIsGateLocked(false);
        const savedEmail = getKnownAccountEmail();
        if (savedEmail) {
          setEmail(savedEmail);
          setMode('login');
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, [user]);

  // Listen ONLY for explicit manual open events (never auto-popup or lock the screen for users)
  useEffect(() => {
    const handleCustomOpen = () => {
      if (!user) {
        const savedEmail = getKnownAccountEmail();
        if (savedEmail || hasKnownAccountOnDevice()) {
          if (savedEmail) setEmail(savedEmail);
          setMode('login');
        } else {
          setMode('register');
        }
        setIsGateLocked(false);
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

  // Automatically unlock and close as soon as user logs in or creates an account
  useEffect(() => {
    if (user) {
      setOpen(false);
      setIsGateLocked(false);
      setKnownAccount(true);
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
        localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
      } catch {
        // Ignore
      }
    }
  }, [user]);

  const handleClosePreviewModal = useCallback(() => {
    setOpen(false);
    setIsGateLocked(false);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
      localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
      localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
    } catch {
      // Ignore
    }
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

            if (!signInErr && directSignIn?.session) {
              await syncUserProfileActivity(directSignIn.session.user);
              try {
                localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
                localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
              } catch {}
              toast.success('Welcome back to PredictPro! Signed you in. 🎉');
              setOpen(false);
              setIsGateLocked(false);
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

        // Immediately execute signInWithPassword so `auth.users.last_sign_in_at` is stamped in Supabase
        // and `public.profiles.updated_at` ("Last Seen") is synced
        const { data: autoLogin, error: autoLoginErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!autoLoginErr && autoLogin?.session) {
          await syncUserProfileActivity(autoLogin.session.user);
          try {
            localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
            localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
          } catch {}
          toast.success('Welcome to PredictPro! Your free account is active. 🎉');
          setOpen(false);
          setIsGateLocked(false);
          return;
        }

        if (signUpData?.session && signUpData?.user) {
          await syncUserProfileActivity(signUpData.user);
          try {
            localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
            localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
          } catch {}
          toast.success('Welcome to PredictPro! Your free account is active. 🎉');
          setOpen(false);
          setIsGateLocked(false);
          return;
        }

        if (isExistingObfuscatedUser) {
          toast.info('An account with this email already exists. Please sign in with your password or Google.');
          setMode('login');
          return;
        }

        setPendingVerificationEmail(cleanEmail);
        setMode('login');
        toast.success('Account created! Click the confirmation link sent to your email to sign in.');
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

      if (!loginData?.session || !loginData?.user) {
        throw new Error('Unable to establish login session. Please try again.');
      }

      await syncUserProfileActivity(loginData.session.user);
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
        localStorage.removeItem(STORAGE_GATE_LOCKED_KEY);
      } catch {}
      setPendingVerificationEmail(null);
      toast.success('Welcome back to PredictPro! 🎉');
      setOpen(false);
      setIsGateLocked(false);
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

  if (authLoading || user || isExempt || isAutomatedCrawler()) return null;
  if (!open && knownAccount) return null;

  const showModal = open;

  return (
    <>
      {/* Account Modal (Opened only on explicit user action) */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mandatory-auth-gate-title"
          className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="w-full max-w-[460px] rounded-2xl border border-border/80 bg-background shadow-2xl overflow-hidden my-auto relative">
            <button
              type="button"
              onClick={handleClosePreviewModal}
              aria-label="Close dialog"
              className="absolute top-4 right-4 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Top Accent Header */}
            <div className="bg-card border-b border-border/60 px-6 pt-6 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  {isGateLocked
                    ? 'Guest Preview Ended · Member Account Required'
                    : '100% Free Forever · Zero Paywalls'}
                </span>
              </div>

              <div className="space-y-1.5 text-left">
                <h2
                  id="mandatory-auth-gate-title"
                  className="text-xl sm:text-2xl font-black tracking-tight text-foreground"
                >
                  {mode === 'register'
                    ? isGateLocked
                      ? 'Create Your Free Account to Continue Browsing'
                      : 'Create Your Free PredictPro Account'
                    : mode === 'login'
                      ? 'Sign In to Your PredictPro Account'
                      : 'Reset Your Account Password'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {mode === 'register'
                    ? 'Your free guest preview has concluded. Create a free member account in 10 seconds to unlock full access to all daily AI predictions, live match telemetry, jackpot bankers, and 50 welcome coins.'
                    : mode === 'login'
                      ? 'Sign in with your email or Google account to unlock immediate site access.'
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
                          className="text-[11px] text-primary hover:underline"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    : 'Need a free account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                    className="font-bold text-primary hover:underline"
                  >
                    {mode === 'register' ? 'Sign In' : 'Create Free Account'}
                  </button>
                </span>

                <button
                  type="button"
                  onClick={handleClosePreviewModal}
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Continue browsing
                </button>
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
