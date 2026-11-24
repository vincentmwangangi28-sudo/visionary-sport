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

const SAMPLE_FIXTURES: Prediction[] = [
  {
    id: 'fx-1',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    match_date: new Date(Date.now() + 3600_000 * 2).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 86,
    confidence_score: 86,
    home_odds: 1.78,
    draw_odds: 3.6,
    away_odds: 4.5,
    home_win_probability: 57,
    draw_probability: 23,
    away_win_probability: 20,
    expected_home_goals: 2.1,
    expected_away_goals: 0.9,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fx-2',
    home_team: 'Real Madrid',
    away_team: 'Villarreal',
    league: 'La Liga',
    match_date: new Date(Date.now() + 3600_000 * 3).toISOString(),
    prediction: 'Over 2.5 Goals',
    predicted_outcome: 'Over 2.5 Goals',
    confidence: 84,
    confidence_score: 84,
    home_odds: 1.55,
    draw_odds: 4.1,
    away_odds: 5.8,
    home_win_probability: 64,
    draw_probability: 20,
    away_win_probability: 16,
    expected_home_goals: 2.4,
    expected_away_goals: 1.1,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fx-3',
    home_team: 'Bayern Munich',
    away_team: 'RB Leipzig',
    league: 'Bundesliga',
    match_date: new Date(Date.now() + 3600_000 * 4).toISOString(),
    prediction: 'BTTS — Yes',
    predicted_outcome: 'BTTS — Yes',
    confidence: 82,
    confidence_score: 82,
    home_odds: 1.68,
    draw_odds: 3.9,
    away_odds: 4.6,
    home_win_probability: 58,
    draw_probability: 22,
    away_win_probability: 20,
    expected_home_goals: 2.3,
    expected_away_goals: 1.4,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fx-4',
    home_team: 'Inter Milan',
    away_team: 'Lazio',
    league: 'Serie A',
    match_date: new Date(Date.now() + 3600_000 * 5).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 79,
    confidence_score: 79,
    home_odds: 1.82,
    draw_odds: 3.55,
    away_odds: 4.3,
    home_win_probability: 55,
    draw_probability: 24,
    away_win_probability: 21,
    expected_home_goals: 1.9,
    expected_away_goals: 0.8,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fx-5',
    home_team: 'Liverpool',
    away_team: 'Newcastle United',
    league: 'Premier League',
    match_date: new Date(Date.now() + 3600_000 * 6).toISOString(),
    prediction: 'Over 2.5 Goals',
    predicted_outcome: 'Over 2.5 Goals',
    confidence: 81,
    confidence_score: 81,
    home_odds: 1.62,
    draw_odds: 4.0,
    away_odds: 5.1,
    home_win_probability: 61,
    draw_probability: 21,
    away_win_probability: 18,
    expected_home_goals: 2.2,
    expected_away_goals: 1.1,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fx-6',
    home_team: 'Gor Mahia',
    away_team: 'Tusker FC',
    league: 'FKF Premier League',
    match_date: new Date(Date.now() + 3600_000 * 7).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 77,
    confidence_score: 77,
    home_odds: 1.88,
    draw_odds: 3.25,
    away_odds: 4.1,
    home_win_probability: 53,
    draw_probability: 27,
    away_win_probability: 20,
    expected_home_goals: 1.7,
    expected_away_goals: 0.7,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
];

function renderDailyTop5() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

  queryClient.setQueryData(
    ['predictions', 'list', 'all'],
    {
      allPredictions: SAMPLE_FIXTURES,
      total: SAMPLE_FIXTURES.length,
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
    const withFinishedFixture: Prediction[] = [
      {
        ...SAMPLE_FIXTURES[0],
        id: 'finished-match-ignore',
        home_team: 'Finished FC',
        away_team: 'Ended United',
        match_date: new Date(Date.now() - 3600_000 * 6).toISOString(),
        status: 'FT',
        confidence: 99,
      },
      ...SAMPLE_FIXTURES,
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
