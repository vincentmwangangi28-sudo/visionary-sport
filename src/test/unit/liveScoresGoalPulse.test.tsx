import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GeoRegionProvider } from '@/hooks/useGeoRegion';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { UnifiedSearchProvider } from '@/hooks/useUnifiedSearch';
import { BetSlipProvider } from '@/hooks/useBetSlip';

let broadcastCallback: ((msg: any) => void) | null = null;
const mockRemoveChannel = vi.fn();

const mockChannel = {
  on: vi.fn((type: string, filter: any, cb: (msg: any) => void) => {
    if (type === 'broadcast' && filter?.event === 'goal_alert') {
      broadcastCallback = cb;
    }
    return mockChannel;
  }),
  subscribe: vi.fn(() => mockChannel),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const sampleLiveMatch = {
  id: 'espn-ars-che-999',
  home_team: 'Arsenal',
  away_team: 'Chelsea',
  league: 'Premier League',
  league_id: 39,
  match_date: new Date().toISOString(),
  status: 'live' as const,
  minute: '64',
  home_score: 1,
  away_score: 1,
  home_odds: 1.9,
  draw_odds: 3.4,
  away_odds: 4.1,
  prediction: 'Home Win',
  confidence: 82,
  is_realtime: true,
  match_events: [],
};

const stableLiveFixtures = [sampleLiveMatch];
const mockRefetchLive = vi.fn();
const mockSetAutoAlertsEnabled = vi.fn();
const mockSendLiveScoreAlert = vi.fn();
const mockAutoDispatchLiveScoreChanges = vi.fn();

const stableFootballDataReturn = {
  liveFixtures: stableLiveFixtures,
  isLiveLoading: false,
  isLiveFetching: false,
  refetchLive: mockRefetchLive,
  isServiceUnavailable: false,
  serviceUnavailableMessage: '',
  authErrorStatus: null,
};

const stableTelegramAlertsReturn = {
  autoAlertsEnabled: false,
  setAutoAlertsEnabled: mockSetAutoAlertsEnabled,
  isSending: false,
  sendLiveScoreAlert: mockSendLiveScoreAlert,
  autoDispatchLiveScoreChanges: mockAutoDispatchLiveScoreChanges,
  chatId: '@predictproAi',
};

vi.mock('@/hooks/useFootballData', () => ({
  useFootballData: vi.fn(() => stableFootballDataReturn),
}));

vi.mock('@/hooks/useTelegramAlerts', () => ({
  useTelegramAlerts: vi.fn(() => stableTelegramAlertsReturn),
}));

vi.mock('@/services/autoSettlementService', () => ({
  playLiveEventChime: vi.fn(),
  fetchDeepMatchSummary: vi.fn(async () => null),
}));

vi.mock('@/services/liveCommentaryPushService', () => ({
  speakMatchCommentary: vi.fn(),
  stopSpeechCommentary: vi.fn(),
  requestGoalPushPermission: vi.fn(async () => 'default'),
  getGoalPushPermissionState: vi.fn(() => 'default'),
  dispatchGoalOrSettlementPush: vi.fn(),
  getMatchRefereeAndPlayerProps: vi.fn(() => ({
    referee: {
      refereeName: 'Michael Oliver',
      avgYellowCards: 3.8,
      strictnessTier: 'Balanced',
      primaryCardLine: 'Over 3.5 Cards',
      primaryCardOdds: 1.85,
      primaryCardConfidence: 74,
    },
    playerProps: [],
  })),
}));

import LiveScores from '@/pages/LiveScores';

function renderLiveScores() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/live']}>
          <AuthProvider>
            <UserPreferencesProvider>
              <GeoRegionProvider>
                <CurrencyProvider>
                  <UnifiedSearchProvider>
                    <BetSlipProvider>
                      <LiveScores />
                    </BetSlipProvider>
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

describe('LiveScores WebSocket Goal Alert Pulse Animation', () => {
  beforeEach(() => {
    broadcastCallback = null;
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    mockRemoveChannel.mockClear();

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies subtle pulse animation to the live score container when a WebSocket goal alert is received and clears after TTL', async () => {
    const intervalCallbacks: Array<() => void> = [];
    const origSetInterval = globalThis.setInterval;
    const origClearInterval = globalThis.clearInterval;
    let fakeNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => fakeNow);
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: any, ms?: number) => {
      if (ms === 2000 && typeof fn === 'function') {
        intervalCallbacks.push(fn);
        return 9999 as any;
      }
      return origSetInterval(fn, ms);
    }) as any);
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(((id: any) => {
      if (id === 9999) return;
      return origClearInterval(id);
    }) as any);

    const { unmount } = renderLiveScores();

    const rowScoreContainer = screen.getByTestId(`live-score-container-${sampleLiveMatch.id}`);
    const inspectorScoreContainer = screen.getByTestId('inspector-live-score-container');

    expect(rowScoreContainer).toHaveAttribute('data-goal-alert', 'false');
    expect(rowScoreContainer.className).not.toContain('animate-goal-score-pulse');
    expect(inspectorScoreContainer).toHaveAttribute('data-goal-alert', 'false');
    expect(broadcastCallback).toBeTypeOf('function');

    // Simulate incoming WebSocket goal_alert broadcast
    act(() => {
      broadcastCallback?.({
        payload: {
          matchId: sampleLiveMatch.id,
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          homeScore: 2,
          awayScore: 1,
          scoringSide: 'home',
          minute: "67'",
          scorer: 'B. Saka',
        },
      });
    });

    expect(rowScoreContainer).toHaveAttribute('data-goal-alert', 'true');
    expect(rowScoreContainer.className).toContain('animate-goal-score-pulse');
    expect(rowScoreContainer.textContent).toContain('2');
    expect(rowScoreContainer.textContent).toContain('1');

    expect(inspectorScoreContainer).toHaveAttribute('data-goal-alert', 'true');
    expect(inspectorScoreContainer.className).toContain('animate-goal-score-pulse');
    expect(screen.getByText('Goal Alert')).toBeInTheDocument();

    // Advance virtual clock past the 12s pulse window and trigger cleanup interval callback
    act(() => {
      fakeNow += 14_500;
      intervalCallbacks.forEach((cb) => cb());
    });

    expect(rowScoreContainer).toHaveAttribute('data-goal-alert', 'false');
    expect(rowScoreContainer.className).not.toContain('animate-goal-score-pulse');
    expect(inspectorScoreContainer).toHaveAttribute('data-goal-alert', 'false');

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
