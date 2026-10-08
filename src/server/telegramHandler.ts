// Server-Side Telegram Bot API Integration
// Uses process.env.TELEGRAM_BOT_TOKEN or dynamically configured tokens,
// and process.env.TELEGRAM_CHAT_ID to dispatch automated alerts for
// high-confidence AI predictions, live score updates, bankers, and accumulators.

import fs from 'fs';
import path from 'path';

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';
const RUNTIME_CONFIG_PATH = path.join(process.cwd(), '.data', 'telegram-runtime-config.json');
const RUNTIME_LOGS_PATH = path.join(process.cwd(), '.data', 'telegram-transmission-logs.json');

export interface TelegramRequestPayload {
  action:
    | 'check_bot'
    | 'configure_bot'
    | 'get_config'
    | 'clear_queue'
    | 'broadcast'
    | 'send_banker'
    | 'send_prediction'
    | 'send_high_confidence'
    | 'send_live_score'
    | 'send_live_inplay'
    | 'send_acca'
    | 'send_value_bet';
  channel?: string;
  chatId?: string;
  chat_id?: string;
  botToken?: string;
  bot_token?: string;
  message?: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  banker?: Record<string, any>;
  prediction?: Record<string, any>;
  liveMatch?: Record<string, any>;
  liveInplay?: Record<string, any>;
  acca?: Record<string, any>;
  valueBet?: Record<string, any>;
}

export interface TelegramTransmissionLog {
  id: string;
  timestamp: string;
  action: string;
  chatId: string;
  success: boolean;
  simulated: boolean;
  status: string;
  preview: string;
  error?: string;
}

// In-memory runtime state
let cachedRuntimeConfig: { botToken?: string; chatId?: string; autoBroadcast?: boolean } | null = null;
const transmissionLogs: TelegramTransmissionLog[] = [];

function ensureDataDir() {
  try {
    const dir = path.dirname(RUNTIME_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

export function getStoredTelegramConfig(): { botToken: string; chatId: string; autoBroadcast: boolean } {
  if (cachedRuntimeConfig) {
    return {
      botToken: (cachedRuntimeConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim(),
      chatId: (cachedRuntimeConfig.chatId || process.env.TELEGRAM_CHAT_ID || '@predictproAi').trim(),
      autoBroadcast: cachedRuntimeConfig.autoBroadcast ?? true,
    };
  }

  ensureDataDir();
  try {
    if (fs.existsSync(RUNTIME_CONFIG_PATH)) {
      const raw = fs.readFileSync(RUNTIME_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      cachedRuntimeConfig = parsed;
      return {
        botToken: (parsed.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim(),
        chatId: (parsed.chatId || process.env.TELEGRAM_CHAT_ID || '@predictproAi').trim(),
        autoBroadcast: parsed.autoBroadcast ?? true,
      };
    }
  } catch {}

  cachedRuntimeConfig = {
    botToken: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
    chatId: (process.env.TELEGRAM_CHAT_ID || '@predictproAi').trim(),
    autoBroadcast: true,
  };
  return cachedRuntimeConfig as any;
}

export function saveStoredTelegramConfig(config: { botToken?: string; chatId?: string; autoBroadcast?: boolean }) {
  ensureDataDir();
  const current = getStoredTelegramConfig();
  const updated = {
    botToken: config.botToken !== undefined ? config.botToken.trim() : current.botToken,
    chatId: config.chatId !== undefined ? config.chatId.trim() : current.chatId,
    autoBroadcast: config.autoBroadcast !== undefined ? config.autoBroadcast : current.autoBroadcast,
    updatedAt: new Date().toISOString(),
  };
  cachedRuntimeConfig = updated;
  try {
    fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {}
  return updated;
}

function recordTransmission(entry: TelegramTransmissionLog) {
  transmissionLogs.unshift(entry);
  if (transmissionLogs.length > 50) {
    transmissionLogs.pop();
  }
  ensureDataDir();
  try {
    fs.writeFileSync(RUNTIME_LOGS_PATH, JSON.stringify(transmissionLogs.slice(0, 30), null, 2), 'utf-8');
  } catch {}
}

export function getTelegramTransmissionLogs(): TelegramTransmissionLog[] {
  if (transmissionLogs.length > 0) return transmissionLogs;
  try {
    if (fs.existsSync(RUNTIME_LOGS_PATH)) {
      const raw = fs.readFileSync(RUNTIME_LOGS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        transmissionLogs.push(...parsed);
      }
    }
  } catch {}
  return transmissionLogs;
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtmlTags(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

export function buildTelegramAlertHtml(payload: TelegramRequestPayload): string {
  const { action } = payload;

  if (action === 'broadcast' && payload.message) {
    return payload.message;
  }

  if (action === 'send_banker' && payload.banker) {
    const b = payload.banker;
    const home = escapeHtml(b.home_team || b.homeTeam || 'Home Team');
    const away = escapeHtml(b.away_team || b.awayTeam || 'Away Team');
    const league = escapeHtml(b.league || 'Football');
    const pick = escapeHtml(b.predicted_outcome || b.prediction || b.tip || 'Home Win');
    const odds = Number(b.odds || b.home_odds || 1.85).toFixed(2);
    const conf = Number(b.confidence_score ?? b.confidence ?? 85);
    const reason = escapeHtml(b.reasoning || b.analysis || 'Strong Bivariate Poisson & ELO statistical edge.');

    return [
      `🔒 <b>PREDICTPRO AI BANKER OF THE DAY</b> 🔒`,
      ``,
      `⚽ <b>${home} vs ${away}</b>`,
      `🏆 <i>${league}</i>`,
      `🎯 <b>Recommended Pick:</b> ${pick}`,
      `💰 <b>Market Odds:</b> ${odds}`,
      `📊 <b>AI Confidence:</b> ${conf}%`,
      ``,
      `🧠 <b>Quantitative Rationale:</b>`,
      `${reason}`,
      ``,
      `🔗 <a href="https://predictpro.guru/best-bets">View Live xG &amp; Full Slate on PredictPro.guru</a>`,
    ].join('\n');
  }

  if ((action === 'send_prediction' || action === 'send_high_confidence') && payload.prediction) {
    const p = payload.prediction;
    const home = escapeHtml(p.home_team || p.homeTeam || 'Home Team');
    const away = escapeHtml(p.away_team || p.awayTeam || 'Away Team');
    const league = escapeHtml(p.league || 'Football League');
    const pick = escapeHtml(p.predicted_outcome || p.prediction || 'Home Win');
    const conf = Number(p.confidence_score ?? p.confidence ?? 82);
    const score = escapeHtml(p.correct_score || p.projected_score || '2-1');
    const odds =
      p.odds ||
      (pick.toLowerCase().includes('away')
        ? p.away_odds
        : pick.toLowerCase().includes('draw')
        ? p.draw_odds
        : p.home_odds) ||
      1.95;
    const reason = escapeHtml(
      p.reasoning || p.analysis || 'High-confidence Bivariate Poisson probability and xG differential.'
    );

    return [
      `🚨 <b>HIGH-CONFIDENCE AI PREDICTION (${conf}%)</b> 🚨`,
      ``,
      `⚽ <b>${home} vs ${away}</b>`,
      `🏆 <i>${league}</i>`,
      `🎯 <b>AI Verdict:</b> ${pick} (Odds: ${Number(odds).toFixed(2)})`,
      `🔢 <b>Projected Scoreline:</b> ${score}`,
      `📈 <b>Model Confidence:</b> ${conf}%`,
      ``,
      `💡 <i>${reason}</i>`,
      ``,
      `👉 <a href="https://predictpro.guru/predict">Open Match Center on PredictPro.guru</a>`,
    ].join('\n');
  }

  if ((action === 'send_live_score' || action === 'send_live_inplay') && (payload.liveMatch || payload.liveInplay)) {
    const m = (payload.liveMatch || payload.liveInplay) as Record<string, any>;
    const home = escapeHtml(m.home_team || m.homeTeam || 'Home');
    const away = escapeHtml(m.away_team || m.awayTeam || 'Away');
    const league = escapeHtml(m.league || 'Live Match');
    const score = escapeHtml(
      m.score ?? `${m.homeScore ?? m.home_score ?? 0} - ${m.awayScore ?? m.away_score ?? 0}`
    );
    const minute = escapeHtml(m.minute ?? m.status ?? 'LIVE');
    const eventType = escapeHtml(m.eventType || 'LIVE SCORE UPDATE');
    const tip = m.tip ? `\n🎯 <b>In-Play AI Edge:</b> ${escapeHtml(m.tip)}` : '';
    const pulse = m.tacticalPulse ? `\n⚡ <i>${escapeHtml(m.tacticalPulse)}</i>` : '';

    return [
      `⚽ <b>${eventType} — ${minute}'</b>`,
      ``,
      `🏟️ <b>${home}  [ ${score} ]  ${away}</b>`,
      `🏆 <i>${league}</i>${tip}${pulse}`,
      ``,
      `📡 <a href="https://predictpro.guru/live">Track Live Match &amp; In-Play Odds</a>`,
    ].join('\n');
  }

  if (action === 'send_acca' && payload.acca) {
    const a = payload.acca;
    const title = escapeHtml(a.title || 'PredictPro AI Smart Accumulator');
    const totalOdds = Number(a.totalOdds || 1).toFixed(2);
    const legs = Array.isArray(a.selections) ? a.selections : [];
    const legsText = legs
      .map((l: any, idx: number) => {
        const matchName = escapeHtml(l.match || `${l.homeTeam || ''} vs ${l.awayTeam || ''}`);
        return `${idx + 1}. <b>${matchName}</b> — ${escapeHtml(l.market)} (@${Number(l.odds || 1.5).toFixed(2)})`;
      })
      .join('\n');

    return [
      `🎟️ <b>${title.toUpperCase()}</b> 🎟️`,
      ``,
      legsText,
      ``,
      `🔥 <b>Combined Odds:</b> ${totalOdds}x`,
      `🔗 <a href="https://predictpro.guru/accumulator">Load Slip on PredictPro.guru</a>`,
    ].join('\n');
  }

  if (action === 'send_value_bet' && payload.valueBet) {
    const v = payload.valueBet;
    const home = escapeHtml(v.home_team || v.homeTeam || 'Home');
    const away = escapeHtml(v.away_team || v.awayTeam || 'Away');
    const league = escapeHtml(v.league || 'Football');
    const market = escapeHtml(v.market || 'Home Win');
    const odds = Number(v.odds || 2.1).toFixed(2);
    const aiProb = Number(v.aiProbability || 55).toFixed(1);
    const ev = Number(v.valuePct || 6.5).toFixed(1);

    return [
      `💎 <b>POSITIVE EV (+${ev}%) VALUE BET ALERT</b> 💎`,
      ``,
      `⚽ <b>${home} vs ${away}</b> (${league})`,
      `🎯 <b>Market:</b> ${market} @ <b>${odds}</b>`,
      `📊 <b>AI True Probability:</b> ${aiProb}% (+${ev}% Edge)`,
      ``,
      `🔗 <a href="https://predictpro.guru/value-bets">View Value Scanner on PredictPro.guru</a>`,
    ].join('\n');
  }

  return payload.message || '🔥 <b>PredictPro.guru AI Alert</b>';
}

/**
 * Resilient Telegram dispatcher with rate-limit backoff and HTML entity recovery
 */
async function dispatchTelegramMessageDirect(
  botToken: string,
  targetChatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML',
  retries = 2
): Promise<{ success: boolean; data?: any; error?: string; usedFallback?: boolean }> {
  const apiBase = `https://api.telegram.org/bot${botToken}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const mode = attempt === retries ? undefined : parseMode;
      const sendText = attempt === retries ? stripHtmlTags(text) : text;

      const bodyObj: Record<string, any> = {
        chat_id: targetChatId,
        text: sendText,
        disable_web_page_preview: false,
      };
      if (mode) {
        bodyObj.parse_mode = mode;
      }

      const res = await fetch(`${apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.ok) {
        return { success: true, data: json.result, usedFallback: attempt > 0 };
      }

      // 429 Too Many Requests -> wait retry_after
      if (res.status === 429 && json?.parameters?.retry_after && attempt < retries) {
        const waitSec = Number(json.parameters.retry_after) || 1;
        await new Promise((r) => setTimeout(r, (waitSec + 0.5) * 1000));
        continue;
      }

      // 400 Bad Request: can't parse entities -> immediately retry with stripped plain text
      if (res.status === 400 && json?.description?.toLowerCase().includes('parse') && attempt < retries) {
        const plainRes = await fetch(`${apiBase}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: stripHtmlTags(text),
            disable_web_page_preview: false,
          }),
        });
        const plainJson = await plainRes.json().catch(() => null);
        if (plainRes.ok && plainJson?.ok) {
          return { success: true, data: plainJson.result, usedFallback: true };
        }
      }

      if (attempt === retries) {
        return {
          success: false,
          error: json?.description || `Telegram API HTTP ${res.status}`,
        };
      }
    } catch (err: any) {
      if (attempt === retries) {
        return { success: false, error: err?.message || 'Network dispatch failure' };
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  return { success: false, error: 'Max delivery attempts exceeded' };
}

export async function handleTelegramRequest(payload: TelegramRequestPayload): Promise<Record<string, any>> {
  const stored = getStoredTelegramConfig();
  const botToken = (payload.botToken || payload.bot_token || stored.botToken || '').trim();
  const targetChatId = (payload.channel || payload.chatId || payload.chat_id || stored.chatId || '@predictproAi').trim();

  // Action: configure_bot (saves credentials dynamically from UI or admin tab)
  if (payload.action === 'configure_bot') {
    const newConfig = saveStoredTelegramConfig({
      botToken: payload.botToken || payload.bot_token,
      chatId: payload.channel || payload.chatId || payload.chat_id,
    });

    let pingResult: any = { ok: false };
    if (newConfig.botToken) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${newConfig.botToken}/getMe`);
        pingResult = await res.json().catch(() => ({ ok: false }));
      } catch {}
    }

    return {
      success: true,
      configured: Boolean(newConfig.botToken),
      botTokenMasked: newConfig.botToken ? `${newConfig.botToken.slice(0, 6)}...${newConfig.botToken.slice(-4)}` : null,
      chatId: newConfig.chatId,
      bot: pingResult?.result || null,
      message: pingResult?.ok
        ? `Connected to @${pingResult.result?.username} (Target: ${newConfig.chatId})`
        : 'Credentials saved successfully',
    };
  }

  // Action: get_config
  if (payload.action === 'get_config') {
    return {
      success: true,
      configured: Boolean(botToken),
      botTokenMasked: botToken ? `${botToken.slice(0, 6)}...${botToken.slice(-4)}` : null,
      chatId: targetChatId,
      autoBroadcast: stored.autoBroadcast,
      recentDeliveries: getTelegramTransmissionLogs().slice(0, 10),
    };
  }

  // Action: check_bot
  if (payload.action === 'check_bot') {
    if (!botToken) {
      return {
        success: true,
        configured: false,
        chatId: targetChatId,
        message: 'No Telegram bot token configured. Running in preview simulation mode.',
      };
    }

    try {
      const apiBase = `https://api.telegram.org/bot${botToken}`;
      const [meRes, chatRes] = await Promise.all([
        fetch(`${apiBase}/getMe`),
        fetch(`${apiBase}/getChat?chat_id=${encodeURIComponent(targetChatId)}`).catch(() => null),
      ]);
      const meJson = await meRes.json().catch(() => null);
      const chatJson = chatRes ? await chatRes.json().catch(() => null) : null;

      if (!meJson?.ok) {
        return {
          success: false,
          configured: false,
          chatId: targetChatId,
          error: meJson?.description || 'Invalid Telegram bot token',
        };
      }

      return {
        success: true,
        configured: true,
        chatId: targetChatId,
        bot: meJson.result,
        channel: chatJson?.ok ? chatJson.result : { id: targetChatId, title: targetChatId },
        message: `Connected to @${meJson.result?.username || 'Bot'} (Target: ${targetChatId})`,
      };
    } catch (err: any) {
      return {
        success: false,
        configured: false,
        chatId: targetChatId,
        error: err?.message || 'Telegram connection check failed',
      };
    }
  }

  // Formatting message
  const text = buildTelegramAlertHtml(payload);

  // 1. Live dispatch if bot token is present
  if (botToken) {
    const result = await dispatchTelegramMessageDirect(
      botToken,
      targetChatId,
      text,
      payload.parse_mode || 'HTML'
    );

    recordTransmission({
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: payload.action,
      chatId: targetChatId,
      success: result.success,
      simulated: false,
      status: result.success ? (result.usedFallback ? 'dispatched_plain_fallback' : 'dispatched_ok') : 'failed',
      preview: text.slice(0, 150),
      error: result.error,
    });

    if (result.success) {
      return {
        success: true,
        simulated: false,
        chatId: targetChatId,
        previewText: text,
        message: `Alert dispatched to ${targetChatId}`,
        data: result.data,
      };
    } else {
      return {
        success: false,
        simulated: false,
        chatId: targetChatId,
        previewText: text,
        error: result.error || 'Failed to dispatch to Telegram',
      };
    }
  }

  // 2. Simulated preview mode with persistent log recording
  recordTransmission({
    id: `tx-sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: payload.action,
    chatId: targetChatId,
    success: true,
    simulated: true,
    status: 'simulated_preview',
    preview: text.slice(0, 150),
  });

  return {
    success: true,
    simulated: true,
    chatId: targetChatId,
    previewText: text,
    message: `Alert formatted in preview mode (Target: ${targetChatId}). Add Bot Token in Admin / Telegram Hub for live delivery.`,
  };
}

