import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/hooks/useAuth';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GeoRegionProvider } from '@/hooks/useGeoRegion';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { UnifiedSearchProvider } from '@/hooks/useUnifiedSearch';
import { BetSlipProvider } from '@/hooks/useBetSlip';

beforeAll(() => {
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

  window.scrollTo = () => {};
});

function createWrapper(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, enabled: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <AuthProvider>
              <UserPreferencesProvider>
                <GeoRegionProvider>
                  <CurrencyProvider>
                    <UnifiedSearchProvider>
                      <BetSlipProvider>{children}</BetSlipProvider>
                    </UnifiedSearchProvider>
                  </CurrencyProvider>
                </GeoRegionProvider>
              </UserPreferencesProvider>
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };
}

describe('All Pages & Admin Components Render Audit', () => {
  const pagesDir = path.resolve(__dirname, '../../pages');
  const pageFiles = fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith('.tsx'))
    .sort();

  const adminDir = path.resolve(__dirname, '../../components/admin');
  const adminFiles = fs
    .readdirSync(adminDir)
    .filter((f) => f.endsWith('.tsx'))
    .sort();

  it('audits all 145 pages in src/pages for runtime render errors', async () => {
    const failures: Array<{ file: string; error: string }> = [];

    for (const file of pageFiles) {
      try {
        const mod = await import(`../../pages/${file}`);
        const PageComponent = mod.default;
        if (!PageComponent) {
          failures.push({ file, error: 'Missing default export' });
          continue;
        }

        let initialPath = '/';
        let routePattern = '*';
        if (file === 'MatchPrediction.tsx') {
          initialPath = '/predict/arsenal-vs-chelsea';
          routePattern = '/predict/:matchSlug';
        } else if (file === 'BlogPost.tsx') {
          initialPath = '/blog/how-ai-football-predictions-work';
          routePattern = '/blog/:slug';
        } else if (file === 'EmbedWidget.tsx') {
          initialPath = '/embed/banker';
          routePattern = '/embed/:type';
        } else if (file === 'TeamAnalyticsHub.tsx') {
          initialPath = '/teams/arsenal';
          routePattern = '/teams/:teamSlug';
        } else if (file === 'PlayerProfilePage.tsx') {
          initialPath = '/players/erling-haaland';
          routePattern = '/players/:playerSlug';
        }

        const Wrapper = createWrapper(initialPath);
        const { unmount } = render(
          <Wrapper>
            <Routes>
              <Route path={routePattern} element={<PageComponent />} />
            </Routes>
          </Wrapper>
        );
        unmount();
      } catch (err: any) {
        failures.push({
          file,
          error: `${err?.message || String(err)}\n${err?.stack?.split('\n').slice(0, 4).join('\n') || ''}`,
        });
      }
    }

    if (failures.length > 0) {
      console.error('PAGE RENDER FAILURES:', JSON.stringify(failures, null, 2));
    }
    expect(failures).toEqual([]);
  }, 120000);

  it('audits all 25 Admin components in src/components/admin for runtime render errors', async () => {
    const failures: Array<{ file: string; error: string }> = [];

    const defaultProps = {
      stats: {
        mrr: 0,
        totalRevenue: 0,
        activeUsers: 120,
        totalTransactions: 0,
        totalPredictions: 24,
        errorCount: 0,
      },
      dailyData: [{ date: '2026-10-26', revenue: 0, transactions: 0 }],
      planBreakdown: [],
      fetching: false,
      onRefresh: () => {},
      onNavigateTab: () => {},
      onViewPredictions: () => {},
    };

    for (const file of adminFiles) {
      try {
        const mod = await import(`../../components/admin/${file}`);
        const baseName = file.replace('.tsx', '');
        const Comp =
          mod.default ||
          mod[baseName] ||
          Object.values(mod).find((v) => typeof v === 'function');
        if (!Comp) {
          failures.push({ file, error: 'Missing component export' });
          continue;
        }
        const ElementComp = Comp as React.ComponentType<any>;
        const Wrapper = createWrapper('/admin');
        const { unmount } = render(
          <Wrapper>
            <ElementComp {...defaultProps} />
          </Wrapper>
        );
        unmount();
      } catch (err: any) {
        failures.push({
          file,
          error: `${err?.message || String(err)}\n${err?.stack?.split('\n').slice(0, 4).join('\n') || ''}`,
        });
      }
    }

    if (failures.length > 0) {
      console.error('ADMIN RENDER FAILURES:', JSON.stringify(failures, null, 2));
    }
    expect(failures).toEqual([]);
  }, 60000);
});
