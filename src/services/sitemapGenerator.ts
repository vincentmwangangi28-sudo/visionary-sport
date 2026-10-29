import { getUpdatedDefaultPredictions } from '../data/mockPredictions';

export interface SitemapEntry {
  url: string;
  path: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  category: 'core' | 'league' | 'feature' | 'match' | 'blog' | 'team' | 'info';
  title: string;
  imageUrl?: string;
}

export const BASE_URL = 'https://predictpro.guru';

// Blog strategy articles (all 20 guides with fresh 2026-10-23 timestamps for Google Discover)
export const BLOG_POSTS_METADATA = [
  { slug: 'universal-bet-code-converter-sportybet-1xbet-bet9ja', title: 'Universal Football Booking Code Converter: Translate SportyBet, 1xBet, Bet9ja & Betway Slips', date: '2026-10-23' },
  { slug: 'bivariate-poisson-dixon-coles-score-matrix-guide', title: 'Bivariate Poisson & Dixon-Coles 6×6 Score Matrix: Calculating True Football Probabilities', date: '2026-10-23' },
  { slug: '2-score-correct-score-dutching-strategy', title: '2-Score Correct Score Dutching Strategy: Equal-Profit Staking for Football Scorelines', date: '2026-10-23' },
  { slug: 'referee-cards-corners-prop-modeling', title: 'Referee Card Strictness & Wing Attack Width: Quantitative Modeling for Corners & Bookings', date: '2026-10-23' },
  { slug: 'how-to-read-football-predictions', title: 'How to Read AI Football Predictions Like a Pro', date: '2026-10-23' },
  { slug: 'expected-goals-xg-betting-model-explained', title: 'Expected Goals (xG) & xGA Football Betting Model Explained: How to Beat Bookmaker Lines', date: '2026-10-23' },
  { slug: 'halftime-fulltime-ht-ft-predictions-strategy', title: 'Half-Time / Full-Time (HT/FT) Football Predictions: Mathematical Turnaround & Draw-Win Strategy', date: '2026-10-23' },
  { slug: 'value-betting-explained', title: 'Value Betting in Football: A Complete +EV Guide', date: '2026-10-23' },
  { slug: 'asian-handicap-betting-explained', title: 'Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Lines', date: '2026-10-23' },
  { slug: 'draw-no-bet-vs-double-chance-strategy', title: 'Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI Guide', date: '2026-10-23' },
  { slug: 'closing-line-value-clv-dropping-odds', title: 'Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Steam', date: '2026-10-23' },
  { slug: 'bankroll-management-football', title: 'Bankroll Management & Kelly Criterion for Football Bettors', date: '2026-10-23' },
  { slug: 'premier-league-prediction-guide-2026', title: 'Premier League 2026/27 AI Prediction & xG Guide', date: '2026-10-23' },
  { slug: 'champions-league-group-stage-tips', title: 'Champions League 36-Team Swiss Phase: How to Bet Smart', date: '2026-10-23' },
  { slug: 'btts-over-under-strategy', title: 'BTTS and Over/Under 2.5: The Poisson Stats Behind Goal Markets', date: '2026-10-23' },
  { slug: 'kpl-betting-guide-kenya', title: 'Kenya Premier League (FKF) Betting Guide 2026/27', date: '2026-10-23' },
  { slug: 'accumulator-building-strategy', title: 'How to Build a Winning Football Accumulator: The 5-Fold Formula', date: '2026-10-23' },
  { slug: 'correct-score-prediction-tips', title: 'Correct Score Betting: How Poisson Matrices Predict Exact Scorelines', date: '2026-10-23' },
  { slug: 'sportpesa-mega-jackpot-prediction-17-games', title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI', date: '2026-10-23' },
  { slug: 'us-soccer-betting-guide-mls-odds', title: 'US Soccer & MLS Betting Guide: Moneyline, Spreads & AI Picks', date: '2026-10-23' },
];

export const CLUB_ANALYTICS_HUBS = [
  { slug: 'arsenal', name: 'Arsenal', league: 'Premier League' },
  { slug: 'manchester-city', name: 'Manchester City', league: 'Premier League' },
  { slug: 'liverpool', name: 'Liverpool', league: 'Premier League' },
  { slug: 'chelsea', name: 'Chelsea', league: 'Premier League' },
  { slug: 'manchester-united', name: 'Manchester United', league: 'Premier League' },
  { slug: 'real-madrid', name: 'Real Madrid', league: 'La Liga' },
  { slug: 'barcelona', name: 'Barcelona', league: 'La Liga' },
  { slug: 'atletico-madrid', name: 'Atletico Madrid', league: 'La Liga' },
  { slug: 'bayern-munich', name: 'Bayern Munich', league: 'Bundesliga' },
  { slug: 'borussia-dortmund', name: 'Borussia Dortmund', league: 'Bundesliga' },
  { slug: 'inter-milan', name: 'Inter Milan', league: 'Serie A' },
  { slug: 'ac-milan', name: 'AC Milan', league: 'Serie A' },
  { slug: 'juventus', name: 'Juventus', league: 'Serie A' },
  { slug: 'napoli', name: 'Napoli', league: 'Serie A' },
  { slug: 'psg', name: 'Paris Saint-Germain (PSG)', league: 'Ligue 1' },
  { slug: 'al-hilal', name: 'Al-Hilal', league: 'Saudi Pro League' },
  { slug: 'al-nassr', name: 'Al-Nassr', league: 'Saudi Pro League' },
  { slug: 'inter-miami', name: 'Inter Miami CF', league: 'Major League Soccer' },
  { slug: 'al-ahly', name: 'Al Ahly SC', league: 'CAF Champions League' },
  { slug: 'mamelodi-sundowns', name: 'Mamelodi Sundowns', league: 'South Africa PSL' },
  { slug: 'gor-mahia', name: 'Gor Mahia FC', league: 'Kenya Premier League' },
  { slug: 'simba-sc', name: 'Simba SC', league: 'Tanzania NBC Premier League' },
  { slug: 'young-africans', name: 'Young Africans SC (Yanga)', league: 'Tanzania NBC Premier League' },
  { slug: 'raja-casablanca', name: 'Raja Casablanca', league: 'Morocco Botola Pro' },
  { slug: 'kaizer-chiefs', name: 'Kaizer Chiefs', league: 'South Africa PSL' },
  { slug: 'enyimba', name: 'Enyimba FC', league: 'Nigeria NPFL' },
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
    changeFrequency: 'always',
    priority: 1.0,
    category: 'core',
    title: 'PredictPro - AI Football Predictions, Expected Goals (xG) & Live Match Intelligence',
    imageUrl: `${baseUrl}/og-image.jpg`,
  });

  // 2. League Prediction Hubs
  const leagueHubs: Array<{ path: string; title: string; priority: number }> = [
    { path: '/premier-league-predictions', title: 'Premier League Predictions & AI Expected Goals (xG) Forecasts', priority: 0.95 },
    { path: '/champions-league-predictions', title: 'UEFA Champions League Predictions & 36-Team Swiss Phase Odds', priority: 0.95 },
    { path: '/europa-league-predictions', title: 'UEFA Europa League Predictions & Knockout AI Odds', priority: 0.95 },
    { path: '/conference-league-predictions', title: 'UEFA Conference League Predictions & Match Previews', priority: 0.95 },
    { path: '/la-liga-predictions', title: 'La Liga AI Predictions, xG Tables & Match Previews', priority: 0.95 },
    { path: '/bundesliga-predictions', title: 'Bundesliga Predictions, Over 2.5 Goals & Form Analysis', priority: 0.95 },
    { path: '/serie-a-predictions', title: 'Serie A Predictions, Defensive xGA & Tactical Insights', priority: 0.95 },
    { path: '/ligue-1-predictions', title: 'French Ligue 1 AI Predictions: PSG, Marseille & xG Odds', priority: 0.95 },
    { path: '/championship-predictions', title: 'English Championship Predictions & 46-Round xG Forecasts', priority: 0.95 },
    { path: '/eredivisie-predictions', title: 'Dutch Eredivisie AI Predictions: Ajax, PSV, Feyenoord & xG', priority: 0.95 },
    { path: '/primeira-liga-predictions', title: 'Portuguese Primeira Liga Predictions: Benfica, Sporting CP & Porto', priority: 0.95 },
    { path: '/copa-libertadores-predictions', title: 'Copa Libertadores AI Predictions: South American Altitude & xG', priority: 0.95 },
    { path: '/saudi-pro-league-predictions', title: 'Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL xG', priority: 0.95 },
    { path: '/brazilian-serie-a-predictions', title: 'Brazilian Serie A Predictions Today: Brasileirão AI Forecasts', priority: 0.95 },
    { path: '/scottish-premiership-predictions', title: 'Scottish Premiership Predictions Today: Celtic, Rangers & SPFL', priority: 0.95 },
    { path: '/fa-cup-predictions', title: 'FA Cup & Carabao Cup Predictions Today: English Knockout Ties', priority: 0.95 },
    { path: '/turkish-super-lig-predictions', title: 'Turkish Süper Lig Predictions Today: Galatasaray & Fenerbahçe', priority: 0.95 },
    { path: '/belgian-pro-league-predictions', title: 'Belgian Pro League Predictions Today: Jupiler League AI Models', priority: 0.90 },
    { path: '/argentina-primera-predictions', title: 'Argentina Primera División Predictions: Liga Profesional xG', priority: 0.90 },
    { path: '/greek-super-league-predictions', title: 'Greek Super League Predictions: Olympiacos, PAOK, AEK & Panathinaikos', priority: 0.90 },
    { path: '/liga-mx-predictions', title: 'Liga MX Predictions Today: Club América, Monterrey & Clausura/Apertura', priority: 0.95 },
    { path: '/mls-predictions', title: 'MLS Predictions Today: Inter Miami, LAFC & Major League Soccer xG', priority: 0.95 },
    { path: '/south-africa-psl-predictions', title: 'South Africa PSL Predictions Today: Betway Premiership AI Stats', priority: 0.95 },
    { path: '/nigerian-npfl-predictions', title: 'Nigeria NPFL Predictions Today: Enyimba, Remo Stars & Rangers', priority: 0.95 },
    { path: '/egyptian-premier-league-predictions', title: 'Egyptian Premier League Predictions Today: Al Ahly & Zamalek', priority: 0.95 },
    { path: '/tanzania-premier-league-predictions', title: 'Tanzania NBC Premier League Predictions: Simba SC, Yanga & Azam Tips', priority: 0.95 },
    { path: '/ghana-premier-league-predictions', title: 'Ghana Premier League Predictions Today: Asante Kotoko & Hearts of Oak', priority: 0.95 },
    { path: '/morocco-botola-pro-predictions', title: 'Morocco Botola Pro Predictions Today: Raja, Wydad & AS FAR Tips', priority: 0.95 },
    { path: '/caf-champions-league-predictions', title: 'CAF Champions League Predictions Today: Al Ahly, Sundowns & Esperance', priority: 0.95 },
    { path: '/uganda-premier-league-predictions', title: 'Uganda Premier League Predictions Today: Vipers SC, KCCA & SC Villa', priority: 0.90 },
    { path: '/j-league-predictions', title: 'Japan J1 League Predictions Today: Early Kickoff xG & Corners', priority: 0.90 },
    { path: '/k-league-predictions', title: 'South Korea K League 1 Predictions Today: Ulsan HD, Jeonbuk & FC Seoul', priority: 0.90 },
    { path: '/australian-a-league-predictions', title: 'Australian A-League Predictions Today: Over 2.5 Goals & Corners', priority: 0.90 },
    { path: '/world-cup-predictions', title: 'FIFA World Cup 2026 Predictions & Continental Qualifying Models', priority: 0.90 },
    { path: '/afcon-predictions', title: 'AFCON Predictions & CAF Champions League Football Analytics', priority: 0.90 },
    { path: '/kpl-predictions', title: 'FKF Kenya Premier League Predictions & East African Football Hub', priority: 0.90 },
    { path: '/jackpot-predictions', title: '17-Game Mega Jackpot & Grand Jackpot AI Probability Combinations', priority: 0.95 },
    { path: '/midweek-jackpot-predictions', title: 'Midweek Jackpot Predictions Today: 13 & 15 Game Statistical Splits', priority: 0.95 },
    { path: '/us-soccer-predictions', title: 'US Soccer Picks, MLS Moneyline & Concacaf Champions Cup Odds', priority: 0.90 },
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
      imageUrl: `${baseUrl}/og-image.jpg`,
    });
  }

  // 3. Feature Tools & Quantitative Markets
  const featurePages: Array<{ path: string; title: string; priority: number; changeFreq: SitemapEntry['changeFrequency'] }> = [
    { path: '/booking-code-converter', title: 'Universal Bet Booking Code Converter: SportyBet, Betika, SportPesa & 1xBet', priority: 0.95, changeFreq: 'daily' },
    { path: '/jackpot-generator', title: '17-Game Mega & Midweek Jackpot Combination Generator (SportPesa, Betika & Mozzart)', priority: 0.95, changeFreq: 'daily' },
    { path: '/in-play-predictions', title: 'Live In-Play Football Predictions, APPM Momentum & Next-Goal Alert Radar', priority: 0.95, changeFreq: 'always' },
    { path: '/set-piece-specialists', title: 'Designated Penalty Takers, Free-Kick Specialists & Corner Aerial Threat Hub', priority: 0.95, changeFreq: 'daily' },
    { path: '/sharp-money-splits', title: 'Sharp Money, Public Betting Splits & Reverse Line Movement (RLM) Scanner', priority: 0.95, changeFreq: 'hourly' },
    { path: '/injury-lineup-impact', title: 'Confirmed Lineups, Key Injury & Suspension xG Impact Analyzer', priority: 0.95, changeFreq: 'daily' },
    { path: '/stadium-altitude-weather', title: 'Stadium Altitude, Weather, Pitch Surface & Travel Fatigue xG Modifier Hub', priority: 0.90, changeFreq: 'daily' },
    { path: '/tactical-mismatch-matrix', title: 'Tactical Style Mismatch, PPDA Press & Coaching DNA Matrix', priority: 0.90, changeFreq: 'daily' },
    { path: '/referee-stats-predictions', title: 'Referee Card Stats, VAR Penalty Rates & Bookings Predictions Today', priority: 0.95, changeFreq: 'daily' },
    { path: '/slip-generator', title: 'Universal Bookmaker Booking Code Converter & Slip Generator (SportyBet, 1xBet, Bet9ja, Betway)', priority: 0.95, changeFreq: 'daily' },
    { path: '/booking-codes', title: 'Daily Football Booking Codes & Multi-Bookmaker Coupon Converter', priority: 0.95, changeFreq: 'daily' },
    { path: '/code-converter', title: 'Free Bet Code Converter: Convert SportyBet, 1xBet, Bet9ja & Betway Codes', priority: 0.95, changeFreq: 'daily' },
    { path: '/teams', title: 'Club Expected Goals (xG) Analytics & Fixture Difficulty Rating (FDR) Hub', priority: 0.95, changeFreq: 'daily' },
    { path: '/today-predictions', title: "Today's Football Predictions: Daily AI Match Forecasts & xG Odds", priority: 0.95, changeFreq: 'hourly' },
    { path: '/sure-win-predictions', title: 'High-Consensus Football Match Forecasts: 88%+ AI Confidence Picks', priority: 0.95, changeFreq: 'daily' },
    { path: '/rollover-bets-predictions', title: 'Rollover Progression Tracker: 7-Day 1.50 & 2.00 Odds Statistical Matrix', priority: 0.95, changeFreq: 'daily' },
    { path: '/daily-2-odds-predictions', title: 'Daily 2.00, 3.00 & 5.00 Combined Odds Statistical Slips', priority: 0.95, changeFreq: 'daily' },
    { path: '/2-odds-predictions', title: 'Daily 2.00+ Combined Odds Low-Variance Double Selections', priority: 0.90, changeFreq: 'daily' },
    { path: '/5-odds-predictions', title: 'Daily 5.00 & 10.00 Combined Odds Multi-Match Accumulator Slips', priority: 0.90, changeFreq: 'daily' },
    { path: '/bet-builder-predictions', title: 'Same-Game Parlay (SGP) & Bet Builder Correlated Match Models', priority: 0.90, changeFreq: 'daily' },
    { path: '/tomorrow-predictions', title: "Tomorrow's Football Predictions: Early Opening Line & xG Forecasts", priority: 0.95, changeFreq: 'daily' },
    { path: '/weekend-predictions', title: 'Weekend Football Predictions: Saturday & Sunday European & Global Slate', priority: 0.95, changeFreq: 'daily' },
    { path: '/first-half-goals-predictions', title: 'Over 0.5 First Half Goals (1H xG) Statistical Predictions Today', priority: 0.90, changeFreq: 'daily' },
    { path: '/second-half-goals-predictions', title: 'Second Half Goals Predictions Today: 2H Over 1.5 & Late Momentum', priority: 0.90, changeFreq: 'daily' },
    { path: '/both-halves-predictions', title: 'Score in Both Halves & Win Both Halves Probability Models Today', priority: 0.90, changeFreq: 'daily' },
    { path: '/under-2-5-goals-predictions', title: 'Under 2.5 Goals Predictions Today: Low-Scoring Defensive xGA Models', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-3-5-goals-predictions', title: 'Over 3.5 Goals Predictions Today: High-Event 4+ Goal Poisson Picks', priority: 0.90, changeFreq: 'daily' },
    { path: '/both-teams-to-score-and-win-predictions', title: 'BTTS & Win Predictions Today: Correlated Match Winner + Goal Markets', priority: 0.90, changeFreq: 'daily' },
    { path: '/anytime-goalscorer-predictions', title: 'Anytime Goalscorer Predictions Today: Player xG/90 & Shots on Target', priority: 0.90, changeFreq: 'daily' },
    { path: '/asian-handicap-predictions', title: 'Asian Handicap Predictions Today: -0.5, -0.75 & -1.5 Goal Line Models', priority: 0.90, changeFreq: 'daily' },
    { path: '/handicap-1x2-predictions', title: 'European Handicap (-1) Predictions Today: 3-Way Goal Margin Stats', priority: 0.90, changeFreq: 'daily' },
    { path: '/draw-no-bet-predictions', title: 'Draw No Bet Predictions Today (DNB): Draw-Refund Probability Models', priority: 0.90, changeFreq: 'daily' },
    { path: '/win-to-nil-predictions', title: 'Win to Nil & Clean Sheet Predictions Today: Defensive Suppression xGA', priority: 0.90, changeFreq: 'daily' },
    { path: '/best-bets', title: 'Best AI Football Forecasts Today - Top Statistical Consensus Picks', priority: 0.95, changeFreq: 'hourly' },
    { path: '/bet-of-the-day', title: 'Match of the Day: Highest Daily AI Confidence & xG Edge', priority: 0.95, changeFreq: 'daily' },
    { path: '/corners-predictions', title: 'Corner Predictions Today: Over 8.5, 9.5 & 10.5 Wing Attack Width Stats', priority: 0.90, changeFreq: 'daily' },
    { path: '/cards-predictions', title: 'Cards & Bookings Predictions Today: Referee Strictness & Foul Telemetry', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-1-5-goals-predictions', title: 'Over 1.5 Goals Predictions Today: 85%+ Poisson Probability Multi-Legs', priority: 0.90, changeFreq: 'daily' },
    { path: '/over-under-predictions', title: 'Over/Under 2.5 Goals Predictions & Bivariate Poisson Goal Distributions', priority: 0.90, changeFreq: 'daily' },
    { path: '/double-chance-predictions', title: 'Double Chance Predictions Today (1X / X2): High-Stability Coverage', priority: 0.90, changeFreq: 'daily' },
    { path: '/draw-predictions', title: 'Draw Predictions Today (X Forecasts): Dixon-Coles Stalemate Detector', priority: 0.90, changeFreq: 'daily' },
    { path: '/halftime-fulltime-predictions', title: 'HT/FT Predictions Today: Half-Time / Full-Time Turnaround & 1/1 Models', priority: 0.90, changeFreq: 'daily' },
    { path: '/value-bet-calculator', title: 'Value Bet Calculator (+EV): Sports Probability Expected Value Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/kelly-criterion-calculator', title: 'Kelly Criterion Calculator: Fractional Bankroll Staking Optimizer', priority: 0.90, changeFreq: 'weekly' },
    { path: '/parlay-calculator', title: 'Parlay & Accumulator Odds Calculator: Multi-Leg Compounding Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/system-bet-calculator', title: 'System Bet Calculator: Trixie, Yankee, Patent & Lucky 15 Combinatorics', priority: 0.90, changeFreq: 'weekly' },
    { path: '/dutching-calculator', title: 'Dutching Calculator: Equal-Profit Multi-Outcome & 2-Score Cover Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/hedge-bet-calculator', title: 'Hedge Calculator: Lock In Guaranteed Return vs Cash-Out Value', priority: 0.90, changeFreq: 'weekly' },
    { path: '/roi-yield-calculator', title: 'ROI & Yield Calculator: Break-Even Win Rate & CLV Tracker', priority: 0.90, changeFreq: 'weekly' },
    { path: '/arbitrage-calculator', title: 'Arbitrage Calculator: 2-Way & 3-Way Cross-Market Implied Margin Tool', priority: 0.90, changeFreq: 'weekly' },
    { path: '/margin-calculator', title: 'Bookmaker Margin & No-Vig Fair Odds Calculator (Overround Stripper)', priority: 0.90, changeFreq: 'weekly' },
    { path: '/odds-converter', title: 'Odds Converter & Implied Probability Calculator (Decimal, UK, US)', priority: 0.90, changeFreq: 'weekly' },
    { path: '/poisson-calculator', title: '6×6 Bivariate Poisson & Dixon-Coles Score Matrix Simulator', priority: 0.95, changeFreq: 'daily' },
    { path: '/predict', title: 'Interactive AI Match Predictor & Custom Club-vs-Club Simulator', priority: 0.95, changeFreq: 'daily' },
    { path: '/upcoming', title: 'Upcoming Football Fixtures, Kickoff Times & Early xG Projections', priority: 0.95, changeFreq: 'hourly' },
    { path: '/live', title: 'Live Football Scores, In-Play Momentum & Real-Time Match Tracker', priority: 0.95, changeFreq: 'always' },
    { path: '/value-bets', title: 'Positive Expected Value (+EV) Scanner & Fair Odds Discrepancy Hub', priority: 0.90, changeFreq: 'hourly' },
    { path: '/streaks', title: 'Team Winning Streaks, Unbeaten Runs & Over 2.5 / BTTS Trends Radar', priority: 0.85, changeFreq: 'daily' },
    { path: '/h2h', title: 'Head-to-Head (H2H) Club Comparison & Historical Dominance Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/standings', title: 'Live Football League Standings, Form Tables & Expected Points (xPTS)', priority: 0.90, changeFreq: 'daily' },
    { path: '/correct-score', title: 'Exact Correct Score Matrix & 2-Score Dutching Cover Predictions', priority: 0.90, changeFreq: 'daily' },
    { path: '/btts', title: 'Both Teams to Score (BTTS) & Goal Expectancy Correlation Hub', priority: 0.90, changeFreq: 'daily' },
    { path: '/accumulator', title: 'Smart Accumulator Builder & 2× High-DPI PNG Coupon Exporter', priority: 0.90, changeFreq: 'daily' },
    { path: '/widgets', title: 'Embeddable Football Analytics Widgets & Live Match Center Feeds', priority: 0.85, changeFreq: 'weekly' },
    { path: '/shop', title: 'PredictPro Open-Access Member Features & Analytics Suite', priority: 0.85, changeFreq: 'weekly' },
    { path: '/statistics', title: 'Global Football Statistics, League Goals per Match & xG Benchmarks', priority: 0.85, changeFreq: 'daily' },
    { path: '/highlights', title: 'Official Football Match Video Highlights & Regional TV Broadcast Guide', priority: 0.85, changeFreq: 'daily' },
    { path: '/players', title: 'Player xG/90, 10.0 Form Ratings & 5-Axis Tactical Radar Comparison', priority: 0.90, changeFreq: 'daily' },
    { path: '/player-props', title: 'Interactive Football Player Prop Simulator: Anytime Goalscorer & Shots on Target', priority: 0.90, changeFreq: 'daily' },
    { path: '/players/erling-haaland', title: 'Erling Haaland Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/kylian-mbappe', title: 'Kylian Mbappé Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/mohamed-salah', title: 'Mohamed Salah Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/bukayo-saka', title: 'Bukayo Saka Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/harry-kane', title: 'Harry Kane Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/jude-bellingham', title: 'Jude Bellingham Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/lamine-yamal', title: 'Lamine Yamal Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/cole-palmer', title: 'Cole Palmer Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/victor-osimhen', title: 'Victor Osimhen Player Rating, 2D Heatmap & Goalscorer Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/players/austin-odhiambo', title: 'Austin Odhiambo (Gor Mahia) Player Rating, 2D Heatmap & Prop Simulator', priority: 0.85, changeFreq: 'daily' },
    { path: '/insights', title: 'Deep Tactical Match Insights & Quantitative Previews', priority: 0.85, changeFreq: 'daily' },
    { path: '/news', title: 'Breaking Football Injury News, Confirmed Lineups & xG Impact Wire', priority: 0.90, changeFreq: 'hourly' },
    { path: '/tipsters', title: 'Verified Community Analysts & Historical ROI Leaderboard', priority: 0.80, changeFreq: 'daily' },
    { path: '/bankroll', title: 'Bankroll Portfolio Tracker & Fractional Kelly Staking Simulator', priority: 0.80, changeFreq: 'weekly' },
    { path: '/leaderboard', title: 'Global Community Prediction Accuracy Leaderboard', priority: 0.80, changeFreq: 'daily' },
    { path: '/sports', title: 'Multi-Sport Quantitative Models: Basketball, Tennis, NFL & Rugby', priority: 0.75, changeFreq: 'weekly' },
    { path: '/archive', title: 'Permanent Settled Match Prediction Archive & Verified Results Audit', priority: 0.85, changeFreq: 'daily' },
    { path: '/methodology', title: 'PredictPro Bivariate Poisson, Dixon-Coles & Expected Goals Methodology', priority: 0.85, changeFreq: 'monthly' },
    { path: '/about', title: 'About PredictPro - Independent Quantitative Sports Analytics Publication', priority: 0.80, changeFreq: 'monthly' },
    { path: '/blog', title: 'Quantitative Football Strategy Blog, xG Guides & Tactical Analysis', priority: 0.90, changeFreq: 'daily' },
    { path: '/recommendations', title: 'Curated High-Consensus Daily Football Match Recommendations', priority: 0.90, changeFreq: 'daily' },
    { path: '/tournaments', title: 'Global Football Tournaments, Continental Cups & International Slates', priority: 0.85, changeFreq: 'daily' },
    { path: '/dropping-odds', title: 'Dropping Odds Steam Scanner & Implied Probability Surge Tracker', priority: 0.90, changeFreq: 'hourly' },
    { path: '/screener', title: 'Multi-Filter Quantitative Football Match Screener (xG, EV, Streaks)', priority: 0.85, changeFreq: 'daily' },
    { path: '/track-record', title: 'Audited AI Model Track Record, Closing Line Value (CLV) & ROI', priority: 0.85, changeFreq: 'daily' },
    { path: '/responsible-gaming', title: 'Responsible Gaming, 18+ Minor Protection & Informational Disclaimer', priority: 0.75, changeFreq: 'monthly' },
    { path: '/privacy', title: 'Privacy Policy - GDPR, CCPA & Google AdSense Publisher Compliance', priority: 0.75, changeFreq: 'monthly' },
    { path: '/terms', title: 'Terms of Service & Informational Publishing Agreement', priority: 0.75, changeFreq: 'monthly' },
    { path: '/cookies', title: 'Cookie Policy, Google Consent Mode v2 & Ad Personalization Controls', priority: 0.75, changeFreq: 'monthly' },
    { path: '/contact', title: 'Contact Our Editorial & Quantitative Engineering Support Desk', priority: 0.75, changeFreq: 'monthly' },
    { path: '/sitemap', title: 'PredictPro HTML Sitemap, Google Discover Feeds & XML Route Directory', priority: 0.75, changeFreq: 'daily' },
    { path: '/performance', title: 'Real-Time AI Model Accuracy, League Strike Rates & Yield Telemetry', priority: 0.85, changeFreq: 'daily' },
    { path: '/rewards', title: 'Community Prediction Challenges, Badges & Free Member Milestones', priority: 0.80, changeFreq: 'weekly' },
    { path: '/dashboard', title: 'Personalized AI Football Predictions & Custom Club Feed Dashboard', priority: 0.85, changeFreq: 'daily' },
    { path: '/live-multiview', title: 'Live 4-Match Multi-View Command Center & In-Play Scoreboard Grid', priority: 0.90, changeFreq: 'always' },
    { path: '/closing-line-value', title: 'Closing Line Value (CLV) & Sharp Steam Scanner', priority: 0.95, changeFreq: 'hourly' },
    { path: '/sgp-builder', title: 'Correlated Same-Game Parlay (SGP) Gaussian Copula Builder', priority: 0.95, changeFreq: 'daily' },
    { path: '/pitch-telemetry', title: '2D Pitch Shot Map, Expected Threat (xT) & Passing Network Hub', priority: 0.90, changeFreq: 'daily' },
    { path: '/xpts-standings', title: 'Expected Points (xPTS) Justice Standings & Regression Table', priority: 0.95, changeFreq: 'daily' },
    { path: '/bracket-simulator', title: 'Interactive Knockout Bracket Tree & Road-to-Final Simulator', priority: 0.90, changeFreq: 'daily' },
    { path: '/in-play-edge', title: "In-Play Momentum & 75'+ Late-Goal Edge Radar", priority: 0.95, changeFreq: 'always' },
    { path: '/social-card-studio', title: 'Social Slip & Win Card 2× High-DPI PNG Generator Studio', priority: 0.85, changeFreq: 'weekly' },
    { path: '/tournament-simulator', title: '10,000-Run Monte Carlo Tournament Group Stage Simulator', priority: 0.90, changeFreq: 'daily' },
    { path: '/bet-tracker', title: 'Personal Bet Tracker, Bankroll Equity Curve & ESPN Auto-Settlement', priority: 0.95, changeFreq: 'daily' },
    { path: '/referrals', title: 'Viral Referral Hub & Free Pro Analytics Tier Unlock', priority: 0.80, changeFreq: 'weekly' },
    { path: '/community-slips', title: 'Community Copy-Bet Feed & Upvoted Multi-Bookmaker Slips', priority: 0.90, changeFreq: 'hourly' },
    { path: '/pick-em-challenge', title: "Daily Free-to-Play 5-Match Pick'em Prediction Challenge", priority: 0.90, changeFreq: 'daily' },
    { path: '/alert-center', title: 'Telegram, WhatsApp & Browser Push Live Alert Command Center', priority: 0.85, changeFreq: 'daily' },
    { path: '/cashout-calculator', title: 'Accumulator Cash-Out & Final-Leg Live Hedge Stake Calculator', priority: 0.95, changeFreq: 'weekly' },
    { path: '/arbitrage-finder', title: 'Multi-Bookmaker Arbitrage & Surebet Matrix (Anti-Detection Rounding)', priority: 0.95, changeFreq: 'hourly' },
    { path: '/rollover-challenge', title: 'Compound Rollover & Profit-Skim Staking Ladder Simulator', priority: 0.95, changeFreq: 'daily' },
    { path: '/asian-handicap-calculator', title: 'Quarter-Ball Asian Handicap (±0.25, ±0.75) Split-Stake Matrix', priority: 0.95, changeFreq: 'weekly' },
    { path: '/syndicate-pools', title: '17-Game Jackpot Syndicate Pools & Private Mini-Leagues Hub', priority: 0.90, changeFreq: 'daily' },
    { path: '/corner-stats-scanner', title: 'Corner Kick Tempo, Wing Width & Bivariate Poisson Corner Scanner', priority: 0.95, changeFreq: 'daily' },
    { path: '/cash-out-calculator', title: 'Cash-Out Fair Equity vs Bookmaker Haircut Auditor', priority: 0.95, changeFreq: 'weekly' },
    { path: '/referee-stats-scanner', title: 'Referee Discipline, Fouls-per-Tackle & Booking Points Matrix', priority: 0.95, changeFreq: 'daily' },
    { path: '/player-props-lab', title: 'Player Shots on Target (1+ / 2+ SoT) & Anytime Goalscorer Prop Lab', priority: 0.95, changeFreq: 'daily' },
    { path: '/trixie-yankee-calculator', title: 'Trixie, Yankee, Lucky 15, Heinz & System Bet Permutation Simulator', priority: 0.95, changeFreq: 'weekly' },
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
      imageUrl: `${baseUrl}/og-image.jpg`,
    });
  }

  // 4. Club Expected Goals (xG) & Fixture Difficulty Rating (FDR) Hubs (/teams/:teamSlug)
  for (const club of CLUB_ANALYTICS_HUBS) {
    entries.push({
      url: `${baseUrl}/teams/${club.slug}`,
      path: `/teams/${club.slug}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.85,
      category: 'team',
      title: `${club.name} xG Stats, Form, Fixture Difficulty (FDR) & AI Predictions (${club.league})`,
      imageUrl: `${baseUrl}/og-image.jpg`,
    });
  }

  // 5. Dynamic Match Prediction Routes
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
        priority: 0.85,
        category: 'match',
        title: `${pred.home_team} vs ${pred.away_team} Prediction, 6×6 Poisson Matrix & xG Odds (${pred.league})`,
        imageUrl: `${baseUrl}/api/og?home=${encodeURIComponent(pred.home_team)}&away=${encodeURIComponent(pred.away_team)}`,
      });
    }
  }

  // Add flagship global derbies & continental clashes for maximum search & Google Discover reach
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
    { home: 'Al-Hilal', away: 'Al-Nassr', league: 'Saudi Pro League' },
    { home: 'Celtic', away: 'Rangers', league: 'Scottish Premiership' },
    { home: 'Galatasaray', away: 'Fenerbahce', league: 'Turkish Super Lig' },
    { home: 'Benfica', away: 'Sporting CP', league: 'Primeira Liga' },
    { home: 'Ajax', away: 'Feyenoord', league: 'Eredivisie' },
    { home: 'Flamengo', away: 'Palmeiras', league: 'Brazilian Serie A' },
    { home: 'Boca Juniors', away: 'River Plate', league: 'Argentina Primera Division' },
    { home: 'Club America', away: 'Guadalajara', league: 'Liga MX' },
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
        priority: 0.85,
        category: 'match',
        title: `${fixture.home} vs ${fixture.away} Prediction, xG & Head-to-Head (${fixture.league})`,
        imageUrl: `${baseUrl}/og-image.jpg`,
      });
    }
  }

  // 6. Blog Strategy Articles
  for (const post of BLOG_POSTS_METADATA) {
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      path: `/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'weekly',
      priority: 0.85,
      category: 'blog',
      title: post.title,
      imageUrl: `${baseUrl}/og-image.jpg`,
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
 * Generate XML string complying with the official Sitemaps XML + Google Image Sitemap protocol
 * for Google Search, Google Discover (max-image-preview:large), Bing, and Yandex.
 */
export function generateSitemapXml(baseUrl: string = BASE_URL, filterCategory?: SitemapEntry['category']): string {
  const allEntries = getAllSitemapEntries(baseUrl);
  const entries = filterCategory
    ? allEntries.filter((e) => e.category === filterCategory)
    : allEntries;

  const xmlUrls = entries
    .map((entry) => {
      const links = GLOBAL_HREFLANGS.map((lang) => {
        return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(entry.url)}" />`;
      }).join('\n');

      const imageBlock = entry.imageUrl
        ? `\n    <image:image>\n      <image:loc>${escapeXml(entry.imageUrl)}</image:loc>\n      <image:title>${escapeXml(entry.title)}</image:title>\n    </image:image>`
        : '';

      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>${imageBlock}
${links}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;
}

/**
 * Generates a dedicated Google Discover & Google News Sitemap XML for rapid content feed ingestion
 */
export function generateGoogleDiscoverNewsSitemapXml(baseUrl: string = BASE_URL): string {
  const todayIso = new Date().toISOString();
  const entries = getAllSitemapEntries(baseUrl).filter(
    (e) => e.category === 'blog' || e.category === 'match' || e.category === 'league' || e.priority >= 0.9
  );

  const items = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>
    <news:news>
      <news:publication>
        <news:name>PredictPro Quantitative Football Analytics</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${todayIso}</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>
    </news:news>
    <image:image>
      <image:loc>${escapeXml(entry.imageUrl || `${baseUrl}/og-image.jpg`)}</image:loc>
      <image:title>${escapeXml(entry.title)}</image:title>
    </image:image>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;
}

/**
 * Generate Sitemap Index XML (sitemap-index.xml) referencing category sub-sitemaps
 */
export function generateSitemapIndexXml(baseUrl: string = BASE_URL): string {
  const today = new Date().toISOString().split('T')[0];
  const subSitemaps = [
    'sitemap.xml',
    'sitemap-core.xml',
    'sitemap-leagues.xml',
    'sitemap-matches.xml',
    'sitemap-blog.xml',
    'sitemap-yandex.xml',
  ];
  const entries = subSitemaps
    .map(
      (file) => `  <sitemap>
    <loc>${escapeXml(`${baseUrl}/${file}`)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
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
export function downloadSitemapXml(baseUrl: string = BASE_URL, filename: string = 'sitemap.xml') {
  const xml = generateSitemapXml(baseUrl);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to trigger client-side download of the Google Discover & News Sitemap XML
 */
export function downloadDiscoverSitemapXml(baseUrl: string = BASE_URL) {
  const xml = generateGoogleDiscoverNewsSitemapXml(baseUrl);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap-discover-news.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


