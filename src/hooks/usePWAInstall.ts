import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEYS = {
  VISIT_COUNT: 'predictpro_pwa_visit_count',
  SESSION_ACTIVE: 'predictpro_pwa_session_active',
  PROMPT_DISMISSED: 'predictpro_pwa_prompt_dismissed',
  PROMPT_FORCE_SHOW: 'predictpro_pwa_force_prompt',
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [visitCount, setVisitCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT);
      return stored ? Math.max(1, parseInt(stored, 10)) : 1;
    } catch {
      return 1;
    }
  });
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEYS.PROMPT_DISMISSED);
      if (!dismissedUntil) return false;
      return Date.now() < parseInt(dismissedUntil, 10);
    } catch {
      return false;
    }
  });
  const [manualTrigger, setManualTrigger] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Track user visits (at least twice rule)
    try {
      const sessionActive = sessionStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE);
      if (!sessionActive) {
        // New session / visit
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true');
        const storedCount = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT);
        const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
        const newCount = currentCount + 1;
        localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(newCount));
        setVisitCount(newCount);
      } else {
        const storedCount = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT);
        if (storedCount) {
          setVisitCount(parseInt(storedCount, 10));
        }
      }

      // Check URL search params for testing override (?pwa_prompt=1)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('pwa_prompt') === '1' || urlParams.get('install') === '1') {
        setManualTrigger(true);
      }
    } catch {
      // Storage access may be restricted
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
      } catch {}
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  };

  const dismissPrompt = useCallback((hours = 48) => {
    setIsDismissed(true);
    setManualTrigger(false);
    try {
      const expiry = Date.now() + hours * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED, String(expiry));
    } catch {}
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.PROMPT_DISMISSED);
    } catch {}
  }, []);

  const simulateSecondVisit = useCallback(() => {
    const nextCount = Math.max(2, visitCount + 1);
    setVisitCount(nextCount);
    setIsDismissed(false);
    setManualTrigger(true);
    try {
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(nextCount));
      localStorage.removeItem(STORAGE_KEYS.PROMPT_DISMISSED);
    } catch {}
  }, [visitCount]);

  const triggerManualPrompt = useCallback(() => {
    setManualTrigger(true);
    setIsDismissed(false);
  }, []);

  // Determine if the custom prompt should be presented to the user
  const hasVisitedTwice = visitCount >= 2;
  const shouldShowPrompt = (!isInstalled && hasVisitedTwice && !isDismissed) || manualTrigger;

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    install,
    visitCount,
    hasVisitedTwice,
    isDismissed,
    shouldShowPrompt,
    dismissPrompt,
    resetDismissal,
    simulateSecondVisit,
    triggerManualPrompt,
  };
}
