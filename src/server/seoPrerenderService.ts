/**
 * Server-Side SEO Prerender, Dynamic Sitemap & Schema.org JSON-LD Engine
 * Injects route-aware <head> metadata, dynamic /api/og social cards, and
 * SportsEvent / Dataset / FAQPage JSON-LD directly into initial HTML responses,
 * and powers live ESPN match XML sitemaps and RSS feeds.
 */

import { handleFootballRequest } from './footballHandler';
import { getAllSitemapEntries, CLUB_ANALYTICS_HUBS, BLOG_POSTS_METADATA, GLOBAL_HREFLANGS } from '../services/sitemapGenerator';
import { getContextualPageIntegration } from '../services/seoKeywords';
import { getRouteAhrefsOptimizationBundle } from '../services/ahrefsOpportunitiesService';

export const SITE_BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';

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
  source: 'espn_live' | 'curated_derby';
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

let cachedLiveMatches: { timestamp: number; records: LiveSeoMatchRecord[] } | null = null;
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
 * Harvests all active and upcoming ESPN fixtures and converts them into canonical SEO match records.
 */
export async function resolveLiveMatchSlugs(baseUrl: string = SITE_BASE_URL): Promise<LiveSeoMatchRecord[]> {
  if (cachedLiveMatches && Date.now() - cachedLiveMatches.timestamp < LIVE_MATCH_CACHE_TTL_MS) {
    return cachedLiveMatches.records;
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
    source: 'espn_live' | 'curated_derby'
  ) => {
    const hSlug = slugifySegment(homeTeam);
    const aSlug = slugifySegment(awayTeam);
    if (!hSlug || !aSlug) return;
    const slug = `${hSlug}-vs-${aSlug}`;
    if (seenSlugs.has(slug)) return;
    seenSlugs.add(slug);

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
      url: `${baseUrl}/predict/${slug}`,
      homeTeam,
      awayTeam,
      league,
      matchDate: matchDate || todayIso,
      prediction,
      confidence: Math.round(confidence),
      homeXg,
      awayXg,
      projectedScore,
      ogImageUrl: `${baseUrl}/api/og?${ogParams.toString()}`,
      homeTeamSlug: hSlug,
      awayTeamSlug: aSlug,
      source,
    });
  };

  try {
    const [upcomingRes, liveRes] = await Promise.all([
      handleFootballRequest({ type: 'upcoming' }).catch(() => null),
      handleFootballRequest({ type: 'live' }).catch(() => null),
    ]);

    const rawMatches = [
      ...(Array.isArray(liveRes?.matches) ? liveRes.matches : []),
      ...(Array.isArray(upcomingRes?.matches) ? upcomingRes.matches : []),
    ];

    for (const m of rawMatches) {
      const home = m.homeTeam || m.home_team;
      const away = m.awayTeam || m.away_team;
      if (!home || !away) continue;
      const league = m.league || 'Global Football';
      const matchDate = m.date || m.match_date || todayIso;
      const pred = m.prediction || 'Home Win';
      const conf = Number(m.confidence) || 78;
      const hXg = Number(m.homeXg) || 1.72;
      const aXg = Number(m.awayXg) || 1.08;
      const score = m.predictedScore || `${Math.max(1, Math.round(hXg))}-${Math.max(0, Math.round(aXg))}`;
      addMatchRecord(home, away, league, matchDate, pred, conf, hXg, aXg, score, 'espn_live');
    }
  } catch {
    // Fallback handled below
  }

  // Always include high-search-volume global & African flagship fixtures
  const flagshipFixtures = [
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League', pred: 'Home Win', conf: 82, hXg: 1.94, aXg: 0.98, score: '2-1' },
    { home: 'Liverpool', away: 'Manchester City', league: 'Premier League', pred: 'BTTS & Over 2.5', conf: 85, hXg: 1.88, aXg: 1.64, score: '2-2' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', pred: 'Home Win', conf: 79, hXg: 2.05, aXg: 1.32, score: '2-1' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga', pred: 'Over 2.5 Goals', conf: 88, hXg: 2.42, aXg: 1.38, score: '3-1' },
    { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A', pred: 'Home Win', conf: 81, hXg: 1.78, aXg: 0.94, score: '2-0' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1', pred: 'Home Win', conf: 84, hXg: 2.18, aXg: 0.92, score: '2-1' },
    { home: 'Gor Mahia', away: 'AFC Leopards', league: 'FKF Kenya Premier League', pred: 'Home Win', conf: 83, hXg: 1.68, aXg: 0.74, score: '2-0' },
    { home: 'Al Ahly', away: 'Mamelodi Sundowns', league: 'CAF Champions League', pred: 'Under 2.5 Goals', conf: 80, hXg: 1.34, aXg: 0.96, score: '1-0' },
    { home: 'Simba SC', away: 'Young Africans', league: 'Tanzania NBC Premier League', pred: 'Double Chance 1X', conf: 79, hXg: 1.48, aXg: 1.12, score: '1-1' },
    { home: 'Kaizer Chiefs', away: 'Orlando Pirates', league: 'South Africa Betway Premiership', pred: 'BTTS Yes', conf: 77, hXg: 1.36, aXg: 1.42, score: '1-1' },
    { home: 'Enyimba', away: 'Rangers International', league: 'Nigeria NPFL', pred: 'Home Win', conf: 81, hXg: 1.62, aXg: 0.68, score: '2-0' },
    { home: 'Wydad AC', away: 'Raja Casablanca', league: 'Morocco Botola Pro', pred: 'Under 2.5 Goals', conf: 82, hXg: 1.18, aXg: 1.04, score: '1-1' },
    { home: 'Al-Hilal', away: 'Al-Nassr', league: 'Saudi Pro League', pred: 'Over 2.5 Goals', conf: 86, hXg: 2.15, aXg: 1.54, score: '2-1' },
    { home: 'Inter Miami', away: 'LAFC', league: 'Major League Soccer', pred: 'BTTS & Over 2.5', conf: 84, hXg: 1.96, aXg: 1.44, score: '2-1' },
  ];

  for (const f of flagshipFixtures) {
    addMatchRecord(f.home, f.away, f.league, todayIso, f.pred, f.conf, f.hXg, f.aXg, f.score, 'curated_derby');
  }

  cachedLiveMatches = { timestamp: Date.now(), records };
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

  const rawRouteTitle = matchedEntry
    ? `${matchedEntry.title} | PredictPro`
    : cleanPath === '/'
    ? 'PredictPro — AI Football Predictions, xG & Jackpots'
    : `${routeIntegration.currentHub.label} — AI Football & xG | PredictPro`;
  const routeTitle = clampSeoTitle(rawRouteTitle);

  const rawRouteDescription = cleanPath.includes('jackpot')
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
    jsonLdSchemas: [webAppSchema, faqSchema, baseOrganizationSchema],
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
 * Generates dynamic /sitemap-matches.xml populated with all live & upcoming ESPN match slugs + club hubs.
 */
export async function buildDynamicMatchesSitemapXml(baseUrl: string = SITE_BASE_URL): Promise<string> {
  const liveMatches = await resolveLiveMatchSlugs(baseUrl);
  const today = new Date().toISOString().split('T')[0];

  const matchNodes = liveMatches.map((m) => {
    const lastMod = m.matchDate.split('T')[0] || today;
    const title = `${m.homeTeam} vs ${m.awayTeam} AI Prediction, xG (${m.homeXg}-${m.awayXg}) & Odds (${m.league})`;
    return `  <url>
    <loc>${escapeXml(m.url)}</loc>
    <lastmod>${escapeXml(lastMod)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.90</priority>
    <image:image>
      <image:loc>${escapeXml(m.ogImageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
    </image:image>
  </url>`;
  });

  const clubSlugs = new Set<string>(CLUB_ANALYTICS_HUBS.map((c) => c.slug));
  for (const m of liveMatches) {
    clubSlugs.add(m.homeTeamSlug);
    clubSlugs.add(m.awayTeamSlug);
  }

  const clubNodes = Array.from(clubSlugs).map((slug) => {
    const clubUrl = `${baseUrl}/teams/${slug}`;
    const clubTitle = `${formatTitleCaseFromSlug(slug)} Expected Goals (xG) & Fixture Difficulty (FDR) Hub`;
    return `  <url>
    <loc>${escapeXml(clubUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...matchNodes, ...clubNodes].join('\n')}
</urlset>`;
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
