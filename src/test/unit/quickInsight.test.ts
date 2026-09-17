import { describe, it, expect } from 'vitest';
import { getQuickInsight } from '@/services/geminiTasksService';

describe('Gemini Quick Insight Service', () => {
  it('returns structured injury and H2H trend intelligence for a fixture', async () => {
    const result = await getQuickInsight({
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      bypassCache: true,
    });

    expect(result).toBeDefined();
    expect(result.summary).toBeTypeOf('string');
    expect(result.summary.length).toBeGreaterThan(10);
    
    // Check injuries structure
    expect(result.keyInjuries).toBeDefined();
    expect(Array.isArray(result.keyInjuries.home)).toBe(true);
    expect(Array.isArray(result.keyInjuries.away)).toBe(true);
    
    // Check H2H trends
    expect(Array.isArray(result.h2hTrends)).toBe(true);
    expect(result.h2hTrends.length).toBeGreaterThanOrEqual(1);
    expect(result.h2hTrends[0]).toHaveProperty('stat');
    expect(result.h2hTrends[0]).toHaveProperty('trend');
    expect(result.h2hTrends[0]).toHaveProperty('advantage');

    // Check tactical verdict
    expect(result.tacticalVerdict).toBeTypeOf('string');
    expect(result.tacticalVerdict.length).toBeGreaterThan(5);
  });

  it('serves cached insights on repeat requests', async () => {
    const firstCall = await getQuickInsight({
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'La Liga',
      date: '2026-10-25',
    });

    const secondCall = await getQuickInsight({
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'La Liga',
      date: '2026-10-25',
      bypassCache: false,
    });

    expect(secondCall.summary).toEqual(firstCall.summary);
    expect(secondCall.tacticalVerdict).toEqual(firstCall.tacticalVerdict);
  });
});
