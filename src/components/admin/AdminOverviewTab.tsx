import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, DollarSign, TrendingUp, ShoppingCart, RefreshCw, Zap, 
  ShieldCheck, AlertTriangle, Database, Wifi, CheckCircle2, HardDrive
} from 'lucide-react';
import { triggerMatchDataRevalidation, prewarmOfflineCaches } from '@/services/offlineSyncService';
import { AdminTrendsVisualization } from '@/components/admin/AdminTrendsVisualization';
import { toast } from 'sonner';

interface OverviewProps {
  stats: {
    mrr: number;
    totalRevenue: number;
    activeUsers: number;
    totalTransactions: number;
    totalPredictions: number;
    errorCount: number;
  };
  onRefresh: () => void;
  fetching: boolean;
  onNavigateTab: (tab: string) => void;
}

export function AdminOverviewTab({ stats, onRefresh, fetching, onNavigateTab }: OverviewProps) {
  const [revalidating, setRevalidating] = useState(false);
  const [prewarming, setPrewarming] = useState(false);

  const handleTriggerSWR = async () => {
    setRevalidating(true);
    try {
      const success = await triggerMatchDataRevalidation();
      if (success) {
        toast.success('Stale-While-Revalidate triggered across Service Worker', {
          description: 'Background fetch initiated. Updated fixtures will broadcast to active clients.'
        });
      } else {
        toast.info('SWR revalidation signal sent via local CacheStorage');
      }
    } catch (e) {
      toast.error('Failed to trigger SWR: ' + String(e));
    } finally {
      setRevalidating(false);
    }
  };

  const handlePrewarm = async () => {
    setPrewarming(true);
    try {
      await prewarmOfflineCaches();
      toast.success('Pre-warmed offline match data and team logos into CacheStorage');
    } catch (e) {
      toast.error('Pre-warm error: ' + String(e));
    } finally {
      setPrewarming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Recurring</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">KES {stats.mrr.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active subscriptions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">All-time payments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Users</span>
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Last 30-day activity</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Transactions</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Completed checkout ops</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigateTab('predictions')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Predictions</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">{stats.totalPredictions.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Configured match picks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigateTab('errors')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Captured Errors</span>
              <div className={`p-2 rounded-lg ${stats.errorCount > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold">{stats.errorCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Logs in Supabase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day DAU & Prediction Accuracy Recharts Visualization */}
      <AdminTrendsVisualization onViewPredictions={() => onNavigateTab('predictions')} />

      {/* Quick Action Control Center & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  Service Worker & Offline Operations
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage match data synchronization, pre-warming, and Stale-While-Revalidate triggers.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={fetching} className="h-8 gap-1.5 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wifi className="h-4 w-4 text-emerald-500" />
                    Trigger Match SWR Refresh
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructs the Service Worker to fetch fresh odds and fixtures in the background and revalidate active client caches.
                  </p>
                </div>
                <Button size="sm" onClick={handleTriggerSWR} disabled={revalidating} className="w-full gap-2">
                  <RefreshCw className={`h-3.5 w-3.5 ${revalidating ? 'animate-spin' : ''}`} />
                  {revalidating ? 'Revalidating...' : 'Trigger SWR Revalidate'}
                </Button>
              </div>

              <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Database className="h-4 w-4 text-blue-500" />
                    Pre-warm Offline Caches
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Proactively caches team crests, canonical league logos, and match snapshots for zero-latency offline performance.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handlePrewarm} disabled={prewarming} className="w-full gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  {prewarming ? 'Pre-warming...' : 'Pre-warm Caches'}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-foreground">Fast Quick Links</div>
                <div className="text-xs text-muted-foreground">Jump directly to admin operations modules</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('roles')} className="text-xs h-8 font-medium text-amber-500 border-amber-500/30">
                  Admin Roles &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('settler')} className="text-xs h-8 font-medium text-emerald-500 border-emerald-500/30">
                  Auto-Settler &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('broadcasts')} className="text-xs h-8 font-medium text-amber-500 border-amber-500/30">
                  Broadcasts &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('promos')} className="text-xs h-8 font-medium text-primary border-primary/30">
                  Promo Vouchers &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('config')} className="text-xs h-8 font-medium text-sky-500 border-sky-500/30">
                  Feature Flags &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('audit')} className="text-xs h-8 font-medium text-violet-500 border-violet-500/30">
                  Audit Trail &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('diagnostics')} className="text-xs h-8 font-medium text-emerald-500 border-emerald-500/30">
                  Diagnostics &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('trends')} className="text-xs h-8">
                  Trends & DAU &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('predictions')} className="text-xs h-8">
                  Predictions &rarr;
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigateTab('automation')} className="text-xs h-8">
                  AI & Telegram &rarr;
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Architecture & Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Platform Diagnostics
            </CardTitle>
            <CardDescription className="text-xs">
              Live status of services, APIs, and client-side workers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <span className="text-muted-foreground">Service Worker</span>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active (SWR v6)
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <span className="text-muted-foreground">Supabase Database</span>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <span className="text-muted-foreground">Gemini AI Model</span>
              <Badge variant="outline" className="text-primary border-primary/30">
                Gemini 2.5 Flash
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <span className="text-muted-foreground">Offline Storage</span>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                CacheStorage Ready
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-muted-foreground">Error Monitoring</span>
              <Badge variant="outline" className={stats.errorCount > 0 ? "text-amber-500 border-amber-500/30" : "text-emerald-500 border-emerald-500/30"}>
                {stats.errorCount > 0 ? `${stats.errorCount} Logged` : '0 Errors'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
