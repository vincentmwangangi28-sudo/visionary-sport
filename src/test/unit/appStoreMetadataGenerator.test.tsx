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

describe('AdminAppStoreMetadataTab Manifest & Canvas Screenshot Generator', () => {
  it('fetches metadata and generates structured manifest, 512x512 icon placeholder, 2-4 sentence overview, and 4 portrait screenshots', () => {
    const { container } = renderTab();

    expect(screen.getByText(/App Store Metadata & Asset Manifest Generator/i)).toBeTruthy();
    expect(screen.getByText(/01\. Structured ‘App Store Metadata’ Manifest/i)).toBeTruthy();
    expect(screen.getByText(/Optimized Store Overview \(2–4 Sentences/i)).toBeTruthy();
    expect(screen.getAllByText(/512×512 Icon Placeholder/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/4 Canvas Placeholder Mobile Screenshots \(1080×1920/i)).toBeTruthy();

    expect(screen.getByText(/01\. Daily AI Match Predictions/i)).toBeTruthy();
    expect(screen.getByText(/02\. 6×6 Bivariate Poisson Matrix/i)).toBeTruthy();
    expect(screen.getByText(/03\. Mega & Midweek Jackpot Engine/i)).toBeTruthy();
    expect(screen.getByText(/04\. 40\+ Global Leagues & Live xG/i)).toBeTruthy();

    expect(container.textContent).toContain('"dimensions": "512x512"');
    expect(container.textContent).toContain('"privacyPolicyUrlTemplate": "https://{domain}/privacy"');
    expect(screen.getAllByText(/https:\/\/predictpro\.guru\/privacy$/i).length).toBeGreaterThanOrEqual(1);
  });

  it('updates privacy policy URL template, Apple limits, and neutral sports pitch background dynamically', () => {
    const { container } = renderTab();

    const domainInput = screen.getByLabelText(/Production Domain/i) as HTMLInputElement;
    fireEvent.change(domainInput, { target: { value: 'https://staging.predictpro.guru' } });
    expect(screen.getAllByText(/https:\/\/staging\.predictpro\.guru\/privacy$/i).length).toBeGreaterThanOrEqual(1);

    const templateInput = screen.getByLabelText(/Privacy Policy URL Template/i) as HTMLInputElement;
    fireEvent.change(templateInput, { target: { value: 'https://{domain}/legal/privacy-policy' } });
    expect(screen.getAllByText(/https:\/\/staging\.predictpro\.guru\/legal\/privacy-policy$/i).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /Neutral Pitch Charcoal/i }));
    expect(container.textContent).toContain('"background": "neutral_charcoal_pitch"');

    fireEvent.click(screen.getByRole('button', { name: /Apple App Store Connect/i }));
    expect(screen.getByText(/Apple Subtitle/i)).toBeTruthy();
    expect(screen.getAllByText(/\/30 chars/i, { selector: 'span' }).length).toBeGreaterThanOrEqual(2);
  });
});
