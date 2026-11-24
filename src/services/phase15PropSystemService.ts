import { PHASE13_CURRENCIES, SupportedCurrency } from './phase13EdgeService';

export { PHASE13_CURRENCIES };
export type { SupportedCurrency };

// ============================================================================
// 1. CASH-OUT EQUITY & LIVE HEDGE AUDITOR ENGINE
// ============================================================================

export interface CashOutAuditInput {
  originalStake: number;
  totalTicketOdds: number;
  remainingUnplayedOdds: number; // Combined odds of remaining unplayed leg(s)
  bookieCashOutOffer: number;
  oppositeHedgeOdds: number;
  bookieMarginPct?: number; // Estimated vig on remaining leg(s), default 5.5%
}

export interface CashOutAuditResult {
  originalStake: number;
  totalTicketOdds: number;
  potentialMaxPayout: number;
  completedLegsMultiplier: number;
  impliedRemainingWinProbPct: number;
  trueFairRemainingWinProbPct: number;
  fairMathematicalEquity: number;
  bookieCashOutOffer: number;
  bookieHaircutAmount: number;
  bookieHaircutPct: number;
  cashOutNetProfit: number;
  diyHedgeStake: number;
  diyHedgeTotalRisk: number;
  diyHedgeGuaranteedProfit: number;
  diyAdvantageOverCashOut: number;
  evHoldRide: number;
  optimalRecommendation: 'DIY_HEDGE' | 'HOLD_RIDE' | 'ACCEPT_CASHOUT';
  recommendationReason: string;
}

export interface CuratedCashOutScenario {
  id: string;
  bookmaker: 'SportyBet' | 'Betika' | 'SportPesa' | '1xBet' | 'Bet365';
  title: string;
  legsWonSummary: string;
  remainingMatch: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  remainingPick: string;
  oppositeHedgePick: string;
  originalStakeUsd: number;
  totalTicketOdds: number;
  remainingUnplayedOdds: number;
  bookieCashOutOfferUsd: number;
  oppositeHedgeOdds: number;
}

export interface RealPhase15FixtureLike {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date?: string;
  home_odds?: number | null;
  draw_odds?: number | null;
  away_odds?: number | null;
  confidence?: number;
  home_xg?: number | null;
  away_xg?: number | null;
}

export const CURATED_CASHOUT_SCENARIOS: CuratedCashOutScenario[] = [];

export function buildCashOutScenariosFromPredictions(
  predictions: RealPhase15FixtureLike[]
): CuratedCashOutScenario[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  const bookmakers: CuratedCashOutScenario['bookmaker'][] = ['SportyBet', 'Betika', 'SportPesa', '1xBet'];
  return predictions.slice(0, 4).map((m, idx) => {
    const hOdd = Number(m.home_odds || 2.1);
    const dOdd = Number(m.draw_odds || 3.3);
    const aOdd = Number(m.away_odds || 3.2);
    const homeFav = hOdd <= aOdd;
    const remOdds = Number(Math.max(1.35, Math.min(hOdd, aOdd)).toFixed(2));
    const oppOdds = Number(
      Math.max(1.45, Math.min(2.6, 1 / (1 / dOdd + 1 / (homeFav ? aOdd : hOdd)) * 0.96)).toFixed(2)
    );
    const totalOdds = Number((8.5 * remOdds).toFixed(2));
    return {
      id: `cashout-${m.id || idx}`,
      bookmaker: bookmakers[idx % bookmakers.length],
      title: `${idx + 4}-Leg Slip (${idx + 3}/${idx + 4} Won · Final Leg)`,
      legsWonSummary: `${idx + 3} settled winning legs waiting on final fixture`,
      remainingMatch: `${m.home_team} vs ${m.away_team}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'League Match',
      remainingPick: homeFav ? `${m.home_team} to Win (1)` : `${m.away_team} to Win (2)`,
      oppositeHedgePick: homeFav
        ? `${m.away_team} or Draw (X2 Double Chance)`
        : `${m.home_team} or Draw (1X Double Chance)`,
      originalStakeUsd: 20,
      totalTicketOdds: totalOdds,
      remainingUnplayedOdds: remOdds,
      bookieCashOutOfferUsd: 132,
      oppositeHedgeOdds: oppOdds,
    };
  });
}

export function computeCashOutEquityAudit(input: CashOutAuditInput): CashOutAuditResult {
  const stake = Math.max(0.5, input.originalStake || 10);
  const totalOdds = Math.max(1.1, input.totalTicketOdds || 5);
  const remOdds = Math.max(1.05, input.remainingUnplayedOdds || 1.85);
  const cashOut = Math.max(0, input.bookieCashOutOffer || 0);
  const hedgeOdds = Math.max(1.05, input.oppositeHedgeOdds || 2.0);
  const marginPct = Math.max(0, Math.min(20, input.bookieMarginPct ?? 5.5));

  const potentialMaxPayout = stake * totalOdds;
  const completedLegsMultiplier = Math.max(1, totalOdds / remOdds);

  // Implied remaining win prob vs de-vigged fair probability
  const impliedRemProb = 1 / remOdds;
  const trueFairRemProb = Math.min(0.96, Math.max(0.03, impliedRemProb / (1 + marginPct / 100)));

  const fairMathematicalEquity = potentialMaxPayout * trueFairRemProb;
  const bookieHaircutAmount = Math.max(0, fairMathematicalEquity - cashOut);
  const bookieHaircutPct =
    fairMathematicalEquity > 0
      ? ((fairMathematicalEquity - cashOut) / fairMathematicalEquity) * 100
      : 0;

  const cashOutNetProfit = cashOut - stake;

  // Equal-profit DIY hedge on opposite outcome
  const diyHedgeStake = potentialMaxPayout / hedgeOdds;
  const diyHedgeTotalRisk = stake + diyHedgeStake;
  const diyHedgeGuaranteedProfit = potentialMaxPayout - diyHedgeTotalRisk;
  const diyAdvantageOverCashOut = diyHedgeGuaranteedProfit - cashOutNetProfit;

  const evHoldRide = fairMathematicalEquity - stake;

  let optimalRecommendation: 'DIY_HEDGE' | 'HOLD_RIDE' | 'ACCEPT_CASHOUT' = 'DIY_HEDGE';
  let recommendationReason = '';

  if (cashOutNetProfit > diyHedgeGuaranteedProfit && bookieHaircutPct < 3) {
    optimalRecommendation = 'ACCEPT_CASHOUT';
    recommendationReason =
      'Bookmaker Cash-Out offer exceeds manual opposite hedge return with minimal margin penalty (<3%).';
  } else if (diyAdvantageOverCashOut > 0 && diyHedgeGuaranteedProfit > 0) {
    optimalRecommendation = 'DIY_HEDGE';
    recommendationReason = `Manual DIY Hedge locks in +${diyAdvantageOverCashOut.toFixed(
      2
    )} more counter-hedged net return than the bookmaker Cash-Out button by bypassing their ${bookieHaircutPct.toFixed(
      1
    )}% haircut.`;
  } else {
    optimalRecommendation = 'HOLD_RIDE';
    recommendationReason = `Bookmaker is charging a steep ${bookieHaircutPct.toFixed(
      1
    )}% haircut. Letting the ticket ride carries the highest Expected Value (+${evHoldRide.toFixed(2)}).`;
  }

  return {
    originalStake: Number(stake.toFixed(2)),
    totalTicketOdds: Number(totalOdds.toFixed(2)),
    potentialMaxPayout: Number(potentialMaxPayout.toFixed(2)),
    completedLegsMultiplier: Number(completedLegsMultiplier.toFixed(2)),
    impliedRemainingWinProbPct: Number((impliedRemProb * 100).toFixed(1)),
    trueFairRemainingWinProbPct: Number((trueFairRemProb * 100).toFixed(1)),
    fairMathematicalEquity: Number(fairMathematicalEquity.toFixed(2)),
    bookieCashOutOffer: Number(cashOut.toFixed(2)),
    bookieHaircutAmount: Number(bookieHaircutAmount.toFixed(2)),
    bookieHaircutPct: Number(bookieHaircutPct.toFixed(1)),
    cashOutNetProfit: Number(cashOutNetProfit.toFixed(2)),
    diyHedgeStake: Number(diyHedgeStake.toFixed(2)),
    diyHedgeTotalRisk: Number(diyHedgeTotalRisk.toFixed(2)),
    diyHedgeGuaranteedProfit: Number(diyHedgeGuaranteedProfit.toFixed(2)),
    diyAdvantageOverCashOut: Number(diyAdvantageOverCashOut.toFixed(2)),
    evHoldRide: Number(evHoldRide.toFixed(2)),
    optimalRecommendation,
    recommendationReason,
  };
}

// ============================================================================
// 2. REFEREE DISCIPLINE, CARD & PENALTY POISSON MATRIX ENGINE
// ============================================================================

export interface RefereeCardPoissonInput {
  refereeYellowsPer90: number;
  refereeRedsPer90: number;
  homeAggressionIndex: number; // 0.70 - 1.45
  awayAggressionIndex: number; // 0.70 - 1.45
  isDerbyOrKnockout: boolean;
  bookieOddsOver35Cards: number;
  bookieOddsOver45Cards: number;
  bookieOddsOver55Cards: number;
  bookieOddsRedCardYes: number;
}

export interface CardMarketProjection {
  marketLabel: string;
  lineDescription: string;
  modelProbPct: number;
  fairOdds: number;
  bookieOdds: number;
  evEdgePct: number;
}

export interface RefereeCardPoissonResult {
  expectedYellows: number;
  expectedReds: number;
  expectedTotalCards: number;
  expectedBookingPoints: number; // Yellow=10, Red=25
  penaltyAwardProbPct: number;
  markets: CardMarketProjection[];
}

export interface RefereeMatchupRow {
  id: string;
  refereeName: string;
  league: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  yellowsPer90: number;
  redsPer90: number;
  foulsPerTackle: number;
  penaltyRatePct: number;
  awayBookingBiasPct: number;
  homeAggressionIndex: number;
  awayAggressionIndex: number;
  isDerbyOrKnockout: boolean;
  bookieOddsOver35Cards: number;
  bookieOddsOver45Cards: number;
  bookieOddsOver55Cards: number;
  bookieOddsRedCardYes: number;
  topBookingCandidate: string;
  topBookingCandidateOdds: number;
}

function poissonProbAtLeastK(lambda: number, k: number): number {
  if (lambda <= 0) return 0.01;
  let cumulativeUnder = 0;
  for (let i = 0; i < k; i++) {
    let fact = 1;
    for (let j = 2; j <= i; j++) fact *= j;
    cumulativeUnder += (Math.pow(lambda, i) * Math.exp(-lambda)) / fact;
  }
  return Math.max(0.02, Math.min(0.97, 1 - cumulativeUnder));
}

export function computeRefereeCardPoissonMatrix(
  input: RefereeCardPoissonInput
): RefereeCardPoissonResult {
  const baseYellows = Math.max(1.5, Math.min(8.5, input.refereeYellowsPer90 || 4.4));
  const baseReds = Math.max(0.05, Math.min(0.65, input.refereeRedsPer90 || 0.22));
  const homeAgg = Math.max(0.65, Math.min(1.55, input.homeAggressionIndex || 1.0));
  const awayAgg = Math.max(0.65, Math.min(1.55, input.awayAggressionIndex || 1.0));
  const derbyBoost = input.isDerbyOrKnockout ? 1.16 : 1.0;

  const combinedAggressionMultiplier = ((homeAgg + awayAgg) / 2) * derbyBoost;
  const expectedYellows = baseYellows * combinedAggressionMultiplier;
  const expectedReds = baseReds * combinedAggressionMultiplier;
  const expectedTotalCards = expectedYellows + expectedReds;
  const expectedBookingPoints = expectedYellows * 10 + expectedReds * 25;

  const pOver35 = poissonProbAtLeastK(expectedTotalCards, 4);
  const pOver45 = poissonProbAtLeastK(expectedTotalCards, 5);
  const pOver55 = poissonProbAtLeastK(expectedTotalCards, 6);
  const pRedCard = poissonProbAtLeastK(expectedReds, 1);

  const buildMarket = (
    marketLabel: string,
    lineDescription: string,
    prob: number,
    bookieOdds: number
  ): CardMarketProjection => {
    const fairOdds = 1 / prob;
    const evEdgePct = (bookieOdds * prob - 1) * 100;
    return {
      marketLabel,
      lineDescription,
      modelProbPct: Number((prob * 100).toFixed(1)),
      fairOdds: Number(fairOdds.toFixed(2)),
      bookieOdds: Number(bookieOdds.toFixed(2)),
      evEdgePct: Number(evEdgePct.toFixed(1)),
    };
  };

  const penaltyAwardProbPct = Math.min(
    62,
    Math.max(14, Number((expectedTotalCards * 6.4).toFixed(1)))
  );

  return {
    expectedYellows: Number(expectedYellows.toFixed(2)),
    expectedReds: Number(expectedReds.toFixed(2)),
    expectedTotalCards: Number(expectedTotalCards.toFixed(2)),
    expectedBookingPoints: Number(expectedBookingPoints.toFixed(1)),
    penaltyAwardProbPct,
    markets: [
      buildMarket(
        'Over 3.5 Total Cards',
        '4 or more cards shown in 90 mins',
        pOver35,
        input.bookieOddsOver35Cards || 1.48
      ),
      buildMarket(
        'Over 4.5 Total Cards',
        '5 or more cards shown in 90 mins',
        pOver45,
        input.bookieOddsOver45Cards || 1.88
      ),
      buildMarket(
        'Over 5.5 Total Cards',
        '6 or more cards shown in 90 mins',
        pOver55,
        input.bookieOddsOver55Cards || 2.55
      ),
      buildMarket(
        'Red Card Shown (Yes)',
        'At least 1 dismissal (2nd yellow or straight red)',
        pRedCard,
        input.bookieOddsRedCardYes || 3.90
      ),
    ],
  };
}

export const REFEREE_DISCIPLINE_MATCHUPS: RefereeMatchupRow[] = [];

export function buildRefereeDisciplineFromPredictions(
  predictions: RealPhase15FixtureLike[]
): RefereeMatchupRow[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  return predictions.slice(0, 8).map((m, idx) => {
    const hOdd = Number(m.home_odds || 2.3);
    const aOdd = Number(m.away_odds || 2.7);
    const closeTie = Math.abs(hOdd - aOdd) < 0.75;
    const kickoffTime = m.match_date
      ? new Date(m.match_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
      : 'Upcoming';
    return {
      id: `ref-disc-${m.id || idx}`,
      refereeName: `${m.league || 'League'} Match Referee`,
      league: m.league || 'League Match',
      match: `${m.home_team} vs ${m.away_team}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      kickoffTime,
      yellowsPer90: closeTie ? 4.82 : 4.28,
      redsPer90: closeTie ? 0.25 : 0.19,
      foulsPerTackle: 0.41,
      penaltyRatePct: closeTie ? 39 : 34,
      awayBookingBiasPct: 55,
      homeAggressionIndex: 1.12,
      awayAggressionIndex: closeTie ? 1.22 : 1.14,
      isDerbyOrKnockout: closeTie,
      bookieOddsOver35Cards: 1.42,
      bookieOddsOver45Cards: 1.84,
      bookieOddsOver55Cards: 2.52,
      bookieOddsRedCardYes: 3.85,
      topBookingCandidate: `${m.away_team} Defensive Midfielder to be Booked`,
      topBookingCandidateOdds: 2.45,
    };
  });
}

// ============================================================================
// 3. PLAYER SHOTS ON TARGET (SoT) & GOALSCORER PROP LAB ENGINE
// ============================================================================

export interface PlayerPropInput {
  sotPer90: number;
  nonPenaltyXgPer90: number;
  expectedMinutes: number;
  opponentDefenseMultiplier: number; // 0.70 - 1.45
  isPenaltyTaker: boolean;
  bookieOdds1PlusSot: number;
  bookieOdds2PlusSot: number;
  bookieOddsAnytimeGoal: number;
}

export interface PlayerPropResult {
  adjustedLambdaSot: number;
  adjustedLambdaGoal: number;
  prob1PlusSotPct: number;
  prob2PlusSotPct: number;
  prob3PlusSotPct: number;
  probAnytimeGoalPct: number;
  probBrace2PlusGoalsPct: number;
  fairOdds1PlusSot: number;
  fairOdds2PlusSot: number;
  fairOddsAnytimeGoal: number;
  ev1PlusSotPct: number;
  ev2PlusSotPct: number;
  evAnytimeGoalPct: number;
}

export interface ElitePlayerPropRow {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  league: string;
  position: 'FW' | 'AM' | 'RW' | 'LW';
  sotPer90: number;
  totalShotsPer90: number;
  nonPenaltyXgPer90: number;
  expectedMinutes: number;
  opponentDefenseMultiplier: number;
  isPenaltyTaker: boolean;
  isFreeKickTaker: boolean;
  bookieOdds1PlusSot: number;
  bookieOdds2PlusSot: number;
  bookieOddsAnytimeGoal: number;
}

export function computePlayerPropPoissonMatrix(input: PlayerPropInput): PlayerPropResult {
  const sot90 = Math.max(0.2, Math.min(4.5, input.sotPer90 || 1.6));
  const npxg90 = Math.max(0.05, Math.min(1.8, input.nonPenaltyXgPer90 || 0.55));
  const mins = Math.max(15, Math.min(95, input.expectedMinutes || 86));
  const oppMult = Math.max(0.65, Math.min(1.5, input.opponentDefenseMultiplier || 1.0));
  const penBoostXg = input.isPenaltyTaker ? 0.16 : 0;

  const minutesRatio = mins / 90;
  const adjustedLambdaSot = sot90 * minutesRatio * oppMult;
  const adjustedLambdaGoal = (npxg90 * oppMult + penBoostXg) * minutesRatio;

  const p1Sot = poissonProbAtLeastK(adjustedLambdaSot, 1);
  const p2Sot = poissonProbAtLeastK(adjustedLambdaSot, 2);
  const p3Sot = poissonProbAtLeastK(adjustedLambdaSot, 3);
  const pGoal1 = poissonProbAtLeastK(adjustedLambdaGoal, 1);
  const pGoal2 = poissonProbAtLeastK(adjustedLambdaGoal, 2);

  const fair1Sot = 1 / p1Sot;
  const fair2Sot = 1 / p2Sot;
  const fairGoal = 1 / pGoal1;

  const b1 = Math.max(1.05, input.bookieOdds1PlusSot || 1.3);
  const b2 = Math.max(1.05, input.bookieOdds2PlusSot || 2.1);
  const bG = Math.max(1.05, input.bookieOddsAnytimeGoal || 2.2);

  return {
    adjustedLambdaSot: Number(adjustedLambdaSot.toFixed(2)),
    adjustedLambdaGoal: Number(adjustedLambdaGoal.toFixed(2)),
    prob1PlusSotPct: Number((p1Sot * 100).toFixed(1)),
    prob2PlusSotPct: Number((p2Sot * 100).toFixed(1)),
    prob3PlusSotPct: Number((p3Sot * 100).toFixed(1)),
    probAnytimeGoalPct: Number((pGoal1 * 100).toFixed(1)),
    probBrace2PlusGoalsPct: Number((pGoal2 * 100).toFixed(1)),
    fairOdds1PlusSot: Number(fair1Sot.toFixed(2)),
    fairOdds2PlusSot: Number(fair2Sot.toFixed(2)),
    fairOddsAnytimeGoal: Number(fairGoal.toFixed(2)),
    ev1PlusSotPct: Number(((b1 * p1Sot - 1) * 100).toFixed(1)),
    ev2PlusSotPct: Number(((b2 * p2Sot - 1) * 100).toFixed(1)),
    evAnytimeGoalPct: Number(((bG * pGoal1 - 1) * 100).toFixed(1)),
  };
}

export const ELITE_PLAYER_PROP_DATABASE: ElitePlayerPropRow[] = [];

export function buildPlayerPropLabRowsFromPredictions(
  predictions: RealPhase15FixtureLike[]
): ElitePlayerPropRow[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  return predictions.slice(0, 8).map((m, idx) => {
    const hXg = Number(m.home_xg || 1.45);
    const aXg = Number(m.away_xg || 1.15);
    const pickHome = hXg >= aXg;
    const team = pickHome ? m.home_team : m.away_team;
    const opponent = pickHome ? m.away_team : m.home_team;
    const xg = pickHome ? hXg : aXg;
    const sotPer90 = Number(Math.max(1.2, Math.min(2.4, 1.15 + xg * 0.52)).toFixed(2));
    return {
      id: `prop-lab-${m.id || idx}`,
      playerName: `${team} #9 Primary Striker`,
      team,
      opponent,
      league: m.league || 'League Match',
      position: 'FW',
      sotPer90,
      totalShotsPer90: Number((sotPer90 * 2.05).toFixed(2)),
      nonPenaltyXgPer90: Number((xg * 0.42).toFixed(2)),
      expectedMinutes: 88,
      opponentDefenseMultiplier: Number(Math.max(0.95, Math.min(1.25, 0.92 + (pickHome ? aXg : hXg) * 0.14)).toFixed(2)),
      isPenaltyTaker: true,
      isFreeKickTaker: idx % 2 === 0,
      bookieOdds1PlusSot: 1.24,
      bookieOdds2PlusSot: 1.92,
      bookieOddsAnytimeGoal: 2.05,
    };
  });
}

// ============================================================================
// 4. SYSTEM BET & FAULT-TOLERANT PERMUTATION ENGINE
// ============================================================================

export type SystemBetPresetId =
  | 'trixie'
  | 'patent'
  | 'yankee'
  | 'lucky15'
  | 'canadian'
  | 'heinz'
  | 'round_robin_3_of_5'
  | 'round_robin_4_of_6';

export interface SystemBetPresetMeta {
  id: SystemBetPresetId;
  name: string;
  selectionsCount: number;
  totalBetsCount: number;
  foldSizes: number[]; // e.g., [2, 3] for Trixie, [1, 2, 3, 4] for Lucky 15
  minLegsToReturn: number;
  description: string;
}

export const SYSTEM_BET_PRESETS: SystemBetPresetMeta[] = [
  {
    id: 'trixie',
    name: 'Trixie (4 Bets)',
    selectionsCount: 3,
    totalBetsCount: 4,
    foldSizes: [2, 3],
    minLegsToReturn: 2,
    description: '3 Doubles + 1 Treble across 3 selections. 2 winning legs guarantee a return.',
  },
  {
    id: 'patent',
    name: 'Patent (7 Bets)',
    selectionsCount: 3,
    totalBetsCount: 7,
    foldSizes: [1, 2, 3],
    minLegsToReturn: 1,
    description: '3 Singles + 3 Doubles + 1 Treble across 3 selections. 1 winner pays a return.',
  },
  {
    id: 'yankee',
    name: 'Yankee (11 Bets)',
    selectionsCount: 4,
    totalBetsCount: 11,
    foldSizes: [2, 3, 4],
    minLegsToReturn: 2,
    description: '6 Doubles + 4 Trebles + 1 Four-Fold across 4 selections.',
  },
  {
    id: 'lucky15',
    name: 'Lucky 15 (15 Bets)',
    selectionsCount: 4,
    totalBetsCount: 15,
    foldSizes: [1, 2, 3, 4],
    minLegsToReturn: 1,
    description: '4 Singles + 6 Doubles + 4 Trebles + 1 Four-Fold across 4 selections.',
  },
  {
    id: 'canadian',
    name: 'Canadian / Super Yankee (26 Bets)',
    selectionsCount: 5,
    totalBetsCount: 26,
    foldSizes: [2, 3, 4, 5],
    minLegsToReturn: 2,
    description: '10 Doubles + 10 Trebles + 5 Four-Folds + 1 Five-Fold across 5 selections.',
  },
  {
    id: 'heinz',
    name: 'Heinz (57 Bets)',
    selectionsCount: 6,
    totalBetsCount: 57,
    foldSizes: [2, 3, 4, 5, 6],
    minLegsToReturn: 2,
    description: '15 Doubles + 20 Trebles + 15 Four-Folds + 6 Five-Folds + 1 Six-Fold across 6 picks.',
  },
  {
    id: 'round_robin_3_of_5',
    name: '3-from-5 Round Robin (10 Bets)',
    selectionsCount: 5,
    totalBetsCount: 10,
    foldSizes: [3],
    minLegsToReturn: 3,
    description: 'All 10 possible 3-Fold Treble combinations from 5 high-value selections.',
  },
  {
    id: 'round_robin_4_of_6',
    name: '4-from-6 Round Robin (15 Bets)',
    selectionsCount: 6,
    totalBetsCount: 15,
    foldSizes: [4],
    minLegsToReturn: 4,
    description: 'All 15 possible 4-Fold combinations from 6 selections.',
  },
];

export interface SystemLegItem {
  id: number;
  label: string;
  odds: number;
  status: 'won' | 'lost' | 'void';
}

export interface FoldBreakdownRow {
  foldSize: number;
  foldLabel: string;
  totalCombinations: number;
  winningCombinations: number;
  grossReturn: number;
}

export interface FaultToleranceRow {
  legsWonCount: number;
  legsLostCount: number;
  scenarioLabel: string;
  systemGrossReturn: number;
  systemNetProfit: number;
  systemRoiPct: number;
  straightAccaNetProfit: number;
}

export interface SystemBetSimulationResult {
  preset: SystemBetPresetMeta;
  unitStake: number;
  totalCombinations: number;
  totalOutlay: number;
  grossReturn: number;
  netProfit: number;
  roiPct: number;
  winningBetsCount: number;
  foldBreakdown: FoldBreakdownRow[];
  faultToleranceTable: FaultToleranceRow[];
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

const FOLD_NAMES: Record<number, string> = {
  1: 'Singles (1-Folds)',
  2: 'Doubles (2-Folds)',
  3: 'Trebles (3-Folds)',
  4: 'Four-Folds (4x)',
  5: 'Five-Folds (5x)',
  6: 'Six-Folds (6x)',
};

export function computeSystemBetPermutations(
  presetId: SystemBetPresetId,
  unitStake: number,
  legs: SystemLegItem[]
): SystemBetSimulationResult {
  const preset =
    SYSTEM_BET_PRESETS.find((p) => p.id === presetId) || SYSTEM_BET_PRESETS[2];
  const stake = Math.max(0.1, unitStake || 1);
  const activeLegs = legs.slice(0, preset.selectionsCount);

  let totalCombinations = 0;
  let winningBetsCount = 0;
  let grossReturn = 0;
  const foldBreakdown: FoldBreakdownRow[] = [];

  for (const k of preset.foldSizes) {
    const combos = getCombinations(activeLegs, k);
    let foldWinCount = 0;
    let foldGross = 0;

    for (const combo of combos) {
      totalCombinations++;
      const hasLost = combo.some((l) => l.status === 'lost');
      if (!hasLost) {
        foldWinCount++;
        winningBetsCount++;
        const mult = combo.reduce(
          (acc, l) => acc * (l.status === 'void' ? 1.0 : Math.max(1.01, l.odds)),
          1.0
        );
        foldGross += mult * stake;
      }
    }

    grossReturn += foldGross;
    foldBreakdown.push({
      foldSize: k,
      foldLabel: FOLD_NAMES[k] || `${k}-Folds`,
      totalCombinations: combos.length,
      winningCombinations: foldWinCount,
      grossReturn: Number(foldGross.toFixed(2)),
    });
  }

  const totalOutlay = totalCombinations * stake;
  const netProfit = grossReturn - totalOutlay;
  const roiPct = totalOutlay > 0 ? (netProfit / totalOutlay) * 100 : 0;

  // Compute Fault-Tolerance Table (0 lost legs, 1 lost leg, 2 lost legs, 3 lost legs)
  const faultToleranceTable: FaultToleranceRow[] = [];
  const n = activeLegs.length;
  const straightAccaMult = activeLegs.reduce((acc, l) => acc * Math.max(1.01, l.odds), 1);

  for (let lostCount = 0; lostCount <= Math.min(3, n - 1); lostCount++) {
    const wonCount = n - lostCount;
    // Simulate first `wonCount` legs winning and last `lostCount` legs losing
    const simulatedLegs = activeLegs.map((leg, idx) => ({
      ...leg,
      status: (idx < wonCount ? 'won' : 'lost') as 'won' | 'lost',
    }));

    let simGross = 0;
    for (const k of preset.foldSizes) {
      const combos = getCombinations(simulatedLegs, k);
      for (const combo of combos) {
        if (!combo.some((l) => l.status === 'lost')) {
          const mult = combo.reduce((acc, l) => acc * Math.max(1.01, l.odds), 1.0);
          simGross += mult * stake;
        }
      }
    }

    const simNet = simGross - totalOutlay;
    const simRoi = totalOutlay > 0 ? (simNet / totalOutlay) * 100 : 0;
    const straightNet =
      lostCount === 0 ? totalOutlay * straightAccaMult - totalOutlay : -totalOutlay;

    faultToleranceTable.push({
      legsWonCount: wonCount,
      legsLostCount: lostCount,
      scenarioLabel:
        lostCount === 0
          ? `All ${n}/${n} Legs Win (Clean Sweep)`
          : `${wonCount}/${n} Legs Win (${lostCount} Leg${lostCount > 1 ? 's' : ''} Misses)`,
      systemGrossReturn: Number(simGross.toFixed(2)),
      systemNetProfit: Number(simNet.toFixed(2)),
      systemRoiPct: Number(simRoi.toFixed(1)),
      straightAccaNetProfit: Number(straightNet.toFixed(2)),
    });
  }

  return {
    preset,
    unitStake: Number(stake.toFixed(2)),
    totalCombinations,
    totalOutlay: Number(totalOutlay.toFixed(2)),
    grossReturn: Number(grossReturn.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    roiPct: Number(roiPct.toFixed(1)),
    winningBetsCount,
    foldBreakdown,
    faultToleranceTable,
  };
}
