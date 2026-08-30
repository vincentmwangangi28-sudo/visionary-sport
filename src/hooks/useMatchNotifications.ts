import { useState, useEffect, useCallback } from 'react';
import {
  MatchNotificationSubscription,
  getAllSubscriptions,
  isMatchSubscribed,
  getMatchSubscription,
  subscribeToMatch,
  unsubscribeFromMatch,
  updateSubscriptionOptions,
  getPushPermission,
  requestPushPermission,
  isPushSupported,
  sendTestMatchNotification,
  sendMatchResultNotification,
  checkUpcomingMatchAlerts,
  onSubscriptionsChange,
} from '@/services/matchNotificationService';
import { toast } from 'sonner';

export function useMatchNotifications() {
  const [subscriptions, setSubscriptions] = useState<MatchNotificationSubscription[]>(() =>
    getAllSubscriptions()
  );
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getPushPermission()
  );

  // Sync state on change
  useEffect(() => {
    const unsub = onSubscriptionsChange((subs) => {
      setSubscriptions(subs);
      setPermission(getPushPermission());
    });
    return unsub;
  }, []);

  // Periodic checker loop for match alerts
  useEffect(() => {
    checkUpcomingMatchAlerts();
    const interval = setInterval(() => {
      checkUpcomingMatchAlerts();
    }, 45000); // Check every 45s

    return () => clearInterval(interval);
  }, []);

  const requestPermission = useCallback(async () => {
    const perm = await requestPushPermission();
    setPermission(perm);
    return perm;
  }, []);

  const toggleSubscribe = useCallback(
    async (
      match: {
        matchId: string;
        homeTeam: string;
        awayTeam: string;
        league: string;
        matchDate: string;
        homeLogo?: string | null;
        awayLogo?: string | null;
        prediction?: string;
        confidence?: number;
        odds?: { home?: number; draw?: number; away?: number };
      },
      options?: { kickoffReminder?: boolean; liveScoreAlerts?: boolean; finalResult?: boolean }
    ) => {
      const matchId = String(match.matchId);
      const currentlySubscribed = isMatchSubscribed(matchId);

      if (currentlySubscribed) {
        unsubscribeFromMatch(matchId);
        toast.info(`Unsubscribed from ${match.homeTeam} vs ${match.awayTeam} alerts`);
        return false;
      } else {
        const defaultOptions = {
          kickoffReminder: options?.kickoffReminder ?? true,
          liveScoreAlerts: options?.liveScoreAlerts ?? true,
          finalResult: options?.finalResult ?? true,
        };

        const res = await subscribeToMatch({
          ...match,
          options: defaultOptions,
        });

        if (res.permission === 'denied') {
          toast.error('Notifications are blocked by your browser. Please enable them in browser site settings.');
        } else if (res.permission === 'granted') {
          toast.success(`Subscribed to ${match.homeTeam} vs ${match.awayTeam}! You will get kickoff & match result alerts.`);
        } else {
          toast.info(`Alert preference saved for ${match.homeTeam} vs ${match.awayTeam}.`);
        }
        return true;
      }
    },
    []
  );

  const updateOptions = useCallback(
    (matchId: string, options: MatchNotificationSubscription['options']) => {
      updateSubscriptionOptions(matchId, options);
      toast.success('Alert preferences updated');
    },
    []
  );

  const testAlert = useCallback(async (sample?: Partial<MatchNotificationSubscription>) => {
    const success = await sendTestMatchNotification(sample);
    if (success) {
      toast.success('Test match notification sent to your browser! 🔔');
    } else {
      toast.error('Could not send notification. Please check browser permission.');
    }
  }, []);

  const simulateResult = useCallback(async (matchId: string) => {
    const sub = getMatchSubscription(matchId);
    if (!sub) {
      toast.error('Match not found in subscriptions');
      return;
    }
    await sendMatchResultNotification(sub, '2 - 1', true);
    toast.success(`Simulated result alert for ${sub.homeTeam} vs ${sub.awayTeam}! 🏁`);
  }, []);

  return {
    subscriptions,
    permission,
    isSupported: isPushSupported(),
    isSubscribed: (matchId: string) => isMatchSubscribed(String(matchId)),
    getSubscription: (matchId: string) => getMatchSubscription(String(matchId)),
    toggleSubscribe,
    unsubscribe: (matchId: string) => {
      unsubscribeFromMatch(String(matchId));
      toast.info('Match alert removed');
    },
    updateOptions,
    requestPermission,
    testAlert,
    simulateResult,
  };
}
