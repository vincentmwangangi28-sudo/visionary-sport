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

function renderSuite(initialTab: Parameters<typeof LiveApiIntelligenceSuite>[0]['initialTab'] = 'leaders') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

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
  it('guarantees at least 14 today matches and 36 upcoming fixtures in default slate', () => {
    const all = getUpdatedDefaultPredictions();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayMatches = all.filter((m) => {
      const t = new Date(m.match_date).getTime();
      return t >= todayStart.getTime() && t <= todayEnd.getTime();
    });

    expect(all.length).toBeGreaterThanOrEqual(36);
    expect(todayMatches.length).toBeGreaterThanOrEqual(14);
  });

  it('serves structured JSON responses for news, leaders, injuries, and referees endpoints even offline', async () => {
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
      expect(news.articles.length).toBeGreaterThan(0);

      expect(leaders.success).toBe(true);
      expect(Array.isArray(leaders.leaders)).toBe(true);
      expect(leaders.leaders.length).toBeGreaterThan(0);

      expect(injuries.success).toBe(true);
      expect(Array.isArray(injuries.injuries)).toBe(true);
      expect(injuries.injuries.length).toBeGreaterThan(0);

      expect(referees.success).toBe(true);
      expect(Array.isArray(referees.referees)).toBe(true);
      expect(referees.referees.length).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('renders LiveApiIntelligenceSuite and switches cleanly across all 8 intelligence tabs', () => {
    renderSuite('leaders');

    expect(screen.getByText(/Complete Matchday API Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Erling Haaland/i)).toBeInTheDocument();

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
