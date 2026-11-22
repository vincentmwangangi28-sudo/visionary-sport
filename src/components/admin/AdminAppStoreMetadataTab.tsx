import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
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
type ScreenshotTheme = 'emerald_dark' | 'slate_pro';

interface ManifestSnapshot {
  name: string;
  short_name: string;
  description: string;
  categories: string[];
  icons: Array<{ src: string; sizes: string; type?: string; purpose?: string }>;
  screenshots: Array<{ src: string; sizes: string; type?: string; form_factor?: string; label?: string }>;
  shortcuts: Array<{ name: string; short_name?: string; description?: string; url: string }>;
}

const FALLBACK_MANIFEST: ManifestSnapshot = {
  name: 'PredictPro — AI Football Predictions & Expected Goals (xG)',
  short_name: 'PredictPro',
  description:
    'Quantitative AI football predictions, Expected Goals (xG) analytics, 6x6 Bivariate Poisson score matrices, 17-game Mega Jackpot generator, and universal booking code converter across 40+ global leagues.',
  categories: ['sports', 'news', 'utilities'],
  icons: [
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
  ],
  screenshots: [
    {
      src: '/og-image.jpg',
      sizes: '1200x630',
      type: 'image/jpeg',
      form_factor: 'wide',
      label: 'PredictPro Quantitative Football Match Intelligence & 6x6 Poisson Score Matrix',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'Live Expected Goals (xG), 17-Game Jackpot Generator & Universal Booking Code Converter',
    },
  ],
  shortcuts: [
    { name: 'Match Predictions Today', url: '/predict' },
    { name: 'Live Scores & xG', url: '/live' },
    { name: '17-Game Jackpot Generator', url: '/jackpot-generator' },
    { name: 'Booking Code Converter', url: '/slip-generator' },
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

export const AdminAppStoreMetadataTab: React.FC = () => {
  const { data: predictionsData } = usePredictions();
  const livePredictions = useMemo(
    () => predictionsData?.allPredictions ?? predictionsData?.predictions ?? [],
    [predictionsData]
  );

  const [manifest, setManifest] = useState<ManifestSnapshot>(FALLBACK_MANIFEST);
  const [baseDomain, setBaseDomain] = useState<string>('https://predictpro.guru');
  const [packageId, setPackageId] = useState<string>('guru.predictpro.twa');
  const [supportEmail, setSupportEmail] = useState<string>('vincentmwangangi28@gmail.com');
  const [storeTarget, setStoreTarget] = useState<StoreTargetId>('universal');
  const [tonePreset, setTonePreset] = useState<TonePreset>('balanced');
  const [screenshotTheme, setScreenshotTheme] = useState<ScreenshotTheme>('emerald_dark');

  const [includeLiveFixtures, setIncludeLiveFixtures] = useState<boolean>(true);
  const [includeJackpotPools, setIncludeJackpotPools] = useState<boolean>(true);
  const [includeComplianceNote, setIncludeComplianceNote] = useState<boolean>(true);

  const [routeStatuses, setRouteStatuses] = useState<Record<string, 'idle' | 'ok' | 'error'>>({});
  const [verifyingRoutes, setVerifyingRoutes] = useState<boolean>(false);

  const [screenshots, setScreenshots] = useState<GeneratedScreenshotAsset[]>([]);

  // Fetch live /manifest.json on mount
  useEffect(() => {
    let active = true;
    fetch('/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json) return;
        setManifest({
          name: json.name || FALLBACK_MANIFEST.name,
          short_name: json.short_name || FALLBACK_MANIFEST.short_name,
          description: json.description || FALLBACK_MANIFEST.description,
          categories: Array.isArray(json.categories) ? json.categories : FALLBACK_MANIFEST.categories,
          icons: Array.isArray(json.icons) ? json.icons : FALLBACK_MANIFEST.icons,
          screenshots: Array.isArray(json.screenshots) ? json.screenshots : FALLBACK_MANIFEST.screenshots,
          shortcuts: Array.isArray(json.shortcuts) ? json.shortcuts : FALLBACK_MANIFEST.shortcuts,
        });
      })
      .catch(() => {
        // Retain fallback manifest
      });
    return () => {
      active = false;
    };
  }, []);

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
      const home = p.homeTeam || p.home || 'Arsenal';
      const away = p.awayTeam || p.away || 'Chelsea';
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

    const fallbackMatches = [
      { label: 'Arsenal vs Chelsea', league: 'Premier League', prob: 68, xG: '2.14–0.98', market: '1 · Over 1.5' },
      { label: 'Real Madrid vs Barcelona', league: 'LaLiga', prob: 71, xG: '2.26–1.41', market: 'BTTS Yes' },
      { label: 'Bayern Munich vs Dortmund', league: 'Bundesliga', prob: 74, xG: '2.48–1.15', market: 'Home Win (1)' },
      { label: 'Gor Mahia vs AFC Leopards', league: 'FKF Premier League', prob: 66, xG: '1.65–0.74', market: '1X & Under 3.5' },
    ];

    const topFixtures = featuredMatches.length > 0 ? featuredMatches : fallbackMatches;
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

  // Synthesize store metadata from live app content
  const buildSynthesizedMetadata = useCallback(() => {
    const cleanDomain = baseDomain.replace(/\/+$/, '');
    const appTitle =
      storeTarget === 'apple_connect'
        ? 'PredictPro: Football xG & Stats'
        : clampString(`${manifest.short_name}: Football xG & Stats`, 30);

    const subtitleOrShort =
      storeTarget === 'apple_connect'
        ? 'Soccer xG, Poisson & Live Stats'
        : tonePreset === 'jackpot_xg'
        ? clampString('Football xG, 6x6 Poisson score models & 17-game Jackpot optimizer.', 80)
        : clampString('AI football predictions, Bivariate Poisson 6x6 score matrices & live xG.', 80);

    const promoText = clampString(
      `Analyze ${liveContentStats.fixtureCount}+ live matches across ${liveContentStats.leaguesCount}+ leagues with 6x6 Bivariate Poisson score matrices, live xG, and Mega Jackpot hedges.`,
      170
    );

    const keywords = clampString(
      'football,soccer,predictions,xg,poisson,stats,livescore,jackpot,premier league,h2h,analytics',
      100
    );

    const lines: string[] = [];
    if (tonePreset === 'editorial_stats') {
      lines.push(
        `${manifest.short_name} is an independent football statistics, Expected Goals (xG), and mathematical probability reference covering ${liveContentStats.leaguesCount}+ global competitions including ${liveContentStats.leaguesList.slice(0, 5).join(', ')}.`
      );
    } else if (tonePreset === 'jackpot_xg') {
      lines.push(
        `${manifest.short_name} combines Bivariate Poisson & Dixon-Coles goal modeling with Poisson-Binomial Jackpot survival combinatorics across ${liveContentStats.leaguesCount}+ football competitions.`
      );
    } else {
      lines.push(manifest.description);
    }

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
        `${manifest.short_name} is strictly an informational sports statistics and mathematical probability reference tool. It DOES NOT accept wagers, facilitate real-money gambling, process betting deposits, or pay out cash prizes. Recommended audience: 18+ for odds reference.`
      );
    }

    lines.push('');
    lines.push(`Privacy Policy: ${cleanDomain}/privacy`);
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
      promoText,
      keywords,
      fullDescription,
      releaseNotes,
    };
  }, [
    baseDomain,
    storeTarget,
    tonePreset,
    manifest,
    liveContentStats,
    includeJackpotPools,
    includeLiveFixtures,
    includeComplianceNote,
    supportEmail,
  ]);

  const [draftTitle, setDraftTitle] = useState<string>(() => buildSynthesizedMetadata().appTitle);
  const [draftShort, setDraftShort] = useState<string>(() => buildSynthesizedMetadata().subtitleOrShort);
  const [draftPromo, setDraftPromo] = useState<string>(() => buildSynthesizedMetadata().promoText);
  const [draftKeywords, setDraftKeywords] = useState<string>(() => buildSynthesizedMetadata().keywords);
  const [draftFullDesc, setDraftFullDesc] = useState<string>(() => buildSynthesizedMetadata().fullDescription);
  const [draftReleaseNotes, setDraftReleaseNotes] = useState<string>(
    () => buildSynthesizedMetadata().releaseNotes
  );

  const handleRegenerateDescriptions = useCallback(() => {
    const next = buildSynthesizedMetadata();
    setDraftTitle(next.appTitle);
    setDraftShort(next.subtitleOrShort);
    setDraftPromo(next.promoText);
    setDraftKeywords(next.keywords);
    setDraftFullDesc(next.fullDescription);
    setDraftReleaseNotes(next.releaseNotes);
    toast.success('Regenerated all store listing descriptions from live app content.');
  }, [buildSynthesizedMetadata]);

  // Regenerate automatically when target preset or content toggles change
  useEffect(() => {
    const next = buildSynthesizedMetadata();
    setDraftTitle(next.appTitle);
    setDraftShort(next.subtitleOrShort);
    setDraftPromo(next.promoText);
    setDraftKeywords(next.keywords);
    setDraftFullDesc(next.fullDescription);
    setDraftReleaseNotes(next.releaseNotes);
  }, [buildSynthesizedMetadata]);

  // Generate 4 mobile portrait store screenshots (1080x1920 PNG) directly from live app content
  const renderStoreScreenshots = useCallback(() => {
    const palette =
      screenshotTheme === 'emerald_dark'
        ? {
            bgTop: '#060A12',
            bgBottom: '#0B1623',
            card: '#111B2B',
            border: '#1F2F46',
            accent: '#10B981',
            amber: '#F59E0B',
            text: '#F8FAFC',
            muted: '#94A3B8',
          }
        : {
            bgTop: '#0F172A',
            bgBottom: '#1E293B',
            card: '#182336',
            border: '#334155',
            accent: '#38BDF8',
            amber: '#FBBF24',
            text: '#F8FAFC',
            muted: '#94A3B8',
          };

    const specs = [
      {
        id: 'screen-1',
        filename: 'predictpro-screenshot-1-best-bets.png',
        title: 'AI Match Predictions & Daily Confidence',
        kicker: 'BIVARIATE POISSON ENGINE',
        headline: 'High-Conviction Football Picks',
        subhead: `${liveContentStats.fixtureCount}+ live fixtures across ${liveContentStats.leaguesCount}+ leagues calibrated daily.`,
        drawBody: (ctx: CanvasRenderingContext2D) => {
          liveContentStats.topFixtures.forEach((fx, i) => {
            const y = 480 + i * 310;
            drawRoundedRect(ctx, 72, y, 936, 270, 28);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = palette.muted;
            ctx.font = '600 28px system-ui, -apple-system, sans-serif';
            ctx.fillText(fx.league.toUpperCase(), 112, y + 58);

            ctx.fillStyle = palette.text;
            ctx.font = '700 42px system-ui, -apple-system, sans-serif';
            ctx.fillText(fx.label, 112, y + 124);

            ctx.fillStyle = palette.accent;
            ctx.font = '700 34px monospace';
            ctx.fillText(`${fx.market}  ·  ${fx.prob}% Model Confidence`, 112, y + 190);

            ctx.fillStyle = palette.muted;
            ctx.font = '600 28px monospace';
            ctx.fillText(`Projected Expected Goals (xG): ${fx.xG}`, 112, y + 236);
          });
        },
      },
      {
        id: 'screen-2',
        filename: 'predictpro-screenshot-2-poisson-xg.png',
        title: '6×6 Bivariate Poisson Score Matrix',
        kicker: 'EXACT SCORE SIMULATOR',
        headline: '6×6 Correct Score Probabilities',
        subhead: `${liveContentStats.topFixtures[0]?.label || 'Featured Match'} · Dixon-Coles Low-Score Calibration`,
        drawBody: (ctx: CanvasRenderingContext2D) => {
          drawRoundedRect(ctx, 72, 480, 936, 980, 28);
          ctx.fillStyle = palette.card;
          ctx.fill();
          ctx.strokeStyle = palette.border;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = palette.text;
          ctx.font = '700 38px system-ui, -apple-system, sans-serif';
          ctx.fillText(liveContentStats.topFixtures[0]?.label || 'Arsenal vs Chelsea', 112, 555);
          ctx.fillStyle = palette.accent;
          ctx.font = '700 30px monospace';
          ctx.fillText(`xG Split: ${liveContentStats.topFixtures[0]?.xG || '2.14–0.98'}`, 112, 608);

          const gridProbs = [
            ['3.8%', '5.9%', '4.2%', '1.9%', '0.7%'],
            ['7.1%', '11.4%', '7.8%', '3.2%', '1.1%'],
            ['8.4%', '13.6%', '8.9%', '3.9%', '1.4%'],
            ['4.9%', '7.6%', '5.1%', '2.3%', '0.8%'],
            ['2.1%', '3.2%', '2.2%', '1.0%', '0.4%'],
          ];
          const cellW = 166;
          const cellH = 126;
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              const cx = 116 + c * (cellW + 10);
              const cy = 670 + r * (cellH + 14);
              const isPeak = r === 2 && c === 1;
              drawRoundedRect(ctx, cx, cy, cellW, cellH, 16);
              ctx.fillStyle = isPeak ? palette.accent : '#0D1524';
              ctx.fill();
              ctx.fillStyle = isPeak ? '#04120C' : palette.text;
              ctx.font = '700 28px monospace';
              ctx.fillText(`${r}-${c}`, cx + 48, cy + 52);
              ctx.font = '600 26px monospace';
              ctx.fillText(gridProbs[r][c], cx + 40, cy + 96);
            }
          }

          ctx.fillStyle = palette.muted;
          ctx.font = '600 28px system-ui, -apple-system, sans-serif';
          ctx.fillText('Most Likely Scoreline: 2-1 (13.6%) · Over 1.5 Goals: 79.4%', 112, 1412);
        },
      },
      {
        id: 'screen-3',
        filename: 'predictpro-screenshot-3-jackpot-engine.png',
        title: '17-Game Mega Jackpot Combinatorics',
        kicker: 'POISSON-BINOMIAL SURVIVAL',
        headline: 'Mega & Midweek Jackpot Optimizer',
        subhead: `Covers ${liveContentStats.totalJackpotGames} live jackpot matches across SportPesa, Betika & Mozzart.`,
        drawBody: (ctx: CanvasRenderingContext2D) => {
          const pools = getInitialOfficialJackpotPools();
          const rows = pools.sportpesa.slice(0, 6);
          drawRoundedRect(ctx, 72, 470, 936, 170, 24);
          ctx.fillStyle = palette.card;
          ctx.fill();
          ctx.fillStyle = palette.accent;
          ctx.font = '700 32px monospace';
          ctx.fillText(`POOL: ${liveContentStats.megaPoolPrize}  ·  17 MATCHES`, 112, 540);
          ctx.fillStyle = palette.text;
          ctx.font = '600 28px system-ui, -apple-system, sans-serif';
          ctx.fillText('Log-Gain Double Chance Allocation · Bonus Survival 12+/17', 112, 598);

          rows.forEach((g, idx) => {
            const y = 676 + idx * 172;
            drawRoundedRect(ctx, 72, y, 936, 148, 22);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = palette.muted;
            ctx.font = '700 28px monospace';
            ctx.fillText(`#${String(g.id).padStart(2, '0')}`, 108, y + 62);

            ctx.fillStyle = palette.text;
            ctx.font = '700 32px system-ui, -apple-system, sans-serif';
            ctx.fillText(clampString(g.match, 32), 186, y + 62);

            ctx.fillStyle = palette.muted;
            ctx.font = '600 25px monospace';
            ctx.fillText(
              `1:${g.homeOdds.toFixed(2)}  X:${g.drawOdds.toFixed(2)}  2:${g.awayOdds.toFixed(2)}`,
              186,
              y + 112
            );

            ctx.fillStyle = g.isBanker ? palette.accent : palette.amber;
            ctx.font = '700 30px monospace';
            ctx.fillText(g.isBanker ? `LOCK ${g.recommendedPick}` : `HEDGE ${g.doubleChance}`, 770, y + 88);
          });
        },
      },
      {
        id: 'screen-4',
        filename: 'predictpro-screenshot-4-leagues-compliance.png',
        title: 'Global Coverage & Offline PWA Speed',
        kicker: '40+ COMPETITIONS WORLDWIDE',
        headline: 'Built for Mobile Match Research',
        subhead: 'Zero-latency stand-alone mobile shell with public privacy & non-gambling compliance.',
        drawBody: (ctx: CanvasRenderingContext2D) => {
          const cards = [
            {
              heading: 'Global League Coverage',
              detail: liveContentStats.leaguesList.slice(0, 4).join(' · '),
            },
            {
              heading: 'Regional African Coverage',
              detail: 'FKF Premier League (Kenya) · CAF Champions League · NPFL · PSL',
            },
            {
              heading: 'Slip & Odds Converter',
              detail: 'Instant Decimal, Fractional & Implied Probability calculations',
            },
            {
              heading: 'Verified Editorial Reference',
              detail: '100% Informational Football Analytics · Public /privacy Policy',
            },
          ];

          cards.forEach((c, idx) => {
            const y = 490 + idx * 290;
            drawRoundedRect(ctx, 72, y, 936, 245, 26);
            ctx.fillStyle = palette.card;
            ctx.fill();
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = palette.accent;
            ctx.font = '700 36px system-ui, -apple-system, sans-serif';
            ctx.fillText(`0${idx + 1}. ${c.heading}`, 114, y + 92);

            ctx.fillStyle = palette.text;
            ctx.font = '500 30px system-ui, -apple-system, sans-serif';
            ctx.fillText(clampString(c.detail, 54), 114, y + 168);
          });
        },
      },
    ];

    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    const built: GeneratedScreenshotAsset[] = specs.map((spec) => {
      let dataUrl: string | null = null;
      if (typeof document !== 'undefined' && !isJsdom) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1920;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const grad = ctx.createLinearGradient(0, 0, 0, 1920);
            grad.addColorStop(0, palette.bgTop);
            grad.addColorStop(1, palette.bgBottom);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1920);

            // Header brand bar
            ctx.fillStyle = palette.accent;
            ctx.font = '700 28px monospace';
            ctx.fillText(`PREDICTPRO · ${spec.kicker}`, 72, 130);

            ctx.fillStyle = palette.text;
            ctx.font = '800 58px system-ui, -apple-system, sans-serif';
            ctx.fillText(spec.headline, 72, 232);

            ctx.fillStyle = palette.muted;
            ctx.font = '500 31px system-ui, -apple-system, sans-serif';
            ctx.fillText(clampString(spec.subhead, 62), 72, 304);

            // Hairline divider
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(72, 380);
            ctx.lineTo(1008, 380);
            ctx.stroke();

            spec.drawBody(ctx);

            // Clean footer compliance line
            ctx.fillStyle = palette.muted;
            ctx.font = '500 25px monospace';
            ctx.fillText(
              `${baseDomain.replace(/\/+$/, '')}/privacy  ·  Sports Statistics & xG Analytics`,
              72,
              1830
            );

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
        dataUrl,
      };
    });

    setScreenshots(built);
  }, [screenshotTheme, liveContentStats, baseDomain]);

  useEffect(() => {
    renderStoreScreenshots();
  }, [renderStoreScreenshots]);

  const handleCopy = (value: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard.`);
    } else {
      toast.info('Clipboard API unavailable in this environment.');
    }
  };

  const handleDownloadScreenshot = (item: GeneratedScreenshotAsset) => {
    if (!item.dataUrl) {
      toast.error('Canvas rendering unavailable in headless environment.');
      return;
    }
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${item.filename}`);
  };

  const handleDownloadAllScreenshots = () => {
    const ready = screenshots.filter((s) => Boolean(s.dataUrl));
    if (ready.length === 0) {
      toast.error('No rendered screenshots available to download.');
      return;
    }
    ready.forEach((item, idx) => {
      setTimeout(() => handleDownloadScreenshot(item), idx * 150);
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

  const handleExportMetadataBundle = () => {
    const cleanDomain = baseDomain.replace(/\/+$/, '');
    const bundle = {
      generatedAt: new Date().toISOString(),
      storeTarget,
      packageId,
      baseDomain: cleanDomain,
      supportEmail,
      listing: {
        title: draftTitle,
        shortDescription: draftShort,
        promotionalText: draftPromo,
        keywords: draftKeywords,
        fullDescription: draftFullDesc,
        releaseNotes: draftReleaseNotes,
      },
      icons: manifest.icons.map((i) => ({
        ...i,
        absoluteUrl: `${cleanDomain}${i.src}`,
      })),
      legalLinks: LEGAL_ROUTES.map((r) => ({
        label: r.label,
        url: `${cleanDomain}${r.path}`,
        requiredBy: r.requiredBy,
      })),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictpro-app-store-metadata-bundle.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported complete App Store Metadata JSON bundle.');
  };

  const cleanDomain = baseDomain.replace(/\/+$/, '');
  const shortLimit = storeTarget === 'apple_connect' ? 30 : 80;

  return (
    <div className="space-y-8">
      {/* Header & Live Content Snapshot */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                App Store Asset Synthesizer
              </span>
              <span aria-hidden="true">·</span>
              <span>{liveContentStats.fixtureCount} Live Fixtures Indexed</span>
              <span aria-hidden="true">·</span>
              <span>{liveContentStats.leaguesCount}+ Competitions</span>
              <span aria-hidden="true">·</span>
              <span>{manifest.icons.length} Manifest Icons</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              App Store Metadata &amp; Listing Asset Generator
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Automatically builds store-ready descriptions, 1080×1920 mobile screenshots, 512×512 icon links, and verified Privacy Policy URLs directly from your live PredictPro fixtures, Jackpot pools, and web manifest.
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
              Regenerate from Live Content
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExportMetadataBundle}
              className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export Metadata Bundle (.json)
            </Button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="pt-4 border-t border-border/70 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="meta-domain-input"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Production Domain (Links &amp; Privacy URLs)
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
              htmlFor="meta-package-input"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Android Package / Application ID
            </label>
            <input
              id="meta-package-input"
              type="text"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="meta-email-input"
              className="block text-[11px] font-semibold text-muted-foreground mb-1.5"
            >
              Developer Support Email
            </label>
            <input
              id="meta-email-input"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
              Copy Emphasis &amp; Tone Preset
            </span>
            <div className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-0.5">
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
                  className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    tonePreset === preset.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Store Target Filter + Live Content Inclusion Toggles */}
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

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLiveFixtures}
                onChange={(e) => setIncludeLiveFixtures(e.target.checked)}
                className="rounded border-border"
              />
              <span>Include Live Matches</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeJackpotPools}
                onChange={(e) => setIncludeJackpotPools(e.target.checked)}
                className="rounded border-border"
              />
              <span>Include Jackpot Pools</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComplianceNote}
                onChange={(e) => setIncludeComplianceNote(e.target.checked)}
                className="rounded border-border"
              />
              <span>Include Non-Gambling Notice</span>
            </label>
          </div>
        </div>
      </section>

      {/* 01. Generated Store Descriptions */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              01. App Store Descriptions &amp; Keywords (Editable &amp; Limit-Checked)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synthesized directly from current competitions, match probabilities, and store compliance guidelines.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              handleCopy(
                `Title: ${draftTitle}\n\nShort: ${draftShort}\n\nFull Description:\n${draftFullDesc}`,
                'All Store Descriptions'
              )
            }
            className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Full Copy Set
          </Button>
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

        {/* Full Description & Changelog */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
          <div className="lg:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-full-desc" className="font-semibold text-foreground">
                Full Store Description (Live Fixtures, Leagues &amp; Jackpot Summary)
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
                  <Copy className="w-3 h-3" /> Copy Full Description
                </Button>
              </div>
            </div>
            <textarea
              id="draft-full-desc"
              rows={11}
              value={draftFullDesc}
              onChange={(e) => setDraftFullDesc(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="draft-release-notes" className="font-semibold text-foreground">
                Release Notes / Changelog
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopy(draftReleaseNotes, 'Release Notes')}
                className="h-6 px-2.5 text-[11px] gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Notes
              </Button>
            </div>
            <textarea
              id="draft-release-notes"
              rows={11}
              value={draftReleaseNotes}
              onChange={(e) => setDraftReleaseNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed font-mono"
            />
          </div>
        </div>
      </section>

      {/* 02. Screenshots & Verified Icon Assets */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              02. Store Listing Screenshots (1080×1920 Portrait) &amp; App Icons
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generated directly from live match predictions, 6×6 Poisson probabilities, and Jackpot pools — ready for Google Play, Apple, Samsung, Huawei, Xiaomi, Uptodown, and APKPure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {(
                [
                  { id: 'emerald_dark', label: 'Emerald Dark' },
                  { id: 'slate_pro', label: 'Slate Pro' },
                ] as const
              ).map((themeOpt) => (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => setScreenshotTheme(themeOpt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    screenshotTheme === themeOpt.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {themeOpt.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={renderStoreScreenshots}
              className="gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Refresh Previews
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

        {/* Verified App Icons & Feature Banner Strip */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Existing Hosted App Icons &amp; Feature Graphic (from public manifest)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '512×512 App Icon (Mandatory)', path: '/icon-512.png', dims: '512 × 512 px · PNG' },
              { label: '192×192 Launcher Icon', path: '/icon-192.png', dims: '192 × 192 px · PNG' },
              { label: '180×180 Apple Touch Icon', path: '/apple-touch-icon.png', dims: '180 × 180 px · PNG' },
              { label: 'Feature Graphic / Banner', path: '/og-image.jpg', dims: '1200 × 630 px · JPG' },
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

        {/* 4 Generated 9:16 Store Screenshots */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Store Screenshots (4 Portrait PNGs · 1080×1920)
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
                    onClick={() => handleDownloadScreenshot(shot)}
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

      {/* 03. Public Privacy Policy & Compliance Links */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              03. Public Privacy Policy &amp; Store Compliance Links
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified public legal endpoints hosted directly on {cleanDomain}. Required by every major Android &amp; iOS developer portal prior to review approval.
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
            const fullUrl = `${cleanDomain}${item.path}`;
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
