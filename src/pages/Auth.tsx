import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success('Password reset email sent! Check your inbox.');
        setMode('login');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        if (!password || password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName || email.split('@')[0] } },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to verify your account.');
        setLoading(false);
        return;
      }

      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('Invalid login credentials')) toast.error('Wrong email or password. Try again.');
      else if (msg.includes('Email not confirmed')) toast.error('Please verify your email first. Check your inbox.');
      else if (msg.includes('User already registered')) { toast.error('Account exists. Sign in instead.'); setMode('login'); }
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SEO title={`${mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'} | PredictPro`}
        description="Sign in or create your PredictPro account for AI football predictions." canonical="/auth" noIndex />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black">PP</div>
          <span className="font-bold text-xl">PredictPro</span>
        </Link>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to your PredictPro account' :
               mode === 'register' ? 'Join 10,000+ members getting AI predictions' :
               "We'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Your name" value={fullName}
                  onChange={e => setFullName(e.target.value)} disabled={loading} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={loading} autoComplete="email" />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-10"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={loading} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {mode === 'login' && (
                  <button onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline float-right">
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 mt-2" size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> :
               <Zap className="h-4 w-4" aria-hidden="true" />}
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-2">
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="text-primary font-medium hover:underline">Sign up free</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline">Sign in</button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing you agree to our{' '}
          <Link to="/about" className="underline hover:text-primary">Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
}
