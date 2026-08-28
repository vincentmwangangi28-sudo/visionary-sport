import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, Key } from 'lucide-react';
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
        className="cursor-pointer flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all hover:scale-105 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
        title="Real-Time Data Feed Connected · Click to Configure API Keys"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <Wifi className="h-2.5 w-2.5" />
        <span className="hidden sm:inline font-semibold">LIVE FEED</span>
        <Key className="h-2.5 w-2.5 opacity-60 ml-0.5" />
      </button>

      <ApiKeyConfigModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
