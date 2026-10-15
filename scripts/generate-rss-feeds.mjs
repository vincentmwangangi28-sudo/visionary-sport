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
    match: 'Gor Mahia vs AFC Leopards',
    slug: 'gor-mahia-vs-afc-leopards',
    league: 'FKF Kenya Premier League',
    tip: 'Gor Mahia Draw No Bet (72% Confidence)',
    xG: '1.25 - 0.65',
    analysis: 'Mashemeji derby low-scoring metrics paired with Gor Mahia defensive solidity favor a tight low-scoring victory.',
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
    <email>support@predictpro.guru</email>
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
