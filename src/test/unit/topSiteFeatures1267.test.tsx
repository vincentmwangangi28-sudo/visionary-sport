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
  buildNoVigOddsScanner,
  runStrategyBacktest,
  buildExchangeSteamFeed,
  auditBetSlipLegs,
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

const SAMPLE_MATCHES: Prediction[] = [
  {
    id: 'm-1',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    match_date: new Date(Date.now() + 3600_000 * 4).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 82,
    confidence_score: 82,
    home_odds: 1.85,
    draw_odds: 3.55,
    away_odds: 4.10,
    home_win_probability: 54,
    draw_probability: 24,
    away_win_probability: 22,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-2',
    home_team: 'Real Madrid',
    away_team: 'Atletico Madrid',
    league: 'La Liga',
    match_date: new Date(Date.now() + 3600_000 * 6).toISOString(),
    prediction: 'Home Win',
    predicted_outcome: 'Home Win',
    confidence: 78,
    confidence_score: 78,
    home_odds: 1.94,
    draw_odds: 3.45,
    away_odds: 3.90,
    home_win_probability: 51,
    draw_probability: 26,
    away_win_probability: 23,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
];

function renderSuite(initialTab: Parameters<typeof LiveApiIntelligenceSuite>[0]['initialTab'] = 'no_vig') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

  queryClient.setQueryData(
    ['predictions', 'list', 'all'],
    {
      allPredictions: SAMPLE_MATCHES,
      total: SAMPLE_MATCHES.length,
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

describe('Top-Site Features #1, #2, #6 & #7', () => {
  it('#1 calculates de-vigged fair odds, bookmaker holds, and +EV soft-book edges', () => {
    const rows = buildNoVigOddsScanner(SAMPLE_MATCHES, 0);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    rows.forEach((row) => {
      expect(row.trueNoVigOdds).toBeGreaterThan(1.05);
      expect(row.softBookOdds).toBeGreaterThan(row.trueNoVigOdds);
      expect(row.softHoldPct).toBeGreaterThan(row.sharpHoldPct);
      expect(row.evEdgePct).toBeGreaterThan(0);
    });
  });

  it('#2 simulates strategy backtest ROI, drawdown, CLV, and equity curve points', () => {
    const res = runStrategyBacktest({
      league: 'EPL',
      minEdgePct: 5,
      oddsBand: 'all',
      market: 'Asian Handicap',
      sampleSize: 120,
    });

    expect(res.totalBets).toBeGreaterThanOrEqual(28);
    expect(res.equityCurve[0].betNumber).toBe(0);
    expect(res.equityCurve[0].cumulativeUnits).toBe(0);
    expect(res.equityCurve[res.equityCurve.length - 1].betNumber).toBe(res.totalBets);
    expect(res.closingLineValuePct).toBeGreaterThan(1);
    expect(res.maxDrawdownUnits).toBeGreaterThanOrEqual(0);
  });

  it('#6 ranks Betfair exchange steam alerts by matched liquidity volume', () => {
    const feed = buildExchangeSteamFeed(SAMPLE_MATCHES, 1);
    expect(feed.length).toBe(2);
    expect(feed[0].matchedVolumeUsd).toBeGreaterThanOrEqual(feed[1].matchedVolumeUsd);
    feed.forEach((row) => {
      expect(row.openingOdds).toBeGreaterThan(row.currentOdds);
      expect(row.dropPct).toBeGreaterThan(0);
      expect(row.bookieLagOdds).toBeGreaterThan(row.currentOdds);
    });
  });

  it('#7 audits active multi-leg slips, detects weakest leg, and computes smart hedge sizing', () => {
    const audit = auditBetSlipLegs(
      [
        {
          id: 'leg-1',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          league: 'Premier League',
          market: 'Arsenal Win',
          odds: 1.95,
          confidence: 86,
        },
        {
          id: 'leg-2',
          homeTeam: 'Juventus',
          awayTeam: 'AC Milan',
          league: 'Serie A',
          market: 'Juventus Win',
          odds: 1.72,
          confidence: 42,
        },
      ],
      100
    );

    expect(audit.auditedLegs).toHaveLength(2);
    expect(audit.weakestLeg?.id).toBe('leg-2');
    expect(audit.optimizedSlipEvPct).toBeGreaterThan(audit.currentSlipEvPct);
    expect(audit.hedgeStakeAmount).toBeGreaterThan(0);
  });

  it('renders and interacts cleanly across tabs #1, #2, #6, and #7 in LiveApiIntelligenceSuite', () => {
    renderSuite('no_vig');
    expect(screen.getByText(/No-Vig True Odds & Soft Book Discrepancy Scanner/i)).toBeInTheDocument();

    const btTab = screen.getByRole('tab', { name: /Strategy Backtester/i });
    fireEvent.click(btTab);
    expect(btTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Historical Strategy Backtester/i)).toBeInTheDocument();

    const ahBtn = screen.getByRole('button', { name: /Asian Handicap/i });
    fireEvent.click(ahBtn);
    expect(screen.getByText(/Cumulative Units Equity Curve/i)).toBeInTheDocument();

    const steamTab = screen.getByRole('tab', { name: /Exchange Steam & Liquidity/i });
    fireEvent.click(steamTab);
    expect(steamTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Exchange Liquidity & Sharp Money Steam Alerts/i)).toBeInTheDocument();

    const auditTab = screen.getByRole('tab', { name: /Slip Auditor & Smart Hedge/i });
    fireEvent.click(auditTab);
    expect(auditTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Bet Slip Weakest-Leg Auditor/i)).toBeInTheDocument();
  });
});
