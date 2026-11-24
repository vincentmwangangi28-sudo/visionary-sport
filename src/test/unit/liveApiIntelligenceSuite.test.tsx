import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GeoRegionProvider } from '@/hooks/useGeoRegion';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { BetSlipProvider } from '@/hooks/useBetSlip';
import { LiveApiIntelligenceSuite } from '@/components/LiveApiIntelligenceSuite';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { handleFootballRequest } from '@/server/footballHandler';
import type { Prediction } from '@/types/prediction';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

const SEEDED_MATCHES: Prediction[] = [
  {
    id: 'live-seed-1',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    match_date: new Date(Date.now() + 3600_000 * 3).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 80,
    confidence_score: 80,
    home_odds: 1.82,
    draw_odds: 3.55,
    away_odds: 4.2,
    home_win_probability: 54,
    draw_probability: 24,
    away_win_probability: 22,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
];

function renderSuite(initialTab: Parameters<typeof LiveApiIntelligenceSuite>[0]['initialTab'] = 'leaders') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

  queryClient.setQueryData(
    ['predictions', 'list', 'all'],
    {
      allPredictions: SEEDED_MATCHES,
      total: SEEDED_MATCHES.length,
      isRealTime: true,
    },
    { updatedAt: Date.now() + 60_000 }
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <UserPreferencesProvider>
            <GeoRegionProvider>
              <CurrencyProvider>
                <BetSlipProvider>
                  <LiveApiIntelligenceSuite initialTab={initialTab} />
                </BetSlipProvider>
              </CurrencyProvider>
            </GeoRegionProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Today Match Slate & LiveApiIntelligenceSuite', () => {
  it('returns an empty array from getUpdatedDefaultPredictions so fake/stale fixtures are never seeded', () => {
    const all = getUpdatedDefaultPredictions();
    expect(Array.isArray(all)).toBe(true);
    expect(all).toHaveLength(0);
  });

  it('gracefully serves structured JSON arrays for news, leaders, injuries, and referees endpoints even offline without crashing', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Offline test env')) as unknown as typeof fetch;

    try {
      const [news, leaders, injuries, referees] = await Promise.all([
        handleFootballRequest({ type: 'news', league: 'EPL' }),
        handleFootballRequest({ type: 'leaders', league: 'EPL' }),
        handleFootballRequest({ type: 'injuries', league: 'EPL' }),
        handleFootballRequest({ type: 'referees', league: 'EPL' }),
      ]);

      expect(news.success).toBe(true);
      expect(Array.isArray(news.articles)).toBe(true);

      expect(leaders.success).toBe(true);
      expect(Array.isArray(leaders.leaders)).toBe(true);

      expect(injuries.success).toBe(true);
      expect(Array.isArray(injuries.injuries)).toBe(true);

      expect(referees.success).toBe(true);
      expect(Array.isArray(referees.referees)).toBe(true);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('renders LiveApiIntelligenceSuite and switches cleanly across all intelligence tabs', () => {
    renderSuite('leaders');

    expect(screen.getByText(/Complete Matchday API Intelligence/i)).toBeInTheDocument();

    const tabLabels = [
      /Extended Markets/i,
      /Injuries & Suspensions/i,
      /Win Probability & Momentum/i,
      /Referee Card & PK Analyzer/i,
      /Club Schedule & Form Hub/i,
      /Knockout Brackets/i,
      /Live News & Transfers/i,
    ];

    for (const label of tabLabels) {
      const tabBtn = screen.getByRole('tab', { name: label });
      fireEvent.click(tabBtn);
      expect(tabBtn).toHaveAttribute('aria-selected', 'true');
    }
  });
});
