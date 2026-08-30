/**
 * Match Notification & Browser Push Service
 * Handles user subscriptions for upcoming matches, kickoff reminders, and final match results.
 */

export interface MatchNotificationSubscription {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  prediction?: string;
  confidence?: number;
  odds?: {
    home?: number;
    draw?: number;
    away?: number;
  };
  options: {
    kickoffReminder: boolean; // 15 mins before kickoff
    liveScoreAlerts: boolean;  // Key in-play events
    finalResult: boolean;      // Final score + AI Tip outcome
  };
  subscribedAt: string;
  kickoffNotified?: boolean;
  resultNotified?: boolean;
}

const STORAGE_KEY = 'predictpro_match_subscriptions';
const EVENT_NAME = 'predictpro:subscriptions_changed';

/**
 * Check if the browser supports push notifications and service worker
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser push permission status
 */
export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Ensure service worker is registered
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          console.warn('SW registration note:', e);
        }
      }
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Get all active subscriptions from localStorage
 */
export function getAllSubscriptions(): MatchNotificationSubscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as MatchNotificationSubscription[];
  } catch {
    return [];
  }
}

function saveSubscriptions(subs: MatchNotificationSubscription[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: subs }));
  } catch (e) {
    console.error('Failed to save subscriptions:', e);
  }
}

/**
 * Check if a specific match is subscribed
 */
export function isMatchSubscribed(matchId: string): boolean {
  if (!matchId) return false;
  const subs = getAllSubscriptions();
  return subs.some((s) => s.matchId === String(matchId));
}

/**
 * Get subscription details for a match
 */
export function getMatchSubscription(matchId: string): MatchNotificationSubscription | undefined {
  if (!matchId) return undefined;
  const subs = getAllSubscriptions();
  return subs.find((s) => s.matchId === String(matchId));
}

/**
 * Subscribe to an upcoming match with specified notification options
 */
export async function subscribeToMatch(
  subData: Omit<MatchNotificationSubscription, 'subscribedAt'>
): Promise<{ success: boolean; permission: NotificationPermission | 'unsupported' }> {
  const perm = await requestPushPermission();
  
  const current = getAllSubscriptions();
  const existingIndex = current.findIndex((s) => s.matchId === String(subData.matchId));

  const newSub: MatchNotificationSubscription = {
    ...subData,
    matchId: String(subData.matchId),
    subscribedAt: new Date().toISOString(),
    kickoffNotified: false,
    resultNotified: false,
  };

  let updated: MatchNotificationSubscription[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...newSub };
  } else {
    updated = [newSub, ...current];
  }

  saveSubscriptions(updated);

  // If permission granted, show an immediate confirmation push notification
  if (perm === 'granted') {
    showBrowserNotification(`🔔 Subscribed: ${subData.homeTeam} vs ${subData.awayTeam}`, {
      body: `You'll receive alerts for ${subData.homeTeam} vs ${subData.awayTeam} (${subData.league}). AI Tip: ${subData.prediction || 'Available'}`,
      tag: `sub-confirm-${subData.matchId}`,
      data: { url: `/match/${encodeURIComponent(subData.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-vs-${encodeURIComponent(subData.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}` }
    }).catch(() => {});
  }

  return {
    success: true,
    permission: perm,
  };
}

/**
 * Unsubscribe from a match
 */
export function unsubscribeFromMatch(matchId: string): void {
  const current = getAllSubscriptions();
  const updated = current.filter((s) => s.matchId !== String(matchId));
  saveSubscriptions(updated);
}

/**
 * Update alert options for an existing subscription
 */
export function updateSubscriptionOptions(
  matchId: string,
  options: MatchNotificationSubscription['options']
): void {
  const current = getAllSubscriptions();
  const index = current.findIndex((s) => s.matchId === String(matchId));
  if (index >= 0) {
    const updated = [...current];
    updated[index] = { ...updated[index], options };
    saveSubscriptions(updated);
  }
}

/**
 * Display a native browser notification via Service Worker (preferred for PWA & background) or Notification constructor
 */
export async function showBrowserNotification(
  title: string,
  options: NotificationOptions & { data?: { url?: string } } = {}
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icon-192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    }
  } catch {
    // Service worker fallback
  }

  try {
    new window.Notification(title, defaultOptions);
    return true;
  } catch (e) {
    console.warn('Fallback Notification constructor failed:', e);
    return false;
  }
}

/**
 * Send a test match notification to confirm push works on user's device
 */
export async function sendTestMatchNotification(
  sample?: Partial<MatchNotificationSubscription>
): Promise<boolean> {
  const home = sample?.homeTeam || 'Arsenal';
  const away = sample?.awayTeam || 'Chelsea';
  const league = sample?.league || 'Premier League';
  const tip = sample?.prediction || 'Home Win (2-1)';
  const conf = sample?.confidence || 86;

  const perm = await requestPushPermission();
  if (perm !== 'granted') return false;

  return await showBrowserNotification(`⚽ Match Alert: ${home} vs ${away}`, {
    body: `🏆 ${league} · Kickoff in 15 mins! AI Tip: ${tip} (${conf}% Confidence). Tap to view deep analytics.`,
    tag: `test-match-alert-${Date.now()}`,
    data: { url: '/live' },
  });
}

/**
 * Send a simulated full-time result notification for a match
 */
export async function sendMatchResultNotification(
  sub: MatchNotificationSubscription,
  resultScore = '2 - 1',
  outcomeWon = true
): Promise<boolean> {
  return await showBrowserNotification(`🏁 FULL-TIME: ${sub.homeTeam} ${resultScore} ${sub.awayTeam}`, {
    body: `✅ AI Tip [${sub.prediction || 'Match Pick'}] ${outcomeWon ? 'WON 🎯' : 'ENDED'}! Final score: ${sub.homeTeam} ${resultScore} ${sub.awayTeam}.`,
    tag: `match-ft-${sub.matchId}`,
    data: { url: `/match/${encodeURIComponent(sub.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-vs-${encodeURIComponent(sub.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}` },
  });
}

/**
 * Background checker: Evaluates subscribed matches against current time
 * and triggers alerts for kickoff (15 mins prior) and final results.
 */
export function checkUpcomingMatchAlerts(): void {
  if (typeof window === 'undefined') return;
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const now = Date.now();
  const subs = getAllSubscriptions();
  let hasChanges = false;

  const updated = subs.map((sub) => {
    const matchTime = new Date(sub.matchDate).getTime();
    if (isNaN(matchTime)) return sub;

    const diffMinutes = (matchTime - now) / 60000;

    // 1. Kickoff Reminder (Within 15 minutes before match and not yet notified)
    if (
      sub.options.kickoffReminder &&
      !sub.kickoffNotified &&
      diffMinutes <= 15 &&
      diffMinutes > -5
    ) {
      showBrowserNotification(`⏰ Kickoff Soon: ${sub.homeTeam} vs ${sub.awayTeam}`, {
        body: `Match starts in ${Math.max(1, Math.round(diffMinutes))} mins (${sub.league}). AI Tip: ${sub.prediction || 'Available'} (${sub.confidence ? sub.confidence + '%' : 'High Edge'})`,
        tag: `kickoff-${sub.matchId}`,
        data: { url: `/match/${encodeURIComponent(sub.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-vs-${encodeURIComponent(sub.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}` },
      });
      hasChanges = true;
      return { ...sub, kickoffNotified: true };
    }

    // 2. Final Result Notification (Approx 115 mins after match start)
    if (
      sub.options.finalResult &&
      !sub.resultNotified &&
      diffMinutes < -115 &&
      diffMinutes > -360
    ) {
      showBrowserNotification(`🏁 FT Result: ${sub.homeTeam} vs ${sub.awayTeam}`, {
        body: `Match finished! Check final stats and AI prediction performance for ${sub.homeTeam} vs ${sub.awayTeam}.`,
        tag: `ft-check-${sub.matchId}`,
        data: { url: `/match/${encodeURIComponent(sub.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-vs-${encodeURIComponent(sub.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-'))}` },
      });
      hasChanges = true;
      return { ...sub, resultNotified: true };
    }

    return sub;
  });

  if (hasChanges) {
    saveSubscriptions(updated);
  }
}

/**
 * Hook or helper to subscribe to subscription change events
 */
export function onSubscriptionsChange(callback: (subs: MatchNotificationSubscription[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<MatchNotificationSubscription[]>;
    callback(custom.detail || getAllSubscriptions());
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
