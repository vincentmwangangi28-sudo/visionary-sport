import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GeoRegionProvider } from '@/hooks/useGeoRegion';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { BetSlipProvider } from '@/hooks/useBetSlip';
import { DailyTopFiveBestBets } from '@/components/DailyTopFiveBestBets';
import { selectDailyTop5BestBets } from '@/services/topSiteIntelEngine';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
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

function renderDailyTop5() {
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
                  <DailyTopFiveBestBets />
                </BetSlipProvider>
              </CurrencyProvider>
            </GeoRegionProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Daily Top 5 Best Bets (Bivariate Poisson Model)', () => {
  it('filters active high-probability fixtures, excludes finished matches, and ranks top 5 descending by Poisson confidence', () => {
    const defaultPool = getUpdatedDefaultPredictions();
    const withFinishedFixture: Prediction[] = [
      {
        ...defaultPool[0],
        id: 'finished-match-ignore',
        home_team: 'Finished FC',
        away_team: 'Ended United',
        match_date: new Date(Date.now() - 3600_000 * 6).toISOString(),
        status: 'FT',
        confidence: 99,
      },
      ...defaultPool,
    ];

    const top5 = selectDailyTop5BestBets(withFinishedFixture, {
      marketScope: 'all',
      minConfidence: 65,
    });

    expect(top5).toHaveLength(5);
    expect(top5.some((item) => item.homeTeam === 'Finished FC')).toBe(false);

    for (let i = 0; i < top5.length; i++) {
      expect(top5[i].rank).toBe(i + 1);
      expect(top5[i].poissonConfidence).toBeGreaterThanOrEqual(65);
      expect(top5[i].homeXG).toBeGreaterThan(0);
      expect(top5[i].awayXG).toBeGreaterThan(0);
      if (i > 0) {
        if (top5[i - 1].isToday === top5[i].isToday) {
          expect(top5[i - 1].poissonConfidence).toBeGreaterThanOrEqual(top5[i].poissonConfidence);
        }
      }
    }

    const goalsOnly = selectDailyTop5BestBets(withFinishedFixture, {
      marketScope: 'goals',
      minConfidence: 65,
    });
    expect(goalsOnly.length).toBeGreaterThan(0);
    expect(
      goalsOnly.every(
        (item) => item.recommendedMarket === 'Over 2.5 Goals' || item.recommendedMarket === 'BTTS — Yes'
      )
    ).toBe(true);
  });

  it('renders Daily Top 5 Best Bets on the homepage section with market/confidence filters and Add Pick interaction', () => {
    renderDailyTop5();

    expect(screen.getByRole('heading', { name: /Daily Top 5 Best Bets/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Poisson Conf\./i)).toHaveLength(5);

    const goalsBtn = screen.getByRole('button', { name: /Goals & BTTS/i });
    fireEvent.click(goalsBtn);
    expect(goalsBtn).toHaveAttribute('aria-pressed', 'true');

    const oneX2Btn = screen.getByRole('button', { name: /1X2 Result/i });
    fireEvent.click(oneX2Btn);
    expect(oneX2Btn).toHaveAttribute('aria-pressed', 'true');

    const conf80Btn = screen.getByRole('button', { name: /80%\+/i });
    fireEvent.click(conf80Btn);
    expect(conf80Btn).toHaveAttribute('aria-pressed', 'true');

    const conf65Btn = screen.getByRole('button', { name: /65%\+/i });
    fireEvent.click(conf65Btn);

    const addButtons = screen.getAllByRole('button', { name: /Add Pick/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);
    expect(screen.getAllByRole('button', { name: /In Slip/i }).length).toBeGreaterThanOrEqual(1);
  });
});
