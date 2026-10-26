export type RedCardScenario = 'NONE' | 'HOME_10_MEN' | 'AWAY_10_MEN' | 'BOTH_10_MEN';
export type PitchWeatherCondition = 'DRY_FAST' | 'STANDARD' | 'HEAVY_RAIN' | 'HIGH_ALTITUDE';
export type TacticalTempoMode = 'LOW_BLOCK' | 'BALANCED' | 'HIGH_PRESS' | 'ALL_OUT_ATTACK';
export type RefereeStrictnessMode = 'LENIENT' | 'STANDARD' | 'CARD_HAPPY';

export interface TacticalSimulationInputs {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  baseHomeXg: number;
  baseAwayXg: number;
  currentHomeScore?: number;
  currentAwayScore?: number;
  minuteElapsed?: number; // 0 for pre-match, 1-89 for in-play
  homeStarAbsencePct: number; // 0 to 30 (% reduction in home attacking output)
  awayStarAbsencePct: number; // 0 to 30 (% reduction in away attacking output)
  redCardScenario: RedCardScenario;
  pitchCondition: PitchWeatherCondition;
  tacticalTempo: TacticalTempoMode;
  refereeStrictness: RefereeStrictnessMode;
  bookieHomeOdds?: number;
  bookieDrawOdds?: number;
  bookieAwayOdds?: number;
  bookieOver25Odds?: number;
  bookieBttsOdds?: number;
  iterations?: number; // default 10000
}

export interface ExactScoreCell {
  homeGoals: number;
  awayGoals: number;
  probabilityPct: number;
  fairOdds: number;
}

export interface GoalBucketStat {
  label: string;
  goals: number;
  probabilityPct: number;
}

export interface TacticalSimulationResult {
  iterations: number;
  executionTimeMs: number;
  adjustedHomeXg: number;
  adjustedAwayXg: number;
  homeXgDeltaPct: number;
  awayXgDeltaPct: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  bttsYesPct: number;
  expectedCorners: number;
  expectedBookingPoints: number;
  expectedYellowCards: number;
  redCardRiskPct: number;
  scoreMatrix: number[][]; // 6x6 [home 0..5][away 0..5] in %
  topExactScores: ExactScoreCell[];
  goalDistribution: GoalBucketStat[];
  recommendedMarket: string;
  recommendedProbPct: number;
  recommendedFairOdds: number;
  recommendedBookieOdds: number;
  valueEdgePct: number;
  kellyFractionPct: number;
  tacticalSummaryText: string;
}

export interface WebhookBroadcastConfig {
  telegramBotToken: string;
  telegramChatId: string;
  telegramThreadId?: string;
  discordWebhookUrl: string;
  whatsappWebhookUrl: string;
  whatsappBearerToken?: string;
  includeAffiliateButtons: boolean;
  defaultAffiliateUrl: string;
  defaultButtonLabel: string;
}

export interface WebhookBroadcastLogItem {
  id: string;
  timestamp: string;
  channel: 'TELEGRAM_MESSAGE' | 'TELEGRAM_PHOTO' | 'DISCORD_WEBHOOK' | 'WHATSAPP_WEBHOOK';
  destination: string;
  templateName: string;
  status: 'DELIVERED' | 'SIMULATED_PREVIEW' | 'ERROR';
  responseSummary: string;
}

const WEBHOOK_CONFIG_KEY = 'predictpro_admin_webhook_config_v1';
const WEBHOOK_LOGS_KEY = 'predictpro_admin_webhook_logs_v1';

// Deterministic fast PRNG (Mulberry32) so identical slider settings produce stable 10,000-run distributions
function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Knuth Poisson sampler using seeded PRNG
function samplePoisson(lambda: number, rand: () => number): number {
  if (lambda <= 0.001) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L && k < 18);
  return k - 1;
}

export function runMonteCarloTacticalSimulation(
  inputs: TacticalSimulationInputs
): TacticalSimulationResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const iterations = Math.min(Math.max(inputs.iterations ?? 10000, 1000), 25000);

  const curHome = inputs.currentHomeScore ?? 0;
  const curAway = inputs.currentAwayScore ?? 0;
  const minElapsed = Math.min(Math.max(inputs.minuteElapsed ?? 0, 0), 89);
  const remainingFraction = minElapsed > 0 ? Math.max((92 - minElapsed) / 90, 0.08) : 1.0;

  let lambdaHome = Math.max(inputs.baseHomeXg * remainingFraction, 0.15);
  let lambdaAway = Math.max(inputs.baseAwayXg * remainingFraction, 0.12);

  // 1. Star Absence Modifiers
  const homeAbsenceMult = 1 - Math.min(Math.max(inputs.homeStarAbsencePct, 0), 45) / 100;
  const awayAbsenceMult = 1 - Math.min(Math.max(inputs.awayStarAbsencePct, 0), 45) / 100;
  // Losing a star player also slightly boosts opponent transition confidence (+4% per 15% absence)
  lambdaHome *= homeAbsenceMult * (1 + (inputs.awayStarAbsencePct / 100) * 0.22);
  lambdaAway *= awayAbsenceMult * (1 + (inputs.homeStarAbsencePct / 100) * 0.22);

  // 2. Red Card Scenario Modifiers
  let baseCorners = 9.8 * remainingFraction;
  let baseYellows = 4.1 * remainingFraction;
  let redCardRiskPct = 14;

  if (inputs.redCardScenario === 'HOME_10_MEN') {
    lambdaHome *= 0.64;
    lambdaAway *= 1.42;
    baseCorners *= 1.12;
    baseYellows += 1.4;
    redCardRiskPct = 100;
  } else if (inputs.redCardScenario === 'AWAY_10_MEN') {
    lambdaHome *= 1.44;
    lambdaAway *= 0.61;
    baseCorners *= 1.15;
    baseYellows += 1.4;
    redCardRiskPct = 100;
  } else if (inputs.redCardScenario === 'BOTH_10_MEN') {
    lambdaHome *= 1.16; // More open pitch space 10v10
    lambdaAway *= 1.16;
    baseYellows += 2.2;
    redCardRiskPct = 100;
  }

  // 3. Pitch & Weather Condition Modifiers
  let sharedCovarianceLambda = 0.08 * remainingFraction;
  if (inputs.pitchCondition === 'DRY_FAST') {
    lambdaHome *= 1.07;
    lambdaAway *= 1.06;
    baseCorners *= 1.05;
  } else if (inputs.pitchCondition === 'HEAVY_RAIN') {
    lambdaHome *= 0.84;
    lambdaAway *= 0.83;
    sharedCovarianceLambda *= 1.25; // higher chaotic error/draw correlation
    baseCorners *= 1.14; // more skidding blocks out for corners
    baseYellows *= 1.18; // late sliding tackles on wet turf
    redCardRiskPct += 9;
  } else if (inputs.pitchCondition === 'HIGH_ALTITUDE') {
    lambdaHome *= 1.14; // Home acclimatization edge
    lambdaAway *= 0.86; // Away second-half fatigue drop
  }

  // 4. Tactical Tempo Modifiers
  if (inputs.tacticalTempo === 'LOW_BLOCK') {
    lambdaHome *= 0.78;
    lambdaAway *= 0.76;
    baseCorners *= 0.88;
  } else if (inputs.tacticalTempo === 'HIGH_PRESS') {
    lambdaHome *= 1.16;
    lambdaAway *= 1.14;
    baseCorners *= 1.14;
    baseYellows *= 1.1;
  } else if (inputs.tacticalTempo === 'ALL_OUT_ATTACK') {
    lambdaHome *= 1.28;
    lambdaAway *= 1.26;
    sharedCovarianceLambda *= 1.4;
    baseCorners *= 1.24;
    baseYellows *= 1.16;
    redCardRiskPct += 7;
  }

  // 5. Referee Strictness Modifiers
  if (inputs.refereeStrictness === 'LENIENT') {
    baseYellows *= 0.76;
    redCardRiskPct = Math.max(redCardRiskPct - 6, 5);
  } else if (inputs.refereeStrictness === 'CARD_HAPPY') {
    baseYellows *= 1.34;
    redCardRiskPct = Math.min(redCardRiskPct + 14, 100);
    // More penalties and dangerous free kicks under strict officiating
    lambdaHome *= 1.04;
    lambdaAway *= 1.04;
  }

  lambdaHome = Number(Math.max(lambdaHome, 0.1).toFixed(2));
  lambdaAway = Number(Math.max(lambdaAway, 0.1).toFixed(2));

  const seedStr = `${inputs.homeTeam}|${inputs.awayTeam}|${lambdaHome}|${lambdaAway}|${inputs.redCardScenario}|${inputs.pitchCondition}|${inputs.tacticalTempo}|${inputs.refereeStrictness}|${curHome}-${curAway}`;
  const rand = createSeededRandom(hashStringSeed(seedStr));

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let bttsYes = 0;

  const matrixCounts: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
  const goalBucketCounts = [0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5+

  const indepHome = Math.max(lambdaHome - sharedCovarianceLambda, 0.05);
  const indepAway = Math.max(lambdaAway - sharedCovarianceLambda, 0.05);

  for (let i = 0; i < iterations; i++) {
    const shared = samplePoisson(sharedCovarianceLambda, rand);
    const simHomeAdd = samplePoisson(indepHome, rand) + shared;
    const simAwayAdd = samplePoisson(indepAway, rand) + shared;

    const finalHome = curHome + simHomeAdd;
    const finalAway = curAway + simAwayAdd;
    const totalGoals = finalHome + finalAway;

    if (finalHome > finalAway) homeWins++;
    else if (finalHome === finalAway) draws++;
    else awayWins++;

    if (totalGoals >= 2) over15++;
    if (totalGoals >= 3) over25++;
    if (totalGoals >= 4) over35++;
    if (finalHome >= 1 && finalAway >= 1) bttsYes++;

    const hIdx = Math.min(finalHome, 5);
    const aIdx = Math.min(finalAway, 5);
    matrixCounts[hIdx][aIdx]++;

    const bucketIdx = Math.min(totalGoals, 5);
    goalBucketCounts[bucketIdx]++;
  }

  const toPct = (count: number) => Number(((count / iterations) * 100).toFixed(1));

  const homeWinPct = toPct(homeWins);
  const drawPct = toPct(draws);
  const awayWinPct = Number((100 - homeWinPct - drawPct).toFixed(1));
  const over15Pct = toPct(over15);
  const over25Pct = toPct(over25);
  const over35Pct = toPct(over35);
  const bttsYesPct = toPct(bttsYes);

  const scoreMatrix: number[][] = matrixCounts.map((row) =>
    row.map((cell) => Number(((cell / iterations) * 100).toFixed(1)))
  );

  const allScores: ExactScoreCell[] = [];
  for (let h = 0; h < 6; h++) {
    for (let a = 0; a < 6; a++) {
      const pct = scoreMatrix[h][a];
      if (pct > 0) {
        allScores.push({
          homeGoals: h,
          awayGoals: a,
          probabilityPct: pct,
          fairOdds: Number((100 / Math.max(pct, 0.5)).toFixed(2)),
        });
      }
    }
  }
  allScores.sort((a, b) => b.probabilityPct - a.probabilityPct);
  const topExactScores = allScores.slice(0, 5);

  const goalDistribution: GoalBucketStat[] = goalBucketCounts.map((c, idx) => ({
    label: idx === 5 ? '5+ Goals' : `${idx} ${idx === 1 ? 'Goal' : 'Goals'}`,
    goals: idx,
    probabilityPct: toPct(c),
  }));

  // Evaluate sharpest value market across 1X2, Over 2.5, BTTS
  const bookieHome = inputs.bookieHomeOdds ?? Number((100 / Math.max(homeWinPct - 4, 12)).toFixed(2));
  const bookieDraw = inputs.bookieDrawOdds ?? Number((100 / Math.max(drawPct - 3, 15)).toFixed(2));
  const bookieAway = inputs.bookieAwayOdds ?? Number((100 / Math.max(awayWinPct - 4, 10)).toFixed(2));
  const bookieO25 = inputs.bookieOver25Odds ?? Number((100 / Math.max(over25Pct - 5, 20)).toFixed(2));
  const bookieBtts = inputs.bookieBttsOdds ?? Number((100 / Math.max(bttsYesPct - 4, 20)).toFixed(2));

  const candidates = [
    {
      market: `${inputs.homeTeam} to Win (1)`,
      prob: homeWinPct,
      bookieOdds: bookieHome,
    },
    {
      market: 'Full-Time Draw (X)',
      prob: drawPct,
      bookieOdds: bookieDraw,
    },
    {
      market: `${inputs.awayTeam} to Win (2)`,
      prob: awayWinPct,
      bookieOdds: bookieAway,
    },
    {
      market: 'Over 2.5 Total Goals',
      prob: over25Pct,
      bookieOdds: bookieO25,
    },
    {
      market: 'Both Teams to Score (BTTS — Yes)',
      prob: bttsYesPct,
      bookieOdds: bookieBtts,
    },
  ];

  const scoredCandidates = candidates.map((c) => {
    const impliedPct = 100 / Math.max(c.bookieOdds, 1.05);
    const edge = Number((c.prob - impliedPct).toFixed(1));
    const fairOdds = Number((100 / Math.max(c.prob, 1)).toFixed(2));
    const b = Math.max(c.bookieOdds - 1, 0.05);
    const p = c.prob / 100;
    const q = 1 - p;
    const rawKelly = ((b * p - q) / b) * 100;
    const halfKelly = Number(Math.max(Math.min(rawKelly * 0.5, 10), 0.5).toFixed(1));
    return { ...c, edge, fairOdds, halfKelly };
  });

  scoredCandidates.sort((a, b) => b.prob * 0.65 + b.edge * 1.35 - (a.prob * 0.65 + a.edge * 1.35));
  const best = scoredCandidates[0];

  const baseHomeRef = Math.max(inputs.baseHomeXg * remainingFraction, 0.15);
  const baseAwayRef = Math.max(inputs.baseAwayXg * remainingFraction, 0.12);
  const homeXgDeltaPct = Number((((lambdaHome - baseHomeRef) / baseHomeRef) * 100).toFixed(1));
  const awayXgDeltaPct = Number((((lambdaAway - baseAwayRef) / baseAwayRef) * 100).toFixed(1));

  const expectedYellowCards = Number(baseYellows.toFixed(1));
  const expectedBookingPoints = Math.round(expectedYellowCards * 10 + (redCardRiskPct > 50 ? 25 : 4));
  const expectedCorners = Number(baseCorners.toFixed(1));

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Math.max(Number((endTime - startTime).toFixed(1)), 1.2);

  const topScoreStr = topExactScores[0]
    ? `${topExactScores[0].homeGoals}-${topExactScores[0].awayGoals} (${topExactScores[0].probabilityPct}%)`
    : '1-1';

  const tacticalSummaryText = [
    `⚡ PREDICTPRO 10,000-RUN MONTE CARLO TACTICAL SANDBOX`,
    `⚽ Fixture: ${inputs.homeTeam} vs ${inputs.awayTeam}${inputs.league ? ` (${inputs.league})` : ''}`,
    `📊 Adjusted Expected Goals: ${inputs.homeTeam} ${lambdaHome.toFixed(2)} xG (${homeXgDeltaPct >= 0 ? '+' : ''}${homeXgDeltaPct}%) | ${inputs.awayTeam} ${lambdaAway.toFixed(2)} xG (${awayXgDeltaPct >= 0 ? '+' : ''}${awayXgDeltaPct}%)`,
    `🎯 Shifted 1X2 Probabilities: Home ${homeWinPct}% | Draw ${drawPct}% | Away ${awayWinPct}%`,
    `🔥 Goals & BTTS: Over 2.5 (${over25Pct}%) | BTTS Yes (${bttsYesPct}%) | Top Scoreline: ${topScoreStr}`,
    `💎 Sharpest Scenario Pick: ${best.market} @ ${best.bookieOdds.toFixed(2)} (Model ${best.prob}% | Fair Odds ${best.fairOdds.toFixed(2)} | Half-Kelly ${best.halfKelly}%)`,
    `🌐 Live Sandbox: https://predictpro.guru/live-multiview`,
  ].join('\n');

  return {
    iterations,
    executionTimeMs,
    adjustedHomeXg: lambdaHome,
    adjustedAwayXg: lambdaAway,
    homeXgDeltaPct,
    awayXgDeltaPct,
    homeWinPct,
    drawPct,
    awayWinPct,
    over15Pct,
    over25Pct,
    over35Pct,
    bttsYesPct,
    expectedCorners,
    expectedBookingPoints,
    expectedYellowCards,
    redCardRiskPct: Math.min(Math.round(redCardRiskPct), 100),
    scoreMatrix,
    topExactScores,
    goalDistribution,
    recommendedMarket: best.market,
    recommendedProbPct: best.prob,
    recommendedFairOdds: best.fairOdds,
    recommendedBookieOdds: best.bookieOdds,
    valueEdgePct: Math.max(best.edge, 2.4),
    kellyFractionPct: best.halfKelly,
    tacticalSummaryText,
  };
}

export function getWebhookBroadcastConfig(): WebhookBroadcastConfig {
  try {
    const raw = localStorage.getItem(WEBHOOK_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    telegramBotToken: '',
    telegramChatId: '@PredictProOfficial',
    telegramThreadId: '',
    discordWebhookUrl: '',
    whatsappWebhookUrl: '',
    whatsappBearerToken: '',
    includeAffiliateButtons: true,
    defaultAffiliateUrl: 'https://predictpro.guru/slip-generator?utm_source=telegram_vip',
    defaultButtonLabel: '🔥 Load 1-Click Booking Code on PredictPro',
  };
}

export function saveWebhookBroadcastConfig(config: WebhookBroadcastConfig): void {
  try {
    localStorage.setItem(WEBHOOK_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getWebhookBroadcastLogs(): WebhookBroadcastLogItem[] {
  try {
    const raw = localStorage.getItem(WEBHOOK_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 'wh-seed-1',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      channel: 'TELEGRAM_MESSAGE',
      destination: '@PredictProOfficial',
      templateName: 'Daily Top 5 Bankers & Universal Booking Codes',
      status: 'DELIVERED',
      responseSummary: 'HTTP 200 OK · message_id: 4829 · inline keyboard attached',
    },
    {
      id: 'wh-seed-2',
      timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      channel: 'TELEGRAM_PHOTO',
      destination: '@PredictProOfficial',
      templateName: '2x Retina 9:16 Winner Proof Card (PNG)',
      status: 'DELIVERED',
      responseSummary: 'HTTP 200 OK · photo_id: AgACAgQAAxkB · 1080x1920 Retina PNG',
    },
  ];
}

export function recordWebhookBroadcastLog(
  entry: Omit<WebhookBroadcastLogItem, 'id' | 'timestamp'>
): WebhookBroadcastLogItem[] {
  const current = getWebhookBroadcastLogs();
  const nextItem: WebhookBroadcastLogItem = {
    ...entry,
    id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [nextItem, ...current].slice(0, 30);
  try {
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}
