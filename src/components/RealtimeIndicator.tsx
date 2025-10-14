import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, TrendingUp } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
  updateCount: number;
}

export const RealtimeIndicator = ({ 
  isConnected, 
  lastUpdate,
  updateCount 
}: RealtimeIndicatorProps) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 60) {
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

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`relative h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {isConnected && (
                <>
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full bg-green-500"></div>
                </>
              )}
            </div>
            <span className="text-sm font-medium">
              {isConnected ? 'Real-time Connected' : 'Connecting...'}
            </span>
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Last update: {timeSinceUpdate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {updateCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {updateCount} live {updateCount === 1 ? 'update' : 'updates'}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            <span>Auto-sync enabled</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
