import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type DevicePlatform = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'desktop';
export type BrowserEngine = 'chrome' | 'edge' | 'safari' | 'firefox' | 'samsung' | 'opera' | 'other';

declare global {
  interface Window {
    __predictproDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const PWA_DISMISS_UNTIL_KEY = 'predictpro_pwa_dismiss_until_v1';
export const PWA_VISIT_COUNT_KEY = 'predictpro_pwa_visit_count_v1';
export const PWA_INSTALLED_FLAG_KEY = 'predictpro_pwa_installed_v1';
export const PWA_TOAST_SHOWN_SESSION_KEY = 'predictpro_pwa_toast_shown_session_v1';

let lastTrackedPathname = '';

export function getPageVisitCount(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(PWA_VISIT_COUNT_KEY);
    if (!raw) return 0;
    const visits = parseInt(raw, 10);
    return !Number.isNaN(visits) && visits > 0 ? visits : 0;
  } catch {
    return 0;
  }
}

export function recordPageVisit(pathname?: string): number {
  if (typeof window === 'undefined') return 1;
  const currentPath =
    pathname ||
    (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');

  try {
    const sessionKey = 'predictpro_last_counted_page_v1';
    const lastSessionPage = window.sessionStorage?.getItem(sessionKey);

    // If already counted for this page in this session and memory, do not increment repeatedly
    if (lastSessionPage === currentPath && lastTrackedPathname === currentPath) {
      const current = getPageVisitCount();
      return current > 0 ? current : 1;
    }

    lastTrackedPathname = currentPath;
    window.sessionStorage?.setItem(sessionKey, currentPath);

    const prevVisits = getPageVisitCount();
    const nextVisits = prevVisits + 1;
    window.localStorage.setItem(PWA_VISIT_COUNT_KEY, String(nextVisits));
    return nextVisits;
  } catch {
    return 1;
  }
}

export function isPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const dismissUntil = parseInt(
      window.localStorage.getItem(PWA_DISMISS_UNTIL_KEY) || '0',
      10
    );
    return !Number.isNaN(dismissUntil) && dismissUntil > Date.now();
  } catch {
    return false;
  }
}

export function dismissPWAInstallPrompt(hours = 72): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PWA_DISMISS_UNTIL_KEY,
      String(Date.now() + hours * 3600 * 1000)
    );
  } catch {
    // ignore
  }
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true ||
      window.localStorage.getItem(PWA_INSTALLED_FLAG_KEY) === 'true';
    return Boolean(standalone);
  } catch {
    return false;
  }
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' && window.__predictproDeferredPrompt
    ? window.__predictproDeferredPrompt
    : null;

const promptSubscribers = new Set<(ev: BeforeInstallPromptEvent | null) => void>();

function syncGlobalPrompt(ev: BeforeInstallPromptEvent | null) {
  globalDeferredPrompt = ev;
  if (typeof window !== 'undefined') {
    window.__predictproDeferredPrompt = ev;
  }
  promptSubscribers.forEach((cb) => cb(ev));
}

if (typeof window !== 'undefined') {
  if (window.__predictproDeferredPrompt) {
    globalDeferredPrompt = window.__predictproDeferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    syncGlobalPrompt(e as BeforeInstallPromptEvent);
  });

  window.addEventListener('predictpro:pwa-prompt-ready', () => {
    if (window.__predictproDeferredPrompt) {
      syncGlobalPrompt(window.__predictproDeferredPrompt);
    }
  });

  window.addEventListener('appinstalled', () => {
    syncGlobalPrompt(null);
    try {
      window.localStorage.setItem(PWA_INSTALLED_FLAG_KEY, 'true');
    } catch {
      // ignore
    }
  });
}

export function detectDevicePlatform(uaInput?: string): {
  platform: DevicePlatform;
  browser: BrowserEngine;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  isInAppWebView: boolean;
  isInIframe: boolean;
} {
  const ua = (
    uaInput ?? (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')
  ).toLowerCase();

  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (typeof navigator !== 'undefined' &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isWindows = /win32|win64|windows|wince/.test(ua);
  const isMac = !isIOS && /macintosh|macintel|macppc|mac68k|macos/.test(ua);
  const isLinux = !isAndroid && /linux|x11|ubuntu|fedora|debian/.test(ua);

  let platform: DevicePlatform = 'desktop';
  if (isAndroid) platform = 'android';
  else if (isIOS) platform = 'ios';
  else if (isWindows) platform = 'windows';
  else if (isMac) platform = 'mac';
  else if (isLinux) platform = 'linux';

  const isMobile = isAndroid || isIOS || /mobile|tablet/.test(ua);
  const isDesktop = !isMobile;

  let browser: BrowserEngine = 'other';
  if (/edg\/|edga\/|edgios\//.test(ua)) browser = 'edge';
  else if (/samsungbrowser/.test(ua)) browser = 'samsung';
  else if (/opr\/|opera/.test(ua)) browser = 'opera';
  else if (/firefox|fxios/.test(ua)) browser = 'firefox';
  else if (/chrome|crios|chromium/.test(ua)) browser = 'chrome';
  else if (/safari/.test(ua)) browser = 'safari';

  const isInAppWebView =
    /fbav|fban|instagram|whatsapp|telegram|wv|line\/|tiktok|twitter|micromessenger/.test(ua);

  let isInIframe = false;
  if (typeof window !== 'undefined') {
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }
  }

  return {
    platform,
    browser,
    isIOS,
    isAndroid,
    isDesktop,
    isMobile,
    isInAppWebView,
    isInIframe,
  };
}

export function getCanonicalAppUrl(source = 'app'): string {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('predictpro.guru') || host.includes('predicpro.guru')) {
      return `https://www.predictpro.guru/?source=${encodeURIComponent(source)}`;
    }
    return `${window.location.origin}/?source=${encodeURIComponent(source)}`;
  }
  return `https://www.predictpro.guru/?source=${encodeURIComponent(source)}`;
}

export function getAndroidChromeIntentUrl(): string {
  const targetUrl = getCanonicalAppUrl('android-pwa').replace(/^https?:\/\//i, '');
  return `intent://${targetUrl}&install=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
    getCanonicalAppUrl('android-pwa')
  )};end`;
}

export function downloadPlatformInstaller(targetPlatform?: DevicePlatform): {
  filename: string;
  platform: DevicePlatform;
} {
  const detected = detectDevicePlatform();
  const activePlatform = targetPlatform || detected.platform;
  const appUrl = getCanonicalAppUrl(`${activePlatform}-app`);

  let filename = 'PredictPro-App.html';
  let mimeType = 'text/html;charset=utf-8';
  let content = '';

  if (activePlatform === 'windows') {
    filename = 'PredictPro-Windows-App.bat';
    mimeType = 'application/x-bat;charset=utf-8';
    content = [
      '@echo off',
      'title PredictPro Desktop App Launcher',
      'echo Launching PredictPro Quantitative Football Terminal...',
      'set APP_URL=' + appUrl,
      'set SHORTCUT_URL="%USERPROFILE%\\Desktop\\PredictPro App.url"',
      'if not exist %SHORTCUT_URL% (',
      '  echo [InternetShortcut] > %SHORTCUT_URL%',
      '  echo URL=%APP_URL% >> %SHORTCUT_URL%',
      '  echo IconFile=https://www.predictpro.guru/favicon.ico >> %SHORTCUT_URL%',
      '  echo IconIndex=0 >> %SHORTCUT_URL%',
      ')',
      'where msedge >nul 2>nul',
      'if %ERRORLEVEL% EQU 0 (',
      '  start "" msedge --app="%APP_URL%"',
      '  exit',
      ')',
      'where chrome >nul 2>nul',
      'if %ERRORLEVEL% EQU 0 (',
      '  start "" chrome --app="%APP_URL%"',
      '  exit',
      ')',
      'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      '  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%"',
      '  exit',
      ')',
      'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (',
      '  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%"',
      '  exit',
      ')',
      'start "" "%APP_URL%"',
      'exit',
    ].join('\r\n');
  } else if (activePlatform === 'mac') {
    filename = 'PredictPro-Mac-App.webloc';
    mimeType = 'application/xml;charset=utf-8';
    content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      '  <key>URL</key>',
      `  <string>${appUrl}</string>`,
      '</dict>',
      '</plist>',
    ].join('\n');
  } else if (activePlatform === 'linux') {
    filename = 'PredictPro.desktop';
    mimeType = 'application/x-desktop;charset=utf-8';
    content = [
      '[Desktop Entry]',
      'Version=1.0',
      'Type=Application',
      'Name=PredictPro Football Analytics',
      'Comment=AI Football Predictions, Live Scores & Expected Goals (xG)',
      `Exec=sh -c "google-chrome --app='${appUrl}' || chromium --app='${appUrl}' || xdg-open '${appUrl}'"`,
      'Icon=applications-sports',
      'Terminal=false',
      'Categories=Network;Sports;Utility;',
      'StartupWMClass=PredictPro',
    ].join('\n');
  } else if (activePlatform === 'ios') {
    filename = 'PredictPro-iOS.mobileconfig';
    mimeType = 'application/x-apple-aspen-config;charset=utf-8';
    content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      '  <key>PayloadContent</key>',
      '  <array>',
      '    <dict>',
      '      <key>FullScreen</key>',
      '      <true/>',
      '      <key>IsRemovable</key>',
      '      <true/>',
      '      <key>Label</key>',
      '      <string>PredictPro</string>',
      '      <key>PayloadDescription</key>',
      '      <string>Adds the PredictPro full-screen app icon to your iPhone or iPad Home Screen</string>',
      '      <key>PayloadDisplayName</key>',
      '      <string>PredictPro Home Screen App</string>',
      '      <key>PayloadIdentifier</key>',
      '      <string>guru.predictpro.webclip.home</string>',
      '      <key>PayloadType</key>',
      '      <string>com.apple.webClip.managed</string>',
      '      <key>PayloadUUID</key>',
      '      <string>8A9C2F54-71E2-4B99-9F14-7C8E2D451099</string>',
      '      <key>PayloadVersion</key>',
      '      <integer>1</integer>',
      '      <key>Precomposed</key>',
      '      <true/>',
      '      <key>URL</key>',
      `      <string>${appUrl}</string>`,
      '    </dict>',
      '  </array>',
      '  <key>PayloadDescription</key>',
      '  <string>PredictPro AI Football Predictions &amp; Expected Goals (xG) Home Screen App</string>',
      '  <key>PayloadDisplayName</key>',
      '  <string>PredictPro App</string>',
      '  <key>PayloadIdentifier</key>',
      '  <string>guru.predictpro.profile</string>',
      '  <key>PayloadOrganization</key>',
      '  <string>PredictPro Sports Analytics</string>',
      '  <key>PayloadRemovalDisallowed</key>',
      '  <false/>',
      '  <key>PayloadType</key>',
      '  <string>Configuration</string>',
      '  <key>PayloadUUID</key>',
      '  <string>3F1D8E22-94A1-4E5B-B312-9012ABCD5678</string>',
      '  <key>PayloadVersion</key>',
      '  <integer>1</integer>',
      '</dict>',
      '</plist>',
    ].join('\n');
  } else {
    filename = 'PredictPro-App-Launcher.html';
    mimeType = 'text/html;charset=utf-8';
    content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#10B981" />
  <title>PredictPro App</title>
  <link rel="icon" href="https://www.predictpro.guru/icon-192.png" />
  <link rel="apple-touch-icon" href="https://www.predictpro.guru/apple-touch-icon.png" />
  <meta http-equiv="refresh" content="0; url=${appUrl}" />
  <style>
    body { margin: 0; background: #060A12; color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 24px; }
    .logo { width: 64px; height: 64px; border-radius: 16px; background: #10B981; color: #060A12; font-weight: 900; font-size: 28px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .btn { margin-top: 16px; display: inline-block; padding: 12px 24px; border-radius: 10px; background: #10B981; color: #060A12; font-weight: 800; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="logo">PP</div>
  <h1 style="font-size: 20px; margin: 0 0 8px;">Launching PredictPro App...</h1>
  <p style="font-size: 13px; color: #94A3B8; margin: 0;">Live Football Scores, Expected Goals (xG) &amp; Daily AI Predictions</p>
  <a class="btn" href="${appUrl}">Open PredictPro Now</a>
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 1500);
  }

  return { filename, platform: activePlatform };
}

export function triggerPWAInstallFlow(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('predictpro:open-pwa-install-modal'));
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () =>
      globalDeferredPrompt ||
      (typeof window !== 'undefined' ? window.__predictproDeferredPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isPWAInstalled());

  const [deviceInfo, setDeviceInfo] = useState(() => detectDevicePlatform());
  const [visitCount, setVisitCount] = useState(() => {
    const v = getPageVisitCount();
    return v > 0 ? v : 1;
  });
  const [shouldShowPrompt, setShouldShowPrompt] = useState(() => !isPromptDismissed());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setDeviceInfo(detectDevicePlatform());

    if (isPWAInstalled()) {
      setIsInstalled(true);
    }

    if (window.__predictproDeferredPrompt && !globalDeferredPrompt) {
      syncGlobalPrompt(window.__predictproDeferredPrompt);
    }

    const currentVisits = recordPageVisit();
    setVisitCount(currentVisits);

    if (isPromptDismissed()) {
      setShouldShowPrompt(false);
    }

    // If navigated with ?install=1 (e.g., from Android Chrome intent or QR code), auto-open install modal
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('install') === '1') {
        setTimeout(() => {
          triggerPWAInstallFlow();
        }, 400);
      }
    } catch {
      // ignore
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
      syncGlobalPrompt(e as BeforeInstallPromptEvent);
    };

    const handlePromptReady = () => {
      if (window.__predictproDeferredPrompt) {
        syncGlobalPrompt(window.__predictproDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      syncGlobalPrompt(null);
      setIsInstalled(true);
      try {
        window.localStorage.setItem(PWA_INSTALLED_FLAG_KEY, 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('predictpro:pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptSubscribers.delete(subscriber);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('predictpro:pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    let activePrompt =
      deferredPrompt ||
      globalDeferredPrompt ||
      (typeof window !== 'undefined' ? window.__predictproDeferredPrompt || null : null);

    // If Service Worker is just finishing registration, wait briefly up to 450ms for beforeinstallprompt
    if (!activePrompt && typeof window !== 'undefined') {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 450);
        const onReady = () => {
          clearTimeout(timeout);
          resolve();
        };
        window.addEventListener('predictpro:pwa-prompt-ready', onReady, { once: true });
      });
      activePrompt =
        globalDeferredPrompt ||
        (typeof window !== 'undefined' ? window.__predictproDeferredPrompt || null : null);
    }

    if (!activePrompt) return false;
    try {
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === 'accepted') {
        syncGlobalPrompt(null);
        setIsInstalled(true);
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

  const hasNativePrompt = Boolean(
    deferredPrompt ||
      globalDeferredPrompt ||
      (typeof window !== 'undefined' ? window.__predictproDeferredPrompt : null)
  );

  return {
    isInstallable: hasNativePrompt,
    isInstalled,
    isIOS: deviceInfo.isIOS,
    isAndroid: deviceInfo.isAndroid,
    isDesktop: deviceInfo.isDesktop,
    isMobile: deviceInfo.isMobile,
    isInAppWebView: deviceInfo.isInAppWebView,
    isInIframe: deviceInfo.isInIframe,
    platform: deviceInfo.platform,
    browser: deviceInfo.browser,
    visitCount,
    shouldShowPrompt,
    install,
    downloadPlatformInstaller,
    getAndroidChromeIntentUrl,
    dismissPrompt,
    openInstallModal: triggerPWAInstallFlow,
  };
}
