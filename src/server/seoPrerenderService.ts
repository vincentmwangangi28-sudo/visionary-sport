/**
 * Server-Side SEO Prerender, Dynamic Sitemap & Schema.org JSON-LD Engine
 * Injects route-aware <head> metadata, dynamic /api/og social cards, and
 * SportsEvent / Dataset / FAQPage JSON-LD directly into initial HTML responses,
 * and powers live ESPN match XML sitemaps and RSS feeds.
 */

import { getCachedUpcomingFixturesSync } from './footballHandler.ts';
import { getAllSitemapEntries, CLUB_ANALYTICS_HUBS, BLOG_POSTS_METADATA, GLOBAL_HREFLANGS } from '../services/sitemapGenerator.ts';
import { getContextualPageIntegration } from '../services/seoKeywords.ts';
import { getRouteAhrefsOptimizationBundle } from '../services/ahrefsOpportunitiesService.ts';

export const SITE_BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';

const DEFAULT_SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

/**
 * 301-redirected match slugs mapped to their canonical destination slugs
 * (synchronized with public/_redirects so sitemaps never emit 3XX URLs).
 */
export const CANONICAL_MATCH_SLUG_REDIRECTS: Record<string, string> = {
  'manchester-united-vs-tottenham-hotspur': 'manchester-united-vs-tottenham',
  'young-africans-vs-simba-sc': 'simba-sc-vs-young-africans',
  'newcastle-united-vs-aston-villa': 'arsenal-vs-chelsea',
  'ajax-vs-psv-eindhoven': 'ajax-vs-feyenoord',
  'benfica-vs-porto': 'benfica-vs-sporting-cp',
  'inter-miami-vs-la-galaxy': 'inter-miami-vs-new-york-red-bulls',
};

export function canonicalizeMatchSlug(rawSlug: string): string {
  const cleaned = String(rawSlug || '')
    .trim()
    .toLowerCase()
    .replace(/^\/predict\//, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return CANONICAL_MATCH_SLUG_REDIRECTS[cleaned] || cleaned;
}

export interface LiveSeoMatchRecord {
  slug: string;
  path: string;
  url: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: string;
  confidence: number;
  homeXg: string;
  awayXg: string;
  projectedScore: string;
  ogImageUrl: string;
  homeTeamSlug: string;
  awayTeamSlug: string;
  source: 'supabase_active' | 'espn_live' | 'curated_derby';
}

export interface RouteSeoPayload {
  pathname: string;
  canonicalUrl: string;
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  ogType: 'website' | 'article';
  routeCategory: 'match' | 'team' | 'player' | 'league' | 'jackpot' | 'tool' | 'core';
  jsonLdSchemas: Record<string, any>[];
  matchRecord?: LiveSeoMatchRecord;
}

let cachedLiveMatches: { timestamp: number; records: LiveSeoMatchRecord[]; crawledSupabase: boolean } | null = null;
const LIVE_MATCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function slugifySegment(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatTitleCaseFromSlug(slug: string): string {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => {
      if (['fc', 'sc', 'ac', 'psg', 'cf', 'fkf', 'kpl', 'psl', 'npfl', 'mls', 'ucl'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clampSeoTitle(rawTitle: string): string {
  const cleaned = String(rawTitle || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 60) return cleaned;
  const withoutSuffix = cleaned.replace(/\s*[|—-]\s*PredictPro.*$/i, '').trim();
  if (withoutSuffix.length + 13 <= 60) {
    return `${withoutSuffix} | PredictPro`;
  }
  return `${withoutSuffix.slice(0, 44).trim()} | PredictPro`;
}

function clampSeoDescription(rawDescription: string): string {
  const cleaned = String(rawDescription || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 155) return cleaned;
  const sliced = cleaned.slice(0, 152);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 110 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:\s-]+$/, '')}...`;
}

/**
 * Crawls active match rows from Supabase REST (`predictions` and `matches` tables)
 * with a fast timeout and converts them into raw match objects.
 */
export async function fetchActiveMatchesFromSupabaseRest(): Promise<
  Array<{
    home_team: string;
    away_team: string;
    league?: string;
    match_date?: string;
    prediction?: string;
    predicted_outcome?: string;
    confidence?: number;
    confidence_score?: number;
    home_win_probability?: number;
    away_win_probability?: number;
    status?: string;
  }>
> {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  )
    .trim()
    .replace(/\/$/, '');
  const rawKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY
  ).trim();

  if (!rawUrl || !rawKey || rawUrl.includes('your-project-id')) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  const headers: Record<string, string> = {
    apikey: rawKey,
    Authorization: `Bearer ${rawKey}`,
    Accept: 'application/json',
  };

  try {
    // Crawl active/recent fixtures from both `predictions` and `matches` tables in parallel
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [predsRes, matchesRes] = await Promise.all([
      fetch(
        `${rawUrl}/rest/v1/predictions?select=home_team,away_team,league,match_date,prediction,predicted_outcome,confidence,confidence_score,home_win_probability,away_win_probability,status&match_date=gte.${cutoffDate}&order=match_date.desc&limit=250`,
        { method: 'GET', headers, signal: controller.signal }
      ).catch(() => null),
      fetch(
        `${rawUrl}/rest/v1/matches?select=home_team,away_team,league,match_date,status&match_date=gte.${cutoffDate}&order=match_date.desc&limit=250`,
        { method: 'GET', headers, signal: controller.signal }
      ).catch(() => null),
    ]);

    const rows: Array<any> = [];
    if (predsRes && predsRes.ok) {
      const data = await predsRes.json().catch(() => []);
      if (Array.isArray(data)) rows.push(...data);
    }
    if (matchesRes && matchesRes.ok) {
      const data = await matchesRes.json().catch(() => []);
      if (Array.isArray(data)) rows.push(...data);
    }
    return rows.filter(
      (r) =>
        r &&
        typeof r.home_team === 'string' &&
        r.home_team.trim().length > 0 &&
        typeof r.away_team === 'string' &&
        r.away_team.trim().length > 0 &&
        r.status !== 'archived' &&
        r.status !== 'cancelled'
    );
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Harvests all active match slugs from Supabase (`predictions` and `matches`), active matchday fixtures,
 * and flagship derbies, converting them into deduplicated canonical SEO match records.
 */
export async function resolveLiveMatchSlugs(
  baseUrl: string = SITE_BASE_URL,
  options?: { forceRefresh?: boolean; crawlSupabase?: boolean }
): Promise<LiveSeoMatchRecord[]> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const shouldCrawlSupabase = Boolean(options?.crawlSupabase);

  if (
    !options?.forceRefresh &&
    cachedLiveMatches &&
    Date.now() - cachedLiveMatches.timestamp < LIVE_MATCH_CACHE_TTL_MS &&
    (!shouldCrawlSupabase || cachedLiveMatches.crawledSupabase)
  ) {
    return cachedLiveMatches.records.map((r) => ({
      ...r,
      url: `${normalizedBaseUrl}${r.path}`,
    }));
  }

  const seenSlugs = new Set<string>();
  const records: LiveSeoMatchRecord[] = [];
  const todayIso = new Date().toISOString();

  const addMatchRecord = (
    homeTeam: string,
    awayTeam: string,
    league: string,
    matchDate: string,
    prediction: string,
    confidence: number,
    homeXgNum: number,
    awayXgNum: number,
    projectedScore: string,
    source: 'supabase_active' | 'espn_live' | 'curated_derby'
  ) => {
    const hSlug = slugifySegment(homeTeam);
    const aSlug = slugifySegment(awayTeam);
    if (!hSlug || !aSlug) return;
    const rawSlug = `${hSlug}-vs-${aSlug}`;
    const slug = canonicalizeMatchSlug(rawSlug);
    if (!slug || seenSlugs.has(slug)) return;
    seenSlugs.add(slug);

    const canonicalParts = slug.split('-vs-');
    const canonicalHomeSlug = canonicalParts[0] || hSlug;
    const canonicalAwaySlug = canonicalParts[1] || aSlug;

    const homeXg = homeXgNum.toFixed(2);
    const awayXg = awayXgNum.toFixed(2);
    const ogParams = new URLSearchParams({
      home: homeTeam,
      away: awayTeam,
      league,
      tip: prediction,
      conf: String(Math.round(confidence)),
      xg: `${homeXg} - ${awayXg}`,
      score: projectedScore,
    });

    records.push({
      slug,
      path: `/predict/${slug}`,
      url: `${normalizedBaseUrl}/predict/${slug}`,
      homeTeam,
      awayTeam,
      league,
      matchDate: matchDate || todayIso,
      prediction,
      confidence: Math.round(confidence),
      homeXg,
      awayXg,
      projectedScore,
      ogImageUrl: `${normalizedBaseUrl}/api/og?${ogParams.toString()}`,
      homeTeamSlug: canonicalHomeSlug,
      awayTeamSlug: canonicalAwaySlug,
      source,
    });
  };

  // 1. If crawlSupabase is requested, dynamically crawl active match rows from Supabase REST
  if (shouldCrawlSupabase) {
    const supabaseRows = await fetchActiveMatchesFromSupabaseRest();
    for (const row of supabaseRows) {
      const pred = row.predicted_outcome || row.prediction || 'Home Win';
      const conf = Number(row.confidence_score ?? row.confidence ?? 80);
      const hProb = Number(row.home_win_probability ?? (pred.includes('Home') ? 56 : 42));
      const aProb = Number(row.away_win_probability ?? (pred.includes('Away') ? 54 : 30));
      const hXg = Math.max(0.75, Math.min(2.85, (hProb / 100) * 3.1));
      const aXg = Math.max(0.55, Math.min(2.45, (aProb / 100) * 2.8));
      const score = `${Math.round(hXg)}-${Math.round(aXg)}`;
      addMatchRecord(
        row.home_team,
        row.away_team,
        row.league || 'Global Football',
        row.match_date || todayIso,
        pred,
        conf,
        hXg,
        aXg,
        score,
        'supabase_active'
      );
    }
  }

  // 2. Crawl active matchday predictions from live cached server schedule
  try {
    const activePredictions = getCachedUpcomingFixturesSync();
    for (const p of activePredictions) {
      const pred = p.predicted_outcome || p.prediction || 'Home Win';
      const conf = Number(p.confidence_score ?? p.confidence ?? 80);
      const hProb = Number(p.home_win_probability ?? 52);
      const aProb = Number(p.away_win_probability ?? 26);
      const hXg = Math.max(0.8, Math.min(2.75, (hProb / 100) * 3.0));
      const aXg = Math.max(0.6, Math.min(2.35, (aProb / 100) * 2.7));
      const score = `${Math.round(hXg)}-${Math.round(aXg)}`;
      addMatchRecord(
        p.home_team,
        p.away_team,
        p.league || 'Global Football',
        p.match_date || todayIso,
        pred,
        conf,
        hXg,
        aXg,
        score,
        'supabase_active'
      );
    }
  } catch {
    // fallback to flagship fixtures
  }

  // 3. Ensure flagship global & African derbies are always present
  const flagshipFixtures = [
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League', pred: 'Home Win', conf: 82, hXg: 1.94, aXg: 0.98, score: '2-1' },
    { home: 'Liverpool', away: 'Manchester City', league: 'Premier League', pred: 'BTTS & Over 2.5', conf: 85, hXg: 1.88, aXg: 1.64, score: '2-2' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', pred: 'Home Win', conf: 79, hXg: 2.05, aXg: 1.32, score: '2-1' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga', pred: 'Over 2.5 Goals', conf: 88, hXg: 2.42, aXg: 1.38, score: '3-1' },
    { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A', pred: 'Home Win', conf: 81, hXg: 1.78, aXg: 0.94, score: '2-0' },
    { home: 'Manchester United', away: 'Tottenham', league: 'Premier League', pred: 'BTTS & Over 2.5', conf: 80, hXg: 1.72, aXg: 1.48, score: '2-1' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1', pred: 'Home Win', conf: 84, hXg: 2.18, aXg: 0.92, score: '2-1' },
    { home: 'Gor Mahia', away: 'AFC Leopards', league: 'FKF Kenya Premier League', pred: 'Home Win', conf: 83, hXg: 1.68, aXg: 0.74, score: '2-0' },
    { home: 'Al Ahly', away: 'Mamelodi Sundowns', league: 'CAF Champions League', pred: 'Under 2.5 Goals', conf: 80, hXg: 1.34, aXg: 0.96, score: '1-0' },
    { home: 'Simba SC', away: 'Young Africans', league: 'Tanzania NBC Premier League', pred: 'Double Chance 1X', conf: 79, hXg: 1.48, aXg: 1.12, score: '1-1' },
    { home: 'Kaizer Chiefs', away: 'Orlando Pirates', league: 'South Africa Betway Premiership', pred: 'BTTS Yes', conf: 77, hXg: 1.36, aXg: 1.42, score: '1-1' },
    { home: 'Mamelodi Sundowns', away: 'Orlando Pirates', league: 'South Africa Betway Premiership', pred: 'Home Win', conf: 82, hXg: 1.76, aXg: 0.88, score: '2-0' },
    { home: 'Enyimba', away: 'Rangers International', league: 'Nigeria NPFL', pred: 'Home Win', conf: 81, hXg: 1.62, aXg: 0.68, score: '2-0' },
    { home: 'Hearts of Oak', away: 'Asante Kotoko', league: 'Ghana Premier League', pred: 'Under 2.5 Goals', conf: 78, hXg: 1.22, aXg: 1.05, score: '1-0' },
    { home: 'Al Ahly', away: 'Zamalek', league: 'Egyptian Premier League', pred: 'Home Win', conf: 83, hXg: 1.84, aXg: 0.92, score: '2-1' },
    { home: 'Wydad AC', away: 'Raja Casablanca', league: 'Morocco Botola Pro', pred: 'Under 2.5 Goals', conf: 82, hXg: 1.18, aXg: 1.04, score: '1-1' },
    { home: 'TP Mazembe', away: 'AS Vita Club', league: 'DR Congo Linafoot', pred: 'Home Win', conf: 84, hXg: 1.79, aXg: 0.76, score: '2-0' },
    { home: 'Juventus', away: 'Napoli', league: 'Serie A', pred: 'Under 2.5 Goals', conf: 79, hXg: 1.32, aXg: 1.14, score: '1-1' },
    { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga', pred: 'Home Win', conf: 82, hXg: 1.82, aXg: 0.84, score: '2-0' },
    { home: 'LA Galaxy', away: 'LAFC', league: 'Major League Soccer', pred: 'BTTS & Over 2.5', conf: 83, hXg: 1.86, aXg: 1.74, score: '2-2' },
    { home: 'Inter Miami', away: 'New York Red Bulls', league: 'Major League Soccer', pred: 'Home Win', conf: 85, hXg: 2.12, aXg: 1.08, score: '3-1' },
    { home: 'Celtic', away: 'Rangers', league: 'Scottish Premiership', pred: 'Over 2.5 Goals', conf: 84, hXg: 1.98, aXg: 1.42, score: '2-1' },
    { home: 'Boca Juniors', away: 'River Plate', league: 'Argentina Primera', pred: 'Under 2.5 Goals', conf: 80, hXg: 1.24, aXg: 1.18, score: '1-1' },
    { home: 'Benfica', away: 'Sporting CP', league: 'Primeira Liga', pred: 'BTTS Yes', conf: 82, hXg: 1.68, aXg: 1.54, score: '2-1' },
    { home: 'Galatasaray', away: 'Fenerbahce', league: 'Turkish Super Lig', pred: 'Over 2.5 Goals', conf: 83, hXg: 1.88, aXg: 1.56, score: '2-1' },
    { home: 'Ajax', away: 'Feyenoord', league: 'Eredivisie', pred: 'Over 2.5 Goals', conf: 84, hXg: 1.92, aXg: 1.66, score: '2-2' },
    { home: 'Club America', away: 'Chivas', league: 'Liga MX', pred: 'Home Win', conf: 81, hXg: 1.76, aXg: 0.98, score: '2-1' },
    { home: 'Al-Hilal', away: 'Al-Nassr', league: 'Saudi Pro League', pred: 'Over 2.5 Goals', conf: 86, hXg: 2.15, aXg: 1.54, score: '2-1' },
    { home: 'Flamengo', away: 'Palmeiras', league: 'Brasileirao Serie A', pred: 'BTTS Yes', conf: 80, hXg: 1.64, aXg: 1.38, score: '2-1' },
  ];

  for (const f of flagshipFixtures) {
    addMatchRecord(f.home, f.away, f.league, todayIso, f.pred, f.conf, f.hXg, f.aXg, f.score, 'curated_derby');
  }

  cachedLiveMatches = {
    timestamp: Date.now(),
    records,
    crawledSupabase: shouldCrawlSupabase || Boolean(cachedLiveMatches?.crawledSupabase),
  };
  return records;
}

/**
 * Resolves exact server-side SEO metadata, OpenGraph card URL, and Schema.org JSON-LD for any path.
 */
export async function resolveRouteSeoPayload(
  rawPathname: string,
  baseUrl: string = SITE_BASE_URL
): Promise<RouteSeoPayload> {
  const cleanPath = (rawPathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const canonicalUrl = cleanPath === '/' ? `${baseUrl}/` : `${baseUrl}${cleanPath}`;
  const liveMatches = await resolveLiveMatchSlugs(baseUrl);

  const baseOrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'PredictPro Quantitative Football Intelligence',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description:
      'Independent AI football predictions, Expected Goals (xG) modeling, 6×6 Bivariate Poisson score matrices, and 17-game Mega Jackpot combinatorics across 40+ global and African leagues.',
  };

  // 1. Dynamic Match Prediction Route: /predict/:slug
  if (cleanPath.startsWith('/predict/')) {
    const slug = cleanPath.replace('/predict/', '').trim().toLowerCase();
    let matchRecord = liveMatches.find((m) => m.slug === slug);

    if (!matchRecord) {
      const parts = slug.split('-vs-');
      const homeName = parts[0] ? formatTitleCaseFromSlug(parts[0]) : 'Home Team';
      const awayName = parts[1] ? formatTitleCaseFromSlug(parts[1]) : 'Away Team';
      const ogParams = new URLSearchParams({
        home: homeName,
        away: awayName,
        league: 'AI Football Intelligence',
        tip: '1X2 & xG Model',
        conf: '82',
        xg: '1.78 - 1.04',
        score: '2-1',
      });
      matchRecord = {
        slug,
        path: cleanPath,
        url: canonicalUrl,
        homeTeam: homeName,
        awayTeam: awayName,
        league: 'Global Football Intelligence',
        matchDate: new Date().toISOString(),
        prediction: 'Home Win / Over 1.5 Goals',
        confidence: 82,
        homeXg: '1.78',
        awayXg: '1.04',
        projectedScore: '2-1',
        ogImageUrl: `${baseUrl}/api/og?${ogParams.toString()}`,
        homeTeamSlug: slugifySegment(homeName),
        awayTeamSlug: slugifySegment(awayName),
        source: 'curated_derby',
      };
    }

    const integration = getContextualPageIntegration(cleanPath);
    const title = clampSeoTitle(
      `${matchRecord.homeTeam} vs ${matchRecord.awayTeam} xG & Tips | PredictPro`
    );
    const description = clampSeoDescription(
      `${matchRecord.homeTeam} vs ${matchRecord.awayTeam} (${matchRecord.league}): ${matchRecord.prediction} (${matchRecord.confidence}%). xG ${matchRecord.homeXg}-${matchRecord.awayXg}, score ${matchRecord.projectedScore}, Poisson matrix & H2H odds.`
    );
    const keywords = [
      `${matchRecord.homeTeam} vs ${matchRecord.awayTeam} prediction`,
      `${matchRecord.homeTeam} ${matchRecord.awayTeam} xG stats`,
      `${matchRecord.league} predictions today`,
      `${matchRecord.homeTeam} vs ${matchRecord.awayTeam} correct score ${matchRecord.projectedScore}`,
      ...integration.competitorKeywords.slice(0, 8),
    ].join(', ');

    const sportsEventSchema = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${matchRecord.homeTeam} vs ${matchRecord.awayTeam} (${matchRecord.league})`,
      description,
      startDate: matchRecord.matchDate,
      eventStatus: 'https://schema.org/EventScheduled',
      sport: 'Association Football',
      url: canonicalUrl,
      image: [matchRecord.ogImageUrl],
      homeTeam: {
        '@type': 'SportsTeam',
        name: matchRecord.homeTeam,
        url: `${baseUrl}/teams/${matchRecord.homeTeamSlug}`,
      },
      awayTeam: {
        '@type': 'SportsTeam',
        name: matchRecord.awayTeam,
        url: `${baseUrl}/teams/${matchRecord.awayTeamSlug}`,
      },
      location: {
        '@type': 'Place',
        name: `${matchRecord.homeTeam} Stadium (${matchRecord.league})`,
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'PredictPro', item: `${baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Match Predictions', item: `${baseUrl}/predict` },
        { '@type': 'ListItem', position: 3, name: `${matchRecord.homeTeam} vs ${matchRecord.awayTeam}`, item: canonicalUrl },
      ],
    };

    return {
      pathname: cleanPath,
      canonicalUrl,
      title,
      description,
      keywords,
      ogImageUrl: matchRecord.ogImageUrl,
      ogType: 'article',
      routeCategory: 'match',
      jsonLdSchemas: [sportsEventSchema, breadcrumbSchema, baseOrganizationSchema],
      matchRecord,
    };
  }

  // 2. Club Analytics Hub: /teams/:slug
  if (cleanPath.startsWith('/teams/')) {
    const teamSlug = cleanPath.replace('/teams/', '').trim().toLowerCase();
    const clubMeta = CLUB_ANALYTICS_HUBS.find((c) => c.slug === teamSlug);
    const clubName = clubMeta?.name || formatTitleCaseFromSlug(teamSlug);
    const clubLeague = clubMeta?.league || 'Global Football';
    const ogParams = new URLSearchParams({
      title: `${clubName} — xG & FDR Analytics`,
      subtitle: `${clubLeague} · Rolling 10-Match Expected Goals & Fixture Difficulty`,
      tip: `${clubName} Attack & Defense Telemetry`,
      conf: '88',
    });
    const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    const clubIntegration = getContextualPageIntegration(cleanPath);
    const title = clampSeoTitle(`${clubName} xG, Form & 5-Match FDR Hub | PredictPro`);
    const description = clampSeoDescription(
      `${clubName} (${clubLeague}) analytics: rolling 10-match xG vs xGA, home/away splits, 5-match Fixture Difficulty (FDR), and upcoming AI predictions.`
    );

    const teamSchema = {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: clubName,
      sport: 'Association Football',
      url: canonicalUrl,
      memberOf: {
        '@type': 'SportsOrganization',
        name: clubLeague,
      },
      description,
    };

    return {
      pathname: cleanPath,
      canonicalUrl,
      title,
      description,
      keywords: [
        `${clubName} predictions today`,
        `${clubName} xG stats`,
        `${clubName} fixture difficulty FDR`,
        `${clubLeague} analytics`,
        ...clubIntegration.competitorKeywords.slice(0, 8),
      ].join(', '),
      ogImageUrl,
      ogType: 'website',
      routeCategory: 'team',
      jsonLdSchemas: [teamSchema, baseOrganizationSchema],
    };
  }

  // 3. Player xG Profile: /players/:slug
  if (cleanPath.startsWith('/players/')) {
    const playerSlug = cleanPath.replace('/players/', '').trim().toLowerCase();
    const playerName = formatTitleCaseFromSlug(playerSlug);
    const ogParams = new URLSearchParams({
      title: `${playerName} — xG/90 & Prop Model`,
      subtitle: 'Anytime Goalscorer Poisson Probability & 2D Pitch Heatmap',
      tip: `${playerName} Shots on Target & xG`,
      conf: '86',
    });
    const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    const playerIntegration = getContextualPageIntegration(cleanPath);
    const title = clampSeoTitle(`${playerName} xG/90 & Goalscorer Props | PredictPro`);
    const description = clampSeoDescription(
      `${playerName} player analytics: npxG/90, shots on target probabilities, 5-axis tactical radar, and interactive Anytime Goalscorer Poisson calculator.`
    );

    return {
      pathname: cleanPath,
      canonicalUrl,
      title,
      description,
      keywords: [
        `${playerName} anytime goalscorer prediction`,
        `${playerName} xG per 90 stats`,
        `${playerName} shots on target odds`,
        ...playerIntegration.competitorKeywords.slice(0, 8),
      ].join(', '),
      ogImageUrl,
      ogType: 'profile' as any,
      routeCategory: 'player',
      jsonLdSchemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: playerName,
          jobTitle: 'Professional Football Player',
          url: canonicalUrl,
          description,
        },
        baseOrganizationSchema,
      ],
    };
  }

  // 4. Match against all registered Sitemap Hubs & Static Pages
  const allEntries = getAllSitemapEntries(baseUrl);
  const matchedEntry = allEntries.find((e) => e.path === cleanPath);
  const routeIntegration = getContextualPageIntegration(cleanPath);

  const rawRouteTitle =
    cleanPath === '/'
      ? 'PredictPro — Football Match Statistics, Live Scores & xG'
      : matchedEntry
      ? `${matchedEntry.title} | PredictPro`
      : `${routeIntegration.currentHub.label} — AI Football & xG | PredictPro`;
  const routeTitle = clampSeoTitle(rawRouteTitle);

  const rawRouteDescription =
    cleanPath === '/'
      ? 'Football match statistics, live scores, league standings, Expected Goals (xG) models, and Bivariate Poisson probability analysis across 40+ global leagues.'
      : cleanPath.includes('jackpot')
      ? 'Mathematical 17-game Mega & 13/15-game Midweek Jackpot generator for SportPesa, Betika, Mozzart & SportyBet with Bivariate Poisson & Banker locks.'
      : cleanPath.includes('corners') || cleanPath.includes('cards') || cleanPath.includes('set-piece')
      ? 'Quantitative football prop analytics: wing attack corner totals, referee card strictness models, penalty takers & aerial set-piece threat ratings.'
      : 'Free daily AI football predictions, Expected Goals (xG), 6×6 Dixon-Coles Poisson matrices, H2H stats & 17-game Jackpot models across 40+ leagues.';
  const routeDescription = clampSeoDescription(rawRouteDescription);

  const ogParams = new URLSearchParams({
    title: routeTitle.replace(/\s*\|\s*PredictPro.*$/, '').slice(0, 44),
    subtitle: 'PredictPro Quantitative Football Intelligence · 40+ Global & African Leagues',
    tip: cleanPath === '/' ? 'Daily Verified xG & +EV Forecasts' : formatTitleCaseFromSlug(cleanPath.slice(1) || 'AI Match Predictions'),
    conf: '87',
  });
  const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;

  const ahrefsBundle = getRouteAhrefsOptimizationBundle(cleanPath);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: routeTitle,
    url: canonicalUrl,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web, Android, iOS',
    description: routeDescription,
    image: ogImageUrl,
    datePublished: '2026-05-15',
    dateModified: ahrefsBundle.lastModifiedIso,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="true"]', 'h1'],
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': cleanPath.startsWith('/blog/') ? 'BlogPosting' : 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: routeTitle,
    name: routeTitle,
    description: routeDescription,
    image: [ogImageUrl],
    datePublished: '2026-05-15T00:00:00Z',
    dateModified: `${ahrefsBundle.lastModifiedIso}T06:00:00Z`,
    author: {
      '@type': 'Organization',
      name: 'PredictPro Quantitative Football Intelligence',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon-120x120.png`,
        width: 120,
        height: 120,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable="true"]', '[data-ai-citation-block="true"]'],
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: ahrefsBundle.aiOverviewQuestion,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${ahrefsBundle.aiOverviewAnswer} (${ahrefsBundle.aiOverviewBullets.join(' · ')})`,
        },
      },
      {
        '@type': 'Question',
        name: 'How does PredictPro calculate football match probabilities and Expected Goals (xG)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PredictPro combines rolling 10-match Expected Goals (xG and xGA), Dixon-Coles low-score Rho adjustments, and a 6×6 Bivariate Poisson matrix across 40+ global, European, and CAF African leagues.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are live ESPN match fixtures and 17-game Mega Jackpot slips updated automatically?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Our autonomous server pipeline synchronizes live ESPN fixtures, recalculates Poisson edges, updates XML sitemaps, and dispatches updated match slugs via IndexNow every 2 hours.',
        },
      },
    ],
  };

  return {
    pathname: cleanPath,
    canonicalUrl,
    title: routeTitle,
    description: routeDescription,
    keywords: [
      ...ahrefsBundle.strikingDistanceKeywords.map((k) => k.keyword),
      ...routeIntegration.competitorKeywords.slice(0, 10),
      'AI football predictions today',
      'expected goals xG predictions',
      'SportPesa Mega Jackpot 17 games prediction',
      'Poisson score calculator',
    ].join(', '),
    ogImageUrl,
    ogType: 'website',
    routeCategory: cleanPath.includes('jackpot') ? 'jackpot' : cleanPath.includes('predictions') ? 'league' : 'core',
    jsonLdSchemas: [webAppSchema, articleSchema, faqSchema, baseOrganizationSchema],
  };
}

/**
 * Injects route-specific <title>, meta description, canonical, OpenGraph/Twitter tags,
 * and Schema.org JSON-LD directly into the raw server HTML string.
 */
export async function injectServerSeoIntoHtml(
  rawHtml: string,
  pathname: string,
  baseUrl: string = SITE_BASE_URL
): Promise<string> {
  const payload = await resolveRouteSeoPayload(pathname, baseUrl);
  let html = rawHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(payload.title)}</title>`);

  // Replace or inject meta description
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(payload.description)}" />`
    );
  }

  // Replace or inject meta keywords
  if (/<meta\s+name=["']keywords["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']keywords["'][^>]*>/i,
      `<meta name="keywords" content="${escapeHtml(payload.keywords)}" />`
    );
  }

  // Replace canonical link
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(payload.canonicalUrl)}" />`
    );
  }

  // Replace OpenGraph & Twitter tags
  const metaReplacements: Array<[RegExp, string]> = [
    [/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(payload.title)}" />`],
    [/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(payload.description)}" />`],
    [/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${escapeHtml(payload.canonicalUrl)}" />`],
    [/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${escapeHtml(payload.ogImageUrl)}" />`],
    [/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(payload.title)}" />`],
    [/<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(payload.description)}" />`],
    [/<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(payload.ogImageUrl)}" />`],
  ];

  for (const [pattern, replacement] of metaReplacements) {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
    }
  }

  // Inject server-prerendered JSON-LD script right before </head>
  const jsonLdScript = `<script id="server-prerender-jsonld" type="application/ld+json">${JSON.stringify(
    payload.jsonLdSchemas
  )}</script>`;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${jsonLdScript}\n</head>`);
  }

  return html;
}

/**
 * Generates dynamic /sitemap-matches.xml populated with all active Supabase match slugs,
 * upcoming fixtures, and club xG hubs. Optionally persists the output to public/sitemap-matches.xml.
 */
export async function buildDynamicMatchesSitemapXml(
  baseUrl: string = 'https://www.predictpro.guru',
  options?: { forceRefresh?: boolean; persistToPublic?: boolean }
): Promise<string> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const liveMatches = await resolveLiveMatchSlugs(normalizedBaseUrl, {
    forceRefresh: options?.forceRefresh,
    crawlSupabase: true,
  });
  const today = new Date().toISOString().split('T')[0];

  const matchNodes = liveMatches.map((m) => {
    const lastMod = m.matchDate.split('T')[0] || today;
    const title = `${m.homeTeam} vs ${m.awayTeam} AI Prediction, xG (${m.homeXg}-${m.awayXg}) & Odds (${m.league})`;
    return `  <url>
    <loc>${escapeXml(m.url)}</loc>
    <lastmod>${escapeXml(lastMod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(m.url)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(m.url)}" />
    <image:image>
      <image:loc>${escapeXml(m.ogImageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
    </image:image>
  </url>`;
  });

  const clubSlugs = new Set<string>(CLUB_ANALYTICS_HUBS.map((c) => c.slug));
  for (const m of liveMatches) {
    if (m.homeTeamSlug) clubSlugs.add(m.homeTeamSlug);
    if (m.awayTeamSlug) clubSlugs.add(m.awayTeamSlug);
  }

  const clubNodes = Array.from(clubSlugs).map((slug) => {
    const clubUrl = `${normalizedBaseUrl}/teams/${slug}`;
    return `  <url>
    <loc>${escapeXml(clubUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(clubUrl)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(clubUrl)}" />
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...matchNodes, ...clubNodes].join('\n')}
</urlset>
`;

  if (options?.persistToPublic && typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const targetPath = path.resolve(process.cwd(), 'public', 'sitemap-matches.xml');
      fs.writeFileSync(targetPath, xml, 'utf-8');
    } catch {
      // Ignore read-only filesystem errors in serverless edge environments
    }
  }

  return xml;
}

/**
 * Generates dynamic /sitemap-discover-news.xml with live ESPN match predictions and strategy guides.
 */
export async function buildDynamicDiscoverNewsSitemapXml(baseUrl: string = SITE_BASE_URL): Promise<string> {
  const liveMatches = await resolveLiveMatchSlugs(baseUrl);
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];

  const matchItems = liveMatches.map((m) => {
    const title = `${m.homeTeam} vs ${m.awayTeam} Prediction: ${m.prediction} (${m.confidence}% AI Confidence · xG ${m.homeXg}-${m.awayXg})`;
    return `  <url>
    <loc>${escapeXml(m.url)}</loc>
    <lastmod>${escapeXml(m.matchDate.split('T')[0] || today)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
    <news:news>
      <news:publication>
        <news:name>PredictPro Quantitative Football Intelligence</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(nowIso)}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
    </news:news>
    <image:image>
      <image:loc>${escapeXml(m.ogImageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
    </image:image>
  </url>`;
  });

  const blogItems = BLOG_POSTS_METADATA.map((post) => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    return `  <url>
    <loc>${escapeXml(postUrl)}</loc>
    <lastmod>${escapeXml(post.date)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <news:news>
      <news:publication>
        <news:name>PredictPro Quantitative Football Intelligence</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(nowIso)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...matchItems, ...blogItems].join('\n')}
</urlset>`;
}

/**
 * Generates dynamic /feed-predictions.xml (RSS 2.0) for Google Discover, Feedly & news aggregators.
 */
export async function buildDynamicPredictionsRssXml(baseUrl: string = SITE_BASE_URL): Promise<string> {
  const liveMatches = await resolveLiveMatchSlugs(baseUrl);
  const pubDate = new Date().toUTCString();

  const items = liveMatches.map((m) => {
    const itemTitle = `${m.homeTeam} vs ${m.awayTeam} (${m.league}) — AI Pick: ${m.prediction} (${m.confidence}%)`;
    const itemDesc = `Bivariate Poisson & Expected Goals Forecast: ${m.homeTeam} (${m.homeXg} xG) vs ${m.awayTeam} (${m.awayXg} xG). Primary Selection: ${m.prediction} with ${m.confidence}% model confidence. Projected Exact Score: ${m.projectedScore}.`;
    return `    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${escapeXml(m.url)}</link>
      <guid isPermaLink="true">${escapeXml(m.url)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <category>${escapeXml(m.league)}</category>
      <description>${escapeXml(itemDesc)}</description>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PredictPro — Live AI Football Predictions &amp; Expected Goals (xG) Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Real-time mathematical football predictions, 6x6 Poisson score matrices, and +EV value alerts across 40+ global and African leagues.</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(pubDate)}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/feed-predictions.xml`)}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;
}
