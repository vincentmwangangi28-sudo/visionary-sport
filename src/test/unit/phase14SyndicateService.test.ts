import { describe, it, expect } from 'vitest';
import {
  computeRolloverLadder,
  calculateAsianQuarterMatrix,
  calculateSyndicateShareSplit,
  computeCornerPoissonProbabilities,
} from '@/services/phase14SyndicateService';

describe('Phase 14 Quantitative Syndicate & Bankroll Engines', () => {
  it('computes compound rollover ladder with partial profit skimming accurately', () => {
    const res = computeRolloverLadder(1000, 5, 20, 1.5);
    expect(res.rows).toHaveLength(5);
    // Day 1: 1000 * 1.5 = 1500 gross, 500 profit, 20% skimmed = 100 safe, 1400 next stake
    expect(res.rows[0].startingStake).toBe(1000);
    expect(res.rows[0].grossReturn).toBe(1500);
    expect(res.rows[0].skimmedBankedThisStep).toBe(100);
    expect(res.rows[0].nextStepReinvestedStake).toBe(1400);
    expect(res.totalSkimmedSafe).toBeGreaterThan(400);
    expect(res.grandTotalEquity).toBeGreaterThan(res.finalReinvestedPot);
  });

  it('calculates quarter-ball Asian Handicap -0.25 and -0.75 split outcomes accurately', () => {
    const ah025 = calculateAsianQuarterMatrix('AH -0.25', 100, 1.9);
    expect(ah025.halfStakeA).toBe(50);
    expect(ah025.halfStakeB).toBe(50);
    // Draw on -0.25 -> Leg A (0.0) PUSH (50 returned), Leg B (-0.5) LOSS (0) -> Net -50 (-50% ROI)
    const drawScenario = ah025.scenarios.find((s) => s.overallOutcome === 'HALF LOSS');
    expect(drawScenario).toBeDefined();
    expect(drawScenario?.grossReturn).toBe(50);
    expect(drawScenario?.netProfit).toBe(-50);

    const ah075 = calculateAsianQuarterMatrix('AH -0.75', 100, 1.9);
    // 1-0 Win on -0.75 -> Leg A (-0.5) WIN (95), Leg B (-1.0) PUSH (50) -> Gross 145, Net +45 (+45% ROI)
    const halfWinScenario = ah075.scenarios.find((s) => s.overallOutcome === 'HALF WIN');
    expect(halfWinScenario).toBeDefined();
    expect(halfWinScenario?.grossReturn).toBe(145);
    expect(halfWinScenario?.netProfit).toBe(45);
  });

  it('calculates 17-game jackpot syndicate permutation lines and proportional equity', () => {
    // 6 doubles (2^6 = 64) * 1 triple (3^1 = 3) = 192 lines
    const split = calculateSyndicateShareSplit(6, 1, 100, 4800);
    expect(split.totalLines).toBe(192);
    expect(split.totalPoolCost).toBe(19200);
    expect(split.ownershipSharePct).toBe(25);
    expect(split.linesFundedEquivalent).toBe(48);
  });

  it('computes corner Poisson probabilities for Over 8.5 / 9.5 / 10.5 and 1H Over 4.5', () => {
    const probs = computeCornerPoissonProbabilities(11.0, 0.46);
    expect(probs.expectedTotalCorners).toBe(11);
    expect(probs.over85ProbPct).toBeGreaterThan(probs.over95ProbPct);
    expect(probs.over95ProbPct).toBeGreaterThan(probs.over105ProbPct);
    expect(probs.firstHalfOver45ProbPct).toBeGreaterThan(40);
  });
});
