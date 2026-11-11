import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Download,
  Share,
  X,
  CheckCircle2,
  PlusSquare,
  Zap,
  WifiOff,
  Monitor,
} from 'lucide-react';
import { usePWAInstall, triggerPWAInstallFlow } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleInstallClick = useCallback(async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        toast.success('PredictPro installed to your Home Screen!');
        setShowModal(false);
        return;
      }
    }
    setShowModal(true);
  }, [isInstallable, install]);

  useEffect(() => {
    const onOpenModal = async () => {
      if (isInstallable) {
        const accepted = await install();
        if (accepted) {
          toast.success('PredictPro installed to your Home Screen!');
          return;
        }
      }
      setShowModal(true);
    };
    window.addEventListener('predictpro:open-pwa-install-modal', onOpenModal);
    return () => window.removeEventListener('predictpro:open-pwa-install-modal', onOpenModal);
  }, [isInstallable, install]);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        data-testid="navbar-download-app-btn"
        title="Download PredictPro App to Home Screen"
        className="inline-flex h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer shrink-0"
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden md:inline">Download App</span>
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <img
                  src="/icon-192.png"
                  alt="PredictPro App Icon"
                  className="h-11 w-11 rounded-xl border border-border object-cover bg-primary/10 shrink-0"
                />
                <div>
                  <h3 id="pwa-install-modal-title" className="text-base font-extrabold text-foreground">
                    Download PredictPro App
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add to Home Screen · Android, iOS &amp; Desktop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close download app dialog"
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInstallable && (
              <Button
                type="button"
                onClick={handleInstallClick}
                className="w-full h-10 font-bold text-xs sm:text-sm gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Download className="w-4 h-4" />
                <span>Install PredictPro to Home Screen Now (1-Click)</span>
              </Button>
            )}

            <div className="space-y-3 text-xs">
              {isIOS ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Share className="w-4 h-4 text-primary" /> Install on iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                    <li>
                      Tap the <strong className="text-foreground">Share</strong> button at the bottom of Safari.
                    </li>
                    <li>
                      Scroll down and tap{' '}
                      <strong className="text-foreground inline-flex items-center gap-1">
                        Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-primary" />
                      </strong>
                      .
                    </li>
                    <li>
                      Tap <strong className="text-foreground">Add</strong> in the top-right corner to launch the full-screen app.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-primary" />{' '}
                    {isAndroid ? 'Add to Android Home Screen' : 'Add to Mobile or Desktop Home Screen'}
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                    <li>
                      Open your browser menu (<strong className="text-foreground">⋮</strong> in Chrome/Edge or address bar install icon).
                    </li>
                    <li>
                      Tap <strong className="text-foreground">Install App</strong> or{' '}
                      <strong className="text-foreground">Add to Home Screen</strong>.
                    </li>
                    <li>
                      Confirm <strong className="text-foreground">Install</strong> to add the PredictPro icon directly to your Home Screen.
                    </li>
                  </ol>
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                <div className="font-bold text-foreground">Why Install the Home Screen App?</div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Auto-stays logged into your account on every launch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant offline access to daily AI predictions &amp; xG tables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Full-screen native speed with 1-tap Live Scores &amp; Bet Slip</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const HomeDownloadAppBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install, shouldShowPrompt, dismissPrompt } =
    usePWAInstall();

  const handleDownload = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        toast.success('PredictPro App added to your Home Screen!');
        return;
      }
    }
    triggerPWAInstallFlow();
  };

  if (isInstalled || !shouldShowPrompt) {
    return null;
  }

  return (
    <section
      aria-label="Download PredictPro App on Home Screen"
      data-testid="home-download-app-banner"
      className="container mx-auto max-w-7xl px-4 sm:px-6 pt-4"
    >
      <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-card to-primary/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-foreground">
                Download PredictPro App on Your Home Screen
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                Android · iOS · Desktop
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              1-tap Home Screen launch, persistent member auto-login, offline Expected Goals (xG) access, and live match alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-3 mr-2 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Instant Launch
            </span>
            <span className="inline-flex items-center gap-1">
              <WifiOff className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /> Offline Ready
            </span>
            <span className="inline-flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Full Screen
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            data-testid="home-banner-download-app-btn"
            className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isIOS ? 'Add to Home Screen' : 'Download App'}</span>
          </Button>

          <button
            type="button"
            onClick={() => dismissPrompt(72)}
            aria-label="Hide app download banner"
            title="Dismiss"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

