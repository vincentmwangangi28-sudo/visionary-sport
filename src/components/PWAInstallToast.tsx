import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  usePWAInstall,
  triggerPWAInstallFlow,
  getPageVisitCount,
  recordPageVisit,
  isPromptDismissed,
  dismissPWAInstallPrompt,
  isPWAInstalled,
  PWA_TOAST_SHOWN_SESSION_KEY,
} from '@/hooks/usePWAInstall';

export const PWA_GET_APP_TOAST_ID = 'predictpro-get-app-toast';

export const PWAInstallToast: React.FC = () => {
  const location = useLocation();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isDesktop,
    install,
    dismissPrompt,
  } = usePWAInstall();

  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Record page visit whenever pathname changes
    const visitNumber = recordPageVisit(location.pathname);

    // Only appear after user's third page visit (visitNumber >= 3)
    if (visitNumber < 3) return;

    // Do not show if app is already running in standalone mode or installed
    if (isInstalled || isPWAInstalled()) return;

    // Do not show if user recently dismissed the prompt (e.g. within 72 hours)
    if (isPromptDismissed()) return;

    // Do not show if already displayed in this tab session
    try {
      if (window.sessionStorage?.getItem(PWA_TOAST_SHOWN_SESSION_KEY) === 'true') {
        return;
      }
    } catch {
      // ignore
    }

    if (hasTriggeredRef.current) return;

    // Polite delay so the page view renders smoothly first
    const timer = setTimeout(() => {
      hasTriggeredRef.current = true;
      try {
        window.sessionStorage?.setItem(PWA_TOAST_SHOWN_SESSION_KEY, 'true');
      } catch {
        // ignore
      }

      const toastTitle = 'Get PredictPro App';
      const toastDescription = isIOS
        ? 'Add PredictPro to your iPhone or iPad home screen for 1-tap full-screen launch.'
        : isDesktop
        ? 'Install PredictPro on your desktop for a dedicated app window & instant launch.'
        : 'Add PredictPro to your home screen for instant 1-tap access, live scores & offline xG.';

      toast(toastTitle, {
        id: PWA_GET_APP_TOAST_ID,
        description: toastDescription,
        duration: 12000,
        action: {
          label: 'Get App',
          onClick: async () => {
            try {
              if (isInstallable) {
                const accepted = await install();
                if (accepted) {
                  toast.success('PredictPro installed to your Home Screen!', {
                    description: 'You can now launch PredictPro directly from your home screen.',
                  });
                  dismissPrompt(8760); // 1 year
                  return;
                }
              }
              // Fallback / standard modal flow (iOS Safari guide, desktop downloaders, etc.)
              triggerPWAInstallFlow();
            } catch {
              triggerPWAInstallFlow();
            }
          },
        },
        cancel: {
          label: 'Maybe Later',
          onClick: () => {
            dismissPWAInstallPrompt(72); // Dismiss for 72 hours
          },
        },
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [location.pathname, isInstallable, isInstalled, isIOS, isDesktop, install, dismissPrompt]);

  // Support manual/programmatic triggering via custom event
  useEffect(() => {
    const handleManualTrigger = () => {
      triggerPWAInstallFlow();
    };
    window.addEventListener('predictpro:trigger-get-app-toast', handleManualTrigger);
    return () =>
      window.removeEventListener('predictpro:trigger-get-app-toast', handleManualTrigger);
  }, []);

  return null;
};

export default PWAInstallToast;
