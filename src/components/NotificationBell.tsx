import { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Sparkles, Trophy, Flame, Clock, Trash2, Send, Radio, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { TeamLogo } from '@/components/TeamLogo';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  payment_success: '💰',
  subscription_activated: '👑',
  payment_failed: '❌',
  subscription_expiry_reminder: '⏰',
  new_prediction: '🔮',
  match_alert: '⚽',
  goal_alert: '🚨',
  default: '🔔',
};

// Default sample notifications for instant preview
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-1',
    type: 'new_prediction',
    message: '🔥 High Confidence Pick: Real Madrid vs Real Sociedad (86% Confidence Win)',
    read: false,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'demo-2',
    type: 'match_alert',
    message: '⚽ Crystal Palace vs Man City kickoff in 1 hour. Starting lineups confirmed.',
    read: false,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'demo-3',
    type: 'goal_alert',
    message: '🎯 Value Bet Alert: Over 2.5 Goals @ 1.85 identified with +8.2% statistical edge.',
    read: true,
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

export const NotificationBell = () => {
  const { user } = useAuth();
  const {
    subscriptions,
    unsubscribe,
    testAlert,
    simulateResult,
    permission,
    requestPermission,
  } = useMatchNotifications();

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('predictpro_notifications');
      return saved ? JSON.parse(saved) : DEMO_NOTIFICATIONS;
    } catch {
      return DEMO_NOTIFICATIONS;
    }
  });
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'matches'>('feed');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('predictpro_sound_alerts') !== 'false';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('predictpro_sound_alerts', String(next));
    if (next) {
      playChime();
      toast.success('Sound alerts enabled');
    } else {
      toast.info('Sound alerts muted');
    }
  };

  const fetchSupabaseNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('predictpro_notifications', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      } catch (e) {
        console.error(e);
      }
    }
    toast.success('All notifications marked as read');
  };

  const simulateAlert = () => {
    const alerts = [
      '🚨 GOAL ALERT: Liverpool 1 - 0 Nottingham Forest (Salah 24\')',
      '🔮 New 88% Confidence Pick generated for Champions League!',
      '⚡ Instant Value Alert: Bayern Munich Asian Handicap -1.5 @ 2.05',
    ];
    const picked = alerts[Math.floor(Math.random() * alerts.length)];
    const newNotif: Notification = {
      id: 'sim-' + Date.now(),
      type: 'goal_alert',
      message: picked,
      read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev.slice(0, 15)];
      localStorage.setItem('predictpro_notifications', JSON.stringify(updated));
      return updated;
    });
    playChime();
    toast.info(picked);
  };

  useEffect(() => {
    fetchSupabaseNotifications();
  }, [user]);

  // Realtime updates if logged in
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          playChime();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;
  const totalAlertBadge = unread + subscriptions.length;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchSupabaseNotifications(); }}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2 h-9 w-9 rounded-full" 
          title="Live Match & Tip Alerts"
          aria-label={`Match and AI Notifications${totalAlertBadge > 0 ? `, ${totalAlertBadge} active` : ''}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {totalAlertBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse border-2 border-background" aria-hidden="true">
              {totalAlertBadge > 9 ? '9+' : totalAlertBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-84 sm:w-96 p-0 shadow-2xl border bg-card rounded-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Match & AI Alerts</span>
            {subscriptions.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-black bg-primary/10 text-primary">
                {subscriptions.length} match{subscriptions.length > 1 ? 'es' : ''} tracked
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
              aria-label={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
            </Button>
            {activeTab === 'feed' && unread > 0 && (
              <button 
                type="button" 
                onClick={markAllRead} 
                className="text-xs text-primary font-semibold hover:underline"
                aria-label="Mark all notifications as read"
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Feed vs Subscribed Matches */}
        <Tabs defaultValue="feed" value={activeTab} onValueChange={(v) => setActiveTab(v as 'feed' | 'matches')}>
          <div className="px-3 pt-2 bg-muted/10 border-b">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="feed" className="text-xs font-bold gap-1.5">
                Feed {unread > 0 && <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px]">{unread}</span>}
              </TabsTrigger>
              <TabsTrigger value="matches" className="text-xs font-bold gap-1.5">
                Notify Me ({subscriptions.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Feed Tab */}
          <TabsContent value="feed" className="m-0 max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-3 hover:bg-muted/30 transition-colors ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              ))
            )}
          </TabsContent>

          {/* Subscribed Matches Tab */}
          <TabsContent value="matches" className="m-0 max-h-80 overflow-y-auto divide-y">
            {subscriptions.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">No Subscribed Matches</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                  Click <b>"Notify Me"</b> on any upcoming match to get push notifications for kickoff & results.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testAlert()}
                  aria-label="Test browser push notification"
                  className="mt-3 text-xs font-bold gap-1.5"
                >
                  <Send className="h-3 w-3" aria-hidden="true" /> Test Browser Push
                </Button>
              </div>
            ) : (
              subscriptions.map((sub) => {
                const matchTime = new Date(sub.matchDate);
                const isUpcoming = matchTime.getTime() > Date.now();
                return (
                  <div key={sub.matchId} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold py-0">
                        {sub.league}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {matchTime.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })} · {matchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 my-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TeamLogo team={sub.homeTeam} logoUrl={sub.homeLogo} size="xs" />
                        <span className="font-bold text-xs truncate">{sub.homeTeam}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">v</span>
                        <TeamLogo team={sub.awayTeam} logoUrl={sub.awayLogo} size="xs" />
                        <span className="font-bold text-xs truncate">{sub.awayTeam}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unsubscribe(sub.matchId)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                        title="Remove alert subscription"
                        aria-label={`Remove alert subscription for ${sub.homeTeam} vs ${sub.awayTeam}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>

                    {sub.prediction && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1 truncate">
                          <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" /> AI: <b className="text-foreground">{sub.prediction}</b>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => simulateResult(sub.matchId)}
                            className="text-[10px] text-primary font-bold hover:underline"
                            title="Simulate FT Push notification"
                            aria-label={`Simulate full-time push notification for ${sub.homeTeam} vs ${sub.awayTeam}`}
                          >
                            Simulate Result
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with browser push trigger */}
        <div className="p-2.5 bg-muted/40 border-t flex items-center justify-between text-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" /> Browser Push {permission === 'granted' ? 'Active ✅' : 'Ready'}
          </span>
          <button
            type="button"
            onClick={activeTab === 'matches' ? () => testAlert() : simulateAlert}
            aria-label="Test sending a live push notification"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <Send className="h-3 w-3" aria-hidden="true" /> Test Live Push
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

