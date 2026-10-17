import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
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
  { slug: 'how-to-read-football-predictions', title: 'How to Read AI Football Predictions Like a Pro', date: '2026-09-30' },
  { slug: 'expected-goals-xg-betting-model-explained', title: 'Expected Goals (xG) & xGA Football Betting Model Explained: How to Beat Bookmaker Lines', date: '2026-09-30' },
  { slug: 'halftime-fulltime-ht-ft-predictions-strategy', title: 'Half-Time / Full-Time (HT/FT) Football Predictions: Mathematical Turnaround & Draw-Win Strategy', date: '2026-09-30' },
  { slug: 'value-betting-explained', title: 'Value Betting in Football: A Complete +EV Guide', date: '2026-09-30' },
  { slug: 'asian-handicap-betting-explained', title: 'Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Lines', date: '2026-09-30' },
  { slug: 'draw-no-bet-vs-double-chance-strategy', title: 'Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI Guide', date: '2026-09-30' },
  { slug: 'closing-line-value-clv-dropping-odds', title: 'Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Steam', date: '2026-09-30' },
  { slug: 'bankroll-management-football', title: 'Bankroll Management & Kelly Criterion for Football Bettors', date: '2026-09-30' },
  { slug: 'premier-league-prediction-guide-2026', title: 'Premier League 2026/27 AI Prediction & xG Guide', date: '2026-09-30' },
  { slug: 'champions-league-group-stage-tips', title: 'Champions League 36-Team Swiss Phase: How to Bet Smart', date: '2026-09-30' },
  { slug: 'btts-over-under-strategy', title: 'BTTS and Over/Under 2.5: The Poisson Stats Behind Goal Markets', date: '2026-09-30' },
  { slug: 'kpl-betting-guide-kenya', title: 'Kenya Premier League (FKF) Betting Guide 2026/27', date: '2026-09-30' },
  { slug: 'accumulator-building-strategy', title: 'How to Build a Winning Football Accumulator: The 5-Fold Formula', date: '2026-09-30' },
  { slug: 'correct-score-prediction-tips', title: 'Correct Score Betting: How Poisson Matrices Predict Exact Scorelines', date: '2026-09-30' },
  { slug: 'sportpesa-mega-jackpot-prediction-17-games', title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI', date: '2026-09-30' },
  { slug: 'us-soccer-betting-guide-mls-odds', title: 'US Soccer & MLS Betting Guide: Moneyline, Spreads & AI Picks', date: '2026-09-30' },
];

/**
 * Generate match prediction slugs from team names and date
 */
export function formatMatchSlug(homeTeam: string, awayTeam: string, _matchDate?: string): string {
  const sanitize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${sanitize(homeTeam)}-vs-${sanitize(awayTeam)}`;
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
    { path: '/europa-league-predictions', title: 'UEFA Europa League Predictions & Conference League AI Odds', priority: 0.95 },
    { path: '/conference-league-predictions', title: 'UEFA Conference League Predictions & AI Betting Tips', priority: 0.95 },
    { path: '/la-liga-predictions', title: 'La Liga AI Predictions & Match Previews', priority: 0.95 },
    { path: '/bundesliga-predictions', title: 'Bundesliga Predictions & Form Analysis', priority: 0.95 },
    { path: '/serie-a-predictions', title: 'Serie A Predictions & Tactical Insights', priority: 0.95 },
    { path: '/ligue-1-predictions', title: 'French Ligue 1 AI Predictions: PSG, Marseille & xG Odds', priority: 0.95 },
    { path: '/championship-predictions', title: 'English Championship Predictions & AI Betting Tips 2026/27', priority: 0.95 },
    { path: '/eredivisie-predictions', title: 'Dutch Eredivisie AI Predictions: Ajax, PSV, Feyenoord & xG Tips', priority: 0.95 },
    { path: '/primeira-liga-predictions', title: 'Portuguese Primeira Liga Predictions: Benfica, Sporting CP & Porto', priority: 0.95 },
    { path: '/copa-libertadores-predictions', title: 'Copa Libertadores AI Predictions: South American Odds & Tips', priority: 0.95 },
    { path: '/saudi-pro-league-predictions', title: 'Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL Tips', priority: 0.95 },
    { path: '/brazilian-serie-a-predictions', title: 'Brazilian Serie A Predictions Today: Brasileirão AI Tips & Odds', priority: 0.95 },
    { path: '/scottish-premiership-predictions', title: 'Scottish Premiership Predictions Today: Celtic, Rangers & SPFL Tips', priority: 0.95 },
    { path: '/fa-cup-predictions', title: 'FA Cup & Carabao Cup Predictions Today: English Knockout AI Tips', priority: 0.95 },
    { path: '/turkish-super-lig-predictions', title: 'Turkish Süper Lig Predictions Today: Galatasaray & Fenerbahçe Tips', priority: 0.95 },
    { path: '/belgian-pro-league-predictions', title: 'Belgian Pro League Predictions Today: Jupiler League AI Tips', priority: 0.90 },
    { path: '/argentina-primera-predictions', title: 'Argentina Primera División Predictions: Liga Profesional AI Tips', priority: 0.90 },
    { path: '/greek-super-league-predictions', title: 'Greek Super League Predictions: Olympiacos, PAOK, AEK & Panathinaikos', priority: 0.90 },
    { path: '/liga-mx-predictions', title: 'Liga MX Predictions Today: Club América, Monterrey & Mexican Tips', priority: 0.95 },
    { path: '/mls-predictions', title: 'MLS Predictions Today: Inter Miami, LAFC & Major League Soccer Tips', priority: 0.95 },
    { path: '/south-africa-psl-predictions', title: 'South Africa PSL Predictions Today: Betway Premiership AI Tips', priority: 0.95 },
    { path: '/nigerian-npfl-predictions', title: 'Nigeria NPFL Predictions Today: Enyimba, Remo Stars & Rangers Tips', priority: 0.95 },
    { path: '/egyptian-premier-league-predictions', title: 'Egyptian Premier League Predictions Today: Al Ahly & Zamalek Tips', priority: 0.95 },
    { path: '/j-league-predictions', title: 'Japan J1 League Predictions Today: Early Kickoff xG & Corners Tips', priority: 0.90 },
    { path: '/australian-a-league-predictions', title: 'Australian A-League Predictions Today: Over 2.5 Goals & Corners Tips', priority: 0.90 },
    { path: '/world-cup-predictions', title: 'FIFA World Cup 2026 Predictions & Qualifying Tips', priority: 0.90 },
    { path: '/afcon-predictions', title: 'AFCON Predictions & African Football Odds', priority: 0.90 },
    { path: '/kpl-predictions', title: 'FKF Kenya Premier League Predictions & M-Pesa Tips', priority: 0.90 },
    { path: '/jackpot-predictions', title: 'SportPesa Mega Jackpot & Betika Grand AI Predictions (17 Games)', priority: 0.95 },
    { path: '/midweek-jackpot-predictions', title: 'Midweek Jackpot Predictions Today: 13 & 15 Games AI Banker Tips', priority: 0.95 },
    { path: '/us-soccer-predictions', title: 'US Soccer Picks, MLS Moneyline & Champions League Odds', priority: 0.90 },
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
    { path: '/today-predictions', title: "Today's Football Predictions: Daily AI Match Tips & Odds", priority: 0.95, changeFreq: 'daily' },
    { path: '/sure-win-predictions', title: 'Sure Win Predictions Today: 88%+ AI Confidence Banker Bets', priority: 0.95, changeFreq: 'daily' },
    { path: '/rollover-bets-predictions', title: 'Rollover Bets Predictions Today: 7-Day 1.50 & 2.00 Odds Challenge', priority: 0.95, changeFreq: 'daily' },
    { path: '/daily-2-odds-predictions', title: 'Sure 2 Odds, 3 Odds & 5 Odds Predictions Today: Daily AI Slips', priority: 0.95, changeFreq: 'daily' },
    { path: '/2-odds-predictions', title: 'Sure 2 Odds Predictions Today: Daily 2.00+ Rollover Banker Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/5-odds-predictions', title: 'Sure 5 Odds & 10 Odds Predictions Today: Daily Acca Slips', priority: 0.90, changeFreq: 'daily' },
    { path: '/bet-builder-predictions', title: 'Bet Builder Predictions Today: Same-Game Parlay (SGP) AI Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/tomorrow-predictions', title: "Tomorrow's Football Predictions: Early AI Betting Tips & xG Odds", priority: 0.95, changeFreq: 'daily' },
    { path: '/weekend-predictions', title: 'Weekend Football Predictions: Saturday & Sunday Banker Acca Tips', priority: 0.95, changeFreq: 'daily' },
    { path: '/first-half-goals-predictions', title: 'Over 0.5 First Half Goals Predictions Today: 1H Goal AI Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/second-half-goals-predictions', title: 'Second Half Goals Predictions Today: 2H Over 1.5 & Late xG Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/both-halves-predictions', title: 'Score in Both Halves & Win Both Halves Predictions Today', priority: 0.90, changeFreq: 'daily' },
    { path: '/under-2-5-goals-predictions', title: 'Under 2.5 Goals Predictions Today: Low-Scoring AI Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-3-5-goals-predictions', title: 'Over 3.5 Goals Predictions Today: High-Scoring 4+ Goal AI Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/both-teams-to-score-and-win-predictions', title: 'BTTS & Win Predictions Today: Both Teams to Score + Over 2.5 Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/anytime-goalscorer-predictions', title: 'Anytime Goalscorer Predictions Today: Player xG & Shots on Target', priority: 0.90, changeFreq: 'daily' },
    { path: '/asian-handicap-predictions', title: 'Asian Handicap Predictions Today: -0.5, -0.75 & -1.5 Football Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/handicap-1x2-predictions', title: 'European Handicap (-1) Predictions Today: 3-Way Goal Margin Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/draw-no-bet-predictions', title: 'Draw No Bet Predictions Today (DNB): Safe Football Refund Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/win-to-nil-predictions', title: 'Win to Nil & Clean Sheet Predictions Today: Defensive xGA Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/best-bets', title: 'Best AI Football Bets Today - Top Confidence Picks', priority: 0.95, changeFreq: 'daily' },
    { path: '/bet-of-the-day', title: 'Bet of the Day: Daily AI Banker & High-Confidence Lock', priority: 0.95, changeFreq: 'daily' },
    { path: '/corners-predictions', title: 'Corner Predictions Today: Over 8.5, 9.5 & 10.5 Match Corners Stats', priority: 0.90, changeFreq: 'daily' },
    { path: '/cards-predictions', title: 'Cards & Bookings Predictions Today: Yellow & Red Card Stats', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-1-5-goals-predictions', title: 'Over 1.5 Goals Predictions Today: 85%+ High-Probability Multi-Bet Tips', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-under-predictions', title: 'Over/Under 2.5 Goals Predictions & Poisson Goal Probabilities', priority: 0.90, changeFreq: 'daily' },
    { path: '/double-chance-predictions', title: 'Double Chance Predictions Today (1X / X2): 89% AI Strike Rate', priority: 0.90, changeFreq: 'daily' },
    { path: '/draw-predictions', title: 'Draw Predictions Today (X Tips): High-Odds Stalemate Picks', priority: 0.90, changeFreq: 'daily' },
    { path: '/halftime-fulltime-predictions', title: 'HT/FT Predictions Today: Half-Time/Full-Time (4.50+ Odds)', priority: 0.90, changeFreq: 'daily' },
    { path: '/value-bet-calculator', title: 'Value Bet Calculator (+EV): Sports Betting Expected Value Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/kelly-criterion-calculator', title: 'Kelly Criterion Calculator: Sports Betting Bankroll Staking Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/parlay-calculator', title: 'Parlay & Accumulator Odds Calculator: Multi-Bet Payout Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/system-bet-calculator', title: 'System Bet Calculator: Trixie, Yankee, Patent & Lucky 15 Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/dutching-calculator', title: 'Dutching Calculator: Equal-Profit Multi-Outcome & Correct Score Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/hedge-bet-calculator', title: 'Hedge Bet Calculator: Lock In Profit vs Bookmaker Cash-Out Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/roi-yield-calculator', title: 'Betting ROI & Yield Calculator: Break-Even Win Rate Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/arbitrage-calculator', title: 'Arbitrage Betting Calculator: 2-Way & 3-Way Surebet Staking Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/margin-calculator', title: 'Bookmaker Margin & No-Vig Fair Odds Calculator (Overround Tool)', priority: 0.90, changeFreq: 'weekly' },
    { path: '/odds-converter', title: 'Betting Odds Converter & Implied Probability Calculator (UK/US/EU)', priority: 0.90, changeFreq: 'weekly' },
    { path: '/poisson-calculator', title: 'Poisson Football Calculator & Expected Goals Score Simulator', priority: 0.90, changeFreq: 'weekly' },
    { path: '/predict', title: 'AI Match Predictor & Custom Football Simulator', priority: 0.90, changeFreq: 'daily' },
    { path: '/upcoming', title: 'Upcoming Football Fixtures & Match Predictions', priority: 0.90, changeFreq: 'daily' },
    { path: '/live', title: 'Live Football Scores, In-Play AI Odds & Minute Trackers', priority: 0.90, changeFreq: 'hourly' },
    { path: '/value-bets', title: 'Value Bets & Expected Value (EV) Football Calculator', priority: 0.85, changeFreq: 'daily' },
    { path: '/streaks', title: 'AI Football Streaks & Winning Trends Radar - Over 2.5 & BTTS', priority: 0.85, changeFreq: 'daily' },
    { path: '/h2h', title: 'AI Football Head-to-Head (H2H) Comparison & Poisson Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/standings', title: 'Real-Time Football League Standings & Form Tables', priority: 0.90, changeFreq: 'daily' },
    { path: '/correct-score', title: 'AI Correct Score Predictions & Exact Scoreline Probabilities', priority: 0.85, changeFreq: 'daily' },
    { path: '/btts', title: 'Both Teams to Score (BTTS) & Goal Market Tips', priority: 0.85, changeFreq: 'daily' },
    { path: '/accumulator', title: 'AI Accumulator Builder & Multibet Optimizer', priority: 0.85, changeFreq: 'daily' },
    { path: '/widgets', title: 'Embeddable AI Football Predictions Widget & Free Odds Feed', priority: 0.85, changeFreq: 'weekly' },
    { path: '/shop', title: 'PredictPro VIP Club: Premium AI Football Tips & Banker Passes', priority: 0.90, changeFreq: 'daily' },
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
    { path: '/methodology', title: 'AI Prediction Methodology, Expected Goals & Data Science', priority: 0.75, changeFreq: 'monthly' },
    { path: '/about', title: 'About PredictPro - AI Football Intelligence Platform', priority: 0.70, changeFreq: 'monthly' },
    { path: '/blog', title: 'PredictPro Football Betting Strategy Blog & Analysis', priority: 0.85, changeFreq: 'daily' },
    { path: '/recommendations', title: 'Curated AI Football Picks & Top Value Match Locks', priority: 0.90, changeFreq: 'daily' },
    { path: '/tournaments', title: 'Global Football Tournaments, Cups & International Leagues', priority: 0.85, changeFreq: 'daily' },
    { path: '/dropping-odds', title: 'Dropping Odds Radar & Market Steam Move Tracker', priority: 0.85, changeFreq: 'hourly' },
    { path: '/screener', title: 'Match Screener & Multi-Filter Football Stats Scanner', priority: 0.85, changeFreq: 'daily' },
    { path: '/track-record', title: 'Verified AI Prediction Track Record & Strike Rate History', priority: 0.85, changeFreq: 'daily' },
    { path: '/responsible-gaming', title: 'Responsible Gaming & 18+ Minor Protection Policy', priority: 0.75, changeFreq: 'monthly' },
    { path: '/privacy', title: 'Privacy Policy - GDPR & Google AdSense Compliance', priority: 0.70, changeFreq: 'monthly' },
    { path: '/terms', title: 'Terms of Service & User Agreement', priority: 0.70, changeFreq: 'monthly' },
    { path: '/cookies', title: 'Cookie Policy & Advertising Transparency', priority: 0.70, changeFreq: 'monthly' },
    { path: '/contact', title: 'Contact Us & Publisher Support Desk', priority: 0.70, changeFreq: 'monthly' },
    { path: '/sitemap', title: 'PredictPro HTML Sitemap & Indexed Directory', priority: 0.65, changeFreq: 'daily' },
    { path: '/performance', title: 'AI Model Performance, ROI Analytics & League Accuracy', priority: 0.85, changeFreq: 'daily' },
    { path: '/rewards', title: 'PredictPro Rewards, Prediction Challenges & VIP Points', priority: 0.80, changeFreq: 'weekly' },
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
  for (const pred of getUpdatedDefaultPredictions()) {
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

  // Add additional popular top matchups across all parts of the continent for comprehensive crawler coverage
  const featuredClubs = [
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
    { home: 'Liverpool', away: 'Manchester City', league: 'Premier League' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A' },
    { home: 'Manchester United', away: 'Tottenham', league: 'Premier League' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1' },
    { home: 'Gor Mahia', away: 'AFC Leopards', league: 'Kenya Premier League' },
    { home: 'Simba SC', away: 'Young Africans', league: 'Tanzania NBC Premier League' },
    { home: 'Kaizer Chiefs', away: 'Orlando Pirates', league: 'South Africa PSL' },
    { home: 'Mamelodi Sundowns', away: 'Orlando Pirates', league: 'CAF Champions League' },
    { home: 'Enyimba', away: 'Rangers International', league: 'Nigeria NPFL' },
    { home: 'Hearts of Oak', away: 'Asante Kotoko', league: 'Ghana Premier League' },
    { home: 'Al Ahly', away: 'Zamalek', league: 'Egyptian Premier League' },
    { home: 'Wydad AC', away: 'Raja Casablanca', league: 'Botola Pro Morocco' },
    { home: 'TP Mazembe', away: 'AS Vita Club', league: 'DR Congo Linafoot' },
    { home: 'Juventus', away: 'Napoli', league: 'Serie A' },
    { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga' },
    { home: 'LA Galaxy', away: 'LAFC', league: 'Major League Soccer' },
    { home: 'Inter Miami', away: 'New York Red Bulls', league: 'Major League Soccer' },
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
  'de-DE',
  'it-IT',
  'nl-NL',
  'ar',
  'ar-EG',
  'ar-SA',
  'ar-AE',
  'ar-MA',
];

/**
 * Generate XML string complying with the official Sitemaps XML protocol (Yandex, Google, Bing compliant)
 */
export function generateSitemapXml(baseUrl: string = BASE_URL): string {
  const entries = getAllSitemapEntries(baseUrl);

  const xmlUrls = entries
    .map((entry) => {
      const links = GLOBAL_HREFLANGS.map((lang) => {
        return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(entry.url)}" />`;
      }).join('\n');

      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>
${links}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
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
