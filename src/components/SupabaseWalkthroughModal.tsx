import React, { useState, useEffect } from 'react';
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
  Database,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Activity,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  Lock,
  Server,
  Radio,
} from 'lucide-react';
import {
  SupabaseConfigStatus,
  DEFAULT_SUPABASE_URL,
} from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupabaseWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SupabaseConfigStatus;
  onInject: (url: string, key: string) => { success: boolean; error?: string };
  onReset: () => void;
  onTestConnection: (
    url: string,
    key: string
  ) => Promise<{ success: boolean; latencyMs: number; error?: string; message?: string }>;
}

export const SupabaseWalkthroughModal: React.FC<SupabaseWalkthroughModalProps> = ({
  isOpen,
  onClose,
  status,
  onInject,
  onReset,
  onTestConnection,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    error?: string;
    message?: string;
  } | null>(null);

  // Auto-populate inputs if session credentials already exist or when opening
  useEffect(() => {
    if (isOpen) {
      if (status.isSessionInjected) {
        const sessionUrl = window.sessionStorage.getItem('predictpro_session_supabase_url') || '';
        const sessionKey = window.sessionStorage.getItem('predictpro_session_supabase_key') || '';
        setInputUrl(sessionUrl);
        setInputKey(sessionKey);
      } else if (status.activeUrl && status.activeUrl !== DEFAULT_SUPABASE_URL) {
        setInputUrl((prev) => prev || status.activeUrl);
      }
      setTestResult(null);
    }
  }, [isOpen, status]);

  const handleTest = async () => {
    if (!inputUrl.trim() || !inputKey.trim()) {
      toast.error('Please enter both Supabase Project URL and Anon Key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await onTestConnection(inputUrl, inputKey);
      setTestResult({
        tested: true,
        success: res.success,
        latencyMs: res.latencyMs,
        error: res.error,
        message: res.message,
      });

      if (res.success) {
        toast.success(`Connection verified in ${res.latencyMs}ms!`);
      } else {
        toast.error(res.error || 'Connection check failed');
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        error: err?.message || 'Failed to ping Supabase endpoint',
      });
      toast.error('Connection probe failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleApply = () => {
    if (!inputUrl.trim() || !inputKey.trim()) {
      toast.error('Both Supabase URL and Key are required');
      return;
    }

    const res = onInject(inputUrl, inputKey);
    if (res.success) {
      toast.success('Supabase credentials successfully injected for this session!');
      onClose();
    } else {
      toast.error(res.error || 'Failed to inject credentials');
    }
  };

  const handleReset = () => {
    onReset();
    setInputUrl('');
    setInputKey('');
    setTestResult(null);
    toast.info('Session credentials cleared. Reverted to default configuration.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 overflow-hidden text-card-foreground">
        {/* Header with Step Progress */}
        <div className="bg-muted/40 border-b border-border/80 px-6 py-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                  Supabase Session &amp; Environment Setup
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Detect configuration status and securely inject project credentials for this browser session.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span className="truncate">1. Detection</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors ${
                currentStep === 2
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span className="truncate">2. Key Finder</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors ${
                currentStep === 3
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span className="truncate">3. Inject &amp; Test</span>
            </button>
          </div>
        </div>

        {/* Step Body */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* STEP 1: DETECTION & CURRENT STATUS */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Status Overview Card */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {status.isSessionInjected ? (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    ) : status.hasEnvUrl && status.hasEnvKey ? (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Active Connection Status
                    </span>
                  </div>

                  {/* Clean unboxed status indicator */}
                  <div className="text-xs font-semibold">
                    {status.isSessionInjected ? (
                      <span className="text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Session Injected (Temporary)
                      </span>
                    ) : status.hasEnvUrl && status.hasEnvKey ? (
                      <span className="text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Built-in Environment (.env)
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Using Shared Platform Fallback
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="pt-2 border-t border-border/60 text-xs space-y-2 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target URL:</span>
                    <span className="font-mono text-foreground font-medium truncate max-w-[280px]">
                      {status.activeUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Environment Variables (VITE_SUPABASE_*):</span>
                    <span className="text-foreground font-medium">
                      {status.hasEnvUrl && status.hasEnvKey
                        ? 'Configured in Build'
                        : 'Missing or Default in Build'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Session Injected:</span>
                    <span className="text-foreground font-medium">
                      {status.isSessionInjected ? 'Active in sessionStorage' : 'None active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Supabase Powers */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What Supabase Powers in PredictPro
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">AI Predictions &amp; Fixtures</span>
                      <span className="text-muted-foreground text-[11px] leading-relaxed">
                        Caches live mathematical projections and xG metrics across devices.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">User Authentication &amp; VIP</span>
                      <span className="text-muted-foreground text-[11px] leading-relaxed">
                        Manages secure user logins, bankroll histories, and subscription tiers.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Push Notifications</span>
                      <span className="text-muted-foreground text-[11px] leading-relaxed">
                        Dispatches kick-off and dropping odds alerts to your browser.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
                    <Server className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Error &amp; Crash Logging</span>
                      <span className="text-muted-foreground text-[11px] leading-relaxed">
                        Centralizes client telemetry into the error_logs table without crashing.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidance Notice */}
              <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">
                    Custom Project Key Injection
                  </span>
                  If your hosting environment lacks <code className="text-primary font-mono text-[11px]">.env</code> keys, you can inject your personal or team Supabase project credentials for the duration of this browser session.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: WHERE TO FIND YOUR KEYS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Where to locate your Supabase API credentials
                </h4>
                <p className="text-xs text-muted-foreground">
                  Follow these 3 quick steps inside your Supabase project dashboard:
                </p>
              </div>

              {/* Step list */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-muted/20 border border-border/70 flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Log into Supabase &amp; Open Your Project</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Visit the Supabase Console and open the project you want PredictPro to connect to.
                    </p>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold text-[11px] pt-1"
                    >
                      <span>Open Supabase Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/20 border border-border/70 flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Go to Project Settings &rarr; API</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      In the bottom-left sidebar of your project, click the <strong className="text-foreground">Settings (gear icon)</strong>, then click <strong className="text-foreground">API</strong> under Project Settings.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/20 border border-border/70 flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-foreground">Copy Project URL &amp; Public Anon Key</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Copy the <strong className="text-foreground">Project URL</strong> (e.g.{' '}
                      <code className="text-primary font-mono">https://xyzcompany.supabase.co</code>) and the{' '}
                      <strong className="text-foreground">anon / public key</strong> (starts with <code className="text-primary font-mono">eyJ...</code>).
                    </p>
                    <div className="p-2 rounded bg-background/80 border border-border/60 text-[11px] font-mono text-muted-foreground space-y-1">
                      <div><span className="text-primary">VITE_SUPABASE_URL</span>=https://&lt;project-ref&gt;.supabase.co</div>
                      <div><span className="text-primary">VITE_SUPABASE_PUBLISHABLE_KEY</span>=eyJhbGciOiJI...</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Never use the <code className="text-rose-400 font-mono text-[11px]">service_role</code> key in the frontend client.</span>
                <span className="text-[11px] text-primary font-semibold">Only public anon key</span>
              </div>
            </div>
          )}

          {/* STEP 3: INJECT & TEST FOR CURRENT SESSION */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="supabase-url" className="text-xs font-semibold">
                    Supabase Project URL
                  </Label>
                  <Input
                    id="supabase-url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      setTestResult(null);
                    }}
                    className="font-mono text-xs h-9 bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must start with <code className="text-primary">https://</code> and end with{' '}
                    <code className="text-primary">.supabase.co</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supabase-key" className="text-xs font-semibold">
                      Supabase Anon / Publishable Key
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                    >
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showKey ? 'Hide key' : 'Show key'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="supabase-key"
                      type={showKey ? 'text' : 'password'}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={inputKey}
                      onChange={(e) => {
                        setInputKey(e.target.value);
                        setTestResult(null);
                      }}
                      className="font-mono text-xs h-9 bg-background pr-10"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your public anon JWT key from Project Settings &gt; API.
                  </p>
                </div>
              </div>

              {/* Test Connection Button & Indicator */}
              <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs">
                    <span className="font-semibold text-foreground block">Live Connection Health Check</span>
                    <span className="text-[11px] text-muted-foreground">
                      Probe the endpoint to verify CORS and key validity before saving.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={isTesting || !inputUrl.trim() || !inputKey.trim()}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </Button>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`p-2.5 rounded-md text-xs border ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {testResult.success ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-semibold block">Connection Successful</span>
                          <span className="text-[11px] opacity-90">
                            Roundtrip response: {testResult.latencyMs}ms. Ready to inject for this session.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Connection Test Failed</span>
                          <span className="text-[11px] opacity-90">
                            {testResult.error || 'Unable to communicate with the Supabase API.'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security Privacy Assurance */}
              <div className="p-3 rounded-lg bg-background border border-border/80 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Session-Only Memory Isolation</span>
                </div>
                <p className="leading-relaxed">
                  Credentials injected here are stored exclusively in this browser tab's temporary memory (
                  <code className="text-primary font-mono">sessionStorage</code>). They are never sent to external servers, logged, or saved to persistent disk. Closing the browser tab cleans them automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-muted/40 border-t border-border/80 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            {status.isSessionInjected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to Default</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="h-8 text-xs font-semibold gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={!inputUrl.trim() || !inputKey.trim()}
                className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply for this Session</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
