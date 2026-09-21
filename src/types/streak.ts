export type StreakCategory = 'all' | 'goals' | 'btts' | 'results' | 'defense' | 'halves' | 'corners';

export interface StreakMatchHistory {
  opponent: string;
  isHome: boolean;
  score: string;
  result: 'W' | 'D' | 'L';
  date: string;
  statValue: string; // e.g. "3 goals (Over 2.5)" or "BTTS Yes (2-1)"
}

export interface TeamStreak {
  id: string;
  team: string;
  teamLogo?: string;
  league: string;
  leagueFlag?: string;
  category: 'goals' | 'btts' | 'results' | 'defense' | 'halves' | 'corners';
  title: string; // e.g. "Over 2.5 Match Goals"
  streakCount: number; // e.g. 7
  streakDescription: string; // "Over 2.5 goals in 7 consecutive fixtures"
  hitRateLast10: number; // e.g. 90
  
  // Next match details
  nextMatch: {
    opponent: string;
    isHome: boolean;
    date: string; // e.g. "Tomorrow 17:30"
    marketName: string; // "Over 2.5 Goals"
    odds: number; // 1.72
    bookmaker: string;
  };

  // AI Sustainability Analysis
  sustainability: {
    score: number; // 0 - 100
    verdict: 'Strong Back' | 'Moderate Value' | 'Caution / Fade';
    confidenceTier: 'high' | 'medium' | 'speculative';
    tacticalInsight: string;
    keyRiskFactor: string;
    oppRank: number;
  };

  // Recent timeline (last 5 matches)
  recentMatches: StreakMatchHistory[];
}
