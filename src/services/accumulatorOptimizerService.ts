/**
 * PredictPro Algorithmic Accumulator & Bet-Builder Optimizer Service
 *
 * Provides quantitative selection, correlation filtering, and multi-objective optimization
 * (Max Win Rate, Mathematical +EV, Kelly Bankroll Growth, and Moonshot Multipliers)
 * for football accumulators (parlays).
 */

import { Prediction } from '@/types/prediction';

export type AccaStrategy = 'MAX_EXPECTED_VALUE' | 'MAX_WIN_RATE' | 'KELLY_GROWTH' | 'MOONSHOT_ACCURATE';

export interface OptimizedAccaLeg {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  market: string;
  selection: string;
  odds: number;
  modelProb: number; // e.g. 72.5%
  impliedProb: number; // 1 / odds * 100
  fairOdds: number; // 100 / modelProb
  edgePct: number; // (modelProb - impliedProb)
  evPct: number; // (modelProb/100 * odds - 1) * 100
  kellyFraction: number; // Fractional Kelly recommendation in %
  correlationRisk: 'NONE' | 'LOW' | 'MEDIUM';
}

export interface OptimizedAccumulatorResult {
  strategy: AccaStrategy;
  strategyLabel: string;
  legCount: number;
  legs: OptimizedAccaLeg[];
  totalOdds: number;
  combinedModelProbPct: number;
  combinedImpliedProbPct: number;
  totalEvPct: number;
  recommendedKellyStakePct: number;
  potentialReturnOn100: number;
  expectedProfitOn100: number;
  generatedAt: string;
}

export interface OptimizerOptions {
  strategy?: AccaStrategy;
  targetLegs?: number; // 3, 4, 5, 6, 8, 10
  minOddsPerLeg?: number;
  maxOddsPerLeg?: number;
  minModelProb?: number;
  minEdgePct?: number;
  leagueFilter?: string; // 'ALL' or league name
  excludedMatchIds?: string[];
}

/**
 * Standardizes odds safely
 */
function cleanOdds(raw: number | undefined | null, fallback: number): number {
  if (typeof raw === 'number' && !isNaN(raw) && raw >= 1.05 && raw <= 99.0) {
    return Number(raw.toFixed(2));
  }
  return fallback;
}

/**
 * Derives potential market candidates from a single Prediction fixture
 */
function extractCandidateMarkets(pred: Prediction): Array<{
  market: string;
  selection: string;
  odds: number;
  modelProb: number;
}> {
  const candidates: Array<{
    market: string;
    selection: string;
    odds: number;
    modelProb: number;
  }> = [];

  const homeWinProb = pred.home_win_probability || (pred.confidence ? pred.confidence * 0.7 : 52);
  const drawProb = pred.draw_probability || 24;
  const awayWinProb = pred.away_win_probability || Math.max(10, 100 - homeWinProb - drawProb);

  const homeOdds = cleanOdds(pred.home_odds, Number((100 / Math.max(homeWinProb, 20)).toFixed(2)));
  const drawOdds = cleanOdds(pred.draw_odds, Number((100 / Math.max(drawProb, 15)).toFixed(2)));
  const awayOdds = cleanOdds(pred.away_odds, Number((100 / Math.max(awayWinProb, 15)).toFixed(2)));

  // 1. Home Win
  candidates.push({
    market: 'Match Winner (1X2)',
    selection: `${pred.home_team} to Win`,
    odds: homeOdds,
    modelProb: homeWinProb,
  });

  // 2. Away Win
  candidates.push({
    market: 'Match Winner (1X2)',
    selection: `${pred.away_team} to Win`,
    odds: awayOdds,
    modelProb: awayWinProb,
  });

  // 3. Double Chance (1X)
  const prob1X = Math.min(95, homeWinProb + drawProb * 0.85);
  const odds1X = cleanOdds(undefined, Number((100 / (prob1X * 0.95)).toFixed(2)));
  candidates.push({
    market: 'Double Chance',
    selection: `${pred.home_team} or Draw (1X)`,
    odds: Math.max(1.15, odds1X),
    modelProb: prob1X,
  });

  // 4. Over 1.5 Goals
  const probO15 = Math.min(92, Math.max(62, (homeWinProb + awayWinProb) * 0.95));
  candidates.push({
    market: 'Over 1.5 Goals',
    selection: 'Over 1.5 Match Goals',
    odds: cleanOdds(undefined, Number((100 / (probO15 * 0.94)).toFixed(2))),
    modelProb: probO15,
  });

  // 5. Over 2.5 Goals (if favored by goal projection)
  const isHighScoring = homeWinProb > 55 || awayWinProb > 55;
  const probO25 = isHighScoring ? 62 : 48;
  candidates.push({
    market: 'Over 2.5 Goals',
    selection: 'Over 2.5 Match Goals',
    odds: isHighScoring ? 1.75 : 2.05,
    modelProb: probO25,
  });

  // 6. Both Teams To Score (BTTS)
  const probBtts = Math.min(75, Math.max(45, (awayWinProb + homeWinProb) * 0.65));
  candidates.push({
    market: 'Both Teams To Score',
    selection: 'BTTS — Yes',
    odds: cleanOdds(undefined, Number((100 / (probBtts * 0.92)).toFixed(2))),
    modelProb: probBtts,
  });

  // 7. Draw No Bet (Home DNB)
  const probDnbHome = Number(((homeWinProb / (homeWinProb + awayWinProb)) * 100).toFixed(1));
  candidates.push({
    market: 'Draw No Bet',
    selection: `${pred.home_team} (DNB)`,
    odds: cleanOdds(undefined, Number((100 / (probDnbHome * 0.92)).toFixed(2))),
    modelProb: probDnbHome,
  });

  return candidates;
}

/**
 * Optimizes an accumulator from available predictions based on quantitative edge criteria.
 */
export function optimizeAccumulator(
  predictions: Prediction[],
  options: OptimizerOptions = {}
): OptimizedAccumulatorResult {
  const {
    strategy = 'MAX_EXPECTED_VALUE',
    targetLegs = 4,
    minOddsPerLeg = 1.20,
    maxOddsPerLeg = 4.50,
    minModelProb = 35,
    minEdgePct = 2.0,
    leagueFilter = 'ALL',
    excludedMatchIds = [],
  } = options;

  const validTargetLegs = Math.min(10, Math.max(3, targetLegs));
  const excludedSet = new Set(excludedMatchIds);

  // Filter eligible fixtures
  const eligibleFixtures = predictions.filter((p) => {
    const id = p.id || p.match_id || `${p.home_team}-${p.away_team}`;
    if (excludedSet.has(id)) return false;
    if (leagueFilter !== 'ALL' && p.league !== leagueFilter) return false;
    return Boolean(p.home_team && p.away_team);
  });

  // Build candidate leg pool with anti-correlation protection
  const candidatePool: OptimizedAccaLeg[] = [];

  for (const fixture of eligibleFixtures) {
    const matchId = fixture.id || fixture.match_id || `${fixture.home_team}-${fixture.away_team}`;
    const markets = extractCandidateMarkets(fixture);

    for (const m of markets) {
      if (m.odds < minOddsPerLeg || m.odds > maxOddsPerLeg) continue;
      if (m.modelProb < minModelProb) continue;

      const impliedProb = Number(((1 / m.odds) * 100).toFixed(1));
      const edgePct = Number((m.modelProb - impliedProb).toFixed(1));
      if (edgePct < minEdgePct && strategy !== 'MAX_WIN_RATE') continue;

      const evPct = Number(((m.modelProb / 100) * m.odds - 1) * 100);
      const fairOdds = Number((100 / Math.max(m.modelProb, 1)).toFixed(2));

      // Kelly fraction = (b*p - q) / b where b = odds - 1, p = prob/100, q = 1 - p
      const b = m.odds - 1;
      const pDec = m.modelProb / 100;
      const qDec = 1 - pDec;
      const fullKelly = b > 0 ? (b * pDec - qDec) / b : 0;
      const quarterKelly = Math.max(0, Number((fullKelly * 0.25 * 100).toFixed(2)));

      candidatePool.push({
        id: `opt-${matchId}-${m.market.replace(/\s+/g, '_')}`,
        matchId,
        homeTeam: fixture.home_team,
        awayTeam: fixture.away_team,
        league: fixture.league || 'International Football',
        matchDate: fixture.match_date || new Date().toISOString(),
        market: m.market,
        selection: m.selection,
        odds: m.odds,
        modelProb: m.modelProb,
        impliedProb,
        fairOdds,
        edgePct,
        evPct: Number(evPct.toFixed(1)),
        kellyFraction: quarterKelly,
        correlationRisk: 'NONE',
      });
    }
  }

  // Sort candidate pool according to chosen strategy
  if (strategy === 'MAX_WIN_RATE') {
    // Rank by highest raw probability, favor lowest variance
    candidatePool.sort((a, b) => b.modelProb - a.modelProb || b.evPct - a.evPct);
  } else if (strategy === 'MAX_EXPECTED_VALUE') {
    // Rank by highest Net EV %, break ties with edge
    candidatePool.sort((a, b) => b.evPct - a.evPct || b.edgePct - a.edgePct);
  } else if (strategy === 'KELLY_GROWTH') {
    // Rank by optimal Kelly stake allocation
    candidatePool.sort((a, b) => b.kellyFraction - a.kellyFraction || b.evPct - a.evPct);
  } else if (strategy === 'MOONSHOT_ACCURATE') {
    // Rank by combination of high odds and positive edge
    candidatePool.sort((a, b) => (b.odds >= 1.85 ? b.evPct * b.odds : 0) - (a.odds >= 1.85 ? a.evPct * a.odds : 0));
  }

  // Select target legs ensuring strictly ONE leg per fixture (Strict Anti-Correlation)
  const selectedLegs: OptimizedAccaLeg[] = [];
  const usedMatchIds = new Set<string>();
  const usedTeams = new Set<string>();

  for (const leg of candidatePool) {
    if (selectedLegs.length >= validTargetLegs) break;
    if (usedMatchIds.has(leg.matchId)) continue;
    if (usedTeams.has(leg.homeTeam) || usedTeams.has(leg.awayTeam)) continue;

    selectedLegs.push(leg);
    usedMatchIds.add(leg.matchId);
    usedTeams.add(leg.homeTeam);
    usedTeams.add(leg.awayTeam);
  }

  // If pool was sparse, fill remaining slots safely from high confidence predictions
  if (selectedLegs.length < validTargetLegs && eligibleFixtures.length > 0) {
    for (const fix of eligibleFixtures) {
      if (selectedLegs.length >= validTargetLegs) break;
      const matchId = fix.id || fix.match_id || `${fix.home_team}-${fix.away_team}`;
      if (usedMatchIds.has(matchId)) continue;

      const pWin = fix.confidence_score || fix.confidence || 65;
      const odds = cleanOdds(fix.home_odds, 1.80);
      const impliedProb = Number(((1 / odds) * 100).toFixed(1));
      const edge = Number((pWin - impliedProb).toFixed(1));

      selectedLegs.push({
        id: `fallback-${matchId}`,
        matchId,
        homeTeam: fix.home_team,
        awayTeam: fix.away_team,
        league: fix.league || 'Top Flight',
        matchDate: fix.match_date || new Date().toISOString(),
        market: 'Match Winner (1X2)',
        selection: `${fix.home_team} to Win`,
        odds,
        modelProb: pWin,
        impliedProb,
        fairOdds: Number((100 / Math.max(pWin, 1)).toFixed(2)),
        edgePct: edge,
        evPct: Number(((pWin / 100 * odds - 1) * 100).toFixed(1)),
        kellyFraction: Math.max(0.5, Number((edge * 0.4).toFixed(1))),
        correlationRisk: 'NONE',
      });
      usedMatchIds.add(matchId);
    }
  }

  // Calculate compound metrics
  const totalOdds = Number(
    selectedLegs.reduce((acc, leg) => acc * leg.odds, 1).toFixed(2)
  );

  const combinedModelProbDec = selectedLegs.reduce(
    (acc, leg) => acc * (leg.modelProb / 100),
    1
  );
  const combinedModelProbPct = Number((combinedModelProbDec * 100).toFixed(2));

  const combinedImpliedProbDec = totalOdds > 0 ? 1 / totalOdds : 0;
  const combinedImpliedProbPct = Number((combinedImpliedProbDec * 100).toFixed(2));

  // Compound Expected Value = (Combined Prob * Total Odds - 1) * 100
  const totalEvPct = Number(
    ((combinedModelProbDec * totalOdds - 1) * 100).toFixed(1)
  );

  // Compound Multi-Bet Fractional Kelly:
  const bAcca = totalOdds - 1;
  const pAcca = combinedModelProbDec;
  const qAcca = 1 - pAcca;
  const fullKellyAcca = bAcca > 0 ? (bAcca * pAcca - qAcca) / bAcca : 0;
  // Conservative quarter-Kelly recommendation capped at 5% bankroll
  const recommendedKellyStakePct = Math.min(
    5.0,
    Math.max(0.25, Number((fullKellyAcca * 0.25 * 100).toFixed(2)))
  );

  const potentialReturnOn100 = Number((100 * totalOdds).toFixed(2));
  const expectedProfitOn100 = Number(
    (100 * (combinedModelProbDec * totalOdds - 1)).toFixed(2)
  );

  const strategyLabels: Record<AccaStrategy, string> = {
    MAX_EXPECTED_VALUE: 'Mathematical +EV Edge',
    MAX_WIN_RATE: 'High-Certainty Banker',
    KELLY_GROWTH: 'Optimal Bankroll Growth (Kelly)',
    MOONSHOT_ACCURATE: 'High-Yield Moonshot Accumulator',
  };

  return {
    strategy,
    strategyLabel: strategyLabels[strategy] || 'Optimized Acca',
    legCount: selectedLegs.length,
    legs: selectedLegs,
    totalOdds,
    combinedModelProbPct,
    combinedImpliedProbPct,
    totalEvPct,
    recommendedKellyStakePct,
    potentialReturnOn100,
    expectedProfitOn100,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Exports optimized accumulator legs to CSV string
 */
export function exportAccaToCsv(result: OptimizedAccumulatorResult): string {
  const headers = [
    'Leg',
    'Fixture',
    'League',
    'Market',
    'Selection',
    'Odds',
    'Model Prob %',
    'Bookie Implied %',
    'Edge %',
    'EV %',
    'Kelly %',
  ];

  const rows = result.legs.map((leg, idx) => [
    `#${idx + 1}`,
    `"${leg.homeTeam} vs ${leg.awayTeam}"`,
    `"${leg.league}"`,
    `"${leg.market}"`,
    `"${leg.selection}"`,
    leg.odds.toFixed(2),
    leg.modelProb.toFixed(1),
    leg.impliedProb.toFixed(1),
    `${leg.edgePct > 0 ? '+' : ''}${leg.edgePct.toFixed(1)}%`,
    `${leg.evPct > 0 ? '+' : ''}${leg.evPct.toFixed(1)}%`,
    `${leg.kellyFraction.toFixed(1)}%`,
  ]);

  const summary = [
    [],
    ['Accumulator Summary'],
    ['Strategy', result.strategyLabel],
    ['Total Legs', String(result.legCount)],
    ['Combined Odds', `${result.totalOdds.toFixed(2)}x`],
    ['Combined Win Probability', `${result.combinedModelProbPct.toFixed(2)}%`],
    ['Net Expected Value', `${result.totalEvPct > 0 ? '+' : ''}${result.totalEvPct.toFixed(1)}%`],
    ['Recommended Kelly Stake', `${result.recommendedKellyStakePct.toFixed(2)}% of Bankroll`],
    ['Potential Return (100 Stake)', result.potentialReturnOn100.toFixed(2)],
    ['Expected Net Profit (100 Stake)', result.expectedProfitOn100.toFixed(2)],
  ];

  return [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    ...summary.map((r) => r.join(',')),
  ].join('\n');
}

/**
 * Triggers browser download of the CSV dossier
 */
export function downloadAccaCsvFile(result: OptimizedAccumulatorResult, filename?: string): void {
  const csvContent = exportAccaToCsv(result);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename || `PredictPro-Optimized-Acca-${result.legCount}Fold-${Date.now()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
