import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Invalid email format').max(255);

interface MagicLinkFormProps {
  onBack: () => void;
}

export default function MagicLinkForm({ onBack }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: validation.data,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      setSent(true);
      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Check your email!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn't receive it? Check your spam folder or try again.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setSent(false)}
          >
            Try Again
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendMagicLink} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <span className="font-medium">Sign in with Magic Link</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a link to sign in — no password needed.
      </p>
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </form>
  );
}
