import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const subscribe = async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!VAPID_PUBLIC_KEY) { toast.error('Push notifications not configured'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      // Store subscription in DB
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: JSON.stringify(sub.toJSON().keys),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setSubscribed(true);
      toast.success('Push notifications enabled!');
    } catch (err) {
      console.error('Push subscribe error:', err);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    setSubscribed(false);
    toast.info('Push notifications disabled');
  };

  return { permission, subscribed, subscribe, unsubscribe };
};
