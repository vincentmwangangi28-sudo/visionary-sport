import { describe, it, expect } from 'vitest';
import {
  computeCashOutEquityAudit,
  computeRefereeCardPoissonMatrix,
  computePlayerPropPoissonMatrix,
  computeSystemBetPermutations,
} from '@/services/phase15PropSystemService';

describe('phase15PropSystemService mathematical engines', () => {
  it('computes Cash-Out Equity Audit, bookmaker haircut percentage, and DIY counter-hedge profit', () => {
    const res = computeCashOutEquityAudit({
      originalStake: 20,
      totalTicketOdds: 15.17,
      remainingUnplayedOdds: 1.85,
      bookieCashOutOffer: 132,
      oppositeHedgeOdds: 2.04,
      bookieMarginPct: 5.5,
    });

    expect(res.potentialMaxPayout).toBeCloseTo(303.4, 1);
    expect(res.fairMathematicalEquity).toBeGreaterThan(150);
    expect(res.bookieHaircutPct).toBeGreaterThan(10);
    expect(res.diyHedgeStake).toBeCloseTo(148.73, 1);
    expect(res.diyHedgeGuaranteedProfit).toBeGreaterThan(res.cashOutNetProfit);
    expect(res.optimalRecommendation).toBe('DIY_HEDGE');
  });

  it('computes Referee Discipline Card & Booking Points Poisson projections', () => {
    const res = computeRefereeCardPoissonMatrix({
      refereeYellowsPer90: 5.42,
      refereeRedsPer90: 0.31,
      homeAggressionIndex: 1.18,
      awayAggressionIndex: 1.24,
      isDerbyOrKnockout: true,
      bookieOddsOver35Cards: 1.36,
      bookieOddsOver45Cards: 1.74,
      bookieOddsOver55Cards: 2.28,
      bookieOddsRedCardYes: 3.45,
    });

    expect(res.expectedTotalCards).toBeGreaterThan(6.5);
    expect(res.expectedBookingPoints).toBeGreaterThan(65);
    expect(res.markets).toHaveLength(4);
    expect(res.markets[0].modelProbPct).toBeGreaterThan(res.markets[1].modelProbPct);
    expect(res.markets[1].modelProbPct).toBeGreaterThan(res.markets[2].modelProbPct);
  });

  it('computes Player Shots on Target (1+ / 2+ SoT) and Goalscorer Poisson probabilities', () => {
    const res = computePlayerPropPoissonMatrix({
      sotPer90: 2.38,
      nonPenaltyXgPer90: 0.89,
      expectedMinutes: 90,
      opponentDefenseMultiplier: 1.18,
      isPenaltyTaker: true,
      bookieOdds1PlusSot: 1.18,
      bookieOdds2PlusSot: 1.68,
      bookieOddsAnytimeGoal: 1.65,
    });

    expect(res.adjustedLambdaSot).toBeGreaterThan(2.5);
    expect(res.adjustedLambdaGoal).toBeGreaterThan(1.1);
    expect(res.prob1PlusSotPct).toBeGreaterThan(res.prob2PlusSotPct);
    expect(res.prob2PlusSotPct).toBeGreaterThan(res.prob3PlusSotPct);
    expect(res.fairOdds2PlusSot).toBeGreaterThan(1.0);
  });

  it('computes System Bet permutations and fault-tolerance payout table for Yankee (11 bets)', () => {
    const res = computeSystemBetPermutations('yankee', 5, [
      { id: 1, label: 'Pick 1', odds: 2.0, status: 'won' },
      { id: 2, label: 'Pick 2', odds: 2.0, status: 'won' },
      { id: 3, label: 'Pick 3', odds: 2.0, status: 'won' },
      { id: 4, label: 'Pick 4', odds: 2.0, status: 'lost' },
    ]);

    expect(res.totalCombinations).toBe(11);
    expect(res.totalOutlay).toBe(55);
    // 3 winning legs out of 4 in a Yankee means 3 Doubles (each 4x * 5 = 20 => 60) + 1 Treble (8x * 5 = 40) = 100 gross
    expect(res.winningBetsCount).toBe(4);
    expect(res.grossReturn).toBe(100);
    expect(res.netProfit).toBe(45);
    expect(res.faultToleranceTable.length).toBeGreaterThanOrEqual(3);
  });
});
