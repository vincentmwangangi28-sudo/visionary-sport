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
  metadata?: Record<string, unknown>;
  created_at: string;
}

export const getPrediction = (p: Prediction) => p.predicted_outcome ?? p.prediction ?? 'Unknown';
export const getConfidence = (p: Prediction) => p.confidence_score ?? p.confidence ?? 0;
export const getAnalysis   = (p: Prediction) => p.analysis ?? p.reasoning ?? '';
