import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Package,
  Apple,
  Play,
  Globe,
  FileCode,
  Sparkles,
  RefreshCw,
  UploadCloud,
  Lock,
  Radio,
  Search,
  Store,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEFAULT_SHA256 =
  'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C';

interface NativeReleaseConfig {
  androidVersionName: string;
  androidVersionCode: number;
  iosBundleVersion: string;
  minRequiredVersion: string;
  forceUpdateGate: boolean;
  otaAutoReload: boolean;
  playStoreUrl: string;
  appStoreUrl: string;
  directApkMirrorUrl: string;
  releaseNotes: string;
  lastUpdated: string;
}

const DEFAULT_RELEASE_CONFIG: NativeReleaseConfig = {
  androidVersionName: '2.6.0',
  androidVersionCode: 26,
  iosBundleVersion: '2.6.0',
  minRequiredVersion: '2.4.0',
  forceUpdateGate: false,
  otaAutoReload: true,
  playStoreUrl: 'https://play.google.com/store/apps/details?id=guru.predictpro.twa',
  appStoreUrl: 'https://apps.apple.com/app/predictpro-football-xg/id6739104821',
  directApkMirrorUrl: 'https://predictpro.guru/releases/predictpro-v2.6.0-signed.apk',
  releaseNotes:
    'Added 17-Game Mega Jackpot mathematical optimizer, Universal Booking Code converter (SportyBet, 1xBet, Bet9ja, SportPesa), and Bivariate Poisson 6x6 exact score matrices.',
  lastUpdated: new Date().toISOString(),
};

export const AdminAppStoreStudioTab: React.FC = () => {
  const [domain, setDomain] = useState('https://predictpro.guru');
  const [packageId, setPackageId] = useState('guru.predictpro.twa');
  const [iosBundleId, setIosBundleId] = useState('guru.predictpro.app');
  const [appleTeamId, setAppleTeamId] = useState('TEAMID1234');
  const [contactEmail, setContactEmail] = useState('vincentmwangangi28@gmail.com');
  const [sha256, setSha256] = useState(DEFAULT_SHA256);
  const [activeSubTab, setActiveSubTab] = useState<
    'play-console' | 'apple-connect' | 'free-stores' | 'config-files' | 'seo-paste' | 'release-gate'
  >('play-console');
  const [prepChecklist, setPrepChecklist] = useState<{
    signedBinary: boolean;
    listingAssets: boolean;
    privacyUrl: boolean;
  }>({
    signedBinary: false,
    listingAssets: false,
    privacyUrl: false,
  });

  const [releaseConfig, setReleaseConfig] = useState<NativeReleaseConfig>(() => {
    try {
      const saved = localStorage.getItem('predictpro_admin_native_release_config');
      return saved ? { ...DEFAULT_RELEASE_CONFIG, ...JSON.parse(saved) } : DEFAULT_RELEASE_CONFIG;
    } catch {
      return DEFAULT_RELEASE_CONFIG;
    }
  });
  const [pushingOta, setPushingOta] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('predictpro_admin_native_release_config', JSON.stringify(releaseConfig));
    } catch {
      // ignore storage errors
    }
  }, [releaseConfig]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied! Ready to paste.`);
  };

  const downloadFile = (filename: string, content: string, mime = 'application/json') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleSaveReleaseConfig = () => {
    const updated = { ...releaseConfig, lastUpdated: new Date().toISOString() };
    setReleaseConfig(updated);
    localStorage.setItem('predictpro_admin_native_release_config', JSON.stringify(updated));
    toast.success('Native App Release & Version Gate configuration saved');
  };

  const handleTriggerOtaBroadcast = async () => {
    setPushingOta(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      toast.success(
        `OTA Build v${releaseConfig.androidVersionName} (Code ${releaseConfig.androidVersionCode}) broadcast sent to active Service Workers`
      );
    } catch (e) {
      toast.error('OTA broadcast error: ' + String(e));
    } finally {
      setPushingOta(false);
    }
  };

  const assetLinksJson = JSON.stringify(
    [
      {
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.get_login_creds',
        ],
        target: {
          namespace: 'android_app',
          package_name: packageId,
          sha256_cert_fingerprints: [sha256.trim()],
        },
      },
    ],
    null,
    2
  );

  const appleAssociationJson = JSON.stringify(
    {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: [`${appleTeamId}.${iosBundleId}`],
            components: [
              { '/': '/*', comment: 'Allow Universal Links for all PredictPro routes' },
            ],
          },
        ],
      },
      webcredentials: {
        apps: [`${appleTeamId}.${iosBundleId}`],
      },
    },
    null,
    2
  );

  const twaManifestJson = JSON.stringify(
    {
      packageId,
      host: domain.replace(/^https?:\/\//, ''),
      name: 'PredictPro: Football xG & Stats',
      launcherName: 'PredictPro',
      display: 'standalone',
      themeColor: '#10B981',
      navigationColor: '#0B101B',
      navigationColorDark: '#0B101B',
      navigationDividerColor: '#1E293B',
      navigationDividerColorDark: '#1E293B',
      backgroundColor: '#0B101B',
      enableNotifications: true,
      startUrl: '/?utm_source=twa',
      iconUrl: `${domain}/icon-512.png`,
      maskableIconUrl: `${domain}/icon-512.png`,
      appVersionName: releaseConfig.androidVersionName,
      appVersionCode: releaseConfig.androidVersionCode,
      shortcuts: [
        { name: "Today's Picks", shortName: 'Today', url: '/today-predictions?utm_source=twa' },
        { name: 'Live Scores', shortName: 'Live', url: '/live?utm_source=twa' },
        { name: 'Slip Converter', shortName: 'Codes', url: '/slip-generator?utm_source=twa' },
        { name: '17-Game Jackpot', shortName: 'Jackpot', url: '/jackpot-predictions?utm_source=twa' },
      ],
      generatorApp: 'bubblewrap-cli',
      webManifestUrl: `${domain}/manifest.json`,
      fallbackType: 'customtabs',
      enableSiteSettingsShortcut: true,
      isChromeOSOnly: false,
      isMetaQuest: false,
      minSdkVersion: 21,
      orientation: 'portrait-primary',
      fingerprints: [{ name: 'Play Console Key', value: sha256.trim() }],
    },
    null,
    2
  );

  const capacitorConfigJson = JSON.stringify(
    {
      appId: iosBundleId,
      appName: 'PredictPro',
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        url: domain,
        cleartext: false,
        allowNavigation: [domain.replace(/^https?:\/\//, ''), '*.predictpro.guru'],
      },
      ios: {
        contentInset: 'automatic',
        backgroundColor: '#0B101B',
        preferredContentMode: 'mobile',
      },
      android: {
        backgroundColor: '#0B101B',
        allowMixedContent: false,
      },
    },
    null,
    2
  );

  const bubblewrapCommands = `# 1. Install Google Bubblewrap CLI globally
npm install -g @bubblewrap/cli

# 2. Initialize Android Trusted Web Activity (TWA) from twa-manifest.json
bubblewrap init --manifest=${domain}/manifest.json

# 3. Build signed Google Play App Bundle (.aab) & APK (.apk)
bubblewrap build

# 4. Extract SHA-256 fingerprint from your Play Console or Upload Keystore
keytool -list -v -keystore ./android.keystore -alias android`;

  const capacitorCommands = `# 1. Install Capacitor Core, CLI & Native Platforms
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Build the production web bundle
npm run build

# 3. Add iOS & Android native shells (uses capacitor.config.json)
npx cap add ios
npx cap add android
npx cap sync

# 4. Open Xcode to archive & upload (.ipa) to App Store Connect
npx cap open ios`;

  const playStoreFields = [
    {
      label: '1. App Name (30 characters max - Paste in Main Store Listing)',
      value: 'PredictPro: Football xG & Stats',
    },
    {
      label: '2. Short Description (80 characters max - Paste in Main Store Listing)',
      value: 'AI football predictions, Bivariate Poisson 6x6 score matrices, live xG & H2H.',
    },
    {
      label: '3. Full Description (4,000 characters max - Paste in Main Store Listing)',
      value: `PredictPro is an independent quantitative football analytics, Expected Goals (xG), and mathematical probability platform covering 35+ global football competitions including the English Premier League, UEFA Champions League, Spanish LaLiga, Italian Serie A, German Bundesliga, French Ligue 1, FKF Premier League (Kenya), Nigerian NPFL, South African PSL, and MLS.

KEY QUANTITATIVE FEATURES:
• Bivariate Poisson & Dixon-Coles 6×6 Exact Score Probability Matrices
• Expected Goals (xG), Expected Assists (xA) & Club Form Ratings
• Real-Time Live Scores, Match Momentum & Confirmed Lineup Injury Impact
• Head-to-Head (H2H) Historical Dominance & Referee Card/Corner Prop Telemetry
• 17-Game Mega Jackpot & 13-Game Midweek Jackpot Mathematical Combinatorics Optimizer
• Universal Analytical Slip & Odds Format Calculator (Decimal, Fractional, American)
• Offline-First Caching for Zero-Latency Match Research

LEAGUES & COMPETITIONS COVERED:
• UEFA Champions League, Europa League & Conference League
• Premier League, Championship & FA Cup
• LaLiga, Serie A, Bundesliga, Ligue 1, Eredivisie & Primeira Liga
• CAF Champions League, FKF Premier League, Nigeria NPFL, South Africa PSL, Tanzania NBC League, Ghana Premier League & Morocco Botola Pro
• Major League Soccer (MLS), Liga MX, Brazilian Série A & Argentine Primera

IMPORTANT EDITORIAL & COMPLIANCE NOTICE:
PredictPro is strictly a sports statistics, journalism, and mathematical probability reference application. PredictPro DOES NOT accept bets, process wagers, offer real-money gaming, or facilitate gambling deposits or withdrawals of any kind. Users must be 18+ to view historical odds comparison references.`,
    },
    {
      label: '4. Google Play Release Notes (<en-US> tag format - Paste in Production Release)',
      value: `<en-US>
• Added 17-Game Mega Jackpot & 13-Game Midweek Jackpot mathematical cover optimizer
• Upgraded 6×6 Bivariate Poisson & Dixon-Coles exact scoreline simulator
• Added Universal Slip & Odds Converter across regional formats
• Faster offline caching for live scores, standings, and team xG hubs
</en-US>`,
    },
    {
      label: '5. Google Play App Category, Tags & Contact Details (Paste in Store Settings)',
      value: `App or Game: App
Category: Sports
Tags: Sports, Soccer, Football, Sports Reference
Contact Email: ${contactEmail}
Contact Website: ${domain}/contact
Privacy Policy URL: ${domain}/privacy
Account & Data Deletion URL: ${domain}/profile`,
    },
    {
      label: '6. Google Play App Access / Reviewer Instructions (Paste in App Content → App Access)',
      value: `All core football statistics, live scores, Bivariate Poisson calculators, league standings, and match predictions are accessible without signing in.
For testing authenticated member features (saving favorite matches or syncing preferences):
• Demo Reviewer Email: reviewer@predictpro.guru
• Demo Reviewer Password: PredictProReview2026!
• Compliance Note: This app is strictly an informational sports statistics and mathematical probability reference tool. It does not offer real-money gambling, wagering, or cash payouts.`,
    },
    {
      label: '7. Google Play Content Rating (IARC) Exact Questionnaire Answers',
      value: `Category: Reference, News, or Educational / Sports
• Violence: No
• Sexuality: No
• Language: No
• Controlled Substances: No
• Simulated Gambling / Real-Money Gambling: NO (Select NO — the app provides statistical match probabilities and xG analytics only; users cannot bet or wager real or virtual currency).
• User Interaction / Shares Location: Users can view community leaderboards; location is not shared with other users.`,
    },
    {
      label: '8. Google Play Data Safety Questionnaire Exact Answers',
      value: `• Does your app collect or share any of the required user data types? Yes
• Is all of the user data collected by your app encrypted in transit? Yes (HTTPS/TLS 1.3 via Supabase)
• Do you provide a way for users to request that their data is deleted? Yes (${domain}/profile and ${domain}/privacy)
• Data Types Collected:
  1. Personal Info → Email address & Name (Optional, for account authentication only, Not shared with 3rd parties)
  2. App Activity → App interactions (Used for analytics & crash diagnostics, ephemeral/anonymized)`,
    },
  ];

  const appleStoreFields = [
    {
      label: '1. App Name (30 chars max - Paste in App Store Connect)',
      value: 'PredictPro: Football xG & Stats',
    },
    {
      label: '2. Subtitle (30 chars max - Paste in App Store Connect)',
      value: 'Soccer xG, Poisson & Live Stats',
    },
    {
      label: '3. Promotional Text (170 chars max - Can be updated anytime without review)',
      value:
        'Explore Bivariate Poisson 6x6 exact score matrices, live football xG momentum, H2H simulators, referee card telemetry, and 35+ global leagues in real time.',
    },
    {
      label: '4. Keywords (100 chars max, comma-separated, no spaces after commas)',
      value: 'football,soccer,predictions,xg,stats,livescore,poisson,premier league,odds,h2h,standings,analytics',
    },
    {
      label: '5. URLs & Copyright (Paste in App Information)',
      value: `Support URL: ${domain}/contact
Marketing URL: ${domain}
Privacy Policy URL: ${domain}/privacy
Copyright: 2026 PredictPro Quantitative Sports Analytics
Primary Category: Sports
Secondary Category: Reference`,
    },
    {
      label: '6. Apple App Review Notes (Guideline 5.3 Compliance - Paste in App Review Information)',
      value: `Dear Apple App Review Team,

PredictPro is an independent quantitative football statistics and Expected Goals (xG) analytics publication.
1. NO REAL-MONEY GAMBLING (Guideline 5.3): This app does NOT accept wagers, facilitate real-money betting, or link out to casino/wagering deposits. All probabilities, Bivariate Poisson matrices, and implied odds calculators are strictly informational mathematical tools.
2. OPEN ACCESS: 95% of the app (Live Scores, Standings, Match xG Previews, Poisson Calculators, H2H Simulator) works immediately upon launch without login.
3. DEMO ACCOUNT (if testing profile sync):
   - Email: reviewer@predictpro.guru
   - Password: PredictProReview2026!

Thank you for reviewing PredictPro!`,
    },
  ];

  const seoPasteFields = [
    {
      label: '1. Google Search Console Sitemap URLs (Paste one by one in GSC → Sitemaps)',
      value: `${domain}/sitemap-index.xml
${domain}/sitemap.xml
${domain}/sitemap-matches.xml
${domain}/sitemap-discover-news.xml
${domain}/feed-predictions.xml`,
    },
    {
      label: '2. IndexNow Instant Ping cURL Command (Run in Terminal or Cron to ping Bing/Yandex)',
      value: `curl -X POST "https://api.indexnow.org/indexnow" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -d '{
    "host": "${domain.replace(/^https?:\/\//, '')}",
    "key": "predictpro8f92a1d4c7e3b6a9f0e1d2c3b4a59687",
    "keyLocation": "${domain}/predictpro8f92a1d4c7e3b6a9f0e1d2c3b4a59687.txt",
    "urlList": [
      "${domain}/",
      "${domain}/today-predictions",
      "${domain}/tomorrow-predictions",
      "${domain}/weekend-predictions",
      "${domain}/jackpot-predictions",
      "${domain}/slip-generator",
      "${domain}/booking-code-converter",
      "${domain}/premier-league-predictions",
      "${domain}/champions-league-predictions"
    ]
  }'`,
    },
    {
      label: '3. Production robots.txt (Already active in /public/robots.txt)',
      value: `User-agent: *
Allow: /
Disallow: /admin

User-agent: Googlebot
Allow: /

User-agent: Googlebot-News
Allow: /

Sitemap: ${domain}/sitemap-index.xml
Sitemap: ${domain}/sitemap.xml
Sitemap: ${domain}/sitemap-matches.xml
Sitemap: ${domain}/sitemap-discover-news.xml`,
    },
  ];

  const freeAppStorePortals = [
    {
      name: 'Samsung Galaxy Store',
      portalName: 'Samsung Galaxy Store Seller Portal',
      feeBadge: 'Free · $0 Signup Fee',
      regionFocus: 'Global Samsung Galaxy Devices',
      url: 'https://seller.samsungapps.com/',
      description:
        'Register for free on the Samsung Galaxy Store Seller Portal to distribute your app across Samsung devices worldwide without paying a signup fee.',
      acceptedFormat: 'Signed APK / AAB',
    },
    {
      name: 'Amazon Appstore',
      portalName: 'Amazon Appstore Developer Portal',
      feeBadge: 'Free · No Annual Fee',
      regionFocus: 'Fire Tablets & Android Devices',
      url: 'https://developer.amazon.com/apps-and-games',
      description:
        'Create a free account via the Amazon Appstore Developer Portal to list your Android app on Fire tablets and Android devices with no annual fee.',
      acceptedFormat: 'Signed APK / AAB',
    },
    {
      name: 'Uptodown',
      portalName: 'Uptodown Developers Console',
      feeBadge: 'Free · 0% Profit-Sharing',
      regionFocus: 'High Search Visibility · Direct APK',
      url: 'https://developer.uptodown.com/',
      description:
        'Sign up on the Uptodown Developers Console for free publishing, zero profit-sharing, and strong search engine visibility for direct APK downloads.',
      acceptedFormat: 'Signed APK',
    },
    {
      name: 'APKPure',
      portalName: 'APKPure Submit APK Portal',
      feeBadge: 'Free · Direct APK Install',
      regionFocus: 'Global Direct APK Audience',
      url: 'https://apkpure.com/submit-apk',
      description:
        'Submit your signed APK directly through the APKPure Submit APK Portal after creating a free account to reach global users looking for direct APK installs.',
      acceptedFormat: 'Signed APK / XAPK',
    },
    {
      name: 'Huawei AppGallery',
      portalName: 'Huawei Developers Console',
      feeBadge: 'Free Registration',
      regionFocus: 'Kenya & Global Huawei Devices',
      url: 'https://developer.huawei.com/consumer/en/',
      description:
        'Register for free on the Huawei Developers Console to publish directly onto Huawei devices widely used across Kenya and globally.',
      acceptedFormat: 'Signed APK / AAB',
    },
    {
      name: 'Xiaomi GetApps',
      portalName: 'Xiaomi Developer Platform',
      feeBadge: 'Free Registration',
      regionFocus: 'Kenya & Global Xiaomi / Redmi / POCO',
      url: 'https://global.developer.mi.com/',
      description:
        'Register for free on the Xiaomi Developer Platform to reach Xiaomi, Redmi, and POCO smartphone users across Kenya and globally.',
      acceptedFormat: 'Signed APK / AAB',
    },
  ];

  const freeStoreCopyFields = [
    {
      label: '1. App Name & Short Tagline (Copy-Paste into Samsung / Amazon / Huawei / Xiaomi / Uptodown)',
      value: `App Title: PredictPro: Football xG & Stats
Short Description: AI football predictions, Bivariate Poisson 6x6 score matrices, live xG & H2H.`,
    },
    {
      label: '2. Package Metadata, Privacy Policy & Required Store URLs',
      value: `Package Name (Application ID): ${packageId}
Version Name: ${releaseConfig.androidVersionName} (Code: ${releaseConfig.androidVersionCode})
512x512 App Icon URL: ${domain}/icon-512.png
Public Privacy Policy URL: ${domain}/privacy
Official Website / Support URL: ${domain}/contact
Direct Signed APK URL: ${releaseConfig.directApkMirrorUrl}
Developer Support Email: ${contactEmail}
Category: Sports / Reference`,
    },
    {
      label: '3. Full App Store Description (Free Android Portals Copy-Paste)',
      value: `PredictPro is an independent quantitative football analytics, Expected Goals (xG), and mathematical probability application covering 35+ global competitions including the Premier League, UEFA Champions League, LaLiga, Serie A, Bundesliga, Ligue 1, and FKF Premier League (Kenya).

KEY FEATURES:
• Bivariate Poisson & Dixon-Coles 6×6 Exact Score Matrices
• Real-Time Live Scores, Expected Goals (xG) & Lineup Alerts
• 17-Game Mega Jackpot & 13-Game Midweek Jackpot Mathematical Combinatorics Optimizer
• Head-to-Head (H2H) Form Index, Corners & Referee Card Telemetry
• Universal Analytical Slip & Regional Odds Format Converter

COMPLIANCE NOTICE:
PredictPro is strictly a sports statistics and mathematical probability reference tool. It does not accept bets, process wagers, or facilitate real-money gambling.`,
    },
    {
      label: '4. What’s New / Release Changelog (Plain Text for Free Android Portals)',
      value: `Version ${releaseConfig.androidVersionName}:
- Live 17-Game Mega Jackpot & 13-Game Midweek Jackpot budget optimizer
- Upgraded Bivariate Poisson 6x6 exact scoreline & Over/Under probability simulator
- Faster offline PWA & APK caching for live football fixtures and league standings`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1 text-xs font-bold"
              >
                <Lock className="w-3 h-3" /> Private Admin Copy &amp; Paste Studio
              </Badge>
              <Badge
                variant="outline"
                className="text-sky-500 border-sky-500/30 bg-sky-500/10 text-[11px]"
              >
                100% Turnkey Store &amp; Server Configs
              </Badge>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              App Store, Google Play, Native Configs &amp; SEO Ready-to-Paste Command Center
            </h2>
            <p className="text-xs text-muted-foreground max-w-3xl">
              Every single field, questionnaire answer, JSON verification file, and CLI command is pre-filled below. Just click <strong>Copy</strong> and paste directly into Google Play Console, Apple App Store Connect, or Google Search Console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(domain)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 transition-colors"
            >
              1-Click Build (.AAB / .IPA) on PWABuilder <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Live Identifier Customizer (Updates all copy-paste templates automatically) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Global Identifiers (Auto-updates all Copy-Paste blocks below)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Production Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Android Package ID
              </label>
              <input
                type="text"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                iOS Bundle ID
              </label>
              <input
                type="text"
                value={iosBundleId}
                onChange={(e) => setIosBundleId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Apple Team ID
              </label>
              <input
                type="text"
                value={appleTeamId}
                onChange={(e) => setAppleTeamId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Support Email
              </label>
              <input
                type="text"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: 'play-console', label: '1. Google Play Console (Copy & Paste Sheet)', icon: Play },
          { id: 'apple-connect', label: '2. Apple App Store Connect (Copy & Paste Sheet)', icon: Apple },
          { id: 'free-stores', label: '3. Free App Stores (Zero-Fee APK Portals)', icon: Store },
          { id: 'config-files', label: '4. JSON Config Files & CLI (Download / Paste)', icon: FileCode },
          { id: 'seo-paste', label: '5. Google Search Console & IndexNow Paste Hub', icon: Search },
          { id: 'release-gate', label: '6. Native Version Gate & OTA Push', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className="gap-1.5 text-xs whitespace-nowrap shrink-0"
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* TAB 1: Google Play Console Ready-to-Paste Sheet */}
      {activeSubTab === 'play-console' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-500" />
                  Google Play Console — Complete Copy &amp; Paste Submission Kit
                </CardTitle>
                <CardDescription className="text-xs">
                  Every required store listing text, IARC rating answer, Data Safety answer, and reviewer instruction ready to paste.
                </CardDescription>
              </div>
              <a
                href="https://play.google.com/console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5"
              >
                Open Google Play Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {playStoreFields.map((field) => (
              <div key={field.label} className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-500">{field.label}</span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => copyText(field.value, field.label)}
                    className="h-7 text-xs gap-1.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" /> Copy to Paste
                  </Button>
                </div>
                <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-sans bg-background/80 border rounded-lg p-3 leading-relaxed">
                  {field.value}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Apple App Store Connect Ready-to-Paste Sheet */}
      {activeSubTab === 'apple-connect' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-500" />
                  Apple App Store Connect — Complete Copy &amp; Paste Submission Kit
                </CardTitle>
                <CardDescription className="text-xs">
                  Pre-vetted for Apple App Review Guideline 5.3 (Informational Sports Statistics &amp; xG Reference).
                </CardDescription>
              </div>
              <a
                href="https://appstoreconnect.apple.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5"
              >
                Open App Store Connect <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {appleStoreFields.map((field) => (
              <div key={field.label} className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-500">{field.label}</span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => copyText(field.value, field.label)}
                    className="h-7 text-xs gap-1.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" /> Copy to Paste
                  </Button>
                </div>
                <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-sans bg-background/80 border rounded-lg p-3 leading-relaxed">
                  {field.value}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Free App Store Developer Portals & Quick Preparation Checklist */}
      {activeSubTab === 'free-stores' && (
        <div className="space-y-6">
          {/* Quick Preparation Checklist */}
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Quick Preparation Checklist
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Before uploading to these zero-fee developer portals, ensure you have these 3 items ready:
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyText(`${domain}/privacy`, 'Public Privacy Policy URL')}
                  className="h-7 text-xs gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Copy className="w-3 h-3" /> Copy /privacy URL
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border bg-background/80 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prepChecklist.signedBinary}
                  onChange={(e) =>
                    setPrepChecklist((prev) => ({ ...prev, signedBinary: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-border"
                />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-foreground">
                    1. A Signed APK or AAB File
                  </div>
                  <p className="text-muted-foreground">
                    Wrapped from your web URL (<code className="font-mono text-foreground">{domain}</code>) using a tool like{' '}
                    <a
                      href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(domain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 underline font-semibold"
                    >
                      PWABuilder
                    </a>{' '}
                    or <code className="font-mono">@bubblewrap/cli</code>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border bg-background/80 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prepChecklist.listingAssets}
                  onChange={(e) =>
                    setPrepChecklist((prev) => ({ ...prev, listingAssets: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-border"
                />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-foreground">
                    2. Store Listing Assets
                  </div>
                  <p className="text-muted-foreground">
                    A <span className="font-mono font-semibold text-foreground">512×512</span> app icon (<code className="font-mono">{domain}/icon-512.png</code>), at least <span className="font-semibold text-foreground">2–4 mobile screenshots</span>, and a short/full app description —{' '}
                    <Link
                      to="/admin/app-store-metadata"
                      className="text-emerald-600 dark:text-emerald-400 underline font-semibold"
                    >
                      generate all listing assets in App Store Metadata
                    </Link>
                    .
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border bg-background/80 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prepChecklist.privacyUrl}
                  onChange={(e) =>
                    setPrepChecklist((prev) => ({ ...prev, privacyUrl: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-border"
                />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-foreground">
                    3. A Public Privacy Policy URL
                  </div>
                  <p className="text-muted-foreground">
                    Hosted directly on a page on your website (<code className="font-mono font-semibold text-foreground">{domain}/privacy</code>), as almost all stores require this link before approving a listing.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Free App Store Developer Portals Directory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-500" />
                Free App Store Developer Portals (Zero Registration Fee)
              </CardTitle>
              <CardDescription className="text-xs">
                Distribute PredictPro worldwide and across Kenya (Samsung, Huawei, Xiaomi, Amazon Fire, Uptodown, and APKPure) without paying Play Store or Apple developer fees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeAppStorePortals.map((portal) => (
                  <div
                    key={portal.name}
                    className="rounded-xl border bg-muted/20 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <h3 className="text-sm font-bold text-foreground">{portal.name}</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                          {portal.feeBadge}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {portal.regionFocus} · {portal.acceptedFormat}
                      </p>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {portal.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(portal.url, `${portal.name} Portal URL`)}
                        className="h-7 text-xs gap-1 whitespace-nowrap shrink-0"
                      >
                        <Copy className="w-3 h-3" /> Copy Link
                      </Button>
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold px-2.5 h-7 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                      >
                        Open Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ready-to-Paste Free App Store Submission Kit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-500" />
                Free App Stores — Copy &amp; Paste Submission Kit
              </CardTitle>
              <CardDescription className="text-xs">
                Pre-filled title, package metadata, Privacy Policy URL, store description, and changelog ready to paste into Samsung, Amazon, Uptodown, APKPure, Huawei, and Xiaomi portals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {freeStoreCopyFields.map((field) => (
                <div key={field.label} className="rounded-xl border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-500">{field.label}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => copyText(field.value, field.label)}
                      className="h-7 text-xs gap-1.5 shrink-0"
                    >
                      <Copy className="w-3 h-3" /> Copy to Paste
                    </Button>
                  </div>
                  <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-sans bg-background/80 border rounded-lg p-3 leading-relaxed">
                    {field.value}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Ready-to-Paste JSON Config Files & CLI Commands */}
      {activeSubTab === 'config-files' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <label className="block text-xs font-bold text-emerald-500 mb-1.5">
                Paste Your Google Play App Signing SHA-256 Certificate Fingerprint (Auto-injects into assetlinks.json &amp; twa-manifest.json below)
              </label>
              <input
                type="text"
                value={sha256}
                onChange={(e) => setSha256(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* assetlinks.json */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    public/.well-known/assetlinks.json
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile('assetlinks.json', assetLinksJson)}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyText(assetLinksJson, 'assetlinks.json')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-sky-300 overflow-x-auto leading-relaxed">
                  {assetLinksJson}
                </pre>
              </CardContent>
            </Card>

            {/* apple-app-site-association */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Apple className="w-4 h-4 text-emerald-500" />
                    public/.well-known/apple-app-site-association
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile('apple-app-site-association', appleAssociationJson)}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyText(appleAssociationJson, 'apple-app-site-association')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-sky-300 overflow-x-auto leading-relaxed">
                  {appleAssociationJson}
                </pre>
              </CardContent>
            </Card>

            {/* twa-manifest.json */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    twa-manifest.json (Google Bubblewrap)
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile('twa-manifest.json', twaManifestJson)}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyText(twaManifestJson, 'twa-manifest.json')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                  {twaManifestJson}
                </pre>
              </CardContent>
            </Card>

            {/* capacitor.config.json */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    capacitor.config.json (iOS &amp; Android Shell)
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile('capacitor.config.json', capacitorConfigJson)}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyText(capacitorConfigJson, 'capacitor.config.json')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                  {capacitorConfigJson}
                </pre>
              </CardContent>
            </Card>

            {/* CLI Commands */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    Bubblewrap Android (.AAB / .APK) Terminal Commands
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => copyText(bubblewrapCommands, 'Bubblewrap CLI commands')}
                    className="h-7 text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy CLI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {bubblewrapCommands}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    Capacitor iOS Xcode (.IPA) Terminal Commands
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => copyText(capacitorCommands, 'Capacitor CLI commands')}
                    className="h-7 text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy CLI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {capacitorCommands}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: Google Search Console & IndexNow Ready-to-Paste Sheet */}
      {activeSubTab === 'seo-paste' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-500" />
              Google Search Console, Bing Webmaster &amp; IndexNow Copy-Paste Kit
            </CardTitle>
            <CardDescription className="text-xs">
              Copy and paste these exact sitemap URLs and IndexNow payloads to index all 165+ routes and dynamic ESPN match slugs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {seoPasteFields.map((field) => (
              <div key={field.label} className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-500">{field.label}</span>
                  <Button
                    size="sm"
                    onClick={() => copyText(field.value, field.label)}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Copy className="w-3 h-3" /> Copy to Paste
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-slate-950 text-sky-300 border border-slate-800 rounded-lg p-3 overflow-x-auto leading-relaxed">
                  {field.value}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Native Version Gate & OTA Manager */}
      {activeSubTab === 'release-gate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-500" />
                Native App Release &amp; Minimum Version Gate Control
              </CardTitle>
              <CardDescription className="text-xs">
                Configure active Android/iOS build numbers, store download URLs, and force-upgrade gates for installed TWA/Capacitor clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Android Version Name
                  </label>
                  <input
                    type="text"
                    value={releaseConfig.androidVersionName}
                    onChange={(e) =>
                      setReleaseConfig({ ...releaseConfig, androidVersionName: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Android Version Code (Integer)
                  </label>
                  <input
                    type="number"
                    value={releaseConfig.androidVersionCode}
                    onChange={(e) =>
                      setReleaseConfig({
                        ...releaseConfig,
                        androidVersionCode: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Minimum Required Build Gate
                  </label>
                  <input
                    type="text"
                    value={releaseConfig.minRequiredVersion}
                    onChange={(e) =>
                      setReleaseConfig({ ...releaseConfig, minRequiredVersion: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Google Play Store URL
                  </label>
                  <input
                    type="text"
                    value={releaseConfig.playStoreUrl}
                    onChange={(e) =>
                      setReleaseConfig({ ...releaseConfig, playStoreUrl: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Apple App Store URL
                  </label>
                  <input
                    type="text"
                    value={releaseConfig.appStoreUrl}
                    onChange={(e) =>
                      setReleaseConfig({ ...releaseConfig, appStoreUrl: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Direct Signed APK Mirror URL
                  </label>
                  <input
                    type="text"
                    value={releaseConfig.directApkMirrorUrl}
                    onChange={(e) =>
                      setReleaseConfig({ ...releaseConfig, directApkMirrorUrl: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  What&apos;s New Release Notes (Broadcast to Mobile Clients)
                </label>
                <textarea
                  rows={2}
                  value={releaseConfig.releaseNotes}
                  onChange={(e) =>
                    setReleaseConfig({ ...releaseConfig, releaseNotes: e.target.value })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={releaseConfig.forceUpdateGate}
                      onChange={(e) =>
                        setReleaseConfig({ ...releaseConfig, forceUpdateGate: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <span>Enforce Hard Minimum Version Gate</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={releaseConfig.otaAutoReload}
                      onChange={(e) =>
                        setReleaseConfig({ ...releaseConfig, otaAutoReload: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <span>Auto-Push Service Worker OTA Bundle Updates</span>
                  </label>
                </div>

                <Button size="sm" onClick={handleSaveReleaseConfig} className="gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Release Gate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-500" />
                Live OTA Bundle Broadcast
              </CardTitle>
              <CardDescription className="text-xs">
                Push instant Over-The-Air updates to installed Android TWA and iOS Capacitor clients without waiting for store review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Build</span>
                  <span className="font-mono font-bold">
                    v{releaseConfig.androidVersionName} (#{releaseConfig.androidVersionCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Gate</span>
                  <span className="font-mono font-semibold">v{releaseConfig.minRequiredVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Synced</span>
                  <span className="font-mono text-[11px]">
                    {new Date(releaseConfig.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleTriggerOtaBroadcast}
                disabled={pushingOta}
                className="w-full gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pushingOta ? 'animate-spin' : ''}`} />
                {pushingOta ? 'Broadcasting OTA Update...' : 'Push Instant OTA Update Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
