import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeLeagueId,
  getTeamLogoWithLeague,
  fetchAndCacheTeamLogoByLeague,
  preloadLeagueTeamLogos,
  clearTeamLogosCache,
} from '@/services/teamLogos';

describe('League-Aware Team Logo Caching Service', () => {
  beforeEach(() => {
    clearTeamLogosCache();
  });

  describe('normalizeLeagueId', () => {
    it('returns numeric IDs unchanged', () => {
      expect(normalizeLeagueId(39)).toBe(39);
      expect(normalizeLeagueId(140)).toBe(140);
      expect(normalizeLeagueId(78)).toBe(78);
    });

    it('parses numeric strings into integers', () => {
      expect(normalizeLeagueId('39')).toBe(39);
      expect(normalizeLeagueId('140')).toBe(140);
    });

    it('maps league names to canonical IDs', () => {
      expect(normalizeLeagueId('Premier League')).toBe(39);
      expect(normalizeLeagueId('EPL')).toBe(39);
      expect(normalizeLeagueId('La Liga')).toBe(140);
      expect(normalizeLeagueId('Bundesliga')).toBe(78);
      expect(normalizeLeagueId('Serie A')).toBe(135);
      expect(normalizeLeagueId('Ligue 1')).toBe(61);
      expect(normalizeLeagueId('Champions League')).toBe(2);
      expect(normalizeLeagueId('Kenyan Premier League')).toBe(276);
      expect(normalizeLeagueId('KPL')).toBe(276);
      expect(normalizeLeagueId('MLS')).toBe(253);
    });

    it('handles empty and null values gracefully', () => {
      expect(normalizeLeagueId(null)).toBeNull();
      expect(normalizeLeagueId(undefined)).toBeNull();
      expect(normalizeLeagueId('')).toBeNull();
    });
  });

  describe('getTeamLogoWithLeague', () => {
    it('returns official logo for Premier League teams when league ID 39 is provided', () => {
      const logo = getTeamLogoWithLeague('Arsenal', 39);
      expect(logo).toBeTruthy();
      expect(logo).toContain('espncdn.com');
    });

    it('resolves team using league name string', () => {
      const logo = getTeamLogoWithLeague('Manchester City', 'Premier League');
      expect(logo).toBeTruthy();
      expect(logo).toContain('espncdn.com');
    });

    it('resolves Spanish clubs accurately in La Liga (140)', () => {
      const logo = getTeamLogoWithLeague('Real Madrid', 140);
      expect(logo).toBeTruthy();
      expect(logo).toContain('api-sports.io');
    });

    it('resolves Kenyan clubs in KPL (276)', () => {
      const logo = getTeamLogoWithLeague('Gor Mahia', 'KPL');
      expect(logo).toBeTruthy();
    });

    it('respects external custom logo if provided', () => {
      const customUrl = 'https://custom-cdn.example.com/crest.png';
      const logo = getTeamLogoWithLeague('Unknown Team', 39, customUrl);
      expect(logo).toBe(customUrl);
    });

    it('returns canonical fallback when league is not provided or unknown', () => {
      const logo = getTeamLogoWithLeague('Liverpool', null);
      expect(logo).toBeTruthy();
    });
  });

  describe('fetchAndCacheTeamLogoByLeague', () => {
    it('intelligently fetches and caches team logo for a given league', async () => {
      const logo = await fetchAndCacheTeamLogoByLeague('Chelsea', 39);
      expect(logo).toBeTruthy();
      expect(logo).toContain('espncdn.com');

      // Subsequent synchronous call hits memory cache
      const cached = getTeamLogoWithLeague('Chelsea', 39);
      expect(cached).toBe(logo);
    });

    it('resolves fuzzy matches across known league standings', async () => {
      const logo = await fetchAndCacheTeamLogoByLeague('Dortmund', 78);
      expect(logo).toBeTruthy();
      expect(logo).toContain('api-sports.io');
    });
  });

  describe('preloadLeagueTeamLogos', () => {
    it('pre-warms all logos for an entire league in batch', async () => {
      const preloaded = await preloadLeagueTeamLogos(39);
      const teams = Object.keys(preloaded);

      expect(teams.length).toBeGreaterThanOrEqual(18);
      expect(preloaded['Arsenal']).toBeTruthy();
      expect(preloaded['Manchester City']).toBeTruthy();
      expect(preloaded['Liverpool']).toBeTruthy();

      // Ensure every team is now available in memory cache
      const cachedArsenal = getTeamLogoWithLeague('Arsenal', 39);
      expect(cachedArsenal).toBe(preloaded['Arsenal']);
    });

    it('handles non-existent league IDs without throwing', async () => {
      const preloaded = await preloadLeagueTeamLogos(99999);
      expect(preloaded).toEqual({});
    });
  });
});
