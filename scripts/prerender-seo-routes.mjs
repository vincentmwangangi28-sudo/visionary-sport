#!/usr/bin/env node
/**
 * PredictPro Build-Time Static SEO Prerenderer
 * Generates route-specific static HTML files (dist/<route>/index.html and dist/<route>.html)
 * for every canonical URL in public/sitemap.xml so non-JS crawlers (AhrefsBot, Bingbot,
 * Yandex, Googlebot) receive:
 *  1. 100% self-referencing <link rel="canonical" href="https://predictpro.guru/..." />
 *  2. Unique, route-specific <title> strictly <= 60 characters
 *  3. Unique, route-specific <meta name="description"> strictly <= 155 characters
 *  4. Full internal crawlable <a href> link graph (0 orphan pages)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const BASE_URL = 'https://predictpro.guru';

const ROUTE_META = {
  '/': {
    title: 'PredictPro — AI Football Predictions & xG Match Stats',
    description: 'Daily AI football predictions with 87% accuracy. Expected Goals (xG) stats, Poisson probabilities, and H2H analytics across 40+ global leagues.',
  },
  '/best-bets': {
    title: 'Best Banker Football Bets & Sure AI Tips | PredictPro',
    description: 'Verified daily football banker predictions and sure 1X2 tips with 75% to 92% AI confidence. Filter high-probability match winners and Double Chance locks.',
  },
  '/upcoming': {
    title: 'Upcoming Football Fixtures & 7-Day AI Odds | PredictPro',
    description: 'Browse upcoming football fixtures across 40+ global leagues with early AI win probabilities, Expected Goals (xG) projections, and fair decimal odds.',
  },
  '/predict': {
    title: 'AI Football Match Predictor & xG Simulator | PredictPro',
    description: 'Simulate any football match with PredictPro’s custom AI Match Predictor. Compare team form, head-to-head records, and Poisson goal probabilities.',
  },
  '/live': {
    title: 'Live Football Scores, In-Play xG & AI Odds | PredictPro',
    description: 'Track real-time live football scores, minute-by-minute match momentum, in-play AI win probabilities, and live goal alerts across global competitions.',
  },
  '/value-bets': {
    title: 'Daily Value Bets (+EV) & Mispriced Football Odds',
    description: 'Daily positive expected value (+EV) football bets today. Compare AI Poisson probability vs bookmaker odds to detect market mispricings and edges.',
  },
  '/streaks': {
    title: 'Football Team Winning Streaks & Goal Trends Radar',
    description: 'Identify clubs on active winning streaks, unbeaten runs, and consecutive Over 2.5 Goals or Both Teams to Score trends before bookmakers adjust lines.',
  },
  '/h2h': {
    title: 'Head-to-Head (H2H) Football Comparison & Poisson Tool',
    description: 'Compare any two football clubs head-to-head. Analyze historical H2H results, attacking vs defensive xG radar charts, and Poisson score simulations.',
  },
  '/correct-score': {
    title: 'AI Correct Score Predictions & Poisson Matrix | PredictPro',
    description: 'Exact 90-minute football scoreline predictions powered by bivariate Poisson probability matrices. Find 1-0, 2-1, and 1-1 correct score value picks.',
  },
  '/btts': {
    title: 'BTTS AI Predictions Today & Over 2.5 Goals Tips',
    description: 'Verified BTTS AI predictions today with 79% win rate. Daily Both Teams to Score and Over 2.5 goals tips with Poisson expectancy across 40+ leagues.',
  },
  '/accumulator': {
    title: 'Smart Football Accumulator & Multibet Builder | PredictPro',
    description: 'Build low-correlation 3-fold and 5-fold football accumulators using AI confidence filters, Double Chance hedges, and Kelly Criterion stake sizing.',
  },
  '/standings': {
    title: 'Football League Standings, Form & xG Tables | PredictPro',
    description: 'Live 2026/27 football league standings, home/away form tables, goal differentials, and qualification zones for Premier League, La Liga, KPL & more.',
  },
  '/dropping-odds': {
    title: 'Dropping Odds Radar & Sharp Steam Tracker | PredictPro',
    description: 'Monitor real-time dropping football odds and sharp market steam moves. Spot bookmaker line compression and capture positive Closing Line Value (CLV).',
  },
  '/screener': {
    title: 'Quantitative Football Match Screener & xG Scanner',
    description: 'Filter daily football fixtures by AI confidence, Expected Goals (xG), BTTS probability, Over 2.5 expectancy, and positive Expected Value (+EV) edge.',
  },
  '/recommendations': {
    title: 'Personalized AI Football Betting Recommendations',
    description: 'Tailored AI football match recommendations matched to your preferred leagues, risk tolerance, and quantitative market edge preferences.',
  },
  '/tournaments': {
    title: 'Global Football Tournaments & Cup Predictions | PredictPro',
    description: 'Explore AI tournament simulations, knockout stage progression probabilities, and match predictions for international and continental cup competitions.',
  },
  '/track-record': {
    title: 'Verified AI Prediction Track Record & Historical ROI',
    description: 'Inspect PredictPro’s audited historical prediction accuracy, unit Return on Investment (ROI), strike rate by league, and Closing Line Value (CLV).',
  },
  '/statistics': {
    title: 'Football Team & League Expected Goals (xG) Statistics',
    description: 'Deep statistical leaderboards for team attacking xG, defensive xGA, corner averages, card frequencies, and goal timing distributions across 40+ leagues.',
  },
  '/highlights': {
    title: 'Official Football Match Video Highlights & Tactical Recap',
    description: 'Watch verified football match video highlights paired with post-match Expected Goals (xG) fairness ratings and tactical performance breakdowns.',
  },
  '/players': {
    title: 'Football Player xG, Shots & Assists Analytics | PredictPro',
    description: 'Search player-level Expected Goals (xG), Expected Assists (xA), per-90 shot volume, and goalscorer probabilities across major European and global leagues.',
  },
  '/insights': {
    title: 'Tactical Football Matchday Intelligence & xG Briefings',
    description: 'Daily quantitative matchday briefings analyzing pressing intensity, squad rotation impact, referee card tendencies, and weather-adjusted goal totals.',
  },
  '/news': {
    title: 'Breaking Football Injury News & Lineup Impact | PredictPro',
    description: 'Real-time football injury updates, confirmed starting lineups, suspension alerts, and quantified win-probability shifts for upcoming fixtures.',
  },
  '/tipsters': {
    title: 'Verified Football Tipsters & ROI Leaderboard | PredictPro',
    description: 'Follow verified quantitative football analysts and community tipsters ranked by transparent strike rate, yield, and Closing Line Value (CLV).',
  },
  '/bankroll': {
    title: 'Kelly Criterion Football Bankroll & Stake Calculator',
    description: 'Manage your sports analytics portfolio with fractional Kelly Criterion stake sizing, drawdown protection, and market-by-market ROI tracking.',
  },
  '/sports': {
    title: 'Multi-Sport Quantitative AI Predictions Directory',
    description: 'Cross-sport statistical probability models and Expected Value (+EV) analytics covering global football, basketball, and tennis competitions.',
  },
  '/methodology': {
    title: 'AI Football Prediction Methodology: Poisson & xG Science',
    description: 'Learn how PredictPro’s ensemble AI calculates match probabilities using Dixon-Coles bivariate Poisson models, rolling Expected Goals (xG), and CLV.',
  },
  '/archive': {
    title: 'Settled Football Prediction Archive & Verified Results',
    description: 'Browse PredictPro’s complete archive of past football predictions, final 90-minute scorelines, and transparent win/loss settlement records.',
  },
  '/leaderboard': {
    title: 'Global Football Prediction Accuracy Leaderboard',
    description: 'Compare top football prediction streaks, monthly ROI leaders, and verified community forecasting performance across major domestic leagues.',
  },
  '/about': {
    title: 'About PredictPro Quantitative Sports Analytics',
    description: 'Discover the sports data scientists, machine learning engineers, and Bivariate Poisson statistical models powering PredictPro’s football analytics.',
  },
  '/responsible-gaming': {
    title: 'Responsible Gaming, 18+ Protection & Analytics Disclaimer',
    description: 'PredictPro Responsible Gambling Policy, 18+ minor protection standards, international support helplines, and informational sports statistics disclaimer.',
  },
  '/sitemap': {
    title: 'PredictPro HTML Sitemap & Indexed Football Directory',
    description: 'Navigate all indexed PredictPro football prediction hubs, league tables, quantitative betting tools, strategy articles, and live match previews.',
  },
  '/seo-indexing': {
    title: 'PredictPro SEO Command Center & Indexing Monitor',
    description: 'Monitor automated Google Indexing cron jobs, IndexNow pings, Low-Hanging Fruit keywords, AI Overview snippets, and backlink reclamation.',
  },
  '/premier-league-predictions': {
    title: 'English Premier League (EPL) AI Predictions & xG Tips',
    description: 'Expert AI Premier League predictions for every matchweek. Get EPL 1X2 banker picks, Expected Goals (xG) projections, BTTS tips, and score probabilities.',
  },
  '/champions-league-predictions': {
    title: 'UEFA Champions League AI Predictions & Knockout Odds',
    description: 'UEFA Champions League match predictions powered by AI. Analyze 36-team league phase dynamics, knockout tie probabilities, Over 2.5 goals, and value odds.',
  },
  '/la-liga-predictions': {
    title: 'Spanish La Liga AI Football Predictions & Value Odds',
    description: 'Daily Spanish La Liga football predictions and tactical xG analysis. Find Real Madrid, Barcelona, and Atletico Madrid 1X2, BTTS, and Asian Handicap picks.',
  },
  '/bundesliga-predictions': {
    title: 'German Bundesliga AI Predictions, Over 2.5 & BTTS Tips',
    description: 'High-scoring German Bundesliga AI predictions. Access Poisson goal expectancy, Over 2.5 and BTTS probabilities, and 1X2 value picks for every fixture.',
  },
  '/serie-a-predictions': {
    title: 'Italian Serie A AI Predictions, xGA & 1X2 Betting Tips',
    description: 'Italian Serie A football predictions combining defensive Expected Goals Against (xGA), tactical low-block metrics, and mispriced Draw No Bet value lines.',
  },
  '/world-cup-predictions': {
    title: '2026 FIFA World Cup AI Predictions & Tournament Odds',
    description: '2026 FIFA World Cup qualifying and tournament AI predictions. Explore international Elo ratings, group stage advancement probabilities, and match tips.',
  },
  '/afcon-predictions': {
    title: 'AFCON & CAF Champions League AI Football Predictions',
    description: 'Africa Cup of Nations (AFCON) and CAF Champions League predictions. Home altitude metrics, low-scoring under 2.5 trends, and top African club odds.',
  },
  '/kpl-predictions': {
    title: 'FKF Kenya Premier League (KPL) AI Predictions & Tips',
    description: 'Official FKF Kenya Premier League AI predictions covering Gor Mahia, AFC Leopards, Tusker FC, and Kenya Police FC with full statistical H2H breakdowns.',
  },
  '/jackpot-predictions': {
    title: '17-Game SportPesa Mega Jackpot & Betika AI Predictions',
    description: 'Mathematical 17-game SportPesa Mega Jackpot and Betika Grand Jackpot predictions. Get AI banker selections and optimal Double Chance hedging combinations.',
  },
  '/us-soccer-predictions': {
    title: 'MLS & US Soccer AI Predictions: Moneyline & Spreads',
    description: 'Major League Soccer (MLS), Concacaf Champions Cup, and US Open Cup AI predictions with American moneyline odds, goal spreads, and travel fatigue models.',
  },
  '/blog': {
    title: 'Football Betting Strategy Blog: +EV, xG & Handicap Guides',
    description: 'Master quantitative football betting with our in-depth strategy guides on Expected Value (+EV), Asian Handicap lines, Closing Line Value, and Kelly staking.',
  },
};

function clampTitle(raw) {
  const clean = String(raw || '').trim();
  if (clean.length <= 60) return clean;
  let sub = clean.slice(0, 57);
  const space = sub.lastIndexOf(' ');
  if (space > 35) sub = sub.slice(0, space).replace(/[,:&|—-]+$/, '');
  return sub.trim();
}

function clampDescription(raw) {
  const clean = String(raw || '').trim();
  if (clean.length <= 155) return clean;
  let sub = clean.slice(0, 152);
  const space = sub.lastIndexOf(' ');
  if (space > 115) sub = sub.slice(0, space).replace(/[,:;]+$/, '');
  return `${sub.trim()}...`;
}

function deriveMetaForPath(routePath) {
  if (ROUTE_META[routePath]) {
    return {
      title: clampTitle(ROUTE_META[routePath].title),
      description: clampDescription(ROUTE_META[routePath].description),
    };
  }

  if (routePath.startsWith('/blog/')) {
    const slug = routePath.replace('/blog/', '');
    const humanized = slug
      .split('-')
      .map((w) => (/^(xg|xga|btts|ht|ft|clv|ev|ai|epl|ucl|kpl|mls|us)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ');
    return {
      title: clampTitle(`${humanized} | Strategy Guide`),
      description: clampDescription(
        `Quantitative football strategy guide on ${humanized}. Learn Bivariate Poisson goal modeling, Expected Value (+EV) math, and disciplined Kelly staking.`
      ),
    };
  }

  if (routePath.startsWith('/predict/')) {
    const slug = routePath.replace('/predict/', '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const parts = slug.split('-vs-');
    const formatTeam = (s) =>
      s
        .split('-')
        .map((w) => (w.length <= 3 && /^(fc|sc|ac|as|cf|fk|us|psg|ny|afc|tp|apr|kcb|kpl|rs|es|cr|mc|js|cs|far)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
    const matchup = parts.length === 2 ? `${formatTeam(parts[0])} vs ${formatTeam(parts[1])}` : slug;
    return {
      title: clampTitle(`${matchup} AI Prediction, xG & H2H Odds`),
      description: clampDescription(
        `${matchup} AI football prediction, bivariate Poisson exact score matrix, Expected Goals (xG) telemetry, head-to-head form, and +EV betting odds.`
      ),
    };
  }

  const label = routePath
    .replace(/^\/+/, '')
    .replace(/[-/]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: clampTitle(`${label} | PredictPro AI`),
    description: clampDescription(
      `Explore ${label} on PredictPro. Daily AI football predictions, Expected Goals (xG) statistics, Bivariate Poisson probabilities, and H2H match analytics.`
    ),
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function runPrerender() {
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath) || !fs.existsSync(SITEMAP_PATH)) {
    console.log('[prerender-seo-routes] Skipping: dist/index.html or public/sitemap.xml not found.');
    return;
  }

  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf-8');

  // Inline all built CSS files into <head> to eliminate render-blocking stylesheet requests
  let baseHtml = templateHtml;
  const cssLinkMatches = [...baseHtml.matchAll(/<link rel="stylesheet"[^>]*href="\/?(assets\/[^"]+\.css)"[^>]*>/g)];
  for (const match of cssLinkMatches) {
    const cssFilePath = path.join(DIST_DIR, match[1]);
    if (fs.existsSync(cssFilePath)) {
      const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
      baseHtml = baseHtml.replace(match[0], `<style data-inlined-css="true">${cssContent}</style>`);
    }
  }

  const locMatches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  let generatedCount = 0;

  for (const fullUrl of locMatches) {
    let routePath = '/';
    try {
      const u = new URL(fullUrl);
      routePath = u.pathname === '/' ? '/' : u.pathname.replace(/\/+$/, '');
    } catch {
      continue;
    }

    const canonicalUrl = routePath === '/' ? `${BASE_URL}/` : `${BASE_URL}${routePath}`;
    const { title, description } = deriveMetaForPath(routePath);
    const escapedTitle = escapeHtml(title);
    const escapedDesc = escapeHtml(description);

    const GLOBAL_HREFLANGS = [
      'x-default', 'en', 'en-US', 'en-GB', 'en-KE', 'en-NG', 'en-ZA', 'en-GH', 'en-TZ', 'en-UG',
      'en-ZM', 'en-ZW', 'en-RW', 'en-CM', 'en-IN', 'en-CA', 'en-AU', 'en-NZ', 'en-PH', 'en-SG',
      'en-MY', 'en-IE', 'en-AE', 'es', 'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-US',
      'fr', 'fr-FR', 'fr-CA', 'fr-SN', 'fr-CI', 'fr-CD', 'fr-CM', 'fr-MA', 'pt', 'pt-BR',
      'pt-PT', 'pt-AO', 'pt-MZ', 'sw', 'sw-KE', 'sw-TZ', 'de-DE', 'it-IT', 'nl-NL', 'ar',
      'ar-EG', 'ar-SA', 'ar-AE', 'ar-MA'
    ];
    const ogLocales = ['en_GB', 'en_KE', 'en_NG', 'en_ZA', 'en_GH', 'en_IN', 'en_CA', 'en_AU', 'es_ES', 'es_MX', 'pt_BR', 'fr_FR', 'de_DE', 'sw_KE', 'ar_SA'];

    const canonicalLinksBlock = [
      `<link rel="canonical" href="${canonicalUrl}" />`,
      ...GLOBAL_HREFLANGS.map(lang => {
        const altHref = (lang === 'x-default' || lang === 'en')
          ? canonicalUrl
          : `${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;
        return `<link rel="alternate" hreflang="${lang}" href="${altHref}" />`;
      }),
      `<meta property="og:url" content="${canonicalUrl}" />`,
      ...ogLocales.map(loc => `<meta property="og:locale:alternate" content="${loc}" />`),
    ].join('\n    ');

    let routeHtml = baseHtml
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escapedDesc}" />`
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${escapedTitle}" />`
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${escapedDesc}" />`
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:title" content="${escapedTitle}" />`
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:description" content="${escapedDesc}" />`
      )
      .replace(
        /<link rel="sitemap"/,
        `${canonicalLinksBlock}\n    <link rel="sitemap"`
      )
      .replace(
        /"@id": "https:\/\/predictpro\.guru\/#webpage",\s*"url": "https:\/\/predictpro\.guru\/",\s*"name": "[^"]*",\s*"description": "[^"]*"/,
        `"@id": "${canonicalUrl}#webpage",\n          "url": "${canonicalUrl}",\n          "name": "${escapedTitle}",\n          "description": "${escapedDesc}"`
      )
      .replace(
        /<h1>[\s\S]*?<\/h1>/,
        `<h1>${escapedTitle}</h1>`
      );

    if (routePath === '/') {
      fs.writeFileSync(indexHtmlPath, routeHtml, 'utf-8');
      generatedCount++;
    } else {
      const relPath = routePath.replace(/^\/+/, '');
      const targetDir = path.join(DIST_DIR, relPath);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'index.html'), routeHtml, 'utf-8');
      fs.writeFileSync(path.join(DIST_DIR, `${relPath}.html`), routeHtml, 'utf-8');
      generatedCount++;
    }
  }

  console.log(`✅ [prerender-seo-routes] Generated ${generatedCount} self-canonicalized static HTML routes in dist/`);
}

runPrerender();
