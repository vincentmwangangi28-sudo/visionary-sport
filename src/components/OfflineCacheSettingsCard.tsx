import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  HardDrive,
  Trash2,
  RefreshCw,
  DownloadCloud,
  CheckCircle2,
  Wifi,
  WifiOff,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Database,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  getCacheStorageBreakdown,
  clearStaleCaches,
  clearCacheCategory,
  CacheStorageBreakdown,
} from '@/services/offlineSyncService';

interface OfflineCacheSettingsCardProps {
  className?: string;
}

export const OfflineCacheSettingsCard: React.FC<OfflineCacheSettingsCardProps> = ({
  className = '',
}) => {
  const { isOnline, hasCachedData, lastSyncedAt, syncOfflineData, isSyncing } = useNetworkStatus();
  const { formatKickoff } = useUserPreferences();

  const [cacheStats, setCacheStats] = useState<CacheStorageBreakdown | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isClearingStale, setIsClearingStale] = useState<boolean>(false);
  const [isClearingCategory, setIsClearingCategory] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getCacheStorageBreakdown();
      setCacheStats(stats);
    } catch {
      // Fallback
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats, lastSyncedAt]);

  const handleClearStale = async () => {
    setIsClearingStale(true);
    try {
      const res = await clearStaleCaches();
      await refreshStats();
      if (res.freedEntriesCount > 0 || res.freedCachesCount > 0) {
        toast.success('Stale cache assets cleared!', {
          description: `Purged ${res.freedEntriesCount} stale assets across ${res.freedCachesCount} legacy store(s). Storage efficiency restored.`,
        });
      } else {
        toast.info('Cache is already optimized', {
          description: 'No obsolete or stale cache versions were found on this device.',
        });
      }
    } catch {
      toast.error('Failed to clear stale cache');
    } finally {
      setIsClearingStale(false);
    }
  };

  const handleClearCategory = async (category: 'images' | 'data' | 'all') => {
    setIsClearingCategory(category);
    try {
      const res = await clearCacheCategory(category);
      await refreshStats();
      if (category === 'all') {
        toast.success('All offline caches purged & shell refreshed', {
          description: `Removed ${res.freedCount} entries. The essential application shell remains ready.`,
        });
      } else if (category === 'images') {
        toast.success('Team crests cache cleared', {
          description: `Removed ${res.freedCount} cached images to free media storage.`,
        });
      } else if (category === 'data') {
        toast.success('Offline prediction snapshots cleared', {
          description: `Removed ${res.freedCount} cached data entries. Tap "Download Latest" anytime to re-sync.`,
        });
      }
    } catch {
      toast.error(`Failed to clear ${category} cache`);
    } finally {
      setIsClearingCategory(null);
    }
  };

  const hasStaleAssets = (cacheStats?.staleEntriesCount ?? 0) > 0 || (cacheStats?.staleCaches.length ?? 0) > 0;
  const isSWActive = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

  return (
    <Card className={`border-border/70 shadow-sm ${className}`} id="offline-cache-settings-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" aria-hidden="true" />
            10. Offline Storage & Service Worker Cache
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {isSWActive ? (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium">
                <ShieldCheck className="h-3 w-3 mr-1" /> SW Active (v6)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
                SW Standby
              </Badge>
            )}

            <Badge
              variant="outline"
              className={
                isOnline
                  ? 'text-green-500 border-green-500/30 bg-green-500/10 text-[11px] font-medium'
                  : 'text-amber-500 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium'
              }
            >
              {isOnline ? (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline Mode
                </span>
              )}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          Manage local Service Worker storage assets, inspect storage metrics, and purge stale cached data to improve device efficiency.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Storage Efficiency Metric Banner */}
        <div className="rounded-xl bg-muted/30 border border-border/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Storage Footprint</span>
                {hasStaleAssets ? (
                  <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] py-0 px-2 font-medium">
                    <AlertTriangle className="h-3 w-3 mr-1 inline" /> Stale Assets Detected
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] py-0 px-2 font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Storage Optimized
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cacheStats ? (
                  <span>
                    Used <strong>{cacheStats.formattedUsage}</strong> across{' '}
                    <strong>{cacheStats.totalEntriesCount} cached assets</strong>
                    {cacheStats.quotaBytes > 0 && ` (Quota: ${cacheStats.formattedQuota})`}
                  </span>
                ) : (
                  'Calculating cached asset footprint...'
                )}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStats}
              disabled={isLoadingStats}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
              title="Refresh cache inspection"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Cache Allocation</span>
              <span>
                {cacheStats?.usagePercentage !== undefined && cacheStats.usagePercentage > 0
                  ? `${cacheStats.usagePercentage}% of system quota`
                  : `${cacheStats?.totalEntriesCount || 0} active objects`}
              </span>
            </div>
            <Progress
              value={Math.max(4, Math.min(100, (cacheStats?.totalEntriesCount || 0) * 1.5))}
              className="h-2 bg-secondary"
            />
          </div>
        </div>

        {/* Cache Asset Category Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Static App Shell */}
          <div className="p-3 rounded-lg border border-border/60 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Layers className="h-3.5 w-3.5 text-blue-500" /> App Shell
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {cacheStats?.staticCount ?? 0}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                Core HTML, script runtime, icons & fonts for instant offline booting.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="text-emerald-500 font-medium">Core Required</span>
              <span>v6 Protected</span>
            </div>
          </div>

          {/* Team Crests & Media */}
          <div className="p-3 rounded-lg border border-border/60 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-500" /> Team Crests
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {cacheStats?.imagesCount ?? 0}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                High-definition SVG & WebP badges for all leagues & clubs.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('images')}
                disabled={isClearingCategory === 'images' || (cacheStats?.imagesCount ?? 0) === 0}
                className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isClearingCategory === 'images' ? 'Clearing...' : 'Clear Crests'}
              </Button>
              <span className="text-[10px] text-muted-foreground">Logos</span>
            </div>
          </div>

          {/* Predictions & Match Snapshots */}
          <div className="p-3 rounded-lg border border-border/60 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Database className="h-3.5 w-3.5 text-purple-500" /> Match Snapshot
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {cacheStats?.dataCount ?? 0}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                {lastSyncedAt
                  ? `Synced: ${formatKickoff(lastSyncedAt, { includeDate: true })}`
                  : 'Pre-warmed AI odds & market predictions.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('data')}
                disabled={isClearingCategory === 'data' || (cacheStats?.dataCount ?? 0) === 0}
                className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isClearingCategory === 'data' ? 'Clearing...' : 'Clear Data'}
              </Button>
              <span className="text-[10px] text-muted-foreground">API Cache</span>
            </div>
          </div>

          {/* Stale / Obsolete Assets */}
          <div className={`p-3 rounded-lg border flex flex-col justify-between ${
            hasStaleAssets ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/60 bg-card'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Trash2 className={`h-3.5 w-3.5 ${hasStaleAssets ? 'text-amber-500' : 'text-muted-foreground'}`} /> Stale Assets
                </span>
                <Badge
                  variant={hasStaleAssets ? 'default' : 'secondary'}
                  className={`text-[10px] px-1.5 py-0 font-mono ${
                    hasStaleAssets ? 'bg-amber-600 text-white' : ''
                  }`}
                >
                  {cacheStats?.staleEntriesCount ?? 0}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                {hasStaleAssets
                  ? `${cacheStats?.staleCaches.length} legacy cache versions ready for reclamation.`
                  : 'No orphaned or stale cache entries detected.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
              <span className={hasStaleAssets ? 'text-amber-500 font-medium' : 'text-muted-foreground'}>
                {hasStaleAssets ? 'Purge Advised' : 'Optimal'}
              </span>
              <span className="text-muted-foreground">Old Chunks</span>
            </div>
          </div>
        </div>

        {/* Action Controls for Stale & Offline Cache */}
        <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Cache Optimization & Storage Efficiency Actions
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Directly trigger service worker cache maintenance to free up browser storage without breaking offline capabilities.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Primary Stale Cache Purge Button */}
              <Button
                onClick={handleClearStale}
                disabled={isClearingStale}
                variant={hasStaleAssets ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs font-semibold"
                id="clear-stale-cache-btn"
              >
                <Trash2 className={`h-3.5 w-3.5 ${isClearingStale ? 'animate-spin' : ''}`} />
                {isClearingStale ? 'Clearing Stale Assets...' : 'Clear Stale Cache Assets'}
              </Button>

              {/* Sync Offline Data Button */}
              <Button
                onClick={syncOfflineData}
                disabled={isSyncing || !isOnline}
                size="sm"
                className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                id="sync-offline-data-btn"
              >
                <DownloadCloud className={`h-3.5 w-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                {isSyncing ? 'Caching Matches...' : 'Download Latest for Offline'}
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Offline snapshot status:{' '}
                {hasCachedData ? (
                  <strong className="text-emerald-500">Ready for Offline</strong>
                ) : (
                  <span className="text-muted-foreground">Standby</span>
                )}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearCategory('all')}
              disabled={isClearingCategory === 'all'}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive self-start sm:self-auto"
            >
              {isClearingCategory === 'all' ? 'Resetting...' : 'Purge All Offline Caches'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
