import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBetSlip } from '@/hooks/useBetSlip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  X,
  CheckCircle2,
  ShieldCheck,
  Gift,
  BookmarkCheck,
  BellRing,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const DISMISS_STORAGE_KEY = 'predictpro_guest_invite_dismissed_at';
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function triggerGuestAccountInvite() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('predictpro:open-account-invite'));
  }
}

export const GuestAccountPrompt: React.FC = () => {
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle } = useAuth();
  const { selections } = useBetSlip();
  const location = useLocation();

  const [visible, setVisible] = useState(false);
  const [expandedModal, setExpandedModal] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Hide on /auth route or when user is already signed in
  const isAuthRoute = location.pathname.startsWith('/auth');

  useEffect(() => {
    const handleCustomOpen = () => {
      if (!user) {
        setVisible(true);
        setExpandedModal(true);
      }
    };
    window.addEventListener('predictpro:open-account-invite', handleCustomOpen);
    return () => window.removeEventListener('predictpro:open-account-invite', handleCustomOpen);
  }, [user]);

  useEffect(() => {
    if (authLoading || user || isAuthRoute) {
      setVisible(false);
      setExpandedModal(false);
      return;
    }

    // Check if visitor politely dismissed within the last 24h
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || '0');
      if (dismissedAt && Date.now() - dismissedAt < SNOOZE_DURATION_MS) {
        return;
      }
    } catch {
      // ignore storage errors
    }

    // Polite engagement trigger: show after 11 seconds of browsing OR after scrolling down 350px
    let triggered = false;
    const showPolitely = () => {
      if (triggered) return;
      triggered = true;
      setVisible(true);
    };

    const timer = setTimeout(showPolitely, 11000);
    const handleScroll = () => {
      if (window.scrollY > 350) {
        showPolitely();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [authLoading, user, isAuthRoute]);

  // Also gently surface the card if a guest builds a 2+ leg bet slip and hasn't dismissed
  useEffect(() => {
    if (!user && !authLoading && !isAuthRoute && selections.length >= 2) {
      try {
        const dismissedAt = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || '0');
        if (!dismissedAt || Date.now() - dismissedAt >= SNOOZE_DURATION_MS) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    }
  }, [selections.length, user, authLoading, isAuthRoute]);

  const handleDismiss = () => {
    setVisible(false);
    setExpandedModal(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      setGoogleSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      toast.error('Please choose a password with at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'register') {
        await signUp(cleanEmail, cleanPassword, fullName.trim() || undefined);
        setExpandedModal(false);
        setVisible(false);
      } else {
        await signIn(cleanEmail, cleanPassword);
        setExpandedModal(false);
        setVisible(false);
      }
    } catch {
      // toast handled by useAuth
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || user || isAuthRoute) return null;

  return (
    <>
      {/* Polite Floating Concierge Invitation Card (Bottom-Left on Desktop, Above Bottom Nav on Mobile) */}
      {!expandedModal && (
        <aside
          aria-label="Member account invitation"
          className="fixed bottom-16 md:bottom-5 left-3 right-3 sm:left-5 sm:right-auto sm:w-[390px] z-40 rounded-2xl border border-emerald-500/35 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md p-4 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss account invitation"
            className="absolute top-3 right-3 h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Free Member Invite
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  +50 Welcome Coins
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white leading-snug">
                {selections.length > 0
                  ? `Save your ${selections.length}-leg Bet Slip & unlock member perks`
                  : 'Enjoying our AI football predictions?'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join free in 15 seconds to save your accumulator slips across devices, customize your favorite leagues, and claim <strong>+50 VIP Coins</strong>.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-800/90 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setAuthMode('register');
                setExpandedModal(true);
              }}
              className="flex-1 h-9 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleSubmitting}
              className="h-9 px-3 text-xs font-semibold border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white gap-1.5 cursor-pointer"
            >
              {googleSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>Google</span>
            </Button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto text-[11px] text-slate-400 hover:text-slate-200 font-medium px-2 py-1 text-center cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </aside>
      )}

      {/* Polite Inline Quick-Registration Modal (keeps user on the current match page) */}
      {expandedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-invite-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl overflow-hidden">
            {/* Top Emerald Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500" />

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close registration dialog"
              className="absolute top-4 right-4 h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5 pr-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <Gift className="h-3.5 w-3.5" />
                  <span>Free PredictPro Member Account · +50 VIP Coins</span>
                </div>
                <h2 id="guest-invite-modal-title" className="text-xl font-extrabold tracking-tight text-white">
                  {authMode === 'register'
                    ? 'Create Your Free Member Account'
                    : 'Welcome Back to PredictPro'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {authMode === 'register'
                    ? 'Save your daily accumulators, sync booking codes across devices, and personalize your matchday dashboard.'
                    : 'Sign in to access your saved Bet Slips, VIP Coins, and custom league alerts.'}
                </p>
              </div>

              {/* Member Perks Checklist */}
              {authMode === 'register' && (
                <div className="grid grid-cols-1 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <BookmarkCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Save Bet Slips &amp; convert SportyBet, 1xBet &amp; Bet9ja codes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Instant <strong>+50 Welcome VIP Coins</strong> credited to your wallet</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <BellRing className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Late-goal surge &amp; sharp dropping odds alerts for your leagues</span>
                  </div>
                </div>
              )}

              {/* 1-Click Google OAuth */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting || submitting}
                className="w-full h-10 font-bold text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-white gap-2.5 cursor-pointer"
              >
                {googleSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>Continue with Google (1-Click)</span>
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-950 px-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  or with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <Label htmlFor="guest-invite-name" className="text-xs text-slate-300">
                      Your Name (optional)
                    </Label>
                    <div className="relative">
                      <UserIcon className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="guest-invite-name"
                        type="text"
                        placeholder="e.g. Alex"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-8 h-9 text-xs bg-slate-900 border-slate-800 text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="guest-invite-email" className="text-xs text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="guest-invite-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8 h-9 text-xs bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="guest-invite-password" className="text-xs text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="guest-invite-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 h-9 text-xs bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="w-full h-10 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>
                    {authMode === 'register'
                      ? 'Create Free Account & Claim +50 Coins'
                      : 'Sign In to My Account'}
                  </span>
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                  className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  {authMode === 'register'
                    ? 'Already have an account? Sign In'
                    : 'New here? Create a free account'}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Continue as guest
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Free · No credit card required · Unsubscribe anytime</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
