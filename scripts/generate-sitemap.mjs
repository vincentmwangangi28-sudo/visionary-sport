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
const YANDEX_SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap-yandex.xml');

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
  { path: '/players', priority: 0.90, freq: 'daily', title: 'Player Profiles, Form Ratings & Goalscorer Stats' },
  { path: '/player-props', priority: 0.90, freq: 'daily', title: 'Interactive Football Player Prop Simulator: Anytime Goalscorer & Shots on Target' },
  { path: '/players/erling-haaland', priority: 0.85, freq: 'daily', title: 'Erling Haaland Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/kylian-mbappe', priority: 0.85, freq: 'daily', title: 'Kylian Mbappé Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/mohamed-salah', priority: 0.85, freq: 'daily', title: 'Mohamed Salah Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/bukayo-saka', priority: 0.85, freq: 'daily', title: 'Bukayo Saka Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/harry-kane', priority: 0.85, freq: 'daily', title: 'Harry Kane Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/jude-bellingham', priority: 0.85, freq: 'daily', title: 'Jude Bellingham Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/lamine-yamal', priority: 0.85, freq: 'daily', title: 'Lamine Yamal Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/cole-palmer', priority: 0.85, freq: 'daily', title: 'Cole Palmer Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/victor-osimhen', priority: 0.85, freq: 'daily', title: 'Victor Osimhen Player Rating, 2D Heatmap & Goalscorer Prop Simulator' },
  { path: '/players/austin-odhiambo', priority: 0.85, freq: 'daily', title: 'Austin Odhiambo (Gor Mahia) Player Rating, 2D Heatmap & Prop Simulator' },
  { path: '/teams', priority: 0.90, freq: 'daily', title: 'Club Expected Goals (xG) Analytics & Fixture Difficulty Rating (FDR) Hub' },
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
  { path: '/privacy', priority: 0.70, freq: 'monthly', title: 'Privacy Policy - GDPR & Google AdSense Compliance' },
  { path: '/terms', priority: 0.70, freq: 'monthly', title: 'Terms of Service & User Agreement' },
  { path: '/cookies', priority: 0.70, freq: 'monthly', title: 'Cookie Policy & Advertising Transparency' },
  { path: '/contact', priority: 0.70, freq: 'monthly', title: 'Contact Us & Editorial Support Desk' },
  { path: '/sitemap', priority: 0.70, freq: 'daily', title: 'HTML Predictions Directory & Sitemap' },
  { path: '/seo-indexing', priority: 0.70, freq: 'daily', title: 'Google Indexing & Search Engine Management Console' },
  { path: '/widgets', priority: 0.85, freq: 'weekly', title: 'Free Embeddable AI Football Predictions Widgets & Odds Feeds' },
  { path: '/shop', priority: 0.90, freq: 'daily', title: 'PredictPro VIP Club: Premium AI Football Tips & Banker Passes' },
  { path: '/bet-of-the-day', priority: 0.95, freq: 'daily', title: 'Bet of the Day: Daily AI Banker & High-Confidence Lock' },
  { path: '/over-under-predictions', priority: 0.90, freq: 'daily', title: 'Over/Under 2.5 Goals Predictions & Poisson Goal Probabilities' },
  { path: '/double-chance-predictions', priority: 0.90, freq: 'daily', title: 'Double Chance Predictions Today (1X / X2): 89% AI Strike Rate' },
  { path: '/draw-predictions', priority: 0.90, freq: 'daily', title: 'Draw Predictions Today (X Tips): High-Odds Stalemate Picks' },
  { path: '/halftime-fulltime-predictions', priority: 0.90, freq: 'daily', title: 'HT/FT Predictions Today: Half-Time/Full-Time (4.50+ Odds)' },
  { path: '/poisson-calculator', priority: 0.90, freq: 'weekly', title: 'Poisson Football Calculator & Expected Goals Score Simulator' },
  { path: '/sure-win-predictions', priority: 0.95, freq: 'daily', title: 'Sure Win Predictions Today: 88%+ AI Confidence Banker Bets' },
  { path: '/corners-predictions', priority: 0.90, freq: 'daily', title: 'Corner Predictions Today: Over 8.5, 9.5 & 10.5 Match Corners Stats' },
  { path: '/cards-predictions', priority: 0.90, freq: 'daily', title: 'Cards & Bookings Predictions Today: Yellow & Red Card Stats' },
  { path: '/over-1-5-goals-predictions', priority: 0.90, freq: 'daily', title: 'Over 1.5 Goals Predictions Today: 85%+ High-Probability Multi-Bet Tips' },
  { path: '/value-bet-calculator', priority: 0.90, freq: 'weekly', title: 'Value Bet Calculator (+EV): Sports Betting Expected Value Tool' },
  { path: '/kelly-criterion-calculator', priority: 0.90, freq: 'weekly', title: 'Kelly Criterion Calculator: Sports Betting Bankroll Staking Tool' },
  { path: '/tomorrow-predictions', priority: 0.95, freq: 'daily', title: "Tomorrow's Football Predictions: Early AI Betting Tips & xG Odds" },
  { path: '/weekend-predictions', priority: 0.95, freq: 'daily', title: 'Weekend Football Predictions: Saturday & Sunday Banker Acca Tips' },
  { path: '/asian-handicap-predictions', priority: 0.90, freq: 'daily', title: 'Asian Handicap Predictions Today: -0.5, -0.75 & -1.5 Football Tips' },
  { path: '/draw-no-bet-predictions', priority: 0.90, freq: 'daily', title: 'Draw No Bet Predictions Today (DNB): Safe Football Refund Tips' },
  { path: '/win-to-nil-predictions', priority: 0.90, freq: 'daily', title: 'Win to Nil & Clean Sheet Predictions Today: Defensive xGA Tips' },
  { path: '/arbitrage-calculator', priority: 0.90, freq: 'weekly', title: 'Arbitrage Betting Calculator: 2-Way & 3-Way Surebet Staking Tool' },
  { path: '/odds-converter', priority: 0.90, freq: 'weekly', title: 'Betting Odds Converter & Implied Probability Calculator (UK/US/EU)' },
  { path: '/first-half-goals-predictions', priority: 0.90, freq: 'daily', title: 'Over 0.5 First Half Goals Predictions Today: 1H Goal AI Tips' },
  { path: '/over-3-5-goals-predictions', priority: 0.90, freq: 'daily', title: 'Over 3.5 Goals Predictions Today: High-Scoring 4+ Goal AI Tips' },
  { path: '/both-teams-to-score-and-win-predictions', priority: 0.90, freq: 'daily', title: 'BTTS & Win Predictions Today: Both Teams to Score + Over 2.5 Tips' },
  { path: '/anytime-goalscorer-predictions', priority: 0.90, freq: 'daily', title: 'Anytime Goalscorer Predictions Today: Player xG & Shots on Target' },
  { path: '/parlay-calculator', priority: 0.90, freq: 'weekly', title: 'Parlay & Accumulator Odds Calculator: Multi-Bet Payout Tool' },
  { path: '/system-bet-calculator', priority: 0.90, freq: 'weekly', title: 'System Bet Calculator: Trixie, Yankee, Patent & Lucky 15 Tool' },
  { path: '/hedge-bet-calculator', priority: 0.90, freq: 'weekly', title: 'Hedge Bet Calculator: Lock In Profit vs Bookmaker Cash-Out Tool' },
  { path: '/margin-calculator', priority: 0.90, freq: 'weekly', title: 'Bookmaker Margin & No-Vig Fair Odds Calculator (Overround Tool)' },
  { path: '/under-2-5-goals-predictions', priority: 0.90, freq: 'daily', title: 'Under 2.5 Goals Predictions Today: Low-Scoring AI Tips' },
  { path: '/second-half-goals-predictions', priority: 0.90, freq: 'daily', title: 'Second Half Goals Predictions Today: 2H Over 1.5 & Late xG Tips' },
  { path: '/handicap-1x2-predictions', priority: 0.90, freq: 'daily', title: 'European Handicap (-1) Predictions Today: 3-Way Goal Margin Tips' },
  { path: '/rollover-bets-predictions', priority: 0.95, freq: 'daily', title: 'Rollover Bets Predictions Today: 7-Day 1.50 & 2.00 Odds Challenge' },
  { path: '/daily-2-odds-predictions', priority: 0.95, freq: 'daily', title: 'Sure 2 Odds, 3 Odds & 5 Odds Predictions Today: Daily AI Slips' },
  { path: '/bet-builder-predictions', priority: 0.90, freq: 'daily', title: 'Bet Builder Predictions Today: Same-Game Parlay (SGP) AI Tips' },
  { path: '/both-halves-predictions', priority: 0.90, freq: 'daily', title: 'Score in Both Halves & Win Both Halves Predictions Today' },
  { path: '/dutching-calculator', priority: 0.90, freq: 'weekly', title: 'Dutching Calculator: Equal-Profit Multi-Outcome & Correct Score Tool' },
  { path: '/roi-yield-calculator', priority: 0.90, freq: 'weekly', title: 'Betting ROI & Yield Calculator: Break-Even Win Rate Tool' },
  { path: '/today-predictions', priority: 0.95, freq: 'daily', title: "Today's Football Predictions: Daily AI Match Tips & Odds" },
  { path: '/2-odds-predictions', priority: 0.90, freq: 'daily', title: 'Sure 2 Odds Predictions Today: Daily 2.00+ Rollover Banker Tips' },
  { path: '/5-odds-predictions', priority: 0.90, freq: 'daily', title: 'Sure 5 Odds & 10 Odds Predictions Today: Daily Acca Slips' },
  { path: '/slip-generator', priority: 0.95, freq: 'daily', title: 'AI Slip Generator & Universal Bookmaker Booking Code Converter | PredictPro' },
  { path: '/booking-code-converter', priority: 0.95, freq: 'daily', title: 'Universal Bet Booking Code Converter: SportyBet, Betika, SportPesa & 1xBet' },
  { path: '/jackpot-generator', priority: 0.95, freq: 'daily', title: '17-Game Mega & Midweek Jackpot Combination Generator (SportPesa, Betika & Mozzart)' },
  { path: '/in-play-predictions', priority: 0.95, freq: 'hourly', title: 'Live In-Play Football Predictions, APPM Momentum & Next-Goal Alert Radar' },
  { path: '/set-piece-specialists', priority: 0.95, freq: 'daily', title: 'Designated Penalty Takers, Free-Kick Specialists & Corner Aerial Threat Hub' },
  { path: '/sharp-money-splits', priority: 0.95, freq: 'hourly', title: 'Sharp Money, Public Betting Splits & Reverse Line Movement (RLM) Scanner' },
  { path: '/injury-lineup-impact', priority: 0.95, freq: 'daily', title: 'Confirmed Lineups, Key Injury & Suspension xG Impact Analyzer' },
  { path: '/stadium-altitude-weather', priority: 0.90, freq: 'daily', title: 'Stadium Altitude, Weather, Pitch Surface & Travel Fatigue xG Modifier Hub' },
  { path: '/tactical-mismatch-matrix', priority: 0.90, freq: 'daily', title: 'Tactical Style Mismatch, PPDA Press & Coaching DNA Matrix' },
  { path: '/referee-stats-predictions', priority: 0.95, freq: 'daily', title: 'Referee Card Stats, VAR Penalty Rates & Bookings Predictions Today' },
  { path: '/teams/arsenal', priority: 0.85, freq: 'daily', title: 'Arsenal xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/real-madrid', priority: 0.85, freq: 'daily', title: 'Real Madrid xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/manchester-city', priority: 0.85, freq: 'daily', title: 'Manchester City xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/gor-mahia', priority: 0.85, freq: 'daily', title: 'Gor Mahia xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/al-ahly', priority: 0.85, freq: 'daily', title: 'Al Ahly xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/mamelodi-sundowns', priority: 0.85, freq: 'daily', title: 'Mamelodi Sundowns xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/young-africans', priority: 0.85, freq: 'daily', title: 'Young Africans (Yanga) xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/teams/simba-sc', priority: 0.85, freq: 'daily', title: 'Simba SC xG Stats, Poisson Ratings & FDR Schedule | PredictPro' },
  { path: '/booking-codes', priority: 0.95, freq: 'daily', title: 'Free SportyBet, 1xBet, Bet9ja, SportPesa & Betika Booking Codes Today' },
  { path: '/code-converter', priority: 0.90, freq: 'daily', title: 'Free Bet Code Converter: Convert SportyBet, 1xBet, Bet9ja & Betway Codes' },
  { path: '/rewards', priority: 0.75, freq: 'daily', title: 'Daily Rewards, Coin Wheel & Prediction Unlocks | PredictPro' },
  { path: '/performance', priority: 0.75, freq: 'weekly', title: 'Personal Football Betting Performance & ROI Tracker | PredictPro' },
];

const LEAGUE_PAGES = [
  { path: '/premier-league-predictions', priority: 0.95, freq: 'daily', title: 'Premier League Predictions & AI Betting Tips' },
  { path: '/fa-cup-predictions', priority: 0.95, freq: 'daily', title: 'FA Cup & Carabao Cup Predictions Today: English Knockout AI Tips' },
  { path: '/champions-league-predictions', priority: 0.95, freq: 'daily', title: 'UEFA Champions League Predictions & Odds' },
  { path: '/europa-league-predictions', priority: 0.95, freq: 'daily', title: 'UEFA Europa League Predictions & Conference League AI Odds' },
  { path: '/conference-league-predictions', priority: 0.95, freq: 'daily', title: 'UEFA Conference League Predictions & AI Betting Tips' },
  { path: '/la-liga-predictions', priority: 0.95, freq: 'daily', title: 'La Liga AI Predictions & Match Previews' },
  { path: '/bundesliga-predictions', priority: 0.95, freq: 'daily', title: 'Bundesliga Predictions & Form Analysis' },
  { path: '/serie-a-predictions', priority: 0.95, freq: 'daily', title: 'Serie A Predictions & Tactical Insights' },
  { path: '/ligue-1-predictions', priority: 0.95, freq: 'daily', title: 'French Ligue 1 AI Predictions: PSG, Marseille & xG Odds' },
  { path: '/championship-predictions', priority: 0.95, freq: 'daily', title: 'English Championship Predictions & AI Betting Tips 2026/27' },
  { path: '/eredivisie-predictions', priority: 0.95, freq: 'daily', title: 'Dutch Eredivisie AI Predictions: Ajax, PSV, Feyenoord & xG Tips' },
  { path: '/primeira-liga-predictions', priority: 0.95, freq: 'daily', title: 'Portuguese Primeira Liga Predictions: Benfica, Sporting CP & Porto' },
  { path: '/belgian-pro-league-predictions', priority: 0.90, freq: 'daily', title: 'Belgian Pro League Predictions Today: Jupiler League AI Tips' },
  { path: '/turkish-super-lig-predictions', priority: 0.95, freq: 'daily', title: 'Turkish Süper Lig Predictions Today: Galatasaray & Fenerbahçe Tips' },
  { path: '/greek-super-league-predictions', priority: 0.90, freq: 'daily', title: 'Greek Super League Predictions: Olympiacos, PAOK, AEK & Panathinaikos' },
  { path: '/copa-libertadores-predictions', priority: 0.95, freq: 'daily', title: 'Copa Libertadores AI Predictions: South American Odds & Tips' },
  { path: '/saudi-pro-league-predictions', priority: 0.95, freq: 'daily', title: 'Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL Tips' },
  { path: '/j-league-predictions', priority: 0.90, freq: 'daily', title: 'Japan J1 League Predictions Today: Early Kickoff xG & Corners Tips' },
  { path: '/australian-a-league-predictions', priority: 0.90, freq: 'daily', title: 'Australian A-League Predictions Today: Over 2.5 Goals & Corners Tips' },
  { path: '/brazilian-serie-a-predictions', priority: 0.95, freq: 'daily', title: 'Brazilian Serie A Predictions Today: Brasileirão AI Tips & Odds' },
  { path: '/argentina-primera-predictions', priority: 0.90, freq: 'daily', title: 'Argentina Primera División Predictions: Liga Profesional AI Tips' },
  { path: '/liga-mx-predictions', priority: 0.95, freq: 'daily', title: 'Liga MX Predictions Today: Club América, Monterrey & Mexican Tips' },
  { path: '/mls-predictions', priority: 0.95, freq: 'daily', title: 'MLS Predictions Today: Inter Miami, LAFC & Major League Soccer Tips' },
  { path: '/scottish-premiership-predictions', priority: 0.95, freq: 'daily', title: 'Scottish Premiership Predictions Today: Celtic, Rangers & SPFL Tips' },
  { path: '/south-africa-psl-predictions', priority: 0.95, freq: 'daily', title: 'South Africa PSL Predictions Today: Betway Premiership AI Tips' },
  { path: '/nigerian-npfl-predictions', priority: 0.95, freq: 'daily', title: 'Nigeria NPFL Predictions Today: Enyimba, Remo Stars & Rangers Tips' },
  { path: '/egyptian-premier-league-predictions', priority: 0.95, freq: 'daily', title: 'Egyptian Premier League Predictions Today: Al Ahly & Zamalek Tips' },
  { path: '/tanzania-premier-league-predictions', priority: 0.95, freq: 'daily', title: 'Tanzania NBC Premier League Predictions: Simba SC, Yanga & Azam Tips' },
  { path: '/ghana-premier-league-predictions', priority: 0.95, freq: 'daily', title: 'Ghana Premier League Predictions Today: Asante Kotoko & Hearts of Oak' },
  { path: '/morocco-botola-pro-predictions', priority: 0.95, freq: 'daily', title: 'Morocco Botola Pro Predictions Today: Raja, Wydad & AS FAR Tips' },
  { path: '/caf-champions-league-predictions', priority: 0.95, freq: 'daily', title: 'CAF Champions League Predictions Today: Al Ahly, Sundowns & Esperance' },
  { path: '/uganda-premier-league-predictions', priority: 0.90, freq: 'daily', title: 'Uganda Premier League Predictions Today: Vipers SC, KCCA & SC Villa' },
  { path: '/k-league-predictions', priority: 0.90, freq: 'daily', title: 'South Korea K League 1 Predictions Today: Ulsan HD, Jeonbuk & FC Seoul' },
  { path: '/world-cup-predictions', priority: 0.90, freq: 'daily', title: 'FIFA World Cup 2026 Predictions & Qualifying Tips' },
  { path: '/afcon-predictions', priority: 0.90, freq: 'daily', title: 'AFCON Predictions & African Football Odds' },
  { path: '/kpl-predictions', priority: 0.90, freq: 'daily', title: 'FKF Kenya Premier League Predictions & M-Pesa Tips' },
  { path: '/jackpot-predictions', priority: 0.95, freq: 'daily', title: 'SportPesa Mega Jackpot & Betika Grand AI Predictions (17 Games)' },
  { path: '/midweek-jackpot-predictions', priority: 0.95, freq: 'daily', title: 'Midweek Jackpot Predictions Today: 13 & 15 Games AI Banker Tips' },
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
  { slug: 'universal-bet-code-converter-sportybet-1xbet-bet9ja', title: 'Universal Bet Code Converter: How to Convert SportyBet, 1xBet, Bet9ja & Betway Slips', priority: 0.90 },
  { slug: 'bivariate-poisson-dixon-coles-score-matrix-guide', title: 'Bivariate Poisson & Dixon-Coles Score Matrix: How PredictPro Calculates Exact Scorelines', priority: 0.90 },
  { slug: '2-score-correct-score-dutching-strategy', title: '2-Score Correct Score Dutching Strategy: Mathematical Stake Sizing for High-Odds Value', priority: 0.85 },
  { slug: 'referee-cards-corners-prop-modeling', title: 'Referee Discipline & Corner Prop Modeling: Predicting Cards and Corners with xG Tempo', priority: 0.85 },
];

const CLUB_ANALYTICS_SLUGS = [
  'arsenal',
  'manchester-city',
  'liverpool',
  'chelsea',
  'manchester-united',
  'tottenham',
  'newcastle-united',
  'aston-villa',
  'real-madrid',
  'barcelona',
  'atletico-madrid',
  'bayern-munich',
  'borussia-dortmund',
  'bayer-leverkusen',
  'inter-milan',
  'ac-milan',
  'juventus',
  'napoli',
  'psg',
  'al-ahly',
  'mamelodi-sundowns',
  'gor-mahia',
  'kaizer-chiefs',
  'orlando-pirates',
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
  'simba-sc-vs-young-africans',
  'kaizer-chiefs-vs-orlando-pirates',
  'mamelodi-sundowns-vs-orlando-pirates',
  'enyimba-vs-rangers-international',
  'hearts-of-oak-vs-asante-kotoko',
  'al-ahly-vs-zamalek',
  'wydad-ac-vs-raja-casablanca',
  'tp-mazembe-vs-as-vita-club',
  'juventus-vs-napoli',
  'atletico-madrid-vs-sevilla',
  'la-galaxy-vs-lafc',
  'inter-miami-vs-new-york-red-bulls',
  'celtic-vs-rangers',
  'boca-juniors-vs-river-plate',
  'benfica-vs-sporting-cp',
  'galatasaray-vs-fenerbahce',
  'ajax-vs-feyenoord',
  'club-america-vs-chivas',
  'al-hilal-vs-al-nassr',
  'flamengo-vs-palmeiras',
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

  // Club Expected Goals (xG) & FDR Hubs
  for (const clubSlug of CLUB_ANALYTICS_SLUGS) {
    const clubLabel = clubSlug
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    urlEntries.push({
      loc: `${BASE_URL}/teams/${clubSlug}`,
      lastmod: TODAY,
      changefreq: 'daily',
      priority: '0.85',
      title: `${clubLabel} xG Stats, Poisson Ratings & Fixture Difficulty (FDR)`,
    });
  }

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

  const xmlNodes = urlEntries.map(entry => {
    return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.loc)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(entry.loc)}" />
    <image:image>
      <image:loc>${escapeXml(`${BASE_URL}/og-image.jpg`)}</image:loc>
      <image:title>${escapeXml(entry.title || 'PredictPro AI Football Analytics')}</image:title>
      <image:caption>${escapeXml(`${entry.title || 'PredictPro'} — Expected Goals (xG) & Bivariate Poisson Football Analytics`)}</image:caption>
    </image:image>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlNodes}
</urlset>
`;
}

export function buildYandexSitemapXml() {
  const fullXml = buildSitemapXml();
  return fullXml
    .replace(/\s*xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/, '')
    .replace(/\s*xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/, '')
    .replace(/\n\s*<xhtml:link[^>]*\/>/g, '')
    .replace(/\n\s*<image:image>[\s\S]*?<\/image:image>/g, '');
}

function buildUrlsetFromEntries(entries) {
  const nodes = entries.map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.loc)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(entry.loc)}" />
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${nodes}
</urlset>
`;
}

export function buildDiscoverNewsSitemapXml() {
  const discoverEntries = [
    ...BLOG_POSTS.map(post => ({
      loc: `${BASE_URL}/blog/${post.slug}`,
      title: post.title,
      priority: post.priority.toFixed(2),
      freq: 'daily',
    })),
    {
      loc: `${BASE_URL}/today-predictions`,
      title: "Today's Football Predictions: Daily AI Match Tips, Expected Goals (xG) & Fair Odds",
      priority: '0.95',
      freq: 'hourly',
    },
    {
      loc: `${BASE_URL}/slip-generator`,
      title: 'Smart Bet Slip Generator & Universal Booking Code Converter (SportyBet, 1xBet, Bet9ja)',
      priority: '0.95',
      freq: 'daily',
    },
    ...FEATURED_MATCH_SLUGS.slice(0, 12).map(slug => ({
      loc: `${BASE_URL}/predict/${slug}`,
      title: `${slug.split('-vs-').map(s => s.replace(/-/g, ' ')).join(' vs ').toUpperCase()} AI Prediction, Expected Goals (xG) & Score Matrix`,
      priority: '0.85',
      freq: 'daily',
    })),
  ];

  const nodes = discoverEntries.map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${entry.freq}</changefreq>
    <priority>${entry.priority}</priority>
    <news:news>
      <news:publication>
        <news:name>PredictPro AI Football Analytics</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${TODAY}T08:00:00Z</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>
      <news:keywords>football predictions, Expected Goals xG, Poisson distribution, PredictPro, sports analytics</news:keywords>
    </news:news>
    <image:image>
      <image:loc>${escapeXml(`${BASE_URL}/og-image.jpg`)}</image:loc>
      <image:title>${escapeXml(entry.title)}</image:title>
      <image:caption>${escapeXml(`${entry.title} — PredictPro Quantitative Football Analytics`)}</image:caption>
    </image:image>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${nodes}
</urlset>
`;
}

export function buildSitemapIndexXml() {
  const subSitemaps = [
    `${BASE_URL}/sitemap.xml`,
    `${BASE_URL}/sitemap-core.xml`,
    `${BASE_URL}/sitemap-leagues.xml`,
    `${BASE_URL}/sitemap-matches.xml`,
    `${BASE_URL}/sitemap-blog.xml`,
    `${BASE_URL}/sitemap-discover-news.xml`,
    `${BASE_URL}/sitemap-yandex.xml`,
  ];
  const nodes = subSitemaps.map(loc => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes}
</sitemapindex>
`;
}

// Write master sitemaps
const xml = buildSitemapXml();
const yandexXml = buildYandexSitemapXml();
const discoverXml = buildDiscoverNewsSitemapXml();
fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
fs.writeFileSync(YANDEX_SITEMAP_PATH, yandexXml, 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-discover-news.xml'), discoverXml, 'utf8');

// Write category sub-sitemaps & sitemap-index.xml
const coreEntries = CORE_PAGES.map(page => ({
  loc: `${BASE_URL}${page.path}`,
  lastmod: TODAY,
  changefreq: page.freq,
  priority: page.priority.toFixed(2),
}));
const leagueEntries = LEAGUE_PAGES.map(page => ({
  loc: `${BASE_URL}${page.path}`,
  lastmod: TODAY,
  changefreq: page.freq,
  priority: page.priority.toFixed(2),
}));
const matchEntries = [
  ...FEATURED_MATCH_SLUGS.map(slug => ({
    loc: `${BASE_URL}/predict/${slug}`,
    lastmod: TODAY,
    changefreq: 'daily',
    priority: '0.80',
  })),
  ...CLUB_ANALYTICS_SLUGS.map(clubSlug => ({
    loc: `${BASE_URL}/teams/${clubSlug}`,
    lastmod: TODAY,
    changefreq: 'daily',
    priority: '0.85',
  })),
];
const blogEntries = [
  { loc: `${BASE_URL}/blog`, lastmod: TODAY, changefreq: 'daily', priority: '0.85' },
  ...BLOG_POSTS.map(post => ({
    loc: `${BASE_URL}/blog/${post.slug}`,
    lastmod: TODAY,
    changefreq: 'weekly',
    priority: post.priority.toFixed(2),
  })),
];

fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-core.xml'), buildUrlsetFromEntries(coreEntries), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-leagues.xml'), buildUrlsetFromEntries(leagueEntries), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-matches.xml'), buildUrlsetFromEntries(matchEntries), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-blog.xml'), buildUrlsetFromEntries(blogEntries), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'sitemap-index.xml'), buildSitemapIndexXml(), 'utf8');

const urlCount = (xml.match(/<loc>/g) || []).length;
console.log(`✅ [Sitemap Generator] Wrote ${urlCount} indexed URLs to ${SITEMAP_PATH}, ${YANDEX_SITEMAP_PATH}, sitemap-discover-news.xml, and sitemap-index.xml`);
console.log(`📅 Generated date: ${TODAY}`);
console.log(`🌐 Base URL: ${BASE_URL}`);


