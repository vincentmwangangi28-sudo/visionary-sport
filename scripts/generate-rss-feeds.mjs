#!/usr/bin/env node
/**
 * PredictPro Automated RSS 2.0 & Atom Feed Generator
 * Generates syndication feeds:
 *  - public/rss.xml (Standard RSS 2.0)
 *  - public/feed.xml (Atom 1.0)
 *  - public/feed-predictions.xml (Daily Match Predictions Syndication with Follow Backlink Attribution)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';
const BUILD_DATE = new Date().toUTCString();
const TODAY_ISO = new Date().toISOString();

const ARTICLES = [
  {
    title: 'Universal Bet Code Converter: How to Convert SportyBet, 1xBet, Bet9ja & Betway Slips',
    slug: 'universal-bet-code-converter-sportybet-1xbet-bet9ja',
    description: 'Learn how universal bet slip conversion maps fixture IDs, market taxonomies, and Asian Handicap lines across SportyBet, 1xBet, Bet9ja, Betway, and Betika.',
    date: '2026-10-23T08:00:00Z',
    category: 'Tools & Accumulators',
  },
  {
    title: 'Bivariate Poisson & Dixon-Coles Score Matrix: How PredictPro Calculates Exact Scorelines',
    slug: 'bivariate-poisson-dixon-coles-score-matrix-guide',
    description: 'Deep mathematical breakdown of how Attack Strength (α), Defense Weakness (β), and the Dixon-Coles ρ parameter power 6x6 exact score probability grids.',
    date: '2026-10-22T10:00:00Z',
    category: 'Analytics & Math',
  },
  {
    title: '2-Score Correct Score Dutching Strategy: Mathematical Stake Sizing for High-Odds Value',
    slug: '2-score-correct-score-dutching-strategy',
    description: 'Replace single-score lottery tickets with equal-profit 2-Score Correct Score Dutching pairs (such as 1-0 & 2-0 or 2-1 & 1-1) derived from Poisson peaks.',
    date: '2026-10-20T14:00:00Z',
    category: 'Correct Score',
  },
  {
    title: 'Referee Discipline & Corner Prop Modeling: Predicting Cards and Corners with xG Tempo',
    slug: 'referee-cards-corners-prop-modeling',
    description: 'How tactical width, PPDA pressing intensity, and referee fouls-per-tackle ratios create high-edge opportunities in Over 9.5 Corners and Over 3.5 Cards markets.',
    date: '2026-10-18T11:00:00Z',
    category: 'Prop Markets',
  },
  {
    title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI & Poisson Double Chance Combinations',
    slug: 'sportpesa-mega-jackpot-prediction-17-games',
    description: 'Master 17-game SportPesa and Betika Mega Jackpot prediction mechanics using algorithmic home banker identification and low-risk Double Chance hedging combinations.',
    date: '2026-10-14T08:00:00Z',
    category: 'Jackpots',
  },
  {
    title: 'Half-Time / Full-Time (HT/FT) Football Predictions: Mathematical Turnaround & Draw-Win Strategy',
    slug: 'halftime-fulltime-ht-ft-predictions-strategy',
    description: 'Learn how Poisson momentum shift equations detect high-odds HT/FT Draw/Home and Draw/Away betting turnarounds.',
    date: '2026-10-12T12:00:00Z',
    category: 'Strategy',
  },
  {
    title: 'Expected Goals (xG) & xGA Football Betting Model Explained: How to Beat Bookmaker Lines',
    slug: 'expected-goals-xg-betting-model-explained',
    description: 'Discover how Expected Goals (xG) and Expected Goals Against (xGA) expose mispriced football odds and uncover high-yield betting value.',
    date: '2026-10-10T10:00:00Z',
    category: 'Analytics',
  },
  {
    title: 'Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Betting Syndicate Moves',
    slug: 'closing-line-value-clv-dropping-odds',
    description: 'Track real-time market steam moves and secure positive Closing Line Value before sportsbooks compress their lines.',
    date: '2026-10-08T09:00:00Z',
    category: 'Value Betting',
  },
  {
    title: 'Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Line Rules and Payouts',
    slug: 'asian-handicap-betting-explained',
    description: 'Master Asian Handicap lines, quarter-ball splits, and draw elimination strategies with practical matchday calculations.',
    date: '2026-10-05T14:00:00Z',
    category: 'Handicap',
  },
  {
    title: 'Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI and Variance Comparison',
    slug: 'draw-no-bet-vs-double-chance-strategy',
    description: 'Quantitative risk-reward comparison of Draw No Bet and Double Chance wagering across top European and domestic leagues.',
    date: '2026-10-02T11:00:00Z',
    category: 'Strategy',
  },
  {
    title: 'Premier League 2026/27 Season Prediction Guide: Tactical Matchday Insights & xG Form Tables',
    slug: 'premier-league-prediction-guide-2026',
    description: 'Comprehensive English Premier League tactical overview, title race probabilities, and relegation fight analysis.',
    date: '2026-09-28T16:00:00Z',
    category: 'Premier League',
  },
  {
    title: 'UEFA Champions League 36-Team Swiss Phase: How to Bet Smart Using Poisson Models',
    slug: 'champions-league-group-stage-tips',
    description: 'Navigating the new 36-team single league phase in the UEFA Champions League with motivation factors and goal differential models.',
    date: '2026-09-24T15:00:00Z',
    category: 'Champions League',
  },
  {
    title: 'How to Read AI Football Predictions Like a Pro: Implied Probability & Confidence Scores',
    slug: 'how-to-read-football-predictions',
    description: 'Step-by-step guide to interpreting AI win probabilities, confidence ratings, and Bivariate Poisson goal matrices.',
    date: '2026-09-22T10:00:00Z',
    category: 'Education',
  },
  {
    title: 'Value Betting in Football: A Complete Guide to Positive Expected Value (+EV)',
    slug: 'value-betting-explained',
    description: 'Learn how to calculate Expected Value (+EV), strip bookmaker overround margins, and identify mispriced football odds.',
    date: '2026-09-20T10:00:00Z',
    category: 'Value Betting',
  },
  {
    title: 'Bankroll Management for Football Bettors: Fractional Kelly Criterion Staking',
    slug: 'bankroll-management-football',
    description: 'Protect your sports betting capital and maximize compounding growth using fractional Kelly Criterion stake sizing.',
    date: '2026-09-18T10:00:00Z',
    category: 'Bankroll',
  },
  {
    title: 'BTTS and Over/Under 2.5 Goals: The Poisson Statistics Behind Goal Markets',
    slug: 'btts-over-under-strategy',
    description: 'Mathematical breakdown of Both Teams to Score (BTTS) and Over 2.5 Goals correlations across high-scoring football leagues.',
    date: '2026-09-16T10:00:00Z',
    category: 'Goals Markets',
  },
  {
    title: 'Kenya Premier League (FKF) Betting Guide 2026/27: Form Tables & M-Pesa Tips',
    slug: 'kpl-betting-guide-kenya',
    description: 'Tactical analysis of the FKF Kenyan Premier League, home-pitch altitude advantages, and low-xG derby patterns.',
    date: '2026-09-14T10:00:00Z',
    category: 'African Football',
  },
  {
    title: 'How to Build a Winning Football Accumulator: The 5-Fold Low-Correlation Formula',
    slug: 'accumulator-building-strategy',
    description: 'Avoid parlay variance traps by combining uncorrelated high-probability banker legs and Double Chance insurance.',
    date: '2026-09-12T10:00:00Z',
    category: 'Accumulators',
  },
  {
    title: 'Correct Score Betting: How Bivariate Poisson Matrices Predict Exact Scorelines',
    slug: 'correct-score-prediction-tips',
    description: 'Use Dixon-Coles adjusted Poisson probability grids and Dutching stake splitters to target high-odds exact scorelines.',
    date: '2026-09-10T10:00:00Z',
    category: 'Correct Score',
  },
  {
    title: 'US Soccer & MLS Betting Guide: Moneyline, Goal Spreads & AI Picks',
    slug: 'us-soccer-betting-guide-mls-odds',
    description: 'Master American Moneyline odds, travel fatigue factors, and high-scoring MLS Eastern vs Western Conference matchups.',
    date: '2026-09-08T10:00:00Z',
    category: 'MLS & Americas',
  },
];

const MATCH_PREDICTIONS = [
  {
    match: 'Arsenal vs Chelsea',
    slug: 'arsenal-vs-chelsea',
    league: 'Premier League',
    tip: 'Arsenal Win (74% AI Confidence)',
    xG: '2.14 - 0.98',
    analysis: 'Arsenal dominance in midfield territorial possession and defensive xGA compression points to a high-probability home win.',
  },
  {
    match: 'Real Madrid vs Barcelona',
    slug: 'real-madrid-vs-barcelona',
    league: 'La Liga',
    tip: 'Both Teams to Score (BTTS) & Over 2.5 Goals (82% Confidence)',
    xG: '2.45 - 2.18',
    analysis: 'El Clasico historical trends and ultra-high attacking xG pace indicate an open encounter with goals on both ends.',
  },
  {
    match: 'Liverpool vs Manchester City',
    slug: 'liverpool-vs-manchester-city',
    league: 'Premier League',
    tip: 'Over 2.5 Goals & Draw (66% Confidence)',
    xG: '1.82 - 1.76',
    analysis: 'Tactical stalemate between two high-pressing systems favors high goal volume with balanced point share.',
  },
  {
    match: 'Bayern Munich vs Borussia Dortmund',
    slug: 'bayern-munich-vs-borussia-dortmund',
    league: 'Bundesliga',
    tip: 'Bayern Munich Win & Over 3.5 Goals (78% Confidence)',
    xG: '3.10 - 1.40',
    analysis: 'Der Klassiker showcases highest combined xG of the European matchweek with Bayern historical goal conversion.',
  },
  {
    match: 'Inter Milan vs AC Milan',
    slug: 'inter-milan-vs-ac-milan',
    league: 'Serie A',
    tip: 'Inter Milan Win & Over 1.5 Goals (75% Confidence)',
    xG: '1.94 - 1.05',
    analysis: 'Derby della Madonnina tactical wing-back overloads give Inter Milan a decisive Expected Goals edge.',
  },
  {
    match: 'Gor Mahia vs AFC Leopards',
    slug: 'gor-mahia-vs-afc-leopards',
    league: 'FKF Kenya Premier League',
    tip: 'Gor Mahia Draw No Bet (72% Confidence)',
    xG: '1.25 - 0.65',
    analysis: 'Mashemeji derby low-scoring metrics paired with Gor Mahia defensive solidity favor a tight low-scoring victory.',
  },
  {
    match: 'Kaizer Chiefs vs Orlando Pirates',
    slug: 'kaizer-chiefs-vs-orlando-pirates',
    league: 'South Africa Betway Premiership (PSL)',
    tip: 'Under 2.5 Goals & Orlando Pirates 1X (76% Confidence)',
    xG: '0.88 - 1.32',
    analysis: 'Soweto Derby mid-block compactness and Pirates superior transition xG favor a disciplined low-scoring result.',
  },
  {
    match: 'Al Ahly vs Zamalek',
    slug: 'al-ahly-vs-zamalek',
    league: 'Egyptian Premier League',
    tip: 'Al Ahly Win (77% Confidence)',
    xG: '1.86 - 0.82',
    analysis: 'Cairo Derby championship pedigree and Al Ahly pressing efficiency project a commanding home performance.',
  },
  {
    match: 'Celtic vs Rangers',
    slug: 'celtic-vs-rangers',
    league: 'Scottish Premiership',
    tip: 'Over 2.5 Goals & BTTS Yes (79% Confidence)',
    xG: '2.08 - 1.42',
    analysis: 'Old Firm high-tempo wing play and corner volume create high goal expectancy on both sides.',
  },
  {
    match: 'Boca Juniors vs River Plate',
    slug: 'boca-juniors-vs-river-plate',
    league: 'Argentina Primera División',
    tip: 'Under 2.5 Goals & Over 5.5 Cards (83% Confidence)',
    xG: '1.05 - 1.12',
    analysis: 'Superclásico tactical intensity and Dixon-Coles low-score correlation strongly favor a tight, high-card encounter.',
  },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1. Build RSS 2.0 Feed
function buildRssXml() {
  const items = ARTICLES.map((art) => {
    const url = `${BASE_URL}/blog/${art.slug}`;
    const pubDate = new Date(art.date).toUTCString();
    return `    <item>
      <title>${escapeXml(art.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(art.category)}</category>
      <description>${escapeXml(art.description)}</description>
      <source url="${BASE_URL}/rss.xml">PredictPro AI Football Predictions</source>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PredictPro — AI Football Predictions &amp; Betting Strategy Guides</title>
    <link>${BASE_URL}/blog</link>
    <description>Daily verified AI football betting tips, Expected Goals (xG) statistics, Poisson score matrices, and quantitative sports analytics.</description>
    <language>en</language>
    <lastBuildDate>${BUILD_DATE}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/icon-512.png</url>
      <title>PredictPro</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>
`;
}

// 2. Build Atom 1.0 Feed
function buildAtomXml() {
  const entries = ARTICLES.map((art) => {
    const url = `${BASE_URL}/blog/${art.slug}`;
    return `  <entry>
    <title>${escapeXml(art.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${art.date}</updated>
    <summary>${escapeXml(art.description)}</summary>
    <author>
      <name>PredictPro Sports Analytics Team</name>
      <uri>${BASE_URL}/about</uri>
    </author>
  </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>PredictPro AI Sports Intelligence Feed</title>
  <subtitle>Daily AI football predictions, Poisson distributions, and quantitative +EV betting tips</subtitle>
  <link href="${BASE_URL}/feed.xml" rel="self" />
  <link href="${BASE_URL}" />
  <id>${BASE_URL}/feed.xml</id>
  <updated>${TODAY_ISO}</updated>
  <author>
    <name>PredictPro Editorial &amp; Data Science Desk</name>
    <email>vincentmwangangiz@gmail.com</email>
  </author>
${entries}
</feed>
`;
}

// 3. Build Daily Predictions Feed for Sports Bloggers & Aggregators
function buildPredictionsSyndicationXml() {
  const items = MATCH_PREDICTIONS.map((p) => {
    const url = `${BASE_URL}/predict/${p.slug}`;
    return `    <item>
      <title>${escapeXml(p.match)}: AI Prediction &amp; Betting Analysis (${escapeXml(p.league)})</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${BUILD_DATE}</pubDate>
      <category>${escapeXml(p.league)}</category>
      <description>${escapeXml(
        `${p.match} AI Prediction: ${p.tip}. Projected xG: ${p.xG}. Analysis: ${p.analysis} Full statistical breakdown, lineups, and Poisson probability matrix at PredictPro.`
      )}</description>
      <content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[
        <p><strong>Fixture:</strong> ${p.match} (${p.league})</p>
        <p><strong>AI Selection:</strong> ${p.tip}</p>
        <p><strong>Expected Goals (xG):</strong> ${p.xG}</p>
        <p><strong>Tactical Summary:</strong> ${p.analysis}</p>
        <p><a href="${url}" rel="dofollow">Read the full ${p.match} prediction, lineups, and live odds on PredictPro</a>.</p>
      ]]></content:encoded>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PredictPro Daily Football Match Predictions Feed</title>
    <link>${BASE_URL}/best-bets</link>
    <description>Daily syndication feed for sports publishers, bloggers, and football tipsters featuring verified AI selections and Poisson xG modeling.</description>
    <language>en</language>
    <lastBuildDate>${BUILD_DATE}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed-predictions.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

// Write files
fs.writeFileSync(path.join(PUBLIC_DIR, 'rss.xml'), buildRssXml(), 'utf-8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'feed.xml'), buildAtomXml(), 'utf-8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'feed-predictions.xml'), buildPredictionsSyndicationXml(), 'utf-8');

console.log('✅ Generated public/rss.xml');
console.log('✅ Generated public/feed.xml');
console.log('✅ Generated public/feed-predictions.xml');
