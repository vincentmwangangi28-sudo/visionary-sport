import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GeoRegionProvider } from '@/hooks/useGeoRegion';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { UnifiedSearchProvider } from '@/hooks/useUnifiedSearch';
import { BetSlipProvider } from '@/hooks/useBetSlip';
import {
  getInitialOfficialJackpotPools,
  computeJackpotSurvivalProfile,
  optimizeJackpotPicksForBudget,
  generatePlayableSingleLines,
  formatJackpotSmsText,
  JACKPOT_PROVIDERS,
  JackpotExtendedPick,
} from '@/services/jackpotService';
import JackpotPredictions from '@/pages/JackpotPredictions';
import JackpotGeneratorPage from '@/pages/JackpotGeneratorPage';
import MidweekJackpotPredictions from '@/pages/MidweekJackpotPredictions';

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
    } as any;
  }

  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }

  window.scrollTo = () => {};
});

function renderWithProviders(ui: React.ReactElement, initialPath = '/jackpot-predictions') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AuthProvider>
            <UserPreferencesProvider>
              <GeoRegionProvider>
                <CurrencyProvider>
                  <UnifiedSearchProvider>
                    <BetSlipProvider>{ui}</BetSlipProvider>
                  </UnifiedSearchProvider>
                </CurrencyProvider>
              </GeoRegionProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe('Jackpot Mathematical Survival Engine & Live Pages', () => {
  it('hydrates all 5 official bookmaker jackpot pools with calibrated Bivariate Poisson xG', () => {
    const pools = getInitialOfficialJackpotPools();
    expect(pools.sportpesa).toHaveLength(17);
    expect(pools.betika).toHaveLength(15);
    expect(pools.betika_grand).toHaveLength(15);
    expect(pools.sportpesa_midweek).toHaveLength(13);
    expect(pools.mozzart).toHaveLength(20);

    for (const g of pools.sportpesa) {
      expect(g.homeXG).toBeGreaterThan(0.5);
      expect(g.awayXG).toBeGreaterThan(0.4);
      expect(g.homeProb + g.drawProb + g.awayProb).toBeGreaterThanOrEqual(98);
      expect(g.homeProb + g.drawProb + g.awayProb).toBeLessThanOrEqual(102);
    }
  });

  it('computes exact Poisson-Binomial survival probabilities and monotonic bonus tiers', () => {
    const pools = getInitialOfficialJackpotPools();
    const games = pools.sportpesa;

    const singlePicks: Record<string, JackpotExtendedPick> = {};
    games.forEach((g) => {
      singlePicks[g.fixtureId] = g.recommendedPick;
    });

    const baseline = computeJackpotSurvivalProfile('sportpesa', games, singlePicks);
    expect(baseline.totalCombinations).toBe(1);
    expect(baseline.totalStake).toBe(JACKPOT_PROVIDERS.sportpesa.baseStake);
    expect(baseline.minBonusTarget).toBe(12);
    expect(baseline.tierProbabilities.length).toBe(6); // 12+, 13+, 14+, 15+, 16+, 17/17

    for (let i = 1; i < baseline.tierProbabilities.length; i++) {
      expect(baseline.tierProbabilities[i].probAtLeastPct).toBeLessThanOrEqual(
        baseline.tierProbabilities[i - 1].probAtLeastPct
      );
    }

    // Optimizing for a KES 1,600 budget (16 lines = 4 Double Chances) strictly improves Bonus Zone survival
    const optimized = optimizeJackpotPicksForBudget('sportpesa', games, 1600, false);
    expect(optimized.budgetUsed).toBeLessThanOrEqual(1600);
    expect(optimized.survivalProfile.doubleCount).toBe(4);
    expect(optimized.survivalProfile.totalCombinations).toBe(16);
    expect(optimized.survivalProfile.bonusZoneProbabilityPct).toBeGreaterThan(
      baseline.bonusZoneProbabilityPct
    );
  });

  it('supports Triple Chances (1X2) when budget allows and generates exact Cartesian single lines', () => {
    const pools = getInitialOfficialJackpotPools();
    const games = pools.sportpesa_midweek;

    const opt = optimizeJackpotPicksForBudget('sportpesa_midweek', games, 2400, true);
    expect(opt.budgetUsed).toBeLessThanOrEqual(2400);

    const customPicks: Record<string, JackpotExtendedPick> = {};
    games.forEach((g, idx) => {
      if (idx === 0) customPicks[g.fixtureId] = '1X2';
      else if (idx === 1) customPicks[g.fixtureId] = '1X';
      else customPicks[g.fixtureId] = g.recommendedPick;
    });

    const generated = generatePlayableSingleLines(games, customPicks, 'SPMW', 64);
    expect(generated.totalPossible).toBe(6); // 3 * 2 = 6 lines
    expect(generated.lines).toHaveLength(6);
    expect(generated.truncated).toBe(false);
    expect(generated.lines[0].picks).toHaveLength(13);

    const sms = formatJackpotSmsText(JACKPOT_PROVIDERS.sportpesa_midweek, games, customPicks);
    expect(sms).toContain('1:1X2');
    expect(sms).toContain('2:1X');
  });

  it('renders JackpotPredictions hub without undefined currency strings or crashes', () => {
    const { container } = renderWithProviders(<JackpotPredictions />, '/jackpot-predictions');
    expect(screen.getByText(/SportPesa Mega Jackpot Prediction/i)).toBeTruthy();
    expect(screen.getByText(/Double Chance Permutation & Budget EV Optimizer/i)).toBeTruthy();
    expect(container.textContent).not.toContain('undefined ');
  });

  it('renders JackpotGeneratorPage with all 5 live bookmaker pools and interactive combinations', () => {
    const { container } = renderWithProviders(<JackpotGeneratorPage />, '/jackpot-generator');
    expect(screen.getByText(/Mega & Midweek Jackpot Combination Generator/i)).toBeTruthy();
    expect(screen.getByText(/Mozzart Grand 20/i)).toBeTruthy();
    expect(container.textContent).not.toContain('17-GameSababisha');

    // Interactive toggle check: switch to Mozzart Grand 20
    fireEvent.click(screen.getByText(/Mozzart Grand 20/i));
    expect(screen.getByText(/Interactive 20-Game Selection Matrix/i)).toBeTruthy();
  });

  it('renders MidweekJackpotPredictions with live 13-game & 15-game pool switcher', () => {
    renderWithProviders(<MidweekJackpotPredictions />, '/midweek-jackpot-predictions');
    expect(screen.getByText(/SportPesa Midweek Jackpot \(13 Games\) — Match Breakdown/i)).toBeTruthy();

    fireEvent.click(screen.getByText(/Betika Midweek 15/i));
    expect(screen.getByText(/Betika Midweek Jackpot \(15 Games\) — Match Breakdown/i)).toBeTruthy();

    fireEvent.click(screen.getByText(/Max KSh 1,600/i));
    expect(screen.getByText(/Active Ticket Summary/i)).toBeTruthy();
  });
});
