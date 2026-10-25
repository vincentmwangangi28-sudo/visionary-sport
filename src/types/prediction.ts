export interface RealMatchEvent {
  minute: string;
  type: 'goal' | 'card' | 'red_card' | 'penalty' | 'own_goal' | 'sub';
  team: 'home' | 'away';
  teamName?: string;
  player?: string;
  detailText?: string;
  text: string;
}

export interface RealMatchStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeOnTarget: number;
  awayOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls?: number;
  awayFouls?: number;
  homeShotAssists?: number;
  awayShotAssists?: number;
}

export interface MatchRosterPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  starter: boolean;
  subbedIn?: boolean;
  subbedOut?: boolean;
  goals?: number;
  yellowCard?: boolean;
  redCard?: boolean;
}

export interface MatchTeamRoster {
  teamName: string;
  formation: string;
  starters: MatchRosterPlayer[];
  substitutes: MatchRosterPlayer[];
}

export interface MatchSummaryCommentary {
  minute: string;
  text: string;
  type?: string;
}

export interface MatchH2HGame {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
}

export interface RealMatchSummary {
  eventId: string;
  venue?: string;
  city?: string;
  attendance?: number;
  referee?: string;
  homeRoster?: MatchTeamRoster;
  awayRoster?: MatchTeamRoster;
  commentary: MatchSummaryCommentary[];
  headToHead: MatchH2HGame[];
  matchEvents: RealMatchEvent[];
  matchStats?: RealMatchStats;
}

export interface Prediction {
  id: string;
  match_id?: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  prediction: string;
  predicted_outcome?: string;
  confidence: number;
  confidence_score?: number;
  reasoning?: string;
  analysis?: string;
  is_premium: boolean;
  result?: string;
  status?: string;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  home_odds_open?: number;
  draw_odds_open?: number;
  away_odds_open?: number;
  odds_movement_pct?: number;
  clv_edge_pct?: number;
  odds?: number;
  home_win_probability?: number;
  draw_probability?: number;
  away_win_probability?: number;
  home_logo?: string | null;
  away_logo?: string | null;
  home_form?: string;
  away_form?: string;
  home_record?: string;
  away_record?: string;
  venue?: string;
  over_under_line?: number;
  sportsbook_line?: string;
  match_events?: RealMatchEvent[];
  match_stats?: RealMatchStats;
  actual_score?: string;
  settled_at?: string;
  is_realtime?: boolean;
  ai_model?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  homeTeam?: string;
  awayTeam?: string;
  time?: string;
  matchDate?: string;
}

export const getPrediction = (p: Prediction) => p.predicted_outcome ?? p.prediction ?? 'Unknown';
export const getConfidence = (p: Prediction) => p.confidence_score ?? p.confidence ?? 0;
export const getAnalysis   = (p: Prediction) => p.analysis ?? p.reasoning ?? '';
