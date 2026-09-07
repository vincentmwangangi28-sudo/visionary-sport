import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share, PlusSquare, Check, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showOfflineIndicator?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  showOfflineIndicator = true,
}) => {
  const { isInstallable, isInstalled, isIOS, isOnline, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, only show offline status if needed
  if (isInstalled) {
    if (!isOnline && showOfflineIndicator) {
      return (
        <Badge variant="destructive" className="gap-1 text-xs font-semibold py-1">
          <WifiOff className="h-3 w-3" />
          Offline Mode
        </Badge>
      );
    }
    return null;
  }

  return (
    <>
      {/* Offline Status Badge */}
      {!isOnline && showOfflineIndicator && (
        <Badge variant="destructive" className="gap-1 text-xs font-semibold py-1 mr-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}

      {/* Chromium / Android / Desktop direct install button */}
      {isInstallable && (
        <Button
          variant={variant}
          size={size}
          onClick={install}
          className={`gap-1.5 font-bold text-xs shadow-sm hover:border-primary/60 ${className}`}
          id="pwa-install-button"
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>Install App</span>
        </Button>
      )}

      {/* iOS Safari Guide Button (since iOS does not trigger beforeinstallprompt) */}
      {isIOS && !isInstallable && (
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowIOSGuide(true)}
          className={`gap-1.5 font-bold text-xs ${className}`}
          id="pwa-ios-install-button"
        >
          <Smartphone className="h-3.5 w-3.5 text-primary" />
          <span>Install App</span>
        </Button>
      )}

      {/* Fallback button if neither prompt fired yet, to guide user */}
      {!isInstallable && !isIOS && (
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowIOSGuide(true)}
          className={`gap-1.5 font-bold text-xs ${className}`}
          id="pwa-guide-install-button"
          title="Install PredictPro on your device"
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>Install App</span>
        </Button>
      )}

      {/* iOS & Manual Installation Modal Guide */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Smartphone className="h-5 w-5 text-primary" />
              Install PredictPro App
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Install PredictPro for instantaneous match updates, offline tips access, and full-screen experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-muted/40 border rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                <Share className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground">Step 1: Tap Share</p>
                <p className="text-muted-foreground">
                  Tap the <span className="font-semibold text-foreground">Share</span> button in your browser toolbar (bottom on iOS Safari, top right on Chrome).
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/40 border rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                <PlusSquare className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground">Step 2: Add to Home Screen</p>
                <p className="text-muted-foreground">
                  Scroll down the share sheet and tap <span className="font-semibold text-foreground">"Add to Home Screen"</span>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/40 border rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground">Step 3: Instant Fast Access</p>
                <p className="text-muted-foreground">
                  Launch directly from your home screen with saved odds, cached offline fixtures, and zero browser chrome.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
