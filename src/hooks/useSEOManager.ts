import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { Prediction } from '@/types/prediction';
import {
  resolveMatchPredictionForSEO,
  buildMatchPredictionJsonLdNodes,
  ResolvedMatchSEOData,
} from '@/hooks/useMatchPredictionSEO';
import { detectUserGeographicRegion } from '@/services/geoRegionService';

export const BASE_URL = 'https://predictpro.guru';

export interface SEOBreadcrumbItem {
  name: string;
  item: string;
}

export interface UserLocaleProfile {
  lang: SupportedLanguage;
  locale: string;
  isRTL: boolean;
  ogLocale: string;
  isNonEnglish: boolean;
  source: 'query_param' | 'preferences' | 'stored_lang' | 'navigator' | 'geo_region' | 'fallback';
}

export interface SEOManagerOptions {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'sports.event';
  keywords?: string;
  noIndex?: boolean;
  structuredData?: object;
  breadcrumbs?: SEOBreadcrumbItem[];
  matchPrediction?: Partial<Prediction> | null;
}

export interface ResolvedSEOMetadata {
  title: string;
  fullTitle: string;
  description: string;
  webPageDescription: string;
  canonicalPath: string;
  canonicalUrl: string;
  image: string;
  type: 'website' | 'article' | 'sports.event';
  keywords: string;
  noIndex: boolean;
  breadcrumbs: SEOBreadcrumbItem[];
  structuredData: object;
  matchSeo?: ResolvedMatchSEOData | null;
  detectedLocale: UserLocaleProfile;
  localizedDescriptionsByLang: Record<SupportedLanguage, string>;
  hreflangLinks: Array<{ hreflang: string; href: string }>;
}

const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'PredictPro — AI Football Predictions';

interface RouteSEOConfig {
  title: string;
  description: string;
  keywords: string;
  canonicalPath?: string;
  type?: 'website' | 'article' | 'sports.event';
  noIndex?: boolean;
}

/**
 * Canonical route map covering static routes and alias deduplication
 */
const ROUTE_SEO_REGISTRY: Record<string, RouteSEOConfig> = {
  '/': {
    title: 'AI Football Predictions Today, xG Statistics & Match Analytics',
    description:
      'Independent AI football predictions today with 87% model accuracy. Daily Expected Goals (xG) stats, Bivariate Poisson probabilities, and H2H analytics across 40+ leagues. 18+ Informational only.',
    keywords:
      'ai football predictions today, football predictions today, football match statistics, expected goals xg, soccer predictions, poisson scoreline probabilities',
    canonicalPath: '/',
  },
  '/best-bets': {
    title: 'Free Guru Tips Today & Sure Banker Football Bets (75%+ AI Confidence)',
    description:
      'Verified daily football banker predictions and sure 1X2 guru tips today with 75% to 92% AI confidence. Filter high-probability match winners and Double Chance locks.',
    keywords:
      'free guru tips today football prediction, best football bets today, sure bets today, banker bet of the day, high confidence football predictions',
    canonicalPath: '/best-bets',
  },
  '/value-bets': {
    title: 'Daily Value Bets Today (+EV): Beat Bookmaker Odds',
    description:
      'Daily positive expected value (+EV) football bets today. Compare AI Poisson probability vs bookmaker odds to detect market mispricings and lock in edges.',
    keywords:
      'daily value bets today, value bets (+ev), positive expected value football, beating bookmakers, football betting edge, ai odds discrepancies',
    canonicalPath: '/value-bets',
  },
  '/btts': {
    title: 'BTTS AI Prediction Today: Both Teams to Score & Over 2.5 Tips',
    description:
      'Verified BTTS AI predictions today with 79% win rate. Daily Both Teams to Score and Over 2.5 goals tips with Poisson expectancy across 40+ leagues.',
    keywords:
      'btts ai prediction today, both teams to score tips, over 2.5 goals predictions, free btts tips today, poisson goal expectancy',
    canonicalPath: '/btts',
  },
  '/correct-score': {
    title: 'AI Correct Score Predictions Today & Exact Poisson Scorelines',
    description:
      'Exact 90-minute football scoreline predictions powered by bivariate Poisson probability matrices. Find high-odds 1-0, 2-1, and 1-1 correct score value picks.',
    keywords:
      'correct score predictions today, exact score football tips, bivariate poisson scoreline, correct score matrix',
    canonicalPath: '/correct-score',
  },
  '/accumulator': {
    title: 'Smart Football Accumulator Builder & 5-Fold Multibet Tips',
    description:
      'Build low-correlation 3-fold and 5-fold football accumulators using AI confidence filters, Double Chance hedges, and Kelly Criterion stake sizing.',
    keywords:
      'football accumulator tips today, smart acca builder, 5-fold multibet predictions, parlay builder football',
    canonicalPath: '/accumulator',
  },
  '/predict': {
    title: 'AI Match Predictor & Custom Football xG Simulator',
    description:
      'Simulate any football match with PredictPro’s custom AI Match Predictor. Compare team form, head-to-head records, and Poisson goal probabilities in real time.',
    keywords:
      'ai match predictor, aiprotips prediction today, custom football simulator, match outcome calculator',
    canonicalPath: '/predict',
  },
  '/upcoming': {
    title: 'Upcoming Football Fixtures & 7-Day AI Match Predictions',
    description:
      'Browse upcoming football fixtures across 40+ global leagues with early AI win probabilities, Expected Goals (xG) projections, and fair decimal odds.',
    keywords:
      'upcoming football fixtures, tomorrow football predictions, weekend soccer predictions, early match odds',
    canonicalPath: '/upcoming',
  },
  '/upcoming-fixtures': {
    title: 'Upcoming Football Fixtures & 7-Day AI Match Predictions',
    description:
      'Browse upcoming football fixtures across 40+ global leagues with early AI win probabilities, Expected Goals (xG) projections, and fair decimal odds.',
    keywords:
      'upcoming football fixtures, tomorrow football predictions, weekend soccer predictions',
    canonicalPath: '/upcoming',
  },
  '/live': {
    title: 'Live Football Scores, In-Play xG Momentum & AI Odds',
    description:
      'Track real-time live football scores, minute-by-minute match momentum, in-play AI win probabilities, and live goal alerts across global competitions.',
    keywords:
      'live football scores, in-play football predictions, live soccer odds, real-time match tracker',
    canonicalPath: '/live',
  },
  '/standings': {
    title: 'Football League Standings, Form Tables & xG Points Differential',
    description:
      'Live 2026/27 football league standings, home/away form tables, goal differentials, and championship qualification zones for Premier League, La Liga, KPL & more.',
    keywords:
      'football standings, premier league table, la liga standings, kpl table, league form table',
    canonicalPath: '/standings',
  },
  '/streaks': {
    title: 'Football Team Winning Streaks & Over 2.5 / BTTS Trend Radar',
    description:
      'Identify clubs on active winning streaks, unbeaten runs, and consecutive Over 2.5 Goals or Both Teams to Score trends before bookmakers adjust their lines.',
    keywords:
      'football winning streaks, team form trends, consecutive over 2.5 goals, btts streaks radar',
    canonicalPath: '/streaks',
  },
  '/trends': {
    title: 'Football Team Winning Streaks & Over 2.5 / BTTS Trend Radar',
    description:
      'Identify clubs on active winning streaks, unbeaten runs, and consecutive Over 2.5 Goals or Both Teams to Score trends before bookmakers adjust their lines.',
    keywords:
      'football winning streaks, team form trends, consecutive over 2.5 goals',
    canonicalPath: '/streaks',
  },
  '/dropping-odds': {
    title: 'Dropping Odds Radar & Sharp Syndicate Steam Move Tracker',
    description:
      'Monitor real-time dropping football odds and sharp market steam moves. Spot bookmaker line compression and capture positive Closing Line Value (CLV).',
    keywords:
      'dropping odds football, sharp money steam moves, closing line value clv, odds movement tracker',
    canonicalPath: '/dropping-odds',
  },
  '/screener': {
    title: 'Quantitative Football Match Screener & Multi-Factor Scanner',
    description:
      'Filter daily football fixtures by AI confidence, Expected Goals (xG), BTTS probability, Over 2.5 expectancy, and positive Expected Value (+EV) edge.',
    keywords:
      'football match screener, soccer stats scanner, quantitative betting filter, xg match finder',
    canonicalPath: '/screener',
  },
  '/track-record': {
    title: 'Verified AI Prediction Track Record, ROI & Closing Line Value',
    description:
      'Inspect PredictPro’s audited historical prediction accuracy, unit Return on Investment (ROI), strike rate by league, and Closing Line Value (CLV) performance.',
    keywords:
      'verified football prediction track record, ai betting accuracy, historical roi football tips',
    canonicalPath: '/track-record',
  },
  '/h2h': {
    title: 'Interactive Head-to-Head (H2H) Football Team Comparison & Poisson Tool',
    description:
      'Compare any two football clubs head-to-head. Analyze historical H2H results, attacking vs defensive xG radar charts, and custom Poisson score simulations.',
    keywords:
      'head to head football comparison, h2h soccer stats, team vs team predictor, poisson match comparison',
    canonicalPath: '/h2h',
  },
  '/compare': {
    title: 'Interactive Head-to-Head (H2H) Football Team Comparison & Poisson Tool',
    description:
      'Compare any two football clubs head-to-head. Analyze historical H2H results, attacking vs defensive xG radar charts, and custom Poisson score simulations.',
    keywords:
      'head to head football comparison, h2h soccer stats, team vs team predictor',
    canonicalPath: '/h2h',
  },
  '/premier-league-predictions': {
    title: 'English Premier League (EPL) AI Predictions, Odds & xG Tips',
    description:
      'Expert AI Premier League predictions for every matchweek. Get EPL 1X2 banker picks, Expected Goals (xG) projections, BTTS tips, and correct score probabilities.',
    keywords:
      'premier league predictions, epl betting tips today, english premier league ai picks, epl xg stats',
    canonicalPath: '/premier-league-predictions',
  },
  '/champions-league-predictions': {
    title: 'UEFA Champions League AI Predictions, Swiss Phase & Knockout Tips',
    description:
      'UEFA Champions League match predictions powered by AI. Analyze 36-team league phase dynamics, knockout tie probabilities, Over 2.5 goals, and value odds.',
    keywords:
      'champions league predictions, ucl betting tips, uefa champions league ai odds, ucl predictions today',
    canonicalPath: '/champions-league-predictions',
  },
  '/la-liga-predictions': {
    title: 'Spanish La Liga AI Predictions, Match Previews & Value Odds',
    description:
      'Daily Spanish La Liga football predictions and tactical xG analysis. Find Real Madrid, Barcelona, and Atletico Madrid 1X2, BTTS, and Asian Handicap picks.',
    keywords:
      'la liga predictions, spanish football tips, la liga ai predictions today, el clasico odds',
    canonicalPath: '/la-liga-predictions',
  },
  '/bundesliga-predictions': {
    title: 'German Bundesliga AI Predictions, Over 2.5 Goals & BTTS Tips',
    description:
      'High-scoring German Bundesliga AI predictions. Access Poisson goal expectancy, Over 2.5 and BTTS probabilities, and 1X2 value picks for every fixture.',
    keywords:
      'bundesliga predictions, german football betting tips, bundesliga over 2.5 goals, bayern dortmund predictions',
    canonicalPath: '/bundesliga-predictions',
  },
  '/serie-a-predictions': {
    title: 'Italian Serie A AI Predictions, Tactical xGA & 1X2 Betting Tips',
    description:
      'Italian Serie A football predictions combining defensive Expected Goals Against (xGA), tactical low-block metrics, and mispriced Draw No Bet value lines.',
    keywords:
      'serie a predictions, italian football tips today, serie a ai betting picks, inter juve milan odds',
    canonicalPath: '/serie-a-predictions',
  },
  '/kpl-predictions': {
    title: 'FKF Kenya Premier League (KPL) Predictions & M-Pesa Betting Tips',
    description:
      'Official FKF Kenya Premier League AI predictions covering Gor Mahia, AFC Leopards, Tusker FC, and Kenya Police FC with instant M-Pesa VIP access.',
    keywords:
      'kpl predictions, kenya premier league tips, gor mahia vs afc leopards prediction, sportpesa betika kpl tips',
    canonicalPath: '/kpl-predictions',
  },
  '/jackpot-predictions': {
    title: 'SportPesa Mega Jackpot (17 Games) & Betika Midweek AI Predictions',
    description:
      'Mathematical 17-game SportPesa Mega Jackpot and Betika Grand Jackpot predictions. Get AI banker selections and optimal Double Chance hedging combinations.',
    keywords:
      'sportpesa mega jackpot prediction 17 games, betika midweek jackpot tips, mozzart grand jackpot predictions',
    canonicalPath: '/jackpot-predictions',
  },
  '/us-soccer-predictions': {
    title: 'MLS & US Soccer Predictions: Moneyline (+/-), Spreads & AI Picks',
    description:
      'Major League Soccer (MLS), Concacaf Champions Cup, and US Open Cup AI predictions with American moneyline odds, goal spreads, and travel fatigue modeling.',
    keywords:
      'mls predictions today, us soccer betting picks, american moneyline soccer odds, inter miami predictions',
    canonicalPath: '/us-soccer-predictions',
  },
  '/world-cup-predictions': {
    title: '2026 FIFA World Cup Predictions, Qualifiers & Tournament Odds',
    description:
      '2026 FIFA World Cup qualifying and tournament AI predictions. Explore international Elo ratings, group stage advancement probabilities, and match tips.',
    keywords:
      'fifa world cup 2026 predictions, world cup qualifiers tips, international football predictions',
    canonicalPath: '/world-cup-predictions',
  },
  '/afcon-predictions': {
    title: 'AFCON & CAF Champions League AI Football Predictions',
    description:
      'Africa Cup of Nations (AFCON) and CAF Champions League predictions. Home altitude metrics, low-scoring under 2.5 trends, and top African club odds.',
    keywords:
      'afcon predictions, caf champions league tips, african football predictions today',
    canonicalPath: '/afcon-predictions',
  },
  '/blog': {
    title: 'Football Betting Strategy Blog: +EV, Poisson xG & Asian Handicap Guides',
    description:
      'Master quantitative football betting with our in-depth strategy guides on Expected Value (+EV), Asian Handicap lines, Closing Line Value (CLV), and Kelly staking.',
    keywords:
      'football betting strategy blog, value betting guide, asian handicap explained, kelly criterion football',
    canonicalPath: '/blog',
  },
  '/methodology': {
    title: 'AI Football Prediction Methodology: Bivariate Poisson & xG Science',
    description:
      'Learn how PredictPro’s ensemble AI calculates match probabilities using Dixon-Coles bivariate Poisson models, rolling Expected Goals (xG), and market CLV.',
    keywords:
      'football prediction methodology, bivariate poisson model football, dixon coles xg model',
    canonicalPath: '/methodology',
  },
  '/archive': {
    title: 'Past Match Prediction Archive & Verified Result Settlement',
    description:
      'Browse PredictPro’s complete archive of past football predictions, final 90-minute scorelines, and transparent win/loss settlement records.',
    keywords:
      'past football predictions archive, verified prediction results, settled football tips',
    canonicalPath: '/archive',
  },
  '/results': {
    title: 'Past Match Prediction Archive & Verified Result Settlement',
    description:
      'Browse PredictPro’s complete archive of past football predictions, final 90-minute scorelines, and transparent win/loss settlement records.',
    keywords:
      'past football predictions archive, verified prediction results, settled football tips',
    canonicalPath: '/archive',
  },
  '/seo-indexing': {
    title: 'PredictPro SEO Command Center, 12-Pillar Site Audit & Indexing Cron',
    description:
      'Monitor automated Google Indexing cron jobs, IndexNow pings, Low-Hanging Fruit keywords (Pos 4–15), AI Overview snippets, and backlink reclamation.',
    keywords:
      'google indexing api, indexnow football predictions, seo site audit dashboard, competitor content gap',
    canonicalPath: '/seo-indexing',
  },
  '/sitemap': {
    title: 'PredictPro HTML Sitemap & Complete Indexed Predictions Directory',
    description:
      'Navigate all indexed PredictPro football prediction hubs, league tables, quantitative betting tools, strategy articles, and live match previews.',
    keywords:
      'predictpro sitemap, football predictions directory, all leagues predictions links',
    canonicalPath: '/sitemap',
  },
  '/responsible-gaming': {
    title: 'Responsible Gaming, 18+ Minor Protection & Analytics Disclaimer',
    description:
      'PredictPro Responsible Gambling Policy, 18+ minor protection standards, international support helplines, and informational sports statistics disclaimer.',
    keywords:
      'responsible gambling policy, 18+ age restriction, sports statistics disclaimer, begambleaware, gamcare helpline',
    canonicalPath: '/responsible-gaming',
  },
  '/disclaimer': {
    title: 'Responsible Gaming, 18+ Minor Protection & Analytics Disclaimer',
    description:
      'PredictPro Responsible Gambling Policy, 18+ minor protection standards, international support helplines, and informational sports statistics disclaimer.',
    keywords:
      'responsible gambling policy, 18+ age restriction, sports statistics disclaimer, begambleaware, gamcare helpline',
    canonicalPath: '/responsible-gaming',
  },
};

/**
 * Normalizes page <title> to strictly <= 60 characters for Ahrefs Site Audit & SERP display.
 */
export function normalizeSEOTitle(raw: string): string {
  const text = (raw || '').trim();
  if (text.length <= 60) return text;
  const withoutBrand = text.replace(/\s*[|—-]\s*PredictPro.*$/i, '').trim();
  if (withoutBrand.length <= 60 && withoutBrand.length >= 25) {
    return withoutBrand;
  }
  let truncated = text.slice(0, 57);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 38) {
    truncated = truncated.slice(0, lastSpace).replace(/[,:&|—-]+$/, '');
  }
  return truncated.trim();
}

/**
 * Normalizes meta & WebPage schema description to 120–155 chars (strictly <= 155 chars for Ahrefs Site Audit).
 */
export function normalizeSEODescription(raw: string, lang: SupportedLanguage = 'en'): string {
  let text = (raw || '').trim();

  if (text.length > 155) {
    let truncated = text.slice(0, 152);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 120) {
      truncated = truncated.slice(0, lastSpace).replace(/[,:;]+$/, '');
    }
    text = `${truncated}...`;
  } else if (text.length < 115) {
    const cleanBase = text.replace(/[.\s]+$/, '');
    const suffixes: Record<SupportedLanguage, string> = {
      es: ' Predicciones de fútbol con IA, estadísticas xG y cuotas H2H.',
      fr: ' Pronostics foot quotidiens IA, stats xG et cotes H2H en direct.',
      pt: ' Palpites diários de futebol com IA, estatísticas xG e cotes H2H.',
      sw: ' Utabiri wa kila siku wa mpira kwa AI, takwimu za xG na odds.',
      ar: ' توقعات يومية بالذكاء الاصطناعي وإحصائيات xG ونسب H2H.',
      de: ' Tägliche KI Fußball-Vorhersagen, Poisson xG-Statistiken & H2H-Quoten.',
      en: ' Daily AI football predictions, Poisson xG stats & H2H odds.',
    };
    const suffix = suffixes[lang] || suffixes.en;
    const combined = `${cleanBase}.${suffix}`;
    text = combined.length > 155 ? `${combined.slice(0, 152)}...` : combined;
  }

  return text;
}

/**
 * Builds structured BreadcrumbList items from a canonical path and page title.
 */
export function deriveRouteBreadcrumbs(
  canonicalPath: string,
  pageTitle: string
): SEOBreadcrumbItem[] {
  const clean = canonicalPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) {
    return [{ name: 'Home', item: '/' }];
  }

  const parts = clean.split('/');
  const list: SEOBreadcrumbItem[] = [{ name: 'Home', item: '/' }];
  let acc = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    acc += `/${part}`;

    if (i === parts.length - 1 && pageTitle) {
      const cleanName = pageTitle.replace(/\s*\|\s*PredictPro.*$/i, '').trim();
      list.push({
        name: cleanName.length <= 42 ? cleanName : `${cleanName.slice(0, 39)}...`,
        item: acc,
      });
    } else {
      const readable = part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bBtts\b/i, 'BTTS')
        .replace(/\bH2h\b/i, 'H2H')
        .replace(/\bEpl\b/i, 'EPL')
        .replace(/\bKpl\b/i, 'KPL')
        .replace(/\bUcl\b/i, 'UCL')
        .replace(/\bSeo\b/i, 'SEO')
        .replace(/\bAi\b/i, 'AI')
        .replace(/\bUs\b/i, 'US');
      list.push({ name: readable, item: acc });
    }
  }

  return list;
}

/**
 * Resolves dynamic routes such as /predict/:matchSlug, /match/:matchSlug, and /blog/:slug
 */
function resolveDynamicRouteConfig(pathname: string): RouteSEOConfig {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (ROUTE_SEO_REGISTRY[cleanPath]) {
    return ROUTE_SEO_REGISTRY[cleanPath];
  }

  // Dynamic Match Prediction Route: /predict/:matchSlug or /match/:matchSlug
  const matchRoute = cleanPath.match(/^\/(?:predict|match)\/([^/]+)$/i);
  if (matchRoute) {
    const slug = matchRoute[1];
    const withoutDate = slug.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const teams = withoutDate.split('-vs-');
    const formatTeam = (raw: string) =>
      raw
        .split('-')
        .map((w) => (w.length <= 3 && /^(fc|sc|ac|as|cf|fk|us)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

    if (teams.length === 2) {
      const home = formatTeam(teams[0]);
      const away = formatTeam(teams[1]);
      return {
        title: `${home} vs ${away} AI Prediction, xG Stats, H2H & Betting Odds`,
        description: `${home} vs ${away} AI football prediction, bivariate Poisson correct score matrix, Expected Goals (xG), head-to-head form, and +EV betting tips.`,
        keywords: `${home} vs ${away} prediction, ${home} vs ${away} betting tips, ${home} ${away} correct score, ${home} ${away} h2h odds`,
        // Always canonicalize /match/:slug to /predict/:slug to eliminate duplicate content
        canonicalPath: `/predict/${slug}`,
        type: 'sports.event',
      };
    }
  }

  // Dynamic Blog Post Route: /blog/:slug
  const blogRoute = cleanPath.match(/^\/blog\/([^/]+)$/i);
  if (blogRoute) {
    const slug = blogRoute[1];
    const humanized = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${humanized} — Football Betting Strategy Guide`,
      description: `In-depth quantitative football betting guide on ${humanized}. Learn Poisson goal modeling, Expected Value (+EV), and bankroll strategy.`,
      keywords: `${slug.replace(/-/g, ' ')}, football betting strategy, ai football predictions`,
      canonicalPath: `/blog/${slug}`,
      type: 'article',
    };
  }

  // Fallback for any other route
  const fallbackTitle =
    cleanPath === '/'
      ? ROUTE_SEO_REGISTRY['/'].title
      : `${cleanPath
          .replace(/^\/+/, '')
          .replace(/[-/]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())} | AI Football Predictions`;

  return {
    title: fallbackTitle,
    description: ROUTE_SEO_REGISTRY['/'].description,
    keywords: ROUTE_SEO_REGISTRY['/'].keywords,
    canonicalPath: cleanPath,
    type: 'website',
  };
}

export type SupportedLanguage = 'en' | 'sw' | 'fr' | 'es' | 'pt' | 'ar' | 'de';

export interface LocalizedRouteInfo {
  title?: string;
  description?: string;
  keywords?: string;
}

export const GLOBAL_HREFLANGS = [
  'x-default',
  'en',
  'en-US',
  'en-GB',
  'en-KE',
  'en-NG',
  'en-ZA',
  'en-GH',
  'en-TZ',
  'en-UG',
  'en-ZM',
  'en-ZW',
  'en-RW',
  'en-CM',
  'en-IN',
  'en-CA',
  'en-AU',
  'en-NZ',
  'en-PH',
  'en-SG',
  'en-MY',
  'en-IE',
  'en-AE',
  'es',
  'es-ES',
  'es-MX',
  'es-AR',
  'es-CO',
  'es-CL',
  'es-US',
  'fr',
  'fr-FR',
  'fr-CA',
  'fr-SN',
  'fr-CI',
  'fr-CD',
  'fr-CM',
  'fr-MA',
  'pt',
  'pt-BR',
  'pt-PT',
  'pt-AO',
  'pt-MZ',
  'sw',
  'sw-KE',
  'sw-TZ',
  'de',
  'de-DE',
  'de-AT',
  'de-CH',
  'it-IT',
  'nl-NL',
  'ar',
  'ar-EG',
  'ar-SA',
  'ar-AE',
  'ar-MA',
];

/**
 * Builds valid canonicalized or language-targeted URL for hreflang injection.
 * For x-default and default English, returns the clean canonical URL.
 * For regional/language versions, appends ?lang={code}.
 */
export function buildHreflangUrl(canonicalUrl: string, langOrLocale: string): string {
  if (langOrLocale === 'x-default' || langOrLocale === 'en') {
    return canonicalUrl;
  }
  try {
    const parsed = new URL(canonicalUrl);
    parsed.searchParams.set('lang', langOrLocale);
    return parsed.toString();
  } catch {
    const sep = canonicalUrl.includes('?') ? '&' : '?';
    return `${canonicalUrl}${sep}lang=${encodeURIComponent(langOrLocale)}`;
  }
}

/**
 * Prunes orphaned alternate hreflang links from document.head to prevent DOM pollution
 */
export function pruneAlternateHreflangTags(validHreflangs: Set<string>) {
  if (typeof document === 'undefined') return;
  const allAlternates = Array.from(
    document.head.querySelectorAll('link[rel="alternate"][hreflang]')
  ) as HTMLLinkElement[];
  for (const link of allAlternates) {
    const lang = link.getAttribute('hreflang');
    if (lang && !validHreflangs.has(lang)) {
      link.remove();
    }
  }
}

export const LOCALIZED_ROUTE_METADATA: Record<string, Partial<Record<SupportedLanguage, LocalizedRouteInfo>>> = {
  '/': {
    es: {
      title: 'Predicciones de Fútbol con IA Hoy, Estadísticas xG y Análisis',
      description: 'Predicciones de fútbol independientes con IA hoy y 87% de precisión. Estadísticas diarias de Expected Goals (xG), matrices Poisson y análisis H2H.',
      keywords: 'predicciones de futbol con ia hoy, pronosticos futbol hoy, estadisticas xg futbol, apuestas de valor, modelo poisson, analisis de partidos',
    },
    fr: {
      title: 'Pronostics Foot IA Aujourd\'hui, Statistiques xG et Cotes',
      description: 'Pronostics foot indépendants par IA aujourd\'hui avec 87% de précision. Statistiques quotidiennes Expected Goals (xG), modèle Poisson et cotes de valeur.',
      keywords: 'pronostics foot ia aujourdhui, pronostics foot gratuits, stats xg football, paris de valeur, modele poisson foot, analyse tactique',
    },
    pt: {
      title: 'Palpites de Futebol IA Hoje, Estatísticas xG e Probabilidades',
      description: 'Palpites de futebol independentes com IA hoje e 87% de precisão. Estatísticas diárias de Expected Goals (xG), probabilidades Poisson e análise H2H.',
      keywords: 'palpites de futebol ia hoje, palpites futebol hoje, estatisticas xg brasileirao, apostas de valor, modelo poisson futebol, analise de jogos',
    },
    sw: {
      title: 'Utabiri wa Mechi za Mpira Leo kwa AI, Takwimu za xG na Odds',
      description: 'Utabiri wa uhakika wa mpira wa miguu leo unaoendeshwa na akili bandia (AI) kwa usahihi wa 87%. Takwimu za Expected Goals (xG) na odds bora.',
      keywords: 'utabiri wa mpira leo, ubashiri wa mechi leo, utabiri wa uhakika, takwimu za soka, odds za ushindi, uchambuzi wa mechi leo',
    },
    ar: {
      title: 'توقعات مباريات كرة القدم بالذكاء الاصطناعي اليوم وإحصائيات xG',
      description: 'توقعات مباريات كرة القدم بالذكاء الاصطناعي اليوم بدقة 87%. إحصائيات الأهداف المتوقعة (xG) اليومية ومصفوفة بواسون لتحليل أكثر من 40 دوري عالمي.',
      keywords: 'توقعات كرة القدم بالذكاء الاصطناعي اليوم, توقعات المباريات اليوم, إحصائيات xG, رهانات القيمة, مصفوفة بواسون, تحليل المباريات',
    },
    de: {
      title: 'KI Fußball-Vorhersagen heute, Expected Goals (xG) & Quoten',
      description: 'Unabhängige KI Fußball-Vorhersagen heute mit 87% Genauigkeit. Tägliche Expected Goals (xG) Statistiken, Poisson-Wahrscheinlichkeiten und H2H-Analysen.',
      keywords: 'ki fussball vorhersagen heute, fussball tipps heute, expected goals xg statistiken, value bets fussball, poisson modell, wett tipps heute',
    },
  },
  '/best-bets': {
    es: {
      title: 'Mejores Apuestas de Fútbol y Consejos Banker Hoy | PredictPro',
      description: 'Pronósticos diarios verificados de fútbol banker y consejos seguros 1X2 con 75% a 92% de confianza IA. Filtra selecciones de alta probabilidad.',
      keywords: 'mejores apuestas futbol hoy, apuestas seguras hoy, banker bet del dia, pronosticos alta confianza',
    },
    fr: {
      title: 'Meilleurs Paris Foot du Jour et Pronostics Sûrs | PredictPro',
      description: 'Prédictions quotidiennes vérifiées de football banker et conseils sûrs 1X2 avec 75% à 92% de confiance IA. Filtrez les vainqueurs à haute probabilité.',
      keywords: 'meilleurs paris foot aujourdhui, paris surs foot, banker du jour, pronostics haute confiance',
    },
    pt: {
      title: 'Melhores Palpites de Futebol e Apostas Seguras | PredictPro',
      description: 'Palpites diários verificados de futebol banker e dicas seguras 1X2 com 75% a 92% de confiança IA. Filtre jogos de alta probabilidade.',
      keywords: 'melhores palpites futebol hoje, apostas seguras hoje, aposta banker do dia, palpites alta confianca',
    },
    sw: {
      title: 'Utabiri wa Uhakika wa Mpira Leo (Banker Bets) | PredictPro',
      description: 'Utabiri wa uhakika wa mechi za mpira wa miguu leo na vidokezo vya 1X2 vyenye usahihi wa 75% hadi 92%. Chagua mechi zenye uhakika mkubwa.',
      keywords: 'utabiri wa uhakika leo, mechi za uhakika, banker bets leo, vidokezo salama vya soka',
    },
    ar: {
      title: 'أفضل رهانات كرة القدم الموثوقة وتوقعات البانكر اليوم | PredictPro',
      description: 'توقعات كرة القدم اليومية الموثوقة ونصائح 1X2 الآمنة بنسبة ثقة 75% إلى 92% بالذكاء الاصطناعي. تصفية الرهانات عالية الاحتمال.',
      keywords: 'أفضل رهانات كرة القدم اليوم, رهانات مؤكدة, نصائح 1X2 موثوقة, توقعات عالية الثقة',
    },
    de: {
      title: 'Beste Fußball-Tipps & Sichere Banker-Wetten Heute | PredictPro',
      description: 'Verifizierte tägliche Fußball-Banker-Vorhersagen und sichere 1X2-Tipps mit 75% bis 92% KI-Konfidenz. Filtern Sie Top-Gewinner und Absicherungen.',
      keywords: 'beste fussball tipps heute, sichere wetten heute, banker tipp des tages, hohe konfidenz',
    },
  },
  '/value-bets': {
    es: {
      title: 'Apuestas de Valor (+EV) Hoy: Supera las Cuotas | PredictPro',
      description: 'Apuestas diarias de valor esperado positivo (+EV) en fútbol. Compara probabilidades de IA Poisson vs cuotas de casas de apuestas para ganar ventaja.',
      keywords: 'apuestas de valor hoy, value bets ev, cuotas desajustadas futbol, superar a las casas de apuestas',
    },
    fr: {
      title: 'Paris de Valeur (+EV) Foot Aujourd\'hui | PredictPro',
      description: 'Paris à espérance positive (+EV) quotidiens sur le football. Comparez les probabilités Poisson de l\'IA aux cotes des bookmakers pour créer un avantage.',
      keywords: 'paris de valeur foot, value bets ev, cotes mal ajustees, battre les bookmakers',
    },
    pt: {
      title: 'Apostas de Valor (+EV) Hoje: Bata as Casas | PredictPro',
      description: 'Apostas diárias com valor esperado positivo (+EV) no futebol. Compare probabilidades Poisson da IA contra cotes das casas e ache desregulagens.',
      keywords: 'apostas de valor hoje, value bets ev futebol, cotes desajustadas, bater as casas de apostas',
    },
    sw: {
      title: 'Odds Zenye Faida Kubwa (+EV) Leo | PredictPro',
      description: 'Odds za mpira zenye thamani chanya (+EV) leo. Linganisha uwezekano wa AI dhidi ya odds za bookmakers kugundua makosa ya bei na kushinda.',
      keywords: 'odds zenye faida, value bets soka, faida ya bookmaker, mkakati wa kushinda ubashiri',
    },
    ar: {
      title: 'رهانات القيمة اليوم (+EV): تغلب على مكاتب المراهنات | PredictPro',
      description: 'رهانات كرة القدم ذات القيمة الإيجابية المتوقعة (+EV) يومياً. قارن احتمالات الذكاء الاصطناعي بأسعار السوق لتحقيق عوائد مستدامة.',
      keywords: 'رهانات القيمة اليوم, توقعات ذات قيمة ايجابية, التغلب على احتمالات المراهنات',
    },
    de: {
      title: 'Tägliche Value Bets (+EV) & Quoten-Fehler | PredictPro',
      description: 'Tägliche Fußball-Wetten mit positivem Erwartungswert (+EV). Vergleichen Sie KI-Wahrscheinlichkeiten mit Buchmacherquoten für mathematische Vorteile.',
      keywords: 'value bets heute, positiver erwartungswert, buchmacher quoten fehler, quotenvergleich',
    },
  },
  '/btts': {
    es: {
      title: 'Pronósticos Ambos Equipos Marcan (BTTS) y Más 2.5 | PredictPro',
      description: 'Pronósticos verificados de Ambos Equipos Marcan (BTTS / Marcan Ambos) hoy con 79% de acierto. Consejos de Más de 2.5 goles con expectativa xG.',
      keywords: 'ambos equipos marcan btts hoy, marcan ambos futbol, mas de 2.5 goles pronosticos',
    },
    fr: {
      title: 'Pronostics Les Deux Équipes Marquent (BTTS) & +2.5 | PredictPro',
      description: 'Pronostics vérifiés Les Deux Équipes Marquent (BTTS) aujourd\'hui avec 79% de réussite. Conseils Plus de 2.5 buts et espérance de buts xG.',
      keywords: 'les deux equipes marquent btts, pronostics plus de 2.5 buts, btts foot aujourdhui',
    },
    pt: {
      title: 'Palpites Ambas Marcam (BTTS) e Mais de 2.5 Gols | PredictPro',
      description: 'Palpites verificados de Ambas Equipes Marcam (BTTS) hoje com 79% de acerto. Dicas de Mais de 2.5 gols com expectativa de gols matemáticos.',
      keywords: 'ambas marcam btts hoje, palpites mais de 2.5 gols, ambas equipes marcam futebol',
    },
    sw: {
      title: 'Utabiri wa Timu Zote Kufunga (GG / BTTS) na Magoli 2.5 | PredictPro',
      description: 'Utabiri wa uhakika wa Timu Zote Kufunga (Both Teams to Score - GG) leo na Zaidi ya Magoli 2.5 kwa uchambuzi wa takwimu za ufungaji magoli.',
      keywords: 'timu zote kufunga gg, utabiri wa gg leo, zaidi ya magoli 2.5, btts soka leo',
    },
    ar: {
      title: 'توقعات كلا الفريقين يسجلان (BTTS / GG) وأكثر من 2.5 هدف | PredictPro',
      description: 'توقعات موثوقة لكلا الفريقين يسجلان (BTTS) اليوم بنسبة نجاح 79%. نصائح أكثر من 2.5 هدف مع توزيع احتمالات الأهداف المتوقعة.',
      keywords: 'كلا الفريقين يسجلان btts, توقعات اكثر من 2.5 هدف, توقعات اهداف المباريات',
    },
    de: {
      title: 'Beide Teams Treffen (BTTS) & Über 2.5 Tore Tipps | PredictPro',
      description: 'Verifizierte Beide Teams Treffen (BTTS) Tipps heute mit 79% Trefferquote. Tägliche Über 2.5 Tore Vorhersagen mit Poisson-Torverteilung.',
      keywords: 'beide teams treffen btts, uber 2.5 tore tipps, torstatistiken fussball',
    },
  },
  '/correct-score': {
    es: {
      title: 'Pronósticos de Resultado Exacto Hoy (Poisson) | PredictPro',
      description: 'Predicciones exactas de resultados de 90 minutos mediante matrices de Poisson bivariadas. Selecciones de alto valor para 1-0, 2-1 y 1-1.',
      keywords: 'resultado exacto futbol hoy, pronosticos marcador exacto, matriz poisson futbol',
    },
    fr: {
      title: 'Pronostics Score Exact Foot Aujourd\'hui | PredictPro',
      description: 'Prédictions de scores exacts à 90 minutes propulsées par des matrices de Poisson bivariées. Trouvez des scores à fortes cotes 1-0, 2-1 et 1-1.',
      keywords: 'score exact foot aujourdhui, pronostic score exact, matrice poisson score',
    },
    pt: {
      title: 'Palpites de Placar Exato de Futebol Hoje | PredictPro',
      description: 'Previsões exatas de placar de 90 minutos geradas por matrizes de Poisson bivariadas. Encontre palpites de alto valor para 1-0, 2-1 e 1-1.',
      keywords: 'placar exato futebol hoje, palpites resultado exato, matriz poisson placar',
    },
    sw: {
      title: 'Utabiri wa Matokeo Sahihi (Correct Score) Leo | PredictPro',
      description: 'Utabiri wa matokeo kamili ya dakika 90 kwa hesabu za matriki ya Poisson. Pata machaguo ya odds kubwa ya 1-0, 2-1 na 1-1.',
      keywords: 'matokeo sahihi leo, correct score soka, ubashiri wa goli kamili',
    },
    ar: {
      title: 'توقعات النتيجة الدقيقة لمباريات كرة القدم اليوم | PredictPro',
      description: 'توقعات دقيقة للنتيجة النهائية لمباريات 90 دقيقة بنماذج بواسون ثنائية المتغير. اكتشف رهانات النتيجة الدقيقة 1-0 و2-1 و1-1 ذات العوائد العالية.',
      keywords: 'النتيجة الدقيقة لكرة القدم اليوم, توقعات النتائج الدقيقة, نموذج بواسون للنتائج',
    },
    de: {
      title: 'Genaue Ergebnis-Tipps & Poisson-Matrix Heute | PredictPro',
      description: 'Genaue 90-Minuten Ergebnis-Vorhersagen powered by bivariate Poisson-Matrizen. Finden Sie Value-Picks für 1:0, 2:1 und 1:1 mit hohen Quoten.',
      keywords: 'genaues ergebnis fussball heute, ergebnis tipps, poisson matrix ergebnis',
    },
  },
  '/live': {
    es: {
      title: 'Resultados de Fútbol en Vivo, xG y Cuotas en Directo | PredictPro',
      description: 'Sigue resultados de fútbol en vivo minuto a minuto, xG en tiempo real, probabilidades de IA en directo y alertas de goles en todo el mundo.',
      keywords: 'resultados de futbol en vivo, marcadores en directo, xg en vivo, cuotas en directo',
    },
    fr: {
      title: 'Scores Foot en Direct, xG et Cotes en Direct | PredictPro',
      description: 'Suivez les scores de football en direct minute par minute, l\'élan du match, les probabilités IA en temps réel et les alertes buts mondiales.',
      keywords: 'scores foot en direct, live score football, xg en temps reel, cotes en direct',
    },
    pt: {
      title: 'Resultados de Futebol Ao Vivo, xG e Cotes em Tempo Real | PredictPro',
      description: 'Acompanhe placar ao vivo de futebol minuto a minuto, xG em tempo real, probabilidades de IA ao vivo e alertas de gols em competições globais.',
      keywords: 'futebol ao vivo, placar ao vivo, resultados em tempo real, cotes ao vivo',
    },
    sw: {
      title: 'Matokeo ya Moja kwa Moja (Live Scores) na Odds za Papo Hapo | PredictPro',
      description: 'Fuatilia matokeo ya moja kwa moja ya soka dakika kwa dakika, takwimu za xG papo hapo na uwezekano wa kushinda wa AI kwenye ligi za kimataifa.',
      keywords: 'matokeo ya moja kwa moja, live scores mpira, matokeo ya soka sasa hivi',
    },
    ar: {
      title: 'نتائج مباريات كرة القدم المباشرة والفرص اللحظية | PredictPro',
      description: 'تابع نتائج كرة القدم المباشرة لحظة بلحظة، إحصائيات الأهداف المتوقعة المباشرة (xG)، وفرص الفوز بالذكاء الاصطناعي مع تنبيهات الأهداف.',
      keywords: 'نتائج مباشرة كرة القدم, لايف سكور, اهداف المباريات مباشر, توقعات حية',
    },
    de: {
      title: 'Live Fußball-Ergebnisse, In-Play xG & Live-Quoten | PredictPro',
      description: 'Verfolgen Sie Live-Fußballergebnisse Minute für Minute, In-Play KI-Siegwahrscheinlichkeiten, Echtzeit-xG und Toralarme weltweit.',
      keywords: 'live fussball ergebnisse, live ticker, live xg, in-play quoten',
    },
  },
  '/upcoming': {
    es: {
      title: 'Próximos Partidos y Pronósticos de Fútbol a 7 Días | PredictPro',
      description: 'Consulta los próximos partidos de fútbol en más de 40 ligas con probabilidades de victoria de IA tempranas, xG proyectado y cuotas justas.',
      keywords: 'proximos partidos futbol, calendario futbol predicciones, cuotas tempranas',
    },
    fr: {
      title: 'Prochains Matchs et Pronostics Foot sur 7 Jours | PredictPro',
      description: 'Consultez les matchs de football à venir sur plus de 40 ligues avec probabilités IA précoces, projections xG et cotes équitables.',
      keywords: 'prochains matchs foot, calendrier pronostics football, cotes anticipees',
    },
    pt: {
      title: 'Próximos Jogos e Palpites de Futebol em 7 Dias | PredictPro',
      description: 'Veja os próximos jogos de futebol em mais de 40 ligas com probabilidades antecipadas de IA, projeções de xG e cotes calculadas.',
      keywords: 'proximos jogos futebol, calendario palpites futebol, cotes antecipadas',
    },
    sw: {
      title: 'Mechi Zinazokuja na Utabiri wa Siku 7 | PredictPro',
      description: 'Tazama ratiba ya mechi zinazokuja kwenye ligi 40+ na viwango vya ushindi vya AI, makadirio ya xG na odds halisi.',
      keywords: 'mechi zinazokuja, ratiba ya mpira, ubashiri wa wiki hii',
    },
    ar: {
      title: 'المباريات القادمة وتوقعات كرة القدم لـ 7 أيام | PredictPro',
      description: 'استعرض جدول مباريات كرة القدم القادمة في أكثر من 40 دوري مع احتمالات الفوز المبكرة بالذكاء الاصطناعي والأهداف المتوقعة.',
      keywords: 'مباريات كرة القدم القادمة, جدول المباريات, توقعات الاسبوع كرة القدم',
    },
    de: {
      title: 'Kommende Fußball-Spiele & 7-Tage KI-Quoten | PredictPro',
      description: 'Kommende Fußballspiele aus über 40 Ligen mit frühen KI-Wahrscheinlichkeiten, xG-Projektionen und fairen Dezimalquoten.',
      keywords: 'kommende fussball spiele, spielplan vorhersagen, fruhe quoten',
    },
  },
  '/predict': {
    es: {
      title: 'Simulador y Predictor de Partidos de Fútbol con IA | PredictPro',
      description: 'Simula cualquier partido de fútbol con el Predictor de IA de PredictPro. Compara forma, H2H y probabilidades de goles de Poisson.',
      keywords: 'simulador de partidos futbol, predictor futbol ia, simulacion poisson futbol',
    },
    fr: {
      title: 'Simulateur et Prédicteur de Matchs de Foot IA | PredictPro',
      description: 'Simulez n\'importe quel match de football avec le prédicteur IA de PredictPro. Comparez forme, H2H et probabilités de buts de Poisson.',
      keywords: 'simulateur match foot, predicteur ia football, simulation poisson foot',
    },
    pt: {
      title: 'Simulador e Preditor de Jogos de Futebol com IA | PredictPro',
      description: 'Simule qualquer confronto de futebol com o simulador de IA da PredictPro. Compare retrospecto, H2H e probabilidades de gols Poisson.',
      keywords: 'simulador de jogos futebol, preditor ia futebol, simulador poisson futebol',
    },
    sw: {
      title: 'Kifanisi cha Mechi za Soka kwa AI (Match Simulator) | PredictPro',
      description: 'Fanya simulizi ya mechi yoyote ya mpira kwa injini ya AI ya PredictPro. Linganisha ubora wa timu, H2H na uwezekano wa magoli.',
      keywords: 'kifanisi cha mechi, simulator ya mpira, utabiri maalum wa timu',
    },
    ar: {
      title: 'محاكي وتوقعات مباريات كرة القدم بالذكاء الاصطناعي | PredictPro',
      description: 'قم بمحاكاة أي مباراة كرة قدم باستخدام محرك الذكاء الاصطناعي في PredictPro. قارن مستوى الفريقين وسجلات المواجهات المباشرة ونسب بواسون.',
      keywords: 'محاكي مباريات كرة القدم, التنبؤ بالمباريات بالذكاء الاصطناعي, محاكاة نتائج كرة القدم',
    },
    de: {
      title: 'KI Fußball-Match-Predictor & xG-Simulator | PredictPro',
      description: 'Simulieren Sie jedes Fußballspiel mit dem benutzerdefinierten KI Match Predictor. Vergleichen Sie Form, H2H-Historie und Poisson-Tore.',
      keywords: 'fussball match simulator, ki spiel vorhersage, poisson simulation fussball',
    },
  },
  '/standings': {
    es: {
      title: 'Clasificaciones de Fútbol, Tablas de Forma y xG | PredictPro',
      description: 'Tablas de clasificación de ligas en vivo temporada 2026/27, forma local/visitante, diferenciales de goles y zonas de clasificación.',
      keywords: 'tablas de clasificacion futbol, tabla de posiciones la liga premier, forma equipos futbol',
    },
    fr: {
      title: 'Classements Foot, Tableaux de Forme et xG | PredictPro',
      description: 'Classements officiels de football saison 2026/27 en direct, forme domicile/extérieur, différence de buts et zones de qualification.',
      keywords: 'classement football en direct, tableau de forme foot, statistiques ligue 1 premier league',
    },
    pt: {
      title: 'Classificação de Ligas de Futebol, Tabelas e xG | PredictPro',
      description: 'Tabela de classificação de futebol ao vivo 2026/27, forma mandante/visitante, saldo de gols e zonas de classificação.',
      keywords: 'tabela brasileirao classificacao, classificacao futebol ao vivo, tabela premier league',
    },
    sw: {
      title: 'Msimamo wa Ligi za Soka na Majedwali ya xG | PredictPro',
      description: 'Msimamo wa ligi za soka 2026/27 moja kwa moja, matokeo ya nyumbani na ugenini, tofauti ya magoli na nafasi za kufuzu.',
      keywords: 'msimamo wa ligi kuu, msimamo wa epl, jedwali la pointi soka',
    },
    ar: {
      title: 'ترتيب دوريات كرة القدم وجداول الأداء ومعدل xG | PredictPro',
      description: 'جدول ترتيب دوريات كرة القدم لموسم 2026/27 مباشرة، أداء المباريات على الأرض وخارجها، فارق الأهداف والمراكز المؤهلة للبطولات القارية.',
      keywords: 'جدول ترتيب الدوري, ترتيب دوريات كرة القدم, ترتيب الدوري الانجليزي ودوري الابطال',
    },
    de: {
      title: 'Fußball-Tabellen, Formkurven & xG-Statistiken | PredictPro',
      description: 'Live Fußballtabellen 2026/27, Heim-/Auswärts-Form, Tordifferenzen und Qualifikationsplätze für Bundesliga, Premier League & mehr.',
      keywords: 'fussball tabellen live, bundesliga tabelle, formkurve fussball',
    },
  },
  '/accumulator': {
    es: {
      title: 'Creador de Apuestas Combinadas y Parlays de Fútbol | PredictPro',
      description: 'Crea apuestas acumuladas y combinadas de 3 a 5 selecciones con IA. Filtros de alta confianza, doble oportunidad y gestión Kelly.',
      keywords: 'apuestas combinadas futbol, parlay futbol hoy, combinada 5 selecciones, generador acca futbol',
    },
    fr: {
      title: 'Générateur de Combinés Foot & Multibet Intelligent | PredictPro',
      description: 'Créez des combinés foot intelligents de 3 à 5 sélections avec l\'IA. Filtres de haute confiance, double chance et espérance mathématique.',
      keywords: 'combine foot du jour, multibet pronostic, createur de combine foot, pari combine ia',
    },
    pt: {
      title: 'Criador de Apostas Múltiplas e Acumuladores de Futebol | PredictPro',
      description: 'Monte acumuladores inteligentes de 3 a 5 seleções com IA. Filtros de alta probabilidade, dupla chance e critério de Kelly para palpites.',
      keywords: 'acumulador de futebol hoje, aposta multipla futebol, bilhete pronto futebol, palpites multiplas',
    },
    sw: {
      title: 'Muundaji wa Treni za Ubashiri (Acca & Multibet) | PredictPro',
      description: 'Tengeneza treni za uhakika za mechi 3 hadi 5 kwa kutumia AI. Vidokezo vya Double Chance, viwango vya juu vya ushindi na usimamizi wa mtaji.',
      keywords: 'treni za kubeti leo, multibet ya uhakika, mkeka wa leo, utabiri wa treni ya soka',
    },
    ar: {
      title: 'أداة بناء الرهانات التراكمية (أكواد الأكّا) بالذكاء الاصطناعي | PredictPro',
      description: 'قم ببناء رهانات تراكمية ذكية من 3 إلى 5 مباريات باستخدام مصافي الثقة بالذكاء الاصطناعي والفرصة المزدوجة ومعادلة كيلي لتعظيم الأرباح.',
      keywords: 'رهانات تراكمية كرة القدم, بناء كود المراهنة, توقعات متعددة مباريات اليوم',
    },
    de: {
      title: 'Intelligenter Fußball-Kombiwetten-Builder & Akkumulator | PredictPro',
      description: 'Bauen Sie smarte 3er- und 5er-Kombiwetten mit KI-Konfidenzfiltern, Doppelter Chance und Kelly-Kriterium für maximale Rendite.',
      keywords: 'kombiwetten tipps heute, fussball akkumulator, mehrfachwette vorhersage, acca tipps',
    },
  },
  '/streaks': {
    es: {
      title: 'Rachas de Victorias de Fútbol y Radar Más de 2.5 / BTTS | PredictPro',
      description: 'Detecta equipos con rachas activas de victorias, partidos invictos y tendencias consecutivas de Ambos Marcan o Más de 2.5 goles.',
      keywords: 'rachas de victorias futbol, equipos invictos, tendencias goles futbol, racha ambos marcan',
    },
    fr: {
      title: 'Séries de Victoires Foot & Radar Tendances BTTS / +2.5 | PredictPro',
      description: 'Identifiez les équipes sur des séries de victoires, d\'invincibilité et de tendances consécutives Plus de 2.5 buts ou Les Deux Équipes Marquent.',
      keywords: 'series de victoires foot, equipes invaincues, tendances btts foot, series de buts',
    },
    pt: {
      title: 'Sequências de Vitórias e Radar de Tendências BTTS / +2.5 | PredictPro',
      description: 'Identifique times em sequências ativas de vitórias, invencibilidade e tendências consecutivas de Ambas Marcam ou Mais de 2.5 gols.',
      keywords: 'sequencia de vitorias futebol, times invictos, tendencias de gols, radar btts futebol',
    },
    sw: {
      title: 'Mfululizo wa Ushindi (Streaks) na Mwenendo wa Magoli | PredictPro',
      description: 'Gundua vilabu vilivyo kwenye mfululizo wa kushinda bila kufungwa, na mienendo ya mfululizo ya GG (BTTS) au Zaidi ya Magoli 2.5.',
      keywords: 'mfululizo wa ushindi soka, timu zisizofungwa, mwenendo wa magoli mengi, rekodi za timu',
    },
    ar: {
      title: 'سلسلة انتصارات الفرق ورادار اتجاهات الأهداف BTTS و+2.5 | PredictPro',
      description: 'اكتشف الأندية في سلاسل الانتصارات النشطة ومباريات عدم الهزيمة والاتجاهات المتتالية لتسجيل كلا الفريقين أو أكثر من 2.5 هدف.',
      keywords: 'سلسلة انتصارات الفرق, اندية بدون هزيمة, اتجاهات اهداف المباريات, رادار كلا الفريقين يسجلان',
    },
    de: {
      title: 'Fußball-Siegesserien & Über 2.5 / BTTS Trend-Radar | PredictPro',
      description: 'Identifizieren Sie Clubs mit aktiven Siegesserien, ungeschlagenen Läufen und Trends zu Über 2.5 Toren oder Beide Teams Treffen.',
      keywords: 'fussball siegesserien, ungeschlagen serien, form trends btts, tor serien radar',
    },
  },
  '/dropping-odds': {
    es: {
      title: 'Radar de Cuotas a la Baja y Movimientos de Dinero Inteligente | PredictPro',
      description: 'Monitoriza cuotas de fútbol en caída libre y movimientos de volumen sharp. Detecta valor de línea de cierre positivo (CLV).',
      keywords: 'cuotas a la baja futbol, dropping odds, dinero inteligente apuestas, clv futbol',
    },
    fr: {
      title: 'Radar de Chute des Cotes & Mouvements Sharp Money | PredictPro',
      description: 'Surveillez en temps réel les cotes de football en baisse et les flux d\'argent professionnel. Capturez une valeur positive de clôture (CLV).',
      keywords: 'chute des cotes foot, dropping odds en direct, argent intelligent paris, valeur de cloture clv',
    },
    pt: {
      title: 'Radar de Cotes em Queda e Movimento de Dinheiro Inteligente | PredictPro',
      description: 'Monitore em tempo real cotes de futebol em queda e movimentações de apostadores profissionais. Capture valor positivo de Closing Line (CLV).',
      keywords: 'cotes em queda futebol, dropping odds brasil, dinheiro inteligente apostas, closing line value',
    },
    sw: {
      title: 'Mwenendo wa Kushuka kwa Odds (Dropping Odds) | PredictPro',
      description: 'Fuatilia odds za mpira zinazoshuka haraka sokoni kwa wakati halisi. Gundua mwelekeo wa pesa za wataalamu na faida ya thamani (CLV).',
      keywords: 'odds zinazoshuka, dropping odds soka, mabadiliko ya odds, faida ya mapema betting',
    },
    ar: {
      title: 'رادار هبوط الاحتمالات وتحركات السيولة الذكية (Dropping Odds) | PredictPro',
      description: 'راقب هبوط احتمالات كرة القدم في الوقت الفعلي وحركات السيولة الذكية للمراهنين المحترفين لاقتناص قيمة خط الإغلاق الإيجابية (CLV).',
      keywords: 'هبوط الاحتمالات كرة القدم, تحركات السيولة الذكية, دروبينج اودز مباشر, اقتناص فروق الاسعار',
    },
    de: {
      title: 'Fallende Quoten Radar & Sharp Money Bewegungen | PredictPro',
      description: 'Echtzeit-Überwachung fallender Fußball-Quoten und Marktbewegungen. Sichern Sie sich Closing Line Value (CLV) vor dem Anpfiff.',
      keywords: 'fallende quoten fussball, dropping odds radar, sharp money wetten, closing line value',
    },
  },
  '/screener': {
    es: {
      title: 'Filtro Cuantitativo de Partidos y Escáner Multi-Factor | PredictPro',
      description: 'Filtra partidos diarios por confianza IA, Expected Goals (xG), probabilidad BTTS, Más de 2.5 y valor esperado positivo (+EV).',
      keywords: 'filtro de partidos futbol, escaner apuestas futbol, buscador de valor futbol, xg screener',
    },
    fr: {
      title: 'Scanner Quantitatif de Matchs de Foot Multi-Facteurs | PredictPro',
      description: 'Filtrez les matchs quotidiens par confiance IA, Expected Goals (xG), probabilité BTTS, Plus de 2.5 et espérance de valeur (+EV).',
      keywords: 'scanner matchs foot, filtre quantitatif paris, xg finder foot, detecteur de valeur',
    },
    pt: {
      title: 'Scanner Quantitativo de Jogos de Futebol Multi-Fator | PredictPro',
      description: 'Filtre partidas diárias por confiança da IA, Expected Goals (xG), probabilidade de BTTS, Mais de 2.5 e valor esperado positivo (+EV).',
      keywords: 'scanner de jogos futebol, filtro de apostas valor, buscador xg futebol, screener apostas',
    },
    sw: {
      title: 'Kichujio cha Kina cha Mechi za Soka (Match Screener) | PredictPro',
      description: 'Chuja mechi za soka za kila siku kwa uwezo wa AI, takwimu za Expected Goals (xG), uwezekano wa GG na magoli zaidi ya 2.5.',
      keywords: 'kichujio cha mechi za soka, mashine ya kuchagua mechi, utafutaji wa magoli mengi, ubashiri wa kitaalamu',
    },
    ar: {
      title: 'أداة الفحص الإحصائي لمباريات كرة القدم (Screener) | PredictPro',
      description: 'قم بتصفية مباريات اليوم حسب ثقة الذكاء الاصطناعي والأهداف المتوقعة xG واحتمالات كلا الفريقين يسجلان والقيمة الإيجابية (+EV).',
      keywords: 'فاحص مباريات كرة القدم, مصفي المباريات الاحصائي, اكتشاف رهانات القيمة, فلتر xG',
    },
    de: {
      title: 'Quantitativer Fußball-Match-Screener & Stats-Filter | PredictPro',
      description: 'Filtern Sie tägliche Spiele nach KI-Konfidenz, Expected Goals (xG), BTTS-Wahrscheinlichkeit, Über 2.5 Toren und +EV Kanten.',
      keywords: 'fussball match screener, wettfilter quantitativ, xg scanner fussball, value filter',
    },
  },
  '/track-record': {
    es: {
      title: 'Historial Auditado de Predicciones IA y Rentabilidad ROI | PredictPro',
      description: 'Consulta el historial verificado de aciertos de PredictPro, retorno de inversión (ROI) por ligas y rendimiento contra líneas de cierre (CLV).',
      keywords: 'historial predicciones futbol, rendimiento apuestas ia, roi pronosticos futbol, transparencia apuestas',
    },
    fr: {
      title: 'Historique Vérifié des Pronostics IA & Rendement ROI | PredictPro',
      description: 'Consultez l\'historique audité des prédictions PredictPro, le retour sur investissement (ROI) par ligue et la performance de clôture.',
      keywords: 'historique pronostics foot, bilan paris sportifs ia, taux de reussite pronos, rendement roi foot',
    },
    pt: {
      title: 'Histórico Verificado de Palpites IA e Retorno ROI | PredictPro',
      description: 'Confira o histórico auditado de precisão da PredictPro, retorno sobre investimento (ROI) por liga e desempenho de Closing Line Value.',
      keywords: 'historico de palpites futebol, taxa de acerto apostas ia, retorno sobre investimento roi, transparencia palpites',
    },
    sw: {
      title: 'Rekodi ya Ushindi ya AI na Takwimu za Faida (ROI) | PredictPro',
      description: 'Kagua rekodi ya kihistoria ya utabiri wa PredictPro, kiwango cha ushindi kwa kila ligi na faida halisi ya uwekezaji (ROI).',
      keywords: 'rekodi ya ushindi soka, historia ya ubashiri, takwimu za usahihi wa ai, faida ya kubeti',
    },
    ar: {
      title: 'السجل التاريخي الموثق لتوقعات الذكاء الاصطناعي والعائد ROI | PredictPro',
      description: 'اطلع على سجل دقة توقعات PredictPro التاريخي الموثق ومعدل العائد على الاستثمار (ROI) حسب الدوريات العالمية مع شفافية تامة.',
      keywords: 'السجل التاريخي للمراهنات, دقة توقعات الذكاء الاصطناعي, العائد على الاستثمار كرة القدم, نتائج التوقعات السابقة',
    },
    de: {
      title: 'Verifizierte KI-Vorhersagen-Historie & Rendite (ROI) | PredictPro',
      description: 'Überprüfen Sie die geprüfte historische Trefferquote von PredictPro, den ROI nach Ligen und die Performance gegen den Markt (CLV).',
      keywords: 'verifizierte wett historien, ki trefferquote fussball, roi fussball tipps, clv auswertung',
    },
  },
  '/h2h': {
    es: {
      title: 'Comparador Cara a Cara (H2H) de Equipos y Simulador Poisson | PredictPro',
      description: 'Compara dos clubes frente a frente. Historial H2H, gráficos radar de xG ofensivo y defensivo y simulaciones Poisson en tiempo real.',
      keywords: 'comparativa cara a cara futbol, h2h equipos futbol, simulador enfrentamientos futbol, historial directo futbol',
    },
    fr: {
      title: 'Comparateur Face-à-Face (H2H) Foot & Modèle Poisson | PredictPro',
      description: 'Comparez deux équipes en face-à-face. Historique H2H, graphiques radar xG attaque/défense et simulation Poisson de score.',
      keywords: 'face a face foot h2h, historique confrontations foot, comparaison equipes football, radar xg foot',
    },
    pt: {
      title: 'Comparador Confronto Direto (H2H) e Simulação Poisson | PredictPro',
      description: 'Compare dois times no confronto direto (H2H). Histórico de jogos, gráficos radar de xG e simulações de placar com Poisson.',
      keywords: 'confronto direto futebol h2h, comparativo de times futebol, historico frente a frente, radar xg times',
    },
    sw: {
      title: 'Ulinganisho wa Timu Ana kwa Ana (H2H) na Hesabu za Poisson | PredictPro',
      description: 'Linganisha timu zozote mbili ana kwa ana. Rekodi ya kihistoria ya H2H, takwimu za xG za ushambuliaji na ulinzi na matokeo ya Poisson.',
      keywords: 'ulinganisho wa timu ana kwa ana, rekodi ya h2h soka, kulinganisha vilabu, ubashiri wa timu mbili',
    },
    ar: {
      title: 'مقارنة المواجهات المباشرة (H2H) ونموذج بواسون التكتيكي | PredictPro',
      description: 'قارن بين أي ناديين في المواجهات المباشرة H2H. حلل التاريخ التنافسي ورسوم رادار الأهداف المتوقعة xG مع محاكاة بواسون.',
      keywords: 'المواجهات المباشرة h2h, مقارنة الفرق وجها لوجه, تاريخ لقاءات الفريقين, محاكاة نتائج المباريات',
    },
    de: {
      title: 'Interaktiver Head-to-Head (H2H) Team-Vergleich & Poisson-Tool | PredictPro',
      description: 'Vergleichen Sie zwei Fußballteams im direkten Vergleich. H2H-Historie, xG-Offensiv-/Defensiv-Radardiagramme und Poisson-Simulationen.',
      keywords: 'head to head vergleich fussball, h2h stats teams, direkter vergleich fussball, poisson simulation team',
    },
  },
  '/premier-league-predictions': {
    es: {
      title: 'Pronósticos Premier League Inglesa (EPL) con IA y Cuotas | PredictPro',
      description: 'Pronósticos expertos con IA para cada jornada de la Premier League. Banker 1X2, proyecciones xG, Ambos Marcan y marcador exacto.',
      keywords: 'pronosticos premier league hoy, apuestas epl ia, pronosticos futbol ingles, cuotas premier league',
    },
    fr: {
      title: 'Pronostics Premier League (EPL) par IA & Cotes de Valeur | PredictPro',
      description: 'Pronostics foot experts pour chaque journée de Premier League anglaise. Picks 1X2 banker, xG projeté, BTTS et probabilités de score.',
      keywords: 'pronostics premier league aujourdhui, pronos foot anglais epl, cotes premier league, btts epl',
    },
    pt: {
      title: 'Palpites da Premier League Inglesa (EPL) com IA | PredictPro',
      description: 'Palpites de especialistas com IA para cada rodada da Premier League. Dicas 1X2 banker, projeções de xG, Ambas Marcam e placar exato.',
      keywords: 'palpites premier league hoje, dicas campeonato ingles, palpites epl ia, cotes premier league',
    },
    sw: {
      title: 'Utabiri wa Ligi Kuu ya Uingereza (EPL) kwa AI na Odds | PredictPro',
      description: 'Utabiri wa uhakika wa kila wiki wa English Premier League (EPL). Ushindi wa 1X2, makadirio ya xG, GG (BTTS) na matokeo sahihi.',
      keywords: 'utabiri wa premier league leo, ligi kuu uingereza epl, ubashiri wa soka uingereza, odds za epl',
    },
    ar: {
      title: 'توقعات الدوري الإنجليزي الممتاز (Premier League) بالذكاء الاصطناعي | PredictPro',
      description: 'توقعات دقيقة لكل جولات الدوري الإنجليزي الممتاز. رهانات بانكر 1X2، توقعات الأهداف xG، وكلا الفريقين يسجلان مع أعلى نسب الثقة.',
      keywords: 'توقعات الدوري الانجليزي اليوم, مباريات الدوري الانجليزي الممتاز, مراهنات البريميرليج, تحليلات xG الدوري الانجليزي',
    },
    de: {
      title: 'Premier League (EPL) KI-Vorhersagen, xG-Stats & Quoten | PredictPro',
      description: 'Experten-Vorhersagen für jeden Spieltag der englischen Premier League. EPL 1X2 Banker, xG-Projektionen, BTTS-Tipps und exakte Ergebnisse.',
      keywords: 'premier league tipps heute, epl vorhersagen ki, fussball england tipps, premier league quoten',
    },
  },
  '/champions-league-predictions': {
    es: {
      title: 'Pronósticos Champions League UEFA con IA y Cuotas | PredictPro',
      description: 'Predicciones de UEFA Champions League con IA. Fase de liga de 36 equipos, eliminatorias directas, Más de 2.5 goles y cuotas de valor.',
      keywords: 'pronosticos champions league hoy, predicciones ucl ia, cuotas champions league, fase de liga champions',
    },
    fr: {
      title: 'Pronostics Ligue des Champions UEFA par IA & Cotes | PredictPro',
      description: 'Pronostics UEFA Champions League propulsés par l\'IA. Phase de ligue à 36 équipes, probabilités des matchs à élimination directe et cotes.',
      keywords: 'pronostics ligue des champions, pronos ucl aujourdhui, cotes champions league, analyse matchs ucl',
    },
    pt: {
      title: 'Palpites da UEFA Champions League com IA e Cotes | PredictPro',
      description: 'Palpites para a Liga dos Campeões da UEFA gerados por IA. Análise da fase de liga com 36 times, mata-mata e Mais de 2.5 gols.',
      keywords: 'palpites champions league hoje, palpites liga dos campeoes, ucl palpites ia, cotes champions league',
    },
    sw: {
      title: 'Utabiri wa UEFA Champions League kwa AI na Odds Bora | PredictPro',
      description: 'Utabiri wa mechi za Klabu Bingwa Ulaya (UEFA Champions League). Hatua ya ligi ya timu 36, mtoano, Zaidi ya Magoli 2.5 na odds za thamani.',
      keywords: 'utabiri wa champions league leo, klabu bingwa ulaya, ubashiri wa ucl, odds za champions league',
    },
    ar: {
      title: 'توقعات دوري أبطال أوروبا (Champions League) بالذكاء الاصطناعي | PredictPro',
      description: 'توقعات مباريات دوري أبطال أوروبا بنظام الدوري الجديد المكون من 36 فريقاً ومباريات خروج المغلوب مع تحليلات xG وأفضل الفرص.',
      keywords: 'توقعات دوري ابطال اوروبا اليوم, مباريات دوري الابطال, توقعات التشامبيونزليج, مراهنات دوري ابطال اوروبا',
    },
    de: {
      title: 'UEFA Champions League KI-Vorhersagen & K.o.-Runden Tipps | PredictPro',
      description: 'Champions League Vorhersagen mit KI. Analysieren Sie die 36-Teams-Ligaphase, K.o.-Wahrscheinlichkeiten, Über 2.5 Tore und Quoten-Kanten.',
      keywords: 'champions league tipps heute, ucl vorhersagen ki, champions league quoten, ko phase tipps ucl',
    },
  },
  '/la-liga-predictions': {
    es: {
      title: 'Pronósticos La Liga Española con IA, Cuotas y Análisis xG | PredictPro',
      description: 'Pronósticos diarios de LaLiga y análisis táctico xG. Consejos 1X2, BTTS y hándicap asiático para Real Madrid, Barcelona y Atlético.',
      keywords: 'pronosticos la liga hoy, predicciones futbol espana, cuotas real madrid barcelona, apuestas la liga ia',
    },
    fr: {
      title: 'Pronostics Liga Espagnole par IA, xG et Cotes | PredictPro',
      description: 'Pronostics quotidiens Liga espagnole et analyse tactique xG. Picks 1X2, BTTS et handicap pour le Real Madrid, Barça et Atletico.',
      keywords: 'pronostics liga espagnole, pronos real madrid barca, cotes la liga aujourdhui, paris foot espagne',
    },
    pt: {
      title: 'Palpites de La Liga Espanhola com IA, Cotes e xG | PredictPro',
      description: 'Palpites diários da La Liga espanhola e análise tática xG. Dicas 1X2, Ambas Marcam e handicap para Real Madrid, Barcelona e Atlético.',
      keywords: 'palpites la liga hoje, campeonato espanhol palpites, palpites real madrid barcelona, cotes la liga',
    },
    sw: {
      title: 'Utabiri wa La Liga ya Hispania kwa AI na Odds za Thamani | PredictPro',
      description: 'Utabiri wa kila siku wa La Liga ya Hispania na takwimu za xG. Machaguo ya 1X2, GG na Asian Handicap kwa Real Madrid na Barcelona.',
      keywords: 'utabiri wa la liga leo, ligi ya hispania soka, ubashiri wa real madrid barca, odds za la liga',
    },
    ar: {
      title: 'توقعات الدوري الإسباني (La Liga) بالذكاء الاصطناعي وإحصائيات xG | PredictPro',
      description: 'توقعات يومية لمباريات الدوري الإسباني والتحليل التكتيكي لأندية ريال مدريد وبرشلونة وأتلتيكو مدريد مع رهانات 1X2 وكلا الفريقين يسجلان.',
      keywords: 'توقعات الدوري الاسباني اليوم, مباريات ريال مدريد وبرشلونة, مراهنات لا ليغا, تحليلات الدوري الاسباني',
    },
    de: {
      title: 'Spanische La Liga KI-Vorhersagen, Vorschauen & Quoten | PredictPro',
      description: 'Tägliche La Liga Vorhersagen und taktische xG-Analysen. Real Madrid, Barcelona und Atletico Madrid 1X2, BTTS und Asian Handicap Picks.',
      keywords: 'la liga vorhersagen heute, spanien fussball tipps, real madrid barcelona quoten, la liga ki tipps',
    },
  },
  '/bundesliga-predictions': {
    es: {
      title: 'Pronósticos Bundesliga Alemana con IA y Más de 2.5 Goles | PredictPro',
      description: 'Predicciones de Bundesliga de alta cantidad de goles con IA. Expectativa Poisson, probabilidades de Más de 2.5 y picks de valor 1X2.',
      keywords: 'pronosticos bundesliga hoy, futbol aleman predicciones, mas de 2.5 goles bundesliga, cuotas bayern dortmund',
    },
    fr: {
      title: 'Pronostics Bundesliga Allemande IA & Plus de 2.5 Buts | PredictPro',
      description: 'Pronostics Bundesliga allemande à fort volume de buts par l\'IA. Espérance de buts Poisson, Plus de 2.5, BTTS et picks de valeur 1X2.',
      keywords: 'pronostics bundesliga aujourdhui, pronos foot allemagne, plus de 2.5 buts bundesliga, cotes bayern dortmund',
    },
    pt: {
      title: 'Palpites da Bundesliga Alemã com IA e Mais de 2.5 Gols | PredictPro',
      description: 'Palpites para a Bundesliga alemã de alta pontuação com IA. Expectativa de gols Poisson, Ambas Marcam e dicas de valor 1X2.',
      keywords: 'palpites bundesliga hoje, campeonato alemao palpites, mais de 2.5 gols bundesliga, cotes bayern',
    },
    sw: {
      title: 'Utabiri wa Bundesliga ya Ujerumani kwa AI na Magoli 2.5 | PredictPro',
      description: 'Utabiri wa Bundesliga ya Ujerumani yenye magoli mengi. Hesabu za Poisson za magoli, Zaidi ya 2.5, GG na machaguo ya ushindi ya 1X2.',
      keywords: 'utabiri wa bundesliga leo, ligi ya ujerumani soka, magoli zaidi ya 2.5 bundesliga, ubashiri wa bayern',
    },
    ar: {
      title: 'توقعات الدوري الألماني (Bundesliga) بالذكاء الاصطناعي وأهداف +2.5 | PredictPro',
      description: 'توقعات الدوري الألماني المعروف بغزارة الأهداف بنماذج بواسون ونسب تسجيل أكثر من 2.5 هدف ونصائح بايرن ميونخ ودورتموند.',
      keywords: 'توقعات الدوري الالماني اليوم, البوندسليغا مراهنات, توقعات بايرن ميونخ ودورتموند, اهداف اكثر من 2.5 بوندسليغا',
    },
    de: {
      title: 'Deutsche Bundesliga KI-Vorhersagen, Über 2.5 Tore & BTTS | PredictPro',
      description: 'Torreiche Bundesliga-Vorhersagen mit KI. Poisson-Torerwartung, Über 2.5 und BTTS-Wahrscheinlichkeiten für Bayern, Dortmund und Co.',
      keywords: 'bundesliga vorhersagen heute, bundesliga tipps uber 2.5, bayern dortmund tipps, bundesliga wettquoten',
    },
  },
  '/serie-a-predictions': {
    es: {
      title: 'Pronósticos Serie A Italiana con IA, xGA Defensivo y 1X2 | PredictPro',
      description: 'Predicciones de Serie A italiana combinando métricas defensivas xGA, análisis de bloque bajo y selecciones de valor Empate No Apuesta.',
      keywords: 'pronosticos serie a hoy, futbol italia predicciones, cuotas inter juventus milan, empate no apuesta italia',
    },
    fr: {
      title: 'Pronostics Serie A Italienne par IA, xGA et Cotes 1X2 | PredictPro',
      description: 'Pronostics Serie A italienne combinant Expected Goals concédés (xGA), métriques tactiques défensives et paris Remboursé si Match Nul.',
      keywords: 'pronostics serie a italienne, pronos foot italie, cotes juve inter milan, stats def serie a',
    },
    pt: {
      title: 'Palpites da Serie A Italiana com IA, xGA e Dicas 1X2 | PredictPro',
      description: 'Palpites da Serie A italiana combinando xGA defensivo, blocos táticos baixos e linhas de valor de Empate Anula a Aposta.',
      keywords: 'palpites serie a italia, campeonato italiano palpites, dicas inter juventus milan, cotes serie a',
    },
    sw: {
      title: 'Utabiri wa Serie A ya Italia kwa AI na Takwimu za Ulinzi | PredictPro',
      description: 'Utabiri wa Serie A ya Italia inayochanganya takwimu za ulinzi (xGA), mbinu za kiufundi na machaguo ya thamani ya Draw No Bet.',
      keywords: 'utabiri wa serie a leo, ligi kuu ya italia soka, ubashiri wa juventus inter milan, odds za serie a',
    },
    ar: {
      title: 'توقعات الدوري الإيطالي (Serie A) بالذكاء الاصطناعي والإحصائيات الدفاعية | PredictPro',
      description: 'توقعات الدوري الإيطالي مع التركيز على معدلات الأهداف المتوقعة المستقبلة (xGA) والتحصينات الدفاعية مع رهانات التعادل لاغي (DNB).',
      keywords: 'توقعات الدوري الايطالي اليوم, مباريات الكالتشيو, مراهنات يوفنتوس وانتر ميلان, تحليلات السيريا اي',
    },
    de: {
      title: 'Italienische Serie A KI-Vorhersagen, xGA & 1X2 Tipps | PredictPro',
      description: 'Serie A Vorhersagen mit defensiven Expected Goals Against (xGA), Taktik-Metriken und Draw No Bet Value-Lines für Inter, Juve und Milan.',
      keywords: 'serie a tipps heute, italien fussball vorhersagen, inter juventus quoten, draw no bet serie a',
    },
  },
  '/kpl-predictions': {
    es: {
      title: 'Pronósticos FKF Premier League de Kenia (KPL) | PredictPro',
      description: 'Predicciones oficiales con IA de la FKF Premier League de Kenia: Gor Mahia, AFC Leopards, Tusker FC y Kenya Police FC.',
      keywords: 'pronosticos kpl kenia, futbol kenia predicciones, gor mahia leopards pronostico, apuestas kpl',
    },
    fr: {
      title: 'Pronostics Kenya Premier League (KPL) par IA | PredictPro',
      description: 'Pronostics officiels FKF Kenya Premier League couvrant Gor Mahia, AFC Leopards, Tusker FC et Kenya Police avec cotes locales.',
      keywords: 'pronostics kpl kenya, foot kenyan pronos, gor mahia afc leopards, cotes kpl',
    },
    pt: {
      title: 'Palpites da Kenya Premier League (KPL) com IA | PredictPro',
      description: 'Palpites da FKF Kenya Premier League cobrindo Gor Mahia, AFC Leopards, Tusker FC e Kenya Police FC com estatísticas xG.',
      keywords: 'palpites kpl quenia, futebol quenia palpites, gor mahia leopards, cotes kpl',
    },
    sw: {
      title: 'Utabiri wa Ligi Kuu ya Kenya (FKF KPL) na M-Pesa | PredictPro',
      description: 'Utabiri rasmi wa FKF Kenya Premier League unaohusu Gor Mahia, AFC Leopards, Tusker FC na Kenya Police kwa uhakika wa AI na M-Pesa.',
      keywords: 'utabiri wa kpl kenya leo, ligi kuu ya kenya fkf, ubashiri wa gor mahia leopards, betika sportpesa kpl',
    },
    ar: {
      title: 'توقعات الدوري الكيني الممتاز (FKF KPL) بالذكاء الاصطناعي | PredictPro',
      description: 'توقعات رسمية للدوري الكيني الممتاز تغطي جور ماهيا وليوباردز وتوسكر مع تحليلات تكتيكية وإحصائيات دقيقة.',
      keywords: 'توقعات الدوري الكيني, مباريات جور ماهيا وليوباردز, كورة كينيا اليوم, توقعات kpl',
    },
    de: {
      title: 'Kenia Premier League (KPL) KI-Vorhersagen & Form | PredictPro',
      description: 'Offizielle FKF Kenia Premier League Vorhersagen für Gor Mahia, AFC Leopards, Tusker FC und Kenya Police FC mit xG-Werten.',
      keywords: 'kpl kenia tipps, gor mahia vorhersage, afrikanischer fussball kpl, kpl quoten',
    },
  },
  '/jackpot-predictions': {
    es: {
      title: 'Predicciones SportPesa Mega Jackpot y Betika con IA | PredictPro',
      description: 'Pronósticos matemáticos de 17 partidos para SportPesa Mega Jackpot y Betika Grand. Bankers de IA y coberturas de Doble Oportunidad.',
      keywords: 'predicciones sportpesa mega jackpot, jackpot 17 partidos, betika jackpot pronosticos, combinaciones jackpot',
    },
    fr: {
      title: 'Pronostics Jackpot SportPesa (17 Matchs) & Betika par IA | PredictPro',
      description: 'Pronostics mathématiques du Mega Jackpot SportPesa 17 matchs et Betika Grand. Sélections banker IA et combinaisons double chance.',
      keywords: 'pronostics jackpot sportpesa 17 matchs, betika grand jackpot pronos, bankers jackpot ia, combinaisons jackpot',
    },
    pt: {
      title: 'Palpites do SportPesa Mega Jackpot e Betika com IA | PredictPro',
      description: 'Previsões matemáticas para o SportPesa Mega Jackpot de 17 jogos e Betika Grand. Seleções banker de IA e combinações de dupla chance.',
      keywords: 'palpites sportpesa mega jackpot, jackpot 17 jogos palpites, betika jackpot dicas, combinacoes duplas jackpot',
    },
    sw: {
      title: 'Utabiri wa SportPesa Mega Jackpot (Mechi 17) na Betika | PredictPro',
      description: 'Utabiri wa hisabati wa mechi 17 za SportPesa Mega Jackpot na Betika Grand Jackpot. Pata mechi za uhakika (bankers) na machaguo ya Double Chance.',
      keywords: 'utabiri wa sportpesa mega jackpot mechi 17, betika midweek jackpot tips, mbinu za kushinda jackpot, mikeka ya jackpot',
    },
    ar: {
      title: 'توقعات الجاكبوت الكبرى (SportPesa 17 مباراة وباتيكا) بالذكاء الاصطناعي | PredictPro',
      description: 'توقعات رياضية محسوبة لجاكبوت سبورت بيسا المكون من 17 مباراة وجاكبوت باتيكا مع خيارات البانكر المؤكدة وفرص التغطية المزدوجة.',
      keywords: 'توقعات الجاكبوت 17 مباراة, جاكبوت سبورت بيسا, توقعات باتيكا الكبرى, تذاكر الجاكبوت الذكية',
    },
    de: {
      title: 'SportPesa Mega Jackpot (17 Spiele) & Betika KI-Tipps | PredictPro',
      description: 'Mathematische 17-Spiele-Jackpot-Vorhersagen für SportPesa Mega Jackpot und Betika. KI-Banker und optimale Doppelte-Chance-Kombinationen.',
      keywords: 'sportpesa mega jackpot tipps 17 spiele, betika jackpot vorhersagen, jackpot banker kombis, toto jackpot tipps',
    },
  },
  '/world-cup-predictions': {
    es: {
      title: 'Pronósticos Copa Mundial FIFA 2026 y Clasificatorias | PredictPro',
      description: 'Predicciones con IA para las eliminatorias y torneo de la Copa Mundial FIFA 2026. Clasificaciones Elo internacionales y avance de grupos.',
      keywords: 'pronosticos mundial 2026, eliminatorias copa mundial fifa, cuotas campeon mundial 2026, predicciones selecciones fifa',
    },
    fr: {
      title: 'Pronostics Coupe du Monde FIFA 2026 & Qualifications | PredictPro',
      description: 'Pronostics éliminatoires et tournoi Coupe du Monde FIFA 2026. Classements Elo internationaux, chances de qualification et cotes.',
      keywords: 'pronostics coupe du monde 2026, qualifications mondial fifa, cotes vainqueur coupe du monde, pronos matchs internationaux',
    },
    pt: {
      title: 'Palpites da Copa do Mundo FIFA 2026 e Eliminatórias | PredictPro',
      description: 'Palpites com IA para as eliminatórias e jogos da Copa do Mundo FIFA 2026. Ratings Elo internacionais e chances de avanço na fase de grupos.',
      keywords: 'palpites copa do mundo 2026, eliminatorias copa do mundo fifa, cotes campeao mundial 2026, selecoes fifa palpites',
    },
    sw: {
      title: 'Utabiri wa Kombe la Dunia la FIFA 2026 na Mechi za Kufuzu | PredictPro',
      description: 'Utabiri wa mechi za kufuzu na fainali za Kombe la Dunia la FIFA 2026. Viwango vya Elo vya kimataifa, nafasi za makundi na odds za mechi.',
      keywords: 'utabiri wa kombe la dunia 2026, mechi za kufuzu world cup, ubashiri wa timu za taifa, odds za kombe la dunia',
    },
    ar: {
      title: 'توقعات كأس العالم 2026 والتصفيات الدولية بالذكاء الاصطناعي | PredictPro',
      description: 'توقعات تصفيات ونهائيات كأس العالم 2026. استكشف تصنيفات إيلو الدولية واحتمالات التأهل من دور المجموعات مع تحليلات الذكاء الاصطناعي.',
      keywords: 'توقعات كاس العالم 2026, تصفيات كاس العالم, مراهنات بطل كاس العالم, توقعات مباريات المنتخبات',
    },
    de: {
      title: 'FIFA WM 2026 Vorhersagen, Qualifikation & Quoten | PredictPro',
      description: 'KI-Vorhersagen für die FIFA Fußball-Weltmeisterschaft 2026 und Qualifikation. Internationale Elo-Ratings und Gruppensieg-Chancen.',
      keywords: 'fifa wm 2026 tipps, wm qualifikation vorhersagen, weltmeister 2026 quoten, laenderspiele wetten',
    },
  },
  '/afcon-predictions': {
    es: {
      title: 'Pronósticos Copa Africana de Naciones (AFCON) y CAF | PredictPro',
      description: 'Predicciones de Copa Africana de Naciones (AFCON) y Liga de Campeones CAF. Métricas de altitud, tendencias Menos de 2.5 y cuotas africanas.',
      keywords: 'pronosticos afcon copa africa, caf champions league pronosticos, futbol africano apuestas, cuotas afcon hoy',
    },
    fr: {
      title: 'Pronostics CAN (AFCON) & Ligue des Champions CAF par IA | PredictPro',
      description: 'Pronostics Coupe d\'Afrique des Nations (CAN) et Ligue des Champions CAF. Impact de l\'altitude, tendances Moins de 2.5 buts et cotes.',
      keywords: 'pronostics can afcon, ligue des champions caf pronos, paris foot africain, cotes can aujourdhui',
    },
    pt: {
      title: 'Palpites da Copa Africana de Nações (CAN / AFCON) e CAF | PredictPro',
      description: 'Palpites para a Copa Africana de Nações (CAN/AFCON) e Liga dos Campeões da CAF. Fator altitude, tendências de Menos de 2.5 gols e cotes.',
      keywords: 'palpites can afcon, caf champions league palpites, futebol africano dicas, cotes can hoje',
    },
    sw: {
      title: 'Utabiri wa AFCON (Kombe la Mataifa ya Afrika) na CAF | PredictPro',
      description: 'Utabiri wa Kombe la Mataifa ya Afrika (AFCON) na CAF Champions League. Athari za viwanja vya nyumbani, mwenendo wa Under 2.5 na odds bora.',
      keywords: 'utabiri wa afcon leo, kombe la mataifa ya afrika, caf champions league ubashiri, odds za afcon',
    },
    ar: {
      title: 'توقعات كأس أمم إفريقيا (AFCON) ودوري أبطال إفريقيا (CAF) | PredictPro',
      description: 'توقعات كأس الأمم الإفريقية ودوري أبطال إفريقيا بنماذج الذكاء الاصطناعي. تأثير الارتفاع عن سطح البحر واتجاهات أقل من 2.5 هدف.',
      keywords: 'توقعات كاس امم افريقيا اليوم, دوري ابطال افريقيا مباريات, مراهنات الكان afcon, توقعات الاندية الافريقية',
    },
    de: {
      title: 'Afrika-Cup (AFCON) & CAF Champions League KI-Tipps | PredictPro',
      description: 'Afrika Cup of Nations (AFCON) und CAF Champions League Vorhersagen. Höhen-Metriken, torarme Unter 2.5 Trends und afrikanische Clubquoten.',
      keywords: 'afcon tipps heute, afrika cup vorhersagen, caf champions league tipps, afrikanischer fussball quoten',
    },
  },
  '/responsible-gaming': {
    es: {
      title: 'Juego Responsable, Protección de Menores 18+ y Aviso Legal | PredictPro',
      description: 'Política de juego responsable de PredictPro, protección de menores 18+, líneas internacionales de ayuda y descargo informativo de estadísticas.',
      keywords: 'juego responsable apuestas, proteccion de menores 18+, ayuda ludopatia internacional, descargo estadistico futbol',
    },
    fr: {
      title: 'Jeu Responsable, Protection des Mineurs 18+ & Mentions | PredictPro',
      description: 'Politique de jeu responsable de PredictPro, protection des mineurs 18+, lignes d\'assistance internationales et avertissement informatif.',
      keywords: 'jeu responsable paris, interdiction mineurs 18+, aide jeu compulsif, avertissement statistiques foot',
    },
    pt: {
      title: 'Jogo Responsável, Proteção de Menores 18+ e Termos | PredictPro',
      description: 'Política de jogo responsável da PredictPro, proteção para maiores de 18 anos, linhas de apoio internacional e aviso de dados informativos.',
      keywords: 'jogo responsavel apostas, restricao 18 anos apostas, apoio ao jogador internacional, aviso legal dados futebol',
    },
    sw: {
      title: 'Uchezaji wa Kistaarabu (Responsible Gaming) na Umri wa 18+ | PredictPro',
      description: 'Sera ya uchezaji wa kistaarabu ya PredictPro, ulinzi wa watoto chini ya miaka 18, nambari za usaidizi na kanusho la takwimu za michezo.',
      keywords: 'uchezaji wa kistaarabu, umri wa miaka 18 na zaidi, msaada wa kuzuia uraibu wa kubeti, kanusho la takwimu za soka',
    },
    ar: {
      title: 'سياسة الألعاب المسؤولة، حماية القاصرين 18+ وإخلاء المسؤولية | PredictPro',
      description: 'سياسة المقامرة المسؤولة في PredictPro، معايير حماية القاصرين 18+، خطوط المساعدة الدولية وإخلاء المسؤولية الإحصائية والمعلوماتية.',
      keywords: 'القمار المسؤول, حماية القاصرين 18+, خطوط المساعدة الدولية للمقامرة, اخلاء المسؤولية القانونية',
    },
    de: {
      title: 'Verantwortungsvolles Spielen, 18+ Jugendschutz & Disclaimer | PredictPro',
      description: 'PredictPro Richtlinien für verantwortungsvolles Spielen, Jugendschutz ab 18 Jahren, internationale Hilfshotlines und Informationshinweis.',
      keywords: 'verantwortungsvolles spielen, 18+ jugendschutz wetten, hilfe bei spielsucht, informationshinweis sportwetten',
    },
  },
};

/**
 * Dynamically constructs natural, search-engine-optimized descriptions in the target language
 * even for custom routes, dynamic routes, or blog articles without explicit translation records.
 */
export function generateFallbackLocalizedDescription(
  canonicalPath: string,
  lang: SupportedLanguage,
  fallbackEnglishDescription: string,
  title?: string
): string {
  const cleanTitle = (title || '')
    .replace(/\s*[|—-]\s*PredictPro.*$/i, '')
    .trim();

  switch (lang) {
    case 'es':
      return normalizeSEODescription(
        `Pronósticos de fútbol con IA para ${cleanTitle || 'partidos de hoy'}. Estadísticas xG, modelos Poisson y cuotas con valor esperado positivo (+EV).`,
        'es'
      );
    case 'fr':
      return normalizeSEODescription(
        `Pronostics foot IA pour ${cleanTitle || 'les matchs du jour'}. Analyses xG avancées, matrice Poisson et cotes de valeur vérifiées.`,
        'fr'
      );
    case 'pt':
      return normalizeSEODescription(
        `Palpites de futebol com IA para ${cleanTitle || 'jogos de hoje'}. Estatísticas xG detalhadas, probabilidades Poisson e apostas de valor.`,
        'pt'
      );
    case 'sw':
      return normalizeSEODescription(
        `Utabiri wa mechi za mpira kwa AI wa ${cleanTitle || 'mechi za leo'}. Takwimu za xG, uwezekano wa Poisson na odds za uhakika.`,
        'sw'
      );
    case 'ar':
      return normalizeSEODescription(
        `توقعات مباريات كرة القدم بالذكاء الاصطناعي لـ ${cleanTitle || 'مباريات اليوم'}. إحصائيات الأهداف المتوقعة xG ونموذج بواسون لأفضل الرهانات.`,
        'ar'
      );
    case 'de':
      return normalizeSEODescription(
        `KI Fußball-Vorhersagen für ${cleanTitle || 'heutige Spiele'}. Detaillierte xG-Statistiken, Poisson-Wahrscheinlichkeiten und Value Bets.`,
        'de'
      );
    case 'en':
    default:
      return normalizeSEODescription(fallbackEnglishDescription, 'en');
  }
}

/**
 * Detects the user's preferred language and locale profile for SEO localization
 */
export function resolveUserLocale(): UserLocaleProfile {
  if (typeof window === 'undefined') {
    return {
      lang: 'en',
      locale: 'en-US',
      isRTL: false,
      ogLocale: 'en_US',
      isNonEnglish: false,
      source: 'fallback',
    };
  }

  // 1. Check URL query parameters (?lang=es, ?locale=es-ES, ?hl=fr, etc.)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const queryLang = searchParams.get('lang') || searchParams.get('locale') || searchParams.get('hl');
    if (queryLang) {
      const lower = queryLang.toLowerCase();
      const code = lower.split('-')[0].split('_')[0] as SupportedLanguage;
      if (['en', 'sw', 'fr', 'es', 'pt', 'ar', 'de'].includes(code)) {
        return {
          lang: code,
          locale: queryLang,
          isRTL: code === 'ar',
          ogLocale: getOgLocaleForLang(code, queryLang),
          isNonEnglish: code !== 'en',
          source: 'query_param',
        };
      }
    }
  } catch {}

  // 2. Check user explicit preference from localStorage
  try {
    const rawPrefs = localStorage.getItem('predictpro_user_preferences_v2');
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs);
      if (parsed?.language && ['en', 'sw', 'fr', 'es', 'pt', 'ar', 'de'].includes(parsed.language)) {
        const code = parsed.language as SupportedLanguage;
        return {
          lang: code,
          locale: code,
          isRTL: code === 'ar',
          ogLocale: getOgLocaleForLang(code, code),
          isNonEnglish: code !== 'en',
          source: 'preferences',
        };
      }
    }

    const saved = localStorage.getItem('predictpro_language') || localStorage.getItem('i18nextLng');
    if (saved) {
      const code = saved.toLowerCase().split('-')[0].split('_')[0] as SupportedLanguage;
      if (['en', 'sw', 'fr', 'es', 'pt', 'ar', 'de'].includes(code)) {
        return {
          lang: code,
          locale: saved,
          isRTL: code === 'ar',
          ogLocale: getOgLocaleForLang(code, saved),
          isNonEnglish: code !== 'en',
          source: 'stored_lang',
        };
      }
    }
  } catch {}

  // 3. Check navigator.languages / navigator.language
  try {
    const rawLocales = (navigator.languages && navigator.languages.length > 0)
      ? navigator.languages
      : [navigator.language || 'en'];

    for (const raw of rawLocales) {
      if (!raw) continue;
      const lower = raw.toLowerCase();
      const code = lower.split('-')[0].split('_')[0] as SupportedLanguage;
      if (['sw', 'fr', 'es', 'pt', 'ar', 'de', 'en'].includes(code)) {
        return {
          lang: code,
          locale: raw,
          isRTL: code === 'ar',
          ogLocale: getOgLocaleForLang(code, raw),
          isNonEnglish: code !== 'en',
          source: 'navigator',
        };
      }
    }
  } catch {}

  // 4. Geolocation & Timezone heuristics via geoRegionService
  try {
    const geo = detectUserGeographicRegion();
    const tz = geo.detectedTimezone || '';
    if (geo.regionId === 'east_africa' && (tz.includes('Nairobi') || tz.includes('Dar_es_Salaam'))) {
      return {
        lang: 'sw',
        locale: 'sw-KE',
        isRTL: false,
        ogLocale: 'sw_KE',
        isNonEnglish: true,
        source: 'geo_region',
      };
    }
    if (geo.regionId === 'latin_america') {
      if (tz.includes('Sao_Paulo') || tz.includes('Fortaleza') || tz.includes('Recife') || tz.includes('Manaus')) {
        return {
          lang: 'pt',
          locale: 'pt-BR',
          isRTL: false,
          ogLocale: 'pt_BR',
          isNonEnglish: true,
          source: 'geo_region',
        };
      }
      return {
        lang: 'es',
        locale: 'es-MX',
        isRTL: false,
        ogLocale: 'es_MX',
        isNonEnglish: true,
        source: 'geo_region',
      };
    }
    if (geo.regionId === 'north_africa_middle_east') {
      return {
        lang: 'ar',
        locale: 'ar-SA',
        isRTL: true,
        ogLocale: 'ar_SA',
        isNonEnglish: true,
        source: 'geo_region',
      };
    }
    if (tz.includes('Madrid')) {
      return { lang: 'es', locale: 'es-ES', isRTL: false, ogLocale: 'es_ES', isNonEnglish: true, source: 'geo_region' };
    }
    if (tz.includes('Paris')) {
      return { lang: 'fr', locale: 'fr-FR', isRTL: false, ogLocale: 'fr_FR', isNonEnglish: true, source: 'geo_region' };
    }
    if (tz.includes('Berlin') || tz.includes('Vienna') || tz.includes('Zurich')) {
      return { lang: 'de', locale: 'de-DE', isRTL: false, ogLocale: 'de_DE', isNonEnglish: true, source: 'geo_region' };
    }
    if (tz.includes('Lisbon')) {
      return { lang: 'pt', locale: 'pt-PT', isRTL: false, ogLocale: 'pt_PT', isNonEnglish: true, source: 'geo_region' };
    }
  } catch {}

  return {
    lang: 'en',
    locale: 'en-US',
    isRTL: false,
    ogLocale: 'en_US',
    isNonEnglish: false,
    source: 'fallback',
  };
}

function getOgLocaleForLang(lang: SupportedLanguage, rawLocale: string): string {
  const norm = rawLocale.toLowerCase();
  if (lang === 'es') {
    if (norm.includes('mx')) return 'es_MX';
    if (norm.includes('ar')) return 'es_AR';
    if (norm.includes('co')) return 'es_CO';
    if (norm.includes('cl')) return 'es_CL';
    return 'es_ES';
  }
  if (lang === 'pt') {
    if (norm.includes('br')) return 'pt_BR';
    if (norm.includes('ao')) return 'pt_AO';
    if (norm.includes('mz')) return 'pt_MZ';
    return 'pt_PT';
  }
  if (lang === 'fr') {
    if (norm.includes('ca')) return 'fr_CA';
    if (norm.includes('sn')) return 'fr_SN';
    if (norm.includes('ci')) return 'fr_CI';
    if (norm.includes('cd')) return 'fr_CD';
    if (norm.includes('cm')) return 'fr_CM';
    if (norm.includes('ma')) return 'fr_MA';
    return 'fr_FR';
  }
  if (lang === 'sw') {
    if (norm.includes('tz')) return 'sw_TZ';
    return 'sw_KE';
  }
  if (lang === 'ar') {
    if (norm.includes('eg')) return 'ar_EG';
    if (norm.includes('ae')) return 'ar_AE';
    if (norm.includes('ma')) return 'ar_MA';
    return 'ar_SA';
  }
  if (lang === 'de') {
    if (norm.includes('at')) return 'de_AT';
    if (norm.includes('ch')) return 'de_CH';
    return 'de_DE';
  }
  if (norm.includes('gb') || norm.includes('uk')) return 'en_GB';
  if (norm.includes('ke')) return 'en_KE';
  if (norm.includes('ng')) return 'en_NG';
  if (norm.includes('za')) return 'en_ZA';
  if (norm.includes('gh')) return 'en_GH';
  if (norm.includes('tz')) return 'en_TZ';
  if (norm.includes('ug')) return 'en_UG';
  if (norm.includes('in')) return 'en_IN';
  if (norm.includes('ca')) return 'en_CA';
  if (norm.includes('au')) return 'en_AU';
  return 'en_US';
}

function getLocalizedMatchPredictionSEO(
  matchSeo: ResolvedMatchSEOData,
  lang: SupportedLanguage
): { title: string; description: string; keywords: string } {
  const h = matchSeo.homeTeam;
  const a = matchSeo.awayTeam;
  const l = matchSeo.league;

  if (lang === 'es') {
    return {
      title: `${h} vs ${a} Predicción IA, Estadísticas xG y Cuotas`,
      description: `Pronóstico de fútbol para ${h} vs ${a} en ${l}. Análisis de goles esperados xG, matriz Poisson de resultado exacto y cuotas con valor.`,
      keywords: `${h.toLowerCase()} vs ${a.toLowerCase()} prediccion, pronostico ${h.toLowerCase()} ${a.toLowerCase()}, cuotas ${l.toLowerCase()}, resultado exacto futbol`,
    };
  }
  if (lang === 'fr') {
    return {
      title: `${h} vs ${a} Pronostic Foot IA, Stats xG et Cotes`,
      description: `Pronostic foot pour ${h} vs ${a} en ${l}. Statistiques Expected Goals (xG), scores exacts Poisson et cotes de valeur vérifiées.`,
      keywords: `pronostic ${h.toLowerCase()} ${a.toLowerCase()}, cotes ${h.toLowerCase()} vs ${a.toLowerCase()}, stats xg ${l.toLowerCase()}`,
    };
  }
  if (lang === 'pt') {
    return {
      title: `${h} vs ${a} Palpite IA, Estatísticas xG e Cotes`,
      description: `Palpite de futebol para ${h} vs ${a} no ${l}. Análise quantitativa de gols xG, placar exato Poisson e apostas de valor.`,
      keywords: `palpite ${h.toLowerCase()} vs ${a.toLowerCase()}, prognostico ${h.toLowerCase()} ${a.toLowerCase()}, cotes ${l.toLowerCase()}`,
    };
  }
  if (lang === 'sw') {
    return {
      title: `${h} vs ${a} Utabiri wa Mechi kwa AI na Takwimu za xG`,
      description: `Utabiri wa mechi ya mpira wa miguu kwa ${h} dhidi ya ${a} katika ${l}. Takwimu za xG, odds za uhakika na matokeo sahihi ya Poisson.`,
      keywords: `utabiri wa ${h.toLowerCase()} dhidi ya ${a.toLowerCase()}, odds za ${h.toLowerCase()} vs ${a.toLowerCase()}, ubashiri wa soka`,
    };
  }
  if (lang === 'ar') {
    return {
      title: `توقعات مباراة ${h} ضد ${a} بالذكاء الاصطناعي وإحصائيات xG`,
      description: `تحليل وتوقعات مباراة ${h} ضد ${a} في ${l}. إحصائيات الأهداف المتوقعة (xG) ونموذج بواسون للنتيجة الدقيقة وأفضل الرهانات.`,
      keywords: `توقعات مباراة ${h} و ${a}, تحليل مباراة ${h} ضد ${a}, احصائيات xG ${l}`,
    };
  }
  if (lang === 'de') {
    return {
      title: `${h} vs ${a} KI Fußball-Vorhersage, xG & Quoten`,
      description: `Fußball-Vorhersage für ${h} gegen ${a} in der ${l}. Bivariate Poisson-Ergebnis-Matrix, Expected Goals (xG) Analyse und Value Bets.`,
      keywords: `${h.toLowerCase()} vs ${a.toLowerCase()} tipp, vorhersage ${h.toLowerCase()} gegen ${a.toLowerCase()}, quoten ${l.toLowerCase()}`,
    };
  }

  return {
    title: matchSeo.seoTitle,
    description: matchSeo.seoDescription,
    keywords: matchSeo.keywords,
  };
}
function upsertMetaTag(attrName: 'name' | 'property' | 'http-equiv', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  const all = Array.from(
    document.head.querySelectorAll(`meta[${attrName}="${attrValue}"]`)
  ) as HTMLMetaElement[];
  let el = all[0] || null;
  if (all.length > 1) {
    for (let i = 1; i < all.length; i++) {
      all[i].remove();
    }
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  if (el.getAttribute('content') !== content) {
    el.setAttribute('content', content);
  }
}

/**
 * Helper to upsert a single deduplicated <link> tag in document.head
 */
function upsertLinkTag(rel: string, href: string, hreflang?: string) {
  if (typeof document === 'undefined') return;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  const all = Array.from(document.head.querySelectorAll(selector)) as HTMLLinkElement[];
  let el = all[0] || null;
  if (all.length > 1) {
    for (let i = 1; i < all.length; i++) {
      all[i].remove();
    }
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) {
      el.setAttribute('hreflang', hreflang);
    }
    document.head.appendChild(el);
  }
  if (el.getAttribute('href') !== href) {
    el.setAttribute('href', href);
  }
}

/**
 * Dynamically manages and synchronizes <title>, meta description, OpenGraph tags,
 * Twitter Cards, canonical URLs, and JSON-LD structured data based on the active route.
 */
export function useSEOManager(options: SEOManagerOptions = {}): ResolvedSEOMetadata {
  const location = useLocation();
  const activePathname = location.pathname || '/';

  // Reactive locale state to handle URL changes, storage events, or preference updates
  const [userLocale, setUserLocale] = useState<UserLocaleProfile>(() => resolveUserLocale());

  useEffect(() => {
    setUserLocale(resolveUserLocale());
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocaleChange = () => {
      setUserLocale(resolveUserLocale());
    };

    window.addEventListener('storage', handleLocaleChange);
    window.addEventListener('popstate', handleLocaleChange);
    window.addEventListener('predictpro:language_change', handleLocaleChange);

    return () => {
      window.removeEventListener('storage', handleLocaleChange);
      window.removeEventListener('popstate', handleLocaleChange);
      window.removeEventListener('predictpro:language_change', handleLocaleChange);
    };
  }, []);

  const resolved = useMemo<ResolvedSEOMetadata>(() => {
    const routeDefaults = resolveDynamicRouteConfig(activePathname);

    // Automatically detect individual match prediction pages (/predict/:matchSlug or /match/:matchSlug)
    // or explicit matchPrediction passed via <SEO matchPrediction={...} />
    const isMatchPredictionRoute =
      Boolean(options.matchPrediction) ||
      /^\/(?:predict|match)\/[^/]+$/i.test(activePathname.replace(/\/+$/, ''));

    const matchSeo = isMatchPredictionRoute
      ? resolveMatchPredictionForSEO(
          options.canonical || activePathname,
          options.matchPrediction
        )
      : null;

    const rawCanonicalPath =
      options.canonical || matchSeo?.canonicalPath || routeDefaults.canonicalPath || activePathname;
    const canonicalPath = rawCanonicalPath.startsWith('/') ? rawCanonicalPath : `/${rawCanonicalPath}`;
    const canonicalUrl = rawCanonicalPath.startsWith('http')
      ? rawCanonicalPath
      : `${BASE_URL}${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '')}`;

    // Compute multi-lingual localized descriptions for all supported languages
    const supportedLangs: SupportedLanguage[] = ['en', 'sw', 'fr', 'es', 'pt', 'ar', 'de'];
    const localizedDescriptionsByLang: Record<SupportedLanguage, string> = {
      en: normalizeSEODescription(routeDefaults.description, 'en'),
      sw: '',
      fr: '',
      es: '',
      pt: '',
      ar: '',
      de: '',
    };

    for (const l of supportedLangs) {
      if (l === 'en') continue;
      const routeDesc = LOCALIZED_ROUTE_METADATA[canonicalPath]?.[l]?.description;
      const matchDesc = matchSeo ? getLocalizedMatchPredictionSEO(matchSeo, l).description : '';
      localizedDescriptionsByLang[l] = normalizeSEODescription(
        matchDesc ||
          routeDesc ||
          generateFallbackLocalizedDescription(
            canonicalPath,
            l,
            routeDefaults.description,
            routeDefaults.title
          ),
        l
      );
    }

    // Dynamic localized metadata resolution for detected non-English speaking regions
    const localizedMatch =
      matchSeo && userLocale.lang !== 'en'
        ? getLocalizedMatchPredictionSEO(matchSeo, userLocale.lang)
        : null;

    const routeLocalized =
      userLocale.lang !== 'en'
        ? LOCALIZED_ROUTE_METADATA[canonicalPath]?.[userLocale.lang]
        : null;

    const rawTitle =
      options.title ||
      localizedMatch?.title ||
      routeLocalized?.title ||
      matchSeo?.seoTitle ||
      routeDefaults.title;

    const candidateTitle = rawTitle.includes('PredictPro')
      ? rawTitle
      : rawTitle.length + 13 <= 60
        ? `${rawTitle} | PredictPro`
        : rawTitle;
    const fullTitle = normalizeSEOTitle(candidateTitle);

    const rawDescription =
      options.description ||
      localizedMatch?.description ||
      routeLocalized?.description ||
      (userLocale.lang !== 'en'
        ? generateFallbackLocalizedDescription(
            canonicalPath,
            userLocale.lang,
            routeDefaults.description,
            routeDefaults.title
          )
        : matchSeo?.seoDescription || routeDefaults.description);
    const webPageDescription = normalizeSEODescription(rawDescription, userLocale.lang);
    const description = webPageDescription;

    const image = options.image || DEFAULT_IMAGE;
    const type = options.type || (matchSeo ? 'article' : routeDefaults.type) || 'website';
    const keywords =
      options.keywords ||
      localizedMatch?.keywords ||
      routeLocalized?.keywords ||
      matchSeo?.keywords ||
      routeDefaults.keywords;
    const noIndex = options.noIndex ?? routeDefaults.noIndex ?? false;

    const breadcrumbs =
      options.breadcrumbs && options.breadcrumbs.length > 0
        ? options.breadcrumbs
        : deriveRouteBreadcrumbs(canonicalPath, fullTitle);

    const hreflangLinks: Array<{ hreflang: string; href: string }> = GLOBAL_HREFLANGS.map(
      (langCode) => ({
        hreflang: langCode,
        href: buildHreflangUrl(canonicalUrl, langCode),
      })
    );

    // If the detected locale has a specific regional tag (e.g. sw-KE, es-MX) not explicitly in GLOBAL_HREFLANGS,
    // guarantee self-referential hreflang tag is present
    if (
      userLocale.locale &&
      !GLOBAL_HREFLANGS.includes(userLocale.locale) &&
      userLocale.locale !== userLocale.lang
    ) {
      hreflangLinks.push({
        hreflang: userLocale.locale,
        href: buildHreflangUrl(canonicalUrl, userLocale.locale),
      });
    }

    const breadcrumbListSchema = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item.startsWith('http') ? crumb.item : `${BASE_URL}${crumb.item}`,
      })),
    };

    const webPageSchema: Record<string, unknown> = {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: fullTitle,
      description: webPageDescription,
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
      },
      breadcrumb: {
        '@id': `${canonicalUrl}#breadcrumb`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: image,
        width: 1200,
        height: 630,
      },
      inLanguage: userLocale.locale || userLocale.lang,
      potentialAction: {
        '@type': 'ReadAction',
        target: [canonicalUrl],
      },
    };

    if (matchSeo) {
      webPageSchema.datePublished = matchSeo.publishedTime;
      webPageSchema.dateModified = matchSeo.modifiedTime;
      webPageSchema.mainEntity = { '@id': `${canonicalUrl}#sportsevent` };
    }

    const matchJsonLdNodes =
      matchSeo && !noIndex
        ? buildMatchPredictionJsonLdNodes(
            { ...matchSeo, canonicalUrl, canonicalPath },
            image
          )
        : [];

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          url: BASE_URL,
          name: SITE_NAME,
          description:
            'AI-powered football predictions today with 87% accuracy. Free daily betting tips, banker picks, and value bets for 40+ global leagues.',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/predict?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'PredictPro',
          url: BASE_URL,
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png`, width: 512, height: 512 },
          sameAs: ['https://twitter.com/PredictProAI'],
          areaServed: [
            { '@type': 'Continent', name: 'Africa' },
            { '@type': 'Continent', name: 'Europe' },
            { '@type': 'Continent', name: 'North America' },
            { '@type': 'Continent', name: 'South America' },
            { '@type': 'Continent', name: 'Asia' },
            { '@type': 'Continent', name: 'Oceania' },
            { '@type': 'Country', name: 'Kenya' },
            { '@type': 'Country', name: 'Nigeria' },
            { '@type': 'Country', name: 'South Africa' },
            { '@type': 'Country', name: 'Ghana' },
            { '@type': 'Country', name: 'Tanzania' },
            { '@type': 'Country', name: 'Uganda' },
            { '@type': 'Country', name: 'Zambia' },
            { '@type': 'Country', name: 'Zimbabwe' },
            { '@type': 'Country', name: 'Rwanda' },
            { '@type': 'Country', name: 'Cameroon' },
            { '@type': 'Country', name: 'DR Congo' },
            { '@type': 'Country', name: 'Egypt' },
            { '@type': 'Country', name: 'Morocco' },
            { '@type': 'Country', name: 'Senegal' },
            { '@type': 'Country', name: 'Ivory Coast' },
            { '@type': 'Country', name: 'Angola' },
            { '@type': 'Country', name: 'United Kingdom' },
            { '@type': 'Country', name: 'United States' },
            { '@type': 'Country', name: 'Canada' },
            { '@type': 'Country', name: 'India' },
            { '@type': 'Country', name: 'Australia' },
            { '@type': 'Country', name: 'New Zealand' },
            { '@type': 'Country', name: 'Ireland' },
            { '@type': 'Country', name: 'Singapore' },
            { '@type': 'Country', name: 'Malaysia' },
            { '@type': 'Country', name: 'Philippines' },
            { '@type': 'Country', name: 'United Arab Emirates' },
            { '@type': 'Country', name: 'Saudi Arabia' },
            { '@type': 'Country', name: 'Germany' },
            { '@type': 'Country', name: 'France' },
            { '@type': 'Country', name: 'Spain' },
            { '@type': 'Country', name: 'Italy' },
            { '@type': 'Country', name: 'Netherlands' },
            { '@type': 'Country', name: 'Portugal' },
            { '@type': 'Country', name: 'Brazil' },
            { '@type': 'Country', name: 'Mexico' },
            { '@type': 'Country', name: 'Argentina' },
            { '@type': 'Country', name: 'Colombia' },
            { '@type': 'Country', name: 'Chile' },
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'support@predictpro.guru',
            contactType: 'customer support',
            areaServed: ['KE', 'NG', 'ZA', 'GH', 'TZ', 'UG', 'ZM', 'ZW', 'RW', 'ET', 'CM', 'CD', 'EG', 'MA', 'SN', 'CI', 'GB', 'US', 'CA', 'IN', 'AU', 'NZ', 'IE', 'AE', 'SA', 'BR', 'MX', 'AR', 'ES', 'DE', 'FR', 'IT'],
            availableLanguage: ['en', 'sw', 'fr', 'ar', 'pt', 'es', 'de'],
          },
        },
        {
          '@type': 'SportsOrganization',
          name: 'PredictPro',
          sport: 'Football',
          url: BASE_URL,
          description: 'AI-powered football predictions platform covering 40+ leagues worldwide',
        },
        webPageSchema,
        breadcrumbListSchema,
        ...matchJsonLdNodes,
        ...(options.structuredData ? [options.structuredData] : []),
      ],
    };

    return {
      title: rawTitle,
      fullTitle,
      description,
      webPageDescription,
      canonicalPath,
      canonicalUrl,
      image,
      type,
      keywords,
      noIndex,
      breadcrumbs,
      structuredData,
      matchSeo,
      detectedLocale: userLocale,
      localizedDescriptionsByLang,
      hreflangLinks,
    };
  }, [
    activePathname,
    options.title,
    options.description,
    options.canonical,
    options.image,
    options.type,
    options.keywords,
    options.noIndex,
    options.structuredData,
    options.breadcrumbs,
    options.matchPrediction,
    userLocale,
  ]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Synchronize Document Title & HTML Document Root Attributes
    if (document.title !== resolved.fullTitle) {
      document.title = resolved.fullTitle;
    }
    if (document.documentElement) {
      document.documentElement.lang = resolved.detectedLocale.locale || resolved.detectedLocale.lang;
      document.documentElement.dir = resolved.detectedLocale.isRTL ? 'rtl' : 'ltr';
    }

    // 2. Synchronize Primary & Google Discover Meta Tags
    const robotsDirective = resolved.noIndex
      ? 'noindex,nofollow'
      : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';

    upsertMetaTag('name', 'description', resolved.description);
    upsertMetaTag('name', 'keywords', resolved.keywords);
    upsertMetaTag('name', 'robots', robotsDirective);
    upsertMetaTag('name', 'googlebot', robotsDirective);
    upsertMetaTag(
      'name',
      'googlebot-news',
      resolved.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1'
    );
    upsertMetaTag(
      'http-equiv',
      'content-language',
      resolved.detectedLocale.locale || resolved.detectedLocale.lang
    );
    upsertMetaTag('name', 'language', resolved.detectedLocale.lang);

    // Inject multi-lingual meta descriptions for search engine crawlers in non-English regions
    for (const [langCode, localizedDesc] of Object.entries(resolved.localizedDescriptionsByLang)) {
      if (localizedDesc) {
        upsertMetaTag('name', `description:${langCode}`, localizedDesc);
      }
    }

    // 3. Synchronize Canonical & Dynamic Multi-Region Hreflang Links
    upsertLinkTag('canonical', resolved.canonicalUrl);

    const validHreflangs = new Set<string>();
    for (const item of resolved.hreflangLinks) {
      validHreflangs.add(item.hreflang);
      upsertLinkTag('alternate', item.href, item.hreflang);
    }
    pruneAlternateHreflangTags(validHreflangs);

    // 4. Synchronize OpenGraph & Google Discover Article Freshness Tags
    const imageAlt = resolved.matchSeo
      ? `${resolved.matchSeo.homeTeam} vs ${resolved.matchSeo.awayTeam} AI Football Prediction, Lineups & xG Stats`
      : resolved.fullTitle;

    upsertMetaTag('property', 'og:type', resolved.type);
    upsertMetaTag('property', 'og:url', resolved.canonicalUrl);
    upsertMetaTag('property', 'og:title', resolved.fullTitle);
    upsertMetaTag('property', 'og:description', resolved.description);
    upsertMetaTag('property', 'og:image', resolved.image);
    upsertMetaTag('property', 'og:image:width', '1200');
    upsertMetaTag('property', 'og:image:height', '630');
    upsertMetaTag('property', 'og:image:alt', imageAlt);
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:locale', resolved.detectedLocale.ogLocale);

    const ogAlternateLocales = [
      'en_US', 'en_GB', 'en_KE', 'en_NG', 'en_ZA', 'en_GH', 'en_IN', 'en_CA', 'en_AU',
      'es_ES', 'es_MX', 'es_AR', 'pt_BR', 'pt_PT', 'fr_FR', 'fr_CA', 'de_DE', 'sw_KE', 'ar_SA', 'ar_EG'
    ].filter((loc) => loc !== resolved.detectedLocale.ogLocale);

    for (const altLoc of ogAlternateLocales) {
      upsertMetaTag('property', 'og:locale:alternate', altLoc);
    }

    if (resolved.matchSeo) {
      upsertMetaTag('property', 'article:published_time', resolved.matchSeo.publishedTime);
      upsertMetaTag('property', 'article:modified_time', resolved.matchSeo.modifiedTime);
      upsertMetaTag('property', 'article:section', resolved.matchSeo.league);
      upsertMetaTag('property', 'article:author', 'PredictPro Quantitative Football Intelligence');
    }

    // 5. Synchronize Twitter Card Tags
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:site', '@PredictProAI');
    upsertMetaTag('name', 'twitter:creator', '@PredictProAI');
    upsertMetaTag('name', 'twitter:title', resolved.fullTitle);
    upsertMetaTag('name', 'twitter:description', resolved.description);
    upsertMetaTag('name', 'twitter:image', resolved.image);
    upsertMetaTag('name', 'twitter:image:alt', imageAlt);

    // 6. Synchronize JSON-LD Structured Data Script in <head>
    const scriptId = 'predictpro-dynamic-seo-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    const jsonString = JSON.stringify(resolved.structuredData);
    if (scriptEl.textContent !== jsonString) {
      scriptEl.textContent = jsonString;
    }
  }, [resolved]);

  return resolved;
}
