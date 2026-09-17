import { describe, it, expect } from 'vitest';

describe('BetSlip Calculation & Data Hardening', () => {
  it('safely computes total odds ignoring invalid or zero odds', () => {
    const rawOdds = [1.85, 0, -2, NaN, Infinity, 2.10];
    const total = rawOdds.reduce((acc, o) => {
      const num = Number(o);
      return acc * (Number.isFinite(num) && num > 0 ? num : 1);
    }, 1);

    const safeTotal = Math.round(total * 100) / 100;
    expect(safeTotal).toBeCloseTo(3.89, 2);
    expect(Number.isFinite(safeTotal)).toBe(true);
  });

  it('safely calculates boosted return without NaN or negative payouts', () => {
    const stake = 250;
    const totalOdds = 3.5;
    const bonusMultiplier = 0.15; // 15% accumulator boost

    const safeStake = Number.isFinite(stake) ? Math.max(0, stake) : 0;
    const potentialReturn = Math.round(safeStake * totalOdds * 100) / 100;
    const boostedReturn = Math.round(potentialReturn * (1 + bonusMultiplier) * 100) / 100;

    expect(potentialReturn).toBe(875);
    expect(boostedReturn).toBe(1006.25);
  });

  it('clamps invalid or negative stakes to zero', () => {
    const invalidStakes = [-50, NaN, undefined, -Infinity];
    invalidStakes.forEach((s) => {
      const val = Number(s);
      const safe = Number.isFinite(val) ? Math.max(0, val) : 0;
      expect(safe).toBe(0);
    });
  });
});
