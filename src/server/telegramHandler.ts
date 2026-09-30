// Server-Side Telegram Bot API Integration
// Uses process.env.TELEGRAM_BOT_TOKEN and process.env.TELEGRAM_CHAT_ID to dispatch
// automated alerts for high-confidence AI predictions, live score updates, bankers, and accumulators.

const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co';

export interface TelegramRequestPayload {
  action:
    | 'check_bot'
    | 'broadcast'
    | 'send_banker'
    | 'send_prediction'
    | 'send_high_confidence'
    | 'send_live_score'
    | 'send_live_inplay'
    | 'send_acca'
    | 'send_value_bet';
  channel?: string;
  message?: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  banker?: Record<string, any>;
  prediction?: Record<string, any>;
  liveMatch?: Record<string, any>;
  liveInplay?: Record<string, any>;
  acca?: Record<string, any>;
  valueBet?: Record<string, any>;
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

export async function handleTelegramRequest(payload: TelegramRequestPayload): Promise<Record<string, any>> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const defaultChatId = (process.env.TELEGRAM_CHAT_ID || '@predictproAi').trim();
  const targetChatId = (payload.channel || defaultChatId || '@predictproAi').trim();

  // 1. Direct Telegram Bot API execution when TELEGRAM_BOT_TOKEN is configured
  if (botToken) {
    const apiBase = `https://api.telegram.org/bot${botToken}`;

    if (payload.action === 'check_bot') {
      try {
        const [meRes, chatRes] = await Promise.all([
          fetch(`${apiBase}/getMe`),
          fetch(`${apiBase}/getChat?chat_id=${encodeURIComponent(targetChatId)}`).catch(() => null),
        ]);
        const meJson = await meRes.json();
        const chatJson = chatRes ? await chatRes.json().catch(() => null) : null;

        if (!meJson?.ok) {
          return {
            success: false,
            configured: false,
            chatId: targetChatId,
            error: meJson?.description || 'Invalid TELEGRAM_BOT_TOKEN',
          };
        }

        return {
          success: true,
          configured: true,
          chatId: targetChatId,
          bot: meJson.result,
          channel: chatJson?.ok ? chatJson.result : { id: targetChatId, title: targetChatId },
          message: `Connected to @${meJson.result?.username || 'Bot'} (Chat: ${targetChatId})`,
        };
      } catch (err: any) {
        return {
          success: false,
          configured: false,
          chatId: targetChatId,
          error: err?.message || 'Telegram Bot verification failed',
        };
      }
    }

    // Send formatted alert message via Telegram sendMessage API
    const text = buildTelegramAlertHtml(payload);
    try {
      const sendRes = await fetch(`${apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: payload.parse_mode || 'HTML',
          disable_web_page_preview: false,
        }),
      });
      const sendJson = await sendRes.json();

      if (!sendJson?.ok) {
        return {
          success: false,
          chatId: targetChatId,
          previewText: text,
          error: sendJson?.description || `Telegram API HTTP ${sendRes.status}`,
        };
      }

      return {
        success: true,
        simulated: false,
        chatId: targetChatId,
        previewText: text,
        message: `Alert dispatched to ${targetChatId}`,
        data: sendJson.result,
      };
    } catch (err: any) {
      return {
        success: false,
        chatId: targetChatId,
        previewText: text,
        error: err?.message || 'Failed to send Telegram message',
      };
    }
  }

  // 2. Fallback: Try Supabase Edge Function if TELEGRAM_BOT_TOKEN is stored in Supabase secrets
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }
    const edgeRes = await fetch(`${SUPABASE_BASE_URL}/functions/v1/telegram-broadcast`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        channel: targetChatId,
        message: payload.message || buildTelegramAlertHtml(payload),
      }),
    });
    if (edgeRes.ok) {
      const edgeData = await edgeRes.json();
      return {
        ...edgeData,
        chatId: edgeData.chatId || targetChatId,
        previewText: edgeData.previewText || buildTelegramAlertHtml(payload),
      };
    }
  } catch {
    // Fall through to structured preview
  }

  // 3. Structured simulation preview when neither env var nor edge secret is set
  const previewText = buildTelegramAlertHtml(payload);
  if (payload.action === 'check_bot') {
    return {
      success: true,
      configured: false,
      chatId: targetChatId,
      message: 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment to enable live Telegram dispatch.',
    };
  }

  return {
    success: true,
    simulated: true,
    chatId: targetChatId,
    previewText,
    message: 'Alert formatted in preview mode (configure TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID for live delivery).',
  };
}
