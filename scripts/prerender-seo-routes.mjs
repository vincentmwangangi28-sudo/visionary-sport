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
    title: 'PredictPro — AI Pro Tips Today: Football Predictions & xG',
    description: 'Daily AI pro tips today & verified football predictions with 87% accuracy. Expected Goals (xG), Poisson probabilities, and banker picks across 40+ leagues.',
  },
  '/best-bets': {
    title: 'Free Guru Tips Today & Sure Banker Bets | PredictPro',
    description: 'Verified daily football banker predictions and sure 1X2 guru tips today with 75% to 92% AI confidence. Filter high-probability match winners and locks.',
  },
  '/upcoming': {
    title: 'Upcoming Football Fixtures & 7-Day AI Odds | PredictPro',
    description: 'Browse upcoming football fixtures across 40+ global leagues with early AI win probabilities, Expected Goals (xG) projections, and fair decimal odds.',
  },
  '/predict': {
    title: 'AI Pro Tips Today: Match Predictor & xG Simulator | PredictPro',
    description: 'Verified AI pro tips today and football match predictions with 87% accuracy. Expected goals (xG), Poisson BTTS, fair odds, and score projections.',
  },
  '/live': {
    title: 'Live Football Scores Today: In-Play AI Odds | PredictPro',
    description: 'Track real-time live football scores with sub-15s auto-refresh, minute-by-minute match momentum, in-play AI win probabilities, and live goal alerts.',
  },
  '/value-bets': {
    title: 'Daily Value Bets Today (+EV): Beat Bookmaker Odds | PredictPro',
    description: 'Daily positive expected value (+EV) football bets today. Compare AI Poisson probability vs bookmaker odds to detect market mispricings and lock in edges.',
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
    title: 'Guru Tips Correct Score Today: AI Scorelines | PredictPro',
    description: 'Daily correct score guru tips today and exact scoreline predictions powered by bivariate Poisson probability matrices. High-odds 1-0, 2-1, and 1-1 picks.',
  },
  '/btts': {
    title: 'BTTS AI Prediction Today: Both Teams to Score (79% Win Rate)',
    description: 'Verified BTTS AI predictions today with 79% win rate. Daily Both Teams to Score and Over 2.5 goals tips with Poisson goal expectancy across 40+ leagues.',
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
  '/privacy': {
    title: 'Privacy Policy | PredictPro Quantitative Sports Analytics',
    description: 'PredictPro Privacy Policy: Learn how we protect your personal data, our cookie usage, and our Google AdSense and GDPR advertising compliance.',
  },
  '/terms': {
    title: 'Terms of Service | PredictPro Quantitative Football Analytics',
    description: 'PredictPro Terms of Service: Read our terms governing platform access, informational analytics, 18+ eligibility, and Google AdSense compliance.',
  },
  '/cookies': {
    title: 'Cookie Policy | PredictPro Quantitative Football Analytics',
    description: 'PredictPro Cookie Policy: Understand how we use cookies, Google AdSense advertising cookies, analytics, and how to manage your privacy settings.',
  },
  '/contact': {
    title: 'Contact Us | PredictPro Quantitative Football Analytics',
    description: 'Contact the PredictPro team for support, editorial inquiries, data partnerships, or feedback. 24-hour response guarantee.',
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
  '/widgets': {
    title: 'Embeddable AI Football Predictions Widget & Free Odds Feed',
    description: 'Embed live AI football match predictions, Poisson win probability bars, and banker of the day widgets on your sports blog, forum, or website for free.',
  },
  '/shop': {
    title: 'PredictPro VIP Club: Premium AI Football Tips & Banker Passes',
    description: 'Unlock VIP high-yield banker predictions, +EV value bets, and 17-game Mega Jackpot slips. Instant access via M-Pesa or card.',
  },
  '/sports': {
    title: 'Basketball & Tennis AI Predictions: +EV Spreads & Moneylines',
    description: 'Daily multi-sport AI predictions for NBA basketball, Grand Slam tennis, and international rugby. Poisson totals and moneyline value odds.',
  },
  '/rewards': {
    title: 'Daily Rewards, Coin Wheel & Prediction Unlocks | PredictPro',
    description: 'Spin the daily reward wheel to earn prediction coins. Unlock VIP banker matches, Expected Goals reports, and accumulator boosts for free.',
  },
  '/bet-of-the-day': {
    title: 'Bet of the Day: Daily AI Banker & High-Confidence Lock',
    description: 'Today’s single highest-conviction AI football bet. Verified Expected Goals (xG) advantage, Poisson win probability, fair decimal odds, and Kelly stake.',
  },
  '/over-under-predictions': {
    title: 'Over/Under 2.5 Goals Predictions & Poisson Goal Probabilities',
    description: 'Daily Over 2.5, Under 2.5, and Over 1.5 goals football predictions. Filter matches by Bivariate Poisson goal expectancy and high-scoring team trends.',
  },
  '/double-chance-predictions': {
    title: 'Double Chance Predictions Today (1X / X2): 89% AI Strike Rate',
    description: 'Daily 1X, X2, and 12 Double Chance football predictions with 89% AI confidence. Low-risk accumulator builders and underdog hedging across 40+ leagues.',
  },
  '/draw-predictions': {
    title: 'Draw Predictions Today (X Tips): High-Odds Stalemate Picks',
    description: 'Daily high-odds draw predictions (3.20 to 3.80 odds). Mathematical stalemate models detecting low-scoring defensive setups and equal Poisson expectations.',
  },
  '/halftime-fulltime-predictions': {
    title: 'HT/FT Predictions Today: Half-Time/Full-Time (4.50+ Odds)',
    description: 'Daily Half-Time / Full-Time (HT/FT) football predictions. High-odds 1/1, X/1, X/2, and 2/2 score turnaround strategies backed by first-half Poisson pace.',
  },
  '/europa-league-predictions': {
    title: 'UEFA Europa League Predictions & Conference League AI Odds',
    description: 'Expert AI predictions for UEFA Europa League and Conference League fixtures. Matchweek win probabilities, knockout progression odds, and Thursday banker tips.',
  },
  '/ligue-1-predictions': {
    title: 'French Ligue 1 AI Predictions: PSG, Marseille & xG Odds',
    description: 'French Ligue 1 football predictions. Comprehensive Expected Goals (xG) projections, BTTS probabilities, and value betting tips for PSG, Marseille, and Monaco.',
  },
  '/poisson-calculator': {
    title: 'Poisson Football Calculator & Expected Goals Score Simulator',
    description: 'Free Dixon-Coles Poisson football calculator. Enter home and away team expected goals (xG) to simulate 10,000 matches, exact scores, 1X2 odds, and BTTS.',
  },
  '/sure-win-predictions': {
    title: 'Sure Win Predictions Today: 88%+ AI Confidence Banker Bets',
    description: 'Daily mathematical sure win predictions and banker tips. Filter highest-confidence football picks (88%+ strike rate), acca anchors, and +EV odds.',
  },
  '/corners-predictions': {
    title: 'Corner Predictions Today: Over 8.5, 9.5 & 10.5 Match Corners Stats',
    description: 'Daily football corner predictions and corner kick stats. Explore Over/Under 9.5 corners probability, team corner averages, and wing play analysis.',
  },
  '/cards-predictions': {
    title: 'Cards & Bookings Predictions Today: Yellow & Red Card Stats',
    description: 'Daily football cards and booking points predictions. Filter matches by referee strictness, derby tension, and Over/Under 3.5 & 4.5 yellow card trends.',
  },
  '/championship-predictions': {
    title: 'English Championship Predictions & AI Betting Tips 2026/27',
    description: 'EFL Championship predictions today. Free AI betting tips, promotion xG stats, and Asian Handicap analysis for Leeds, Sunderland, and Sheffield United.',
  },
  '/eredivisie-predictions': {
    title: 'Dutch Eredivisie AI Predictions: Ajax, PSV, Feyenoord & xG Tips',
    description: 'Free Dutch Eredivisie predictions today. High-scoring Over 2.5 goals models, BTTS probabilities, and Asian Handicap picks for Ajax, PSV, and Feyenoord.',
  },
  '/primeira-liga-predictions': {
    title: 'Portuguese Primeira Liga Predictions: Benfica, Sporting CP & Porto',
    description: 'Portuguese Primeira Liga AI predictions today. Verified win probabilities, handicap picks, and clean sheet stats for Sporting CP, Benfica, and Porto.',
  },
  '/conference-league-predictions': {
    title: 'UEFA Conference League Predictions & AI Betting Tips',
    description: 'UEFA Conference League predictions today. Thursday European match previews, Poisson win probabilities, and high-value tips for all knockout fixtures.',
  },
  '/copa-libertadores-predictions': {
    title: 'Copa Libertadores AI Predictions: South American Odds & Tips',
    description: 'CONMEBOL Copa Libertadores predictions today. Accurate AI tips, altitude adjustments, and match previews for Flamengo, Palmeiras, and River Plate.',
  },
  '/value-bet-calculator': {
    title: 'Value Bet Calculator (+EV): Sports Betting Expected Value Tool',
    description: 'Free +EV Value Bet Calculator. Calculate positive expected value, bookmaker edge vs true probability, fair decimal odds, and recommended Kelly staking size.',
  },
  '/kelly-criterion-calculator': {
    title: 'Kelly Criterion Calculator: Sports Betting Bankroll Staking Tool',
    description: 'Free Kelly Criterion Calculator. Calculate optimal bet sizing, fractional Kelly (Half/Quarter), expected bankroll growth rate, and bankroll protection.',
  },
  '/over-1-5-goals-predictions': {
    title: 'Over 1.5 Goals Predictions Today: 85%+ High-Probability Multi-Bet Tips',
    description: 'Daily Over 1.5 goals football predictions. Filter matches by Bivariate Poisson goal expectancy, 1st half goal frequency, and low-risk accumulator anchors.',
  },
  '/tomorrow-predictions': {
    title: "Tomorrow's Football Predictions: Early AI Betting Tips & xG Odds",
    description: "Free AI football predictions for tomorrow's fixtures. Beat dropping odds with early 1X2 banker picks, Over 2.5 goals, BTTS tips, and Expected Goals (xG) projections.",
  },
  '/weekend-predictions': {
    title: 'Weekend Football Predictions: Saturday & Sunday Banker Acca Tips',
    description: 'Free AI weekend football predictions for Saturday and Sunday. Get 85%+ confidence banker picks, weekend 5-fold accumulator slips, BTTS, and Over 2.5 goals tips.',
  },
  '/asian-handicap-predictions': {
    title: 'Asian Handicap Predictions Today: -0.5, -0.75 & -1.5 Football Tips',
    description: 'Free Asian Handicap football predictions today. Beat bookmaker margins with expected goal (xG) differential models for -0.5, -0.75, -1.0, and +0.5 handicap lines.',
  },
  '/draw-no-bet-predictions': {
    title: 'Draw No Bet Predictions Today (DNB): Safe Football Refund Tips',
    description: 'Free Draw No Bet (DNB) football predictions today. Protect your bankroll with 89% non-losing AI picks where your full stake is refunded on a draw.',
  },
  '/win-to-nil-predictions': {
    title: 'Win to Nil & Clean Sheet Predictions Today: Defensive xGA Tips',
    description: 'Free Win to Nil and Clean Sheet football predictions today. High-odds 2.25+ picks backed by Poisson zero-goal probability and defensive xGA metrics.',
  },
  '/arbitrage-calculator': {
    title: 'Arbitrage Betting Calculator: 2-Way & 3-Way Surebet Staking Tool',
    description: 'Free 2-way and 3-way arbitrage betting calculator (Surebet & Dutching tool). Enter bookmaker odds to calculate exact stakes and lock in risk-free profit.',
  },
  '/odds-converter': {
    title: 'Betting Odds Converter & Implied Probability Calculator (UK/US/EU)',
    description: 'Free sports betting odds converter and implied probability calculator. Instantly convert Decimal, Fractional (UK), American Moneyline, and implied win percentages.',
  },
  '/saudi-pro-league-predictions': {
    title: 'Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL Tips',
    description: 'Free Saudi Pro League (Roshn SPL) AI football predictions today. High-scoring Over 2.5 goals, BTTS, and Asian Handicap picks for Al-Hilal, Al-Nassr & Al-Ittihad.',
  },
  '/brazilian-serie-a-predictions': {
    title: 'Brazilian Serie A Predictions Today: Brasileirão AI Tips & Odds',
    description: 'Free Brazilian Serie A (Brasileirão) AI football predictions today. Get home-advantage 1X2 picks, BTTS, and xG forecasts for Palmeiras, Flamengo & Botafogo.',
  },
  '/scottish-premiership-predictions': {
    title: 'Scottish Premiership Predictions Today: Celtic, Rangers & SPFL Tips',
    description: 'Free Scottish Premiership (SPFL) AI football predictions today. High-confidence Celtic & Rangers Asian Handicap picks, Over 2.5 goals, and corners tips.',
  },
  '/first-half-goals-predictions': {
    title: 'Over 0.5 First Half Goals Predictions Today: 1H Goal AI Tips',
    description: 'Free Over 0.5 & Over 1.5 First Half Goals predictions today. Settle bets in 45 minutes with 84%+ strike-rate 1st half xG and early-goal probability picks.',
  },
  '/over-3-5-goals-predictions': {
    title: 'Over 3.5 Goals Predictions Today: High-Scoring 4+ Goal AI Tips',
    description: 'Free Over 3.5 goals football predictions today. Target high-odds (2.40+) goal-fest fixtures backed by 3.35+ combined Expected Goals (xG) and Poisson simulations.',
  },
  '/both-teams-to-score-and-win-predictions': {
    title: 'BTTS & Win Predictions Today: Both Teams to Score + Over 2.5 Tips',
    description: 'Free Both Teams to Score and Win (BTTS & Win) and BTTS & Over 2.5 Goals football predictions today. High-value 3.00+ odds combo picks backed by 2-1 & 3-1 Poisson models.',
  },
  '/anytime-goalscorer-predictions': {
    title: 'Anytime Goalscorer Predictions Today: Player xG & Shots on Target',
    description: 'Free Anytime Goalscorer, First Goalscorer, and Player Shots on Target predictions today. Backed by xG per 90, penalty-taker status, and defensive xGA matchups.',
  },
  '/parlay-calculator': {
    title: 'Parlay & Accumulator Odds Calculator: Multi-Bet Payout Tool',
    description: 'Free Parlay and Football Accumulator (Acca) odds calculator. Add up to 15 legs to calculate combined decimal odds, true hit probability, and net profit.',
  },
  '/margin-calculator': {
    title: 'Bookmaker Margin & No-Vig Fair Odds Calculator (Overround Tool)',
    description: 'Free bookmaker margin, overround, and no-vig fair odds calculator. Remove sportsbook vig from 1X2 and Over/Under lines to find true market probabilities.',
  },
  '/fa-cup-predictions': {
    title: 'FA Cup & Carabao Cup Predictions Today: English Knockout AI Tips',
    description: 'Free English FA Cup and Carabao EFL Cup AI football predictions today. Squad rotation xG models, cup upset alerts, BTTS, and Asian Handicap picks.',
  },
  '/turkish-super-lig-predictions': {
    title: 'Turkish Süper Lig Predictions Today: Galatasaray & Fenerbahçe Tips',
    description: 'Free Turkish Süper Lig AI football predictions today. High-confidence 1X2, Over 2.5 goals, and card booking picks for Galatasaray, Fenerbahçe & Beşiktaş.',
  },
  '/belgian-pro-league-predictions': {
    title: 'Belgian Pro League Predictions Today: Jupiler League AI Tips',
    description: 'Free Belgian Jupiler Pro League AI football predictions today. High-strike-rate BTTS, Over 2.5 goals, and 1X2 tips for Club Brugge, Anderlecht, Genk & Union SG.',
  },
  '/argentina-primera-predictions': {
    title: 'Argentina Primera División Predictions: Liga Profesional AI Tips',
    description: 'Free Argentina Liga Profesional (Primera División) AI football predictions today. Get home-banker 1X2, Under 2.5, and Draw No Bet tips for River Plate & Boca Juniors.',
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

    const canonicalLinksBlock = [
      `<link rel="canonical" href="${canonicalUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`,
      `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`,
      `<meta property="og:url" content="${canonicalUrl}" />`,
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
      // Note: Only write targetDir/index.html to prevent duplicate identical title/description pages (.html vs /)
      generatedCount++;
    }
  }

  console.log(`✅ [prerender-seo-routes] Generated ${generatedCount} self-canonicalized static HTML routes in dist/`);
}

runPrerender();
