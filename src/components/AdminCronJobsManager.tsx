import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
    name: '17-Game Mega Jackpot Engine',
    schedule: '0 12 * * 4',
    scheduleDescription: 'Thursdays at 12:00 UTC',
    category: 'Predictions',
    endpoint: '/api/jackpot-cron',
    description: 'Runs Monte Carlo models for SportPesa Mega & Betika pools generating pure bankers and double-chance slips.',
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
      {/* Header card with global trigger */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Automated Cron Jobs & Task Orchestrator</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {CRON_JOBS.length} Active Jobs
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Every task is configured in <code className="font-mono text-xs bg-background/60 px-1 py-0.5 rounded">vercel.json</code> and GitHub Actions to run autonomously in production.
              </CardDescription>
            </div>
            <Button
              onClick={triggerAllCrons}
              disabled={runningAll}
              className="gap-2 shrink-0 font-medium"
            >
              {runningAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run All Tasks Now</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Grid of Cron Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRON_JOBS.map(job => {
          const Icon = job.icon;
          const isRunning = runningMap[job.id] || false;
          const log = logsMap[job.id];

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

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-[11px] text-muted-foreground">
                    {log ? (
                      <span className="inline-flex items-center gap-1">
                        {log.status === 'running' && <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />}
                        {log.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {log.status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                        <span>Last run {log.executedAt}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">Scheduled on Vercel Edge</span>
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
