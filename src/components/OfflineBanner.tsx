import React, { useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { WifiOff, RefreshCw, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const OfflineBanner: React.FC = () => {
  const { isOffline, hasCachedData, lastSyncedAt, syncOfflineData, isSyncing } = useNetworkStatus();
  const { formatKickoff } = useUserPreferences();
  const [dismissed, setDismissed] = useState(false);

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-background/95 border-b border-amber-500/30 backdrop-blur-md px-4 py-2 text-amber-200 shadow-md animate-in slide-in-from-top duration-300"
    >
      <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 flex-shrink-0">
            <WifiOff className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">You are currently offline</span>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] py-0 px-1.5 font-mono">
                Offline Cache Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] truncate mt-0.5">
              Service Worker is serving cached fixtures, AI predictions, and team crests seamlessly.
              {lastSyncedAt && ` (Cached ${formatKickoff(lastSyncedAt, { includeTimezone: true })})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/20 text-amber-200 gap-1.5"
            onClick={() => {
              if (navigator.onLine) {
                syncOfflineData();
              } else {
                window.location.reload();
              }
            }}
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            Check Connection
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss offline banner"
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
