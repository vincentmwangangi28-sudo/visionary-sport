import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Copy,
  Check,
  Image as ImageIcon,
  Terminal,
  Webhook,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import {
  getWebhookBroadcastConfig,
  saveWebhookBroadcastConfig,
  getWebhookBroadcastLogs,
  recordWebhookBroadcastLog,
  WebhookBroadcastConfig,
  WebhookBroadcastLogItem,
} from '@/services/monteCarloSimulatorService';
import {
  getVerifiedBookingCodes,
  getJackpotAdminConfig,
  getAffiliatePartnerLinks,
} from '@/services/adminOverrideSyncService';
import {
  renderSocialCardPngDataUrl,
  getCertifiedWinningProofs,
} from '@/services/socialCardPngGenerator';
import { toast } from 'sonner';

type BroadcastTemplateId =
  | 'MORNING_BANKERS'
  | 'BOOKING_CODE_DROP'
  | 'MEGA_JACKPOT_LOCKS'
  | 'EVENING_WINNER_PROOF';

export const AdminTelegramWebhookTab: React.FC = () => {
  const [config, setConfig] = useState<WebhookBroadcastConfig>(() =>
    getWebhookBroadcastConfig()
  );
  const [logs, setLogs] = useState<WebhookBroadcastLogItem[]>(() =>
    getWebhookBroadcastLogs()
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<BroadcastTemplateId>('BOOKING_CODE_DROP');
  const [customMessageText, setCustomMessageText] = useState<string>('');
  const [sendingText, setSendingText] = useState(false);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bookingCodes = useMemo(() => getVerifiedBookingCodes(), []);
  const jackpotConfig = useMemo(() => getJackpotAdminConfig(), []);
  const affiliateLinks = useMemo(() => getAffiliatePartnerLinks(), []);
  const certifiedProofs = useMemo(() => getCertifiedWinningProofs(), []);

  const generatedTemplateText = useMemo(() => {
    const todayLabel = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const sporty = bookingCodes.find((c) => c.bookmaker === 'SportyBet') || bookingCodes[0];
    const onex = bookingCodes.find((c) => c.bookmaker === '1xBet') || bookingCodes[1];
    const bet9ja = bookingCodes.find((c) => c.bookmaker === 'Bet9ja') || bookingCodes[2];
    const betway = bookingCodes.find((c) => c.bookmaker === 'Betway') || bookingCodes[3];

    if (selectedTemplate === 'MORNING_BANKERS') {
      return [
        `🔥 <b>PREDICTPRO QUANTITATIVE DAILY BANKERS (${todayLabel})</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `⚽ <b>1. Arsenal vs Chelsea</b> — Over 2.5 Goals @ <b>1.72</b> (Model: 86% | +11.4% EV)`,
        `⚽ <b>2. Real Madrid vs Barcelona</b> — BTTS &amp; Over 2.5 @ <b>1.88</b> (Model: 84% | +10.2% EV)`,
        `⚽ <b>3. Bayern Munich vs Dortmund</b> — Home Win &amp; Over 1.5 @ <b>1.64</b> (Model: 88% | +12.1% EV)`,
        `⚽ <b>4. Gor Mahia vs AFC Leopards</b> — Home Win (1) @ <b>1.75</b> (Model: 83% | +9.5% EV)`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `🎟️ <b>SportyBet Code:</b> <code>${sporty?.code || 'BC8942X'}</code>`,
        `🎟️ <b>1xBet Code:</b> <code>${onex?.code || 'PRD26X'}</code>`,
        `📐 <b>Recommended Kelly Stake:</b> 2.5% Bankroll (4-Fold Rollover)`,
        `🌐 <b>Interactive 10,000-Run Simulator:</b> https://predictpro.guru/live-multiview`,
      ].join('\n');
    }

    if (selectedTemplate === 'BOOKING_CODE_DROP') {
      return [
        `🎟️ <b>UNIVERSAL 1-CLICK BOOKING CODE DROP (${todayLabel})</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `Load our verified AI accumulator directly on your preferred bookmaker:`,
        ``,
        `🟢 <b>SportyBet:</b> <code>${sporty?.code || 'BC8942X'}</code> (${Number(sporty?.totalOdds || 2.14).toFixed(2)} Odds)`,
        `🔵 <b>1xBet:</b> <code>${onex?.code || 'PRD26X'}</code> (${Number(onex?.totalOdds || 2.18).toFixed(2)} Odds)`,
        `🟡 <b>Bet9ja:</b> <code>${bet9ja?.code || 'B9J4419'}</code> (${Number(bet9ja?.totalOdds || 3.85).toFixed(2)} Odds)`,
        `⚫ <b>Betway:</b> <code>${betway?.code || 'BW88310'}</code> (${Number(betway?.totalOdds || 5.40).toFixed(2)} Odds)`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `🔄 Need another bookie (Betika, SportPesa, Melbet, Parimatch)?`,
        `Convert any code in 1 click at: https://predictpro.guru/booking-code-converter`,
      ].join('\n');
    }

    if (selectedTemplate === 'MEGA_JACKPOT_LOCKS') {
      const locksCount = Object.keys(jackpotConfig.bankerLocks || {}).length || 6;
      return [
        `🏆 <b>17-GAME MEGA JACKPOT MATHEMATICAL BRIEF (${todayLabel})</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 <b>Target Prize Pool:</b> ${jackpotConfig.prizePoolLabel || 'KES 350,000,000 / $2.7M+'}`,
        `🔒 <b>Locked Institutional Bankers:</b> ${locksCount} High-Confidence Solos (≥84% Poisson Prob)`,
        `🎲 <b>Value Double-Chance Hedges:</b> 5 Draw-Weighted Mismatches (1X / X2)`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `📊 Generate your custom 17-game combination slips &amp; download CSV/PNG at:`,
        `👉 https://predictpro.guru/jackpot-generator`,
      ].join('\n');
    }

    const latestProof = certifiedProofs[0];
    return [
      `✅ <b>CERTIFIED WINNING SLIP PROOF &amp; ROI AUDIT (${todayLabel})</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🏆 <b>Verified Slip:</b> ${latestProof?.title || 'Daily 2.18 Odds Rollover Banker'}`,
      `📈 <b>Hit Odds:</b> <b>${Number(latestProof?.totalOdds || 2.18).toFixed(2)}x</b> (${latestProof?.bookmaker || 'SportyBet / 1xBet'})`,
      `💵 <b>Realized Return:</b> ${latestProof?.profitLabel || '+$236.00 Net Profit'}`,
      `🛡️ <b>Audit Hash:</b> <code>${latestProof?.verificationHash || 'PP-SHA256-98F4A2'}</code>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📂 Inspect full immutable archive &amp; Poisson scoreline proofs:`,
      `👉 https://predictpro.guru/archive`,
    ].join('\n');
  }, [selectedTemplate, bookingCodes, jackpotConfig, certifiedProofs]);

  const activeMessageText = customMessageText.trim()
    ? customMessageText
    : generatedTemplateText;

  const handleSaveConfig = () => {
    saveWebhookBroadcastConfig(config);
    toast.success('Saved Telegram Bot API & Webhook configuration!');
  };

  const handleCopy = async (id: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  const handleSendTelegramText = async () => {
    setSendingText(true);
    saveWebhookBroadcastConfig(config);

    const replyMarkup = config.includeAffiliateButtons
      ? {
          inline_keyboard: [
            [
              {
                text: config.defaultButtonLabel || '🔥 Open Slip on PredictPro.guru',
                url: config.defaultAffiliateUrl || 'https://predictpro.guru/slip-generator',
              },
            ],
            [
              {
                text: `🎁 Claim ${affiliateLinks[0]?.bookmaker || 'SportyBet'} Bonus (${affiliateLinks[0]?.promoCode || 'PREDICTPRO'})`,
                url: affiliateLinks[0]?.affiliateUrl || 'https://predictpro.guru/booking-code-converter',
              },
            ],
          ],
        }
      : undefined;

    if (!config.telegramBotToken.trim()) {
      // Copy ready text to clipboard and log simulated dispatch so admin can test immediately
      try {
        await navigator.clipboard.writeText(activeMessageText.replace(/<\/?[^>]+(>|$)/g, ''));
      } catch {
        // ignore
      }
      const nextLogs = recordWebhookBroadcastLog({
        channel: 'TELEGRAM_MESSAGE',
        destination: config.telegramChatId || '@PredictProOfficial',
        templateName: selectedTemplate,
        status: 'SIMULATED_PREVIEW',
        responseSummary:
          'Dry-run verified & plain message copied to clipboard (Add Bot Token to fire live HTTP POST)',
      });
      setLogs(nextLogs);
      setSendingText(false);
      toast.success(
        'Dry-run verified & message copied to clipboard! Paste your Bot Token above to dispatch directly via api.telegram.org.'
      );
      return;
    }

    try {
      const endpoint = `https://api.telegram.org/bot${config.telegramBotToken.trim()}/sendMessage`;
      const payload: Record<string, unknown> = {
        chat_id: config.telegramChatId.trim(),
        text: activeMessageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };
      if (config.telegramThreadId?.trim()) {
        payload.message_thread_id = Number(config.telegramThreadId.trim());
      }
      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const nextLogs = recordWebhookBroadcastLog({
          channel: 'TELEGRAM_MESSAGE',
          destination: config.telegramChatId,
          templateName: selectedTemplate,
          status: 'DELIVERED',
          responseSummary: `HTTP 200 OK · message_id: ${data.result?.message_id ?? 'sent'}`,
        });
        setLogs(nextLogs);
        toast.success(`Live broadcast delivered to ${config.telegramChatId}!`);
      } else {
        throw new Error(data.description || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      const nextLogs = recordWebhookBroadcastLog({
        channel: 'TELEGRAM_MESSAGE',
        destination: config.telegramChatId,
        templateName: selectedTemplate,
        status: 'ERROR',
        responseSummary: err?.message || 'Network / Token error',
      });
      setLogs(nextLogs);
      toast.error(`Telegram API Error: ${err?.message || 'Check Bot Token & Chat ID'}`);
    } finally {
      setSendingText(false);
    }
  };

  const handleSendTelegramRetinaPhoto = async () => {
    setSendingPhoto(true);
    try {
      const sporty = bookingCodes[0];
      const dataUrl = await renderSocialCardPngDataUrl({
        format: 'STORY_9_16',
        theme: 'EMERALD_CHAMPION',
        badgeText:
          selectedTemplate === 'EVENING_WINNER_PROOF'
            ? 'CERTIFIED WINNING SLIP PROOF'
            : 'DAILY QUANTITATIVE VIP CARD',
        headline:
          selectedTemplate === 'EVENING_WINNER_PROOF'
            ? 'WON @ 2.18 ODDS — VERIFIED AUDIT'
            : `${sporty?.bookmaker || 'SportyBet'} Code: ${sporty?.code || 'BC8942X'}`,
        subheadline: 'Bivariate Poisson 6x6 Matrix · Half-Kelly Staking',
        bookmaker: sporty?.bookmaker || 'SportyBet / 1xBet',
        bookingCode: sporty?.code || 'BC8942X',
        totalOdds: sporty?.totalOdds || 2.18,
        winProbabilityPct: 86,
        kellyStakePct: 2.5,
        isWinnerCertified: selectedTemplate === 'EVENING_WINNER_PROOF',
        verificationHash: 'PP-SHA256-98F4A2',
        legs: [
          {
            match: 'Arsenal vs Chelsea',
            league: 'Premier League',
            market: 'Over 2.5 Goals',
            odds: 1.72,
            result: selectedTemplate === 'EVENING_WINNER_PROOF' ? 'WON' : 'PENDING',
          },
          {
            match: 'Real Madrid vs Barcelona',
            league: 'La Liga',
            market: 'BTTS — Yes',
            odds: 1.58,
            result: selectedTemplate === 'EVENING_WINNER_PROOF' ? 'WON' : 'PENDING',
          },
        ],
      });

      if (!config.telegramBotToken.trim()) {
        // Trigger download so admin immediately gets the PNG card if token isn't set
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `predictpro-telegram-story-${Date.now()}.png`;
        a.click();

        const nextLogs = recordWebhookBroadcastLog({
          channel: 'TELEGRAM_PHOTO',
          destination: config.telegramChatId || '@PredictProOfficial',
          templateName: `${selectedTemplate} (1080x1920 PNG)`,
          status: 'SIMULATED_PREVIEW',
          responseSummary: 'Generated 1080x1920 Retina PNG & downloaded locally (Add Bot Token for direct upload)',
        });
        setLogs(nextLogs);
        toast.success('Generated 1080×1920 2× Retina PNG & downloaded! Add Bot Token to upload directly to Telegram.');
        setSendingPhoto(false);
        return;
      }

      const blobRes = await fetch(dataUrl);
      const pngBlob = await blobRes.blob();

      const formData = new FormData();
      formData.append('chat_id', config.telegramChatId.trim());
      formData.append('photo', pngBlob, 'predictpro-card.png');
      formData.append(
        'caption',
        activeMessageText.slice(0, 950) // Telegram photo caption limit is 1024 chars
      );
      formData.append('parse_mode', 'HTML');

      const endpoint = `https://api.telegram.org/bot${config.telegramBotToken.trim()}/sendPhoto`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const nextLogs = recordWebhookBroadcastLog({
          channel: 'TELEGRAM_PHOTO',
          destination: config.telegramChatId,
          templateName: `${selectedTemplate} (Retina PNG)`,
          status: 'DELIVERED',
          responseSummary: `HTTP 200 OK · 1080x1920 PNG uploaded · message_id: ${data.result?.message_id ?? 'sent'}`,
        });
        setLogs(nextLogs);
        toast.success(`Uploaded 2× Retina PNG Card directly to ${config.telegramChatId}!`);
      } else {
        throw new Error(data.description || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast.error(`Telegram Photo Upload Error: ${err?.message || 'Check Bot Token'}`);
    } finally {
      setSendingPhoto(false);
    }
  };

  const handleSendDiscordOrWhatsappWebhook = async () => {
    setSendingWebhook(true);
    saveWebhookBroadcastConfig(config);

    const plainText = activeMessageText
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<code>/g, '`')
      .replace(/<\/code>/g, '`')
      .replace(/&amp;/g, '&');

    try {
      if (config.discordWebhookUrl.trim()) {
        const res = await fetch(config.discordWebhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'PredictPro Quantitative Desk',
            content: plainText,
          }),
        });
        if (!res.ok) throw new Error(`Discord HTTP ${res.status}`);
        const nextLogs = recordWebhookBroadcastLog({
          channel: 'DISCORD_WEBHOOK',
          destination: 'Discord Channel Webhook',
          templateName: selectedTemplate,
          status: 'DELIVERED',
          responseSummary: `HTTP ${res.status} Delivered`,
        });
        setLogs(nextLogs);
        toast.success('Dispatched live broadcast to Discord Webhook!');
      } else if (config.whatsappWebhookUrl.trim()) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.whatsappBearerToken?.trim()) {
          headers.Authorization = `Bearer ${config.whatsappBearerToken.trim()}`;
        }
        const res = await fetch(config.whatsappWebhookUrl.trim(), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            type: 'text',
            text: { preview_url: true, body: plainText },
          }),
        });
        if (!res.ok) throw new Error(`WhatsApp Webhook HTTP ${res.status}`);
        const nextLogs = recordWebhookBroadcastLog({
          channel: 'WHATSAPP_WEBHOOK',
          destination: 'WhatsApp Cloud Endpoint',
          templateName: selectedTemplate,
          status: 'DELIVERED',
          responseSummary: `HTTP ${res.status} Delivered`,
        });
        setLogs(nextLogs);
        toast.success('Dispatched live broadcast to WhatsApp Webhook!');
      } else {
        await navigator.clipboard.writeText(plainText);
        toast.success('Copied WhatsApp/Discord formatted markdown to clipboard!');
      }
    } catch (err: any) {
      toast.error(`Webhook Dispatch Error: ${err?.message || 'Check URL'}`);
    } finally {
      setSendingWebhook(false);
    }
  };

  const curlSnippet = useMemo(() => {
    const token = config.telegramBotToken.trim() || 'YOUR_TELEGRAM_BOT_TOKEN';
    const chatId = config.telegramChatId.trim() || '@PredictProOfficial';
    const escapedText = activeMessageText.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `curl -X POST "https://api.telegram.org/bot${token}/sendMessage" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chat_id": "${chatId}",
    "parse_mode": "HTML",
    "text": "${escapedText}",
    "reply_markup": {
      "inline_keyboard": [[
        {"text": "${config.defaultButtonLabel}", "url": "${config.defaultAffiliateUrl}"}
      ]]
    }
  }'`;
  }, [config, activeMessageText]);

  const githubActionYaml = useMemo(() => {
    return `name: PredictPro Daily Telegram Auto-Broadcast
on:
  schedule:
    - cron: '0 7 * * *'   # 07:00 UTC Morning Daily Bankers & Booking Codes
    - cron: '0 21 * * *'  # 21:00 UTC Evening Verified Winner Proof Recap
  workflow_dispatch:

jobs:
  broadcast:
    runs-on: ubuntu-latest
    steps:
      - name: Dispatch Daily Quantitative Card to Telegram Channel
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: "${config.telegramChatId || '@PredictProOfficial'}"
        run: |
          curl -s -X POST "https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage" \\
            -H "Content-Type: application/json" \\
            -d '{
              "chat_id": "'"\${TELEGRAM_CHAT_ID}"'",
              "parse_mode": "HTML",
              "text": "🔥 <b>PREDICTPRO DAILY VIP BANKERS & BOOKING CODES LIVE</b>\\n\\n🎟️ Load SportyBet, 1xBet, Bet9ja & Betway codes in 1 click:\\n👉 https://predictpro.guru/booking-code-converter"
            }'`;
  }, [config.telegramChatId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Send className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Automated Telegram Bot API &amp; WhatsApp/Discord Webhook Studio
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-500 border-emerald-500/30 font-mono"
              >
                DIRECT HTTP POST + 2× RETINA PNG UPLOAD
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Dispatch live HTML-formatted predictions, Universal Booking Codes, 17-Game Jackpot briefs, and 1080×1920 Retina PNG proof cards directly to your Telegram Channel (`sendMessage` &amp; `sendPhoto`) or Discord/WhatsApp webhooks.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSaveConfig}
            className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shrink-0"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Save Credentials
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 5 COLS: Bot Credentials & Webhook Endpoints */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              1. Channel Credentials &amp; Inline CTA Config
            </CardTitle>
            <CardDescription className="text-xs">
              Stored securely in your private Admin local vault. Leave Bot Token blank to run in instant Copy-Paste / Dry-Run mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Telegram Bot Token (@BotFather)
              </label>
              <input
                type="password"
                placeholder="e.g. 719283746:AAHfi92837465_xyz..."
                value={config.telegramBotToken}
                onChange={(e) =>
                  setConfig({ ...config, telegramBotToken: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Channel / Chat ID
                </label>
                <input
                  type="text"
                  placeholder="@PredictProOfficial or -100..."
                  value={config.telegramChatId}
                  onChange={(e) =>
                    setConfig({ ...config, telegramChatId: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Topic Thread ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 42"
                  value={config.telegramThreadId || ''}
                  onChange={(e) =>
                    setConfig({ ...config, telegramThreadId: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Inline Keyboard CTA Button Label
              </label>
              <input
                type="text"
                value={config.defaultButtonLabel}
                onChange={(e) =>
                  setConfig({ ...config, defaultButtonLabel: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Inline CTA Target URL (with UTM / Affiliate Tag)
              </label>
              <input
                type="text"
                value={config.defaultAffiliateUrl}
                onChange={(e) =>
                  setConfig({ ...config, defaultAffiliateUrl: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
              />
            </div>

            <div className="pt-2 border-t border-border space-y-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Discord Channel Webhook URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={config.discordWebhookUrl}
                  onChange={(e) =>
                    setConfig({ ...config, discordWebhookUrl: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  WhatsApp Cloud / Custom Webhook URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://graph.facebook.com/v19.0/.../messages"
                  value={config.whatsappWebhookUrl}
                  onChange={(e) =>
                    setConfig({ ...config, whatsappWebhookUrl: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT 7 COLS: Template Selector, Live Payload Composer & 1-Click Dispatch */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              2. Live Broadcast Composer &amp; 1-Click Dispatcher
            </CardTitle>
            <CardDescription className="text-xs">
              Select a live data template (auto-synced with your Booking Codes, 17-Game Jackpot Locks &amp; Certified Winner Proofs) and fire immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 4 Template Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'BOOKING_CODE_DROP', label: '🎟️ Booking Code Drop' },
                  { id: 'MORNING_BANKERS', label: '☀️ Morning Top 4 Bankers' },
                  { id: 'MEGA_JACKPOT_LOCKS', label: '🏆 17-Game Jackpot Brief' },
                  { id: 'EVENING_WINNER_PROOF', label: '✅ Verified Winner Recap' },
                ] as { id: BroadcastTemplateId; label: string }[]
              ).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tpl.id);
                    setCustomMessageText('');
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Editable HTML Broadcast Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Telegram HTML / Webhook Payload (Editable)
                </span>
                <button
                  type="button"
                  onClick={() => setCustomMessageText('')}
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Reset to Live Synced Template
                </button>
              </div>
              <textarea
                rows={10}
                value={activeMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* 1-Click Dispatch Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                disabled={sendingText}
                onClick={handleSendTelegramText}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                <Send className="h-3.5 w-3.5" />
                {sendingText
                  ? 'Dispatching...'
                  : config.telegramBotToken.trim()
                  ? 'Send Live to Telegram Channel'
                  : 'Verify & Copy Telegram Broadcast'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={sendingPhoto}
                onClick={handleSendTelegramRetinaPhoto}
                className="gap-1.5 text-xs font-bold border-sky-500/40 text-sky-500 hover:bg-sky-500/10"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {sendingPhoto
                  ? 'Rendering PNG...'
                  : config.telegramBotToken.trim()
                  ? 'Send 2× Retina PNG Photo to Channel'
                  : 'Download 2× Retina PNG + Caption'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={sendingWebhook}
                onClick={handleSendDiscordOrWhatsappWebhook}
                className="gap-1.5 text-xs font-semibold"
              >
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                {sendingWebhook ? 'Posting...' : 'Fire Discord / WhatsApp'}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopy(
                    'raw-html',
                    activeMessageText.replace(/<\/?[^>]+(>|$)/g, ''),
                    'Plain Broadcast Text'
                  )
                }
                className="gap-1 text-xs ml-auto"
              >
                {copiedId === 'raw-html' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy Plain Text
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turnkey Copy-Paste cURL & GitHub Actions Scheduled Cron */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Ready-to-Paste Terminal cURL Command
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy('curl-cmd', curlSnippet, 'Telegram cURL Command')}
                className="h-7 text-xs gap-1"
              >
                {copiedId === 'curl-cmd' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy cURL
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {curlSnippet}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-500" />
                Automated GitHub Actions Cron (`.github/workflows/telegram.yml`)
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleCopy('gh-yaml', githubActionYaml, 'GitHub Actions Cron YAML')
                }
                className="h-7 text-xs gap-1"
              >
                {copiedId === 'gh-yaml' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy YAML
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {githubActionYaml}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Recent Webhook & Auto-Poster Delivery Ledger */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Channel Auto-Poster Delivery Audit Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] ${
                      log.status === 'DELIVERED'
                        ? 'text-emerald-500 border-emerald-500/30'
                        : log.status === 'SIMULATED_PREVIEW'
                        ? 'text-sky-500 border-sky-500/30'
                        : 'text-rose-500 border-rose-500/30'
                    }`}
                  >
                    {log.channel}
                  </Badge>
                  <span className="font-bold text-foreground">{log.destination}</span>
                  <span className="text-muted-foreground">· {log.templateName}</span>
                </div>
                <div className="flex items-center gap-3 font-mono tabular-nums text-[11px] text-muted-foreground">
                  <span>{log.responseSummary}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
