import { Prediction, getConfidence } from '@/types/prediction';
import { calculateMatchXG, calculatePropsMetrics } from '@/utils/predictiveEngine';
import { isPlayedOrPastMatch, matchesDateFilter } from '@/lib/dateFilterUtils';

export type BestBetMarketScope = 'all' | '1x2' | 'goals';

export interface DailyBestBetItem {
  rank: number;
  prediction: Prediction;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  isToday: boolean;
  recommendedMarket: string;
  marketOdds: number;
  poissonConfidence: number;
  poissonProbPct: number;
  impliedProbPct: number;
  evEdgePct: number;
  homeXG: number;
  awayXG: number;
  totalXG: number;
  topScoreline: string;
  topScorelineProbPct: number;
}

export function selectDailyTop5BestBets(
  predictions: Prediction[],
  options: {
    marketScope?: BestBetMarketScope;
    minConfidence?: number;
  } = {}
): DailyBestBetItem[] {
  const marketScope = options.marketScope ?? 'all';
  const minConfidence = options.minConfidence ?? 65;

  const activeFixtures = predictions.filter(
    (p) => p && p.home_team && p.away_team && !isPlayedOrPastMatch(p)
  );
  if (activeFixtures.length === 0) return [];

  const todayPool = activeFixtures.filter((p) => matchesDateFilter(p.match_date, 'today'));
  const candidatePool = todayPool.length >= 5 ? todayPool : activeFixtures;

  const seenKeys = new Set<string>();
  const scored: DailyBestBetItem[] = [];

  for (const pred of candidatePool) {
    const key = `${pred.home_team.toLowerCase()}|${pred.away_team.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const hOdds = Math.max(1.16, Number(pred.home_odds || 1.92));
    const aOdds = Math.max(1.22, Number(pred.away_odds || 3.65));
    const dateKey = String(pred.match_date || '').split('T')[0];
    const xgModel = calculateMatchXG(pred.home_team, pred.away_team, hOdds, aOdds, dateKey);
    const props = calculatePropsMetrics(pred.home_team, pred.away_team, dateKey);
    const topScore = props.topScorelines[0] ?? { score: '2 - 0', probability: 14 };

    const home1X2Prob = Math.max(
      xgModel.homeWinProb,
      Number(pred.home_win_probability || 0)
    );
    const away1X2Prob = Math.max(
      xgModel.awayWinProb,
      Number(pred.away_win_probability || 0)
    );

    const side1X2 =
      home1X2Prob >= away1X2Prob
        ? {
            market: `${pred.home_team} Win`,
            odds: hOdds,
            prob: xgModel.homeWinProb,
          }
        : {
            market: `${pred.away_team} Win`,
            odds: aOdds,
            prob: xgModel.awayWinProb,
          };

    const over25FairOdds = Number(
      Math.max(1.38, Math.min(2.65, 1 / Math.max(0.28, xgModel.over25Prob / 100))).toFixed(2)
    );
    const bttsFairOdds = Number(
      Math.max(1.42, Math.min(2.60, 1 / Math.max(0.28, xgModel.bttsProb / 100))).toFixed(2)
    );

    const goalsCandidate =
      xgModel.over25Prob >= xgModel.bttsProb
        ? {
            market: 'Over 2.5 Goals',
            odds: over25FairOdds,
            prob: xgModel.over25Prob,
          }
        : {
            market: 'BTTS — Yes',
            odds: bttsFairOdds,
            prob: xgModel.bttsProb,
          };

    let chosen = side1X2;
    if (marketScope === 'goals') {
      chosen = goalsCandidate;
    } else if (marketScope === 'all' && goalsCandidate.prob > side1X2.prob + 4) {
      chosen = goalsCandidate;
    }

    const baseConf = getConfidence(pred) || 74;
    const poissonConfidence = Math.min(
      95,
      Math.max(58, Math.round(chosen.prob * 0.52 + baseConf * 0.48 + (xgModel.totalXG >= 2.6 ? 3 : 0)))
    );

    const impliedProbPct = Number(((1 / chosen.odds) * 100).toFixed(1));
    const evEdgePct = Number((chosen.prob - impliedProbPct).toFixed(1));

    scored.push({
      rank: 0,
      prediction: pred,
      homeTeam: pred.home_team,
      awayTeam: pred.away_team,
      league: pred.league,
      matchDate: pred.match_date,
      isToday: matchesDateFilter(pred.match_date, 'today'),
      recommendedMarket: chosen.market,
      marketOdds: Number(chosen.odds.toFixed(2)),
      poissonConfidence,
      poissonProbPct: chosen.prob,
      impliedProbPct,
      evEdgePct,
      homeXG: xgModel.homeXG,
      awayXG: xgModel.awayXG,
      totalXG: xgModel.totalXG,
      topScoreline: topScore.score,
      topScorelineProbPct: topScore.probability,
    });
  }

  return scored
    .filter((item) => item.poissonConfidence >= minConfidence)
    .sort((a, b) => {
      if (b.isToday !== a.isToday) return Number(b.isToday) - Number(a.isToday);
      if (b.poissonConfidence !== a.poissonConfidence) return b.poissonConfidence - a.poissonConfidence;
      return b.evEdgePct - a.evEdgePct;
    })
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));
}
