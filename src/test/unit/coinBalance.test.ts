import { describe, it, expect } from 'vitest';
function applyCoins(current: number, toAdd: number): number {
  if (toAdd < 0) throw new Error('Cannot add negative coins');
  return current + toAdd;
}
describe('Coin balance', () => {
  it('adds coins', () => expect(applyCoins(100, 50)).toBe(150));
  it('handles zero', () => expect(applyCoins(100, 0)).toBe(100));
  it('throws on negative', () => expect(() => applyCoins(100, -10)).toThrow());
});
