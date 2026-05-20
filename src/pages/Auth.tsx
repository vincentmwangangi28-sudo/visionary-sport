import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Trophy, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

const signInSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
const signUpSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100)
    .regex(/^[a-zA-Z\s-]+$/, 'Name can only contain letters, spaces, and hyphens'),
});

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Divider = () => (
  <div className="relative my-1">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
    </div>
  </div>
);

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', referralCode: '' });

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Browser redirects — loading stays true until redirect completes
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signInSchema.safeParse(signInData);
    if (!result.success) { toast.error(result.error.errors[0]?.message ?? 'Invalid input'); return; }
    setLoading(true);
    try { await signIn(result.data.email, result.data.password); }
    finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) { toast.error(result.error.errors[0]?.message ?? 'Invalid input'); return; }
    setLoading(true);
    try {
      await signUp(result.data.email, result.data.password, result.data.fullName);
      // Apply referral code if provided
      if (signUpData.referralCode.trim()) {
        const { data: userData } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
        if (userData.user) {
          const { supabase: sb } = await import('@/integrations/supabase/client');
          await sb.functions.invoke('apply-referral-on-signup', {
            body: { referralCode: signUpData.referralCode.trim(), userId: userData.user.id },
          });
          toast.success('Referral applied! You earned 50 coins 🎉');
        }
      }
      if (typeof window !== 'undefined' && (window as Window & { gtag?: (...a: unknown[]) => void }).gtag) {
        (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'sign_up', { method: 'email' });
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to Visionary Sport — AI-powered football predictions" url="/auth" />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Visionary Sport
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">AI-powered football predictions</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ── SIGN IN ─────────────────────────────────── */}
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to access your predictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <Button
                    variant="outline"
                    className="w-full gap-3 h-11 font-medium border-border hover:bg-muted/50"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                    {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                  </Button>

                  <Divider />

                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" placeholder="you@example.com" autoComplete="email"
                        value={signInData.email} onChange={e => setSignInData(d => ({ ...d, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" placeholder="••••••••" autoComplete="current-password"
                        value={signInData.password} onChange={e => setSignInData(d => ({ ...d, password: e.target.value }))} required />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SIGN UP ─────────────────────────────────── */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>Get started with 100 free coins 🪙</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <Button
                    variant="outline"
                    className="w-full gap-3 h-11 font-medium border-border hover:bg-muted/50"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                    {googleLoading ? 'Redirecting to Google…' : 'Sign up with Google'}
                  </Button>

                  <Divider />

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" type="text" placeholder="John Doe" autoComplete="name"
                        value={signUpData.fullName} onChange={e => setSignUpData(d => ({ ...d, fullName: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="you@example.com" autoComplete="email"
                        value={signUpData.email} onChange={e => setSignUpData(d => ({ ...d, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" placeholder="Min 8 characters" autoComplete="new-password"
                        value={signUpData.password} onChange={e => setSignUpData(d => ({ ...d, password: e.target.value }))} required minLength={8} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-referral">Referral Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input id="signup-referral" type="text" placeholder="e.g. ABC123" autoComplete="off"
                        value={signUpData.referralCode} onChange={e => setSignUpData(d => ({ ...d, referralCode: e.target.value }))} />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</> : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </>
  );
}
