/**
 * Phase 14 Quantitative Syndicate, Rollover Ladder, Quarter-Ball Asian Handicap & Corner Pressure Engine
 * - Compound Rollover & Profit-Skimming Bankroll Ladder Simulator
 * - Quarter-Ball Asian Handicap & Goal Line Split Matrix (-0.25, -0.75, +0.25, +0.75, O/U 2.25, O/U 2.75)
 * - 17-Game Mega Jackpot Syndicate Pools & Private Mini-Leagues (Invite Codes + Share Split Calculator)
 * - Per-90 Corner Kick Tempo, First-Half Corner Pressure & Poisson Corner Handicap Scanner
 */

export type RolloverCurrency = 'USD' | 'KES' | 'NGN' | 'GHS' | 'ZAR' | 'GBP';

export interface RolloverStepConfig {
  day: number;
  odds: number;
  skimPercent: number; // 0 to 50% of profit skimmed off the top before next step
  fixtureLabel: string;
  league: string;
  selection: string;
  modelProbPct: number;
  bookingCode: string;
}

export interface ComputedRolloverRow {
  day: number;
  fixtureLabel: string;
  league: string;
  selection: string;
  odds: number;
  modelProbPct: number;
  bookingCode: string;
  startingStake: number;
  grossReturn: number;
  stepProfit: number;
  skimmedBankedThisStep: number;
  cumulativeBankedSafe: number;
  nextStepReinvestedStake: number;
  totalEquityIfWon: number;
  cumulativeHitProbabilityPct: number;
}

export interface RolloverLadderResult {
  initialStake: number;
  targetDays: number;
  skimPercent: number;
  rows: ComputedRolloverRow[];
  finalReinvestedPot: number;
  totalSkimmedSafe: number;
  grandTotalEquity: number;
  netRoiMultiple: number;
  overallSurvivalProbPct: number;
  bustDayFloorSaved: number; // What you still walk away with if you bust on the final day
}

export const DEFAULT_ROLLOVER_STEPS: RolloverStepConfig[] = [
  {
    day: 1,
    odds: 1.54,
    skimPercent: 20,
    fixtureLabel: 'Arsenal vs Brentford',
    league: 'Premier League',
    selection: 'Arsenal Win or Draw & Over 1.5 Goals',
    modelProbPct: 74.2,
    bookingCode: 'PP-RLV-D01',
  },
  {
    day: 2,
    odds: 1.58,
    skimPercent: 20,
    fixtureLabel: 'Bayern Munich vs Augsburg',
    league: 'Bundesliga',
    selection: 'Bayern Munich Over 1.5 Team Goals',
    modelProbPct: 72.8,
    bookingCode: 'PP-RLV-D02',
  },
  {
    day: 3,
    odds: 1.52,
    skimPercent: 20,
    fixtureLabel: 'Real Madrid vs Getafe',
    league: 'LaLiga',
    selection: 'Real Madrid to Win (1X2)',
    modelProbPct: 75.5,
    bookingCode: 'PP-RLV-D03',
  },
  {
    day: 4,
    odds: 1.62,
    skimPercent: 20,
    fixtureLabel: 'Inter Milan vs Empoli',
    league: 'Serie A',
    selection: 'Inter Milan -1.0 Asian Handicap',
    modelProbPct: 70.4,
    bookingCode: 'PP-RLV-D04',
  },
  {
    day: 5,
    odds: 1.55,
    skimPercent: 20,
    fixtureLabel: 'PSG vs Le Havre',
    league: 'Ligue 1',
    selection: 'Over 2.5 Total Goals',
    modelProbPct: 73.1,
    bookingCode: 'PP-RLV-D05',
  },
  {
    day: 6,
    odds: 1.60,
    skimPercent: 20,
    fixtureLabel: 'PSV Eindhoven vs Zwolle',
    league: 'Eredivisie',
    selection: 'PSV Win & Over 1.5 Goals',
    modelProbPct: 71.9,
    bookingCode: 'PP-RLV-D06',
  },
  {
    day: 7,
    odds: 1.56,
    skimPercent: 20,
    fixtureLabel: 'Sporting CP vs Gil Vicente',
    league: 'Primeira Liga',
    selection: 'Sporting CP First Half Over 0.5 Goals',
    modelProbPct: 72.6,
    bookingCode: 'PP-RLV-D07',
  },
  {
    day: 8,
    odds: 1.58,
    skimPercent: 20,
    fixtureLabel: 'Liverpool vs Fulham',
    league: 'Premier League',
    selection: 'Liverpool Over 1.5 Team Goals',
    modelProbPct: 71.5,
    bookingCode: 'PP-RLV-D08',
  },
  {
    day: 9,
    odds: 1.53,
    skimPercent: 20,
    fixtureLabel: 'Bayer Leverkusen vs Bochum',
    league: 'Bundesliga',
    selection: 'Leverkusen Win (1X2)',
    modelProbPct: 74.0,
    bookingCode: 'PP-RLV-D09',
  },
  {
    day: 10,
    odds: 1.61,
    skimPercent: 20,
    fixtureLabel: 'Barcelona vs Celta Vigo',
    league: 'LaLiga',
    selection: 'Barcelona Win & Over 1.5 Goals',
    modelProbPct: 70.8,
    bookingCode: 'PP-RLV-D10',
  },
];

export function computeRolloverLadder(
  initialStake: number,
  targetDays: number,
  skimPercent: number,
  customOddsOverride?: number,
  steps: RolloverStepConfig[] = DEFAULT_ROLLOVER_STEPS
): RolloverLadderResult {
  const safeInitial = Math.max(1, initialStake);
  const clampedDays = Math.max(2, Math.min(10, targetDays));
  const clampedSkim = Math.max(0, Math.min(60, skimPercent));

  let currentStake = safeInitial;
  let cumulativeBanked = 0;
  let cumulativeProb = 1;
  const rows: ComputedRolloverRow[] = [];

  for (let i = 0; i < clampedDays; i++) {
    const baseStep = steps[i % steps.length];
    const stepOdds =
      customOddsOverride && customOddsOverride >= 1.1
        ? Number(customOddsOverride.toFixed(2))
        : baseStep.odds;
    const stepProb =
      customOddsOverride && customOddsOverride >= 1.1
        ? Math.min(92, Math.max(35, Number(((1 / stepOdds) * 106).toFixed(1))))
        : baseStep.modelProbPct;

    cumulativeProb *= stepProb / 100;

    const grossReturn = Number((currentStake * stepOdds).toFixed(2));
    const stepProfit = Number((grossReturn - currentStake).toFixed(2));
    // On the final day, we don't need to reinvest; everything is realized
    const isFinalDay = i === clampedDays - 1;
    const skimmedThisStep = isFinalDay
      ? 0
      : Number(((stepProfit * clampedSkim) / 100).toFixed(2));

    cumulativeBanked = Number((cumulativeBanked + skimmedThisStep).toFixed(2));
    const nextStake = Number((grossReturn - skimmedThisStep).toFixed(2));
    const totalEquity = Number((nextStake + cumulativeBanked).toFixed(2));

    rows.push({
      day: i + 1,
      fixtureLabel: baseStep.fixtureLabel,
      league: baseStep.league,
      selection: baseStep.selection,
      odds: stepOdds,
      modelProbPct: stepProb,
      bookingCode: baseStep.bookingCode,
      startingStake: Number(currentStake.toFixed(2)),
      grossReturn,
      stepProfit,
      skimmedBankedThisStep: skimmedThisStep,
      cumulativeBankedSafe: cumulativeBanked,
      nextStepReinvestedStake: nextStake,
      totalEquityIfWon: totalEquity,
      cumulativeHitProbabilityPct: Number((cumulativeProb * 100).toFixed(1)),
    });

    currentStake = nextStake;
  }

  const lastRow = rows[rows.length - 1];
  const grandTotal = lastRow ? lastRow.totalEquityIfWon : safeInitial;

  return {
    initialStake: safeInitial,
    targetDays: clampedDays,
    skimPercent: clampedSkim,
    rows,
    finalReinvestedPot: lastRow ? lastRow.nextStepReinvestedStake : safeInitial,
    totalSkimmedSafe: cumulativeBanked,
    grandTotalEquity: grandTotal,
    netRoiMultiple: Number((grandTotal / safeInitial).toFixed(2)),
    overallSurvivalProbPct: lastRow ? lastRow.cumulativeHitProbabilityPct : 100,
    bustDayFloorSaved: cumulativeBanked,
  };
}

// ============================================================================
// 2. QUARTER-BALL ASIAN HANDICAP & GOAL LINE SPLIT MATRIX
// ============================================================================

export type AsianLineType =
  | 'AH -0.25'
  | 'AH -0.50'
  | 'AH -0.75'
  | 'AH -1.00'
  | 'AH -1.25'
  | 'AH +0.25'
  | 'AH +0.50'
  | 'AH +0.75'
  | 'Over 2.25 Goals'
  | 'Over 2.75 Goals'
  | 'Under 2.25 Goals'
  | 'Under 2.75 Goals';

export interface QuarterLineSplitBreakdown {
  line: AsianLineType;
  halfStakeA: number;
  legALabel: string;
  halfStakeB: number;
  legBLabel: string;
  odds: number;
  totalStake: number;
  scenarios: {
    condition: string;
    scoreExample: string;
    legAStatus: 'WIN' | 'PUSH' | 'LOSS';
    legBStatus: 'WIN' | 'PUSH' | 'LOSS';
    overallOutcome: 'FULL WIN' | 'HALF WIN' | 'PUSH (REFUND)' | 'HALF LOSS' | 'FULL LOSS';
    grossReturn: number;
    netProfit: number;
    roiPct: number;
  }[];
  equivalent1X2Comparison: {
    comparableMarket: string;
    bookie1X2Odds: number;
    effectiveAhReturnFactor: number;
    edgeExplanation: string;
  };
}

export function calculateAsianQuarterMatrix(
  line: AsianLineType,
  stake: number,
  odds: number,
  comparable1X2Odds: number = 1.92
): QuarterLineSplitBreakdown {
  const safeStake = Math.max(2, stake);
  const half = Number((safeStake / 2).toFixed(2));
  const safeOdds = Math.max(1.05, odds);

  const settleLeg = (status: 'WIN' | 'PUSH' | 'LOSS'): number => {
    if (status === 'WIN') return half * safeOdds;
    if (status === 'PUSH') return half;
    return 0;
  };

  const buildScenario = (
    condition: string,
    scoreExample: string,
    legAStatus: 'WIN' | 'PUSH' | 'LOSS',
    legBStatus: 'WIN' | 'PUSH' | 'LOSS',
    overallOutcome: 'FULL WIN' | 'HALF WIN' | 'PUSH (REFUND)' | 'HALF LOSS' | 'FULL LOSS'
  ) => {
    const gross = Number((settleLeg(legAStatus) + settleLeg(legBStatus)).toFixed(2));
    const net = Number((gross - safeStake).toFixed(2));
    const roi = Number(((net / safeStake) * 100).toFixed(1));
    return {
      condition,
      scoreExample,
      legAStatus,
      legBStatus,
      overallOutcome,
      grossReturn: gross,
      netProfit: net,
      roiPct: roi,
    };
  };

  switch (line) {
    case 'AH -0.25':
      return {
        line,
        halfStakeA: half,
        legALabel: 'AH 0.0 (Draw No Bet)',
        halfStakeB: half,
        legBLabel: 'AH -0.5 (Straight Win)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Selected Team Wins by 1+ Goals', '1-0, 2-1, 3-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Match Ends in a Draw', '0-0, 1-1, 2-2', 'PUSH', 'LOSS', 'HALF LOSS'),
          buildScenario('Selected Team Loses', '0-1, 1-2, 0-2', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Straight Home Win (1X2)',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: safeOdds,
          edgeExplanation:
            'AH -0.25 refunds 50% of your stake if the match ends level, cutting draw-variance losses in half compared to 1X2.',
        },
      };

    case 'AH -0.75':
      return {
        line,
        halfStakeA: half,
        legALabel: 'AH -0.5 (Win by 1+)',
        halfStakeB: half,
        legBLabel: 'AH -1.0 (Win by 2+ / Push on 1)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Selected Team Wins by 2+ Goals', '2-0, 3-1, 4-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Selected Team Wins by Exactly 1 Goal', '1-0, 2-1, 3-2', 'WIN', 'PUSH', 'HALF WIN'),
          buildScenario('Match Draws or Selected Team Loses', '1-1, 0-1, 1-2', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'European Handicap -1 (3-Way)',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: Number((((safeOdds + 1) / 2)).toFixed(2)),
          edgeExplanation:
            'Unlike 3-Way European -1 where a 1-0 win loses 100% of stake, AH -0.75 still pays a 50% profit on any 1-goal victory.',
        },
      };

    case 'AH -1.25':
      return {
        line,
        halfStakeA: half,
        legALabel: 'AH -1.0 (Push on 1-Goal Win)',
        halfStakeB: half,
        legBLabel: 'AH -1.5 (Win by 2+)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Selected Team Wins by 2+ Goals', '2-0, 3-1, 4-1', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Selected Team Wins by Exactly 1 Goal', '1-0, 2-1, 3-2', 'PUSH', 'LOSS', 'HALF LOSS'),
          buildScenario('Match Draws or Selected Team Loses', '0-0, 1-1, 0-1', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Asian Handicap -1.5',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: safeOdds,
          edgeExplanation:
            'Protects heavy favorites against late consolation goals: a narrow 2-1 win salvages 50% of your stake instead of a total bust.',
        },
      };

    case 'AH +0.25':
      return {
        line,
        halfStakeA: half,
        legALabel: 'AH 0.0 (Draw No Bet)',
        halfStakeB: half,
        legBLabel: 'AH +0.5 (Double Chance 1X/X2)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Underdog Wins Outright', '1-0, 2-1, 2-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Match Ends in a Draw', '0-0, 1-1, 2-2', 'PUSH', 'WIN', 'HALF WIN'),
          buildScenario('Underdog Loses', '0-1, 1-2, 0-2', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Double Chance (Win or Draw)',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: Number((((safeOdds + 1) / 2)).toFixed(2)),
          edgeExplanation:
            'AH +0.25 carries ~15-25% higher odds than standard Double Chance while still paying a half-win profit on any full-time draw.',
        },
      };

    case 'AH +0.75':
      return {
        line,
        halfStakeA: half,
        legALabel: 'AH +0.5 (Win or Draw)',
        halfStakeB: half,
        legBLabel: 'AH +1.0 (Refund on 1-Goal Loss)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Underdog Wins or Draws', '1-0, 0-0, 1-1', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Underdog Loses by Exactly 1 Goal', '0-1, 1-2, 2-3', 'LOSS', 'PUSH', 'HALF LOSS'),
          buildScenario('Underdog Loses by 2+ Goals', '0-2, 1-3, 0-3', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Double Chance (1X / X2)',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: safeOdds,
          edgeExplanation:
            'Ideal for resilient away underdogs: you win full payout on a draw or win, and still recover 50% of stake on a narrow 1-0 defeat.',
        },
      };

    case 'Over 2.25 Goals':
      return {
        line,
        halfStakeA: half,
        legALabel: 'Over 2.0 Goals (Push on 2)',
        halfStakeB: half,
        legBLabel: 'Over 2.5 Goals (Win on 3+)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('3 or More Total Goals Scored', '2-1, 2-2, 3-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Exactly 2 Total Goals Scored', '1-1, 2-0, 0-2', 'PUSH', 'LOSS', 'HALF LOSS'),
          buildScenario('0 or 1 Total Goal Scored', '0-0, 1-0, 0-1', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Standard Over 2.5 Goals',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: safeOdds,
          edgeExplanation:
            'Over 2.25 protects against the common 1-1 or 2-0 scoreline trap by refunding half your stake when the match lands on 2 goals.',
        },
      };

    case 'Over 2.75 Goals':
      return {
        line,
        halfStakeA: half,
        legALabel: 'Over 2.5 Goals (Win on 3+)',
        halfStakeB: half,
        legBLabel: 'Over 3.0 Goals (Push on 3)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('4 or More Total Goals Scored', '3-1, 2-2, 4-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Exactly 3 Total Goals Scored', '2-1, 3-0, 1-2', 'WIN', 'PUSH', 'HALF WIN'),
          buildScenario('2 or Fewer Total Goals Scored', '1-1, 1-0, 0-0', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Standard Over 2.5 Goals',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: Number((((safeOdds + 1) / 2)).toFixed(2)),
          edgeExplanation:
            'Boosts your payout on high-tempo fixtures (4+ goals) while still locking in a guaranteed half-win profit if the match stops at 3 goals.',
        },
      };

    case 'Under 2.25 Goals':
      return {
        line,
        halfStakeA: half,
        legALabel: 'Under 2.0 Goals (Push on 2)',
        halfStakeB: half,
        legBLabel: 'Under 2.5 Goals (Win on 0-2)',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('0 or 1 Total Goal Scored', '0-0, 1-0, 0-1', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Exactly 2 Total Goals Scored', '1-1, 2-0, 0-2', 'PUSH', 'WIN', 'HALF WIN'),
          buildScenario('3 or More Total Goals Scored', '2-1, 3-0, 2-2', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Standard Under 2.5 Goals',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: Number((((safeOdds + 1) / 2)).toFixed(2)),
          edgeExplanation:
            'Offers substantially higher odds than Under 2.5 Goals while still paying a half-win profit when the match finishes 1-1 or 2-0.',
        },
      };

    default:
      return {
        line,
        halfStakeA: half,
        legALabel: 'Primary Half Line',
        halfStakeB: half,
        legBLabel: 'Secondary Whole Line',
        odds: safeOdds,
        totalStake: safeStake,
        scenarios: [
          buildScenario('Line Cleared by 2+ Margin', '2-0, 3-0', 'WIN', 'WIN', 'FULL WIN'),
          buildScenario('Exact Whole-Goal Margin', '1-0, 2-1', 'WIN', 'PUSH', 'HALF WIN'),
          buildScenario('Line Missed', '0-0, 0-1', 'LOSS', 'LOSS', 'FULL LOSS'),
        ],
        equivalent1X2Comparison: {
          comparableMarket: 'Standard 3-Way Market',
          bookie1X2Odds: comparable1X2Odds,
          effectiveAhReturnFactor: safeOdds,
          edgeExplanation:
            'Asian lines remove the 3-way draw overround, lowering bookmaker margin from ~6.5% to ~2.4%.',
        },
      };
  }
}

// ============================================================================
// 3. JACKPOT SYNDICATE POOLS & PRIVATE MINI-LEAGUES
// ============================================================================

export interface SyndicatePool {
  id: string;
  title: string;
  bookmaker: 'SportPesa Mega 17' | 'Betika Grand 17' | 'SportyBet 15' | 'Mozzart Super 16';
  jackpotPrizeLabel: string;
  doublesCount: number; // Number of 2-way double combinations (2^N lines)
  totalLines: number;
  unitLineCost: number;
  currency: RolloverCurrency;
  totalTicketCost: number;
  fundedPct: number;
  membersCount: number;
  maxMembers: number;
  creatorHandle: string;
  creatorVerifiedYieldPct: number;
  inviteCode: string;
  bankerLegsPreview: {
    legNumber: number;
    fixture: string;
    pick: string;
    isDouble: boolean;
  }[];
}

export interface MiniLeagueStanding {
  rank: number;
  memberName: string;
  handle: string;
  correctPicks: number;
  totalPicks: number;
  clvBeatPct: number;
  netUnits30d: number;
  streak: string;
  isCurrentUser?: boolean;
}

export const CURATED_SYNDICATE_POOLS: SyndicatePool[] = [
  {
    id: 'syn-mega-17-alpha',
    title: 'Nairobi Quant 7-Doubles Mega 17 Pool',
    bookmaker: 'SportPesa Mega 17',
    jackpotPrizeLabel: 'KES 364,500,000',
    doublesCount: 7,
    totalLines: 128,
    unitLineCost: 99,
    currency: 'KES',
    totalTicketCost: 12672,
    fundedPct: 84,
    membersCount: 16,
    maxMembers: 20,
    creatorHandle: '@KinuthiaQuant',
    creatorVerifiedYieldPct: 18.4,
    inviteCode: 'PP-SYN-17A',
    bankerLegsPreview: [
      { legNumber: 1, fixture: 'Everton vs West Ham', pick: '1X (Double)', isDouble: true },
      { legNumber: 2, fixture: 'Brighton vs Aston Villa', pick: 'X2 (Double)', isDouble: true },
      { legNumber: 3, fixture: 'Newcastle vs Crystal Palace', pick: '1 (Banker)', isDouble: false },
      { legNumber: 4, fixture: 'Bournemouth vs Fulham', pick: '12 (Double)', isDouble: true },
      { legNumber: 5, fixture: 'Atalanta vs Fiorentina', pick: '1 (Banker)', isDouble: false },
    ],
  },
  {
    id: 'syn-betika-grand-beta',
    title: 'East Africa xG Syndicate — 6 Doubles + 1 Triple',
    bookmaker: 'Betika Grand 17',
    jackpotPrizeLabel: 'KES 200,000,000',
    doublesCount: 6,
    totalLines: 64,
    unitLineCost: 49,
    currency: 'KES',
    totalTicketCost: 3136,
    fundedPct: 92,
    membersCount: 11,
    maxMembers: 12,
    creatorHandle: '@MombasaSharp',
    creatorVerifiedYieldPct: 14.9,
    inviteCode: 'PP-SYN-B64',
    bankerLegsPreview: [
      { legNumber: 1, fixture: 'Villarreal vs Athletic Club', pick: '1X (Double)', isDouble: true },
      { legNumber: 2, fixture: 'Lazio vs Torino', pick: '1 (Banker)', isDouble: false },
      { legNumber: 3, fixture: 'Stuttgart vs Eintracht Frankfurt', pick: '12 (Double)', isDouble: true },
      { legNumber: 4, fixture: 'Lens vs Rennes', pick: '1X (Double)', isDouble: true },
      { legNumber: 5, fixture: 'Feyenoord vs Utrecht', pick: '1 (Banker)', isDouble: false },
    ],
  },
  {
    id: 'syn-sporty-15-lagos',
    title: 'Lagos Sharp Syndicate — 8-Doubles Permutation',
    bookmaker: 'SportyBet 15',
    jackpotPrizeLabel: 'NGN 150,000,000',
    doublesCount: 8,
    totalLines: 256,
    unitLineCost: 100,
    currency: 'NGN',
    totalTicketCost: 25600,
    fundedPct: 76,
    membersCount: 19,
    maxMembers: 25,
    creatorHandle: '@LekkiCLV',
    creatorVerifiedYieldPct: 21.2,
    inviteCode: 'PP-SYN-N256',
    bankerLegsPreview: [
      { legNumber: 1, fixture: 'Wolves vs Brentford', pick: '1X (Double)', isDouble: true },
      { legNumber: 2, fixture: 'Real Sociedad vs Real Betis', pick: '1X (Double)', isDouble: true },
      { legNumber: 3, fixture: 'AC Milan vs Lecce', pick: '1 (Banker)', isDouble: false },
      { legNumber: 4, fixture: 'Dortmund vs Hoffenheim', pick: '1 (Banker)', isDouble: false },
      { legNumber: 5, fixture: 'Monaco vs Nice', pick: '12 (Double)', isDouble: true },
    ],
  },
];

export const DEFAULT_MINI_LEAGUE_STANDINGS: MiniLeagueStanding[] = [
  {
    rank: 1,
    memberName: 'Vincent M.',
    handle: '@VincentQuant',
    correctPicks: 42,
    totalPicks: 55,
    clvBeatPct: 81.8,
    netUnits30d: 19.4,
    streak: 'W6',
  },
  {
    rank: 2,
    memberName: 'David O.',
    handle: '@NairobiEdge',
    correctPicks: 39,
    totalPicks: 54,
    clvBeatPct: 75.9,
    netUnits30d: 14.8,
    streak: 'W4',
  },
  {
    rank: 3,
    memberName: 'Chinedu K.',
    handle: '@LagosValue',
    correctPicks: 37,
    totalPicks: 52,
    clvBeatPct: 73.1,
    netUnits30d: 11.2,
    streak: 'W2',
  },
  {
    rank: 4,
    memberName: 'You (Active Member)',
    handle: '@PredictProUser',
    correctPicks: 35,
    totalPicks: 50,
    clvBeatPct: 70.0,
    netUnits30d: 9.6,
    streak: 'W3',
    isCurrentUser: true,
  },
  {
    rank: 5,
    memberName: 'Kwame A.',
    handle: '@AccraSharp',
    correctPicks: 33,
    totalPicks: 51,
    clvBeatPct: 66.7,
    netUnits30d: 6.4,
    streak: 'L1',
  },
];

export function calculateSyndicateShareSplit(
  doublesCount: number,
  triplesCount: number,
  unitCostPerLine: number,
  userContribution: number
) {
  const safeDoubles = Math.max(0, Math.min(12, doublesCount));
  const safeTriples = Math.max(0, Math.min(5, triplesCount));
  const totalLines = Math.pow(2, safeDoubles) * Math.pow(3, safeTriples);
  const totalPoolCost = Math.max(1, totalLines * Math.max(1, unitCostPerLine));
  const clampedContribution = Math.max(0, Math.min(totalPoolCost, userContribution));
  const ownershipSharePct = Number(((clampedContribution / totalPoolCost) * 100).toFixed(2));

  return {
    doublesCount: safeDoubles,
    triplesCount: safeTriples,
    totalLines,
    unitCostPerLine,
    totalPoolCost,
    userContribution: clampedContribution,
    ownershipSharePct,
    linesFundedEquivalent: Number((totalLines * (ownershipSharePct / 100)).toFixed(1)),
  };
}

// ============================================================================
// 4. CORNER KICK TEMPO & SET-PIECE PRESSURE SCANNER
// ============================================================================

export interface CornerMatchProjection {
  id: string;
  league: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  homeCornersForPer90: number;
  homeCornersAgainstPer90: number;
  awayCornersForPer90: number;
  awayCornersAgainstPer90: number;
  projectedTotalCorners: number;
  projectedFirstHalfCorners: number;
  projectedHomeCornerAdvantage: number;
  over85ProbPct: number;
  over95ProbPct: number;
  over105ProbPct: number;
  firstHalfOver45ProbPct: number;
  recommendedMarket: string;
  bookieOdds: number;
  fairOdds: number;
  edgePct: number;
  wingCrossIntensityIndex: number; // 0-100 scale
}

function poissonCdf(lambda: number, maxK: number): number {
  let sum = 0;
  let term = Math.exp(-lambda);
  sum += term;
  for (let k = 1; k <= maxK; k++) {
    term *= lambda / k;
    sum += term;
  }
  return Math.min(1, Math.max(0, sum));
}

export function computeCornerPoissonProbabilities(expectedTotalCorners: number, firstHalfRatio = 0.46) {
  const safeLambda = Math.max(3, Math.min(18, expectedTotalCorners));
  const fhLambda = safeLambda * firstHalfRatio;

  const over85 = Number(((1 - poissonCdf(safeLambda, 8)) * 100).toFixed(1));
  const over95 = Number(((1 - poissonCdf(safeLambda, 9)) * 100).toFixed(1));
  const over105 = Number(((1 - poissonCdf(safeLambda, 10)) * 100).toFixed(1));
  const over115 = Number(((1 - poissonCdf(safeLambda, 11)) * 100).toFixed(1));
  const fhOver45 = Number(((1 - poissonCdf(fhLambda, 4)) * 100).toFixed(1));

  return {
    expectedTotalCorners: Number(safeLambda.toFixed(2)),
    expectedFirstHalfCorners: Number(fhLambda.toFixed(2)),
    over85ProbPct: over85,
    over95ProbPct: over95,
    over105ProbPct: over105,
    over115ProbPct: over115,
    firstHalfOver45ProbPct: fhOver45,
  };
}

export const TODAY_CORNER_PRESSURE_FIXTURES: CornerMatchProjection[] = [
  {
    id: 'crn-1',
    league: 'Premier League',
    kickoff: '17:30 UTC',
    homeTeam: 'Manchester City',
    awayTeam: 'Tottenham',
    homeCornersForPer90: 7.8,
    homeCornersAgainstPer90: 3.1,
    awayCornersForPer90: 6.4,
    awayCornersAgainstPer90: 4.9,
    projectedTotalCorners: 11.6,
    projectedFirstHalfCorners: 5.4,
    projectedHomeCornerAdvantage: 2.3,
    over85ProbPct: 81.4,
    over95ProbPct: 71.2,
    over105ProbPct: 59.8,
    firstHalfOver45ProbPct: 63.1,
    recommendedMarket: 'Over 10.5 Total Corners',
    bookieOdds: 1.85,
    fairOdds: 1.67,
    edgePct: 10.8,
    wingCrossIntensityIndex: 94,
  },
  {
    id: 'crn-2',
    league: 'Premier League',
    kickoff: '15:00 UTC',
    homeTeam: 'Newcastle United',
    awayTeam: 'Brighton',
    homeCornersForPer90: 6.9,
    homeCornersAgainstPer90: 4.4,
    awayCornersForPer90: 6.2,
    awayCornersAgainstPer90: 4.6,
    projectedTotalCorners: 11.1,
    projectedFirstHalfCorners: 5.1,
    projectedHomeCornerAdvantage: 1.1,
    over85ProbPct: 77.9,
    over95ProbPct: 66.8,
    over105ProbPct: 54.9,
    firstHalfOver45ProbPct: 58.2,
    recommendedMarket: 'Over 9.5 Total Corners',
    bookieOdds: 1.66,
    fairOdds: 1.50,
    edgePct: 10.7,
    wingCrossIntensityIndex: 89,
  },
  {
    id: 'crn-3',
    league: 'Bundesliga',
    kickoff: '14:30 UTC',
    homeTeam: 'Bayern Munich',
    awayTeam: 'VfB Stuttgart',
    homeCornersForPer90: 7.5,
    homeCornersAgainstPer90: 2.8,
    awayCornersForPer90: 5.7,
    awayCornersAgainstPer90: 4.5,
    projectedTotalCorners: 10.8,
    projectedFirstHalfCorners: 5.0,
    projectedHomeCornerAdvantage: 2.9,
    over85ProbPct: 75.4,
    over95ProbPct: 63.9,
    over105ProbPct: 51.8,
    firstHalfOver45ProbPct: 56.4,
    recommendedMarket: 'Bayern -2.5 Corner Handicap',
    bookieOdds: 1.80,
    fairOdds: 1.62,
    edgePct: 11.1,
    wingCrossIntensityIndex: 91,
  },
  {
    id: 'crn-4',
    league: 'LaLiga',
    kickoff: '20:00 UTC',
    homeTeam: 'Real Madrid',
    awayTeam: 'Athletic Club',
    homeCornersForPer90: 6.6,
    homeCornersAgainstPer90: 3.7,
    awayCornersForPer90: 6.1,
    awayCornersAgainstPer90: 4.2,
    projectedTotalCorners: 10.5,
    projectedFirstHalfCorners: 4.9,
    projectedHomeCornerAdvantage: 1.2,
    over85ProbPct: 72.8,
    over95ProbPct: 60.9,
    over105ProbPct: 48.7,
    firstHalfOver45ProbPct: 54.5,
    recommendedMarket: '1st Half Over 4.5 Corners',
    bookieOdds: 1.95,
    fairOdds: 1.83,
    edgePct: 6.6,
    wingCrossIntensityIndex: 86,
  },
  {
    id: 'crn-5',
    league: 'Serie A',
    kickoff: '19:45 UTC',
    homeTeam: 'Inter Milan',
    awayTeam: 'Atalanta',
    homeCornersForPer90: 6.8,
    homeCornersAgainstPer90: 3.5,
    awayCornersForPer90: 5.9,
    awayCornersAgainstPer90: 4.3,
    projectedTotalCorners: 10.6,
    projectedFirstHalfCorners: 4.9,
    projectedHomeCornerAdvantage: 1.5,
    over85ProbPct: 73.7,
    over95ProbPct: 61.9,
    over105ProbPct: 49.8,
    firstHalfOver45ProbPct: 54.9,
    recommendedMarket: 'Over 9.5 Total Corners',
    bookieOdds: 1.74,
    fairOdds: 1.61,
    edgePct: 8.1,
    wingCrossIntensityIndex: 88,
  },
  {
    id: 'crn-6',
    league: 'Eredivisie',
    kickoff: '18:00 UTC',
    homeTeam: 'PSV Eindhoven',
    awayTeam: 'Feyenoord',
    homeCornersForPer90: 7.4,
    homeCornersAgainstPer90: 3.4,
    awayCornersForPer90: 6.7,
    awayCornersAgainstPer90: 3.9,
    projectedTotalCorners: 11.4,
    projectedFirstHalfCorners: 5.3,
    projectedHomeCornerAdvantage: 1.3,
    over85ProbPct: 80.1,
    over95ProbPct: 69.5,
    over105ProbPct: 57.8,
    firstHalfOver45ProbPct: 61.5,
    recommendedMarket: 'Over 10.5 Total Corners',
    bookieOdds: 1.88,
    fairOdds: 1.73,
    edgePct: 8.7,
    wingCrossIntensityIndex: 92,
  },
];
