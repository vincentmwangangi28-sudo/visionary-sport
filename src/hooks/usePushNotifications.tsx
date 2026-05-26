import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
      if (perm !== 'granted') { toast.error('Notifications blocked. Enable in browser settings.'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: JSON.stringify({ p256dh: sub.toJSON().keys?.p256dh, auth: sub.toJSON().keys?.auth }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setSubscribed(true);
      toast.success('Push notifications enabled! You\'ll be notified of high-confidence predictions.');
    } catch (err) {
      console.error('Push subscription failed:', err);
      toast.error('Failed to enable notifications');
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await sub.unsubscribe(); }
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    setSubscribed(false);
    toast.success('Notifications disabled');
  };

  return { permission, subscribed, subscribe, unsubscribe };
};
