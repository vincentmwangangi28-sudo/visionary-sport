import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff, Zap, ArrowLeft, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { callEdgeFn } from '@/lib/callEdgeFunction';

type Mode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch { setGoogleLoading(false); }
  };

  const handleSubmit = async () => {
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success('Password reset link sent! Check your inbox.');
        setMode('login');
        return;
      }
      if (mode === 'register') {
        if (!password || password.length < 6) { toast.error('Password must be 6+ characters'); return; }
        const refCode = params.get('ref');
        const { data: signUpData, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName || email.split('@')[0], referral_code: refCode || undefined } },
        });
        if (error) throw error;
        if (refCode && signUpData.user) {
          callEdgeFn('apply-referral-on-signup', { referral_code: refCode, new_user_id: signUpData.user.id }).catch(() => {});
        }
        toast.success('Account created! Check your email to verify.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('Invalid login')) toast.error('Wrong email or password.');
      else if (msg.includes('Email not confirmed')) toast.error('Please verify your email first.');
      else if (msg.includes('already registered')) { toast.error('Account exists. Sign in instead.'); setMode('login'); }
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const TITLES = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset your password',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SEO title="Sign In | PredictPro" description="Sign in to PredictPro to access premium AI football predictions." canonical="/auth" noIndex />
      <div className="w-full max-w-md">
        {params.get('ref') && (
          <div className="mb-4 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-sm">
            <Gift className="h-4 w-4 text-primary flex-shrink-0" />
            <span>You were invited! Sign up to give you both <b>50 coins</b>.</span>
          </div>
        )}
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black">PP</div>
            <span className="text-xl font-bold">PredictPro</span>
          </Link>
          <h1 className="text-2xl font-black">{TITLES[mode]}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? 'Access your AI predictions' : mode === 'register' ? 'Join 10,000+ members' : 'We\'ll send you a reset link'}
          </p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardContent className="p-6 space-y-4">
            {/* Google Sign In */}
            {mode !== 'forgot' && (
              <>
                <Button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full gap-3 h-11 border-2 hover:bg-muted/50 font-medium"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"/></div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground">or continue with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Email/Password form */}
            <div className="space-y-3">
              {mode === 'register' && (
                <div>
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="mt-1" />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="you@example.com" className="pl-9" autoComplete="email" />
                </div>
              </div>
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    {mode === 'login' && (
                      <button onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">Forgot password?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input id="password" type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                      className="pl-9 pr-10" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
                    <button onClick={() => setShowPass(s => !s)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 font-semibold gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </Button>

            {/* Mode switchers */}
            <div className="text-center text-sm pt-1">
              {mode === 'login' && (
                <p className="text-muted-foreground">
                  No account? <button onClick={() => setMode('register')} className="text-primary font-medium hover:underline">Sign up free</button>
                </p>
              )}
              {mode === 'register' && (
                <p className="text-muted-foreground">
                  Already have one? <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline">Sign in</button>
                </p>
              )}
              {mode === 'forgot' && (
                <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline flex items-center gap-1 mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing you agree to our{' '}
          <a href="/about" className="underline hover:text-foreground">Terms</a> and{' '}
          <a href="/about" className="underline hover:text-foreground">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
