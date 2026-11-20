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
  buildXgStepTimeline,
  computeDeservedPointsRegression,
  buildPlayerPropLogs,
  buildFixtureCongestionProfiles,
  buildPressureSurgeFeed,
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
    home_odds: 1.82,
    draw_odds: 3.55,
    away_odds: 4.20,
    home_win_probability: 54,
    draw_probability: 24,
    away_win_probability: 22,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
];

function renderSuite(initialTab: Parameters<typeof LiveApiIntelligenceSuite>[0]['initialTab'] = 'xg_step') {
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

describe('Top-Site Features #3, #4, #5 & #8', () => {
  it('#3 builds monotonic 0\'-90\' xG step timeline and deserved points regression metrics', () => {
    const timeline = buildXgStepTimeline('Arsenal', 'Everton', 2.38, 0.34);
    expect(timeline[0].minute).toBe(0);
    expect(timeline[0].homeXg).toBe(0);
    expect(timeline[timeline.length - 1].minute).toBe(90);
    expect(timeline[timeline.length - 1].homeXg).toBeCloseTo(2.38, 1);

    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].homeXg).toBeGreaterThanOrEqual(timeline[i - 1].homeXg);
      expect(timeline[i].awayXg).toBeGreaterThanOrEqual(timeline[i - 1].awayXg);
    }

    const regression = computeDeservedPointsRegression(SAMPLE_MATCHES);
    expect(regression.length).toBeGreaterThanOrEqual(4);
    expect(regression[0].deservedWinPct + regression[0].deservedDrawPct + regression[0].deservedLossPct).toBe(100);
    expect(regression[0].luckDelta).toBeLessThan(0);
    expect(regression[0].signal).toBe('Unlucky — Back Next Match');
  });

  it('#4 builds L5/L10 player prop hit-rate logs and filters by prop market', () => {
    const allLogs = buildPlayerPropLogs('All', 'EPL');
    expect(allLogs.length).toBeGreaterThanOrEqual(4);
    allLogs.forEach((row) => {
      expect(row.logs).toHaveLength(10);
      expect(row.l5RatePct).toBeGreaterThanOrEqual(0);
      expect(row.l5RatePct).toBeLessThanOrEqual(100);
      expect(row.fairOdds).toBeGreaterThan(1);
    });

    const sotOnly = buildPlayerPropLogs('1+ SoT', 'EPL');
    expect(sotOnly.every((r) => r.market === '1+ SoT')).toBe(true);
  });

  it('#5 computes Club Elo, Rest Days, Travel km, and Rotation Risk', () => {
    const profiles = buildFixtureCongestionProfiles(SAMPLE_MATCHES);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].homeElo).toBeGreaterThan(1900);
    expect(profiles[0].homeRestDays).toBeGreaterThanOrEqual(3);
    expect(profiles[0].awayRestDays).toBeGreaterThanOrEqual(3);
    expect(profiles[0].homeRotationRiskPct).toBeGreaterThan(0);
    expect(profiles[0].recommendedOdds).toBeGreaterThan(1.1);
  });

  it('#8 ranks live and simulated fixtures by rolling 10m Pressure Surge score', () => {
    const feed = buildPressureSurgeFeed(
      [
        {
          id: 'live-1',
          home_team: 'Liverpool',
          away_team: 'Inter Milan',
          league: 'Champions League',
          clock: "79'",
          home_score: 1,
          away_score: 1,
        },
      ],
      SAMPLE_MATCHES,
      2
    );

    expect(feed.length).toBeGreaterThanOrEqual(2);
    expect(feed.some((f) => f.isLiveFeed && f.homeTeam === 'Liverpool')).toBe(true);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i - 1].pressureScore).toBeGreaterThanOrEqual(feed[i].pressureScore);
    }
  });

  it('renders and interacts cleanly across tabs #3, #4, #5, and #8 in LiveApiIntelligenceSuite', () => {
    renderSuite('xg_step');
    expect(screen.getByText(/Cumulative xG Step-Chart/i)).toBeInTheDocument();

    const propTab = screen.getByRole('tab', { name: /Prop Hit-Rate Logs/i });
    fireEvent.click(propTab);
    expect(propTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Player Prop Hit-Rate Logs/i)).toBeInTheDocument();

    const l10Btn = screen.getByRole('button', { name: /L10 Form/i });
    fireEvent.click(l10Btn);
    expect(screen.getByText(/L10 Hit %/i)).toBeInTheDocument();

    const congTab = screen.getByRole('tab', { name: /Elo, Fatigue & Travel Risk/i });
    fireEvent.click(congTab);
    expect(congTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Club Elo Ratings, Rest-Day Edge/i)).toBeInTheDocument();

    const radarTab = screen.getByRole('tab', { name: /Live Pressure Surge Radar/i });
    fireEvent.click(radarTab);
    expect(radarTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /Pressure Surge/i })).toBeInTheDocument();

    const chimeBtn = screen.getByRole('button', { name: /Enable Surge Chime/i });
    fireEvent.click(chimeBtn);
    expect(screen.getByRole('button', { name: /Audio Chime On/i })).toBeInTheDocument();
  });
});
