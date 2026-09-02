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
    date: "2026-06-04", 
    featured: true,
    keywords: "confidence score, probability, odds calculation, value betting"
  },
  { 
    slug: "value-betting-explained", 
    title: "Value Betting in Football: A Complete Guide", 
    excerpt: "What is value betting, how to calculate expected value (EV) and why a 60% confidence prediction at 2.0 odds is better than 80% at 1.3.", 
    category: "Strategy", 
    readTime: "8 min", 
    date: "2026-06-03",
    keywords: "expected value, EV, edge, bookmaker margins, bankroll"
  },
  { 
    slug: "bankroll-management-football", 
    title: "Bankroll Management for Football Bettors", 
    excerpt: "The Kelly Criterion, flat staking and why most bettors go broke. Learn to protect your capital while maximising long-term returns.", 
    category: "Finance", 
    readTime: "6 min", 
    date: "2026-06-02",
    keywords: "kelly criterion, bankroll, staking, risk management, units"
  },
  { 
    slug: "premier-league-prediction-guide-2026", 
    title: "Premier League 2025/26 Prediction Guide", 
    excerpt: "Which teams are most predictable this season? Home advantage stats, H2H trends and the leagues statistical patterns our AI exploits.", 
    category: "Premier League", 
    readTime: "10 min", 
    date: "2026-06-01",
    keywords: "premier league, arsenal, manchester city, liverpool, chelsea"
  },
  { 
    slug: "champions-league-group-stage-tips", 
    title: "Champions League Group Stage: How to Bet Smart", 
    excerpt: "Group stage football is different — motivation, rotation and away goals. Our AI approach to UCL predictions explained.", 
    category: "Champions League", 
    readTime: "7 min", 
    date: "2026-05-31",
    keywords: "champions league, ucl, league phase, real madrid, bayern munich"
  },
  { 
    slug: "btts-over-under-strategy", 
    title: "BTTS and Over/Under: The Stats Behind Goal Markets", 
    excerpt: "Why Both Teams to Score is one of the most predictable markets. The teams, leagues and match types where BTTS hits most reliably.", 
    category: "Markets", 
    readTime: "6 min", 
    date: "2026-05-30",
    keywords: "btts, both teams to score, over 2.5 goals, under 2.5, goal markets"
  },
  { 
    slug: "kpl-betting-guide-kenya", 
    title: "Kenya Premier League Betting Guide 2026", 
    excerpt: "Everything you need to know about betting on KPL — Gor Mahia, AFC Leopards, Tusker and how to use M-Pesa for predictions.", 
    category: "KPL", 
    readTime: "5 min", 
    date: "2026-05-29",
    keywords: "kpl, kenya premier league, gor mahia, afc leopards, m-pesa, tusker"
  },
  { 
    slug: "accumulator-building-strategy", 
    title: "How to Build a Winning Football Accumulator", 
    excerpt: "Why most accas lose and how to use AI confidence scores to select the right legs. The 5-fold strategy that actually works.", 
    category: "Strategy", 
    readTime: "7 min", 
    date: "2026-05-28",
    keywords: "accumulator, acca, parlay, multibet, 5-fold, odds boost"
  },
  { 
    slug: "correct-score-prediction-tips", 
    title: "Correct Score Betting: Can AI Really Predict the Scoreline?", 
    excerpt: "Correct score is the hardest market to beat. Here's how our AI approaches it and when correct score bets offer value.", 
    category: "Markets", 
    readTime: "6 min", 
    date: "2026-05-27",
    keywords: "correct score, exact score, scoreline, probability matrix"
  },
];
