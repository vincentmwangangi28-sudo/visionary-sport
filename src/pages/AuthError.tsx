import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Sparkles, ArrowLeft, Copy, Trash2, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { clearOAuthLog, getOAuthLog, logOAuth, friendlyOAuthError } from '@/lib/oauthLogger';

export default function AuthError() {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [params] = useSearchParams();
  const [logEntries, setLogEntries] = useState(() => getOAuthLog());

  const rawError =
    params.get('error_description') || params.get('error') || params.get('authError') || '';
  const friendly = friendlyOAuthError(rawError);

  useEffect(() => {
    if (rawError) {
      logOAuth({
        level: 'error',
        provider: 'google',
        stage: 'callback',
        message: friendly.title,
        context: { raw: rawError, search: window.location.search },
      });
      setLogEntries(getOAuthLog());
    }
  }, [rawError, friendly.title]);

  const handleSwitchToManaged = async () => {
    setSwitching(true);
    logOAuth({ level: 'info', provider: 'google', stage: 'retry-managed', message: 'User clicked managed retry' });
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: { prompt: 'select_account' },
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate('/');
    } catch (err: any) {
      const f = friendlyOAuthError(err?.message);
      logOAuth({
        level: 'error',
        provider: 'google',
        stage: 'retry-managed-error',
        message: f.title,
        context: { raw: err?.message },
      });
      toast.error(f.title, { description: f.message });
      setSwitching(false);
    }
  };

  const copyDebug = async () => {
    const payload = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      rawError,
      entries: logEntries,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Debug info copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleClear = () => {
    clearOAuthLog();
    setLogEntries([]);
    toast.success('Debug log cleared');
  };

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
                <CardDescription>{friendly.title}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Alert>
              <AlertTitle>What happened</AlertTitle>
              <AlertDescription className="mt-1 text-sm text-muted-foreground break-words">
                {friendly.message}
              </AlertDescription>
            </Alert>

            {friendly.hint && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-1">How to fix it</p>
                <p className="text-muted-foreground">{friendly.hint}</p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => navigate('/auth')} className="w-full" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Try again
              </Button>
              <Button onClick={handleSwitchToManaged} disabled={switching} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                {switching ? 'Switching…' : 'Use managed Google'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Managed Google login uses Lovable's pre-approved OAuth app — no Google Cloud setup needed.
            </p>

            <Collapsible className="rounded-lg border bg-muted/20">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-muted/40 rounded-lg">
                  <span>Debug details ({logEntries.length} events)</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 space-y-3">
                {rawError && (
                  <div className="text-xs">
                    <div className="font-medium mb-1">Raw error</div>
                    <pre className="whitespace-pre-wrap break-all rounded bg-background p-2 text-muted-foreground">
                      {rawError}
                    </pre>
                  </div>
                )}
                <div className="text-xs">
                  <div className="font-medium mb-1">Recent events</div>
                  <div className="max-h-56 overflow-auto space-y-1 rounded bg-background p-2">
                    {logEntries.length === 0 ? (
                      <p className="text-muted-foreground">No events recorded yet.</p>
                    ) : (
                      logEntries
                        .slice()
                        .reverse()
                        .map((e, i) => (
                          <div key={i} className="font-mono text-[11px] leading-relaxed">
                            <span
                              className={
                                e.level === 'error'
                                  ? 'text-destructive'
                                  : e.level === 'warn'
                                  ? 'text-yellow-500'
                                  : 'text-muted-foreground'
                              }
                            >
                              [{e.ts.split('T')[1]?.slice(0, 8)}] {e.level.toUpperCase()}
                            </span>{' '}
                            <span className="text-foreground">
                              {e.provider}:{e.stage}
                            </span>{' '}
                            — {e.message}
                          </div>
                        ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyDebug} className="flex-1">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy debug info
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

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
