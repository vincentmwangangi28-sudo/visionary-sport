import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_DISMISS_UNTIL_KEY = 'predictpro_pwa_dismiss_until_v1';
const PWA_VISIT_COUNT_KEY = 'predictpro_pwa_visit_count_v1';
const PWA_INSTALLED_FLAG_KEY = 'predictpro_pwa_installed_v1';

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptSubscribers = new Set<(ev: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptSubscribers.forEach((cb) => cb(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      window.localStorage.setItem(PWA_INSTALLED_FLAG_KEY, 'true');
    } catch {
      // ignore
    }
    promptSubscribers.forEach((cb) => cb(null));
  });
}

export function triggerPWAInstallFlow(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('predictpro:open-pwa-install-modal'));
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        (window.navigator as unknown as { standalone?: boolean })?.standalone === true ||
        window.localStorage.getItem(PWA_INSTALLED_FLAG_KEY) === 'true';
      return Boolean(standalone);
    } catch {
      return false;
    }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    try {
      const prevVisits = parseInt(window.localStorage.getItem(PWA_VISIT_COUNT_KEY) || '0', 10);
      const nextVisits = (!Number.isNaN(prevVisits) && prevVisits > 0 ? prevVisits : 0) + 1;
      window.localStorage.setItem(PWA_VISIT_COUNT_KEY, String(nextVisits));
      setVisitCount(nextVisits);

      const dismissUntil = parseInt(window.localStorage.getItem(PWA_DISMISS_UNTIL_KEY) || '0', 10);
      if (!Number.isNaN(dismissUntil) && dismissUntil > Date.now()) {
        setShouldShowPrompt(false);
      }
    } catch {
      // ignore storage errors
    }

    const subscriber = (ev: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(ev);
      if (ev === null && window.localStorage.getItem(PWA_INSTALLED_FLAG_KEY) === 'true') {
        setIsInstalled(true);
      }
    };
    promptSubscribers.add(subscriber);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        window.localStorage.setItem(PWA_INSTALLED_FLAG_KEY, 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptSubscribers.delete(subscriber);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const activePrompt = deferredPrompt || globalDeferredPrompt;
    if (!activePrompt) return false;
    try {
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setIsInstalled(true);
        setDeferredPrompt(null);
        try {
          window.localStorage.setItem(PWA_INSTALLED_FLAG_KEY, 'true');
        } catch {
          // ignore
        }
        return true;
      }
    } catch {
      // ignore prompt errors
    }
    return false;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback((hours = 48) => {
    setShouldShowPrompt(false);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          PWA_DISMISS_UNTIL_KEY,
          String(Date.now() + hours * 3600 * 1000)
        );
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    visitCount,
    shouldShowPrompt,
    install,
    dismissPrompt,
    openInstallModal: triggerPWAInstallFlow,
  };
}

