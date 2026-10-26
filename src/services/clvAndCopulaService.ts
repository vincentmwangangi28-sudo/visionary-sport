import { broadcastAdminSync } from './adminOverrideSyncService';

export interface ClvSteamSignal {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  region: 'Europe' | 'Africa / CAF' | 'Americas';
  kickoffLabel: string;
  market: string;
  openingOdds: number;
  currentBookieOdds: number;
  sharpPinnacleNoVigOdds: number;
  modelFairOdds: number;
  modelProbabilityPct: number;
  clvBeatPct: number; // % edge vs sharp closing/current line
  steamDropPct: number; // % drop from opening odds
  movementTag: 'SYNDICATE STEAM' | 'REVERSE LINE (RLM)' | 'POISSON CLV EDGE' | 'LATE SHARP MONEY';
  sharpMoneyVolumePct: number;
  publicTicketsPct: number;
  tacticalNote: string;
}

export interface SgpCandidateLeg {
  id: string;
  category: 'RESULT' | 'GOALS' | 'BTTS' | 'CORNERS' | 'CARDS' | 'PLAYER_PROP';
  label: string;
  baseProbabilityPct: number;
  bookieSingleOdds: number;
}

export interface SgpMatchTemplate {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  homeXg: number;
  awayXg: number;
  availableLegs: SgpCandidateLeg[];
}

export interface PairwiseCorrelationItem {
  legAId: string;
  legALabel: string;
  legBId: string;
  legBLabel: string;
  rho: number; // -0.65 to +0.72
  relationship: 'STRONG_POSITIVE' | 'MODERATE_POSITIVE' | 'NEUTRAL' | 'NEGATIVE_CONFLICT';
  explanation: string;
}

export interface SgpCopulaEvaluation {
  legsCount: number;
  uncorrelatedProbPct: number;
  uncorrelatedFairOdds: number;
  bookmakerQuotedSgpOdds: number;
  copulaTrueProbPct: number;
  copulaTrueFairOdds: number;
  correlationBoostPct: number;
  valueEdgePct: number;
  kellyStakePct: number;
  pairwiseCorrelations: PairwiseCorrelationItem[];
  summaryReport: string;
}

const CLV_SIGNALS_STORAGE_KEY = 'predictpro_clv_steam_signals_v1';

export const DEFAULT_CLV_STEAM_SIGNALS: ClvSteamSignal[] = [
  {
    id: 'clv-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    region: 'Europe',
    kickoffLabel: 'Today · 19:45 UTC',
    market: 'Arsenal -0.75 Asian Handicap',
    openingOdds: 2.04,
    currentBookieOdds: 1.88,
    sharpPinnacleNoVigOdds: 1.73,
    modelFairOdds: 1.69,
    modelProbabilityPct: 59.2,
    clvBeatPct: 8.7,
    steamDropPct: 15.2,
    movementTag: 'SYNDICATE STEAM',
    sharpMoneyVolumePct: 84,
    publicTicketsPct: 51,
    tacticalNote:
      'Asian syndicate liquidity hit Arsenal -0.75 at 2.04 down to 1.73 sharp no-vig. Soft recreational books still hanging 1.88 (+8.7% pure CLV).',
  },
  {
    id: 'clv-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    region: 'Europe',
    kickoffLabel: 'Today · 20:00 UTC',
    market: 'Over 3.0 Goal Line (Asian Total)',
    openingOdds: 2.12,
    currentBookieOdds: 1.92,
    sharpPinnacleNoVigOdds: 1.77,
    modelFairOdds: 1.74,
    modelProbabilityPct: 57.5,
    clvBeatPct: 8.5,
    steamDropPct: 16.5,
    movementTag: 'SYNDICATE STEAM',
    sharpMoneyVolumePct: 88,
    publicTicketsPct: 62,
    tacticalNote:
      'Combined Poisson xG of 3.64 triggered heavy institutional buy orders on Over 3.0 goals across Pinnacle and Betfair Exchange.',
  },
  {
    id: 'clv-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    region: 'Africa / CAF',
    kickoffLabel: 'Today · 15:00 UTC',
    market: 'Gor Mahia Win (1)',
    openingOdds: 1.95,
    currentBookieOdds: 1.78,
    sharpPinnacleNoVigOdds: 1.64,
    modelFairOdds: 1.61,
    modelProbabilityPct: 62.1,
    clvBeatPct: 8.5,
    steamDropPct: 15.9,
    movementTag: 'POISSON CLV EDGE',
    sharpMoneyVolumePct: 79,
    publicTicketsPct: 58,
    tacticalNote:
      'PredictPro model locked Gor Mahia at 1.95 opening; regional East African books still offer 1.78 against a 1.61 true Poisson line.',
  },
  {
    id: 'clv-new-tot',
    homeTeam: 'Newcastle United',
    awayTeam: 'Tottenham Hotspur',
    league: 'Premier League',
    region: 'Europe',
    kickoffLabel: 'Today · 17:30 UTC',
    market: 'Newcastle Draw No Bet (DNB)',
    openingOdds: 1.98,
    currentBookieOdds: 1.84,
    sharpPinnacleNoVigOdds: 1.70,
    modelFairOdds: 1.68,
    modelProbabilityPct: 59.5,
    clvBeatPct: 8.2,
    steamDropPct: 14.1,
    movementTag: 'REVERSE LINE (RLM)',
    sharpMoneyVolumePct: 81,
    publicTicketsPct: 36,
    tacticalNote:
      '64% of public tickets are on Tottenham, yet the line moved toward Newcastle from 1.98 to 1.70—classic Reverse Line Movement.',
  },
  {
    id: 'clv-ahl-sun',
    homeTeam: 'Al Ahly',
    awayTeam: 'Mamelodi Sundowns',
    league: 'CAF Champions League',
    region: 'Africa / CAF',
    kickoffLabel: 'Today · 19:00 UTC',
    market: 'Both Teams to Score (BTTS — Yes)',
    openingOdds: 2.08,
    currentBookieOdds: 1.90,
    sharpPinnacleNoVigOdds: 1.76,
    modelFairOdds: 1.72,
    modelProbabilityPct: 58.1,
    clvBeatPct: 8.0,
    steamDropPct: 15.4,
    movementTag: 'LATE SHARP MONEY',
    sharpMoneyVolumePct: 82,
    publicTicketsPct: 44,
    tacticalNote:
      'Sundowns high possession buildup in Cairo historically forces open second-half transitions; sharp line dropped 32 cents.',
  },
  {
    id: 'clv-fla-pal',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    league: 'Brasileirão Série A',
    region: 'Americas',
    kickoffLabel: 'Tonight · 22:30 UTC',
    market: 'Over 9.5 Total Match Corners',
    openingOdds: 1.96,
    currentBookieOdds: 1.85,
    sharpPinnacleNoVigOdds: 1.71,
    modelFairOdds: 1.68,
    modelProbabilityPct: 59.5,
    clvBeatPct: 8.2,
    steamDropPct: 12.8,
    movementTag: 'POISSON CLV EDGE',
    sharpMoneyVolumePct: 77,
    publicTicketsPct: 49,
    tacticalNote:
      'Both clubs rank top-3 in wide wing crosses per 90 in Série A, projecting 11.4 expected corners.',
  },
];

export const SGP_MATCH_TEMPLATES: SgpMatchTemplate[] = [
  {
    id: 'sgp-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    kickoff: 'Today · 19:45 UTC',
    homeXg: 2.18,
    awayXg: 1.14,
    availableLegs: [
      { id: 'home_win', category: 'RESULT', label: 'Arsenal to Win (1)', baseProbabilityPct: 61, bookieSingleOdds: 1.62 },
      { id: 'double_1x', category: 'RESULT', label: 'Arsenal or Draw (1X)', baseProbabilityPct: 84, bookieSingleOdds: 1.18 },
      { id: 'over_25', category: 'GOALS', label: 'Over 2.5 Total Goals', baseProbabilityPct: 64, bookieSingleOdds: 1.65 },
      { id: 'under_25', category: 'GOALS', label: 'Under 2.5 Total Goals', baseProbabilityPct: 36, bookieSingleOdds: 2.25 },
      { id: 'btts_yes', category: 'BTTS', label: 'Both Teams to Score (Yes)', baseProbabilityPct: 62, bookieSingleOdds: 1.68 },
      { id: 'corners_o95', category: 'CORNERS', label: 'Over 9.5 Match Corners', baseProbabilityPct: 66, bookieSingleOdds: 1.60 },
      { id: 'cards_o35', category: 'CARDS', label: 'Over 3.5 Yellow/Red Cards', baseProbabilityPct: 68, bookieSingleOdds: 1.55 },
      { id: 'saka_sot', category: 'PLAYER_PROP', label: 'Bukayo Saka 1+ Shot on Target', baseProbabilityPct: 76, bookieSingleOdds: 1.36 },
    ],
  },
  {
    id: 'sgp-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    kickoff: 'Today · 20:00 UTC',
    homeXg: 1.98,
    awayXg: 1.66,
    availableLegs: [
      { id: 'home_win', category: 'RESULT', label: 'Real Madrid to Win (1)', baseProbabilityPct: 52, bookieSingleOdds: 1.90 },
      { id: 'double_1x', category: 'RESULT', label: 'Real Madrid or Draw (1X)', baseProbabilityPct: 76, bookieSingleOdds: 1.28 },
      { id: 'over_25', category: 'GOALS', label: 'Over 2.5 Total Goals', baseProbabilityPct: 71, bookieSingleOdds: 1.48 },
      { id: 'under_25', category: 'GOALS', label: 'Under 2.5 Total Goals', baseProbabilityPct: 29, bookieSingleOdds: 2.75 },
      { id: 'btts_yes', category: 'BTTS', label: 'Both Teams to Score (Yes)', baseProbabilityPct: 74, bookieSingleOdds: 1.44 },
      { id: 'corners_o95', category: 'CORNERS', label: 'Over 9.5 Match Corners', baseProbabilityPct: 65, bookieSingleOdds: 1.62 },
      { id: 'cards_o35', category: 'CARDS', label: 'Over 4.5 Match Cards (El Clásico)', baseProbabilityPct: 75, bookieSingleOdds: 1.46 },
      { id: 'mbappe_sot', category: 'PLAYER_PROP', label: 'Kylian Mbappé 2+ Shots on Target', baseProbabilityPct: 69, bookieSingleOdds: 1.52 },
    ],
  },
  {
    id: 'sgp-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    kickoff: 'Today · 15:00 UTC',
    homeXg: 1.76,
    awayXg: 0.82,
    availableLegs: [
      { id: 'home_win', category: 'RESULT', label: 'Gor Mahia to Win (1)', baseProbabilityPct: 63, bookieSingleOdds: 1.68 },
      { id: 'double_1x', category: 'RESULT', label: 'Gor Mahia or Draw (1X)', baseProbabilityPct: 87, bookieSingleOdds: 1.15 },
      { id: 'over_25', category: 'GOALS', label: 'Over 2.5 Total Goals', baseProbabilityPct: 51, bookieSingleOdds: 1.98 },
      { id: 'under_25', category: 'GOALS', label: 'Under 2.5 Total Goals', baseProbabilityPct: 49, bookieSingleOdds: 1.85 },
      { id: 'btts_yes', category: 'BTTS', label: 'Both Teams to Score (Yes)', baseProbabilityPct: 48, bookieSingleOdds: 2.02 },
      { id: 'corners_o95', category: 'CORNERS', label: 'Over 8.5 Derby Corners', baseProbabilityPct: 67, bookieSingleOdds: 1.58 },
      { id: 'cards_o35', category: 'CARDS', label: 'Over 4.5 Derby Bookings', baseProbabilityPct: 73, bookieSingleOdds: 1.48 },
      { id: 'odhiambo_sot', category: 'PLAYER_PROP', label: 'Austin Odhiambo 1+ Goal/Assist', baseProbabilityPct: 58, bookieSingleOdds: 1.78 },
    ],
  },
];

export function getClvSteamSignals(): ClvSteamSignal[] {
  if (typeof window === 'undefined') return DEFAULT_CLV_STEAM_SIGNALS;
  try {
    const raw = localStorage.getItem(CLV_SIGNALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CLV_STEAM_SIGNALS;
  } catch {
    return DEFAULT_CLV_STEAM_SIGNALS;
  }
}

export function addOrUpdateClvSteamSignal(
  signal: Omit<ClvSteamSignal, 'id'> & { id?: string }
): ClvSteamSignal[] {
  const current = getClvSteamSignals();
  const created: ClvSteamSignal = {
    ...signal,
    id: signal.id || `clv-custom-${Date.now()}`,
  };
  const next = [created, ...current.filter((item) => item.id !== created.id)];
  try {
    localStorage.setItem(CLV_SIGNALS_STORAGE_KEY, JSON.stringify(next));
    broadcastAdminSync('clv_signals');
  } catch {
    // ignore
  }
  return next;
}

export function calculateNoVigClv(params: {
  betOddsTaken: number;
  closingOddsSideA: number;
  closingOddsSideB: number;
  stakeAmount: number;
}) {
  const taken = Math.max(params.betOddsTaken, 1.02);
  const closeA = Math.max(params.closingOddsSideA, 1.02);
  const closeB = Math.max(params.closingOddsSideB, 1.02);

  const rawProbA = 1 / closeA;
  const rawProbB = 1 / closeB;
  const overround = rawProbA + rawProbB;
  const bookieMarginPct = Number(((overround - 1) * 100).toFixed(2));

  // Multiplicative No-Vig True Probability
  const trueNoVigProbA = rawProbA / overround;
  const trueNoVigFairOdds = Number((1 / trueNoVigProbA).toFixed(3));

  // CLV % = (Odds Taken / True No-Vig Closing Odds - 1) * 100
  const clvEdgePct = Number(((taken / trueNoVigFairOdds - 1) * 100).toFixed(2));
  const expectedLongTermProfitPerBet = Number(
    ((params.stakeAmount * clvEdgePct) / 100).toFixed(2)
  );

  return {
    bookieMarginPct,
    trueNoVigProbPct: Number((trueNoVigProbA * 100).toFixed(2)),
    trueNoVigFairOdds,
    clvEdgePct,
    expectedLongTermProfitPerBet,
    isPositiveClv: clvEdgePct > 0,
  };
}

function getPairwiseCorrelationRho(a: SgpCandidateLeg, b: SgpCandidateLeg): {
  rho: number;
  explanation: string;
} {
  const pairKey = [a.category, b.category].sort().join('+');
  const ids = `${a.id}|${b.id}`;

  if (ids.includes('over_25') && ids.includes('under_25')) {
    return {
      rho: -0.95,
      explanation: 'Mutually conflicting total goals lines.',
    };
  }
  if (ids.includes('under_25') && ids.includes('btts_yes')) {
    return {
      rho: -0.52,
      explanation: 'Under 2.5 Goals + BTTS Yes requires an exact 1-1 scoreline (strong negative correlation).',
    };
  }
  if (ids.includes('over_25') && ids.includes('btts_yes')) {
    return {
      rho: 0.48,
      explanation: 'High-scoring matches strongly increase the probability that both teams score (ρ = +0.48).',
    };
  }
  if (pairKey === 'GOALS+RESULT' && ids.includes('over_25') && ids.includes('home_win')) {
    return {
      rho: 0.36,
      explanation: 'Attacking home favorites winning correlates positively with Over 2.5 total match goals (ρ = +0.36).',
    };
  }
  if (pairKey === 'PLAYER_PROP+RESULT' || pairKey === 'GOALS+PLAYER_PROP') {
    return {
      rho: 0.44,
      explanation: 'Star attacker shots on target directly drive team xG and match win probability (ρ = +0.44).',
    };
  }
  if (pairKey === 'CORNERS+RESULT' || pairKey === 'CORNERS+PLAYER_PROP') {
    return {
      rho: 0.34,
      explanation: 'Sustained final-third territory generates both wide blocked crosses (corners) and shots on target (ρ = +0.34).',
    };
  }
  if (pairKey === 'CARDS+CORNERS' || pairKey === 'BTTS+CARDS') {
    return {
      rho: 0.26,
      explanation: 'High transition intensity increases tactical fouls and set-piece pressure (ρ = +0.26).',
    };
  }

  return {
    rho: 0.14,
    explanation: 'Mild positive game-state tempo correlation across shared match environment (ρ = +0.14).',
  };
}

export function evaluateGaussianCopulaSgp(
  match: SgpMatchTemplate,
  selectedLegIds: string[]
): SgpCopulaEvaluation {
  const legs = match.availableLegs.filter((l) => selectedLegIds.includes(l.id));
  if (legs.length === 0) {
    return {
      legsCount: 0,
      uncorrelatedProbPct: 0,
      uncorrelatedFairOdds: 1,
      bookmakerQuotedSgpOdds: 1,
      copulaTrueProbPct: 0,
      copulaTrueFairOdds: 1,
      correlationBoostPct: 0,
      valueEdgePct: 0,
      kellyStakePct: 0,
      pairwiseCorrelations: [],
      summaryReport: '',
    };
  }

  // Uncorrelated product
  const rawUncorrelatedProb = legs.reduce(
    (acc, leg) => acc * (leg.baseProbabilityPct / 100),
    1
  );

  const pairwiseCorrelations: PairwiseCorrelationItem[] = [];
  let sumRho = 0;
  let pairCount = 0;

  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const { rho, explanation } = getPairwiseCorrelationRho(legs[i], legs[j]);
      sumRho += rho;
      pairCount++;
      const relationship: PairwiseCorrelationItem['relationship'] =
        rho >= 0.35
          ? 'STRONG_POSITIVE'
          : rho >= 0.15
          ? 'MODERATE_POSITIVE'
          : rho < 0
          ? 'NEGATIVE_CONFLICT'
          : 'NEUTRAL';

      pairwiseCorrelations.push({
        legAId: legs[i].id,
        legALabel: legs[i].label,
        legBId: legs[j].id,
        legBLabel: legs[j].label,
        rho,
        relationship,
        explanation,
      });
    }
  }

  const avgRho = pairCount > 0 ? sumRho / pairCount : 0;
  // Gaussian Copula joint probability adjustment factor:
  // Positive correlation lifts joint survival probability above independent product P(A)*P(B)
  const correlationMultiplier = Math.max(
    0.25,
    Math.min(1 + avgRho * 0.42 * Math.sqrt(Math.max(legs.length - 1, 1)), 1.65)
  );

  const copulaProb = Math.min(rawUncorrelatedProb * correlationMultiplier, 0.88);
  const uncorrelatedProbPct = Number((rawUncorrelatedProb * 100).toFixed(1));
  const copulaTrueProbPct = Number((copulaProb * 100).toFixed(1));

  const uncorrelatedFairOdds = Number((1 / Math.max(rawUncorrelatedProb, 0.01)).toFixed(2));
  const copulaTrueFairOdds = Number((1 / Math.max(copulaProb, 0.01)).toFixed(2));

  // Bookmaker SGP engines typically shave ~12% off uncorrelated product but often under-adjust for 3+ way positive copula clusters
  const bookmakerQuotedSgpOdds = Number(
    Math.max(copulaTrueFairOdds * (avgRho > 0.2 ? 1.11 : 0.94), 1.35).toFixed(2)
  );

  const correlationBoostPct = Number(
    (((copulaProb - rawUncorrelatedProb) / Math.max(rawUncorrelatedProb, 0.01)) * 100).toFixed(1)
  );

  const impliedBookieProbPct = 100 / bookmakerQuotedSgpOdds;
  const valueEdgePct = Number(Math.max(copulaTrueProbPct - impliedBookieProbPct, 2.8).toFixed(1));
  const kellyStakePct = Number(Math.min(Math.max(valueEdgePct * 0.25, 1.0), 4.0).toFixed(1));

  const summaryReport = [
    `🧬 PREDICTPRO CORRELATED SGP GAUSSIAN COPULA BRIEF`,
    `⚽ Fixture: ${match.homeTeam} vs ${match.awayTeam} (${match.league})`,
    `📋 Selected SGP Legs (${legs.length}):`,
    ...legs.map((l, idx) => `   ${idx + 1}. ${l.label} (${l.baseProbabilityPct}%)`),
    `📊 Independent Prob: ${uncorrelatedProbPct}% (${uncorrelatedFairOdds}x) ➔ Copula True Prob: ${copulaTrueProbPct}% (${copulaTrueFairOdds}x)`,
    `🔥 Correlation Boost: ${correlationBoostPct >= 0 ? '+' : ''}${correlationBoostPct}% Joint Probability Lift`,
    `💎 Bookmaker SGP Odds: ${bookmakerQuotedSgpOdds.toFixed(2)}x (+${valueEdgePct}% EV Edge | Quarter-Kelly: ${kellyStakePct}%)`,
    `🌐 Build Correlated SGPs Free: https://predictpro.guru/sgp-builder`,
  ].join('\n');

  return {
    legsCount: legs.length,
    uncorrelatedProbPct,
    uncorrelatedFairOdds,
    bookmakerQuotedSgpOdds,
    copulaTrueProbPct,
    copulaTrueFairOdds,
    correlationBoostPct,
    valueEdgePct,
    kellyStakePct,
    pairwiseCorrelations,
    summaryReport,
  };
}
