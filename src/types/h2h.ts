export interface TeamProfile {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  logoText?: string;
  badgeColor?: string;
  
  // Tactical ratings (0 - 100)
  attackRating: number;
  defenseRating: number;
  possessionRating: number;
  setPieceRating: number;
  formRating: number; // 0 - 100
  
  // Season Statistics
  goalsScoredPerGame: number;
  goalsConcededPerGame: number;
  xGPerGame: number;
  xGAPerGame: number;
  cleanSheetPct: number;
  bttsRatePct: number;
  
  // Recent form (last 5 matches, e.g. ['W', 'W', 'D', 'W', 'L'])
  recentForm: ('W' | 'D' | 'L')[];
  
  // Key star player
  starPlayer: {
    name: string;
    position: string;
    goals: number;
    assists: number;
    rating: number;
  };
}

export interface PastH2HMeeting {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  venue?: string;
}

export interface DerbyPreset {
  id: string;
  name: string;
  tagline: string;
  league: string;
  teamAId: string;
  teamBId: string;
  pastMeetings: PastH2HMeeting[];
}

export interface SimulationResult {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  bttsProb: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  topScores: { score: string; prob: number }[];
  recommendedMarket: string;
  recommendedOdds: number;
  tacticalVerdict: string;
}
