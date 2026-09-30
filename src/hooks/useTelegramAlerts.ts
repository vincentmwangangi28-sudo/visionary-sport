import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkTelegramBotStatus,
  sendHighConfidencePredictionAlert,
  sendLiveScoreUpdateAlert,
  sendBatchHighConfidenceAlerts,
  TelegramBotStatus,
  TelegramBroadcastResult,
  LiveScoreAlertPayload,
} from '@/services/telegramTasksService';
import type { Prediction } from '@/types/prediction';

const AUTO_ALERTS_ENABLED_KEY = 'predictpro_telegram_auto_alerts_enabled';
const SENT_PREDICTION_IDS_KEY = 'predictpro_telegram_sent_prediction_ids';
const SENT_ALERTS_LOG_KEY = 'predictpro_telegram_sent_alerts_log';

export interface TelegramAlertLogItem {
  id: string;
  type: 'high_confidence' | 'live_score';
  title: string;
  detail: string;
  timestamp: string;
  chatId: string;
  simulated?: boolean;
}

export interface UseTelegramAlertsOptions {
  channel?: string;
  minConfidence?: number;
  autoCheckOnMount?: boolean;
}

/**
 * React Hook (`useTelegramAlerts`) that integrates with server-side `TELEGRAM_BOT_TOKEN`
 * and `TELEGRAM_CHAT_ID` via `/api/telegram-broadcast` to dispatch automated alerts for:
 * 1. High-confidence AI predictions (>= minConfidence, default 80%)
 * 2. Real-time live score updates (Goals, Half-Time, Full-Time transitions)
 */
export function useTelegramAlerts(options?: UseTelegramAlertsOptions) {
  const channel = options?.channel;
  const minConfidence = options?.minConfidence ?? 80;

  const [botStatus, setBotStatus] = useState<TelegramBotStatus | null>(null);
  const [isCheckingBot, setIsCheckingBot] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [autoAlertsEnabled, setAutoAlertsEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_ALERTS_ENABLED_KEY);
      return saved ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [sentAlertsLog, setSentAlertsLog] = useState<TelegramAlertLogItem[]>(() => {
    try {
      const raw = localStorage.getItem(SENT_ALERTS_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Track previous live match scores to detect real-time goals & status changes
  const previousScoresRef = useRef<Map<string, { score: string; status: string }>>(new Map());

  const setAutoAlertsEnabled = useCallback((enabled: boolean) => {
    setAutoAlertsEnabledState(enabled);
    try {
      localStorage.setItem(AUTO_ALERTS_ENABLED_KEY, String(enabled));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const appendAlertLog = useCallback((entry: TelegramAlertLogItem) => {
    setSentAlertsLog((prev) => {
      const next = [entry, ...prev].slice(0, 25);
      try {
        localStorage.setItem(SENT_ALERTS_LOG_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const verifyBotConnection = useCallback(async () => {
    setIsCheckingBot(true);
    try {
      const res = await checkTelegramBotStatus(channel);
      setBotStatus(res);
      return res;
    } finally {
      setIsCheckingBot(false);
    }
  }, [channel]);

  useEffect(() => {
    if (options?.autoCheckOnMount !== false) {
      verifyBotConnection();
    }
  }, [options?.autoCheckOnMount, verifyBotConnection]);

  /**
   * Dispatch a single High-Confidence AI Prediction alert to Telegram
   */
  const sendHighConfidenceAlert = useCallback(
    async (prediction: Prediction): Promise<TelegramBroadcastResult> => {
      setIsSending(true);
      try {
        const res = await sendHighConfidencePredictionAlert(prediction, channel);
        if (res.success) {
          const conf = prediction.confidence_score ?? prediction.confidence ?? 80;
          appendAlertLog({
            id: `hc-${prediction.id}-${Date.now()}`,
            type: 'high_confidence',
            title: `${prediction.home_team} vs ${prediction.away_team}`,
            detail: `${prediction.predicted_outcome || prediction.prediction} (${conf}% Confidence)`,
            timestamp: new Date().toISOString(),
            chatId: res.chatId || channel || '@predictproAi',
            simulated: res.simulated,
          });
        }
        return res;
      } finally {
        setIsSending(false);
      }
    },
    [appendAlertLog, channel]
  );

  /**
   * Dispatch a single Live Score Update alert to Telegram
   */
  const sendLiveScoreAlert = useCallback(
    async (liveMatch: LiveScoreAlertPayload): Promise<TelegramBroadcastResult> => {
      setIsSending(true);
      try {
        const res = await sendLiveScoreUpdateAlert(liveMatch, channel);
        if (res.success) {
          const home = liveMatch.home_team || liveMatch.homeTeam || 'Home';
          const away = liveMatch.away_team || liveMatch.awayTeam || 'Away';
          const score =
            liveMatch.score ?? `${liveMatch.homeScore ?? 0} - ${liveMatch.awayScore ?? 0}`;
          appendAlertLog({
            id: `ls-${liveMatch.id || home}-${Date.now()}`,
            type: 'live_score',
            title: `${home} [${score}] ${away}`,
            detail: `${liveMatch.eventType || 'LIVE SCORE UPDATE'} (${liveMatch.minute || 'LIVE'}')`,
            timestamp: new Date().toISOString(),
            chatId: res.chatId || channel || '@predictproAi',
            simulated: res.simulated,
          });
        }
        return res;
      } finally {
        setIsSending(false);
      }
    },
    [appendAlertLog, channel]
  );

  /**
   * Automatically scans a list of predictions and dispatches unseen high-confidence picks (>= minConfidence)
   */
  const autoDispatchHighConfidencePredictions = useCallback(
    async (predictions: Prediction[], customMinConf?: number) => {
      if (!autoAlertsEnabled || !predictions.length) return { sentCount: 0, results: [] };

      const threshold = customMinConf ?? minConfidence;
      const todayKey = new Date().toISOString().slice(0, 10);
      let seenIds: string[] = [];
      try {
        const raw = localStorage.getItem(`${SENT_PREDICTION_IDS_KEY}_${todayKey}`);
        seenIds = raw ? JSON.parse(raw) : [];
      } catch {
        seenIds = [];
      }

      const unseenHighConf = predictions.filter((p) => {
        const conf = p.confidence_score ?? p.confidence ?? 0;
        return conf >= threshold && !seenIds.includes(p.id);
      });

      if (unseenHighConf.length === 0) {
        return { sentCount: 0, results: [] };
      }

      setIsSending(true);
      try {
        const batchResult = await sendBatchHighConfidenceAlerts(
          unseenHighConf,
          threshold,
          3,
          channel
        );

        const newlySentIds = unseenHighConf.slice(0, 3).map((p) => p.id);
        try {
          localStorage.setItem(
            `${SENT_PREDICTION_IDS_KEY}_${todayKey}`,
            JSON.stringify([...new Set([...seenIds, ...newlySentIds])])
          );
        } catch {
          // Ignore storage error
        }

        unseenHighConf.slice(0, 3).forEach((p, idx) => {
          const r = batchResult.results[idx];
          if (r?.success) {
            appendAlertLog({
              id: `hc-auto-${p.id}-${Date.now()}`,
              type: 'high_confidence',
              title: `${p.home_team} vs ${p.away_team}`,
              detail: `Auto Banker: ${p.predicted_outcome || p.prediction} (${p.confidence_score ?? p.confidence}%)`,
              timestamp: new Date().toISOString(),
              chatId: r.chatId || channel || '@predictproAi',
              simulated: r.simulated,
            });
          }
        });

        return batchResult;
      } finally {
        setIsSending(false);
      }
    },
    [appendAlertLog, autoAlertsEnabled, channel, minConfidence]
  );

  /**
   * Automatically detects goal events or FT transitions in live matches and sends Telegram alerts
   */
  const autoDispatchLiveScoreChanges = useCallback(
    async (
      liveMatches: Array<{
        id: string;
        homeTeam: string;
        awayTeam: string;
        league?: string;
        homeScore: number;
        awayScore: number;
        minute?: number | string;
        status?: string;
      }>
    ) => {
      if (!autoAlertsEnabled || !liveMatches.length) return;

      for (const m of liveMatches) {
        const key = m.id || `${m.homeTeam}-${m.awayTeam}`;
        const currentScore = `${m.homeScore} - ${m.awayScore}`;
        const currentStatus = String(m.status || 'LIVE');
        const prev = previousScoresRef.current.get(key);

        previousScoresRef.current.set(key, { score: currentScore, status: currentStatus });

        if (!prev) continue;

        if (prev.score !== currentScore) {
          await sendLiveScoreAlert({
            id: key,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            score: currentScore,
            minute: m.minute || currentStatus,
            eventType: 'GOAL ALERT',
          });
        } else if (prev.status !== currentStatus && (currentStatus === 'FT' || currentStatus === 'HT')) {
          await sendLiveScoreAlert({
            id: key,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            score: currentScore,
            minute: currentStatus,
            eventType: currentStatus === 'FT' ? 'FULL-TIME RESULT' : 'HALF-TIME UPDATE',
          });
        }
      }
    },
    [autoAlertsEnabled, sendLiveScoreAlert]
  );

  return {
    botStatus,
    isConfigured: Boolean(botStatus?.configured),
    chatId: botStatus?.chatId || channel || '@predictproAi',
    isCheckingBot,
    isSending,
    autoAlertsEnabled,
    setAutoAlertsEnabled,
    sentAlertsLog,
    verifyBotConnection,
    sendHighConfidenceAlert,
    sendLiveScoreAlert,
    autoDispatchHighConfidencePredictions,
    autoDispatchLiveScoreChanges,
  };
}
