import { useState, useEffect, useCallback } from 'react';
import {
  AutomatedAlertsConfig,
  getAutomatedAlertsConfig,
  saveAutomatedAlertsConfig,
  evaluateAutomatedAlerts,
  sendSimulatedAutomatedAlert,
  onAlertsConfigChange,
  onAutomatedAlertFired,
  AutomatedAlertItem,
} from '@/services/automatedAlertsService';
import {
  getPushPermission,
  requestPushPermission,
  isPushSupported,
} from '@/services/matchNotificationService';
import { toast } from 'sonner';

export function useAutomatedAlerts() {
  const [config, setConfig] = useState<AutomatedAlertsConfig>(() => getAutomatedAlertsConfig());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => getPushPermission());

  // Listen to config changes
  useEffect(() => {
    const unsubConfig = onAlertsConfigChange((newConfig) => {
      setConfig(newConfig);
      setPermission(getPushPermission());
    });
    return unsubConfig;
  }, []);

  // Listen to fired alerts to show in-app toasts
  useEffect(() => {
    const unsubAlert = onAutomatedAlertFired((alert: AutomatedAlertItem) => {
      if (config.inAppToastEnabled) {
        toast(alert.title, {
          description: alert.message,
          duration: 5000,
        });
      }
    });
    return unsubAlert;
  }, [config.inAppToastEnabled]);

  // Periodic evaluation loop (checks every 45s and on page focus)
  useEffect(() => {
    if (!config.enabled) return;

    evaluateAutomatedAlerts();
    const interval = setInterval(() => {
      evaluateAutomatedAlerts();
    }, 45000);

    const onFocus = () => {
      evaluateAutomatedAlerts();
      setPermission(getPushPermission());
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [config.enabled]);

  const updateConfig = useCallback((updates: Partial<AutomatedAlertsConfig>) => {
    const saved = saveAutomatedAlertsConfig(updates);
    setConfig(saved);
    toast.success('Automated alert settings saved');
  }, []);

  const enableBrowserPush = useCallback(async () => {
    if (!isPushSupported()) {
      toast.error('Browser push notifications are not supported in this browser.');
      return 'unsupported';
    }

    const perm = await requestPushPermission();
    setPermission(perm);

    if (perm === 'granted') {
      updateConfig({ browserPushEnabled: true });
      toast.success('Browser push alerts enabled! You will receive automated match notifications.');
    } else if (perm === 'denied') {
      toast.error('Push notifications were blocked. Please enable them in your browser site permissions.');
    }
    return perm;
  }, [updateConfig]);

  const testAlert = useCallback(async (type: 'pinned_club' | 'high_confidence' | 'value_bet' | 'goal_alert') => {
    const success = await sendSimulatedAutomatedAlert(type);
    if (success) {
      toast.success('Simulated automated alert dispatched! 🔔');
    } else {
      toast.info('Alert generated in notification center.');
    }
    return success;
  }, []);

  const evaluateNow = useCallback(async () => {
    const count = await evaluateAutomatedAlerts();
    if (count > 0) {
      toast.success(`Evaluated rules: ${count} new automated alert(s) triggered.`);
    } else {
      toast.info('Evaluated automated rules: all match schedules up to date.');
    }
    return count;
  }, []);

  return {
    config,
    updateConfig,
    permission,
    isPushSupported: isPushSupported(),
    enableBrowserPush,
    testAlert,
    evaluateNow,
  };
}
