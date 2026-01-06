import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trackFeatureEngagement } from '@/lib/analytics';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        trackFeatureEngagement('push_notifications', 'enabled');
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive updates on matches and predictions!",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "You won't receive push notifications.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const sendNotification = useCallback(({ title, body, icon, tag, data }: NotificationPayload) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
        badge: '/favicon.ico',
      });

      notification.onclick = () => {
        window.focus();
        if (data?.url) {
          window.location.href = data.url;
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission]);

  // Notification presets for common events
  const notifyMatchStart = useCallback((homeTeam: string, awayTeam: string, league: string) => {
    sendNotification({
      title: '⚽ Match Starting!',
      body: `${homeTeam} vs ${awayTeam} is about to kick off in ${league}`,
      tag: 'match-start',
      data: { type: 'match_start', url: '/' },
    });
  }, [sendNotification]);

  const notifyPredictionResult = useCallback((homeTeam: string, awayTeam: string, isCorrect: boolean) => {
    sendNotification({
      title: isCorrect ? '🎉 Prediction Correct!' : '📊 Match Result',
      body: isCorrect 
        ? `Your prediction for ${homeTeam} vs ${awayTeam} was spot on!` 
        : `${homeTeam} vs ${awayTeam} has ended. Check the results!`,
      tag: 'prediction-result',
      data: { type: 'prediction_result', url: '/performance' },
    });
  }, [sendNotification]);

  const notifyStreak = useCallback((streakCount: number) => {
    sendNotification({
      title: '🔥 Streak Milestone!',
      body: `Amazing! You've hit a ${streakCount}-prediction winning streak!`,
      tag: 'streak',
      data: { type: 'streak', url: '/performance' },
    });
  }, [sendNotification]);

  const notifyNewContest = useCallback((contestName: string, prizePool: number) => {
    sendNotification({
      title: '🏆 New Contest Available!',
      body: `${contestName} is now open with a ${prizePool.toLocaleString()} KES prize pool!`,
      tag: 'new-contest',
      data: { type: 'new_contest', url: '/leaderboard' },
    });
  }, [sendNotification]);

  const notifyDailyPrediction = useCallback(() => {
    sendNotification({
      title: '🎯 Daily Free Prediction',
      body: "Your free daily high-confidence prediction is ready!",
      tag: 'daily-prediction',
      data: { type: 'daily_prediction', url: '/' },
    });
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyMatchStart,
    notifyPredictionResult,
    notifyStreak,
    notifyNewContest,
    notifyDailyPrediction,
  };
};
