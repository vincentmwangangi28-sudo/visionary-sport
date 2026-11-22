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
import { AdminAppStoreMetadataTab } from '@/components/admin/AdminAppStoreMetadataTab';

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
  window.scrollTo = () => {};
});

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/app-store-metadata']}>
          <AuthProvider>
            <UserPreferencesProvider>
              <GeoRegionProvider>
                <CurrencyProvider>
                  <UnifiedSearchProvider>
                    <BetSlipProvider>
                      <AdminAppStoreMetadataTab />
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

describe('AdminAppStoreMetadataTab Asset Generator', () => {
  it('renders descriptions, 4 portrait screenshot previews, icons, and privacy policy links', () => {
    renderTab();

    expect(screen.getByText(/App Store Metadata & Listing Asset Generator/i)).toBeTruthy();
    expect(screen.getByText(/01\. App Store Descriptions & Keywords/i)).toBeTruthy();
    expect(screen.getByText(/02\. Store Listing Screenshots \(1080×1920 Portrait\) & App Icons/i)).toBeTruthy();
    expect(screen.getByText(/03\. Public Privacy Policy & Store Compliance Links/i)).toBeTruthy();

    expect(screen.getByText(/01\. AI Match Predictions & Daily Confidence/i)).toBeTruthy();
    expect(screen.getByText(/02\. 6×6 Bivariate Poisson Score Matrix/i)).toBeTruthy();
    expect(screen.getByText(/03\. 17-Game Mega Jackpot Combinatorics/i)).toBeTruthy();
    expect(screen.getByText(/04\. Global Coverage & Offline PWA Speed/i)).toBeTruthy();

    expect(screen.getByText(/https:\/\/predictpro\.guru\/privacy$/i)).toBeTruthy();
    expect(screen.getByText(/512×512 App Icon \(Mandatory\)/i)).toBeTruthy();
  });

  it('updates legal URLs and store copy limits dynamically when domain and preset change', () => {
    renderTab();

    const domainInput = screen.getByLabelText(/Production Domain/i) as HTMLInputElement;
    fireEvent.change(domainInput, { target: { value: 'https://staging.predictpro.guru' } });
    expect(screen.getByText(/https:\/\/staging\.predictpro\.guru\/privacy$/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Apple App Store Connect/i }));
    expect(screen.getByText(/Apple Subtitle/i)).toBeTruthy();
    expect(screen.getAllByText(/\/30 chars/i, { selector: 'span' }).length).toBeGreaterThanOrEqual(2);
  });
});
