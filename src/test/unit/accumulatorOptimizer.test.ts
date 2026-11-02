import { describe, it, expect } from 'vitest';
import {
  optimizeAccumulator,
  exportAccaToCsv,
  type OptimizerOptions,
} from '@/services/accumulatorOptimizerService';
import type { Prediction } from '@/types/prediction';

const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    match_date: '2026-11-05T20:00:00Z',
    prediction: 'Arsenal to Win',
    confidence: 74,
    confidence_score: 74,
    home_odds: 1.85,
    draw_odds: 3.75,
    away_odds: 4.40,
    home_win_probability: 72,
    draw_probability: 18,
    away_win_probability: 10,
    is_premium: false,
    created_at: '2026-11-01',
  },
  {
    id: 'pred-2',
    home_team: 'Real Madrid',
    away_team: 'Sevilla',
    league: 'La Liga',
    match_date: '2026-11-05T21:00:00Z',
    prediction: 'Real Madrid to Win',
    confidence: 82,
    confidence_score: 82,
    home_odds: 1.45,
    draw_odds: 4.80,
    away_odds: 7.20,
    home_win_probability: 80,
    draw_probability: 14,
    away_win_probability: 6,
    is_premium: false,
    created_at: '2026-11-01',
  },
  {
    id: 'pred-3',
    home_team: 'Bayern Munich',
    away_team: 'Dortmund',
    league: 'Bundesliga',
    match_date: '2026-11-06T17:30:00Z',
    prediction: 'Bayern Munich to Win',
    confidence: 76,
    confidence_score: 76,
    home_odds: 1.62,
    draw_odds: 4.20,
    away_odds: 5.10,
    home_win_probability: 75,
    draw_probability: 15,
    away_win_probability: 10,
    is_premium: false,
    created_at: '2026-11-01',
  },
  {
    id: 'pred-4',
    home_team: 'Inter Milan',
    away_team: 'Juventus',
    league: 'Serie A',
    match_date: '2026-11-06T19:45:00Z',
    prediction: 'Inter Milan to Win',
    confidence: 68,
    confidence_score: 68,
    home_odds: 1.95,
    draw_odds: 3.40,
    away_odds: 4.10,
    home_win_probability: 65,
    draw_probability: 22,
    away_win_probability: 13,
    is_premium: false,
    created_at: '2026-11-01',
  },
  {
    id: 'pred-5',
    home_team: 'PSG',
    away_team: 'Marseille',
    league: 'Ligue 1',
    match_date: '2026-11-07T20:00:00Z',
    prediction: 'PSG to Win',
    confidence: 80,
    confidence_score: 80,
    home_odds: 1.50,
    draw_odds: 4.60,
    away_odds: 6.50,
    home_win_probability: 78,
    draw_probability: 14,
    away_win_probability: 8,
    is_premium: false,
    created_at: '2026-11-01',
  },
];

describe('Accumulator & Bet-Builder Optimizer Service', () => {
  it('generates an optimized 4-fold accumulator with positive EV', () => {
    const result = optimizeAccumulator(MOCK_PREDICTIONS, {
      strategy: 'MAX_EXPECTED_VALUE',
      targetLegs: 4,
    });

    expect(result.legs.length).toBe(4);
    expect(result.totalOdds).toBeGreaterThan(1.0);
    expect(result.combinedModelProbPct).toBeGreaterThan(0);
    expect(result.totalEvPct).toBeGreaterThan(0);
    expect(result.recommendedKellyStakePct).toBeGreaterThan(0);
  });

  it('enforces strict anti-correlation across all selected legs (no duplicate fixtures or teams)', () => {
    const result = optimizeAccumulator(MOCK_PREDICTIONS, {
      strategy: 'MAX_EXPECTED_VALUE',
      targetLegs: 5,
    });

    const matchIds = result.legs.map((l) => l.matchId);
    const uniqueMatchIds = new Set(matchIds);
    expect(uniqueMatchIds.size).toBe(result.legs.length);

    const homeTeams = result.legs.map((l) => l.homeTeam);
    const awayTeams = result.legs.map((l) => l.awayTeam);
    const allClubs = [...homeTeams, ...awayTeams];
    const uniqueClubs = new Set(allClubs);
    expect(uniqueClubs.size).toBe(allClubs.length);
  });

  it('supports the MAX_WIN_RATE high-certainty banker profile', () => {
    const result = optimizeAccumulator(MOCK_PREDICTIONS, {
      strategy: 'MAX_WIN_RATE',
      targetLegs: 3,
    });

    expect(result.legs.length).toBe(3);
    expect(result.strategy).toBe('MAX_WIN_RATE');
    // All legs in banker profile should have high individual probability
    result.legs.forEach((leg) => {
      expect(leg.modelProb).toBeGreaterThanOrEqual(60);
    });
  });

  it('supports the KELLY_GROWTH strategy ranking by fractional Kelly', () => {
    const result = optimizeAccumulator(MOCK_PREDICTIONS, {
      strategy: 'KELLY_GROWTH',
      targetLegs: 3,
    });

    expect(result.legs.length).toBe(3);
    expect(result.strategy).toBe('KELLY_GROWTH');
    expect(result.recommendedKellyStakePct).toBeGreaterThan(0);
  });

  it('exports accumulator data cleanly to CSV format', () => {
    const result = optimizeAccumulator(MOCK_PREDICTIONS, {
      strategy: 'MAX_EXPECTED_VALUE',
      targetLegs: 3,
    });

    const csv = exportAccaToCsv(result);
    expect(csv).toContain('Leg,Fixture,League,Market,Selection,Odds');
    expect(csv).toContain('Accumulator Summary');
    expect(csv).toContain('Combined Odds');
    expect(csv).toContain('Net Expected Value');
  });
});
