import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const RealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-status')
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Badge
      variant={isConnected ? 'default' : 'secondary'}
      className={`gap-1 ${isConnected ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="animate-pulse">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </Badge>
  );
};
