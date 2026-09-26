import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { STRATEGY_POSTS } from '@/data/blogData';
import { BASE_URL } from '@/services/sitemapGenerator';

export interface SEOBreadcrumbItem {
  name: string;
  item: string;
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
    title: 'AI Football Predictions Today | Free Betting Tips & Live xG',
    description:
      'Get accurate AI football predictions and daily betting tips today. Verified 1X2 banker bets, Poisson xG stats, and +EV value picks across 40+ global leagues.',
    keywords:
      'ai football predictions today, football predictions today, free betting tips, banker bets today, expected goals xg, soccer predictions',
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
};

/**
 * Normalizes WebPage schema description to 150–160 chars for optimal SERP snippet rendering.
 */
export function normalizeSEODescription(raw: string): string {
  let text = (raw || '').trim();

  if (text.length > 160) {
    let truncated = text.slice(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 135) {
      truncated = truncated.slice(0, lastSpace);
    }
    text = `${truncated}...`;
  }

  if (text.length < 150) {
    const cleanBase = text.replace(/[.\s]+$/, '');
    const suffix =
      ' Get verified AI football tips, Poisson probability models, live xG stats & +EV daily value picks.';
    const combined = `${cleanBase}.${suffix}`;
    text = combined.length > 160 ? `${combined.slice(0, 157)}...` : combined.padEnd(152, '.');
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
    const foundPost = STRATEGY_POSTS.find((p) => p.slug === slug);
    if (foundPost) {
      return {
        title: foundPost.title,
        description: foundPost.excerpt,
        keywords: foundPost.keywords || `${foundPost.category.toLowerCase()}, football betting strategy, ai predictions`,
        canonicalPath: `/blog/${slug}`,
        type: 'article',
      };
    }

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

/**
 * Helper to upsert a single deduplicated <meta> tag in document.head
 */
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

  const resolved = useMemo<ResolvedSEOMetadata>(() => {
    const routeDefaults = resolveDynamicRouteConfig(activePathname);

    const rawTitle = options.title || routeDefaults.title;
    const fullTitle = rawTitle.includes('PredictPro')
      ? rawTitle
      : rawTitle.length + 13 <= 68
        ? `${rawTitle} | PredictPro`
        : rawTitle;

    const description = options.description || routeDefaults.description;
    const webPageDescription = normalizeSEODescription(description);

    const rawCanonicalPath = options.canonical || routeDefaults.canonicalPath || activePathname;
    const canonicalPath = rawCanonicalPath.startsWith('/') ? rawCanonicalPath : `/${rawCanonicalPath}`;
    const canonicalUrl = rawCanonicalPath.startsWith('http')
      ? rawCanonicalPath
      : `${BASE_URL}${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '')}`;

    const image = options.image || DEFAULT_IMAGE;
    const type = options.type || routeDefaults.type || 'website';
    const keywords = options.keywords || routeDefaults.keywords;
    const noIndex = options.noIndex ?? routeDefaults.noIndex ?? false;

    const breadcrumbs =
      options.breadcrumbs && options.breadcrumbs.length > 0
        ? options.breadcrumbs
        : deriveRouteBreadcrumbs(canonicalPath, fullTitle);

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

    const webPageSchema = {
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
      inLanguage: 'en',
      potentialAction: {
        '@type': 'ReadAction',
        target: [canonicalUrl],
      },
    };

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
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
          sameAs: ['https://twitter.com/PredictProAI'],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'support@predictpro.guru',
            contactType: 'customer support',
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
  ]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Synchronize Document Title
    if (document.title !== resolved.fullTitle) {
      document.title = resolved.fullTitle;
    }

    // 2. Synchronize Primary Meta Tags
    upsertMetaTag('name', 'description', resolved.description);
    upsertMetaTag('name', 'keywords', resolved.keywords);
    upsertMetaTag(
      'name',
      'robots',
      resolved.noIndex
        ? 'noindex,nofollow'
        : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
    );

    // 3. Synchronize Canonical & Hreflang Links
    upsertLinkTag('canonical', resolved.canonicalUrl);
    upsertLinkTag('alternate', resolved.canonicalUrl, 'en');
    upsertLinkTag('alternate', resolved.canonicalUrl, 'x-default');

    // 4. Synchronize OpenGraph Tags
    upsertMetaTag('property', 'og:type', resolved.type);
    upsertMetaTag('property', 'og:url', resolved.canonicalUrl);
    upsertMetaTag('property', 'og:title', resolved.fullTitle);
    upsertMetaTag('property', 'og:description', resolved.description);
    upsertMetaTag('property', 'og:image', resolved.image);
    upsertMetaTag('property', 'og:image:width', '1200');
    upsertMetaTag('property', 'og:image:height', '630');
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:locale', 'en_US');

    // 5. Synchronize Twitter Card Tags
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:site', '@PredictProAI');
    upsertMetaTag('name', 'twitter:creator', '@PredictProAI');
    upsertMetaTag('name', 'twitter:title', resolved.fullTitle);
    upsertMetaTag('name', 'twitter:description', resolved.description);
    upsertMetaTag('name', 'twitter:image', resolved.image);

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
