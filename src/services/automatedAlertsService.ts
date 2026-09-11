/**
 * Automated Alerts Service
 * Orchestrates proactive, automated notifications for:
 * 1. Pinned clubs & leagues (kickoff reminders, match starts, final scores)
 * 2. High-confidence AI Banker Picks (e.g. >= 85% confidence)
 * 3. +EV Value Bets (positive expected value / CLV edge >= 5%)
 * 4. In-play live goal flash alerts
 */

import { showBrowserNotification, isPushSupported, requestPushPermission, getPushPermission } from './matchNotificationService';
import { playAlertChime } from '@/utils/audioAlert';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { Prediction } from '@/types/prediction';

export interface AutomatedAlertsConfig {
  enabled: boolean;
  alertOnPinnedClubs: boolean;
  alertOnPinnedLeagues: boolean;
  alertOnHighConfidence: boolean;
  minConfidenceThreshold: number; // e.g. 80, 85, 90
  alertOnValueBets: boolean;
  minValueEdgeThreshold: number; // e.g. 4, 6, 8 (%)
  kickoffLeadMinutes: number; // 15, 30, 60
  soundEnabled: boolean;
  browserPushEnabled: boolean;
  inAppToastEnabled: boolean;
  dailyDigestEnabled: boolean;
}

export const DEFAULT_ALERTS_CONFIG: AutomatedAlertsConfig = {
  enabled: true,
  alertOnPinnedClubs: true,
  alertOnPinnedLeagues: true,
  alertOnHighConfidence: true,
  minConfidenceThreshold: 85,
  alertOnValueBets: true,
  minValueEdgeThreshold: 5,
  kickoffLeadMinutes: 30,
  soundEnabled: true,
  browserPushEnabled: true,
  inAppToastEnabled: true,
  dailyDigestEnabled: true,
};

const CONFIG_STORAGE_KEY = 'predictpro_automated_alerts_config';
const NOTIFIED_CACHE_KEY = 'predictpro_notified_automated_alerts';
const NOTIF_FEED_STORAGE_KEY = 'predictpro_notifications';
const CONFIG_CHANGE_EVENT = 'predictpro:alerts_config_changed';
const ALERT_FIRED_EVENT = 'predictpro:automated_alert_fired';

export interface AutomatedAlertItem {
  id: string;
  type: 'pinned_club' | 'pinned_league' | 'high_confidence' | 'value_bet' | 'goal_alert' | 'system';
  title: string;
  message: string;
  matchId?: string;
  matchTitle?: string;
  league?: string;
  kickoff?: string;
  edge?: number;
  confidence?: number;
  timestamp: string;
  url?: string;
}

/**
 * Get current automated alerts configuration
 */
export function getAutomatedAlertsConfig(): AutomatedAlertsConfig {
  if (typeof window === 'undefined') return DEFAULT_ALERTS_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_ALERTS_CONFIG;
    return { ...DEFAULT_ALERTS_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALERTS_CONFIG;
  }
}

/**
 * Update automated alerts configuration
 */
export function saveAutomatedAlertsConfig(updates: Partial<AutomatedAlertsConfig>): AutomatedAlertsConfig {
  const current = getAutomatedAlertsConfig();
  const updated = { ...current, ...updates };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem('predictpro_sound_alerts', String(updated.soundEnabled));
      window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT, { detail: updated }));
    } catch (e) {
      console.error('Failed to save automated alerts config:', e);
    }
  }
  return updated;
}

/**
 * Get IDs of already fired automated alerts to avoid duplicate notifications
 */
function getNotifiedAlertIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markAlertAsNotified(alertId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getNotifiedAlertIds();
    set.add(alertId);
    // Keep max 200 alert IDs
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Failed to mark alert as notified', e);
  }
}

/**
 * Add an item to the persistent in-app notifications feed
 */
export function appendInAppNotification(alert: AutomatedAlertItem): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(NOTIF_FEED_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];

    const newItem = {
      id: alert.id,
      type: alert.type === 'goal_alert' ? 'goal_alert' : alert.type === 'value_bet' ? 'goal_alert' : 'match_alert',
      message: `${alert.title}: ${alert.message}`,
      read: false,
      created_at: alert.timestamp,
    };

    const updated = [newItem, ...existing.filter((item: { id: string }) => item.id !== alert.id)].slice(0, 30);
    localStorage.setItem(NOTIF_FEED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('predictpro:notifications_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to append in-app notification', e);
  }
}

/**
 * Dispatches an automated alert across browser push, sound, in-app feed, and custom event
 */
export async function dispatchAutomatedAlert(alert: AutomatedAlertItem): Promise<boolean> {
  const config = getAutomatedAlertsConfig();
  if (!config.enabled) return false;

  const notifiedSet = getNotifiedAlertIds();
  if (notifiedSet.has(alert.id)) return false;

  markAlertAsNotified(alert.id);

  // 1. Play auditory chime
  if (config.soundEnabled) {
    const chimeType = alert.type === 'goal_alert' ? 'goal' : alert.type === 'value_bet' ? 'value' : 'kickoff';
    playAlertChime(chimeType);
  }

  // 2. Append to persistent in-app notifications
  appendInAppNotification(alert);

  // 3. Dispatch global custom event for interactive toast / listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ALERT_FIRED_EVENT, { detail: alert }));
  }

  // 4. Send Browser Push Notification if permission granted
  if (config.browserPushEnabled && isPushSupported() && getPushPermission() === 'granted') {
    await showBrowserNotification(alert.title, {
      body: alert.message,
      tag: alert.id,
      data: { url: alert.url || '/dashboard' },
    });
  }

  return true;
}

/**
 * Reads user's pinned clubs and leagues from active storage
 */
function getActivePinnedData(): { pinnedTeams: string[]; pinnedLeagues: string[] } {
  if (typeof window === 'undefined') {
    return {
      pinnedTeams: ['Arsenal', 'Real Madrid', 'Gor Mahia', 'Bayern Munich'],
      pinnedLeagues: ['Premier League', 'Champions League', 'La Liga'],
    };
  }

  try {
    // Scan localStorage keys for user or guest pinned data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('predictpro_pinned_dashboard_')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          return {
            pinnedTeams: parsed.pinnedTeams || [],
            pinnedLeagues: parsed.pinnedLeagues || [],
          };
        }
      }
    }
  } catch {
    // fallback
  }

  return {
    pinnedTeams: ['Arsenal', 'Real Madrid', 'Gor Mahia', 'Bayern Munich'],
    pinnedLeagues: ['Premier League', 'Champions League', 'La Liga'],
  };
}

/**
 * Evaluates active automated alert triggers based on current schedule and preferences
 */
export async function evaluateAutomatedAlerts(): Promise<number> {
  const config = getAutomatedAlertsConfig();
  if (!config.enabled) return 0;

  const { pinnedTeams, pinnedLeagues } = getActivePinnedData();
  const predictions: Prediction[] = DEFAULT_PREDICTIONS;
  const now = Date.now();
  let alertsCount = 0;

  for (const match of predictions) {
    const matchTime = new Date(match.match_date).getTime();
    if (isNaN(matchTime)) continue;

    const diffMinutes = (matchTime - now) / 60000;
    const isPinnedClubMatch = pinnedTeams.some(
      (t) => t.toLowerCase() === match.home_team.toLowerCase() || t.toLowerCase() === match.away_team.toLowerCase()
    );
    const isPinnedLeagueMatch = pinnedLeagues.some(
      (l) => l.toLowerCase() === match.league.toLowerCase()
    );

    // Rule A: Pinned Club Kickoff Reminder
    if (
      config.alertOnPinnedClubs &&
      isPinnedClubMatch &&
      diffMinutes <= config.kickoffLeadMinutes &&
      diffMinutes > -5
    ) {
      const alertId = `auto-club-kickoff-${match.id}-${Math.floor(now / 3600000)}`;
      const triggered = await dispatchAutomatedAlert({
        id: alertId,
        type: 'pinned_club',
        title: `⚽ Kickoff Alert: ${match.home_team} vs ${match.away_team}`,
        message: `${match.home_team} vs ${match.away_team} kicks off in ${Math.max(1, Math.round(diffMinutes))} mins (${match.league}). AI Tip: ${match.prediction} (${match.confidence}% Confidence).`,
        matchId: match.id,
        matchTitle: `${match.home_team} vs ${match.away_team}`,
        league: match.league,
        kickoff: match.match_date,
        confidence: match.confidence,
        timestamp: new Date().toISOString(),
        url: `/match/${encodeURIComponent(match.home_team.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-vs-${encodeURIComponent(match.away_team.toLowerCase().replace(/[^a-z0-9]/g, '-'))}`,
      });
      if (triggered) alertsCount++;
    }

    // Rule B: High-Confidence Banker Pick Alert (>= minConfidenceThreshold)
    if (
      config.alertOnHighConfidence &&
      match.confidence >= config.minConfidenceThreshold &&
      diffMinutes > 0 &&
      diffMinutes <= 1440 // Next 24 hours
    ) {
      const alertId = `auto-banker-${match.id}-${new Date().toISOString().split('T')[0]}`;
      const triggered = await dispatchAutomatedAlert({
        id: alertId,
        type: 'high_confidence',
        title: `🔥 Banker Pick (${match.confidence}%): ${match.home_team} vs ${match.away_team}`,
        message: `High confidence AI Pick [${match.prediction}] identified for ${match.home_team} vs ${match.away_team} in ${match.league}.`,
        matchId: match.id,
        matchTitle: `${match.home_team} vs ${match.away_team}`,
        league: match.league,
        kickoff: match.match_date,
        confidence: match.confidence,
        timestamp: new Date().toISOString(),
        url: `/recommendations`,
      });
      if (triggered) alertsCount++;
    }

    // Rule C: Pinned League Big Match Alert
    if (
      config.alertOnPinnedLeagues &&
      isPinnedLeagueMatch &&
      !isPinnedClubMatch &&
      diffMinutes <= config.kickoffLeadMinutes &&
      diffMinutes > -5
    ) {
      const alertId = `auto-league-kickoff-${match.id}-${Math.floor(now / 3600000)}`;
      const triggered = await dispatchAutomatedAlert({
        id: alertId,
        type: 'pinned_league',
        title: `🏆 ${match.league} Match Starting: ${match.home_team} vs ${match.away_team}`,
        message: `Upcoming fixture in your pinned ${match.league}. AI Tip: ${match.prediction} (${match.confidence}%).`,
        matchId: match.id,
        matchTitle: `${match.home_team} vs ${match.away_team}`,
        league: match.league,
        kickoff: match.match_date,
        confidence: match.confidence,
        timestamp: new Date().toISOString(),
        url: `/tournaments`,
      });
      if (triggered) alertsCount++;
    }
  }

  return alertsCount;
}

/**
 * Helper to dispatch simulated automated alerts for testing and instant user feedback
 */
export async function sendSimulatedAutomatedAlert(
  type: 'pinned_club' | 'high_confidence' | 'value_bet' | 'goal_alert'
): Promise<boolean> {
  const { pinnedTeams } = getActivePinnedData();
  const sampleTeam = pinnedTeams[0] || 'Arsenal';
  const timestamp = new Date().toISOString();

  let alertItem: AutomatedAlertItem;

  switch (type) {
    case 'pinned_club':
      alertItem = {
        id: `sim-club-${Date.now()}`,
        type: 'pinned_club',
        title: `⚽ Kickoff in 15 mins: ${sampleTeam} vs Opponent`,
        message: `${sampleTeam} is about to kick off! Lineups confirmed. AI Model predicts Home Win (84% Confidence).`,
        matchTitle: `${sampleTeam} vs Opponent`,
        league: 'Premier League',
        confidence: 84,
        timestamp,
        url: '/dashboard',
      };
      break;
    case 'high_confidence':
      alertItem = {
        id: `sim-banker-${Date.now()}`,
        type: 'high_confidence',
        title: `🔥 89% Banker Pick: Real Madrid vs Real Sociedad`,
        message: `AI Core detected a high probability Home Win tip with 89% confidence. Projected scoreline: 2-0.`,
        matchTitle: 'Real Madrid vs Real Sociedad',
        league: 'La Liga',
        confidence: 89,
        timestamp,
        url: '/recommendations',
      };
      break;
    case 'value_bet':
      alertItem = {
        id: `sim-val-${Date.now()}`,
        type: 'value_bet',
        title: `⚡ +EV Value Edge Alert: Over 2.5 Goals @ 2.10`,
        message: `Closing Line Value model found a +7.8% statistical edge over consensus bookmaker odds.`,
        matchTitle: 'Bayern Munich vs Bayer Leverkusen',
        league: 'Bundesliga',
        edge: 7.8,
        timestamp,
        url: '/value-bets',
      };
      break;
    case 'goal_alert':
    default:
      alertItem = {
        id: `sim-goal-${Date.now()}`,
        type: 'goal_alert',
        title: `🚨 GOAL FLASH! (34') ${sampleTeam} 1 - 0 Opponent`,
        message: `Goal scored! Prediction on track. Live in-play xG momentum currently at 72% for ${sampleTeam}.`,
        matchTitle: `${sampleTeam} vs Opponent`,
        league: 'Premier League',
        timestamp,
        url: '/live',
      };
      break;
  }

  return await dispatchAutomatedAlert(alertItem);
}

/**
 * Listen for automated alerts config changes
 */
export function onAlertsConfigChange(callback: (config: AutomatedAlertsConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AutomatedAlertsConfig>;
    callback(custom.detail || getAutomatedAlertsConfig());
  };
  window.addEventListener(CONFIG_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
}

/**
 * Listen for newly fired automated alerts
 */
export function onAutomatedAlertFired(callback: (alert: AutomatedAlertItem) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AutomatedAlertItem>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(ALERT_FIRED_EVENT, handler);
  return () => window.removeEventListener(ALERT_FIRED_EVENT, handler);
}
