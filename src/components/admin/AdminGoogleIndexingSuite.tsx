import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  googleIndexingCronService,
  CronInterval,
  IndexingLogEntry,
  GoogleIndexingSettings,
} from '@/services/googleIndexingCron';
import {
  viralKeywordIntelligenceService,
  ViralKeywordRecord,
} from '@/services/viralKeywordIntelligence';
import {
  CONTINENTAL_DISTRIBUTION_HUBS,
  ContinentalDistributionNode,
} from '@/services/geoRegionService';
import {
  Globe,
  Play,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Flame,
  Zap,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminGoogleIndexingSuite() {
  const [settings, setSettings] = useState<GoogleIndexingSettings>(() => googleIndexingCronService.getSettings());
  const [logs, setLogs] = useState<IndexingLogEntry[]>(() => googleIndexingCronService.getLogs());
  const [totalIndexed, setTotalIndexed] = useState<number>(() => googleIndexingCronService.getTotalIndexed());
  const [isRunning, setIsRunning] = useState<boolean>(() => googleIndexingCronService.getIsRunning());
  const [countdown, setCountdown] = useState<string>('');

  // Viral keywords
  const [viralKeywords, setViralKeywords] = useState<ViralKeywordRecord[]>(() =>
    viralKeywordIntelligenceService.getStoredKeywords()
  );
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [pushingRegionId, setPushingRegionId] = useState<string | null>(null);

  // Subscribe to cron service updates
  useEffect(() => {
    const unsubscribe = googleIndexingCronService.subscribe(() => {
      setSettings(googleIndexingCronService.getSettings());
      setLogs(googleIndexingCronService.getLogs());
      setTotalIndexed(googleIndexingCronService.getTotalIndexed());
      setIsRunning(googleIndexingCronService.getIsRunning());
    });
    return unsubscribe;
  }, []);

  // Countdown timer to next run
  useEffect(() => {
    const updateCountdown = () => {
      if (!settings.isEnabled || !settings.nextRunTimestamp) {
        setCountdown('Disabled');
        return;
      }
      const diff = new Date(settings.nextRunTimestamp).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Due now');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [settings.isEnabled, settings.nextRunTimestamp]);

  const handleRunNow = async () => {
    toast.info('Triggering Google Indexing & Search Engine Cron push...');
    const result = await googleIndexingCronService.runCronNow('manual');
    if (result.success) {
      toast.success(`Successfully pushed ${result.urlsPushed} URLs to Google & search engine indexers!`);
    } else {
      toast.error('Indexing push encountered an issue. Check logs.');
    }
  };

  const handleIntervalChange = (val: CronInterval) => {
    googleIndexingCronService.updateSettings({ interval: val });
    toast.success(`Cron schedule interval updated to ${val}`);
  };

  const handleToggleEnabled = () => {
    const nextVal = !settings.isEnabled;
    googleIndexingCronService.updateSettings({ isEnabled: nextVal });
    toast.success(`Auto-indexing cron job ${nextVal ? 'Activated' : 'Paused'}`);
  };

  const handleClearLogs = () => {
    googleIndexingCronService.clearLogs();
    setLogs([]);
    toast.info('Indexing logs cleared');
  };

  const handlePushContinentalContent = async (targetRegion?: ContinentalDistributionNode) => {
    const key = targetRegion ? targetRegion.id : 'all';
    setPushingRegionId(key);
    const label = targetRegion ? `${targetRegion.flag} ${targetRegion.title}` : 'All Continental Regions';
    toast.info(`Pushing predictions & hubs to ${label}...`);

    try {
      const result = await googleIndexingCronService.pushToContinentalRegions(targetRegion?.id);
      toast.success(`Broadcasted ${result.urlsPushed} canonical URLs across ${label}!`);
    } catch {
      toast.error('Continental push encountered a network warning; queued for background retry.');
    } finally {
      setPushingRegionId(null);
    }
  };

  const handleTriggerViralDiscovery = async () => {
    setIsDiscovering(true);
    toast.info('Running Gemini Viral Keyword Discovery with Google Search Grounding...');
    try {
      const results = await viralKeywordIntelligenceService.runAutonomousKeywordDiscovery();
      setViralKeywords(viralKeywordIntelligenceService.getStoredKeywords());
      toast.success(`Discovered ${results.length} viral trending football keywords! Automatically queued for Google indexing.`);
    } catch {
      toast.error('Discovery completed using cached intelligence.');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Engine Status</span>
              <Badge variant="outline" className={settings.isEnabled ? 'text-emerald-500 border-emerald-500/30' : 'text-zinc-500'}>
                {settings.isEnabled ? 'Running' : 'Paused'}
              </Badge>
            </div>
            <div className="text-xl font-bold font-mono">
              {settings.isEnabled ? 'Active' : 'Standby'}
            </div>
            <p className="text-[11px] text-muted-foreground">Automated Google & IndexNow pings</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Next Execution</span>
              <Clock className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono text-primary">
              {countdown}
            </div>
            <p className="text-[11px] text-muted-foreground">Interval: {settings.interval}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>URLs Indexed</span>
              <Globe className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {totalIndexed.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">Cumulative search crawler pings</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Trending Keywords</span>
              <Flame className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-500">
              {viralKeywords.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Gemini search intelligence active</p>
          </CardContent>
        </Card>
      </div>

      {/* Cron Trigger & Interval Control */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-500" />
                <span>Google Indexing API &amp; IndexNow Autonomous Sentinel</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Trigger indexing batches, configure intervals, and monitor search engine indexing pings
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={settings.isEnabled ? 'outline' : 'default'}
                onClick={handleToggleEnabled}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                {settings.isEnabled ? 'Pause Cron' : 'Start Auto-Cron'}
              </Button>
              <Button
                size="sm"
                onClick={handleRunNow}
                disabled={isRunning}
                className="h-8 text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Run Indexing Batch Now</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Execution Interval:</span>
            {(['15m', '30m', '1h', '2h', '6h', '12h', '24h'] as CronInterval[]).map((val) => (
              <Button
                key={val}
                size="sm"
                variant={settings.interval === val ? 'default' : 'outline'}
                onClick={() => handleIntervalChange(val)}
                className="h-7 text-xs px-2.5"
              >
                {val}
              </Button>
            ))}
          </div>

          {/* Continental Regional Broadcaster */}
          <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-sky-500" />
                  <span>Continental Africa &amp; Global Search Node Broadcast</span>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Instantly push newly published predictions to regional search crawlers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePushContinentalContent()}
                  disabled={pushingRegionId !== null}
                  className="h-7 text-xs gap-1 border-sky-500/30 text-sky-600 dark:text-sky-400"
                >
                  <Zap className="h-3 w-3" />
                  <span>Broadcast All Hubs</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTriggerViralDiscovery}
                  disabled={isDiscovering}
                  className="h-7 text-xs gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Discover Viral Keywords</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {CONTINENTAL_DISTRIBUTION_HUBS.map((hub) => (
                <Button
                  key={hub.id}
                  size="sm"
                  variant="ghost"
                  onClick={() => handlePushContinentalContent(hub)}
                  disabled={pushingRegionId !== null}
                  className="h-6 text-[11px] px-2 bg-background border border-border/60 hover:bg-muted"
                >
                  <span className="mr-1">{hub.flag}</span>
                  <span>{hub.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Indexing Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span>Recent Indexing Dispatch Logs</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear Logs
              </Button>
            </div>

            <div className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded-xl border border-border max-h-48 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-zinc-500">No indexing dispatches recorded yet.</p>
              ) : (
                logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-2 border-b border-zinc-800/60 pb-1">
                    <span className="text-zinc-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="truncate flex-1">
                      [{log.trigger.toUpperCase()}] Pushed {log.urlsPushed} URLs to {log.endpointsPushed.join(', ')}
                    </span>
                    <span className={log.status === 'success' ? 'text-emerald-400 font-bold shrink-0' : 'text-amber-400 font-bold shrink-0'}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
