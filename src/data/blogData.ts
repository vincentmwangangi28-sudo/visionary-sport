export interface BlogPostItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  featured?: boolean;
  keywords?: string;
}

export const STRATEGY_POSTS: BlogPostItem[] = [
  { 
    slug: "how-to-read-football-predictions", 
    title: "How to Read AI Football Predictions Like a Pro", 
    excerpt: "Understanding confidence scores, probability percentages and odds — what they mean and how to use them in your betting strategy.", 
    category: "Strategy", 
    readTime: "5 min", 
    date: "2026-09-25", 
    featured: true,
    keywords: "confidence score, probability, odds calculation, value betting, ai football predictions"
  },
  { 
    slug: "value-betting-explained", 
    title: "Value Betting in Football: A Complete +EV Guide", 
    excerpt: "What is value betting, how to calculate expected value (EV) and why a 60% confidence prediction at 2.0 odds is better than 80% at 1.3.", 
    category: "Strategy", 
    readTime: "8 min", 
    date: "2026-09-24",
    keywords: "expected value, EV, edge, bookmaker margins, bankroll, value bets"
  },
  {
    slug: "asian-handicap-betting-explained",
    title: "Asian Handicap Betting Explained: -0.5, -0.75 & -1.5 Goal Lines",
    excerpt: "Eliminate the draw and unlock lower bookmaker margins. Learn how quarter-goal (-0.25, -0.75) and half-goal Asian Handicap lines work with AI xG projections.",
    category: "Markets",
    readTime: "7 min",
    date: "2026-09-23",
    keywords: "asian handicap explained, -0.5 handicap, -0.75 asian handicap, quarter goal lines, football handicap tips"
  },
  {
    slug: "draw-no-bet-vs-double-chance-strategy",
    title: "Draw No Bet (DNB) vs Double Chance (1X/X2): Mathematical ROI Guide",
    excerpt: "When should you back Draw No Bet for stake protection versus Double Chance for accumulator safety? Full implied probability and yield breakdown.",
    category: "Strategy",
    readTime: "6 min",
    date: "2026-09-22",
    keywords: "draw no bet explained, double chance 1x x2, dnb vs double chance, safe football betting markets"
  },
  {
    slug: "closing-line-value-clv-dropping-odds",
    title: "Closing Line Value (CLV) & Dropping Odds: How to Beat Sharp Steam",
    excerpt: "Why beating the closing odds is the #1 predictor of long-term sports betting profit, and how to track syndicate steam moves before kickoff.",
    category: "Markets",
    readTime: "8 min",
    date: "2026-09-21",
    keywords: "closing line value clv, dropping odds strategy, sharp money football, steam moves betting"
  },
  { 
    slug: "bankroll-management-football", 
    title: "Bankroll Management & Kelly Criterion for Football Bettors", 
    excerpt: "The Kelly Criterion, flat staking and why most bettors go broke. Learn to protect your capital while maximising long-term returns.", 
    category: "Finance", 
    readTime: "6 min", 
    date: "2026-09-20",
    keywords: "kelly criterion, bankroll, staking, risk management, units"
  },
  { 
    slug: "premier-league-prediction-guide-2026", 
    title: "Premier League 2026/27 AI Prediction & xG Guide", 
    excerpt: "Which teams are most predictable this season? Home advantage stats, H2H trends and the league's statistical patterns our AI exploits.", 
    category: "Premier League", 
    readTime: "10 min", 
    date: "2026-09-19",
    keywords: "premier league, arsenal, manchester city, liverpool, chelsea, epl xG"
  },
  { 
    slug: "champions-league-group-stage-tips", 
    title: "Champions League 36-Team Swiss Phase: How to Bet Smart", 
    excerpt: "League phase football is different — motivation, rotation and goal differential incentives. Our AI approach to UCL predictions explained.", 
    category: "Champions League", 
    readTime: "7 min", 
    date: "2026-09-18",
    keywords: "champions league, ucl, league phase, real madrid, bayern munich"
  },
  { 
    slug: "btts-over-under-strategy", 
    title: "BTTS and Over/Under 2.5: The Poisson Stats Behind Goal Markets", 
    excerpt: "Why Both Teams to Score is one of the most predictable markets. The teams, leagues and match types where BTTS hits most reliably.", 
    category: "Markets", 
    readTime: "6 min", 
    date: "2026-09-17",
    keywords: "btts, both teams to score, over 2.5 goals, under 2.5, goal markets"
  },
  { 
    slug: "kpl-betting-guide-kenya", 
    title: "Kenya Premier League (FKF) Betting Guide 2026/27", 
    excerpt: "Everything you need to know about betting on KPL — Gor Mahia, AFC Leopards, Tusker, Kenya Police FC and how to use M-Pesa for predictions.", 
    category: "KPL", 
    readTime: "5 min", 
    date: "2026-09-16",
    keywords: "kpl, kenya premier league, gor mahia, afc leopards, m-pesa, tusker"
  },
  { 
    slug: "accumulator-building-strategy", 
    title: "How to Build a Winning Football Accumulator: The 5-Fold Formula", 
    excerpt: "Why most accas lose and how to use AI confidence scores to select the right legs. The 5-fold strategy that actually works.", 
    category: "Strategy", 
    readTime: "7 min", 
    date: "2026-09-15",
    keywords: "accumulator, acca, parlay, multibet, 5-fold, odds boost"
  },
  { 
    slug: "correct-score-prediction-tips", 
    title: "Correct Score Betting: How Poisson Matrices Predict Exact Scorelines", 
    excerpt: "Correct score is the hardest market to beat. Here's how our AI approaches it and when correct score bets offer mathematical value.", 
    category: "Markets", 
    readTime: "6 min", 
    date: "2026-09-14",
    keywords: "correct score, exact score, scoreline, probability matrix"
  },
  {
    slug: "sportpesa-mega-jackpot-prediction-17-games",
    title: "SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI",
    excerpt: "The ultimate mathematical guide to tackling the 17-game SportPesa Mega Jackpot and Betika Midweek. Banker selection criteria, double chance hedging math, and bonus targets.",
    category: "Jackpots",
    readTime: "8 min",
    date: "2026-09-13",
    keywords: "sportpesa mega jackpot prediction 17 games, betika midweek jackpot, mozzart grand jackpot, jackpot bonus tips, double chance combinations"
  },
  {
    slug: "us-soccer-betting-guide-mls-odds",
    title: "US Soccer & MLS Betting Guide: Moneyline, Spreads & AI Picks",
    excerpt: "Master Major League Soccer, Concacaf Champions Cup, and US Open Cup betting with American odds (+/-), travel fatigue modeling, and altitude differentials.",
    category: "US Soccer",
    readTime: "7 min",
    date: "2026-09-12",
    keywords: "mls predictions, us soccer betting picks, american odds moneyline, spread betting mls, inter miami la galaxy odds"
  },
];
