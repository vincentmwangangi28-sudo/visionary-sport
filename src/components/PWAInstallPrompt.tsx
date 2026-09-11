import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Check, 
  X, 
  Zap, 
  WifiOff, 
  Sparkles, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt: React.FC = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    install, 
    visitCount, 
    shouldShowPrompt, 
    dismissPrompt 
  } = usePWAInstall();

  const [hasWaitedDelay, setHasWaitedDelay] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Add a polite 2.5 second delay after load before showing the prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaitedDelay(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Do not show if app is installed, conditions not met, or delay has not elapsed
  if (isInstalled || !shouldShowPrompt || !hasWaitedDelay) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        dismissPrompt(8760); // 1 year
      }
    } else if (isIOS) {
      setShowIOSSteps((prev) => !prev);
    } else {
      setShowIOSSteps((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    dismissPrompt(48); // Dismiss for 48 hours
  };

  return (
    <AnimatePresence>
      <motion.aside
        role="dialog"
        aria-labelledby="pwa-prompt-title"
        aria-describedby="pwa-prompt-desc"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-18 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:max-w-md w-auto"
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl ring-1 ring-primary/20">
          {/* Top subtle decorative gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-purple-600" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content Header */}
          <div className="flex items-start gap-3">
            {/* App Icon with Badge */}
            <div className="relative shrink-0">
              <img
                src="/icon-192.png"
                alt="PredictPro App Logo"
                className="w-12 h-12 rounded-xl border border-border shadow-md object-cover bg-background"
                onError={(e) => {
                  // Fallback to stylized SVG placeholder if image missing
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] text-white font-bold items-center justify-center">
                  ✓
                </span>
              </span>
            </div>

            <div className="flex-1 pr-5">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1 inline" /> 2nd Visit Perk
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Visit #{visitCount}
                </span>
              </div>
              <h3 id="pwa-prompt-title" className="text-base font-black text-foreground tracking-tight leading-tight">
                Add PredictPro to Home Screen
              </h3>
              <p id="pwa-prompt-desc" className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Enjoy instant 1-tap app launch, zero browser URL bar, and 100% offline access to banker tips!
              </p>
            </div>
          </div>

          {/* Engagement Value Props */}
          <div className="mt-3 grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-[11px]">
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-muted/30">
              <Zap className="w-3.5 h-3.5 text-primary mb-0.5" />
              <span className="font-extrabold text-foreground leading-tight">Instant Odds</span>
              <span className="text-[9px] text-muted-foreground">Live Steam</span>
            </div>
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-muted/30">
              <WifiOff className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
              <span className="font-extrabold text-foreground leading-tight">Offline Tips</span>
              <span className="text-[9px] text-muted-foreground">Zero Data</span>
            </div>
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-muted/30">
              <Smartphone className="w-3.5 h-3.5 text-purple-500 mb-0.5" />
              <span className="font-extrabold text-foreground leading-tight">Native Feel</span>
              <span className="text-[9px] text-muted-foreground">Full Screen</span>
            </div>
          </div>

          {/* iOS Safari Step-by-Step Accordion Guide */}
          {showIOSSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 rounded-xl bg-muted/50 border border-border/60 text-xs space-y-2"
            >
              <div className="font-extrabold text-foreground flex items-center justify-between">
                <span>iOS Safari Quick Steps</span>
                <span className="text-[10px] text-primary font-bold">Takes 5 seconds</span>
              </div>
              <div className="space-y-1.5 text-muted-foreground text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button <Share className="inline w-3 h-3 text-primary mx-0.5" /> at the bottom of your Safari screen.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare className="inline w-3 h-3 text-primary mx-0.5" />.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner to finish.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 gap-1.5 font-black text-xs shadow-md bg-primary hover:bg-primary/90 text-primary-foreground h-9"
              id="pwa-prompt-install-btn"
            >
              {isInstallable ? (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Installing...' : 'Add to Home Screen'}</span>
                </>
              ) : isIOS ? (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>{showIOSSteps ? 'Hide Instructions' : 'Install on iPhone / iPad'}</span>
                  {showIOSSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{showIOSSteps ? 'Hide Instructions' : 'How to Install'}</span>
                  {showIOSSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="font-bold text-xs text-muted-foreground hover:text-foreground h-9 px-3 shrink-0 border-border/60"
              id="pwa-prompt-dismiss-btn"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
