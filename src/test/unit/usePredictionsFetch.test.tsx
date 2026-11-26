import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

async function renderPredictionsProbe() {
  const { usePredictions } = await import('@/hooks/usePredictions');
  function PredictionsProbe() {
    const { allPredictions, loading } = usePredictions(1);
    return (
      <div>
        <span data-testid="loading">{String(loading)}</span>
        <span data-testid="count">{allPredictions.length}</span>
        {allPredictions.map((p) => (
          <span key={p.id} data-testid="fixture">
            {p.home_team} vs {p.away_team}
          </span>
        ))}
      </div>
    );
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PredictionsProbe />
    </QueryClientProvider>
  );
}

describe('usePredictions initial mount fetching', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches real upcoming fixtures immediately on mount when localStorage is empty without waiting for user interaction', async () => {
    const futureIso = new Date(Date.now() + 4 * 3600_000).toISOString();
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/football?type=upcoming')) {
        return new Response(
          JSON.stringify({
            success: true,
            type: 'upcoming',
            count: 2,
            fixtures: [
              {
                id: 'espn-real-1001',
                match_id: 'match-1001',
                home_team: 'Arsenal',
                away_team: 'Chelsea',
                league: 'Premier League',
                match_date: futureIso,
                prediction: 'Home Win',
                predicted_outcome: 'Home Win',
                confidence: 82,
                confidence_score: 82,
                home_odds: 1.8,
                draw_odds: 3.5,
                away_odds: 4.3,
                status: 'pending',
                is_premium: false,
                is_realtime: true,
                created_at: new Date().toISOString(),
              },
              {
                id: 'espn-real-1002',
                match_id: 'match-1002',
                home_team: 'Barcelona',
                away_team: 'Sevilla',
                league: 'La Liga',
                match_date: futureIso,
                prediction: 'Home Win',
                predicted_outcome: 'Home Win',
                confidence: 79,
                confidence_score: 79,
                home_odds: 1.65,
                draw_odds: 3.9,
                away_odds: 5.0,
                status: 'pending',
                is_premium: false,
                is_realtime: true,
                created_at: new Date().toISOString(),
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return new Response('{}', { status: 404 });
    });

    await renderPredictionsProbe();

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('2');
    });

    expect(screen.getAllByTestId('fixture')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/football?type=upcoming',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('falls back to direct ESPN handler when /api/football returns empty or offline payload', async () => {
    const futureIso = new Date(Date.now() + 5 * 3600_000).toISOString();
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/football?type=upcoming')) {
        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            fixtures: [],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      if (url.includes('site.api.espn.com')) {
        return new Response(
          JSON.stringify({
            events: [
              {
                id: '998877',
                date: futureIso,
                uid: 's:600~l:700~e:998877',
                status: { type: { state: 'pre', completed: false } },
                competitions: [
                  {
                    competitors: [
                      { homeAway: 'home', team: { id: '1', displayName: 'Liverpool' } },
                      { homeAway: 'away', team: { id: '2', displayName: 'Everton' } },
                    ],
                  },
                ],
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return new Response('{}', { status: 404 });
    });

    await renderPredictionsProbe();

    await waitFor(() => {
      expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByTestId('fixture')[0].textContent).toContain('Liverpool vs Everton');
  });

  it('never caches empty arrays or empty matches/fixtures payloads in footballDataCache', async () => {
    const {
      fetchWithCacheAndDeduplication,
      getFootballCache,
      setFootballCache,
    } = await import('@/services/footballDataCache');

    setFootballCache('empty_arr_test', [], 60_000);
    setFootballCache('empty_matches_test', { matches: [], source: 'live_feed' }, 60_000);
    setFootballCache('empty_fixtures_test', { fixtures: [], offline: true }, 60_000);

    expect(getFootballCache('empty_arr_test')).toBeNull();
    expect(getFootballCache('empty_matches_test')).toBeNull();
    expect(getFootballCache('empty_fixtures_test')).toBeNull();

    let calls = 0;
    const res1 = await fetchWithCacheAndDeduplication('dedup_empty_live', 60_000, async () => {
      calls++;
      return { matches: [] as unknown[] };
    });
    expect(res1.matches).toHaveLength(0);

    const res2 = await fetchWithCacheAndDeduplication('dedup_empty_live', 60_000, async () => {
      calls++;
      return { matches: [{ id: 'real-1' }] };
    });
    expect(calls).toBe(2);
    expect(res2.matches).toHaveLength(1);
  });
});
