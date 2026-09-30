import { callEdgeFn } from '@/lib/callEdgeFunction';
import type { Prediction } from '@/types/prediction';

export interface TelegramBotStatus {
  success: boolean;
  configured: boolean;
  message?: string;
  bot?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
    supports_inline_queries?: boolean;
  };
  channel?: {
    id: number | string;
    title?: string;
    type?: string;
    username?: string;
  };
  chatId?: string;
  error?: string;
}

export interface TelegramBroadcastResult {
  success: boolean;
  simulated?: boolean;
  message?: string;
  chatId?: string;
  previewText?: string;
  data?: any;
  error?: string;
}

export interface LiveScoreAlertPayload {
  id?: string;
  home_team?: string;
  away_team?: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  homeScore?: number;
  awayScore?: number;
  score?: string;
  minute?: number | string;
  status?: string;
  eventType?: 'GOAL ALERT' | 'HALF-TIME UPDATE' | 'FULL-TIME RESULT' | 'LIVE SCORE UPDATE' | 'RED CARD ALERT';
  tip?: string;
  tacticalPulse?: string;
}

/**
 * Primary dispatcher: calls server-side /api/telegram-broadcast (which uses
 * process.env.TELEGRAM_BOT_TOKEN and process.env.TELEGRAM_CHAT_ID directly)
 * with automatic fallback to Supabase Edge Function.
 */
async function callTelegramServerApi(payload: Record<string, any>): Promise<any> {
  try {
    const res = await fetch('/api/telegram-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to Supabase edge function if server route is unreachable
  }
  return callEdgeFn('telegram-broadcast', payload);
}

/**
 * Task 1: Check Telegram Bot and Channel Health
 */
export async function checkTelegramBotStatus(channel?: string): Promise<TelegramBotStatus> {
  try {
    const res = await callTelegramServerApi({
      action: 'check_bot',
      channel,
    });
    return res;
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      message: err?.message || 'Failed to connect to Telegram Bot verification service',
      chatId: channel || '@predictproAi',
    };
  }
}

/**
 * Task 2: Broadcast a Custom HTML or Markdown Message
 */
export async function broadcastCustomMessage(
  message: string,
  options?: { channel?: string; parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown' }
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'broadcast',
      message,
      parse_mode: options?.parse_mode || 'HTML',
      channel: options?.channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error during broadcast',
    };
  }
}

/**
 * Task 3: Broadcast Banker of the Day Alert
 */
export async function broadcastBankerBet(
  banker: {
    home_team?: string;
    away_team?: string;
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    predicted_outcome?: string;
    prediction?: string;
    tip?: string;
    odds?: number;
    home_odds?: number;
    confidence_score?: number;
    confidence?: number;
    reasoning?: string;
    analysis?: string;
    matchDate?: string;
    match_date?: string;
  },
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    const payload = {
      home_team: banker.home_team || banker.homeTeam || 'Home Team',
      away_team: banker.away_team || banker.awayTeam || 'Away Team',
      league: banker.league || 'Premier League',
      predicted_outcome: banker.predicted_outcome || banker.prediction || banker.tip || 'Home Win',
      odds: banker.odds || banker.home_odds || 1.85,
      confidence_score: banker.confidence_score ?? banker.confidence ?? 85,
      reasoning: banker.reasoning || banker.analysis || 'High-probability algorithmic edge.',
    };

    return await callTelegramServerApi({
      action: 'send_banker',
      banker: payload,
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to broadcast banker bet',
    };
  }
}

export const broadcastBanker = broadcastBankerBet;

/**
 * Task 4: Broadcast Individual Match Prediction or High-Confidence Alert
 */
export async function broadcastPrediction(
  prediction: {
    home_team: string;
    away_team: string;
    league?: string;
    predicted_outcome?: string;
    prediction?: string;
    confidence_score?: number;
    confidence?: number;
    correct_score?: string;
    home_odds?: number;
    draw_odds?: number;
    away_odds?: number;
    analysis?: string;
    reasoning?: string;
  },
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'send_prediction',
      prediction,
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to broadcast prediction',
    };
  }
}

export const broadcastMatchPrediction = broadcastPrediction;

/**
 * Task 4B: Send Automated High-Confidence AI Prediction Alert (>= minConfidence)
 */
export async function sendHighConfidencePredictionAlert(
  prediction: Partial<Prediction> & { home_team: string; away_team: string },
  channel?: string
): Promise<TelegramBroadcastResult> {
  return callTelegramServerApi({
    action: 'send_high_confidence',
    prediction,
    channel,
  });
}

/**
 * Task 4C: Batch Scan & Dispatch High-Confidence AI Predictions
 */
export async function sendBatchHighConfidenceAlerts(
  predictions: Prediction[],
  minConfidence = 80,
  maxAlerts = 3,
  channel?: string
): Promise<{ sentCount: number; results: TelegramBroadcastResult[] }> {
  const highConf = predictions
    .filter((p) => (p.confidence_score ?? p.confidence ?? 0) >= minConfidence)
    .sort((a, b) => (b.confidence_score ?? b.confidence ?? 0) - (a.confidence_score ?? a.confidence ?? 0))
    .slice(0, maxAlerts);

  const results: TelegramBroadcastResult[] = [];
  for (const pred of highConf) {
    const res = await sendHighConfidencePredictionAlert(pred, channel);
    results.push(res);
  }

  return {
    sentCount: results.filter((r) => r.success).length,
    results,
  };
}

/**
 * Task 5: Broadcast Multi-Match Accumulator Slip
 */
export async function broadcastAcca(
  acca: {
    title?: string;
    totalOdds: number | string;
    estimatedPayout?: number | string;
    selections: Array<{
      homeTeam?: string;
      awayTeam?: string;
      match?: string;
      market: string;
      odds: number;
      confidence?: number;
    }>;
  },
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'send_acca',
      acca,
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to broadcast accumulator',
    };
  }
}

/**
 * Task 6: Broadcast Positive Expected Value (EV) Bet
 */
export async function broadcastValueBet(
  valueBet: {
    home_team: string;
    away_team: string;
    league?: string;
    market: string;
    odds: number;
    aiProbability: number;
    valuePct: number;
    edge?: 'strong' | 'moderate' | string;
  },
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'send_value_bet',
      valueBet,
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to broadcast value bet',
    };
  }
}

/**
 * Task 7: Broadcast Live Score Update or In-Play Momentum Alert
 */
export async function broadcastLiveInPlay(
  liveInplay: {
    home_team: string;
    away_team: string;
    league?: string;
    minute?: number | string;
    score?: string;
    tip: string;
    confidence?: number;
    tacticalPulse?: string;
    eventType?: string;
  },
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'send_live_inplay',
      liveInplay,
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to broadcast live in-play alert',
    };
  }
}

/**
 * Task 8: Send Automated Live Score Update Alert (Goal, Half-Time, Full-Time)
 */
export async function sendLiveScoreUpdateAlert(
  liveMatch: LiveScoreAlertPayload,
  channel?: string
): Promise<TelegramBroadcastResult> {
  try {
    return await callTelegramServerApi({
      action: 'send_live_score',
      liveMatch: {
        ...liveMatch,
        eventType: liveMatch.eventType || 'LIVE SCORE UPDATE',
      },
      channel,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send live score update alert',
    };
  }
}
