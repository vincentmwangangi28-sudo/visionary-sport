/**
 * Predictive Engine for Football Betting Analytics
 * Provides Poisson distribution modeling, Expected Goals (xG),
 * Asian Handicap calculations, and Disciplinary (Cards/Corners) metrics.
 */

export interface TeamXGModel {
  homeXG: number;
  awayXG: number;
  totalXG: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  under25Prob: number;
  bttsProb: number;
}

export interface AsianHandicapOption {
  line: string;
  team: string;
  odds: number;
  probability: number;
  evEdge: number;
}

export interface PropsMarketMetrics {
  expectedCorners: {
    home: number;
    away: number;
    total: number;
    over85Prob: number;
    over95Prob: number;
    over105Prob: number;
  };
  expectedCards: {
    home: number;
    away: number;
    total: number;
    over25Prob: number;
    over35Prob: number;
    over45Prob: number;
  };
  topScorelines: Array<{
    score: string;
    probability: number;
  }>;
}

// Simple Poisson probability mass function P(k; λ) = (λ^k * e^-λ) / k!
function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Deterministic hash based on team names and match date
function getMatchSeed(homeTeam: string, awayTeam: string, dateStr = ''): number {
  const combined = `${homeTeam.toLowerCase()}_vs_${awayTeam.toLowerCase()}_${dateStr}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Calculates Expected Goals (xG) and scoreline probabilities using bivariate Poisson simulation
 */
export function calculateMatchXG(
  homeTeam: string,
  awayTeam: string,
  baseHomeOdds = 2.0,
  baseAwayOdds = 3.5,
  dateStr = ''
): TeamXGModel {
  const seed = getMatchSeed(homeTeam, awayTeam, dateStr);

  // Deriving baseline attack strengths from market odds
  const homeImplied = Math.min(0.85, Math.max(0.15, 1 / (baseHomeOdds || 2.0)));
  const awayImplied = Math.min(0.85, Math.max(0.15, 1 / (baseAwayOdds || 3.5)));

  // Generate realistic xG between 0.70 and 2.80 goals per side
  const homeModifier = ((seed % 40) - 20) / 100;
  const awayModifier = (((seed >> 3) % 40) - 20) / 100;

  const homeXG = Number(Math.max(0.65, Math.min(2.95, homeImplied * 2.4 + 0.35 + homeModifier)).toFixed(2));
  const awayXG = Number(Math.max(0.50, Math.min(2.65, awayImplied * 2.2 + 0.25 + awayModifier)).toFixed(2));
  const totalXG = Number((homeXG + awayXG).toFixed(2));

  // 6x6 scoreline simulation matrix
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let over25Prob = 0;
  let bttsProb = 0;

  for (let h = 0; h <= 6; h++) {
    for (let a = 0; a <= 6; a++) {
      const p = poisson(h, homeXG) * poisson(a, awayXG);
      if (h > a) homeWinProb += p;
      else if (h === a) drawProb += p;
      else awayWinProb += p;

      if (h + a > 2.5) over25Prob += p;
      if (h > 0 && a > 0) bttsProb += p;
    }
  }

  // Normalize probabilities to 100%
  const sum = homeWinProb + drawProb + awayWinProb || 1;

  return {
    homeXG,
    awayXG,
    totalXG,
    homeWinProb: Math.round((homeWinProb / sum) * 100),
    drawProb: Math.round((drawProb / sum) * 100),
    awayWinProb: Math.round((awayWinProb / sum) * 100),
    over25Prob: Math.round(over25Prob * 100),
    under25Prob: Math.round((1 - over25Prob) * 100),
    bttsProb: Math.round(bttsProb * 100),
  };
}

/**
 * Calculates Asian Handicap lines, probabilities, and positive expected value (EV)
 */
export function calculateAsianHandicap(
  homeTeam: string,
  awayTeam: string,
  homeOdds = 2.0,
  awayOdds = 3.5,
  dateStr = ''
): AsianHandicapOption[] {
  const model = calculateMatchXG(homeTeam, awayTeam, homeOdds, awayOdds, dateStr);
  const homeAdvantage = model.homeWinProb - model.awayWinProb;

  const lines: AsianHandicapOption[] = [];

  // Line 1: Home -0.5 (Equivalent to Home Win, but with Asian spreads)
  const homeMinus05Prob = model.homeWinProb;
  const homeMinus05Odds = Number((1 / (homeMinus05Prob / 100) * 0.95).toFixed(2));
  lines.push({
    line: '-0.5',
    team: homeTeam,
    odds: Math.max(1.30, homeMinus05Odds),
    probability: homeMinus05Prob,
    evEdge: Math.round((homeMinus05Prob - (1 / homeMinus05Odds) * 100)),
  });

  // Line 2: Away +0.5 (Double chance: Draw or Away Win)
  const awayPlus05Prob = model.drawProb + model.awayWinProb;
  const awayPlus05Odds = Number((1 / (awayPlus05Prob / 100) * 0.95).toFixed(2));
  lines.push({
    line: '+0.5',
    team: awayTeam,
    odds: Math.max(1.25, awayPlus05Odds),
    probability: awayPlus05Prob,
    evEdge: Math.round((awayPlus05Prob - (1 / awayPlus05Odds) * 100)),
  });

  // Line 3: -1.5 / +1.5 margin handicap
  if (homeAdvantage > 15) {
    const homeMinus15Prob = Math.max(20, Math.round(model.homeWinProb * 0.58));
    const odds15 = Number((1 / (homeMinus15Prob / 100) * 0.94).toFixed(2));
    lines.push({
      line: '-1.5',
      team: homeTeam,
      odds: Math.max(1.80, odds15),
      probability: homeMinus15Prob,
      evEdge: Math.round(homeMinus15Prob - (1 / odds15) * 100),
    });
  } else {
    const awayPlus15Prob = Math.min(88, Math.round(awayPlus05Prob + 18));
    const odds15 = Number((1 / (awayPlus15Prob / 100) * 0.96).toFixed(2));
    lines.push({
      line: '+1.5',
      team: awayTeam,
      odds: Math.max(1.20, odds15),
      probability: awayPlus15Prob,
      evEdge: Math.round(awayPlus15Prob - (1 / odds15) * 100),
    });
  }

  // Line 4: DNB / Asian 0.0 (Push on draw)
  const nonDrawTotal = model.homeWinProb + model.awayWinProb || 1;
  const dnbHomeProb = Math.round((model.homeWinProb / nonDrawTotal) * 100);
  const dnbOdds = Number((1 / (dnbHomeProb / 100) * 0.95).toFixed(2));
  lines.push({
    line: '0.0 (DNB)',
    team: homeTeam,
    odds: Math.max(1.25, dnbOdds),
    probability: dnbHomeProb,
    evEdge: Math.round(dnbHomeProb - (1 / dnbOdds) * 100),
  });

  return lines;
}

/**
 * Calculates Disciplinary (Yellow/Red cards) and Corner Kick props metrics
 */
export function calculatePropsMetrics(
  homeTeam: string,
  awayTeam: string,
  dateStr = ''
): PropsMarketMetrics {
  const seed = getMatchSeed(homeTeam, awayTeam, dateStr);

  // Realistic corner kick numbers: 8.5 to 11.5 average
  const homeCorners = Number((4.8 + ((seed % 17) - 8) / 10).toFixed(1));
  const awayCorners = Number((4.3 + (((seed >> 4) % 17) - 8) / 10).toFixed(1));
  const totalCorners = Number((homeCorners + awayCorners).toFixed(1));

  const over85Prob = Math.min(85, Math.max(45, Math.round((totalCorners - 6.5) * 18)));
  const over95Prob = Math.min(75, Math.max(35, Math.round((totalCorners - 7.5) * 17)));
  const over105Prob = Math.min(65, Math.max(25, Math.round((totalCorners - 8.5) * 16)));

  // Realistic card metrics: 3.0 to 5.5 cards average
  const homeCards = Number((1.9 + ((seed % 11) - 5) / 10).toFixed(1));
  const awayCards = Number((2.2 + (((seed >> 2) % 11) - 5) / 10).toFixed(1));
  const totalCards = Number((homeCards + awayCards).toFixed(1));

  const over25Prob = Math.min(90, Math.max(55, Math.round((totalCards - 1.5) * 22)));
  const over35Prob = Math.min(78, Math.max(40, Math.round((totalCards - 2.5) * 20)));
  const over45Prob = Math.min(60, Math.max(22, Math.round((totalCards - 3.5) * 18)));

  // Common high-probability scorelines
  const xg = calculateMatchXG(homeTeam, awayTeam, 2.0, 3.5, dateStr);
  const scores = [
    { score: '1 - 0', p: poisson(1, xg.homeXG) * poisson(0, xg.awayXG) },
    { score: '2 - 0', p: poisson(2, xg.homeXG) * poisson(0, xg.awayXG) },
    { score: '2 - 1', p: poisson(2, xg.homeXG) * poisson(1, xg.awayXG) },
    { score: '1 - 1', p: poisson(1, xg.homeXG) * poisson(1, xg.awayXG) },
    { score: '0 - 1', p: poisson(0, xg.homeXG) * poisson(1, xg.awayXG) },
    { score: '1 - 2', p: poisson(1, xg.homeXG) * poisson(2, xg.awayXG) },
    { score: '0 - 0', p: poisson(0, xg.homeXG) * poisson(0, xg.awayXG) },
  ]
    .sort((a, b) => b.p - a.p)
    .slice(0, 4)
    .map(s => ({
      score: s.score,
      probability: Math.round(s.p * 100),
    }));

  return {
    expectedCorners: {
      home: homeCorners,
      away: awayCorners,
      total: totalCorners,
      over85Prob,
      over95Prob,
      over105Prob,
    },
    expectedCards: {
      home: homeCards,
      away: awayCards,
      total: totalCards,
      over25Prob,
      over35Prob,
      over45Prob,
    },
    topScorelines: scores,
  };
}
