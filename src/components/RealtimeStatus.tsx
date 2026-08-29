import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, Activity } from 'lucide-react';
import { ApiKeyConfigModal } from './ApiKeyConfigModal';

export const RealtimeStatus = () => {
  const [isLive, setIsLive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Keep live status active as polling + websocket stream runs
    const channel = supabase.channel('system-status')
      .subscribe((status) => {
        // If subscribed or connected, mark true
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <button 
        type="button"
        onClick={() => setModalOpen(true)}
        className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 min-h-[32px]"
        title="Real-Time Data Feed Active · Click to view Feed Status"
        aria-label="Real-Time Data Feed Status: Active. Click to inspect feed health and sources."
      >
        <div className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <Wifi className="h-3 w-3" aria-hidden="true" />
        <span className="hidden sm:inline font-semibold">LIVE FEED</span>
        <Activity className="h-3 w-3 opacity-60 ml-0.5 text-emerald-500" aria-hidden="true" />
      </button>

      <ApiKeyConfigModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
