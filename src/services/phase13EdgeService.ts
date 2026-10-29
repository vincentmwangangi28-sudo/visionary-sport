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

export const HEDGE_PRESET_SCENARIOS: HedgePresetScenario[] = [
  {
    id: 'epl-5fold-arsenal',
    title: '5-Leg EPL Weekend Acca (4/5 Won)',
    subtitle: 'Final Leg Kickoff Tonight · 20:00 GMT',
    legsWonSummary: 'Liverpool W · Man City O2.5 · Villa BTTS · Newcastle 1X (All Won)',
    finalFixture: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    originalSelection: 'Arsenal to Win (1)',
    hedgeSelectionLabel: 'Chelsea or Draw (X2 Double Chance)',
    hedgeMarketType: '2way',
    originalStakeUsd: 25,
    accaTotalOdds: 14.4,
    bookieCashOutUsd: 162,
    hedgeOddsPrimary: 2.18,
  },
  {
    id: 'ucl-6fold-madrid',
    title: '6-Leg Champions League Parlay (5/6 Won)',
    subtitle: 'Final Leg Live at Halftime (0-0)',
    legsWonSummary: 'Bayern W · PSG BTTS · Inter 1X · Barca O1.5 · Dortmund W (All Won)',
    finalFixture: 'Real Madrid vs Atletico Madrid',
    homeTeam: 'Real Madrid',
    awayTeam: 'Atletico Madrid',
    league: 'UEFA Champions League',
    originalSelection: 'Over 2.5 Total Goals',
    hedgeSelectionLabel: 'Under 2.5 Total Goals (In-Play)',
    hedgeMarketType: '2way',
    originalStakeUsd: 40,
    accaTotalOdds: 18.5,
    bookieCashOutUsd: 295,
    hedgeOddsPrimary: 1.95,
  },
  {
    id: 'afcon-3way-split',
    title: '4-Leg African Derby Slip (3/4 Won · 3-Way Hedge)',
    subtitle: 'Separate Draw & Away Win Prices Across Two Bookies',
    legsWonSummary: 'Al Ahly W · Sundowns W · Esperance 1X (All Won)',
    finalFixture: 'Gor Mahia vs AFC Leopards',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    originalSelection: 'Gor Mahia Home Win (1)',
    hedgeSelectionLabel: 'Full-Time Draw (X) @ Betika',
    secondaryHedgeLabel: 'AFC Leopards Away Win (2) @ SportyBet',
    hedgeMarketType: '3way',
    originalStakeUsd: 30,
    accaTotalOdds: 11.2,
    bookieCashOutUsd: 138,
    hedgeOddsPrimary: 3.35,
    hedgeOddsSecondary: 4.4,
  },
  {
    id: 'seriea-banker-rollover',
    title: '7-Leg High-Odds Rollover (6/7 Won)',
    subtitle: 'Final Leg Sunday Night Derby',
    legsWonSummary: 'Napoli W · Atalanta O2.5 · Juventus 1X · Leverkusen W · Sporting W · Ajax W',
    finalFixture: 'Inter Milan vs AC Milan',
    homeTeam: 'Inter Milan',
    awayTeam: 'AC Milan',
    league: 'Serie A',
    originalSelection: 'Both Teams to Score — Yes (BTTS)',
    hedgeSelectionLabel: 'Both Teams to Score — No (NG)',
    hedgeMarketType: '2way',
    originalStakeUsd: 15,
    accaTotalOdds: 26.8,
    bookieCashOutUsd: 175,
    hedgeOddsPrimary: 2.08,
  },
];

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

export const INITIAL_ARBITRAGE_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: 'arb-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    kickoff: 'Today · 20:00 GMT',
    marketCategory: 'Total Goals (Over / Under 2.5)',
    marketType: '2way',
    legs: [
      { outcomeLabel: 'Over 2.5 Goals', bookmaker: 'SportyBet', odds: 2.08, bookingCode: 'SB-9421A' },
      { outcomeLabel: 'Under 2.5 Goals', bookmaker: '1xBet', odds: 2.06, bookingCode: '1X-8840B' },
    ],
    updatedSecondsAgo: 14,
  },
  {
    id: 'arb-2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'LaLiga',
    kickoff: 'Tomorrow · 19:45 GMT',
    marketCategory: '1X2 Full-Time Result',
    marketType: '3way',
    legs: [
      { outcomeLabel: 'Real Madrid Win (1)', bookmaker: 'Bet9ja', odds: 2.42, bookingCode: 'B9J-7712K' },
      { outcomeLabel: 'Full-Time Draw (X)', bookmaker: 'Pinnacle', odds: 3.95, bookingCode: 'PIN-3019X' },
      { outcomeLabel: 'Barcelona Win (2)', bookmaker: 'Betika', odds: 3.35, bookingCode: 'BTK-5521M' },
    ],
    updatedSecondsAgo: 22,
  },
  {
    id: 'arb-3',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    kickoff: 'Saturday · 17:30 GMT',
    marketCategory: 'Both Teams To Score (BTTS)',
    marketType: '2way',
    legs: [
      { outcomeLabel: 'BTTS — Yes (GG)', bookmaker: 'SportPesa', odds: 1.78, bookingCode: 'SP-4190G' },
      { outcomeLabel: 'BTTS — No (NG)', bookmaker: '1xBet', odds: 2.46, bookingCode: '1X-6102N' },
    ],
    updatedSecondsAgo: 9,
  },
  {
    id: 'arb-4',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    league: 'Serie A',
    kickoff: 'Sunday · 19:45 GMT',
    marketCategory: 'Draw No Bet (DNB)',
    marketType: '2way',
    legs: [
      { outcomeLabel: 'Inter Milan DNB', bookmaker: 'SportyBet', odds: 1.66, bookingCode: 'SB-3108D' },
      { outcomeLabel: 'Juventus DNB', bookmaker: 'Betway', odds: 2.74, bookingCode: 'BW-9920J' },
    ],
    updatedSecondsAgo: 31,
  },
  {
    id: 'arb-5',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    kickoff: 'Sunday · 15:00 EAT',
    marketCategory: '1X2 Full-Time Result',
    marketType: '3way',
    legs: [
      { outcomeLabel: 'Gor Mahia Win (1)', bookmaker: 'Betika', odds: 2.15, bookingCode: 'BTK-2540G' },
      { outcomeLabel: 'Full-Time Draw (X)', bookmaker: 'SportPesa', odds: 3.45, bookingCode: 'SP-2541X' },
      { outcomeLabel: 'AFC Leopards Win (2)', bookmaker: 'SportyBet', odds: 4.55, bookingCode: 'SB-2549L' },
    ],
    updatedSecondsAgo: 18,
  },
  {
    id: 'arb-6',
    homeTeam: 'Mamelodi Sundowns',
    awayTeam: 'Orlando Pirates',
    league: 'South Africa PSL',
    kickoff: 'Saturday · 15:30 SAST',
    marketCategory: 'Asian Handicap (-0.5 / +0.5)',
    marketType: '2way',
    legs: [
      { outcomeLabel: 'Sundowns -0.5', bookmaker: 'Betway', odds: 1.98, bookingCode: 'BW-7012S' },
      { outcomeLabel: 'Pirates +0.5 (X2)', bookmaker: '1xBet', odds: 2.12, bookingCode: '1X-7019P' },
    ],
    updatedSecondsAgo: 27,
  },
];

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
    activeSlipTitle: 'EPL & Serie A Expected Goals Treble',
    activeSlipBookingCodes: {
      SportyBet: 'SB-8841Q',
      Betika: 'BTK-9920M',
      SportPesa: 'SP-4102K',
      '1xBet': '1X-7731V',
    },
    activeSlipTotalOdds: 4.18,
    activeSlipAnalysis:
      'All three home sides hold a > +0.85 non-penalty xG differential over their last 6 home matches and beat opening Pinnacle lines by 4.2%.',
    activeSlipLegs: [
      { homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', market: 'Arsenal to Win', odds: 1.72, confidence: 84 },
      { homeTeam: 'Inter Milan', awayTeam: 'AC Milan', league: 'Serie A', market: 'Inter Milan 1X & Over 1.5', odds: 1.56, confidence: 86 },
      { homeTeam: 'Liverpool', awayTeam: 'Tottenham', league: 'Premier League', market: 'Over 2.5 Goals', odds: 1.56, confidence: 83 },
    ],
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
    activeSlipTitle: 'VIP 5.80x Weekend Syndicate Banker',
    activeSlipBookingCodes: {
      SportyBet: 'SB-5509N',
      Bet9ja: 'B9J-8842L',
      '1xBet': '1X-9012A',
      Betway: 'BW-3310S',
    },
    activeSlipTotalOdds: 5.82,
    activeSlipAnalysis:
      'High-liquidity 4-leg multi combining Bayern first-half pressure with Real Madrid home dominance and Arsenal corner supremacy.',
    activeSlipLegs: [
      { homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', league: 'Bundesliga', market: 'Bayern Win & Over 2.5', odds: 1.85, confidence: 82 },
      { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', league: 'LaLiga', market: 'Both Teams To Score — Yes', odds: 1.58, confidence: 85 },
      { homeTeam: 'PSG', awayTeam: 'Marseille', league: 'Ligue 1', market: 'PSG to Win', odds: 1.48, confidence: 84 },
      { homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'FKF Premier League', market: 'Gor Mahia 1X Double Chance', odds: 1.35, confidence: 89 },
    ],
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
    activeSlipTitle: 'European High-Pace Totals Double',
    activeSlipBookingCodes: {
      SportyBet: 'SB-1190T',
      Betika: 'BTK-1192T',
      '1xBet': '1X-1198T',
    },
    activeSlipTotalOdds: 3.12,
    activeSlipAnalysis:
      'Both fixtures rank in the 94th percentile for Combined Box Touches per 90 and feature high defensive line depths (> 44.5m).',
    activeSlipLegs: [
      { homeTeam: 'Bayer Leverkusen', awayTeam: 'RB Leipzig', league: 'Bundesliga', market: 'Over 2.5 Goals', odds: 1.74, confidence: 83 },
      { homeTeam: 'Sporting CP', awayTeam: 'Benfica', league: 'Primeira Liga', market: 'Both Teams To Score — Yes', odds: 1.79, confidence: 81 },
    ],
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
    activeSlipTitle: 'Player Shots on Target & Referee Cards Builder',
    activeSlipBookingCodes: {
      SportyBet: 'SB-6012P',
      Betway: 'BW-6015P',
      '1xBet': '1X-6019P',
    },
    activeSlipTotalOdds: 3.85,
    activeSlipAnalysis:
      'Bukayo Saka averages 1.64 SOT/90 at home against high fullbacks, paired with El Clásico referee booking points Over 4.5 Cards.',
    activeSlipLegs: [
      { homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', market: 'Bukayo Saka 1+ Shot on Target', odds: 1.44, confidence: 87 },
      { homeTeam: 'Manchester City', awayTeam: 'Newcastle', league: 'Premier League', market: 'Erling Haaland 2+ Shots on Target', odds: 1.68, confidence: 84 },
      { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', league: 'LaLiga', market: 'Over 4.5 Total Yellow Cards', odds: 1.59, confidence: 82 },
    ],
  },
];

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

export const SAMPLE_BOOKING_CODES: Array<{
  code: string;
  sourceBookie: BookmakerId;
  label: string;
  legs: Array<{ homeTeam: string; awayTeam: string; league: string; canonicalMarket: string; baseOdds: number; confidence: number }>;
}> = [
  {
    code: 'SB-88492A',
    sourceBookie: 'sportybet',
    label: 'SportyBet 4-Fold European Banker (5.42x)',
    legs: [
      { homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', canonicalMarket: 'Home Win (1)', baseOdds: 1.72, confidence: 84 },
      { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', league: 'LaLiga', canonicalMarket: 'Both Teams To Score — Yes', baseOdds: 1.58, confidence: 85 },
      { homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', league: 'Bundesliga', canonicalMarket: 'Over 2.5 Goals', baseOdds: 1.48, confidence: 86 },
      { homeTeam: 'Inter Milan', awayTeam: 'AC Milan', league: 'Serie A', canonicalMarket: 'Home or Draw (1X)', baseOdds: 1.32, confidence: 88 },
    ],
  },
  {
    code: 'B9J-7190WK',
    sourceBookie: 'bet9ja',
    label: 'Bet9ja Weekend Goal Rush 3-Fold (4.15x)',
    legs: [
      { homeTeam: 'Liverpool', awayTeam: 'Tottenham', league: 'Premier League', canonicalMarket: 'Over 2.5 Goals', baseOdds: 1.55, confidence: 83 },
      { homeTeam: 'PSG', awayTeam: 'Marseille', league: 'Ligue 1', canonicalMarket: 'Home Win (1)', baseOdds: 1.52, confidence: 84 },
      { homeTeam: 'Bayer Leverkusen', awayTeam: 'RB Leipzig', league: 'Bundesliga', canonicalMarket: 'Both Teams To Score — Yes', baseOdds: 1.74, confidence: 81 },
    ],
  },
  {
    code: 'BTK-2548KE',
    sourceBookie: 'betika',
    label: 'Betika East & South Africa Derby Treble (3.92x)',
    legs: [
      { homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'FKF Premier League', canonicalMarket: 'Home Win (1)', baseOdds: 1.92, confidence: 81 },
      { homeTeam: 'Mamelodi Sundowns', awayTeam: 'Orlando Pirates', league: 'South Africa PSL', canonicalMarket: 'Home or Draw (1X)', baseOdds: 1.34, confidence: 87 },
      { homeTeam: 'Young Africans', awayTeam: 'Simba SC', league: 'Tanzania Ligi Kuu', canonicalMarket: 'Both Teams To Score — Yes', baseOdds: 1.52, confidence: 79 },
    ],
  },
  {
    code: '1X-9940EV',
    sourceBookie: '1xbet',
    label: '1xBet Sharp CLV Value Double (3.18x)',
    legs: [
      { homeTeam: 'Atalanta', awayTeam: 'Napoli', league: 'Serie A', canonicalMarket: 'Over 2.5 Goals', baseOdds: 1.78, confidence: 82 },
      { homeTeam: 'Sporting CP', awayTeam: 'Benfica', league: 'Primeira Liga', canonicalMarket: 'Both Teams To Score — Yes', baseOdds: 1.76, confidence: 80 },
    ],
  },
];

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
  targetBookieId: BookmakerId
): BookingCodeConversionOutput {
  const cleanCode = (rawCode || 'SB-88492A').trim().toUpperCase();
  const sourceBookmaker =
    SUPPORTED_BOOKMAKERS.find((b) => b.id === sourceBookieId) || SUPPORTED_BOOKMAKERS[0];
  const targetBookmaker =
    SUPPORTED_BOOKMAKERS.find((b) => b.id === targetBookieId) || SUPPORTED_BOOKMAKERS[1];

  const matchedSample =
    SAMPLE_BOOKING_CODES.find((s) => s.code.toUpperCase() === cleanCode) ||
    SAMPLE_BOOKING_CODES[deterministicHash(cleanCode) % SAMPLE_BOOKING_CODES.length];

  const legs: ConvertedSlipLeg[] = matchedSample.legs.map((leg, idx) => {
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
  });

  const sourceTotalOdds = Number(
    legs.reduce((acc, l) => acc * l.sourceOdds, 1).toFixed(2)
  );
  const targetTotalOdds = Number(
    legs.reduce((acc, l) => acc * l.targetOdds, 1).toFixed(2)
  );
  const oddsDeltaPct = Number(
    (((targetTotalOdds - sourceTotalOdds) / sourceTotalOdds) * 100).toFixed(2)
  );

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

export const PLAYER_PROP_PROJECTIONS: PlayerPropModelRow[] = [
  {
    id: 'prop-haaland',
    playerName: 'Erling Haaland',
    team: 'Manchester City',
    opponent: 'Newcastle United',
    league: 'Premier League',
    position: 'ST',
    shotsPer90: 4.35,
    sotPer90: 2.28,
    xgPer90: 0.89,
    foulsCommittedPer90: 0.95,
    prob1PlusSotPct: 89.8,
    prob2PlusSotPct: 66.4,
    fairOdds2PlusSot: 1.51,
    bookieOdds2PlusSot: 1.68,
    bestBookie: '1xBet',
    edgePct: 11.3,
    recommendedPropMarket: 'Erling Haaland 2+ Shots on Target',
  },
  {
    id: 'prop-saka',
    playerName: 'Bukayo Saka',
    team: 'Arsenal',
    opponent: 'Chelsea',
    league: 'Premier League',
    position: 'RW',
    shotsPer90: 3.42,
    sotPer90: 1.64,
    xgPer90: 0.54,
    foulsCommittedPer90: 1.12,
    prob1PlusSotPct: 80.6,
    prob2PlusSotPct: 48.7,
    fairOdds2PlusSot: 2.05,
    bookieOdds2PlusSot: 2.25,
    bestBookie: 'SportyBet',
    edgePct: 9.8,
    recommendedPropMarket: 'Bukayo Saka 2+ Shots on Target',
  },
  {
    id: 'prop-mbappe',
    playerName: 'Kylian Mbappé',
    team: 'Real Madrid',
    opponent: 'Barcelona',
    league: 'LaLiga',
    position: 'ST',
    shotsPer90: 4.68,
    sotPer90: 2.41,
    xgPer90: 0.82,
    foulsCommittedPer90: 0.72,
    prob1PlusSotPct: 91.0,
    prob2PlusSotPct: 69.2,
    fairOdds2PlusSot: 1.45,
    bookieOdds2PlusSot: 1.62,
    bestBookie: 'Bet9ja',
    edgePct: 11.7,
    recommendedPropMarket: 'Kylian Mbappé 2+ Shots on Target',
  },
  {
    id: 'prop-salah',
    playerName: 'Mohamed Salah',
    team: 'Liverpool',
    opponent: 'Tottenham',
    league: 'Premier League',
    position: 'RW',
    shotsPer90: 3.76,
    sotPer90: 1.88,
    xgPer90: 0.68,
    foulsCommittedPer90: 0.65,
    prob1PlusSotPct: 84.7,
    prob2PlusSotPct: 56.1,
    fairOdds2PlusSot: 1.78,
    bookieOdds2PlusSot: 1.95,
    bestBookie: 'Betika',
    edgePct: 9.6,
    recommendedPropMarket: 'Mohamed Salah 2+ Shots on Target',
  },
  {
    id: 'prop-kane',
    playerName: 'Harry Kane',
    team: 'Bayern Munich',
    opponent: 'Borussia Dortmund',
    league: 'Bundesliga',
    position: 'ST',
    shotsPer90: 4.12,
    sotPer90: 2.15,
    xgPer90: 0.84,
    foulsCommittedPer90: 0.82,
    prob1PlusSotPct: 88.4,
    prob2PlusSotPct: 63.3,
    fairOdds2PlusSot: 1.58,
    bookieOdds2PlusSot: 1.74,
    bestBookie: 'SportPesa',
    edgePct: 10.1,
    recommendedPropMarket: 'Harry Kane 2+ Shots on Target',
  },
  {
    id: 'prop-lautaro',
    playerName: 'Lautaro Martínez',
    team: 'Inter Milan',
    opponent: 'AC Milan',
    league: 'Serie A',
    position: 'ST',
    shotsPer90: 3.58,
    sotPer90: 1.71,
    xgPer90: 0.61,
    foulsCommittedPer90: 1.48,
    prob1PlusSotPct: 81.9,
    prob2PlusSotPct: 51.0,
    fairOdds2PlusSot: 1.96,
    bookieOdds2PlusSot: 2.14,
    bestBookie: 'Betway',
    edgePct: 9.2,
    recommendedPropMarket: 'Lautaro Martínez 2+ Shots on Target',
  },
];

export const REFEREE_CARD_STRICTNESS_TABLE: RefereeCardStrictnessRow[] = [
  {
    id: 'ref-gil-manzano',
    refereeName: 'Jesús Gil Manzano',
    assignedFixture: 'Real Madrid vs Barcelona',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'LaLiga',
    matchesOfficiated: 24,
    yellowCardsPerMatch: 5.62,
    redCardProbPct: 28.4,
    foulsPerCard: 4.3,
    over45CardsProbPct: 74.5,
    bookieOddsOver45Cards: 1.62,
    modelEdgePct: 20.7,
    strictnessTier: 'Ultra Strict',
  },
  {
    id: 'ref-oliver',
    refereeName: 'Michael Oliver',
    assignedFixture: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    matchesOfficiated: 26,
    yellowCardsPerMatch: 4.74,
    redCardProbPct: 19.2,
    foulsPerCard: 5.1,
    over45CardsProbPct: 63.8,
    bookieOddsOver45Cards: 1.78,
    modelEdgePct: 13.6,
    strictnessTier: 'High Card Tempo',
  },
  {
    id: 'ref-orsato',
    refereeName: 'Davide Massa',
    assignedFixture: 'Inter Milan vs AC Milan',
    homeTeam: 'Inter Milan',
    awayTeam: 'AC Milan',
    league: 'Serie A',
    matchesOfficiated: 22,
    yellowCardsPerMatch: 5.18,
    redCardProbPct: 22.7,
    foulsPerCard: 4.8,
    over45CardsProbPct: 69.2,
    bookieOddsOver45Cards: 1.68,
    modelEdgePct: 16.3,
    strictnessTier: 'Ultra Strict',
  },
  {
    id: 'ref-zwayer',
    refereeName: 'Felix Zwayer',
    assignedFixture: 'Bayern Munich vs Borussia Dortmund',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    matchesOfficiated: 21,
    yellowCardsPerMatch: 4.45,
    redCardProbPct: 16.5,
    foulsPerCard: 5.4,
    over45CardsProbPct: 58.9,
    bookieOddsOver45Cards: 1.86,
    modelEdgePct: 9.6,
    strictnessTier: 'High Card Tempo',
  },
];
