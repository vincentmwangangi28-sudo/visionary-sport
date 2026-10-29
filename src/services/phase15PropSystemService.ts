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

export const CURATED_CASHOUT_SCENARIOS: CuratedCashOutScenario[] = [
  {
    id: 'sportybet-5leg-ucl',
    bookmaker: 'SportyBet',
    title: '5-Leg UCL Acca (4/5 Won — Final Leg Tonight)',
    legsWonSummary: '4 of 5 legs settled WON (8.20x locked multiplier)',
    remainingMatch: 'Real Madrid vs Bayern Munich',
    homeTeam: 'Real Madrid',
    awayTeam: 'Bayern Munich',
    league: 'UEFA Champions League',
    remainingPick: 'Real Madrid to Win (1)',
    oppositeHedgePick: 'Bayern Munich or Draw (X2 Double Chance)',
    originalStakeUsd: 20,
    totalTicketOdds: 15.17,
    remainingUnplayedOdds: 1.85,
    bookieCashOutOfferUsd: 132,
    oppositeHedgeOdds: 2.04,
  },
  {
    id: 'betika-6leg-epl',
    bookmaker: 'Betika',
    title: '6-Leg EPL Rollover Slip (5/6 Won — Sunday Finale)',
    legsWonSummary: '5 of 6 legs settled WON (11.40x locked multiplier)',
    remainingMatch: 'Liverpool vs Arsenal',
    homeTeam: 'Liverpool',
    awayTeam: 'Arsenal',
    league: 'Premier League',
    remainingPick: 'Over 2.5 Total Goals',
    oppositeHedgePick: 'Under 2.5 Total Goals',
    originalStakeUsd: 15,
    totalTicketOdds: 19.61,
    remainingUnplayedOdds: 1.72,
    bookieCashOutOfferUsd: 141,
    oppositeHedgeOdds: 2.22,
  },
  {
    id: 'sportpesa-7leg-btts',
    bookmaker: 'SportPesa',
    title: '7-Leg Weekend BTTS Acca (6/7 Won)',
    legsWonSummary: '6 of 7 legs settled WON (18.50x locked multiplier)',
    remainingMatch: 'Inter Milan vs AC Milan',
    homeTeam: 'Inter Milan',
    awayTeam: 'AC Milan',
    league: 'Serie A',
    remainingPick: 'Both Teams to Score (Yes)',
    oppositeHedgePick: 'Both Teams to Score (No)',
    originalStakeUsd: 10,
    totalTicketOdds: 32.93,
    remainingUnplayedOdds: 1.78,
    bookieCashOutOfferUsd: 154,
    oppositeHedgeOdds: 2.12,
  },
  {
    id: '1xbet-4leg-underdog',
    bookmaker: '1xBet',
    title: '4-Leg High-Odds Value Slip (3/4 Won)',
    legsWonSummary: '3 of 4 legs settled WON (6.40x locked multiplier)',
    remainingMatch: 'Borussia Dortmund vs RB Leipzig',
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'RB Leipzig',
    league: 'Bundesliga',
    remainingPick: 'Borussia Dortmund -0.5 Asian Handicap',
    oppositeHedgePick: 'RB Leipzig +0.5 Asian Handicap (X2)',
    originalStakeUsd: 25,
    totalTicketOdds: 13.44,
    remainingUnplayedOdds: 2.10,
    bookieCashOutOfferUsd: 129,
    oppositeHedgeOdds: 1.82,
  },
];

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
    )} more risk-free profit than the bookmaker Cash-Out button by bypassing their ${bookieHaircutPct.toFixed(
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

export const REFEREE_DISCIPLINE_MATCHUPS: RefereeMatchupRow[] = [
  {
    id: 'ref-manzano-clasico',
    refereeName: 'Jesús Gil Manzano',
    league: 'LaLiga',
    match: 'Real Madrid vs Barcelona',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    kickoffTime: '20:00 UTC',
    yellowsPer90: 5.42,
    redsPer90: 0.31,
    foulsPerTackle: 0.44,
    penaltyRatePct: 41,
    awayBookingBiasPct: 56,
    homeAggressionIndex: 1.18,
    awayAggressionIndex: 1.24,
    isDerbyOrKnockout: true,
    bookieOddsOver35Cards: 1.36,
    bookieOddsOver45Cards: 1.74,
    bookieOddsOver55Cards: 2.28,
    bookieOddsRedCardYes: 3.45,
    topBookingCandidate: 'Gavi (Barcelona) to be Booked',
    topBookingCandidateOdds: 2.35,
  },
  {
    id: 'ref-taylor-london',
    refereeName: 'Anthony Taylor',
    league: 'Premier League',
    match: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    kickoffTime: '16:30 UTC',
    yellowsPer90: 4.68,
    redsPer90: 0.22,
    foulsPerTackle: 0.39,
    penaltyRatePct: 38,
    awayBookingBiasPct: 54,
    homeAggressionIndex: 1.12,
    awayAggressionIndex: 1.28,
    isDerbyOrKnockout: true,
    bookieOddsOver35Cards: 1.42,
    bookieOddsOver45Cards: 1.82,
    bookieOddsOver55Cards: 2.48,
    bookieOddsRedCardYes: 3.90,
    topBookingCandidate: 'Moisés Caicedo (Chelsea) to be Booked',
    topBookingCandidateOdds: 2.50,
  },
  {
    id: 'ref-massa-milano',
    refereeName: 'Davide Massa',
    league: 'Serie A',
    match: 'Inter Milan vs Juventus',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    kickoffTime: '19:45 UTC',
    yellowsPer90: 4.95,
    redsPer90: 0.25,
    foulsPerTackle: 0.42,
    penaltyRatePct: 36,
    awayBookingBiasPct: 58,
    homeAggressionIndex: 1.15,
    awayAggressionIndex: 1.20,
    isDerbyOrKnockout: true,
    bookieOddsOver35Cards: 1.40,
    bookieOddsOver45Cards: 1.78,
    bookieOddsOver55Cards: 2.38,
    bookieOddsRedCardYes: 3.75,
    topBookingCandidate: 'Nicolò Barella (Inter) to be Booked',
    topBookingCandidateOdds: 2.75,
  },
  {
    id: 'ref-turpin-ucl',
    refereeName: 'Clément Turpin',
    league: 'UEFA Champions League',
    match: 'Bayern Munich vs Paris Saint-Germain',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Paris Saint-Germain',
    kickoffTime: '20:00 UTC',
    yellowsPer90: 4.18,
    redsPer90: 0.24,
    foulsPerTackle: 0.37,
    penaltyRatePct: 44,
    awayBookingBiasPct: 53,
    homeAggressionIndex: 1.08,
    awayAggressionIndex: 1.19,
    isDerbyOrKnockout: true,
    bookieOddsOver35Cards: 1.52,
    bookieOddsOver45Cards: 1.98,
    bookieOddsOver55Cards: 2.72,
    bookieOddsRedCardYes: 4.10,
    topBookingCandidate: 'Achraf Hakimi (PSG) to be Booked',
    topBookingCandidateOdds: 2.90,
  },
  {
    id: 'ref-ndala-caf',
    refereeName: 'Jean-Jacques Ndala',
    league: 'CAF Champions League',
    match: 'Al Ahly vs Espérance Tunis',
    homeTeam: 'Al Ahly',
    awayTeam: 'Espérance Tunis',
    kickoffTime: '19:00 UTC',
    yellowsPer90: 4.82,
    redsPer90: 0.27,
    foulsPerTackle: 0.43,
    penaltyRatePct: 39,
    awayBookingBiasPct: 61,
    homeAggressionIndex: 1.16,
    awayAggressionIndex: 1.31,
    isDerbyOrKnockout: true,
    bookieOddsOver35Cards: 1.38,
    bookieOddsOver45Cards: 1.76,
    bookieOddsOver55Cards: 2.34,
    bookieOddsRedCardYes: 3.60,
    topBookingCandidate: 'Roger Aholou (Espérance) to be Booked',
    topBookingCandidateOdds: 2.40,
  },
  {
    id: 'ref-oliver-epl',
    refereeName: 'Michael Oliver',
    league: 'Premier League',
    match: 'Newcastle United vs Aston Villa',
    homeTeam: 'Newcastle United',
    awayTeam: 'Aston Villa',
    kickoffTime: '15:00 UTC',
    yellowsPer90: 4.35,
    redsPer90: 0.19,
    foulsPerTackle: 0.36,
    penaltyRatePct: 35,
    awayBookingBiasPct: 52,
    homeAggressionIndex: 1.19,
    awayAggressionIndex: 1.16,
    isDerbyOrKnockout: false,
    bookieOddsOver35Cards: 1.50,
    bookieOddsOver45Cards: 1.95,
    bookieOddsOver55Cards: 2.68,
    bookieOddsRedCardYes: 4.40,
    topBookingCandidate: 'Bruno Guimarães (Newcastle) to be Booked',
    topBookingCandidateOdds: 2.65,
  },
];

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

export const ELITE_PLAYER_PROP_DATABASE: ElitePlayerPropRow[] = [
  {
    id: 'haaland-mci',
    playerName: 'Erling Haaland',
    team: 'Manchester City',
    opponent: 'Tottenham Hotspur',
    league: 'Premier League',
    position: 'FW',
    sotPer90: 2.38,
    totalShotsPer90: 4.45,
    nonPenaltyXgPer90: 0.89,
    expectedMinutes: 90,
    opponentDefenseMultiplier: 1.18,
    isPenaltyTaker: true,
    isFreeKickTaker: false,
    bookieOdds1PlusSot: 1.18,
    bookieOdds2PlusSot: 1.68,
    bookieOddsAnytimeGoal: 1.65,
  },
  {
    id: 'mbappe-rma',
    playerName: 'Kylian Mbappé',
    team: 'Real Madrid',
    opponent: 'Sevilla',
    league: 'LaLiga',
    position: 'FW',
    sotPer90: 2.44,
    totalShotsPer90: 4.82,
    nonPenaltyXgPer90: 0.82,
    expectedMinutes: 89,
    opponentDefenseMultiplier: 1.14,
    isPenaltyTaker: true,
    isFreeKickTaker: true,
    bookieOdds1PlusSot: 1.16,
    bookieOdds2PlusSot: 1.64,
    bookieOddsAnytimeGoal: 1.72,
  },
  {
    id: 'salah-liv',
    playerName: 'Mohamed Salah',
    team: 'Liverpool',
    opponent: 'Newcastle United',
    league: 'Premier League',
    position: 'RW',
    sotPer90: 1.96,
    totalShotsPer90: 3.74,
    nonPenaltyXgPer90: 0.68,
    expectedMinutes: 90,
    opponentDefenseMultiplier: 1.12,
    isPenaltyTaker: true,
    isFreeKickTaker: false,
    bookieOdds1PlusSot: 1.26,
    bookieOdds2PlusSot: 1.95,
    bookieOddsAnytimeGoal: 1.98,
  },
  {
    id: 'palmer-che',
    playerName: 'Cole Palmer',
    team: 'Chelsea',
    opponent: 'Brighton',
    league: 'Premier League',
    position: 'AM',
    sotPer90: 1.84,
    totalShotsPer90: 3.62,
    nonPenaltyXgPer90: 0.56,
    expectedMinutes: 90,
    opponentDefenseMultiplier: 1.16,
    isPenaltyTaker: true,
    isFreeKickTaker: true,
    bookieOdds1PlusSot: 1.28,
    bookieOdds2PlusSot: 2.08,
    bookieOddsAnytimeGoal: 2.15,
  },
  {
    id: 'kane-bay',
    playerName: 'Harry Kane',
    team: 'Bayern Munich',
    opponent: 'Bayer Leverkusen',
    league: 'Bundesliga',
    position: 'FW',
    sotPer90: 2.26,
    totalShotsPer90: 4.18,
    nonPenaltyXgPer90: 0.84,
    expectedMinutes: 90,
    opponentDefenseMultiplier: 1.06,
    isPenaltyTaker: true,
    isFreeKickTaker: true,
    bookieOdds1PlusSot: 1.20,
    bookieOdds2PlusSot: 1.75,
    bookieOddsAnytimeGoal: 1.76,
  },
  {
    id: 'lautaro-int',
    playerName: 'Lautaro Martínez',
    team: 'Inter Milan',
    opponent: 'AC Milan',
    league: 'Serie A',
    position: 'FW',
    sotPer90: 1.78,
    totalShotsPer90: 3.55,
    nonPenaltyXgPer90: 0.64,
    expectedMinutes: 87,
    opponentDefenseMultiplier: 1.10,
    isPenaltyTaker: false,
    isFreeKickTaker: false,
    bookieOdds1PlusSot: 1.32,
    bookieOdds2PlusSot: 2.24,
    bookieOddsAnytimeGoal: 2.38,
  },
  {
    id: 'saka-ars',
    playerName: 'Bukayo Saka',
    team: 'Arsenal',
    opponent: 'West Ham United',
    league: 'Premier League',
    position: 'RW',
    sotPer90: 1.68,
    totalShotsPer90: 3.28,
    nonPenaltyXgPer90: 0.52,
    expectedMinutes: 88,
    opponentDefenseMultiplier: 1.22,
    isPenaltyTaker: true,
    isFreeKickTaker: false,
    bookieOdds1PlusSot: 1.30,
    bookieOdds2PlusSot: 2.12,
    bookieOddsAnytimeGoal: 2.20,
  },
  {
    id: 'yamal-bar',
    playerName: 'Lamine Yamal',
    team: 'Barcelona',
    opponent: 'Athletic Club',
    league: 'LaLiga',
    position: 'RW',
    sotPer90: 1.62,
    totalShotsPer90: 3.45,
    nonPenaltyXgPer90: 0.46,
    expectedMinutes: 86,
    opponentDefenseMultiplier: 1.14,
    isPenaltyTaker: false,
    isFreeKickTaker: false,
    bookieOdds1PlusSot: 1.36,
    bookieOdds2PlusSot: 2.38,
    bookieOddsAnytimeGoal: 2.75,
  },
];

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
