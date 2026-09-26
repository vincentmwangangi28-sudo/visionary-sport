import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_ENGAGED_SECONDS_KEY = 'predictpro_visitor_engaged_seconds_v1';
const STORAGE_PAGE_VIEWS_KEY = 'predictpro_visitor_page_views_v1';
const STORAGE_DISMISSED_AT_KEY = 'predictpro_signup_popup_dismissed_at_v1';
const STORAGE_COMPLETED_KEY = 'predictpro_signup_popup_completed_v1';

// Trigger after 2 minutes (120 seconds) of cumulative browsing on site,
// or after 75 seconds if the visitor has already explored 3+ pages.
const TRIGGER_SECONDS_DEFAULT = 120;
const TRIGGER_SECONDS_MULTI_PAGE = 75;
// Snooze for 24 hours if dismissed
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const FirstVisitSignupModal: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const isAuthPage = location.pathname.startsWith('/auth');

  // Track route views for first-time visitors
  useEffect(() => {
    if (authLoading || user) return;
    try {
      const prevViews = parseInt(localStorage.getItem(STORAGE_PAGE_VIEWS_KEY) || '0', 10);
      localStorage.setItem(STORAGE_PAGE_VIEWS_KEY, String(prevViews + 1));
    } catch {
      // Ignore storage quota errors
    }
  }, [location.pathname, user, authLoading]);

  // Listen for manual open event (e.g. from any CTA or test trigger)
  useEffect(() => {
    const handleCustomOpen = () => {
      if (!user) {
        setMode('register');
        setOpen(true);
      }
    };
    window.addEventListener('open-first-visit-signup', handleCustomOpen);
    return () => window.removeEventListener('open-first-visit-signup', handleCustomOpen);
  }, [user]);

  // Close automatically if user logs in
  useEffect(() => {
    if (user && open) {
      setOpen(false);
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
      } catch {
        // Ignore
      }
    }
  }, [user, open]);

  // Cumulative active time tracker for first-time unauthenticated visitors
  useEffect(() => {
    if (authLoading || user || isAuthPage || open) return;

    try {
      if (localStorage.getItem(STORAGE_COMPLETED_KEY) === 'true') return;
      const dismissedAt = parseInt(localStorage.getItem(STORAGE_DISMISSED_AT_KEY) || '0', 10);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
        return;
      }
    } catch {
      // Proceed with in-memory timer if localStorage is restricted
    }

    const interval = setInterval(() => {
      // Only count time when the browser tab is visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      try {
        const currentSeconds =
          parseInt(localStorage.getItem(STORAGE_ENGAGED_SECONDS_KEY) || '0', 10) + 5;
        localStorage.setItem(STORAGE_ENGAGED_SECONDS_KEY, String(currentSeconds));

        const pageViews = parseInt(localStorage.getItem(STORAGE_PAGE_VIEWS_KEY) || '1', 10);
        const targetThreshold =
          pageViews >= 3 ? TRIGGER_SECONDS_MULTI_PAGE : TRIGGER_SECONDS_DEFAULT;

        if (currentSeconds >= targetThreshold) {
          setOpen(true);
          clearInterval(interval);
        }
      } catch {
        // Fallback if localStorage is unavailable
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authLoading, user, isAuthPage, open]);

  const handleDismiss = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      try {
        localStorage.setItem(STORAGE_DISMISSED_AT_KEY, String(Date.now()));
      } catch {
        // Ignore
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const displayName = fullName.trim() || cleanEmail.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: displayName },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');

        // If session is returned immediately (auto-confirm enabled), close modal
        if (data.session) {
          toast.success('Welcome to PredictPro! Your free account is active.');
          setOpen(false);
        } else {
          setAccountCreated(true);
          toast.success('Account created! Please check your email to confirm.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
        toast.success('Welcome back to PredictPro!');
        setOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to complete request';
      if (msg.toLowerCase().includes('already registered')) {
        toast.info('An account with this email already exists. Please sign in.');
        setMode('login');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (user) return null;

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-border/80 bg-background shadow-2xl">
        {/* Top Accent Header */}
        <div className="bg-card border-b border-border/60 px-6 pt-6 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
            <span>Free Member Access</span>
            <span aria-hidden="true">·</span>
            <span>50 Welcome Coins Included</span>
          </div>
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {accountCreated
                ? 'Check Your Inbox to Activate'
                : mode === 'register'
                  ? 'Save Your Picks & Unlock Daily AI Banker Alerts'
                  : 'Sign In to Your PredictPro Account'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {accountCreated
                ? `We sent a confirmation link to ${email}. Click the link to unlock your personalized dashboard and 50 bonus coins.`
                : mode === 'register'
                  ? 'Join 10,000+ football analysts tracking live Expected Goals (xG), +EV value bets, and multi-match accumulators.'
                  : 'Access your saved accumulator slips, bankroll tracker, and personalized league alerts.'}
            </DialogDescription>
          </DialogHeader>

          {!accountCreated && mode === 'register' && (
            <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-border/50 text-xs">
              <div className="flex items-start gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-muted-foreground leading-tight">Daily 80%+ Banker Locks</span>
              </div>
              <div className="flex items-start gap-1.5">
                <BookmarkCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-muted-foreground leading-tight">Sync &amp; Save Bet Slips</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-muted-foreground leading-tight">Sharp Odds Steam Alerts</span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {accountCreated ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground">
                Already clicked the verification link? Sign in below to continue right where you left off.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAccountCreated(false);
                    setMode('login');
                  }}
                >
                  Sign In Now
                </Button>
                <Button size="sm" onClick={() => handleDismiss(false)}>
                  Continue Browsing
                </Button>
              </div>
            </div>
          ) : (
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
                    or use your email address
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                        type="text"
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
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-9 text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="popup-password" className="text-xs font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="popup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
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

                <Button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="w-full h-10 font-bold text-xs sm:text-sm mt-1"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {mode === 'register'
                    ? 'Create Free Account & Claim 50 Coins'
                    : 'Sign In to PredictPro'}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>
                  {mode === 'register' ? 'Already have an account?' : 'Need a free account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                    className="font-bold text-primary hover:underline"
                  >
                    {mode === 'register' ? 'Sign In' : 'Create Account'}
                  </button>
                </span>

                <button
                  type="button"
                  onClick={() => handleDismiss(false)}
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Maybe later
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
