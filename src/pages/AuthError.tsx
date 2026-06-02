import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

const KNOWN_ERRORS: Record<string, { title: string; description: string; fix: string }> = {
  redirect_uri_mismatch: {
    title: 'Redirect URL not allowed',
    description:
      "Your Google OAuth client doesn't have this app's callback URL registered. Google blocks the sign-in until the URL is added.",
    fix: 'Add the Lovable callback URLs to your Google Cloud OAuth client, or switch to managed Google login (one click, no setup).',
  },
  access_denied: {
    title: 'Sign-in cancelled',
    description: 'You closed the Google window or denied permission before finishing sign-in.',
    fix: 'Try again and approve the requested permissions to continue.',
  },
  invalid_client: {
    title: 'OAuth client misconfigured',
    description: 'The Google Client ID or Secret saved in your auth settings is invalid or expired.',
    fix: 'Update the credentials in your auth settings, or switch to managed Google login.',
  },
};

export default function AuthError() {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleSwitchToManaged = async () => {
    setSwitching(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: { prompt: 'select_account' },
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate('/');
    } catch (err: any) {
      toast.error(
        err?.message?.includes('redirect_uri_mismatch')
          ? 'Custom Google credentials are still active. Open backend settings to clear them.'
          : err?.message || 'Could not start Google sign-in.'
      );
      setSwitching(false);
    }
  };

  const [params] = useSearchParams();

  const rawError = params.get('error') || params.get('authError') || '';
  const errorKey = Object.keys(KNOWN_ERRORS).find((k) => rawError.toLowerCase().includes(k));
  const details = errorKey ? KNOWN_ERRORS[errorKey] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to home
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>We couldn't sign you in</CardTitle>
                <CardDescription>
                  {details?.title || 'Something went wrong during sign-in.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {details ? (
              <Alert>
                <AlertTitle>What happened</AlertTitle>
                <AlertDescription className="mt-1 text-sm text-muted-foreground">
                  {details.description}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTitle>Unexpected error</AlertTitle>
                <AlertDescription className="mt-1 text-sm text-muted-foreground break-words">
                  {rawError || 'The provider returned an error we did not recognise. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {details && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-1">How to fix it</p>
                <p className="text-muted-foreground">{details.fix}</p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => navigate('/auth')} className="w-full" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Try again
              </Button>
              <Button
                onClick={handleSwitchToManaged}
                disabled={switching}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {switching ? 'Switching…' : 'Use managed Google'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Managed Google login uses Lovable's pre-approved OAuth app — no Google Cloud setup or redirect URL config needed.
            </p>


            <div className="text-center text-sm">
              Still stuck?{' '}
              <Link to="/about" className="text-primary hover:underline">
                Contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
