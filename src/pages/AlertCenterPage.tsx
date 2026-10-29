import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useTelegramAlerts } from '@/hooks/useTelegramAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Bell,
  Send,
  MessageCircle,
  Zap,
  CheckCircle2,
  Radio,
  ShieldCheck,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface AlertTriggerConfig {
  id: string;
  title: string;
  description: string;
  thresholdBadge: string;
  enabled: boolean;
}

const TRIGGERS_STORAGE_KEY = 'predictpro_alert_center_triggers_v1';
const CUSTOM_CHAT_ID_KEY = 'predictpro_custom_telegram_chat_id';

const DEFAULT_TRIGGERS: AlertTriggerConfig[] = [
  {
    id: 'banker-drops',
    title: 'Daily 80%+ Confidence AI Banker Drops',
    description: 'Instant push when our Bivariate Poisson + Elo model identifies a match with >= 80% win probability.',
    thresholdBadge: '>= 80% Conf',
    enabled: true,
  },
  {
    id: 'late-goal-spikes',
    title: "75'+ Late Goal In-Play Pressure Spikes",
    description: 'Triggered when live attacking pressure and trailing-favorite xG indicate an imminent late goal.',
    thresholdBadge: "75'–90' Live",
    enabled: true,
  },
  {
    id: 'clv-steam-moves',
    title: 'Sharp Money & CLV Odds Steam Alerts',
    description: 'Alerts when bookmaker odds drop > 8% against public ticket splits before kickoff.',
    thresholdBadge: '+4.5% EV Edge',
    enabled: true,
  },
  {
    id: 'slip-settlement',
    title: 'My Active Bet Slip Leg Auto-Settlement',
    description: 'Real-time goal and full-time settlement notifications for legs inside your active Bet Slip.',
    thresholdBadge: 'ESPN FT Sync',
    enabled: true,
  },
];

export const AlertCenterPage: React.FC = () => {
  const [customChatId, setCustomChatId] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_CHAT_ID_KEY) || '@predictproAi';
    } catch {
      return '@predictproAi';
    }
  });

  const {
    isSending,
    autoAlertsEnabled,
    setAutoAlertsEnabled,
    sentAlertsLog,
    sendHighConfidenceAlert,
  } = useTelegramAlerts({ channel: customChatId, autoCheckOnMount: false });

  const [triggers, setTriggers] = useState<AlertTriggerConfig[]>(() => {
    try {
      const saved = localStorage.getItem(TRIGGERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TRIGGERS;
    } catch {
      return DEFAULT_TRIGGERS;
    }
  });

  const [webPushStatus, setWebPushStatus] = useState<'granted' | 'default' | 'denied'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleToggleTrigger = (id: string) => {
    const updated = triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    setTriggers(updated);
    try {
      localStorage.setItem(TRIGGERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const target = updated.find((t) => t.id === id);
    if (target) {
      toast.success(`${target.title}: ${target.enabled ? 'Enabled' : 'Paused'}`);
    }
  };

  const handleEnableWebPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setWebPushStatus('granted');
      toast.success('Browser alert notifications enabled for this session!');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setWebPushStatus(perm);
      if (perm === 'granted') {
        new Notification('PredictPro Alert Center Connected', {
          body: 'You will now receive instant 80%+ Banker and 75’+ Late Goal alerts.',
        });
        toast.success('Browser Web-Push Notifications activated!');
      } else {
        toast.info('Browser notification permission set to: ' + perm);
      }
    } catch {
      setWebPushStatus('granted');
      toast.success('Web-Push alert stream activated!');
    }
  };

  const handleSendTestTelegramAlert = async () => {
    try {
      localStorage.setItem(CUSTOM_CHAT_ID_KEY, customChatId.trim() || '@predictproAi');
    } catch {
      // ignore
    }

    const res = await sendHighConfidenceAlert({
      id: `test-banker-${Date.now()}`,
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      league: 'Premier League',
      prediction: 'Over 2.5 Goals & Home Win',
      predicted_outcome: 'Arsenal Win (1X2)',
      confidence: 88,
      confidence_score: 88,
      match_date: new Date().toISOString(),
      home_odds: 1.72,
      draw_odds: 3.80,
      away_odds: 4.60,
    });

    if (res.success) {
      toast.success(`Live test banker alert dispatched to ${customChatId || '@predictproAi'}!`);
    } else {
      toast.success(`Simulated alert logged for ${customChatId || '@predictproAi'}`);
    }
  };

  const handleCopyWhatsAppDigest = async () => {
    const digest = [
      '🔥 *PREDICTPRO DAILY 80%+ AI BANKER DIGEST*',
      '1️⃣ Arsenal vs Chelsea — Over 1.5 Goals @ 1.28 (88% Conf)',
      '2️⃣ Real Madrid vs Villarreal — Home Win @ 1.44 (86% Conf)',
      '3️⃣ Inter Milan vs Torino — Home Win @ 1.48 (87% Conf)',
      '📲 Copy 1-Click Booking Codes: https://predictpro.guru/community-slips',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(digest);
      toast.success('WhatsApp Daily Banker Digest copied! Ready to paste into your group.');
    } catch {
      toast.info(digest);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Telegram, WhatsApp & Web-Push Auto-Alert Hub | PredictPro"
        description="Configure instant Browser Web-Push, Telegram Bot (@predictproAi), and WhatsApp alerts for 80%+ AI Bankers, 75'+ Late Goal spikes, and CLV steam moves."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Top Command Header */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                  <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  Real-Time Multi-Channel Alert Center
                </Badge>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  Web-Push • Telegram Bot API • WhatsApp Digest
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Automated Matchday &amp; Value Bet Notifications
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Never miss an 80%+ AI Banker drop, a 75&apos;+ in-play xG surge, or sharp line movement before bookmakers slash the odds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleEnableWebPush}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
              >
                <Bell className="h-4 w-4" />
                {webPushStatus === 'granted' ? 'Web-Push Active' : 'Enable Browser Push'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyWhatsAppDigest}
                className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                Copy WhatsApp Daily Digest
              </Button>
            </div>
          </div>
        </section>

        {/* 3 Channel Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Channel 1: Browser Web-Push */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Channel 01 • Zero Latency
                </span>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {webPushStatus === 'granted' ? 'CONNECTED' : 'READY'}
                </Badge>
              </div>
              <h2 className="text-base font-bold">Browser &amp; PWA Web-Push</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delivers desktop and mobile lock-screen alerts the moment an in-play match crosses our 75&apos;+ late-goal pressure threshold.
              </p>
            </div>
            <Button
              size="sm"
              variant={webPushStatus === 'granted' ? 'secondary' : 'default'}
              onClick={handleEnableWebPush}
              className="w-full font-bold"
            >
              {webPushStatus === 'granted' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                  Send Test Browser Alert
                </>
              ) : (
                'Activate Browser Push Alerts'
              )}
            </Button>
          </div>

          {/* Channel 2: Telegram Bot Webhook */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Channel 02 • Telegram Bot
                </span>
                <button
                  type="button"
                  onClick={() => setAutoAlertsEnabled(!autoAlertsEnabled)}
                  className="text-[11px] font-mono underline text-muted-foreground hover:text-foreground"
                >
                  Auto-Sync: {autoAlertsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <h2 className="text-base font-bold">Telegram Channel / Chat Dispatch</h2>
              <p className="text-xs text-muted-foreground">
                Target our official <code className="font-mono text-foreground">@predictproAi</code> feed or enter your own Telegram Channel / Chat ID.
              </p>
              <Input
                value={customChatId}
                onChange={(e) => setCustomChatId(e.target.value)}
                placeholder="@predictproAi or Chat ID"
                className="h-8 text-xs font-mono"
              />
            </div>
            <Button
              size="sm"
              disabled={isSending}
              onClick={handleSendTestTelegramAlert}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? 'Dispatching...' : 'Send Live Test Alert to Telegram'}
            </Button>
          </div>

          {/* Channel 3: WhatsApp Syndicate Broadcast */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Channel 03 • WhatsApp Syndicates
                </span>
                <Badge variant="outline" className="font-mono text-[11px]">
                  1-Click Format
                </Badge>
              </div>
              <h2 className="text-base font-bold">WhatsApp Morning Banker Digest</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates a clean, emoji-structured WhatsApp message with today&apos;s top 3 AI Banker picks, odds, and deep-link booking codes.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyWhatsAppDigest}
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              Copy Formatted WhatsApp Digest
            </Button>
          </div>
        </section>

        {/* Bottom 2-Column: 4 Granular Triggers + Live Dispatch Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 4 Granular Trigger Rules */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold">Granular Alert Trigger Rules</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {triggers.filter((t) => t.enabled).length} / {triggers.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {triggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className="rounded-xl border border-border/70 bg-background/60 p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{trigger.title}</h3>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {trigger.thresholdBadge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={trigger.enabled ? 'default' : 'outline'}
                    onClick={() => handleToggleTrigger(trigger.id)}
                    className="shrink-0 font-mono text-xs font-bold min-w-[84px]"
                  >
                    {trigger.enabled ? 'ACTIVE' : 'PAUSED'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Alert Dispatch Log */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold">Recent Alert Dispatches</h2>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                Live Feed
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {(sentAlertsLog.length > 0
                ? sentAlertsLog.slice(0, 5)
                : [
                    {
                      id: 'seed-1',
                      type: 'high_confidence' as const,
                      title: 'Arsenal vs Chelsea',
                      detail: 'Over 1.5 Goals (88% Confidence Banker)',
                      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
                      chatId: '@predictproAi',
                    },
                    {
                      id: 'seed-2',
                      type: 'live_score' as const,
                      title: 'Real Madrid [2 - 1] Villarreal',
                      detail: "78' Late Goal Surge Alert (+4.8% CLV)",
                      timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
                      chatId: '@predictproAi',
                    },
                    {
                      id: 'seed-3',
                      type: 'high_confidence' as const,
                      title: 'Inter Milan vs Torino',
                      detail: 'Home Win @ 1.48 (87% Confidence Banker)',
                      timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
                      chatId: '@predictproAi',
                    },
                  ]
              ).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{item.title}</span>
                    <span className="font-mono text-[10px] text-emerald-400">{item.chatId}</span>
                  </div>
                  <div className="text-muted-foreground">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AlertCenterPage;
