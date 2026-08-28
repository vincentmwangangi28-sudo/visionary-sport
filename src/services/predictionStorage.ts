import { Prediction } from '@/types/prediction';

const STORAGE_KEY = 'predictpro_saved_predictions_v3';
const MAX_STORAGE_DAYS = 14;

// In-memory cache for ultra-fast access and SSR/fallback safety
let memoryStore: Record<string, Prediction> = {};
let isHydrated = false;

/**
 * Normalizes a team name for reliable fuzzy and cross-provider matching.
 * E.g., "Arsenal FC" -> "arsenal", "Man United" -> "manchesterunited", "Real Madrid CF" -> "realmadrid"
 */
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  let cleaned = name.toLowerCase().trim();

  // Common nicknames and variations
  cleaned = cleaned
    .replace(/\bmanchester\s+united\b|\bman\s+utd\b|\bman\s+united\b/g, 'manchesterunited')
    .replace(/\bmanchester\s+city\b|\bman\s+city\b/g, 'manchestercity')
    .replace(/\bparis\s+saint[- ]germain\b|\bpsg\b/g, 'psg')
    .replace(/\btottenham\s+hotspur\b|\bspurs\b/g, 'tottenham')
    .replace(/\bwolverhampton\s+wanderers\b|\bwolves\b/g, 'wolves')
    .replace(/\bnewcastle\s+united\b/g, 'newcastle')
    .replace(/\bwest\s+ham\s+united\b/g, 'westham')
    .replace(/\bleicester\s+city\b/g, 'leicester')
    .replace(/\bbrighton\s+&\s+hove\s+albion\b|\bbrighton\b/g, 'brighton')
    .replace(/\batletico\s+madrid\b|\batletico\b/g, 'atleticomadrid')
    .replace(/\breal\s+madrid\b/g, 'realmadrid')
    .replace(/\bbayern\s+munich\b|\bbayern\s+münchen\b/g, 'bayernmunich')
    .replace(/\bborussia\s+dortmund\b|\bdortmund\b/g, 'dortmund')
    .replace(/\binter\s+milan\b|\binternazionale\b/g, 'intermilan')
    .replace(/\bac\s+milan\b/g, 'acmilan')
    .replace(/\bas\s+roma\b/g, 'roma');

  // Strip club acronyms
  cleaned = cleaned
    .replace(/\b(fc|cf|afc|sc|ac|ss|as|united|city|hotspur|wanderers|athletic|club|fk)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  return cleaned || name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns a canonical, deterministic key for any matchup.
 * E.g., "arsenal_vs_chelsea_2026-08-30" or "arsenal_vs_chelsea"
 */
export function getCanonicalMatchKey(home: string, away: string, matchDate?: string): string {
  const h = normalizeTeamName(home);
  const a = normalizeTeamName(away);
  const dateStr = matchDate ? String(matchDate).split('T')[0] : '';
  return dateStr ? `${h}_vs_${a}_${dateStr}` : `${h}_vs_${a}`;
}

/**
 * Generates a stable deterministic hash integer from a string.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Known elite team baseline power ratings (for realistic probability calculation)
 */
const TEAM_POWER_RATINGS: Record<string, number> = {
  manchestercity: 94,
  realmadrid: 93,
  bayernmunich: 91,
  arsenal: 90,
  liverpool: 90,
  barcelona: 89,
  psg: 88,
  intermilan: 87,
  bayerleverkusen: 86,
  atleticomadrid: 85,
  juventus: 84,
  acmilan: 84,
  dortmund: 84,
  tottenham: 83,
  chelsea: 83,
  astonvilla: 82,
  newcastle: 82,
  napoli: 82,
  atalanta: 81,
  roma: 81,
  sportingcp: 81,
  benfica: 80,
  manchesterunited: 80,
};

/**
 * Generates a 100% deterministic, mathematically sound prediction for any fixture.
 * Guarantees that the SAME matchup on the SAME date always generates the IDENTICAL:
 * - Predicted outcome (Home Win, Draw, Away Win)
 * - Confidence score
 * - Odds (Home, Draw, Away)
 * - Tactical analysis & reasoning
 */
export function generateDeterministicPrediction(
  homeTeam: string,
  awayTeam: string,
  league?: string,
  matchDate?: string,
  oddsDetail?: string
): {
  prediction: 'Home Win' | 'Draw' | 'Away Win';
  confidence: number;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  analysis: string;
  reasoning: string;
} {
  const normHome = normalizeTeamName(homeTeam);
  const normAway = normalizeTeamName(awayTeam);
  const dateStr = matchDate ? String(matchDate).split('T')[0] : '2026-08-28';
  const leagueName = league || 'Football Match';

  // Seeded hash for reproducible variance
  const seed = hashString(`${normHome}_vs_${normAway}_${dateStr}`);

  // Base power ratings
  const homePower = TEAM_POWER_RATINGS[normHome] || (72 + (seed % 10));
  const awayPower = TEAM_POWER_RATINGS[normAway] || (72 + ((seed >> 2) % 10));

  // Home advantage factor (+3 power points)
  const homeAdvantage = 3.5;
  const powerDiff = (homePower + homeAdvantage) - awayPower;

  // Base probabilities
  let homeProb = 0.44 + (powerDiff * 0.022);
  let awayProb = 0.28 - (powerDiff * 0.016);
  let drawProb = 0.28 - (Math.abs(powerDiff) * 0.006);

  // If DraftKings line or market odds are provided, anchor with market sentiment
  if (oddsDetail) {
    const detailLower = oddsDetail.toLowerCase();
    if (detailLower.includes('-') && (detailLower.includes(homeTeam.toLowerCase().slice(0, 3)) || detailLower.includes('fav'))) {
      homeProb = Math.max(homeProb, 0.60);
      awayProb = Math.min(awayProb, 0.20);
      drawProb = Math.max(0.15, 1 - homeProb - awayProb);
    } else if (detailLower.includes('-') && detailLower.includes(awayTeam.toLowerCase().slice(0, 3))) {
      awayProb = Math.max(awayProb, 0.58);
      homeProb = Math.min(homeProb, 0.22);
      drawProb = Math.max(0.15, 1 - homeProb - awayProb);
    }
  }

  // Normalize probabilities to sum to 1
  const sumProb = Math.max(0.01, homeProb + drawProb + awayProb);
  homeProb = homeProb / sumProb;
  drawProb = drawProb / sumProb;
  awayProb = awayProb / sumProb;

  // Clamp bounds
  homeProb = Math.min(0.88, Math.max(0.10, homeProb));
  awayProb = Math.min(0.85, Math.max(0.08, awayProb));
  drawProb = Math.min(0.45, Math.max(0.12, drawProb));

  // Pick outcome
  let outcome: 'Home Win' | 'Draw' | 'Away Win' = 'Home Win';
  let bestProb = homeProb;

  if (awayProb > homeProb && awayProb > drawProb) {
    outcome = 'Away Win';
    bestProb = awayProb;
  } else if (drawProb > homeProb && drawProb > awayProb) {
    outcome = 'Draw';
    bestProb = drawProb;
  }

  // Consistent, scaled confidence (62% - 89%)
  const varianceOffset = (seed % 7) - 3;
  const rawConfidence = Math.round(bestProb * 100) + varianceOffset;
  const confidence = Math.min(89, Math.max(62, rawConfidence));

  // Calculated fair odds with 5% margin
  const homeOdds = Number((1 / Math.max(0.08, homeProb) * 0.95).toFixed(2));
  const drawOdds = Number((1 / Math.max(0.08, drawProb) * 0.95).toFixed(2));
  const awayOdds = Number((1 / Math.max(0.08, awayProb) * 0.95).toFixed(2));

  // Tactical analysis templates based on outcome
  let analysis = '';
  let reasoning = '';

  if (outcome === 'Home Win') {
    analysis = `${homeTeam} enter this ${leagueName} fixture with strong home momentum against ${awayTeam}. Statistical modeling highlights superior expected goals (xG) conversion and defensive solidity at home, favoring a ${outcome} (${confidence}% confidence).`;
    reasoning = `Home dominance and midfield pressing metrics favor ${homeTeam} at odds of ${homeOdds}.`;
  } else if (outcome === 'Away Win') {
    analysis = `${awayTeam} demonstrate clinical attacking efficiency on the road, creating favorable transition match-ups against ${homeTeam}. Algorithmic models project ${outcome} with a ${confidence}% confidence index.`;
    reasoning = `Tactical counter-attacking efficiency and recent head-to-head form favor ${awayTeam} at odds of ${awayOdds}.`;
  } else {
    analysis = `${homeTeam} and ${awayTeam} are evenly matched across defensive and possession metrics in the ${leagueName}. Expect a tactical stalemate with high probability of a ${outcome} (${confidence}% confidence).`;
    reasoning = `Balanced squad strength and tight midfield defensive structures indicate Draw value at odds of ${drawOdds}.`;
  }

  return {
    prediction: outcome,
    confidence,
    home_odds: homeOdds,
    draw_odds: drawOdds,
    away_odds: awayOdds,
    analysis,
    reasoning,
  };
}

/**
 * Hydrate storage from localStorage
 */
function hydrateStorage(): Record<string, Prediction> {
  if (isHydrated) return memoryStore;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          memoryStore = parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[PredictionStorage] Failed reading localStorage:', e);
  }

  isHydrated = true;
  return memoryStore;
}

/**
 * Commit memory store to localStorage
 */
function persistStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    }
  } catch (e) {
    console.warn('[PredictionStorage] Failed persisting to localStorage:', e);
  }
}

/**
 * Retrieve all saved predictions
 */
export function getSavedPredictions(): Record<string, Prediction> {
  return hydrateStorage();
}

/**
 * Retrieve all saved predictions as an array
 */
export function getSavedPredictionsList(): Prediction[] {
  const store = hydrateStorage();
  return Object.values(store);
}

/**
 * Look up a saved prediction by match teams and optional date
 */
export function getSavedPrediction(home: string, away: string, matchDate?: string): Prediction | null {
  const store = hydrateStorage();
  const exactKey = getCanonicalMatchKey(home, away, matchDate);
  if (store[exactKey]) return store[exactKey];

  // Try matching without date
  const genericKey = getCanonicalMatchKey(home, away);
  if (store[genericKey]) return store[genericKey];

  // Fuzzy lookup across stored keys
  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);
  for (const pred of Object.values(store)) {
    if (
      (normalizeTeamName(pred.home_team) === normHome || pred.home_team.toLowerCase().includes(home.toLowerCase())) &&
      (normalizeTeamName(pred.away_team) === normAway || pred.away_team.toLowerCase().includes(away.toLowerCase()))
    ) {
      return pred;
    }
  }

  return null;
}

/**
 * Look up a saved prediction by ID
 */
export function getSavedPredictionById(id: string): Prediction | null {
  const store = hydrateStorage();
  for (const pred of Object.values(store)) {
    if (pred.id === id || pred.match_id === id) {
      return pred;
    }
  }
  return null;
}

/**
 * Save and lock a prediction into persistent storage.
 * If overwrite is false, and a prediction for this match already exists,
 * the existing canonical prediction outcome and odds are preserved!
 */
export function savePrediction(pred: Prediction, overwrite = false): Prediction {
  const store = hydrateStorage();
  const key = getCanonicalMatchKey(pred.home_team, pred.away_team, pred.match_date);

  const existing = store[key];
  if (existing && !overwrite) {
    // Preserve the original canonical prediction while merging updated live score/status
    const merged: Prediction = {
      ...pred,
      prediction: existing.prediction || existing.predicted_outcome || pred.prediction,
      predicted_outcome: existing.predicted_outcome || existing.prediction || pred.predicted_outcome,
      confidence: existing.confidence ?? existing.confidence_score ?? pred.confidence,
      confidence_score: existing.confidence_score ?? existing.confidence ?? pred.confidence_score,
      home_odds: existing.home_odds ?? pred.home_odds,
      draw_odds: existing.draw_odds ?? pred.draw_odds,
      away_odds: existing.away_odds ?? pred.away_odds,
      analysis: existing.analysis || pred.analysis,
      reasoning: existing.reasoning || pred.reasoning,
      is_premium: existing.is_premium ?? pred.is_premium,
    };
    store[key] = merged;
    persistStorage();
    return merged;
  }

  // If prediction lacks analysis or is missing deterministic odds, enrich it
  let finalPred = { ...pred };
  if (!finalPred.prediction || finalPred.prediction === 'Unknown' || !finalPred.confidence) {
    const det = generateDeterministicPrediction(
      finalPred.home_team,
      finalPred.away_team,
      finalPred.league,
      finalPred.match_date
    );
    finalPred = {
      ...finalPred,
      prediction: det.prediction,
      predicted_outcome: det.prediction,
      confidence: det.confidence,
      confidence_score: det.confidence,
      home_odds: finalPred.home_odds || det.home_odds,
      draw_odds: finalPred.draw_odds || det.draw_odds,
      away_odds: finalPred.away_odds || det.away_odds,
      analysis: finalPred.analysis || det.analysis,
      reasoning: finalPred.reasoning || det.reasoning,
    };
  }

  store[key] = finalPred;
  persistStorage();
  return finalPred;
}

/**
 * Bulk save predictions into storage with deduplication and consistency locking.
 */
export function savePredictions(preds: Prediction[]): Prediction[] {
  return preds.map(p => savePrediction(p, false));
}

/**
 * Merges an incoming array of match predictions with saved persistent predictions.
 * - If a match was already saved, preserves its canonical prediction outcome, confidence, odds, and analysis.
 * - If a match is new, generates/saves its canonical prediction so future API refreshes never change it.
 */
export function mergeAndPreservePredictions(incomingList: Prediction[]): Prediction[] {
  hydrateStorage();
  const merged: Prediction[] = [];
  const processedKeys = new Set<string>();

  for (const item of incomingList) {
    if (!item.home_team || !item.away_team) continue;

    const key = getCanonicalMatchKey(item.home_team, item.away_team, item.match_date);
    const genericKey = getCanonicalMatchKey(item.home_team, item.away_team);

    if (processedKeys.has(key) || processedKeys.has(genericKey)) {
      continue;
    }
    processedKeys.add(key);
    processedKeys.add(genericKey);

    // Save or preserve prediction
    const saved = savePrediction(item, false);
    merged.push(saved);
  }

  return merged;
}

/**
 * Clean up old expired matches from storage (e.g. matches older than 14 days)
 */
export function cleanupExpiredPredictions() {
  const store = hydrateStorage();
  const cutoff = Date.now() - (MAX_STORAGE_DAYS * 86400000);
  let changed = false;

  for (const [key, pred] of Object.entries(store)) {
    if (pred.match_date) {
      const matchTime = new Date(pred.match_date).getTime();
      if (!isNaN(matchTime) && matchTime < cutoff) {
        delete store[key];
        changed = true;
      }
    }
  }

  if (changed) {
    persistStorage();
  }
}

// Auto-run cleanup on initial import
if (typeof window !== 'undefined') {
  setTimeout(() => cleanupExpiredPredictions(), 3000);
}
