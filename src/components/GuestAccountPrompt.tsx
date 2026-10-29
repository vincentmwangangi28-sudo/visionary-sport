import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function triggerGuestAccountInvite() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('predictpro:open-account-invite'));
  }
}

export const GuestAccountPrompt: React.FC = () => {
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle } = useAuth();
  const location = useLocation();

  const [expandedModal, setExpandedModal] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const isAuthRoute = location.pathname.startsWith('/auth');

  // Only open when explicitly triggered by the user (never auto-popup on scroll or timer)
  useEffect(() => {
    const handleCustomOpen = () => {
      if (!user) {
        setExpandedModal(true);
      }
    };
    window.addEventListener('predictpro:open-account-invite', handleCustomOpen);
    return () => window.removeEventListener('predictpro:open-account-invite', handleCustomOpen);
  }, [user]);

  const handleDismiss = () => {
    setExpandedModal(false);
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
      toast.error('Please enter a password with at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'register') {
        await signUp(cleanEmail, cleanPassword, fullName.trim() || undefined);
      } else {
        await signIn(cleanEmail, cleanPassword);
      }
      setExpandedModal(false);
    } catch {
      // handled by useAuth
    } finally {
      setSubmitting(false);
    }
  };

  if (!expandedModal || authLoading || user || isAuthRoute) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-account-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 relative">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>PredictPro Account</span>
          </div>
          <h2 id="guest-account-modal-title" className="text-lg font-bold text-foreground">
            {authMode === 'register' ? 'Create Your Free Account' : 'Sign In to PredictPro'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Save your favorite competitions and custom match watchlists across devices.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleSubmitting}
          className="w-full h-10 text-xs font-semibold gap-2"
        >
          {googleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>Continue with Google</span>
        </Button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border" />
          <span className="shrink mx-3 text-[11px] text-muted-foreground uppercase">or email</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          {authMode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="guest-full-name" className="text-xs">Name (Optional)</Label>
              <div className="relative">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  id="guest-full-name"
                  type="text"
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="guest-email" className="text-xs">Email Address</Label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                id="guest-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="guest-password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                id="guest-password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-9 text-xs font-bold">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : authMode === 'register' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-1">
          {authMode === 'register' ? (
            <button type="button" onClick={() => setAuthMode('login')} className="text-primary hover:underline font-medium">
              Already have an account? Sign in
            </button>
          ) : (
            <button type="button" onClick={() => setAuthMode('register')} className="text-primary hover:underline font-medium">
              Need an account? Create one free
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
