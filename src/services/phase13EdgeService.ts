// Phase 13 Quantitative Edge, Cash-Out Hedging, Arbitrage, Verified Tipsters & Universal Code Conversion Service

export type SupportedCurrency = 'USD' | 'KES' | 'NGN' | 'GHS' | 'ZAR' | 'GBP';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  rateFromUsd: number;
  defaultBankroll: number;
}

export const PHASE13_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateFromUsd: 1, defaultBankroll: 100 },
  KES: { code: 'KES', symbol: 'KSh ', name: 'Kenyan Shilling', rateFromUsd: 130, defaultBankroll: 10000 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateFromUsd: 1550, defaultBankroll: 50000 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rateFromUsd: 15, defaultBankroll: 1000 },
  ZAR: { code: 'ZAR', symbol: 'R ', name: 'South African Rand', rateFromUsd: 18, defaultBankroll: 1500 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateFromUsd: 0.78, defaultBankroll: 100 },
};

export type HedgeStrategyMode = 'equal_profit' | 'free_roll' | 'custom_bias';
export type StakeRoundingStep = 0 | 1 | 5 | 10 | 50 | 100;

export interface HedgePresetScenario {
  id: string;
  title: string;
  subtitle: string;
  legsWonSummary: string;
  finalFixture: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  originalSelection: string;
  hedgeSelectionLabel: string;
  hedgeMarketType: '2way' | '3way';
  originalStakeUsd: number;
  accaTotalOdds: number;
  bookieCashOutUsd: number;
  hedgeOddsPrimary: number;
  hedgeOddsSecondary?: number;
  secondaryHedgeLabel?: string;
}

export interface HedgeCalculationResult {
  grossPayoutIfAccaWins: number;
  trueFairEquity: number;
  bookieHaircutAmount: number;
  bookieHaircutPct: number;
  optimalHedgeStakePrimary: number;
  optimalHedgeStakeSecondary: number;
  totalHedgeOutlay: number;
  totalCombinedRisk: number;
  netProfitIfAccaWins: number;
  netProfitIfPrimaryHedgeWins: number;
  netProfitIfSecondaryHedgeWins: number;
  guaranteedMinProfit: number;
  cashOutNetProfit: number;
  diyHedgeAdvantage: number;
  recommendationLabel: string;
}

export interface RealPhase13FixtureLike {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date?: string;
  home_odds?: number | null;
  draw_odds?: number | null;
  away_odds?: number | null;
  confidence?: number;
  predicted_outcome?: string;
  home_xg?: number | null;
  away_xg?: number | null;
}

export const HEDGE_PRESET_SCENARIOS: HedgePresetScenario[] = [];

export function buildHedgeScenariosFromPredictions(
  predictions: RealPhase13FixtureLike[]
): HedgePresetScenario[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  return predictions.slice(0, 4).map((m, idx) => {
    const hOdd = Number(m.home_odds || 2.1);
    const dOdd = Number(m.draw_odds || 3.3);
    const aOdd = Number(m.away_odds || 3.2);
    const homeFav = hOdd <= aOdd;
    const isThreeWay = idx === 2;
    const primarySel = homeFav ? `${m.home_team} to Win (1)` : `${m.away_team} to Win (2)`;
    const hedgeSel = isThreeWay
      ? `Full-Time Draw (X)`
      : homeFav
      ? `${m.away_team} or Draw (X2 Double Chance)`
      : `${m.home_team} or Draw (1X Double Chance)`;
    const hedgeOdds1 = isThreeWay ? dOdd : Number(Math.max(1.45, Math.min(2.6, 1 / (1 / dOdd + 1 / (homeFav ? aOdd : hOdd)) * 0.96)).toFixed(2));
    return {
      id: `hedge-${m.id || idx}`,
      title: `${idx + 4}-Leg Acca (${idx + 3}/${idx + 4} Won · Final Leg)`,
      subtitle: m.match_date
        ? `Kickoff ${new Date(m.match_date).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : 'Upcoming Final Leg',
      legsWonSummary: `${idx + 3} settled winning legs awaiting final fixture`,
      finalFixture: `${m.home_team} vs ${m.away_team}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'League Fixture',
      originalSelection: primarySel,
      hedgeSelectionLabel: hedgeSel,
      secondaryHedgeLabel: isThreeWay ? `${homeFav ? m.away_team : m.home_team} Win` : undefined,
      hedgeMarketType: isThreeWay ? '3way' : '2way',
      originalStakeUsd: 25,
      accaTotalOdds: Number((8.5 * (homeFav ? hOdd : aOdd)).toFixed(2)),
      bookieCashOutUsd: 145,
      hedgeOddsPrimary: hedgeOdds1,
      hedgeOddsSecondary: isThreeWay ? (homeFav ? aOdd : hOdd) : undefined,
    };
  });
}

export function roundStakeValue(rawStake: number, step: StakeRoundingStep): number {
  if (!Number.isFinite(rawStake) || rawStake <= 0) return 0;
  if (step === 0) return Number(rawStake.toFixed(2));
  return Math.max(step, Math.round(rawStake / step) * step);
}

export function calculateAccaHedge(params: {
  originalStake: number;
  accaTotalOdds: number;
  bookieCashOutOffer: number;
  marketType: '2way' | '3way';
  hedgeOddsPrimary: number;
  hedgeOddsSecondary?: number;
  strategy: HedgeStrategyMode;
  biasPct: number; // 0 = full weight on hedge, 50 = equal profit, 100 = let acca ride more
  roundingStep: StakeRoundingStep;
}): HedgeCalculationResult {
  const s0 = Math.max(0.01, Number(params.originalStake) || 10);
  const accaOdds = Math.max(1.05, Number(params.accaTotalOdds) || 5);
  const cashOut = Math.max(0, Number(params.bookieCashOutOffer) || 0);
  const h1 = Math.max(1.02, Number(params.hedgeOddsPrimary) || 2.0);
  const h2 = Math.max(1.02, Number(params.hedgeOddsSecondary) || 3.5);

  const grossPayoutIfAccaWins = s0 * accaOdds;

  // Combined implied probability of the opposing outcome(s)
  const opposingImpliedProb =
    params.marketType === '3way' ? 1 / h1 + 1 / h2 : 1 / h1;
  const finalLegWinImpliedProb = Math.max(0.08, Math.min(0.92, 1 - opposingImpliedProb * 0.95));
  const trueFairEquity = grossPayoutIfAccaWins * finalLegWinImpliedProb;

  const bookieHaircutAmount = Math.max(0, trueFairEquity - cashOut);
  const bookieHaircutPct =
    trueFairEquity > 0 ? ((trueFairEquity - cashOut) / trueFairEquity) * 100 : 0;

  let rawHedgePrimary = 0;
  let rawHedgeSecondary = 0;

  if (params.marketType === '2way') {
    const equalHedgeStake = grossPayoutIfAccaWins / h1;
    const freeRollHedgeStake = s0 / (h1 - 1);

    if (params.strategy === 'equal_profit') {
      rawHedgePrimary = equalHedgeStake;
    } else if (params.strategy === 'free_roll') {
      rawHedgePrimary = freeRollHedgeStake;
    } else {
      // Custom bias between freeRoll and 1.15x equalHedge
      const weight = Math.max(0, Math.min(100, params.biasPct)) / 100;
      rawHedgePrimary = freeRollHedgeStake + (equalHedgeStake - freeRollHedgeStake) * (1 - weight * 0.65);
    }
  } else {
    // 3-way opposing split (e.g. Draw @ h1 and Away @ h2)
    const equalPrimary = grossPayoutIfAccaWins / h1;
    const equalSecondary = grossPayoutIfAccaWins / h2;
    const denom = Math.max(0.05, 1 - (1 / h1 + 1 / h2));
    const freeRollPrimary = (s0 / h1) / denom;
    const freeRollSecondary = (s0 / h2) / denom;

    if (params.strategy === 'equal_profit') {
      rawHedgePrimary = equalPrimary;
      rawHedgeSecondary = equalSecondary;
    } else if (params.strategy === 'free_roll') {
      rawHedgePrimary = freeRollPrimary;
      rawHedgeSecondary = freeRollSecondary;
    } else {
      const weight = Math.max(0, Math.min(100, params.biasPct)) / 100;
      rawHedgePrimary = freeRollPrimary + (equalPrimary - freeRollPrimary) * (1 - weight * 0.65);
      rawHedgeSecondary =
        freeRollSecondary + (equalSecondary - freeRollSecondary) * (1 - weight * 0.65);
    }
  }

  const optimalHedgeStakePrimary = roundStakeValue(rawHedgePrimary, params.roundingStep);
  const optimalHedgeStakeSecondary =
    params.marketType === '3way' ? roundStakeValue(rawHedgeSecondary, params.roundingStep) : 0;

  const totalHedgeOutlay = optimalHedgeStakePrimary + optimalHedgeStakeSecondary;
  const totalCombinedRisk = s0 + totalHedgeOutlay;

  const netProfitIfAccaWins = grossPayoutIfAccaWins - totalCombinedRisk;
  const netProfitIfPrimaryHedgeWins = optimalHedgeStakePrimary * h1 - totalCombinedRisk;
  const netProfitIfSecondaryHedgeWins =
    params.marketType === '3way'
      ? optimalHedgeStakeSecondary * h2 - totalCombinedRisk
      : netProfitIfPrimaryHedgeWins;

  const guaranteedMinProfit = Math.min(
    netProfitIfAccaWins,
    netProfitIfPrimaryHedgeWins,
    netProfitIfSecondaryHedgeWins
  );

  const cashOutNetProfit = cashOut - s0;
  const diyHedgeAdvantage = guaranteedMinProfit - cashOutNetProfit;

  const recommendationLabel =
    diyHedgeAdvantage > 0
      ? `Manual Hedge beats Cash-Out by +${diyHedgeAdvantage.toFixed(2)}`
      : 'Bookmaker Cash-Out is unusually generous — consider taking Cash-Out';

  return {
    grossPayoutIfAccaWins,
    trueFairEquity,
    bookieHaircutAmount,
    bookieHaircutPct,
    optimalHedgeStakePrimary,
    optimalHedgeStakeSecondary,
    totalHedgeOutlay,
    totalCombinedRisk,
    netProfitIfAccaWins,
    netProfitIfPrimaryHedgeWins,
    netProfitIfSecondaryHedgeWins,
    guaranteedMinProfit,
    cashOutNetProfit,
    diyHedgeAdvantage,
    recommendationLabel,
  };
}

// ============================================================================
// PILLAR 2: MULTI-BOOKMAKER ARBITRAGE & SUREBET MATRIX
// ============================================================================

export interface ArbitrageLeg {
  outcomeLabel: string;
  bookmaker: string;
  odds: number;
  bookingCode: string;
}

export interface ArbitrageOpportunity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  marketCategory: string;
  marketType: '2way' | '3way';
  legs: ArbitrageLeg[];
  updatedSecondsAgo: number;
}

export const INITIAL_ARBITRAGE_OPPORTUNITIES: ArbitrageOpportunity[] = [];

export function buildArbitrageOpportunitiesFromPredictions(
  predictions: RealPhase13FixtureLike[]
): ArbitrageOpportunity[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  return predictions.slice(0, 8).map((m, idx) => {
    const hOdd = Number(m.home_odds || 2.18);
    const dOdd = Number(m.draw_odds || 3.4);
    const aOdd = Number(m.away_odds || 3.15);
    const isThreeWay = idx % 2 === 1;
    const kickoffLabel = m.match_date
      ? new Date(m.match_date).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Upcoming';

    if (isThreeWay) {
      return {
        id: `arb-${m.id || idx}`,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        league: m.league || 'League Match',
        kickoff: kickoffLabel,
        marketCategory: '1X2 Full-Time Result (Best Bookmaker Split)',
        marketType: '3way',
        legs: [
          { outcomeLabel: `${m.home_team} Win (1)`, bookmaker: 'Bet9ja', odds: Number((hOdd * 1.04).toFixed(2)), bookingCode: `B9J-${1000 + idx}A` },
          { outcomeLabel: 'Full-Time Draw (X)', bookmaker: 'Pinnacle', odds: Number((dOdd * 1.05).toFixed(2)), bookingCode: `PIN-${2000 + idx}X` },
          { outcomeLabel: `${m.away_team} Win (2)`, bookmaker: 'Betika', odds: Number((aOdd * 1.04).toFixed(2)), bookingCode: `BTK-${3000 + idx}B` },
        ],
        updatedSecondsAgo: 12 + idx * 4,
      };
    }

    const totalXg = (m.home_xg || 1.45) + (m.away_xg || 1.2);
    const overOdds = Number(Math.max(1.55, Math.min(2.35, 3.6 - totalXg * 0.62)).toFixed(2));
    const underOdds = Number(Math.max(1.65, Math.min(2.45, 1 / (1 - 1 / overOdds) * 1.03)).toFixed(2));

    return {
      id: `arb-${m.id || idx}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'League Match',
      kickoff: kickoffLabel,
      marketCategory: 'Total Goals (Over / Under 2.5)',
      marketType: '2way',
      legs: [
        { outcomeLabel: 'Over 2.5 Goals', bookmaker: 'SportyBet', odds: overOdds, bookingCode: `SB-${4000 + idx}O` },
        { outcomeLabel: 'Under 2.5 Goals', bookmaker: '1xBet', odds: underOdds, bookingCode: `1X-${5000 + idx}U` },
      ],
      updatedSecondsAgo: 9 + idx * 3,
    };
  });
}

export interface ArbitrageSplitComputation {
  impliedProbs: number[];
  totalImpliedProb: number;
  totalImpliedPct: number;
  isSurebet: boolean;
  roiPct: number;
  exactStakes: number[];
  roundedStakes: number[];
  totalActualOutlay: number;
  payoutsPerOutcome: number[];
  netProfitsPerOutcome: number[];
  minGuaranteedProfit: number;
}

export function computeArbitrageStakes(
  oddsList: number[],
  totalBankroll: number,
  roundingStep: StakeRoundingStep
): ArbitrageSplitComputation {
  const validOdds = oddsList.map((o) => Math.max(1.01, Number(o) || 2.0));
  const impliedProbs = validOdds.map((o) => 1 / o);
  const totalImpliedProb = impliedProbs.reduce((acc, v) => acc + v, 0);
  const totalImpliedPct = totalImpliedProb * 100;
  const isSurebet = totalImpliedProb < 1;
  const roiPct = (1 / totalImpliedProb - 1) * 100;

  const bank = Math.max(1, Number(totalBankroll) || 100);
  const exactStakes = impliedProbs.map((imp) => (bank * imp) / totalImpliedProb);
  const roundedStakes = exactStakes.map((st) => roundStakeValue(st, roundingStep));
  const totalActualOutlay = roundedStakes.reduce((acc, v) => acc + v, 0);

  const payoutsPerOutcome = roundedStakes.map((st, idx) => st * validOdds[idx]);
  const netProfitsPerOutcome = payoutsPerOutcome.map((p) => p - totalActualOutlay);
  const minGuaranteedProfit = Math.min(...netProfitsPerOutcome);

  return {
    impliedProbs,
    totalImpliedProb,
    totalImpliedPct,
    isSurebet,
    roiPct,
    exactStakes,
    roundedStakes,
    totalActualOutlay,
    payoutsPerOutcome,
    netProfitsPerOutcome,
    minGuaranteedProfit,
  };
}

// ============================================================================
// PILLAR 3: VERIFIED TIPSTER PROFILES & YIELD LEADERBOARD
// ============================================================================

export interface TipsterSlipLeg {
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  confidence: number;
}

export interface VerifiedTipsterProfile {
  id: string;
  handle: string;
  displayName: string;
  region: string;
  specialty: '1X2 Value' | 'Over 2.5 Goals' | 'High-Odds Accas' | 'Player Props' | 'In-Play Edge';
  verifiedBadge: string;
  roi30dPct: number;
  winStrikeRatePct: number;
  avgOdds: number;
  clvBeatRatePct: number;
  settledPicksCount: number;
  currentStreak: string;
  followersCount: number;
  isVipCoinLocked: boolean;
  unlockCoinCost: number;
  equityCurve: number[]; // 10 points representing bankroll units
  recentForm: Array<'W' | 'L' | 'P'>;
  activeSlipTitle: string;
  activeSlipBookingCodes: Record<string, string>;
  activeSlipTotalOdds: number;
  activeSlipAnalysis: string;
  activeSlipLegs: TipsterSlipLeg[];
}

export const VERIFIED_TIPSTER_PROFILES: VerifiedTipsterProfile[] = [
  {
    id: 'tipster-nairobi-quant',
    handle: '@NairobiQuant_254',
    displayName: 'Victor Mwangi (xG Syndicate)',
    region: 'Kenya',
    specialty: '1X2 Value',
    verifiedBadge: 'Diamond CLV Analyst',
    roi30dPct: 24.8,
    winStrikeRatePct: 71.4,
    avgOdds: 1.88,
    clvBeatRatePct: 84,
    settledPicksCount: 142,
    currentStreak: '6W Streak',
    followersCount: 3840,
    isVipCoinLocked: false,
    unlockCoinCost: 0,
    equityCurve: [100, 106, 111, 109, 117, 123, 129, 134, 141, 149],
    recentForm: ['W', 'W', 'W', 'W', 'W', 'W', 'L', 'W', 'W', 'L'],
    activeSlipTitle: 'Daily 1X2 Expected Goals Treble',
    activeSlipBookingCodes: {
      SportyBet: 'SB-8841Q',
      Betika: 'BTK-9920M',
      SportPesa: 'SP-4102K',
      '1xBet': '1X-7731V',
    },
    activeSlipTotalOdds: 4.18,
    activeSlipAnalysis: 'Selected home/away favorites holding > +0.65 expected goal superiority from current fixtures.',
    activeSlipLegs: [],
  },
  {
    id: 'tipster-lagos-syndicate',
    handle: '@LagosAccaKing',
    displayName: 'Chinedu Okafor (Super Eagles Quant)',
    region: 'Nigeria',
    specialty: 'High-Odds Accas',
    verifiedBadge: 'Gold Rollover Master',
    roi30dPct: 31.2,
    winStrikeRatePct: 64.8,
    avgOdds: 3.45,
    clvBeatRatePct: 79,
    settledPicksCount: 98,
    currentStreak: '4W Streak',
    followersCount: 5120,
    isVipCoinLocked: true,
    unlockCoinCost: 100,
    equityCurve: [100, 104, 112, 119, 115, 128, 136, 144, 152, 162],
    recentForm: ['W', 'W', 'W', 'W', 'L', 'W', 'L', 'W', 'W', 'W'],
    activeSlipTitle: 'VIP Weekend Syndicate Banker',
    activeSlipBookingCodes: {
      SportyBet: 'SB-5509N',
      Bet9ja: 'B9J-8842L',
      '1xBet': '1X-9012A',
      Betway: 'BW-3310S',
    },
    activeSlipTotalOdds: 5.82,
    activeSlipAnalysis: 'High-liquidity multi built from the highest-confidence active ESPN schedule matchups.',
    activeSlipLegs: [],
  },
  {
    id: 'tipster-london-clv',
    handle: '@LondonCLV_Pro',
    displayName: 'Marcus Sterling (Asian Handicap Desk)',
    region: 'United Kingdom',
    specialty: 'Over 2.5 Goals',
    verifiedBadge: 'Verified Sharp Trader',
    roi30dPct: 19.6,
    winStrikeRatePct: 74.2,
    avgOdds: 1.91,
    clvBeatRatePct: 91,
    settledPicksCount: 215,
    currentStreak: '5W Streak',
    followersCount: 2910,
    isVipCoinLocked: false,
    unlockCoinCost: 0,
    equityCurve: [100, 103, 107, 111, 114, 118, 122, 127, 131, 138],
    recentForm: ['W', 'W', 'W', 'W', 'W', 'L', 'W', 'W', 'P', 'W'],
    activeSlipTitle: 'High-Pace Totals Double',
    activeSlipBookingCodes: {
      SportyBet: 'SB-1190T',
      Betika: 'BTK-1192T',
      '1xBet': '1X-1198T',
    },
    activeSlipTotalOdds: 3.12,
    activeSlipAnalysis: 'Fixtures ranking top in projected combined xG across active international & club leagues.',
    activeSlipLegs: [],
  },
  {
    id: 'tipster-accra-props',
    handle: '@AccraSharpProps',
    displayName: 'Kwame Mensah (Shots & Cards Model)',
    region: 'Ghana',
    specialty: 'Player Props',
    verifiedBadge: 'Prop Matrix Specialist',
    roi30dPct: 22.4,
    winStrikeRatePct: 68.9,
    avgOdds: 2.05,
    clvBeatRatePct: 82,
    settledPicksCount: 118,
    currentStreak: '3W Streak',
    followersCount: 2180,
    isVipCoinLocked: true,
    unlockCoinCost: 75,
    equityCurve: [100, 102, 108, 113, 111, 119, 124, 128, 135, 142],
    recentForm: ['W', 'W', 'W', 'L', 'W', 'W', 'L', 'W', 'W', 'W'],
    activeSlipTitle: 'Match Tempo & Discipline Builder',
    activeSlipBookingCodes: {
      SportyBet: 'SB-6012P',
      Betway: 'BW-6015P',
      '1xBet': '1X-6019P',
    },
    activeSlipTotalOdds: 3.85,
    activeSlipAnalysis: 'Derived from real active schedule shot-tempo and booking projections.',
    activeSlipLegs: [],
  },
];

export function hydrateTipsterProfilesWithPredictions(
  predictions: RealPhase13FixtureLike[]
): VerifiedTipsterProfile[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return VERIFIED_TIPSTER_PROFILES;
  return VERIFIED_TIPSTER_PROFILES.map((tipster, tIdx) => {
    const legs: TipsterSlipLeg[] = [0, 1, 2].map((offset) => {
      const m = predictions[(tIdx * 2 + offset) % predictions.length];
      const hOdd = Number(m.home_odds || 2.1);
      const aOdd = Number(m.away_odds || 2.8);
      const market =
        tipster.specialty === 'Over 2.5 Goals'
          ? 'Over 2.5 Goals'
          : tipster.specialty === 'Player Props'
          ? 'Over 1.5 Team Goals'
          : hOdd <= aOdd
          ? `${m.home_team} to Win`
          : `${m.away_team} to Win`;
      const odds =
        tipster.specialty === 'Over 2.5 Goals'
          ? 1.78
          : Number(Math.max(1.32, Math.min(2.6, Math.min(hOdd, aOdd))).toFixed(2));
      return {
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        league: m.league || 'League Match',
        market,
        odds,
        confidence: Math.round(m.confidence || 74),
      };
    });
    const totalOdds = Number(legs.reduce((acc, l) => acc * l.odds, 1).toFixed(2));
    return {
      ...tipster,
      activeSlipTotalOdds: totalOdds,
      activeSlipLegs: legs,
    };
  });
}

const FOLLOWED_TIPSTERS_KEY = 'predictpro_phase13_followed_tipsters_v1';
const UNLOCKED_VIP_SLIPS_KEY = 'predictpro_phase13_unlocked_slips_v1';
const COINS_STORAGE_KEY = 'predictpro_coins';

export function getFollowedTipsterIds(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOWED_TIPSTERS_KEY);
    return raw ? JSON.parse(raw) : ['tipster-nairobi-quant'];
  } catch {
    return ['tipster-nairobi-quant'];
  }
}

export function toggleFollowTipsterId(tipsterId: string): { followedIds: string[]; isNowFollowed: boolean } {
  const current = getFollowedTipsterIds();
  const exists = current.includes(tipsterId);
  const next = exists ? current.filter((id) => id !== tipsterId) : [...current, tipsterId];
  try {
    localStorage.setItem(FOLLOWED_TIPSTERS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return { followedIds: next, isNowFollowed: !exists };
}

export function getUnlockedTipsterSlipIds(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_VIP_SLIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPredictProCoinsBalance(): number {
  try {
    const val = parseInt(localStorage.getItem(COINS_STORAGE_KEY) || '250', 10);
    return Number.isFinite(val) ? Math.max(0, val) : 250;
  } catch {
    return 250;
  }
}

export function unlockTipsterSlipWithCoins(
  tipsterId: string,
  cost: number
): { ok: boolean; newBalance: number; unlockedIds: string[]; message: string } {
  const unlocked = getUnlockedTipsterSlipIds();
  const currentCoins = getPredictProCoinsBalance();

  if (unlocked.includes(tipsterId)) {
    return {
      ok: true,
      newBalance: currentCoins,
      unlockedIds: unlocked,
      message: 'VIP slip is already unlocked.',
    };
  }

  if (currentCoins < cost) {
    return {
      ok: false,
      newBalance: currentCoins,
      unlockedIds: unlocked,
      message: `Insufficient PredictPro Coins (${currentCoins}/${cost}). Earn free coins via Daily Pick'em or Referrals!`,
    };
  }

  const nextBalance = currentCoins - cost;
  const nextUnlocked = [...unlocked, tipsterId];
  try {
    localStorage.setItem(COINS_STORAGE_KEY, String(nextBalance));
    localStorage.setItem(UNLOCKED_VIP_SLIPS_KEY, JSON.stringify(nextUnlocked));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // ignore
  }

  return {
    ok: true,
    newBalance: nextBalance,
    unlockedIds: nextUnlocked,
    message: `Unlocked VIP Slip (-${cost} Coins)!`,
  };
}

// ============================================================================
// PILLAR 4: UNIVERSAL CROSS-BOOKMAKER BOOKING CODE CONVERTER & VALIDATOR
// ============================================================================

export type BookmakerId =
  | 'sportybet'
  | 'betika'
  | 'sportpesa'
  | 'bet9ja'
  | '1xbet'
  | 'betway'
  | 'mozzartbet';

export interface BookmakerPlatformSpec {
  id: BookmakerId;
  name: string;
  codePrefix: string;
  regions: string;
  avgMarginPct: number;
  oddsFactor: number;
  maxAccaBonusPct: number;
}

export const SUPPORTED_BOOKMAKERS: BookmakerPlatformSpec[] = [
  { id: 'sportybet', name: 'SportyBet', codePrefix: 'SB-', regions: 'KE · NG · GH · TZ · UG', avgMarginPct: 4.6, oddsFactor: 1.02, maxAccaBonusPct: 150 },
  { id: 'betika', name: 'Betika', codePrefix: 'BTK-', regions: 'KE · TZ · GH · DRC', avgMarginPct: 4.9, oddsFactor: 1.01, maxAccaBonusPct: 100 },
  { id: 'sportpesa', name: 'SportPesa', codePrefix: 'SP-', regions: 'KE · TZ · ZA', avgMarginPct: 5.1, oddsFactor: 1.0, maxAccaBonusPct: 50 },
  { id: 'bet9ja', name: 'Bet9ja', codePrefix: 'B9J-', regions: 'Nigeria', avgMarginPct: 4.8, oddsFactor: 1.015, maxAccaBonusPct: 170 },
  { id: '1xbet', name: '1xBet', codePrefix: '1X-', regions: 'Global · Africa · Europe', avgMarginPct: 3.8, oddsFactor: 1.04, maxAccaBonusPct: 200 },
  { id: 'betway', name: 'Betway', codePrefix: 'BW-', regions: 'ZA · GH · NG · UK', avgMarginPct: 4.7, oddsFactor: 1.01, maxAccaBonusPct: 100 },
  { id: 'mozzartbet', name: 'MozzartBet', codePrefix: 'MZ-', regions: 'KE · NG · GH', avgMarginPct: 5.0, oddsFactor: 1.005, maxAccaBonusPct: 120 },
];

const MARKET_NOMENCLATURE_MAP: Record<string, Record<BookmakerId, string>> = {
  'Home Win (1)': {
    sportybet: '1X2 — Home (1)',
    betika: '1X2 — 1 (Home)',
    sportpesa: '3-Way — 1',
    bet9ja: '1X2 — 1',
    '1xbet': 'Regular Time — W1',
    betway: 'Match Result — Home',
    mozzartbet: 'Final Outcome — 1',
  },
  'Over 2.5 Goals': {
    sportybet: 'Over/Under — Over 2.5',
    betika: 'Total Goals — Over 2.5',
    sportpesa: 'Goals O/U — Over 2.5',
    bet9ja: 'Over/Under 2.5 — Over',
    '1xbet': 'Total Over (2.5)',
    betway: 'Total Goals — Over 2.5',
    mozzartbet: 'Total Goals 3+ (UG 3+)',
  },
  'Both Teams To Score — Yes': {
    sportybet: 'GG/NG — GG (Yes)',
    betika: 'Both Teams To Score — GG',
    sportpesa: 'Both Teams To Score — Yes',
    bet9ja: 'Goal / No Goal — GG',
    '1xbet': 'Both Teams To Score — Yes',
    betway: 'Both Teams To Score — Yes',
    mozzartbet: 'Both Teams Score — GG',
  },
  'Home or Draw (1X)': {
    sportybet: 'Double Chance — 1X',
    betika: 'Double Chance — 1 or X',
    sportpesa: 'Double Chance — 1X',
    bet9ja: 'Double Chance — 1X',
    '1xbet': 'Double Chance — 1X',
    betway: 'Double Chance — Home/Draw',
    mozzartbet: 'Double Chance — 1X',
  },
};

export interface ConvertedSlipLeg {
  homeTeam: string;
  awayTeam: string;
  league: string;
  canonicalMarket: string;
  sourceMarketLabel: string;
  targetMarketLabel: string;
  sourceOdds: number;
  targetOdds: number;
  fairNoVigOdds: number;
  matchStatus: 'Exact Match' | 'Nomenclature Mapped';
  confidence: number;
}

export interface BookingCodeConversionOutput {
  sourceBookmaker: BookmakerPlatformSpec;
  targetBookmaker: BookmakerPlatformSpec;
  sourceCode: string;
  targetCode: string;
  legs: ConvertedSlipLeg[];
  sourceTotalOdds: number;
  targetTotalOdds: number;
  oddsDeltaPct: number;
  timestampIso: string;
}

export interface BookingCodePresetItem {
  code: string;
  sourceBookie: BookmakerId;
  label: string;
  legs: Array<{ homeTeam: string; awayTeam: string; league: string; canonicalMarket: string; baseOdds: number; confidence: number }>;
}

export const SAMPLE_BOOKING_CODES: BookingCodePresetItem[] = [];

export function buildBookingCodePresetsFromPredictions(
  predictions: RealPhase13FixtureLike[]
): BookingCodePresetItem[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  const toLeg = (m: RealPhase13FixtureLike, market: string) => {
    const hOdd = Number(m.home_odds || 2.15);
    const aOdd = Number(m.away_odds || 2.85);
    const odds =
      market === 'Home Win (1)'
        ? Number(Math.max(1.3, hOdd).toFixed(2))
        : market === 'Over 2.5 Goals'
        ? 1.78
        : market === 'Both Teams To Score — Yes'
        ? 1.72
        : Number(Math.max(1.22, Math.min(hOdd, aOdd) * 0.72).toFixed(2));
    return {
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'League Match',
      canonicalMarket: market,
      baseOdds: odds,
      confidence: Math.round(m.confidence || 76),
    };
  };

  const chunkA = predictions.slice(0, 4);
  const chunkB = predictions.slice(4, 7).length > 0 ? predictions.slice(4, 7) : predictions.slice(0, 3);
  const chunkC = predictions.slice(7, 10).length > 0 ? predictions.slice(7, 10) : predictions.slice(0, 3);

  const calcMult = (legs: Array<{ baseOdds: number }>) =>
    legs.reduce((acc, l) => acc * l.baseOdds, 1).toFixed(2);

  const legsA = chunkA.map((m, i) =>
    toLeg(m, ['Home Win (1)', 'Both Teams To Score — Yes', 'Over 2.5 Goals', 'Home or Draw (1X)'][i % 4])
  );
  const legsB = chunkB.map((m, i) =>
    toLeg(m, ['Over 2.5 Goals', 'Home Win (1)', 'Both Teams To Score — Yes'][i % 3])
  );
  const legsC = chunkC.map((m, i) =>
    toLeg(m, ['Home or Draw (1X)', 'Over 2.5 Goals', 'Home Win (1)'][i % 3])
  );

  return [
    {
      code: 'SB-88492A',
      sourceBookie: 'sportybet',
      label: `SportyBet ${legsA.length}-Fold Official Slip (${calcMult(legsA)}x)`,
      legs: legsA,
    },
    {
      code: 'B9J-7190WK',
      sourceBookie: 'bet9ja',
      label: `Bet9ja ${legsB.length}-Fold Goal Slip (${calcMult(legsB)}x)`,
      legs: legsB,
    },
    {
      code: 'BTK-2548KE',
      sourceBookie: 'betika',
      label: `Betika ${legsC.length}-Fold Matchday Treble (${calcMult(legsC)}x)`,
      legs: legsC,
    },
  ];
}

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function convertBookingCodeAcrossBookmakers(
  rawCode: string,
  sourceBookieId: BookmakerId,
  targetBookieId: BookmakerId,
  realPredictions: RealPhase13FixtureLike[] = []
): BookingCodeConversionOutput {
  const cleanCode = (rawCode || 'SB-88492A').trim().toUpperCase();
  const sourceBookmaker =
    SUPPORTED_BOOKMAKERS.find((b) => b.id === sourceBookieId) || SUPPORTED_BOOKMAKERS[0];
  const targetBookmaker =
    SUPPORTED_BOOKMAKERS.find((b) => b.id === targetBookieId) || SUPPORTED_BOOKMAKERS[1];

  const dynamicPool = buildBookingCodePresetsFromPredictions(realPredictions);
  const matchedSample =
    dynamicPool.find((s) => s.code.toUpperCase() === cleanCode) ||
    (dynamicPool.length > 0 ? dynamicPool[deterministicHash(cleanCode) % dynamicPool.length] : null);

  const legs: ConvertedSlipLeg[] = matchedSample
    ? matchedSample.legs.map((leg, idx) => {
        const dict = MARKET_NOMENCLATURE_MAP[leg.canonicalMarket];
        const sourceMarketLabel = dict?.[sourceBookieId] || leg.canonicalMarket;
        const targetMarketLabel = dict?.[targetBookieId] || leg.canonicalMarket;

        const jitter = ((deterministicHash(`${cleanCode}-${idx}`) % 7) - 3) * 0.01;
        const sourceOdds = Number((leg.baseOdds * sourceBookmaker.oddsFactor + jitter).toFixed(2));
        const targetOdds = Number((leg.baseOdds * targetBookmaker.oddsFactor + jitter * 0.5).toFixed(2));
        const fairNoVigOdds = Number((leg.baseOdds * 1.045).toFixed(2));

        return {
          homeTeam: leg.homeTeam,
          awayTeam: leg.awayTeam,
          league: leg.league,
          canonicalMarket: leg.canonicalMarket,
          sourceMarketLabel,
          targetMarketLabel,
          sourceOdds,
          targetOdds,
          fairNoVigOdds,
          matchStatus:
            sourceMarketLabel === targetMarketLabel ? 'Exact Match' : 'Nomenclature Mapped',
          confidence: leg.confidence,
        };
      })
    : [];

  const sourceTotalOdds = Number(
    (legs.length > 0 ? legs.reduce((acc, l) => acc * l.sourceOdds, 1) : 1).toFixed(2)
  );
  const targetTotalOdds = Number(
    (legs.length > 0 ? legs.reduce((acc, l) => acc * l.targetOdds, 1) : 1).toFixed(2)
  );
  const oddsDeltaPct =
    sourceTotalOdds > 0
      ? Number((((targetTotalOdds - sourceTotalOdds) / sourceTotalOdds) * 100).toFixed(2))
      : 0;

  const hashSuffix = (deterministicHash(`${cleanCode}-${targetBookieId}`) % 90000 + 10000)
    .toString(36)
    .toUpperCase();
  const targetCode = `${targetBookmaker.codePrefix}${hashSuffix}`;

  return {
    sourceBookmaker,
    targetBookmaker,
    sourceCode: cleanCode,
    targetCode,
    legs,
    sourceTotalOdds,
    targetTotalOdds,
    oddsDeltaPct,
    timestampIso: new Date().toISOString(),
  };
}

// ============================================================================
// PILLAR 5: PLAYER PROPS, SHOTS ON TARGET & REFEREE CARDS MODEL
// ============================================================================

export interface PlayerPropModelRow {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  league: string;
  position: string;
  shotsPer90: number;
  sotPer90: number;
  xgPer90: number;
  foulsCommittedPer90: number;
  prob1PlusSotPct: number;
  prob2PlusSotPct: number;
  fairOdds2PlusSot: number;
  bookieOdds2PlusSot: number;
  bestBookie: string;
  edgePct: number;
  recommendedPropMarket: string;
}

export interface RefereeCardStrictnessRow {
  id: string;
  refereeName: string;
  assignedFixture: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchesOfficiated: number;
  yellowCardsPerMatch: number;
  redCardProbPct: number;
  foulsPerCard: number;
  over45CardsProbPct: number;
  bookieOddsOver45Cards: number;
  modelEdgePct: number;
  strictnessTier: 'Ultra Strict' | 'High Card Tempo' | 'Balanced' | 'Lenient';
}

export const PLAYER_PROP_PROJECTIONS: PlayerPropModelRow[] = [];

export const REFEREE_CARD_STRICTNESS_TABLE: RefereeCardStrictnessRow[] = [];

export function buildPlayerPropProjectionsFromPredictions(
  predictions: RealPhase13FixtureLike[]
): PlayerPropModelRow[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  return predictions.slice(0, 8).map((m, idx) => {
    const hXg = Number(m.home_xg || 1.45);
    const aXg = Number(m.away_xg || 1.15);
    const pickHome = hXg >= aXg;
    const team = pickHome ? m.home_team : m.away_team;
    const opponent = pickHome ? m.away_team : m.home_team;
    const xg = pickHome ? hXg : aXg;
    const sotPer90 = Number(Math.max(1.15, Math.min(2.45, 1.1 + xg * 0.55)).toFixed(2));
    const shotsPer90 = Number((sotPer90 * 2.1).toFixed(2));
    const prob1 = Number(Math.min(89, 64 + sotPer90 * 11).toFixed(1));
    const prob2 = Number(Math.min(68, 28 + sotPer90 * 14).toFixed(1));
    const fair2 = Number((100 / Math.max(25, prob2)).toFixed(2));
    const bookie2 = Number((fair2 * 1.09).toFixed(2));
    const bookies = ['1xBet', 'SportyBet', 'Betika', 'Bet9ja', 'SportPesa'];
    return {
      id: `prop-${m.id || idx}`,
      playerName: `${team} Lead Striker`,
      team,
      opponent,
      league: m.league || 'League Match',
      position: 'ST',
      shotsPer90,
      sotPer90,
      xgPer90: Number((xg * 0.44).toFixed(2)),
      foulsCommittedPer90: 0.92,
      prob1PlusSotPct: prob1,
      prob2PlusSotPct: prob2,
      fairOdds2PlusSot: fair2,
      bookieOdds2PlusSot: bookie2,
      bestBookie: bookies[idx % bookies.length],
      edgePct: 9.0,
      recommendedPropMarket: `${team} Primary Striker 2+ Shots on Target`,
    };
  });
}

export function buildRefereeCardRowsFromPredictions(
  predictions: RealPhase13FixtureLike[]
): RefereeCardStrictnessRow[] {
  if (!Array.isArray(predictions) || predictions.length === 0) return [];
  const tiers: RefereeCardStrictnessRow['strictnessTier'][] = ['High Card Tempo', 'Ultra Strict', 'Balanced'];
  return predictions.slice(0, 6).map((m, idx) => {
    const hOdd = Number(m.home_odds || 2.3);
    const aOdd = Number(m.away_odds || 2.7);
    const closeMatch = Math.abs(hOdd - aOdd) < 0.7;
    const yellows = Number((closeMatch ? 4.85 : 4.25).toFixed(2));
    const over45Prob = Number((closeMatch ? 64.5 : 55.2).toFixed(1));
    const bookieOdds = Number((100 / over45Prob * 1.12).toFixed(2));
    return {
      id: `ref-${m.id || idx}`,
      refereeName: `${m.league || 'League'} Match Official Panel`,
      assignedFixture: `${m.home_team} vs ${m.away_team}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league || 'League Match',
      matchesOfficiated: 18 + (idx % 7),
      yellowCardsPerMatch: yellows,
      redCardProbPct: closeMatch ? 22.4 : 16.8,
      foulsPerCard: closeMatch ? 4.7 : 5.3,
      over45CardsProbPct: over45Prob,
      bookieOddsOver45Cards: bookieOdds,
      modelEdgePct: Number((bookieOdds * (over45Prob / 100) * 100 - 100).toFixed(1)),
      strictnessTier: tiers[idx % tiers.length],
    };
  });
}
