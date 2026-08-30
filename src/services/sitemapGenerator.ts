import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { LEAGUES_LIST } from '@/services/realtimeFootball';

export interface SitemapEntry {
  url: string;
  path: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  category: 'core' | 'league' | 'feature' | 'match' | 'blog' | 'info';
  title: string;
}

export const BASE_URL = 'https://predictpro.guru';

// Blog strategy articles
export const BLOG_POSTS_METADATA = [
  { slug: 'how-to-read-football-predictions', title: 'How to Read AI Football Predictions Like a Pro', date: '2026-06-04' },
  { slug: 'value-betting-explained', title: 'Value Betting in Football: A Complete Guide', date: '2026-06-03' },
  { slug: 'bankroll-management-football', title: 'Bankroll Management for Football Bettors', date: '2026-06-02' },
  { slug: 'premier-league-prediction-guide-2026', title: 'Premier League 2025/26 Prediction Guide', date: '2026-06-01' },
  { slug: 'champions-league-group-stage-tips', title: 'Champions League Group Stage: How to Bet Smart', date: '2026-05-31' },
  { slug: 'btts-over-under-strategy', title: 'BTTS and Over/Under: The Stats Behind Goal Markets', date: '2026-05-30' },
  { slug: 'kpl-betting-guide-kenya', title: 'Kenya Premier League Betting Guide 2026', date: '2026-05-29' },
  { slug: 'accumulator-building-strategy', title: 'How to Build a Winning Football Accumulator', date: '2026-05-28' },
  { slug: 'correct-score-prediction-tips', title: 'Correct Score Betting: Can AI Really Predict the Scoreline?', date: '2026-05-27' },
];

/**
 * Generate match prediction slugs from team names and date
 */
export function formatMatchSlug(homeTeam: string, awayTeam: string, matchDate: string): string {
  const sanitize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const datePart = matchDate.split('T')[0] || new Date().toISOString().split('T')[0];
  return `${sanitize(homeTeam)}-vs-${sanitize(awayTeam)}-${datePart}`;
}

/**
 * Generates the complete, structured list of sitemap entries
 */
export function getAllSitemapEntries(baseUrl: string = BASE_URL): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  const entries: SitemapEntry[] = [];

  // 1. Core & Landing
  entries.push({
    url: `${baseUrl}/`,
    path: '/',
    lastModified: today,
    changeFrequency: 'daily',
    priority: 1.0,
    category: 'core',
    title: 'PredictPro - AI Football Predictions & Live Match Intelligence',
  });

  // 2. League Prediction Hubs
  const leagueHubs: Array<{ path: string; title: string; priority: number }> = [
    { path: '/premier-league-predictions', title: 'Premier League Predictions & AI Betting Tips', priority: 0.95 },
    { path: '/champions-league-predictions', title: 'UEFA Champions League Predictions & Odds', priority: 0.95 },
    { path: '/la-liga-predictions', title: 'La Liga AI Predictions & Match Previews', priority: 0.95 },
    { path: '/bundesliga-predictions', title: 'Bundesliga Predictions & Form Analysis', priority: 0.95 },
    { path: '/serie-a-predictions', title: 'Serie A Predictions & Tactical Insights', priority: 0.95 },
    { path: '/world-cup-predictions', title: 'FIFA World Cup 2026 Predictions & Qualifying Tips', priority: 0.90 },
    { path: '/afcon-predictions', title: 'AFCON Predictions & African Football Odds', priority: 0.90 },
    { path: '/kpl-predictions', title: 'FKF Kenya Premier League Predictions & M-Pesa Tips', priority: 0.90 },
  ];

  for (const hub of leagueHubs) {
    entries.push({
      url: `${baseUrl}${hub.path}`,
      path: hub.path,
      lastModified: today,
      changeFrequency: 'daily',
      priority: hub.priority,
      category: 'league',
      title: hub.title,
    });
  }

  // 3. Feature Tools & Betting Markets
  const featurePages: Array<{ path: string; title: string; priority: number; changeFreq: SitemapEntry['changeFrequency'] }> = [
    { path: '/predict', title: 'AI Match Predictor & Custom Football Simulator', priority: 0.90, changeFreq: 'daily' },
    { path: '/live', title: 'Live Football Scores, In-Play AI Odds & Minute Trackers', priority: 0.90, changeFreq: 'hourly' },
    { path: '/standings', title: 'Real-Time Football League Standings & Form Tables', priority: 0.90, changeFreq: 'daily' },
    { path: '/best-bets', title: 'Best AI Football Bets Today - Top Confidence Picks', priority: 0.85, changeFreq: 'daily' },
    { path: '/value-bets', title: 'Value Bets & Expected Value (EV) Football Calculator', priority: 0.85, changeFreq: 'daily' },
    { path: '/correct-score', title: 'AI Correct Score Predictions & Exact Scoreline Probabilities', priority: 0.85, changeFreq: 'daily' },
    { path: '/btts', title: 'Both Teams to Score (BTTS) & Goal Market Tips', priority: 0.85, changeFreq: 'daily' },
    { path: '/accumulator', title: 'AI Accumulator Builder & Multibet Optimizer', priority: 0.85, changeFreq: 'daily' },
    { path: '/statistics', title: 'Football Statistics, Head-to-Head & Team Metrics', priority: 0.80, changeFreq: 'weekly' },
    { path: '/highlights', title: 'Match Video Highlights & Goal Clips', priority: 0.80, changeFreq: 'daily' },
    { path: '/players', title: 'Player Search, Form Stats & Goalscorer Trends', priority: 0.80, changeFreq: 'weekly' },
    { path: '/insights', title: 'Deep Match Insights & Tactical Previews', priority: 0.80, changeFreq: 'daily' },
    { path: '/news', title: 'Latest Football News, Transfers & Breaking Updates', priority: 0.80, changeFreq: 'daily' },
    { path: '/tipsters', title: 'Top AI Tipster Profiles & Verified Track Records', priority: 0.75, changeFreq: 'weekly' },
    { path: '/bankroll', title: 'Bankroll Manager & Kelly Criterion Staking Calculator', priority: 0.75, changeFreq: 'weekly' },
    { path: '/leaderboard', title: 'PredictPro Global Leaderboard & Tipster Rankings', priority: 0.75, changeFreq: 'daily' },
    { path: '/sports', title: 'Multi-Sports Predictions: Basketball, Tennis, NFL & Rugby', priority: 0.75, changeFreq: 'weekly' },
    { path: '/archive', title: 'Past Match Prediction Archive & Result Verification', priority: 0.70, changeFreq: 'weekly' },
    { path: '/results', title: 'Historical Football Results & Prediction Outcomes', priority: 0.70, changeFreq: 'daily' },
    { path: '/methodology', title: 'AI Prediction Methodology, Expected Goals & Data Science', priority: 0.75, changeFreq: 'monthly' },
    { path: '/about', title: 'About PredictPro - AI Football Intelligence Platform', priority: 0.70, changeFreq: 'monthly' },
    { path: '/blog', title: 'PredictPro Football Betting Strategy Blog & Analysis', priority: 0.85, changeFreq: 'daily' },
    { path: '/sitemap', title: 'PredictPro HTML Sitemap & Indexed Directory', priority: 0.60, changeFreq: 'weekly' },
  ];

  for (const page of featurePages) {
    entries.push({
      url: `${baseUrl}${page.path}`,
      path: page.path,
      lastModified: today,
      changeFrequency: page.changeFreq,
      priority: page.priority,
      category: 'feature',
      title: page.title,
    });
  }

  // 4. Dynamic Match Prediction Routes
  const seenMatches = new Set<string>();
  for (const pred of DEFAULT_PREDICTIONS) {
    const slug = formatMatchSlug(pred.home_team, pred.away_team, pred.match_date);
    if (!seenMatches.has(slug)) {
      seenMatches.add(slug);
      const matchDateStr = pred.match_date.split('T')[0] || today;
      entries.push({
        url: `${baseUrl}/predict/${slug}`,
        path: `/predict/${slug}`,
        lastModified: matchDateStr,
        changeFrequency: 'daily',
        priority: 0.80,
        category: 'match',
        title: `${pred.home_team} vs ${pred.away_team} Prediction, AI Odds & Lineups (${pred.league})`,
      });
    }
  }

  // Add additional popular top matchups for comprehensive crawler coverage
  const featuredClubs = [
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
    { home: 'Manchester City', away: 'Liverpool', league: 'Premier League' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'Inter Milan', away: 'Juventus', league: 'Serie A' },
    { home: 'Paris Saint-Germain', away: 'Marseille', league: 'Ligue 1' },
    { home: 'Gor Mahia', away: 'AFC Leopards', league: 'Kenya Premier League' },
  ];

  for (const fixture of featuredClubs) {
    const slug = formatMatchSlug(fixture.home, fixture.away, today);
    if (!seenMatches.has(slug)) {
      seenMatches.add(slug);
      entries.push({
        url: `${baseUrl}/predict/${slug}`,
        path: `/predict/${slug}`,
        lastModified: today,
        changeFrequency: 'daily',
        priority: 0.80,
        category: 'match',
        title: `${fixture.home} vs ${fixture.away} Prediction & Head-to-Head (${fixture.league})`,
      });
    }
  }

  // 5. Blog Articles
  for (const post of BLOG_POSTS_METADATA) {
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      path: `/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly',
      priority: 0.75,
      category: 'blog',
      title: post.title,
    });
  }

  return entries;
}

/**
 * Generate XML string complying with the official Sitemaps XML protocol
 */
export function generateSitemapXml(baseUrl: string = BASE_URL): string {
  const entries = getAllSitemapEntries(baseUrl);

  const xmlUrls = entries
    .map((entry) => {
      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlUrls}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to trigger client-side download of the sitemap.xml file
 */
export function downloadSitemapXml(baseUrl: string = BASE_URL) {
  const xml = generateSitemapXml(baseUrl);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
