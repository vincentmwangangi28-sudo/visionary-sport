import { describe, it, expect } from 'vitest';
import {
  buildBaselineTeamNewsReport,
  fetchMatchTeamNewsAndInjuries,
  getFeaturedMatchesForTeamNews,
} from '@/services/teamNewsService';

describe('Team News & Injury Updates Service', () => {
  it('generates structured injury, lineup, and xG adjustment intelligence for featured European matches', () => {
    const report = buildBaselineTeamNewsReport({
      id: 'epl-ars-che',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      league: 'Premier League',
      prediction: 'Home Win',
      confidence: 80,
      home_odds: 1.85,
    });

    expect(report.homeTeam).toBe('Arsenal');
    expect(report.awayTeam).toBe('Chelsea');
    expect(report.homeFormation).toBe('4-3-3');
    expect(report.awayFormation).toBe('4-2-3-1');
    expect(report.injuries.length).toBeGreaterThanOrEqual(4);
    expect(report.injuries.some((i) => i.player === 'Bukayo Saka')).toBe(true);
    expect(report.injuries.some((i) => i.player === 'Cole Palmer')).toBe(true);
    expect(report.homeLineupStrength).toBeGreaterThanOrEqual(70);
    expect(report.adjustedConfidence).toBeGreaterThanOrEqual(58);
    expect(report.adjustedMarketTip).toBeTruthy();
  });

  it('generates authentic club-specific roster intelligence for African continental derbies', async () => {
    const report = await fetchMatchTeamNewsAndInjuries({
      id: 'kpl-gor-afc',
      home_team: 'Gor Mahia',
      away_team: 'AFC Leopards',
      league: 'Kenyan Premier League',
      prediction: 'Home Win',
      confidence: 81,
      home_odds: 1.78,
    });

    expect(report.homeTeam).toBe('Gor Mahia');
    expect(report.awayTeam).toBe('AFC Leopards');
    expect(report.injuries.some((i) => i.player === 'Austin Odhiambo')).toBe(true);
    expect(report.injuries.some((i) => i.player === 'Clifton Miheso')).toBe(true);
    expect(report.lineupNotes).toHaveLength(2);
    expect(report.liveWireItems.length).toBeGreaterThanOrEqual(2);
  });

  it('returns top featured matches for the Team News switcher', () => {
    const featured = getFeaturedMatchesForTeamNews();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured[0].home_team).toBeTruthy();
    expect(featured[0].away_team).toBeTruthy();
  });
});
