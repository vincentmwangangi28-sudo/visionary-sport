import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Calendar,
  Database,
  Search,
  Send,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Power,
  ExternalLink,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMatchSync } from '@/hooks/useMatchSync';
import { Switch } from '@/components/ui/switch';

interface CronJobDef {
  id: string;
  name: string;
  schedule: string;
  scheduleDescription: string;
  category: 'Settlement' | 'Predictions' | 'Marketing' | 'SEO' | 'System';
  endpoint: string;
  description: string;
  icon: any;
}

const CRON_JOBS: CronJobDef[] = [
  {
    id: 'settle-results',
    name: 'Prediction Results Settlement',
    schedule: '*/30 * * * *',
    scheduleDescription: 'Every 30 minutes',
    category: 'Settlement',
    endpoint: '/api/settle-results-cron',
    description: 'Grades completed matches (Won / Lost / Void), updates verified strike rate and user bankroll.',
    icon: Trophy,
  },
  {
    id: 'value-bets',
    name: 'Value Bets (+EV) Scanner',
    schedule: '*/20 * * * *',
    scheduleDescription: 'Every 20 minutes',
    category: 'Predictions',
    endpoint: '/api/value-bets-cron',
    description: 'Scans real-time bookmaker odds movements to surface positive expected value discrepancies.',
    icon: Zap,
  },
  {
    id: 'odds-drift',
    name: 'Starting Lineups & Odds Drift',
    schedule: '*/15 * * * *',
    scheduleDescription: 'Every 15 minutes',
    category: 'Predictions',
    endpoint: '/api/odds-drift-cron',
    description: 'Pulls verified starting XIs and monitors market volume shifts to refine AI win probabilities.',
    icon: Activity,
  },
  {
    id: 'daily-predictions',
    name: 'Daily Predictions Batch Engine',
    schedule: '0 4 * * *',
    scheduleDescription: 'Daily at 04:00 UTC',
    category: 'Predictions',
    endpoint: '/api/daily-predictions-cron',
    description: 'Pre-computes top AI Banker of the Day, Over/Under 2.5, BTTS, and Accumulator combinations.',
    icon: Sparkles,
  },
  {
    id: 'jackpot-engine',
    name: 'SportPesa & Betika Direct Jackpot Sync',
    schedule: '*/30 * * * *',
    scheduleDescription: 'Every 30 minutes + Rollover Triggers',
    category: 'Predictions',
    endpoint: '/api/jackpot-cron',
    description: 'Fetches official SportPesa (Mega 17 & Midweek 13), Betika (15M Midweek & 50M MBW), and Mozzart (20) matches, SMS IDs, and live 1X2 odds.',
    icon: Layers,
  },
  {
    id: 'standings-sync',
    name: 'League Standings & Form Matrix',
    schedule: '0 2 * * *',
    scheduleDescription: 'Daily at 02:00 UTC',
    category: 'System',
    endpoint: '/api/standings-cron',
    description: 'Syncs table rankings, home/away points splits, and recent 5-game form matrices for 20+ leagues.',
    icon: Calendar,
  },
  {
    id: 'telegram-broadcast',
    name: 'Morning VIP Telegram Broadcast',
    schedule: '0 7 * * *',
    scheduleDescription: 'Daily at 07:00 UTC',
    category: 'Marketing',
    endpoint: '/api/telegram-broadcast-cron',
    description: 'Auto-posts verified morning AI banker picks and booking codes (SportyBet, Bet9ja) to VIP channels.',
    icon: Send,
  },
  {
    id: 'evening-recap',
    name: 'Evening Results & Strike Rate Recap',
    schedule: '0 22 * * *',
    scheduleDescription: 'Daily at 22:00 UTC',
    category: 'Marketing',
    endpoint: '/api/evening-recap-cron',
    description: 'Posts daily match outcomes and ROI verification summaries to drive VIP conversion.',
    icon: Send,
  },
  {
    id: 'subscription-reminders',
    name: 'VIP Subscription Expiry Radar',
    schedule: '0 9 * * *',
    scheduleDescription: 'Daily at 09:00 UTC',
    category: 'Marketing',
    endpoint: '/api/subscription-reminders-cron',
    description: 'Scans VIP memberships expiring within 72 hours and dispatches automated renewal notifications.',
    icon: Clock,
  },
  {
    id: 'sitemap-generator',
    name: 'Dynamic XML Sitemap Generator',
    schedule: '0 3 * * *',
    scheduleDescription: 'Daily at 03:00 UTC',
    category: 'SEO',
    endpoint: '/api/sitemap-cron',
    description: 'Regenerates public/sitemap.xml with live timestamps, all leagues, tournament hubs, and latest betting predictions.',
    icon: Search,
  },
  {
    id: 'google-crawl',
    name: 'Search Engine Indexing & IndexNow',
    schedule: '0 */4 * * *',
    scheduleDescription: 'Every 4 hours',
    category: 'SEO',
    endpoint: '/api/google-crawl-cron',
    description: 'Submits new match preview URLs to IndexNow (Bing/Yandex) and triggers Googlebot discovery pings.',
    icon: Search,
  },
  {
    id: 'cleanup',
    name: 'Database Cache & Stale Fixture Purge',
    schedule: '0 3 * * 1',
    scheduleDescription: 'Mondays at 03:00 UTC',
    category: 'System',
    endpoint: '/api/cleanup-cron',
    description: 'Archives finished match history over 14 days old to preserve lightweight client-side query speed.',
    icon: Database,
  },
];

interface ExecutionLog {
  status: 'running' | 'success' | 'failed';
  executedAt: string;
  responseSummary?: string;
}

export function AdminCronJobsManager() {
  const [runningMap, setRunningMap] = useState<Record<string, boolean>>({});
  const [logsMap, setLogsMap] = useState<Record<string, ExecutionLog>>({});
  const [runningAll, setRunningAll] = useState(false);
  const matchSync = useMatchSync();

  // Autonomous Daemon status state
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [togglingDaemon, setTogglingDaemon] = useState(false);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);

  // Telegram Config state
  const [tgConfig, setTgConfig] = useState<any>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('@predictproAi');
  const [isSavingTg, setIsSavingTg] = useState(false);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);

  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cron-status');
      if (res.ok) {
        const data = await res.json();
        setSchedulerStatus(data);
      }
    } catch {}
  }, []);

  const fetchTgConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram-config');
      if (res.ok) {
        const data = await res.json();
        setTgConfig(data);
        if (data.chatId) setChatIdInput(data.chatId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSchedulerStatus();
    fetchTgConfig();
    const interval = setInterval(fetchSchedulerStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchSchedulerStatus, fetchTgConfig]);

  const toggleAutonomousDaemon = async (start: boolean) => {
    setTogglingDaemon(true);
    try {
      const res = await fetch('/api/cron-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: start ? 'start' : 'stop' }),
      });
      if (res.ok) {
        toast.success(start ? '24/7 Autonomous Cron Daemon Started!' : 'Autonomous Cron Daemon Paused');
        await fetchSchedulerStatus();
      } else {
        toast.error('Failed to update daemon state');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error controlling daemon');
    } finally {
      setTogglingDaemon(false);
    }
  };

  const handleTriggerHealthCheck = async () => {
    setRunningHealthCheck(true);
    try {
      const res = await fetch('/api/cron-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' }),
      });
      const data = await res.json();
      if (res.ok && data?.result) {
        const hc = data.result;
        if (hc.stalledCount > 0) {
          toast.warning(`Health Check: Re-initialized ${hc.stalledCount} stalled task(s)!`, {
            description: hc.reinitializedTasks.map((t: any) => `${t.name}: ${t.reason}`).join('; '),
          });
        } else {
          toast.success('Health Check: All scheduled tasks are healthy and reporting activity (<60m inactivity)');
        }
        await fetchSchedulerStatus();
      } else {
        toast.error('Health check failed to execute');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing health check');
    } finally {
      setRunningHealthCheck(false);
    }
  };

  const handleSaveTgConfig = async () => {
    if (!chatIdInput.trim()) {
      toast.error('Telegram Chat ID or @Channel is required');
      return;
    }
    setIsSavingTg(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botTokenInput.trim() || undefined,
          channel: chatIdInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgConfig(data);
        toast.success(data.message || 'Telegram Bot settings saved & verified!');
        setBotTokenInput('');
      } else {
        toast.error(data.error || 'Failed to configure Telegram Bot');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving Telegram config');
    } finally {
      setIsSavingTg(false);
    }
  };

  const handleSendTestBanker = async () => {
    setIsSendingTestAlert(true);
    try {
      const res = await fetch('/api/telegram-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_banker',
          channel: chatIdInput.trim(),
          banker: {
            home_team: 'Arsenal',
            away_team: 'Chelsea',
            league: 'Premier League',
            predicted_outcome: 'Home Win & Over 1.5 Goals',
            odds: 1.88,
            confidence_score: 87,
            reasoning: 'Autonomous 24/7 Daemon Health Verification: Bivariate Poisson edge validated.',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.simulated ? 'Test Banker alert simulated & preview logged!' : 'Test Banker posted to Telegram channel!');
        await fetchTgConfig();
      } else {
        toast.error(data.error || 'Failed to dispatch test alert');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error dispatching test alert');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const triggerCron = async (job: CronJobDef) => {
    setRunningMap(prev => ({ ...prev, [job.id]: true }));
    setLogsMap(prev => ({
      ...prev,
      [job.id]: { status: 'running', executedAt: new Date().toLocaleTimeString() },
    }));

    try {
      const res = await fetch(job.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(`Executed ${job.name} successfully`);
        setLogsMap(prev => ({
          ...prev,
          [job.id]: {
            status: 'success',
            executedAt: new Date().toLocaleTimeString(),
            responseSummary: `HTTP ${res.status}: ${data?.status || 'OK'}`,
          },
        }));
        await fetchSchedulerStatus();
      } else {
        toast.error(`Failed to trigger ${job.name} (HTTP ${res.status})`);
        setLogsMap(prev => ({
          ...prev,
          [job.id]: {
            status: 'failed',
            executedAt: new Date().toLocaleTimeString(),
            responseSummary: `HTTP ${res.status}`,
          },
        }));
      }
    } catch (err) {
      toast.error(`Execution error: ${err instanceof Error ? err.message : 'Network error'}`);
      setLogsMap(prev => ({
        ...prev,
        [job.id]: {
          status: 'failed',
          executedAt: new Date().toLocaleTimeString(),
          responseSummary: err instanceof Error ? err.message : 'Error',
        },
      }));
    } finally {
      setRunningMap(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const triggerAllCrons = async () => {
    setRunningAll(true);
    toast.info(`Triggering all ${CRON_JOBS.length} scheduled tasks sequentially...`);
    for (const job of CRON_JOBS) {
      await triggerCron(job);
    }
    setRunningAll(false);
    toast.success('All scheduled tasks have been triggered.');
  };

  const getCategoryBadgeColor = (cat: CronJobDef['category']) => {
    switch (cat) {
      case 'Settlement': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'Predictions': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'Marketing': return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
      case 'SEO': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'System': return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* 24/7 Autonomous Daemon Status Master Card */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex h-3 w-3 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${schedulerStatus?.running ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${schedulerStatus?.running ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Autonomous 24/7 Server Background Daemon
                </h3>
                <Badge variant="outline" className={`font-mono text-xs ${schedulerStatus?.running ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                  {schedulerStatus?.running ? 'Running Forever (Active)' : 'Paused'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Self-healing background worker running continuously on the server process. Executes settlement cycles, value scanning, SportPesa jackpots, and Telegram broadcasts without requiring active browser sessions.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground pt-0.5">
                <span>Heartbeat: <strong className="text-foreground">Every 30s</strong></span>
                <span>•</span>
                <span>Total Executions: <strong className="text-emerald-500">{schedulerStatus?.totalRuns ?? 0}</strong></span>
                <span>•</span>
                <span>Failures: <strong className={schedulerStatus?.totalFails ? 'text-destructive' : 'text-foreground'}>{schedulerStatus?.totalFails ?? 0}</strong></span>
                {schedulerStatus?.startedAt && (
                  <>
                    <span>•</span>
                    <span>Started: <strong className="text-foreground">{new Date(schedulerStatus.startedAt).toLocaleTimeString()}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Sentinel Health: <strong className="text-sky-500">Auto-Check (&gt;60m inactivity)</strong></span>
                {schedulerStatus?.healthCheck?.stalledCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500 font-semibold">Auto-Recovered: {schedulerStatus.healthCheck.stalledCount} tasks</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Button
                variant={schedulerStatus?.running ? 'outline' : 'default'}
                size="sm"
                onClick={() => toggleAutonomousDaemon(!schedulerStatus?.running)}
                disabled={togglingDaemon}
                className="gap-1.5 text-xs font-semibold"
              >
                <Power className="h-3.5 w-3.5" />
                {schedulerStatus?.running ? 'Pause Daemon' : 'Start 24/7 Daemon'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerHealthCheck}
                disabled={runningHealthCheck}
                className="gap-1.5 text-xs font-medium border-sky-500/30 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400"
              >
                <HeartPulse className={`h-3.5 w-3.5 ${runningHealthCheck ? 'animate-pulse text-sky-500' : ''}`} />
                {runningHealthCheck ? 'Checking Tasks...' : 'Run Health Check'}
              </Button>

              <Button
                size="sm"
                onClick={triggerAllCrons}
                disabled={runningAll}
                className="gap-2 shrink-0 font-medium text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {runningAll ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run All Tasks Now</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Automation Quick Config & Health Widget */}
      <Card className="border-sky-500/20 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Telegram Bot & Channel Dispatch Hub</h4>
                <p className="text-xs text-muted-foreground">
                  Configure Bot Token and Channel ID for permanent, reliable delivery without restarts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${tgConfig?.configured ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
                {tgConfig?.configured ? 'Bot Live & Connected' : 'Simulation / Preview Mode'}
              </Badge>
              <a
                href="https://t.me/predictproAi"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-500 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open Channel <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-border/50">
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Bot Token (BotFather)</label>
              <Input
                type="password"
                placeholder={tgConfig?.botTokenMasked || 'Enter Telegram Bot Token...'}
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Target Channel or Chat ID</label>
              <Input
                placeholder="@predictproAi or -100xxxxxxxx"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-3 flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTgConfig}
                disabled={isSavingTg}
                className="h-8 text-xs flex-1"
              >
                {isSavingTg ? 'Saving...' : 'Save Config'}
              </Button>
              <Button
                size="sm"
                onClick={handleSendTestBanker}
                disabled={isSendingTestAlert}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white gap-1 flex-1"
              >
                <Send className="h-3 w-3" />
                {isSendingTestAlert ? 'Sending...' : 'Test Send'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Midnight Match Sync Hook Live Telemetry & Trigger Suggestion Center */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${matchSync.isSyncing ? 'bg-amber-500 animate-ping' : matchSync.autoEnabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                <h3 className="text-sm font-bold text-foreground">useMatchSync — Autonomous Background Match & Prediction Engine</h3>
                <Badge variant="outline" className={`text-[10px] font-mono ${matchSync.autoEnabled ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}>
                  {matchSync.autoEnabled ? 'Autonomous Auto-Sync Active' : 'Auto-Sync Paused'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Runs automatically on its own across intelligent trigger vectors (Midnight rollover, confirmed lineups, odds shifts, and visibility wakeup).
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono pt-1">
                <span>Last Synced Date: <strong className="text-foreground">{matchSync.lastSyncDate || 'Pending first sync'}</strong></span>
                <span>•</span>
                <span>Last Run: <strong className="text-foreground">{matchSync.lastSyncTime ? new Date(matchSync.lastSyncTime).toLocaleTimeString() : 'Awaiting trigger'}</strong></span>
                <span>•</span>
                <span>Trigger: <strong className="text-primary capitalize">{matchSync.lastTrigger || 'Autonomous'}</strong></span>
                <span>•</span>
                <span>Source: <strong className="text-foreground capitalize">{matchSync.syncSource || 'System'}</strong></span>
                {matchSync.matchesCount > 0 && (
                  <>
                    <span>•</span>
                    <span>Hydrated: <strong className="text-emerald-500">{matchSync.matchesCount} fixtures</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 pr-2 border-r border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Auto-Run</span>
                <Switch
                  checked={matchSync.autoEnabled}
                  onCheckedChange={matchSync.toggleAutoSync}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const ok = await matchSync.syncNow();
                  if (ok) {
                    toast.success('Match data and today predictions synced successfully');
                  } else {
                    toast.error('Match sync encountered an issue, check network status');
                  }
                }}
                disabled={matchSync.isSyncing}
                className="gap-1.5 text-xs font-semibold shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${matchSync.isSyncing ? 'animate-spin text-primary' : ''}`} />
                <span>{matchSync.isSyncing ? 'Syncing...' : 'Sync Today Matches Now'}</span>
              </Button>
            </div>
          </div>

          {/* Trigger Matrix & Suggestions */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                Configured Autonomous Trigger Vectors &amp; Suggested Schedules
              </span>
              <span className="text-[11px] text-muted-foreground">
                {matchSync.triggerConfigs.filter(t => t.enabled).length} of {matchSync.triggerConfigs.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {matchSync.triggerConfigs.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg border text-xs transition-colors flex flex-col justify-between gap-2 ${
                    t.enabled
                      ? 'bg-card/90 border-border/80 shadow-xs'
                      : 'bg-muted/20 border-border/40 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-semibold text-foreground truncate">{t.name}</span>
                      <Switch
                        checked={t.enabled}
                        onCheckedChange={(checked) => matchSync.toggleTrigger(t.id, checked)}
                        className="scale-75 origin-right data-[state=checked]:bg-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] font-mono">
                    <span className="text-primary font-medium">{t.frequency}</span>
                    <Badge variant="secondary" className="text-[9px] py-0 px-1 font-mono">
                      {t.recommendedSchedule}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Cron Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRON_JOBS.map(job => {
          const Icon = job.icon;
          const isRunning = runningMap[job.id] || false;
          const log = logsMap[job.id];
          const schedulerJobState = schedulerStatus?.activeJobs?.find((j: any) => j.id === job.id);

          return (
            <Card key={job.id} className="relative overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight">{job.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {job.schedule}
                        </code>
                        <span className="text-[11px] text-muted-foreground">({job.scheduleDescription})</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={getCategoryBadgeColor(job.category)}>
                    {job.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {job.description}
                </p>

                {schedulerJobState?.nextRun && (
                  <div className="flex items-center justify-between text-[10px] font-mono bg-muted/40 px-2 py-1 rounded text-muted-foreground">
                    <span>Next Run: <strong className="text-foreground">{new Date(schedulerJobState.nextRun).toLocaleTimeString()}</strong></span>
                    {schedulerJobState.runCount > 0 && (
                      <span>Runs: <strong className="text-emerald-500">{schedulerJobState.runCount}</strong></span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-[11px] text-muted-foreground">
                    {log ? (
                      <span className="inline-flex items-center gap-1">
                        {log.status === 'running' && <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />}
                        {log.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {log.status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                        <span>Last run {log.executedAt}</span>
                      </span>
                    ) : schedulerJobState?.lastRun ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>Last run {new Date(schedulerJobState.lastRun).toLocaleTimeString()} ({schedulerJobState.lastDurationMs}ms)</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">Scheduled 24/7 on Server Daemon</span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerCron(job)}
                    disabled={isRunning || runningAll}
                    className="h-7 text-xs gap-1.5"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Running</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Trigger</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
