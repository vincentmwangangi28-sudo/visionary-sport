import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Database,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  Server,
  Lock,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { supabase, DEFAULT_SUPABASE_URL } from '@/integrations/supabase/client';
import { useSupabaseWalkthrough } from '@/hooks/useSupabaseWalkthrough';
import { SupabaseWalkthroughModal } from '@/components/SupabaseWalkthroughModal';
import { PRIMARY_ADMIN_NAME, PRIMARY_ADMIN_EMAIL } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface TableHealth {
  tableName: string;
  count: number | null;
  status: 'healthy' | 'error' | 'loading';
  error?: string;
}

export function AdminDatabaseTab() {
  const {
    isOpen,
    status,
    openWalkthrough,
    closeWalkthrough,
    inject,
    reset,
    testConnection,
    shouldShowFallbackNotice,
  } = useSupabaseWalkthrough();

  const [testingPing, setTestingPing] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);

  const [tableHealths, setTableHealths] = useState<TableHealth[]>([
    { tableName: 'predictions', count: null, status: 'loading' },
    { tableName: 'profiles', count: null, status: 'loading' },
    { tableName: 'transactions', count: null, status: 'loading' },
    { tableName: 'subscriptions', count: null, status: 'loading' },
    { tableName: 'error_logs', count: null, status: 'loading' },
    { tableName: 'user_roles', count: null, status: 'loading' },
  ]);
  const [refreshingTables, setRefreshingTables] = useState(false);

  // Quick session injection state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickKey, setQuickKey] = useState('');

  // Ping Supabase latency
  const handleTestLatency = useCallback(async () => {
    setTestingPing(true);
    const start = performance.now();
    try {
      const res = await testConnection(status.activeUrl, status.activeAnonKey);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setLastPingAt(new Date().toLocaleTimeString());
      if (res.success) {
        toast.success(`Supabase Connection Verified (${elapsed}ms latency)`);
      } else {
        toast.error(`Connection check warning: ${res.message || 'Check project status'}`);
      }
    } catch (err: any) {
      setLatencyMs(null);
      toast.error(`Ping failed: ${err.message || 'Network error'}`);
    } finally {
      setTestingPing(false);
    }
  }, [status.activeUrl, status.activeAnonKey, testConnection]);

  // Load table counts
  const loadTableCounts = useCallback(async () => {
    setRefreshingTables(true);
    const tables = ['predictions', 'profiles', 'transactions', 'subscriptions', 'error_logs', 'user_roles'];
    const results: TableHealth[] = [];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({ tableName: table, count: null, status: 'error', error: error.message });
        } else {
          results.push({ tableName: table, count: count ?? 0, status: 'healthy' });
        }
      } catch (err: any) {
        results.push({ tableName: table, count: null, status: 'error', error: err?.message || 'Failed' });
      }
    }

    setTableHealths(results);
    setRefreshingTables(false);
  }, []);

  useEffect(() => {
    loadTableCounts();
    handleTestLatency();
  }, [loadTableCounts, handleTestLatency]);

  const handleQuickInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim() || !quickKey.trim()) {
      toast.error('Please enter both Supabase Project URL and Anon API Key');
      return;
    }
    const res = inject(quickUrl.trim(), quickKey.trim());
    if (res.success) {
      toast.success('Custom Supabase session credentials saved successfully');
      setQuickUrl('');
      setQuickKey('');
      loadTableCounts();
      handleTestLatency();
    } else {
      toast.error(res.error || 'Invalid credentials format');
    }
  };

  const handleResetSessionKeys = () => {
    reset();
    toast.info('Session credentials cleared. Reverted to system environment defaults.');
    loadTableCounts();
    handleTestLatency();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Privileged Isolation Notice */}
      <Card className="border-teal-500/30 bg-teal-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-500 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                Supabase Cloud Database &amp; Cluster Manager
              </h3>
              <Badge variant="outline" className="text-[10px] text-teal-500 border-teal-500/30 font-semibold">
                Sole Admin Access: {PRIMARY_ADMIN_NAME}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Database connection settings and fallback alerts have been securely moved from public view into your private admin dashboard.
              You have exclusive authority to inspect PostgreSQL tables, verify cluster latency, and inject custom API credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={openWalkthrough}
              className="gap-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Launch Setup Walkthrough
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sensitive Fallback Notice: Now visible ONLY to Vincent Mwangangi in this tab */}
      {status.isFallback && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Supabase Fallback Environment Active</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
              Admin Confidential
            </Badge>
          </div>
          <p className="leading-relaxed text-muted-foreground text-[11px]">
            The system is operating with built-in fallback configurations. All client predictions, statistical algorithms,
            and caching mechanisms remain fully operative. To connect your live Supabase cloud instance, enter your credentials below
            or launch the setup walkthrough.
          </p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Connection Status */}
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Connection Status</CardDescription>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                {status.isFallback ? 'Fallback Mode' : 'Connected'}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  status.isFallback
                    ? 'border-amber-500/40 text-amber-500 bg-amber-500/10'
                    : 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                }`}
              >
                {status.isFallback ? 'Standby' : 'Live Cloud'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Endpoint:</span>
              <span className="font-mono text-foreground font-semibold truncate max-w-[170px]" title={status.activeUrl}>
                {status.activeUrl.replace('https://', '')}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Credential Source:</span>
              <span className="text-foreground font-medium">
                {status.isSessionInjected ? 'Admin Session Injected' : status.isFallback ? 'Default Fallback' : 'Build Environment'}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>SSL / TLS Encryption:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Enabled (HTTPS)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Cluster Latency */}
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">PostgreSQL Latency Ping</CardDescription>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                {latencyMs !== null ? `${latencyMs} ms` : 'Measuring...'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestLatency}
                disabled={testingPing}
                className="h-7 px-2 text-xs gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${testingPing ? 'animate-spin' : ''}`} />
                Ping
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Last Tested:</span>
              <span className="text-foreground font-mono">{lastPingAt || 'Pending'}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Target Table:</span>
              <span className="font-mono text-foreground">public.predictions</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Performance Tier:</span>
              <span className="text-emerald-500 font-semibold">
                {latencyMs !== null && latencyMs < 100 ? 'Optimal (<100ms)' : 'Acceptable'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Admin Authority */}
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Root Access Authority</CardDescription>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>{PRIMARY_ADMIN_NAME}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Authorized Email:</span>
              <span className="font-mono text-foreground font-semibold truncate max-w-[170px]" title={PRIMARY_ADMIN_EMAIL}>
                {PRIMARY_ADMIN_EMAIL}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Access Level:</span>
              <span className="text-primary font-bold">Sole Root Administrator</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Public Exposure:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fully Removed
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Record Counts & Status */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-500" />
              <span>PostgreSQL Schema Health &amp; Row Counts</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live record count queries from your Supabase database schema
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTableCounts}
            disabled={refreshingTables}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingTables ? 'animate-spin' : ''}`} />
            <span>Refresh Counts</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {tableHealths.map((th) => (
              <div
                key={th.tableName}
                className="p-3 rounded-xl border border-border/70 bg-muted/30 flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-foreground truncate" title={th.tableName}>
                    {th.tableName}
                  </span>
                  {th.status === 'healthy' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : th.status === 'loading' ? (
                    <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {th.count !== null ? th.count.toLocaleString() : '—'}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {th.status === 'healthy' ? 'Active Table' : th.status === 'loading' ? 'Querying...' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Direct Session Key Injector for Vincent Mwangangi */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Quick Supabase Credential Injector (Admin Session)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Directly bind your custom Supabase Project URL and Anon API Key to this administrator session without redeploying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickInject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-supabase-url" className="text-xs font-semibold">
                  Supabase Project URL
                </Label>
                <Input
                  id="admin-supabase-url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-supabase-key" className="text-xs font-semibold">
                  Supabase Anon / Public API Key
                </Label>
                <Input
                  id="admin-supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={quickKey}
                  onChange={(e) => setQuickKey(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Apply Credentials to Session
                </Button>

                {status.isSessionInjected && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetSessionKeys}
                    className="h-8 text-xs text-rose-500 hover:text-rose-600 border-rose-500/30 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Default
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openWalkthrough}
                className="h-8 text-xs text-teal-600 dark:text-teal-400 gap-1 hover:underline"
              >
                <span>Step-by-Step Guided Setup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Supabase Walkthrough Modal (Triggered solely from Admin Dashboard) */}
      <SupabaseWalkthroughModal
        isOpen={isOpen}
        onClose={closeWalkthrough}
        status={status}
        onInject={inject}
        onReset={reset}
        onTestConnection={testConnection}
      />
    </div>
  );
}
