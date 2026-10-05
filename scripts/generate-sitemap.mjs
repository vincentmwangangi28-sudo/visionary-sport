#!/usr/bin/env node
/**
 * PredictPro Dynamic Sitemap Generator
 * Generates public/sitemap.xml with live timestamp and comprehensive URLs:
 * - Core landing & tool pages
 * - League hubs (EPL, UCL, La Liga, Serie A, Bundesliga, KPL, MLS, etc.)
 * - Mega Jackpot prediction portals (17 games)
 * - Strategy & betting guides
 * - Match prediction dynamic routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';
const TODAY = new Date().toISOString().split('T')[0];

const CORE_PAGES = [
  { path: '/', priority: 1.0, freq: 'daily', title: 'PredictPro - AI Football Predictions & Live Match Intelligence' },
  { path: '/best-bets', priority: 0.95, freq: 'daily', title: 'Best AI Football Banker Bets Today - Top Confidence Picks' },
  { path: '/upcoming', priority: 0.95, freq: 'daily', title: 'Upcoming Football Fixtures & Match Predictions' },
  { path: '/predict', priority: 0.95, freq: 'daily', title: 'AI Match Predictor & Custom Football Simulator' },
  { path: '/live', priority: 0.95, freq: 'hourly', title: 'Live Football Scores, In-Play AI Odds & Minute Trackers' },
  { path: '/value-bets', priority: 0.90, freq: 'daily', title: 'Value Bets (+EV) & Expected Value Football Calculator' },
  { path: '/streaks', priority: 0.90, freq: 'daily', title: 'AI Football Streaks & Winning Trends Radar - Over 2.5 & BTTS' },
  { path: '/h2h', priority: 0.90, freq: 'daily', title: 'AI Football Head-to-Head (H2H) Comparison & Poisson Simulator' },
  { path: '/correct-score', priority: 0.90, freq: 'daily', title: 'AI Correct Score Predictions & Scoreline Probabilities' },
  { path: '/btts', priority: 0.90, freq: 'daily', title: 'Both Teams to Score (BTTS) Tips & Goal Market Analysis' },
  { path: '/accumulator', priority: 0.90, freq: 'daily', title: 'AI Accumulator Builder & Multibet Slip Optimizer' },
  { path: '/standings', priority: 0.85, freq: 'daily', title: 'Real-Time Football League Standings & Form Tables' },
  { path: '/dropping-odds', priority: 0.85, freq: 'hourly', title: 'Dropping Odds Radar & Bookmaker Volume Tracker' },
  { path: '/screener', priority: 0.85, freq: 'daily', title: 'AI Football Match Screener & Probability Filter' },
  { path: '/recommendations', priority: 0.85, freq: 'daily', title: 'Personalized AI Match Recommendations' },
  { path: '/tournaments', priority: 0.85, freq: 'weekly', title: 'Global Football Leagues & Tournaments Directory' },
  { path: '/track-record', priority: 0.85, freq: 'daily', title: 'Verified AI Prediction Track Record & Audited ROI' },
  { path: '/statistics', priority: 0.80, freq: 'weekly', title: 'Football Statistics, Head-to-Head & xG Matrices' },
  { path: '/highlights', priority: 0.80, freq: 'daily', title: 'Football Video Highlights & Match Replays' },
  { path: '/players', priority: 0.80, freq: 'weekly', title: 'Player Profiles, Form Ratings & Goalscorer Stats' },
  { path: '/insights', priority: 0.80, freq: 'daily', title: 'Tactical Match Insights & Statistical Previews' },
  { path: '/news', priority: 0.80, freq: 'hourly', title: 'Football News, Transfer Intel & Team News' },
  { path: '/tipsters', priority: 0.75, freq: 'weekly', title: 'Top AI Tipster Profiles & Verified Win Rates' },
  { path: '/bankroll', priority: 0.75, freq: 'weekly', title: 'Bankroll Manager & Kelly Criterion Staking Calculator' },
  { path: '/sports', priority: 0.75, freq: 'weekly', title: 'Multi-Sport AI Predictions (Basketball, Tennis)' },
  { path: '/methodology', priority: 0.75, freq: 'monthly', title: 'PredictPro AI Modeling Methodology, Poisson & xG' },
  { path: '/archive', priority: 0.75, freq: 'daily', title: 'Past Match Prediction Archive & Settlement Results' },
  { path: '/leaderboard', priority: 0.75, freq: 'daily', title: 'Community Prediction Leaderboard & Tipster Rankings' },
  { path: '/about', priority: 0.70, freq: 'monthly', title: 'About PredictPro - AI Sports Analytics Platform' },
  { path: '/responsible-gaming', priority: 0.75, freq: 'monthly', title: 'Responsible Gaming & 18+ Age Restriction Policy' },
  { path: '/sitemap', priority: 0.70, freq: 'daily', title: 'HTML Predictions Directory & Sitemap' },
  { path: '/seo-indexing', priority: 0.70, freq: 'daily', title: 'Google Indexing & Search Engine Management Console' },
];

const LEAGUE_PAGES = [
  { path: '/premier-league-predictions', priority: 0.95, freq: 'daily', title: 'Premier League Predictions & AI Betting Tips' },
  { path: '/champions-league-predictions', priority: 0.95, freq: 'daily', title: 'UEFA Champions League Predictions & Odds' },
  { path: '/la-liga-predictions', priority: 0.95, freq: 'daily', title: 'La Liga AI Predictions & Match Previews' },
  { path: '/bundesliga-predictions', priority: 0.95, freq: 'daily', title: 'Bundesliga Predictions & Form Analysis' },
  { path: '/serie-a-predictions', priority: 0.95, freq: 'daily', title: 'Serie A Predictions & Tactical Insights' },
  { path: '/world-cup-predictions', priority: 0.90, freq: 'daily', title: 'FIFA World Cup 2026 Predictions & Qualifying Tips' },
  { path: '/afcon-predictions', priority: 0.90, freq: 'daily', title: 'AFCON Predictions & African Football Odds' },
  { path: '/kpl-predictions', priority: 0.90, freq: 'daily', title: 'FKF Kenya Premier League Predictions & M-Pesa Tips' },
  { path: '/jackpot-predictions', priority: 0.95, freq: 'daily', title: 'SportPesa Mega Jackpot & Betika Grand AI Predictions (17 Games)' },
  { path: '/us-soccer-predictions', priority: 0.90, freq: 'daily', title: 'US Soccer Picks, MLS Moneyline & Champions League Odds' },
];

const BLOG_POSTS = [
  { slug: 'how-to-read-football-predictions', title: 'How to Read AI Football Predictions Like a Pro', priority: 0.80 },
  { slug: 'expected-goals-xg-betting-model-explained', title: 'Expected Goals (xG) & xGA Football Betting Model Explained: How to Beat Bookmaker Lines', priority: 0.85 },
  { slug: 'halftime-fulltime-ht-ft-predictions-strategy', title: 'Half-Time / Full-Time (HT/FT) Football Predictions: Mathematical Turnaround & Draw-Win Strategy', priority: 0.85 },
  { slug: 'value-betting-explained', title: 'Value Betting in Football: A Complete Guide to Positive Expected Value', priority: 0.80 },
  { slug: 'asian-handicap-betting-explained', title: 'Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Lines', priority: 0.85 },
  { slug: 'draw-no-bet-vs-double-chance-strategy', title: 'Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI Guide', priority: 0.85 },
  { slug: 'closing-line-value-clv-dropping-odds', title: 'Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Steam', priority: 0.85 },
  { slug: 'bankroll-management-football', title: 'Bankroll Management for Football Bettors: Kelly Criterion', priority: 0.80 },
  { slug: 'premier-league-prediction-guide-2026', title: 'Premier League 2026/27 Season Prediction Guide', priority: 0.80 },
  { slug: 'champions-league-group-stage-tips', title: 'Champions League 36-Team Swiss Phase: How to Bet Smart Using AI', priority: 0.80 },
  { slug: 'btts-over-under-strategy', title: 'BTTS and Over/Under 2.5: The Stats Behind Goal Markets', priority: 0.80 },
  { slug: 'kpl-betting-guide-kenya', title: 'Kenya Premier League (FKF) Betting Guide 2026/27 & M-Pesa Payouts', priority: 0.80 },
  { slug: 'accumulator-building-strategy', title: 'How to Build a Winning Football Accumulator with Low Correlation', priority: 0.80 },
  { slug: 'correct-score-prediction-tips', title: 'Correct Score Betting: How Poisson Matrices Predict Exact Scorelines', priority: 0.80 },
  { slug: 'sportpesa-mega-jackpot-prediction-17-games', title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI', priority: 0.85 },
  { slug: 'us-soccer-betting-guide-mls-odds', title: 'US Soccer & MLS Betting Guide: Moneyline, Spreads & AI Picks', priority: 0.80 },
];

// Key Featured Match Slugs
const FEATURED_MATCH_SLUGS = [
  'arsenal-vs-chelsea',
  'liverpool-vs-manchester-city',
  'real-madrid-vs-barcelona',
  'bayern-munich-vs-borussia-dortmund',
  'inter-milan-vs-ac-milan',
  'manchester-united-vs-tottenham',
  'psg-vs-marseille',
  'gor-mahia-vs-afc-leopards',
  'juventus-vs-napoli',
  'atletico-madrid-vs-sevilla',
  'la-galaxy-vs-lafc',
  'inter-miami-vs-new-york-red-bulls'
];

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml() {
  const urlEntries = [];

  // Core pages
  for (const page of CORE_PAGES) {
    urlEntries.push({
      loc: `${BASE_URL}${page.path}`,
      lastmod: TODAY,
      changefreq: page.freq,
      priority: page.priority.toFixed(2),
      title: page.title,
    });
  }

  // League pages
  for (const page of LEAGUE_PAGES) {
    urlEntries.push({
      loc: `${BASE_URL}${page.path}`,
      lastmod: TODAY,
      changefreq: page.freq,
      priority: page.priority.toFixed(2),
      title: page.title,
    });
  }

  // Blog posts
  for (const post of BLOG_POSTS) {
    urlEntries.push({
      loc: `${BASE_URL}/blog/${post.slug}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: post.priority.toFixed(2),
      title: post.title,
    });
  }

  // Blog hub
  urlEntries.push({
    loc: `${BASE_URL}/blog`,
    lastmod: TODAY,
    changefreq: 'daily',
    priority: '0.85',
    title: 'Football Betting Strategy Blog & AI Prediction Guides',
  });

  // Match pages (Evergreen canonical slugs so internal links never drift across days)
  for (const slug of FEATURED_MATCH_SLUGS) {
    urlEntries.push({
      loc: `${BASE_URL}/predict/${slug}`,
      lastmod: TODAY,
      changefreq: 'daily',
      priority: '0.80',
      title: `${slug.split('-vs-').map(s => s.replace(/-/g, ' ')).join(' vs ').toUpperCase()} AI Prediction & Match Odds`,
    });
  }

const GLOBAL_HREFLANGS = [
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
  'de-DE',
  'it-IT',
  'nl-NL',
  'ar',
  'ar-EG',
  'ar-SA',
  'ar-AE',
  'ar-MA',
];

  const xmlNodes = urlEntries.map(entry => {
    const hreflangNodes = GLOBAL_HREFLANGS.map(
      lang => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(entry.loc)}" />`
    ).join('\n');

    return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
${hreflangNodes}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlNodes}
</urlset>
`;
}

// Write file
const xml = buildSitemapXml();
fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');

const urlCount = (xml.match(/<loc>/g) || []).length;
console.log(`✅ [Sitemap Generator] Wrote ${urlCount} indexed URLs to ${SITEMAP_PATH}`);
console.log(`📅 Generated date: ${TODAY}`);
console.log(`🌐 Base URL: ${BASE_URL}`);
