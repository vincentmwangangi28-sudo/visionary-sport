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
  Laptop,
  ExternalLink,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import {
  usePWAInstall,
  triggerPWAInstallFlow,
  DevicePlatform,
} from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const PWAInstallButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInAppWebView,
    isInIframe,
    platform,
    install,
    downloadPlatformInstaller,
    getAndroidChromeIntentUrl,
  } = usePWAInstall();

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop'>(() =>
    isDesktop ? 'desktop' : 'mobile'
  );
  const [installing, setInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setActiveTab(isDesktop ? 'desktop' : 'mobile');
  }, [isDesktop]);

  const handleNativeOrModalInstall = useCallback(
    async (preferredTab?: 'mobile' | 'desktop') => {
      if (preferredTab) {
        setActiveTab(preferredTab);
      }
      if (isInstallable) {
        setInstalling(true);
        const accepted = await install();
        setInstalling(false);
        if (accepted) {
          toast.success('PredictPro App installed successfully!');
          setShowModal(false);
          return;
        }
      }
      setShowModal(true);
    },
    [isInstallable, install]
  );

  useEffect(() => {
    const onOpenModal = async () => {
      if (isInstallable) {
        setInstalling(true);
        const accepted = await install();
        setInstalling(false);
        if (accepted) {
          toast.success('PredictPro App installed successfully!');
          return;
        }
      }
      setShowModal(true);
    };
    window.addEventListener('predictpro:open-pwa-install-modal', onOpenModal);
    return () => window.removeEventListener('predictpro:open-pwa-install-modal', onOpenModal);
  }, [isInstallable, install]);

  const handleDirectOsDownload = (targetPlatform: DevicePlatform, label: string) => {
    const { filename } = downloadPlatformInstaller(targetPlatform);
    toast.success(`Downloaded ${label} (${filename})`, {
      description:
        targetPlatform === 'windows'
          ? 'Open the downloaded file to launch PredictPro in standalone desktop window mode and add a Desktop shortcut.'
          : targetPlatform === 'mac'
          ? 'Drag the downloaded file to your macOS Dock or double-click to launch PredictPro.'
          : targetPlatform === 'ios'
          ? 'Allow the profile in Settings → Profile Downloaded, or tap Share → Add to Home Screen in Safari.'
          : 'Open the downloaded launcher to start PredictPro in full-screen app mode.',
    });
  };

  const handleCopyInstallUrl = () => {
    const url = 'https://www.predictpro.guru/?install=1';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        toast.success('Copied direct App Install link to clipboard!');
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {});
    }
  };

  return (
    <>
      {!isInstalled && (
        <button
          type="button"
          onClick={() => handleNativeOrModalInstall()}
          data-testid="navbar-download-app-btn"
          title="Download PredictPro App for Mobile (Android/iOS) or Desktop (Windows/Mac)"
          className="inline-flex h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer shrink-0"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="inline sm:hidden">App</span>
          <span className="hidden sm:inline">Download App</span>
        </button>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 text-foreground shadow-2xl space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <img
                  src="/icon-192.png"
                  alt="PredictPro App Icon"
                  className="h-12 w-12 rounded-xl border border-border object-cover bg-primary/10 shrink-0"
                />
                <div>
                  <h3 id="pwa-install-modal-title" className="text-base sm:text-lg font-extrabold text-foreground">
                    Download PredictPro App
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Official Standalone App for Mobile (Android &amp; iOS) &amp; Desktop (Windows, Mac &amp; Linux)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close download app dialog"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Click Native Browser Install Banner (When supported by Chrome/Edge/Android/Desktop) */}
            {isInstallable && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Instant 1-Click Native Installation Ready
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {isDesktop ? 'Desktop App' : 'Mobile App'}
                  </span>
                </div>
                <Button
                  type="button"
                  disabled={installing}
                  onClick={() => handleNativeOrModalInstall()}
                  data-testid="modal-native-oneclick-install-btn"
                  className="w-full h-10 font-bold text-xs sm:text-sm gap-2 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {installing
                      ? 'Installing PredictPro App...'
                      : isDesktop
                      ? 'Install PredictPro Desktop App Now (1-Click)'
                      : 'Install PredictPro to Home Screen Now (1-Click)'}
                  </span>
                </Button>
              </div>
            )}

            {/* Platform Switcher Tabs: Mobile vs Desktop */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                data-testid="download-tab-mobile"
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'mobile'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mobile (Android &amp; iOS)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                data-testid="download-tab-desktop"
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-primary" />
                <span>Desktop (Win / Mac / Linux)</span>
              </button>
            </div>

            {/* TAB 1: MOBILE (ANDROID & iOS) */}
            {activeTab === 'mobile' && (
              <div className="space-y-3 text-xs">
                {/* Android Section */}
                <div
                  className={`rounded-xl border p-3.5 space-y-2.5 ${
                    isAndroid
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-foreground flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      <span>Android Phone &amp; Tablet</span>
                    </div>
                    {isAndroid && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                        Detected Device
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {isInstallable ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleNativeOrModalInstall('mobile')}
                        className="h-9 text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install Android App (1-Click)</span>
                      </Button>
                    ) : isAndroid && isInAppWebView ? (
                      <a
                        href={getAndroidChromeIntentUrl()}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Chrome to Install</span>
                      </a>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleDirectOsDownload('android', 'Android App Launcher')}
                        data-testid="download-android-launcher-btn"
                        className="h-9 text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Android App</span>
                      </Button>
                    )}

                    {isAndroid && !isInAppWebView && (
                      <a
                        href={getAndroidChromeIntentUrl()}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-bold gap-1.5 border border-border bg-card hover:bg-muted text-foreground"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        <span>Launch Chrome Installer</span>
                      </a>
                    )}
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] pt-1">
                    <li>
                      Tap <strong className="text-foreground">Download Android App</strong> above, or tap the browser menu (<strong className="text-foreground">⋮</strong> in Chrome / Samsung Internet).
                    </li>
                    <li>
                      Select <strong className="text-foreground">Install App</strong> or <strong className="text-foreground">Add to Home screen</strong>.
                    </li>
                    <li>
                      Tap <strong className="text-foreground">Install</strong> to add the standalone PredictPro app icon to your phone.
                    </li>
                  </ol>
                </div>

                {/* iPhone / iPad (iOS) Section */}
                <div
                  className={`rounded-xl border p-3.5 space-y-2.5 ${
                    isIOS
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-foreground flex items-center gap-1.5">
                      <Share className="w-4 h-4 text-primary" />
                      <span>iPhone &amp; iPad (iOS / iPadOS)</span>
                    </div>
                    {isIOS && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                        Detected Device
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDirectOsDownload('ios', 'iOS WebClip App Profile')}
                      data-testid="download-ios-profile-btn"
                      className="h-9 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download iOS Home Screen App Profile</span>
                    </Button>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] pt-1">
                    <li>
                      In Safari, tap the <strong className="text-foreground">Share</strong> button <Share className="w-3 h-3 inline text-primary" /> on the bottom bar.
                    </li>
                    <li>
                      Scroll down and tap{' '}
                      <strong className="text-foreground inline-flex items-center gap-1">
                        Add to Home Screen <PlusSquare className="w-3 h-3 inline text-primary" />
                      </strong>
                      .
                    </li>
                    <li>
                      Tap <strong className="text-foreground">Add</strong> in the top-right corner for full-screen launch.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 2: DESKTOP (WINDOWS, MACOS & LINUX) */}
            {activeTab === 'desktop' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-primary/35 bg-primary/5 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-foreground flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-primary" />
                      <span>Direct Desktop App Installers</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                      Standalone App Window
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Download the native desktop launcher for your operating system or install directly via Chrome, Edge, or Brave for a dedicated taskbar/Dock window without browser tabs:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={platform === 'windows' ? 'default' : 'outline'}
                      onClick={() => handleDirectOsDownload('windows', 'Windows Desktop App')}
                      data-testid="download-windows-app-btn"
                      className={`h-10 text-xs font-bold gap-1.5 cursor-pointer ${
                        platform === 'windows'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : ''
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 shrink-0" />
                      <span>Windows App</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={platform === 'mac' ? 'default' : 'outline'}
                      onClick={() => handleDirectOsDownload('mac', 'macOS Desktop App')}
                      data-testid="download-mac-app-btn"
                      className={`h-10 text-xs font-bold gap-1.5 cursor-pointer ${
                        platform === 'mac'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : ''
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5 shrink-0" />
                      <span>macOS App</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={platform === 'linux' ? 'default' : 'outline'}
                      onClick={() => handleDirectOsDownload('linux', 'Linux Desktop App')}
                      data-testid="download-linux-app-btn"
                      className={`h-10 text-xs font-bold gap-1.5 cursor-pointer ${
                        platform === 'linux'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : ''
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 shrink-0" />
                      <span>Linux (.desktop)</span>
                    </Button>
                  </div>

                  <div className="rounded-lg border border-border bg-card/80 p-2.5 space-y-1.5 text-[11px]">
                    <div className="font-bold text-foreground">
                      Browser Address Bar 1-Click Install (Chrome / Edge / Brave / Safari):
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>
                        <strong className="text-foreground">Chrome / Edge / Brave (Windows &amp; Mac):</strong> Click the{' '}
                        <strong className="text-foreground">Install PredictPro</strong> monitor icon on the right side of your address bar, or open menu (<strong className="text-foreground">⋮</strong> / <strong className="text-foreground">⋯</strong>) → <strong className="text-foreground">Apps → Install PredictPro</strong>.
                      </li>
                      <li>
                        <strong className="text-foreground">Safari on macOS:</strong> Click <strong className="text-foreground">File → Add to Dock…</strong> in the top menu bar to pin PredictPro as a standalone Mac app.
                      </li>
                    </ul>
                  </div>

                  {isInIframe && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground">
                        Viewing inside a preview frame? Open the direct app URL to enable browser address-bar installation:
                      </span>
                      <a
                        href="/?install=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500 text-slate-950 font-bold shrink-0"
                      >
                        <span>Pop Out</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Send to Phone Link */}
                <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-foreground">Also want PredictPro on your phone?</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Copy the direct install link to open on your Android or iPhone:
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyInstallUrl}
                    className="h-8 text-xs font-bold gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Key App Perks */}
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5 text-xs">
              <div className="font-bold text-foreground">Included in Both Mobile &amp; Desktop Apps:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Auto-Login Remembered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Offline xG &amp; Predictions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Live Goal Push Alerts</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const HomeDownloadAppBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isDesktop,
    platform,
    install,
    downloadPlatformInstaller,
    shouldShowPrompt,
    dismissPrompt,
  } = usePWAInstall();

  const handlePrimaryInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        toast.success('PredictPro App installed successfully!');
        return;
      }
    }
    triggerPWAInstallFlow();
  };

  const handleDesktopQuickDownload = () => {
    if (isInstallable && isDesktop) {
      handlePrimaryInstall();
      return;
    }
    const targetOs: DevicePlatform =
      platform === 'mac' ? 'mac' : platform === 'linux' ? 'linux' : 'windows';
    const { filename } = downloadPlatformInstaller(targetOs);
    toast.success(`Downloaded Desktop App Launcher (${filename})`, {
      description: 'Open the file to launch PredictPro in standalone desktop window mode.',
    });
    triggerPWAInstallFlow();
  };

  if (isInstalled || !shouldShowPrompt) {
    return null;
  }

  return (
    <section
      aria-label="Download PredictPro App for Mobile and Desktop"
      data-testid="home-download-app-banner"
      className="container mx-auto max-w-7xl px-4 sm:px-6 pt-4"
    >
      <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-card to-primary/10 p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            {isDesktop ? (
              <Monitor className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-foreground">
                Download PredictPro App — Mobile &amp; Desktop
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                Android · iOS · Windows · Mac
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Install on your phone Home Screen or Desktop taskbar/Dock for 1-click launch, persistent auto-login, offline xG stats, and live goal alerts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-3 mr-1 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Instant Launch
            </span>
            <span className="inline-flex items-center gap-1">
              <WifiOff className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /> Offline Ready
            </span>
          </div>

          {/* Mobile App Button */}
          <Button
            type="button"
            size="sm"
            onClick={handlePrimaryInstall}
            data-testid="home-banner-download-app-btn"
            className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isIOS ? 'iPhone / iPad App' : 'Install Mobile App'}</span>
          </Button>

          {/* Desktop App Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDesktopQuickDownload}
            data-testid="home-banner-download-desktop-btn"
            className="h-9 px-3.5 text-xs font-bold gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground cursor-pointer"
          >
            <Monitor className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              {platform === 'mac'
                ? 'Download Mac App'
                : platform === 'linux'
                ? 'Download Linux App'
                : 'Download Desktop App'}
            </span>
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
