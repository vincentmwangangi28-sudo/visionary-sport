import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Radio, CheckCircle2, Key, RefreshCw } from 'lucide-react';
import { ApiKeyConfigModal } from './ApiKeyConfigModal';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
  updateCount: number;
  sourceName?: string;
  onRefresh?: () => void;
}

export const RealtimeIndicator = ({ 
  isConnected = true, 
  lastUpdate,
  updateCount,
  sourceName = 'Live Matchday Feed (ESPN & Live Sports API)',
  onRefresh,
}: RealtimeIndicatorProps) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('just now');
  const [modalOpen, setModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 5) {
        setTimeSinceUpdate('just now');
      } else if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const handleManualRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <>
      <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-background to-emerald-500/10 border-emerald-500/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                Real-Time Data Feed Connected
              </span>
            </div>

            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> {sourceName}
            </Badge>

            {lastUpdate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span>Synced {timeSinceUpdate}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {updateCount > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Zap className="h-3 w-3 text-primary" />
                {updateCount} live events
              </Badge>
            )}

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="h-8 text-xs gap-1.5 border-emerald-500/30"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Key className="h-3 w-3" />
              API Key Settings
            </Button>
          </div>
        </div>
      </Card>

      <ApiKeyConfigModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
