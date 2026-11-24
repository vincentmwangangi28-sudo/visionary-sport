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
import { LiveApiIntelligenceSuite } from '@/components/LiveApiIntelligenceSuite';
import {
  buildGoalkeeperPsxgProfiles,
  buildManagerClashProfiles,
} from '@/services/topSiteIntelEngine';
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

const SAMPLE_PREDICTIONS: Prediction[] = [
  {
    id: 'fx-ars-mun',
    home_team: 'Arsenal',
    away_team: 'Manchester United',
    league: 'Premier League',
    match_date: new Date(Date.now() + 3600_000 * 4).toISOString(),
    prediction: 'Home Win',
    confidence: 79,
    home_odds: 1.65,
    draw_odds: 3.9,
    away_odds: 5.1,
  },
  {
    id: 'fx-rma-atm',
    home_team: 'Real Madrid',
    away_team: 'Atletico Madrid',
    league: 'La Liga',
    match_date: new Date(Date.now() + 3600_000 * 6).toISOString(),
    prediction: 'Home Win',
    confidence: 74,
    home_odds: 1.85,
    draw_odds: 3.55,
    away_odds: 4.1,
  },
];

function renderSuite(initialTab: 'gk_psxg' | 'manager_clash' = 'gk_psxg') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });

  queryClient.setQueryData(
    ['predictions', 'list', 'all'],
    {
      allPredictions: SAMPLE_PREDICTIONS,
      total: SAMPLE_PREDICTIONS.length,
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

describe('Feature #1 (Goalkeeper PSxG & Backup Lab) & Feature #3 (Manager & Formation Clash Matrix)', () => {
  it('recalculates Over 2.5 and BTTS fair odds upward when simulating a #2 backup goalkeeper', () => {
    const baseline = buildGoalkeeperPsxgProfiles(SAMPLE_PREDICTIONS);
    expect(baseline.length).toBe(2);
    expect(baseline[0].homeKeeper.starterName).toBe('David Raya');
    expect(baseline[0].homeUsingBackup).toBe(false);

    const withBackup = buildGoalkeeperPsxgProfiles(SAMPLE_PREDICTIONS, {
      backupOverrides: {
        'fx-ars-mun': { home: true },
      },
    });

    expect(withBackup[0].homeUsingBackup).toBe(true);
    expect(withBackup[0].activeHomePsxg).toBeLessThan(baseline[0].activeHomePsxg);
    expect(withBackup[0].adjustedOver25Pct).toBeGreaterThan(baseline[0].adjustedOver25Pct);
    expect(withBackup[0].adjustedBttsPct).toBeGreaterThan(baseline[0].adjustedBttsPct);
    expect(withBackup[0].fairOver25Odds).toBeLessThan(baseline[0].fairOver25Odds);
    expect(withBackup[0].impactRating).toBe('Backup Keeper Leakage Alert');
  });

  it('produces consistent Manager H2H coaching records, formations, and 60+ sub impact metrics', () => {
    const clashes = buildManagerClashProfiles(SAMPLE_PREDICTIONS, 'all');
    expect(clashes.length).toBe(2);

    const arsenalClash = clashes[0];
    expect(arsenalClash.homeManager.name).toBe('Mikel Arteta');
    expect(arsenalClash.awayManager.name).toBe('Ruben Amorim');
    expect(arsenalClash.hasNewManagerBounce).toBe(true);
    expect(
      arsenalClash.homeMgrWins + arsenalClash.draws + arsenalClash.awayMgrWins
    ).toBe(arsenalClash.h2hMeetings);
    expect(arsenalClash.combinedGoalsAfter60Pct).toBeGreaterThan(35);

    const bounceOnly = buildManagerClashProfiles(SAMPLE_PREDICTIONS, 'new_bounce');
    expect(bounceOnly.some((c) => c.homeTeam === 'Arsenal' && c.awayTeam === 'Manchester United')).toBe(true);
  });

  it('renders GK PSxG & Backup Lab tab and updates keeper simulation interactively', () => {
    renderSuite('gk_psxg');

    expect(screen.getByText(/Goalkeeper PSxG Shot-Stopping & Backup-Keeper Impact Lab/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PSxG/i).length).toBeGreaterThan(0);

    const simButtons = screen.getAllByRole('button', { name: /Sim #2/i });
    expect(simButtons.length).toBeGreaterThan(0);

    fireEvent.click(simButtons[0]);
    expect(screen.getByRole('button', { name: /#2 Active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset to Starters/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset to Starters/i }));
    expect(screen.queryByRole('button', { name: /#2 Active/i })).not.toBeInTheDocument();
  });

  it('switches to Manager & Formation Matrix tab and filters cleanly', () => {
    renderSuite('gk_psxg');

    const mgrTab = screen.getByRole('tab', { name: /Manager & Formation Matrix/i });
    fireEvent.click(mgrTab);
    expect(mgrTab).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByText(/Manager-vs-Manager & Tactical Formation Clash Matrix/i)).toBeInTheDocument();
    expect(screen.getAllByText(/H2H \d+W–\d+D–\d+L/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/60'\+ Sub Goal Share:/i).length).toBeGreaterThan(0);

    const h2hBtn = screen.getByRole('button', { name: /Coaching H2H/i });
    fireEvent.click(h2hBtn);
    expect(screen.getAllByText(/H2H \d+W–\d+D–\d+L/i).length).toBeGreaterThan(0);

    const bounceBtn = screen.getByRole('button', { name: /New Manager Bounce/i });
    fireEvent.click(bounceBtn);
    expect(screen.getAllByText(/60'\+ Sub Goal Share:/i).length).toBeGreaterThan(0);
  });
});
