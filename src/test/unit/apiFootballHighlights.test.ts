import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getApiFootballApiKey,
  saveApiFootballApiKey,
  extractIframeSrc,
  buildOfficialPreviewUrl,
  fetchApiFootballHighlights,
  testApiFootballHighlightsConnection,
} from '@/services/apiFootballHighlights';

describe('API-Football Highlights Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/highlights')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              source: 'espn_live_results',
              count: 2,
              highlights: [
                {
                  id: 'srv-fin-1',
                  title: 'Real Madrid 2 - 0 Villarreal Match Highlights & Goals',
                  competition: 'La Liga',
                  date: new Date().toISOString(),
                  homeTeam: 'Real Madrid',
                  awayTeam: 'Villarreal',
                  homeScore: 2,
                  awayScore: 0,
                  thumbnail: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
                },
                {
                  id: 'srv-fin-2',
                  title: 'Arsenal 2 - 1 Chelsea Match Highlights & Goals',
                  competition: 'Premier League',
                  date: new Date().toISOString(),
                  homeTeam: 'Arsenal',
                  awayTeam: 'Chelsea',
                  homeScore: 2,
                  awayScore: 1,
                  thumbnail: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
                },
              ],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ response: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('manages API-Football credentials in storage', () => {
    expect(getApiFootballApiKey()).toBe('');
    saveApiFootballApiKey('test-api-football-key-12345');
    expect(getApiFootballApiKey()).toBe('test-api-football-key-12345');

    saveApiFootballApiKey('');
    expect(getApiFootballApiKey()).toBe('');
  });

  it('extracts iframe src from raw embed html', () => {
    const rawHtml = '<iframe src="https://www.scorebat.com/embed/g/12345/?token=test" width="100%" height="100%"></iframe>';
    const extracted = extractIframeSrc(rawHtml);
    expect(extracted).toBe('https://www.scorebat.com/embed/g/12345/?token=test');

    const protocolRelativeHtml = '<iframe src="//www.youtube.com/embed/abc123xyz"></iframe>';
    expect(extractIframeSrc(protocolRelativeHtml)).toBe('https://www.youtube.com/embed/abc123xyz');

    expect(extractIframeSrc('')).toBe('');
    expect(extractIframeSrc(undefined)).toBe('');
  });

  it('builds official preview URL dynamically for matches', () => {
    const embedUrl = buildOfficialPreviewUrl('Arsenal', 'Chelsea', 'Premier League', 2026);
    expect(embedUrl).toContain('https://www.youtube-nocookie.com/embed');
    expect(embedUrl).toContain('Arsenal');
    expect(embedUrl).toContain('Chelsea');
    expect(embedUrl).toContain('rel=0');
  });

  it('fetches highlights and returns structured match video previews', async () => {
    const highlights = await fetchApiFootballHighlights({ limit: 6, forceRefresh: true });
    expect(Array.isArray(highlights)).toBe(true);
    expect(highlights.length).toBeGreaterThan(0);

    const first = highlights[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('embedUrl');
    expect(first).toHaveProperty('videoUrl');
    expect(first).toHaveProperty('thumbnail');
    expect(first).toHaveProperty('homeTeam');
    expect(first).toHaveProperty('awayTeam');
    expect(first).toHaveProperty('competition');
    expect(typeof first.embedUrl).toBe('string');
  });

  it('filters highlights by competition correctly', async () => {
    const laLigaMatches = await fetchApiFootballHighlights({
      competition: 'La Liga',
      limit: 10,
      forceRefresh: true,
    });
    expect(Array.isArray(laLigaMatches)).toBe(true);
    for (const match of laLigaMatches) {
      const compLower = match.competition.toLowerCase();
      expect(compLower.includes('la liga') || compLower.includes('laliga')).toBe(true);
    }
  });

  it('filters highlights by search query correctly', async () => {
    const searchResults = await fetchApiFootballHighlights({
      search: 'Madrid',
      limit: 10,
      forceRefresh: true,
    });
    expect(Array.isArray(searchResults)).toBe(true);
    expect(searchResults.length).toBeGreaterThan(0);
    expect(
      searchResults.some(
        m =>
          m.homeTeam.includes('Madrid') ||
          m.awayTeam.includes('Madrid') ||
          m.title.includes('Madrid')
      )
    ).toBe(true);
  });

  it('tests connection and reports telemetry successfully', async () => {
    const result = await testApiFootballHighlightsConnection();
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});
