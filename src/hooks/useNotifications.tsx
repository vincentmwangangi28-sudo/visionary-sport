import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // In-app notifications from the notifications table (subscription activated, coins added etc.)
    const channel = supabase.channel(`user-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as { type: string; message: string };
        if (n.type === 'subscription_activated') toast.success('🎉 Subscription Activated!', { description: n.message, duration: 6000 });
        else if (n.type === 'coins_added') toast.success('💰 Coins Added!', { description: n.message, duration: 4000 });
        else if (n.type === 'subscription_expiry_reminder') toast.warning('⚠️ Subscription Expiring', { description: n.message, duration: 8000 });
        else toast.info(n.message);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);
};
