import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Notification { id: string; type: string; message: string; read: boolean; created_at: string; }

const TYPE_ICON: Record<string, string> = {
  payment_success: '💰', subscription_activated: '👑', payment_failed: '❌',
  subscription_expiry_reminder: '⏰', new_prediction: '🔮', default: '🔔',
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotifications(data ?? []);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => { fetch(); }, [user]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('notifications-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => setNotifications(prev => [payload.new as Notification, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) fetch(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : notifications.map(n => (
            <div key={n.id} className={`flex gap-3 p-3 border-b last:border-0 hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.default}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.read ? 'font-medium' : ''}`}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
