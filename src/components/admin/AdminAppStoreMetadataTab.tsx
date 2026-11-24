import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { JACKPOT_PROVIDERS, getInitialOfficialJackpotPools } from '@/services/jackpotService';
import { toast } from 'sonner';

type StoreTargetId = 'universal' | 'google_play' | 'apple_connect' | 'samsung_huawei_xiaomi';
type TonePreset = 'balanced' | 'jackpot_xg' | 'editorial_stats';
type NeutralSportsTheme = 'neutral_slate_pitch' | 'neutral_charcoal_pitch';

interface FetchedAppMetadata {
  name: string;
  shortName: string;
  description: string;
  tags: string[];
  source: string;
  fetchedAt: string;
  icons: Array<{ src: string; sizes: string; type?: string; purpose?: string }>;
}

const DEFAULT_FETCHED_METADATA: FetchedAppMetadata = {
  name: 'PredictPro — AI Football Predictions & Expected Goals (xG)',
  shortName: 'PredictPro',
  description:
    'Quantitative AI football predictions, Expected Goals (xG) analytics, 6x6 Bivariate Poisson score matrices, 17-game Mega Jackpot generator, and universal booking code converter across 40+ global leagues.',
  tags: ['sports', 'football', 'predictions', 'xg', 'poisson', 'jackpot', 'livescore', 'analytics'],
  source: '/manifest.json · /metadata.json',
  fetchedAt: new Date().toISOString(),
  icons: [
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
  ],
};

interface LegalRouteItem {
  id: string;
  label: string;
  path: string;
  requiredBy: string;
  purpose: string;
}

const LEGAL_ROUTES: LegalRouteItem[] = [
  {
    id: 'privacy',
    label: 'Public Privacy Policy URL',
    path: '/privacy',
    requiredBy: 'Google Play · Apple App Store · Samsung · Amazon · Huawei · Xiaomi · Uptodown · APKPure',
    purpose: 'Primary privacy disclosure & user data handling policy required prior to store review.',
  },
  {
    id: 'privacy_alias',
    label: 'Privacy Policy Canonical Alias',
    path: '/privacy-policy',
    requiredBy: 'Alternative crawlers & automated store scrapers',
    purpose: 'Direct redirect alias to the primary public Privacy Policy page.',
  },
  {
    id: 'terms',
    label: 'Terms of Service URL',
    path: '/terms',
    requiredBy: 'Apple App Store · Samsung Seller Portal · Huawei AppGallery',
    purpose: 'Terms governing informational sports analytics access and non-wagering usage.',
  },
  {
    id: 'cookies',
    label: 'Cookie & Storage Policy URL',
    path: '/cookies',
    requiredBy: 'EU / UK Privacy Compliance · Google Play Data Safety',
    purpose: 'Details localStorage caching, offline PWA persistence, and ad preferences.',
  },
  {
    id: 'contact',
    label: 'Developer Support & Contact URL',
    path: '/contact',
    requiredBy: 'All Mobile Stores (Mandatory Support Link)',
    purpose: 'Direct support contact endpoint displayed on public store listings.',
  },
  {
    id: 'responsible',
    label: 'Editorial & Non-Gambling Notice',
    path: '/responsible-gaming',
    requiredBy: 'Apple Guideline 5.3 · Google Play Content Rating (IARC)',
    purpose: 'Clarifies 18+ informational analytics positioning without wagering or real-money deposits.',
  },
  {
    id: 'deletion',
    label: 'Account & Data Deletion URL',
    path: '/profile',
    requiredBy: 'Google Play Data Safety Section',
    purpose: 'Self-service user profile and data removal request destination.',
  },
];

interface GeneratedScreenshotAsset {
  id: string;
  filename: string;
  title: string;
  caption: string;
  dimensions: string;
  keyFeatures: string[];
  dataUrl: string | null;
}

function clampString(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 3)).trim()}...`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draws a subtle, neutral sports-themed tactical pitch background (1080x1920)
 * with low-opacity mowed turf stripes, halfway line, center circle, and penalty box geometry.
 */
function drawNeutralSportsBackground(
  ctx: CanvasRenderingContext2D,
  palette: {
    bgTop: string;
    bgBottom: string;
    stripe: string;
    pitchLine: string;
  }
) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, palette.bgTop);
  grad.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle horizontal mowed pitch bands
  ctx.fillStyle = palette.stripe;
  for (let y = 0; y < 1920; y += 240) {
    ctx.fillRect(0, y, 1080, 120);
  }

  // Neutral tactical pitch markings
  ctx.save();
  ctx.strokeStyle = palette.pitchLine;
  ctx.lineWidth = 4;

  // Outer touchline inset
  ctx.strokeRect(44, 44, 992, 1832);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(44, 960);
  ctx.lineTo(1036, 960);
  ctx.stroke();

  // Center circle & center spot
  ctx.beginPath();
  ctx.arc(540, 960, 190, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(540, 960, 10, 0, Math.PI * 2);
  ctx.fillStyle = palette.pitchLine;
  ctx.fill();

  // Top penalty area & 6-yard box
  ctx.strokeRect(220, 44, 640, 260);
  ctx.strokeRect(360, 44, 360, 96);

  // Bottom penalty area & 6-yard box
  ctx.strokeRect(220, 1616, 640, 260);
  ctx.strokeRect(360, 1780, 360, 96);

  // Corner arcs
  ctx.beginPath();
  ctx.arc(44, 44, 36, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1036, 44, 36, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(44, 1876, 36, (3 * Math.PI) / 2, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1036, 1876, 36, Math.PI, (3 * Math.PI) / 2);
  ctx.stroke();

  ctx.restore();
}

export const AdminAppStoreMetadataTab: React.FC = () => {
  const { data: predictionsData } = usePredictions();
  const livePredictions = useMemo(
    () => predictionsData?.allPredictions ?? predictionsData?.predictions ?? [],
    [predictionsData]
  );

  const [fetchedMeta, setFetchedMeta] = useState<FetchedAppMetadata>(DEFAULT_FETCHED_METADATA);
  const [fetchingMeta, setFetchingMeta] = useState<boolean>(false);

  const [baseDomain, setBaseDomain] = useState<string>('https://predictpro.guru');
  const [privacyTemplate, setPrivacyTemplate] = useState<string>('https://{domain}/privacy');
  const [packageId, setPackageId] = useState<string>('guru.predictpro.twa');
  const [supportEmail, setSupportEmail] = useState<string>('vincentmwangangi28@gmail.com');
  const [storeTarget, setStoreTarget] = useState<StoreTargetId>('universal');
  const [tonePreset, setTonePreset] = useState<TonePreset>('balanced');
  const [backgroundTheme, setBackgroundTheme] = useState<NeutralSportsTheme>('neutral_slate_pitch');
  const [showBrandingCrest, setShowBrandingCrest] = useState<boolean>(true);

  const [includeLiveFixtures, setIncludeLiveFixtures] = useState<boolean>(true);
  const [includeJackpotPools, setIncludeJackpotPools] = useState<boolean>(true);
  const [includeComplianceNote, setIncludeComplianceNote] = useState<boolean>(true);

  const [routeStatuses, setRouteStatuses] = useState<Record<string, 'idle' | 'ok' | 'error'>>({});
  const [verifyingRoutes, setVerifyingRoutes] = useState<boolean>(false);

  const [iconPlaceholderDataUrl, setIconPlaceholderDataUrl] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<GeneratedScreenshotAsset[]>([]);

  // Fetch live app metadata (name, description, tags) from /manifest.json, /metadata.json & document <meta>
  const fetchLiveAppMetadata = useCallback(async (showToast = false) => {
    setFetchingMeta(true);
    try {
      const [manifestRes, metaRes] = await Promise.all([
        fetch('/manifest.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/metadata.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      const domKeywords =
        typeof document !== 'undefined'
          ? document.head?.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
          : '';
      const domDesc =
        typeof document !== 'undefined'
          ? document.head?.querySelector('meta[name="description"]')?.getAttribute('content') || ''
          : '';

      const rawCategories: string[] = Array.isArray(manifestRes?.categories)
        ? manifestRes.categories
        : [];
      const rawDomTags = domKeywords
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const mergedTags = Array.from(
        new Set([
          ...rawCategories,
          ...rawDomTags,
          'football',
          'soccer analytics',
          'expected goals (xg)',
          'bivariate poisson',
          'jackpot combinatorics',
        ])
      ).slice(0, 10);

      const nextName =
        manifestRes?.name ||
        metaRes?.name ||
        DEFAULT_FETCHED_METADATA.name;
      const nextShortName =
        manifestRes?.short_name ||
        metaRes?.name ||
        DEFAULT_FETCHED_METADATA.shortName;
      const nextDescription =
        manifestRes?.description ||
        metaRes?.description ||
        domDesc ||
        DEFAULT_FETCHED_METADATA.description;

      const sources: string[] = [];
      if (manifestRes) sources.push('/manifest.json');
      if (metaRes) sources.push('/metadata.json');
      if (domKeywords || domDesc) sources.push('document <meta>');

      setFetchedMeta({
        name: nextName,
        shortName: nextShortName,
        description: nextDescription,
        tags: mergedTags,
        source: sources.length > 0 ? sources.join(' · ') : DEFAULT_FETCHED_METADATA.source,
        fetchedAt: new Date().toISOString(),
        icons: Array.isArray(manifestRes?.icons) && manifestRes.icons.length > 0
          ? manifestRes.icons
          : DEFAULT_FETCHED_METADATA.icons,
      });

      if (showToast) {
        toast.success('Fetched live app metadata (name, description, and tags).');
      }
    } finally {
      setFetchingMeta(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAppMetadata(false);
  }, [fetchLiveAppMetadata]);

  // Derive live content stats from current app state
  const liveContentStats = useMemo(() => {
    const uniqueLeagues = Array.from(
      new Set(
        livePredictions
          .map((p: any) => p.league || p.competition)
          .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      )
    );

    const featuredMatches = livePredictions.slice(0, 4).map((p: any) => {
      const home = p.homeTeam || p.home || p.home_team || 'Home';
      const away = p.awayTeam || p.away || p.away_team || 'Away';
      const prob = Math.round(
        Number(p.confidence || Math.max(p.homeProb || 62, p.drawProb || 22, p.awayProb || 16))
      );
      const xGHome = Number(p.homeXG ?? 1.84).toFixed(2);
      const xGAway = Number(p.awayXG ?? 0.92).toFixed(2);
      const market = p.recommendedPick || p.prediction || 'Home Win (1)';
      return {
        label: `${home} vs ${away}`,
        league: p.league || 'Premier League',
        prob,
        xG: `${xGHome}–${xGAway}`,
        market,
      };
    });

    const topFixtures = featuredMatches;
    const leaguesList =
      uniqueLeagues.length >= 4
        ? uniqueLeagues.slice(0, 8)
        : [
            'Premier League',
            'UEFA Champions League',
            'LaLiga',
            'Serie A',
            'Bundesliga',
            'Ligue 1',
            'FKF Premier League (Kenya)',
            'MLS',
          ];

    const pools = getInitialOfficialJackpotPools();
    const totalJackpotGames =
      pools.sportpesa.length +
      pools.betika.length +
      pools.betika_grand.length +
      pools.sportpesa_midweek.length +
      pools.mozzart.length;

    return {
      fixtureCount: livePredictions.length || 48,
      leaguesCount: Math.max(40, uniqueLeagues.length),
      leaguesList,
      topFixtures,
      totalJackpotGames,
      megaPoolPrize: JACKPOT_PROVIDERS.sportpesa.prizePool,
      mozzartPrize: JACKPOT_PROVIDERS.mozzart.prizePool,
      betikaGrandPrize: JACKPOT_PROVIDERS.betika_grand.prizePool,
    };
  }, [livePredictions]);

  // Resolved Privacy Policy URL from template + domain
  const cleanDomain = baseDomain.replace(/\/+$/, '');
  const domainHost = cleanDomain.replace(/^https?:\/\//, '');
  const resolvedPrivacyUrl = useMemo(() => {
    if (privacyTemplate.includes('{domain}')) {
      return privacyTemplate.replace('{domain}', domainHost);
    }
    return privacyTemplate || `${cleanDomain}/privacy`;
  }, [privacyTemplate, domainHost, cleanDomain]);

  // Synthesize store metadata + 2–4 sentence optimized descriptions from fetched metadata & live app content
  const buildSynthesizedMetadata = useCallback(() => {
    const appTitle =
      storeTarget === 'apple_connect'
        ? clampString(`${fetchedMeta.shortName}: Football xG & Stats`, 30)
        : clampString(`${fetchedMeta.shortName}: Football xG & Stats`, 30);

    const subtitleOrShort =
      storeTarget === 'apple_connect'
        ? 'Soccer xG, Poisson & Live Stats'
        : tonePreset === 'jackpot_xg'
        ? clampString('Football xG, 6x6 Poisson score models & 17-game Jackpot optimizer.', 80)
        : clampString('AI football predictions, Bivariate Poisson 6x6 score matrices & live xG.', 80);

    // Explicitly crafted 2–4 sentence optimized store descriptions
    const concise3SentenceOverview =
      tonePreset === 'jackpot_xg'
        ? `${fetchedMeta.shortName} combines 6×6 Bivariate Poisson and Dixon-Coles goal models with real-time Expected Goals (xG) telemetry across ${liveContentStats.leaguesCount}+ global football competitions. Optimize 13-game, 15-game, and 17-game Jackpot combinations using greedy log-gain Double Chance allocation and Poisson-Binomial bonus survival math. Built strictly as an informational sports statistics and mathematical probability reference tool with zero real-money wagering.`
        : tonePreset === 'editorial_stats'
        ? `${fetchedMeta.shortName} delivers independent quantitative football statistics, Expected Goals (xG) match previews, and verified head-to-head telemetry across ${liveContentStats.leaguesCount}+ leagues including ${liveContentStats.leaguesList.slice(0, 3).join(', ')}. Inspect calibrated 6×6 exact score matrices, referee card rates, and implied odds probabilities in an offline-ready mobile experience. Intended solely for informational sports research and probability analysis, with no real-money betting or deposits.`
        : `${fetchedMeta.description} Inspect live xG momentum, 6×6 Bivariate Poisson exact scorelines, and ${liveContentStats.totalJackpotGames}-match Mega & Midweek Jackpot combinatorics in seconds. Strictly an informational sports analytics publication designed for fast mobile lookup without real-money wagering.`;

    const promoText = clampString(
      `Analyze ${liveContentStats.fixtureCount}+ live matches across ${liveContentStats.leaguesCount}+ leagues with 6x6 Bivariate Poisson score matrices, live xG, and Mega Jackpot hedges.`,
      170
    );

    const keywords = clampString(fetchedMeta.tags.join(','), 100);

    const lines: string[] = [concise3SentenceOverview];

    lines.push('');
    lines.push('CORE ANALYTICAL CAPABILITIES:');
    lines.push('• 6×6 Bivariate Poisson & Dixon-Coles Exact Score Probability Matrices');
    lines.push('• Real-Time Live Scores, Expected Goals (xG) & Team Form Ratings');
    lines.push('• Head-to-Head (H2H) History, Corner Pressure & Referee Card Telemetry');
    lines.push('• Universal Slip & Odds Format Converter (Decimal, Fractional, American)');
    lines.push('• Offline-First PWA & Android Wrapper Caching for Instant Match Lookup');

    if (includeJackpotPools) {
      lines.push('');
      lines.push('JACKPOT COMBINATORICS & SURVIVAL MODELING:');
      lines.push(
        `• SportPesa Mega Jackpot Pro (17 Games · ${liveContentStats.megaPoolPrize}), Betika 50M Must Be Won (${liveContentStats.betikaGrandPrize}), Mozzart Super Grand (${liveContentStats.mozzartPrize}) & Midweek 13/15 Pools`
      );
      lines.push('• Greedy Marginal Log-Gain Double Chance (1X, X2, 12) & Triple Chance Budget Optimizer');
    }

    if (includeLiveFixtures && liveContentStats.topFixtures.length > 0) {
      lines.push('');
      lines.push('CURRENT FEATURED COMPETITIONS & MATCH SLATE:');
      lines.push(`• Leagues Active: ${liveContentStats.leaguesList.join(', ')}`);
      liveContentStats.topFixtures.slice(0, 3).forEach((fx) => {
        lines.push(`• ${fx.label} (${fx.league}) — Model Confidence ${fx.prob}% | Projected xG ${fx.xG}`);
      });
    }

    if (includeComplianceNote) {
      lines.push('');
      lines.push('EDITORIAL & STORE COMPLIANCE NOTICE:');
      lines.push(
        `${fetchedMeta.shortName} is strictly an informational sports statistics and mathematical probability reference tool. It DOES NOT accept wagers, facilitate real-money gambling, process betting deposits, or pay out cash prizes. Recommended audience: 18+ for odds reference.`
      );
    }

    lines.push('');
    lines.push(`Privacy Policy: ${resolvedPrivacyUrl}`);
    lines.push(`Support: ${cleanDomain}/contact (${supportEmail})`);

    const fullDescription = clampString(lines.join('\n'), 4000);

    const releaseNotes = [
      `• Live ${liveContentStats.totalJackpotGames}-fixture Jackpot combinatorics & Poisson-Binomial tier survival calculator`,
      '• Upgraded 6×6 Bivariate Poisson exact score simulator and live Expected Goals (xG) telemetry',
      `• Expanded coverage across ${liveContentStats.leaguesCount}+ global leagues including FKF Premier League & UEFA competitions`,
    ].join('\n');

    return {
      appTitle,
      subtitleOrShort,
      concise3SentenceOverview,
      promoText,
      keywords,
      fullDescription,
      releaseNotes,
    };
  }, [
    fetchedMeta,
    storeTarget,
    tonePreset,
    liveContentStats,
    includeJackpotPools,
    includeLiveFixtures,
    includeComplianceNote,
    resolvedPrivacyUrl,
    cleanDomain,
    supportEmail,
  ]);

  const [draftTitle, setDraftTitle] = useState<string>(() => buildSynthesizedMetadata().appTitle);
  const [draftShort, setDraftShort] = useState<string>(() => buildSynthesizedMetadata().subtitleOrShort);
  const [draftOverview, setDraftOverview] = useState<string>(
    () => buildSynthesizedMetadata().concise3SentenceOverview
  );
  const [draftPromo, setDraftPromo] = useState<string>(() => buildSynthesizedMetadata().promoText);
  const [draftKeywords, setDraftKeywords] = useState<string>(() => buildSynthesizedMetadata().keywords);
  const [draftFullDesc, setDraftFullDesc] = useState<string>(() => buildSynthesizedMetadata().fullDescription);
  const [draftReleaseNotes, setDraftReleaseNotes] = useState<string>(
    () => buildSynthesizedMetadata().releaseNotes
  );

  useEffect(() => {
    const next = buildSynthesizedMetadata();
    setDraftTitle(next.appTitle);
    setDraftShort(next.subtitleOrShort);
    setDraftOverview(next.concise3SentenceOverview);
    setDraftPromo(next.promoText);
    setDraftKeywords(next.keywords);
    setDraftFullDesc(next.fullDescription);
    setDraftReleaseNotes(next.releaseNotes);
  }, [buildSynthesizedMetadata]);

  const handleRegenerateDescriptions = useCallback(() => {
    const next = buildSynthesizedMetadata();
    setDraftTitle(next.appTitle);
    setDraftShort(next.subtitleOrShort);
    setDraftOverview(next.concise3SentenceOverview);
    setDraftPromo(next.promoText);
    setDraftKeywords(next.keywords);
    setDraftFullDesc(next.fullDescription);
    setDraftReleaseNotes(next.releaseNotes);
    toast.success('Regenerated structured descriptions and store metadata.');
  }, [buildSynthesizedMetadata]);

  // Canvas-generated 512x512 icon placeholder + 4x 1080x1920 mobile screenshots on neutral sports-themed background
  const renderCanvasAssets = useCallback(() => {
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');

    const palette =
      backgroundTheme === 'neutral_slate_pitch'
        ? {
            bgTop: '#161C24',
            bgBottom: '#0E1319',
            stripe: 'rgba(255, 255, 255, 0.022)',
            pitchLine: 'rgba(255, 255, 255, 0.09)',
            card: 'rgba(22, 29, 39, 0.90)',
            border: 'rgba(148, 163, 184, 0.24)',
            accent: '#10B981',
            amber: '#F59E0B',
            text: '#F8FAFC',
            muted: '#94A3B8',
          }
        : {
            bgTop: '#1A1B1F',
            bgBottom: '#111216',
            stripe: 'rgba(255, 255, 255, 0.02)',
            pitchLine: 'rgba(255, 255, 255, 0.085)',
            card: 'rgba(28, 30, 36, 0.90)',
            border: 'rgba(161, 161, 170, 0.22)',
            accent: '#34D399',
            amber: '#FBBF24',
            text: '#FAFAFA',
            muted: '#A1A1AA',
          };

    // 1. Render 512x512 icon placeholder canvas
    if (typeof document !== 'undefined' && !isJsdom) {
      try {
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 512;
        iconCanvas.height = 512;
        const ictx = iconCanvas.getContext('2d');
        if (ictx) {
          const igrad = ictx.createLinearGradient(0, 0, 512, 512);
          igrad.addColorStop(0, palette.bgTop);
          igrad.addColorStop(1, palette.bgBottom);
          ictx.fillStyle = igrad;
          ictx.fillRect(0, 0, 512, 512);

          // Pitch center circle ring
          ictx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
          ictx.lineWidth = 8;
          ictx.beginPath();
          ictx.arc(256, 256, 176, 0, Math.PI * 2);
          ictx.stroke();

          // Shield frame
          drawRoundedRect(ictx, 72, 72, 368, 368, 64);
          ictx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ictx.lineWidth = 4;
          ictx.stroke();

          // Brand Monogram + dimensions label
          ictx.fillStyle = palette.accent;
          ictx.font = '800 132px system-ui, -apple-system, sans-serif';
          ictx.textAlign = 'center';
          const monogram = fetchedMeta.shortName.slice(0, 2).toUpperCase() || 'PP';
          ictx.fillText(monogram, 256, 276);

          ictx.fillStyle = palette.text;
          ictx.font = '700 32px system-ui, -apple-system, sans-serif';
          ictx.fillText(fetchedMeta.shortName.toUpperCase(), 256, 344);

          ictx.fillStyle = palette.muted;
          ictx.font = '600 20px monospace';
          ictx.fillText('512×512 ICON', 256, 386);
          ictx.textAlign = 'left';

          setIconPlaceholderDataUrl(iconCanvas.toDataURL('image/png'));
        }
      } catch {
        setIconPlaceholderDataUrl(null);
      }
    }

    // 2. Render 4x 1080x1920 Portrait Screenshots on Neutral Sports-Themed Pitch Background
    const specs = [
      {
        id: 'screen-1',
        filename: 'predictpro-screenshot-1-best-bets.png',
        title: 'Daily AI Match Predictions',
        kicker: 'QUANTITATIVE FOOTBALL ANALYTICS',
        headline: 'Daily AI Match Predictions',
        subhead: `${liveContentStats.fixtureCount}+ upcoming fixtures ranked by Bivariate Poisson confidence.`,
        keyFeatures: [
          'Bivariate Poisson 1X2 & Over/Under Models',
          'Confidence-Ranked Daily Value Slate',
          'Real-Time Team Form & Implied Odds Edge',
        ],
        drawBody: (ctx: CanvasRenderingContext2D) => {
          const cards = liveContentStats.topFixtures.slice(0, 3);
          if (cards.length === 0) {
            drawRoundedRect(ctx, 72, 610, 936, 320, 26);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = palette.accent;
            ctx.font = '700 28px monospace';
            ctx.fillText('LIVE MATCHDAY SYNC ACTIVE', 112, 684);

            ctx.fillStyle = palette.text;
            ctx.font = '700 40px system-ui, -apple-system, sans-serif';
            ctx.fillText('Bivariate Poisson & xG Models Ready', 112, 760);

            ctx.fillStyle = palette.muted;
            ctx.font = '500 26px system-ui, -apple-system, sans-serif';
            ctx.fillText('Upcoming official fixtures stream automatically from league feeds.', 112, 826);
            return;
          }
          cards.forEach((fx, i) => {
            const y = 610 + i * 315;
            drawRoundedRect(ctx, 72, y, 936, 275, 26);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = palette.muted;
            ctx.font = '600 26px system-ui, -apple-system, sans-serif';
            ctx.fillText(fx.league.toUpperCase(), 112, y + 58);

            ctx.fillStyle = palette.text;
            ctx.font = '700 42px system-ui, -apple-system, sans-serif';
            ctx.fillText(fx.label, 112, y + 124);

            ctx.fillStyle = palette.accent;
            ctx.font = '700 32px monospace';
            ctx.fillText(`${fx.market}  ·  ${fx.prob}% Confidence`, 112, y + 188);

            ctx.fillStyle = palette.muted;
            ctx.font = '600 26px monospace';
            ctx.fillText(`Projected xG: ${fx.xG}`, 112, y + 236);
          });
        },
      },
      {
        id: 'screen-2',
        filename: 'predictpro-screenshot-2-poisson-matrix.png',
        title: '6×6 Bivariate Poisson Matrix',
        kicker: 'EXACT SCORE PROBABILITY',
        headline: '6×6 Scoreline Matrix',
        subhead: `${liveContentStats.topFixtures[0]?.label || 'Featured Match'} · Low-Score Dixon-Coles Calibration`,
        keyFeatures: [
          'Interactive 6×6 Home vs Away Goal Grid',
          'Instant Over/Under & BTTS Derivation',
          'Expected Goals (xG) Split Telemetry',
        ],
        drawBody: (ctx: CanvasRenderingContext2D) => {
          drawRoundedRect(ctx, 72, 610, 936, 940, 26);
          ctx.fillStyle = palette.card;
          ctx.fill();
          ctx.strokeStyle = palette.border;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = palette.text;
          ctx.font = '700 38px system-ui, -apple-system, sans-serif';
          ctx.fillText(liveContentStats.topFixtures[0]?.label || 'Live Matchday Forecast', 112, 686);
          ctx.fillStyle = palette.accent;
          ctx.font = '700 28px monospace';
          ctx.fillText(`xG Split: ${liveContentStats.topFixtures[0]?.xG || 'Poisson Matrix Active'}`, 112, 738);

          const gridProbs = [
            ['3.8%', '5.9%', '4.2%', '1.9%', '0.7%'],
            ['7.1%', '11.4%', '7.8%', '3.2%', '1.1%'],
            ['8.4%', '13.6%', '8.9%', '3.9%', '1.4%'],
            ['4.9%', '7.6%', '5.1%', '2.3%', '0.8%'],
            ['2.1%', '3.2%', '2.2%', '1.0%', '0.4%'],
          ];
          const cellW = 166;
          const cellH = 118;
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              const cx = 116 + c * (cellW + 10);
              const cy = 795 + r * (cellH + 14);
              const isPeak = r === 2 && c === 1;
              drawRoundedRect(ctx, cx, cy, cellW, cellH, 14);
              ctx.fillStyle = isPeak ? palette.accent : 'rgba(13, 21, 34, 0.85)';
              ctx.fill();
              ctx.fillStyle = isPeak ? '#04120C' : palette.text;
              ctx.font = '700 26px monospace';
              ctx.fillText(`${r}-${c}`, cx + 52, cy + 48);
              ctx.font = '600 24px monospace';
              ctx.fillText(gridProbs[r][c], cx + 44, cy + 90);
            }
          }

          ctx.fillStyle = palette.muted;
          ctx.font = '600 26px system-ui, -apple-system, sans-serif';
          ctx.fillText('Highest Probability Outcome: 2-1 (13.6%)', 112, 1502);
        },
      },
      {
        id: 'screen-3',
        filename: 'predictpro-screenshot-3-jackpot-optimizer.png',
        title: 'Mega & Midweek Jackpot Engine',
        kicker: 'COMBINATORIAL SURVIVAL MATH',
        headline: 'Mega Jackpot Optimizer',
        subhead: `${liveContentStats.totalJackpotGames} live matches across SportPesa, Betika & Mozzart.`,
        keyFeatures: [
          'Poisson-Binomial Tier Bonus Survival',
          'Greedy Log-Gain Double Chance Hedges',
          'One-Tap Playable Single-Line Generator',
        ],
        drawBody: (ctx: CanvasRenderingContext2D) => {
          const pools = getInitialOfficialJackpotPools();
          const rows = pools.sportpesa.slice(0, 5);
          drawRoundedRect(ctx, 72, 600, 936, 150, 22);
          ctx.fillStyle = palette.card;
          ctx.fill();
          ctx.strokeStyle = palette.border;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = palette.accent;
          ctx.font = '700 32px monospace';
          ctx.fillText(`POOL: ${liveContentStats.megaPoolPrize}  ·  17 MATCHES`, 112, 666);
          ctx.fillStyle = palette.text;
          ctx.font = '500 26px system-ui, -apple-system, sans-serif';
          ctx.fillText('Budget-Constrained Double & Triple Chance Allocation', 112, 718);

          if (rows.length === 0) {
            drawRoundedRect(ctx, 72, 782, 936, 240, 20);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = palette.text;
            ctx.font = '600 28px system-ui, -apple-system, sans-serif';
            ctx.fillText('Syncing official Mega Jackpot fixtures from pool API...', 112, 895);
          } else {
            rows.forEach((g, idx) => {
              const y = 782 + idx * 158;
              drawRoundedRect(ctx, 72, y, 936, 134, 20);
              ctx.fillStyle = palette.card;
              ctx.fill();
              ctx.strokeStyle = palette.border;
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = palette.muted;
              ctx.font = '700 26px monospace';
              ctx.fillText(`#${String(g.id).padStart(2, '0')}`, 108, y + 58);

              ctx.fillStyle = palette.text;
              ctx.font = '700 30px system-ui, -apple-system, sans-serif';
              ctx.fillText(clampString(g.match, 30), 186, y + 58);

              ctx.fillStyle = palette.muted;
            ctx.font = '600 24px monospace';
            ctx.fillText(
              `1:${g.homeOdds.toFixed(2)}  X:${g.drawOdds.toFixed(2)}  2:${g.awayOdds.toFixed(2)}`,
              186,
              y + 102
            );

            ctx.fillStyle = g.isBanker ? palette.accent : palette.amber;
            ctx.font = '700 28px monospace';
            ctx.fillText(g.isBanker ? `LOCK ${g.recommendedPick}` : `HEDGE ${g.doubleChance}`, 770, y + 80);
            });
          }
        },
      },
      {
        id: 'screen-4',
        filename: 'predictpro-screenshot-4-global-coverage.png',
        title: '40+ Global Leagues & Live xG',
        kicker: 'MOBILE ANALYTICS COMPANION',
        headline: 'Global Coverage & Offline Speed',
        subhead: 'Instant league hubs, odds conversion & privacy-first editorial access.',
        keyFeatures: [
          'Premier League, UCL, LaLiga & FKF Premier League',
          'Universal Odds & Slip Probability Calculator',
          'Zero Real-Money Wagering · Public /privacy Policy',
        ],
        drawBody: (ctx: CanvasRenderingContext2D) => {
          const cards = [
            {
              heading: 'Global Competition Coverage',
              detail: liveContentStats.leaguesList.slice(0, 4).join(' · '),
            },
            {
              heading: 'East & Pan-African Football',
              detail: 'FKF Premier League · CAF Champions League · NPFL · PSL',
            },
            {
              heading: 'Odds & Probability Tools',
              detail: 'Decimal, Fractional, American & Implied Probability',
            },
            {
              heading: 'Verified Store Compliance',
              detail: `Sports Stats Reference · ${resolvedPrivacyUrl}`,
            },
          ];

          cards.forEach((c, idx) => {
            const y = 610 + idx * 238;
            drawRoundedRect(ctx, 72, y, 936, 204, 24);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = palette.accent;
            ctx.font = '700 34px system-ui, -apple-system, sans-serif';
            ctx.fillText(`0${idx + 1}. ${c.heading}`, 114, y + 78);

            ctx.fillStyle = palette.text;
            ctx.font = '500 28px system-ui, -apple-system, sans-serif';
            ctx.fillText(clampString(c.detail, 54), 114, y + 144);
          });
        },
      },
    ];

    const built: GeneratedScreenshotAsset[] = specs.map((spec) => {
      let dataUrl: string | null = null;
      if (typeof document !== 'undefined' && !isJsdom) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1920;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Neutral sports-themed pitch background
            drawNeutralSportsBackground(ctx, palette);

            // Overlay App Branding Header Bar
            let headerOffsetY = 92;
            if (showBrandingCrest) {
              drawRoundedRect(ctx, 72, headerOffsetY, 84, 84, 20);
              ctx.fillStyle = palette.accent;
              ctx.fill();

              ctx.fillStyle = '#04120C';
              ctx.font = '800 36px system-ui, -apple-system, sans-serif';
              ctx.fillText(fetchedMeta.shortName.slice(0, 2).toUpperCase() || 'PP', 90, headerOffsetY + 55);

              ctx.fillStyle = palette.text;
              ctx.font = '800 38px system-ui, -apple-system, sans-serif';
              ctx.fillText(fetchedMeta.shortName, 178, headerOffsetY + 38);

              ctx.fillStyle = palette.accent;
              ctx.font = '700 24px monospace';
              ctx.fillText(spec.kicker, 178, headerOffsetY + 74);
              headerOffsetY += 126;
            } else {
              ctx.fillStyle = palette.accent;
              ctx.font = '700 26px monospace';
              ctx.fillText(`${fetchedMeta.shortName.toUpperCase()} · ${spec.kicker}`, 72, 128);
              headerOffsetY = 160;
            }

            // Main screen headline + subtitle
            ctx.fillStyle = palette.text;
            ctx.font = '800 58px system-ui, -apple-system, sans-serif';
            ctx.fillText(spec.headline, 72, headerOffsetY + 72);

            ctx.fillStyle = palette.muted;
            ctx.font = '500 30px system-ui, -apple-system, sans-serif';
            ctx.fillText(clampString(spec.subhead, 62), 72, headerOffsetY + 132);

            // Key Feature Bullet Strip overlaid cleanly above body
            ctx.fillStyle = palette.accent;
            ctx.font = '600 25px system-ui, -apple-system, sans-serif';
            ctx.fillText(`• ${spec.keyFeatures[0]}   • ${spec.keyFeatures[1]}`, 72, headerOffsetY + 206);

            // Screen Body Overlay
            spec.drawBody(ctx);

            // Footer branding & privacy URL
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(72, 1740);
            ctx.lineTo(1008, 1740);
            ctx.stroke();

            ctx.fillStyle = palette.text;
            ctx.font = '600 26px system-ui, -apple-system, sans-serif';
            ctx.fillText(spec.keyFeatures[2], 72, 1796);

            ctx.fillStyle = palette.muted;
            ctx.font = '500 24px monospace';
            ctx.fillText(`${resolvedPrivacyUrl}  ·  Sports Statistics Reference`, 72, 1844);

            dataUrl = canvas.toDataURL('image/png');
          }
        } catch {
          dataUrl = null;
        }
      }

      return {
        id: spec.id,
        filename: spec.filename,
        title: spec.title,
        caption: spec.subhead,
        dimensions: '1080 × 1920 px (9:16 Portrait PNG)',
        keyFeatures: spec.keyFeatures,
        dataUrl,
      };
    });

    setScreenshots(built);
  }, [
    backgroundTheme,
    showBrandingCrest,
    fetchedMeta.shortName,
    liveContentStats,
    resolvedPrivacyUrl,
  ]);

  useEffect(() => {
    renderCanvasAssets();
  }, [renderCanvasAssets]);

  // Structured 'App Store Metadata' JSON Manifest combining fetched metadata, 512x512 icon placeholder, 2-4 sentence descriptions & privacy policy template
  const structuredAppStoreManifest = useMemo(
    () => ({
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      sourceMetadata: {
        appName: fetchedMeta.name,
        shortName: fetchedMeta.shortName,
        packageId,
        fetchedFrom: fetchedMeta.source,
        tags: fetchedMeta.tags,
      },
      iconPlaceholder: {
        dimensions: '512x512',
        format: 'image/png',
        hostedUrl: `${cleanDomain}/icon-512.png`,
        canvasPlaceholderFile: 'predictpro-icon-placeholder-512x512.png',
        purpose: 'any maskable',
      },
      storeCopy: {
        targetStore: storeTarget,
        appTitle: draftTitle,
        shortDescription: draftShort,
        optimizedOverview: draftOverview,
        promotionalSummary: draftPromo,
        keywords: draftKeywords,
        fullDescription: draftFullDesc,
        releaseNotes: draftReleaseNotes,
      },
      screenshots: screenshots.map((s) => ({
        id: s.id,
        filename: s.filename,
        dimensions: '1080x1920',
        aspectRatio: '9:16',
        background: backgroundTheme,
        keyFeatures: s.keyFeatures,
      })),
      legalAndPrivacy: {
        privacyPolicyUrlTemplate: privacyTemplate,
        resolvedPrivacyPolicyUrl: resolvedPrivacyUrl,
        termsOfServiceUrl: `${cleanDomain}/terms`,
        cookiePolicyUrl: `${cleanDomain}/cookies`,
        supportUrl: `${cleanDomain}/contact`,
        supportEmail,
        nonGamblingComplianceUrl: `${cleanDomain}/responsible-gaming`,
      },
    }),
    [
      fetchedMeta,
      packageId,
      cleanDomain,
      storeTarget,
      draftTitle,
      draftShort,
      draftOverview,
      draftPromo,
      draftKeywords,
      draftFullDesc,
      draftReleaseNotes,
      screenshots,
      backgroundTheme,
      privacyTemplate,
      resolvedPrivacyUrl,
      supportEmail,
    ]
  );

  const structuredManifestJson = useMemo(
    () => JSON.stringify(structuredAppStoreManifest, null, 2),
    [structuredAppStoreManifest]
  );

  const handleCopy = (value: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard.`);
    } else {
      toast.info('Clipboard API unavailable in this environment.');
    }
  };

  const handleDownloadDataUrl = (dataUrl: string | null, filename: string) => {
    if (!dataUrl) {
      toast.error('Canvas rendering unavailable in headless environment.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${filename}`);
  };

  const handleDownloadAllScreenshots = () => {
    const ready = screenshots.filter((s) => Boolean(s.dataUrl));
    if (ready.length === 0) {
      toast.error('No rendered screenshots available to download.');
      return;
    }
    ready.forEach((item, idx) => {
      setTimeout(() => handleDownloadDataUrl(item.dataUrl, item.filename), idx * 150);
    });
  };

  const handleVerifyLegalRoutes = async () => {
    setVerifyingRoutes(true);
    const nextStatuses: Record<string, 'idle' | 'ok' | 'error'> = {};
    await Promise.all(
      LEGAL_ROUTES.map(async (item) => {
        try {
          const res = await fetch(item.path, { method: 'HEAD' });
          nextStatuses[item.id] = res.ok || res.status === 200 || res.status === 304 ? 'ok' : 'error';
        } catch {
          nextStatuses[item.id] = 'error';
        }
      })
    );
    setRouteStatuses(nextStatuses);
    setVerifyingRoutes(false);
    toast.success('Verified live HTTP reachability for all privacy and compliance routes.');
  };

  const handleDownloadStructuredManifest = () => {
    const blob = new Blob([structuredManifestJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-store-metadata-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded structured app-store-metadata-manifest.json');
  };

  const shortLimit = storeTarget === 'apple_connect' ? 30 : 80;

  return (
    <div className="space-y-8">
      {/* Header & Fetched Source Metadata */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Fetched Source: {fetchedMeta.source}
              </span>
              <span aria-hidden="true">·</span>
              <span>{liveContentStats.fixtureCount} Live Fixtures</span>
              <span aria-hidden="true">·</span>
              <span>{fetchedMeta.tags.length} Extracted Tags</span>
              <span aria-hidden="true">·</span>
              <span>{fetchedMeta.icons.length} Manifest Icons</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              App Store Metadata &amp; Asset Manifest Generator
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Fetches live app metadata (name, description, tags) to generate a structured App Store Metadata manifest with a 512×512 icon placeholder, optimized 2–4 sentence descriptions, a Privacy Policy URL template, and 4 canvas-rendered 1080×1920 sports-themed mobile screenshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={fetchingMeta}
              onClick={() => fetchLiveAppMetadata(true)}
              className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingMeta ? 'animate-spin' : ''}`} />
              Fetch App Metadata
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadStructuredManifest}
              className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Manifest (.json)
            </Button>
          </div>
        </div>

        {/* Editable Fetched Metadata Inputs (Name, Tags, Domain, Privacy Template) */}
        <div className="pt-4 border-t border-border/70 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="fetched-app-name"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Fetched App Name
            </label>
            <input
              id="fetched-app-name"
              type="text"
              value={fetchedMeta.shortName}
              onChange={(e) =>
                setFetchedMeta((prev) => ({ ...prev, shortName: e.target.value }))
              }
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="fetched-app-tags"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Fetched Metadata Tags (comma-separated)
            </label>
            <input
              id="fetched-app-tags"
              type="text"
              value={fetchedMeta.tags.join(', ')}
              onChange={(e) =>
                setFetchedMeta((prev) => ({
                  ...prev,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                }))
              }
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="meta-domain-input"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Production Domain
            </label>
            <div className="flex gap-1.5">
              <input
                id="meta-domain-input"
                type="text"
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.location?.origin) {
                    setBaseDomain(window.location.origin);
                    toast.success(`Set domain to ${window.location.origin}`);
                  }
                }}
                className="h-9 px-2.5 text-[11px] font-semibold whitespace-nowrap shrink-0"
              >
                Use Origin
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="privacy-url-template-input"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Privacy Policy URL Template
            </label>
            <input
              id="privacy-url-template-input"
              type="text"
              value={privacyTemplate}
              onChange={(e) => setPrivacyTemplate(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
            />
          </div>
        </div>

        {/* Store Target Filter & Tone Preset */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'universal', label: 'Universal / Free Stores' },
                { id: 'google_play', label: 'Google Play Console' },
                { id: 'apple_connect', label: 'Apple App Store Connect' },
                { id: 'samsung_huawei_xiaomi', label: 'Samsung / Huawei / Xiaomi' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStoreTarget(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  storeTarget === t.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {(
                [
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'jackpot_xg', label: 'Jackpot + xG' },
                  { id: 'editorial_stats', label: 'Compliance' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTonePreset(preset.id)}
                  className={`py-1 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    tonePreset === preset.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLiveFixtures}
                onChange={(e) => setIncludeLiveFixtures(e.target.checked)}
                className="rounded border-border"
              />
              <span>Live Matches</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeJackpotPools}
                onChange={(e) => setIncludeJackpotPools(e.target.checked)}
                className="rounded border-border"
              />
              <span>Jackpot Pools</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComplianceNote}
                onChange={(e) => setIncludeComplianceNote(e.target.checked)}
                className="rounded border-border"
              />
              <span>Non-Gambling Notice</span>
            </label>
          </div>
        </div>
      </section>

      {/* 01. Structured 'App Store Metadata' Manifest & 2-4 Sentence Descriptions */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              01. Structured &lsquo;App Store Metadata&rsquo; Manifest &amp; Optimized Descriptions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synthesizes concise 2–4 sentence overviews, character-checked store copy, 512×512 icon placeholder config, and Privacy Policy URL template.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRegenerateDescriptions}
              className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate Copy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleCopy(structuredManifestJson, 'Structured App Store Metadata Manifest')}
              className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5" />
              Copy Manifest JSON
            </Button>
          </div>
        </div>

        {/* Optimized 2-4 Sentence Overview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="draft-2-4-sentence" className="font-semibold text-foreground">
              Optimized Store Overview (2–4 Sentences · High-Conversion Summary)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                {draftOverview.split(/[.!?]+/).filter((s) => s.trim().length > 0).length} sentences · {draftOverview.length} chars
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopy(draftOverview, 'Optimized 2-4 Sentence Description')}
                className="h-6 px-2 text-[11px] gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </div>
          <textarea
            id="draft-2-4-sentence"
            rows={3}
            value={draftOverview}
            onChange={(e) => setDraftOverview(e.target.value)}
            className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed font-sans"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* App Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-app-title" className="font-semibold text-foreground">
                App Title
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    draftTitle.length > 30 ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {draftTitle.length}/30 chars
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(draftTitle, 'App Title')}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
            <input
              id="draft-app-title"
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
            />
          </div>

          {/* Short Description / Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-short-desc" className="font-semibold text-foreground">
                {storeTarget === 'apple_connect' ? 'Apple Subtitle' : 'Short Description'}
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    draftShort.length > shortLimit ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {draftShort.length}/{shortLimit} chars
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(draftShort, 'Short Description')}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
            <input
              id="draft-short-desc"
              type="text"
              value={draftShort}
              onChange={(e) => setDraftShort(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
            />
          </div>

          {/* Promotional Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-promo-text" className="font-semibold text-foreground">
                Promotional Summary
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    draftPromo.length > 170 ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {draftPromo.length}/170 chars
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(draftPromo, 'Promotional Summary')}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
            <input
              id="draft-promo-text"
              type="text"
              value={draftPromo}
              onChange={(e) => setDraftPromo(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-keywords" className="font-semibold text-foreground">
                Search Keywords / Store Tags
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    draftKeywords.length > 100 ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {draftKeywords.length}/100 chars
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(draftKeywords, 'Store Keywords')}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
            <input
              id="draft-keywords"
              type="text"
              value={draftKeywords}
              onChange={(e) => setDraftKeywords(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
            />
          </div>
        </div>

        {/* Full Description & Structured JSON Manifest Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-full-desc" className="font-semibold text-foreground">
                Full Store Description
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    draftFullDesc.length > 4000 ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {draftFullDesc.length}/4000 chars
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(draftFullDesc, 'Full Store Description')}
                  className="h-6 px-2.5 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
            <textarea
              id="draft-full-desc"
              rows={12}
              value={draftFullDesc}
              onChange={(e) => setDraftFullDesc(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Structured &lsquo;App Store Metadata&rsquo; JSON Manifest
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  aria-label="Android Package ID"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="h-6 w-36 rounded border border-border bg-background px-2 text-[11px] font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadStructuredManifest}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Download className="w-3 h-3" /> JSON
                </Button>
              </div>
            </div>
            <pre className="h-[246px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono text-emerald-300 leading-relaxed">
              {structuredManifestJson}
            </pre>
          </div>
        </div>
      </section>

      {/* 02. Canvas-Based Screenshot Generator (1080x1920 on Neutral Sports Background) & 512x512 Icon Placeholder */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              02. Canvas Screenshot Tool (4 × 1080×1920 Portrait) &amp; 512×512 Icon Placeholder
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overlays app branding and live key features directly onto a neutral sports-themed pitch background, plus generates a downloadable 512×512 store icon placeholder.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {(
                [
                  { id: 'neutral_slate_pitch', label: 'Neutral Pitch Slate' },
                  { id: 'neutral_charcoal_pitch', label: 'Neutral Pitch Charcoal' },
                ] as const
              ).map((themeOpt) => (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => setBackgroundTheme(themeOpt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    backgroundTheme === themeOpt.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {themeOpt.label}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer px-2">
              <input
                type="checkbox"
                checked={showBrandingCrest}
                onChange={(e) => setShowBrandingCrest(e.target.checked)}
                className="rounded border-border"
              />
              <span>Branding Crest</span>
            </label>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={renderCanvasAssets}
              className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Render Canvas
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadAllScreenshots}
              className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download All 4 PNGs
            </Button>
          </div>
        </div>

        {/* 512x512 Canvas Placeholder + Hosted Manifest Icons */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            512×512 Icon Placeholder &amp; Hosted Manifest Assets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Canvas-Rendered 512x512 Placeholder */}
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                {iconPlaceholderDataUrl ? (
                  <img
                    src={iconPlaceholderDataUrl}
                    alt="512x512 Canvas Icon Placeholder"
                    className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-border bg-slate-900 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    512
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">512×512 Icon Placeholder</p>
                  <p className="text-[11px] font-mono text-muted-foreground">Canvas PNG · 512 × 512 px</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(`${cleanDomain}/icon-512.png`, '512x512 Icon URL')}
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() =>
                    handleDownloadDataUrl(iconPlaceholderDataUrl, 'predictpro-icon-placeholder-512x512.png')
                  }
                  className="h-7 px-2.5 text-[11px] gap-1"
                >
                  <Download className="w-3 h-3" /> Save PNG
                </Button>
              </div>
            </div>

            {[
              { label: 'Hosted 512×512 Icon', path: '/icon-512.png', dims: '512 × 512 px · PNG' },
              { label: '192×192 Launcher Icon', path: '/icon-192.png', dims: '192 × 192 px · PNG' },
              { label: 'Feature Graphic Banner', path: '/og-image.jpg', dims: '1200 × 630 px · JPG' },
            ].map((asset) => {
              const absUrl = `${cleanDomain}${asset.path}`;
              return (
                <div
                  key={asset.path}
                  className="rounded-lg border border-border bg-background p-3 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={asset.path}
                      alt={asset.label}
                      className="w-12 h-12 rounded-lg object-cover border border-border shrink-0 bg-muted"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{asset.label}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{asset.dims}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(absUrl, asset.label)}
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy URL
                    </Button>
                    <a
                      href={asset.path}
                      download
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-semibold text-foreground transition-colors"
                    >
                      <Download className="w-3 h-3" /> Save
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Generated 1080x1920 Portrait Mobile Screenshots */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            4 Canvas Placeholder Mobile Screenshots (1080×1920 · Neutral Sports Pitch Overlay)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {screenshots.map((shot, idx) => (
              <div
                key={shot.id}
                className="rounded-xl border border-border bg-background overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[9/16] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-border/60">
                  {shot.dataUrl ? (
                    <img
                      src={shot.dataUrl}
                      alt={shot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center space-y-2 text-slate-300">
                      <Smartphone className="w-6 h-6 mx-auto text-emerald-400" />
                      <p className="text-xs font-semibold">{shot.title}</p>
                      <p className="text-[11px] font-mono text-slate-400">{shot.dimensions}</p>
                      <ul className="text-[10px] text-slate-400 space-y-0.5 text-left pt-1">
                        {shot.keyFeatures.map((f) => (
                          <li key={f}>· {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      0{idx + 1}. {shot.title}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {shot.dimensions}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDataUrl(shot.dataUrl, shot.filename)}
                    className="w-full h-8 text-xs font-semibold gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03. Privacy Policy URL Template & Compliance Links */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              03. Privacy Policy URL Template &amp; Store Compliance Links
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Resolved Template: <code className="font-mono text-foreground">{privacyTemplate}</code> &rarr;{' '}
              <code className="font-mono text-emerald-600 dark:text-emerald-400">{resolvedPrivacyUrl}</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={verifyingRoutes}
              onClick={handleVerifyLegalRoutes}
              className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Globe className={`w-3.5 h-3.5 ${verifyingRoutes ? 'animate-spin' : ''}`} />
              {verifyingRoutes ? 'Checking Routes...' : 'Verify Live Route Status'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                handleCopy(
                  LEGAL_ROUTES.map((r) => `${r.label}: ${cleanDomain}${r.path}`).join('\n'),
                  'All Legal & Privacy Policy URLs'
                )
              }
              className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy All Legal URLs
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border/70">
          {LEGAL_ROUTES.map((item) => {
            const fullUrl = item.id === 'privacy' ? resolvedPrivacyUrl : `${cleanDomain}${item.path}`;
            const status = routeStatuses[item.id] || 'idle';
            return (
              <div
                key={item.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-foreground">{item.label}</span>
                    <span aria-hidden="true" className="text-muted-foreground">·</span>
                    <code className="font-mono text-emerald-600 dark:text-emerald-400 break-all">
                      {fullUrl}
                    </code>
                    {status === 'ok' && (
                      <>
                        <span aria-hidden="true" className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> HTTP 200 OK
                        </span>
                      </>
                    )}
                    {status === 'error' && (
                      <>
                        <span aria-hidden="true" className="text-muted-foreground">·</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          Check Local Route
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {item.purpose} <span className="text-muted-foreground/80">({item.requiredBy})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(fullUrl, item.label)}
                    className="h-8 px-2.5 text-xs gap-1 whitespace-nowrap shrink-0"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Copy URL
                  </Button>
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors whitespace-nowrap shrink-0"
                  >
                    Preview <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminAppStoreMetadataTab;
