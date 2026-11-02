import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PredictionCard } from '@/components/PredictionCard';
import {
  PredictionCardSkeleton,
  PredictionCompactSkeleton,
  PredictionCondensedSkeleton,
  PredictionListSkeleton,
} from '@/components/PredictionCardSkeleton';
import type { Prediction } from '@/types/prediction';

// Mock hooks used by PredictionCard
vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    formatKickoff: () => '15:00',
    getKickoffRelative: () => ({ status: 'upcoming', label: 'In 2h' }),
    formatOdds: (val: number) => val.toFixed(2),
    isProbabilitiesMode: false,
    t: (_key: string, fallback: string) => fallback,
  }),
}));

vi.mock('@/hooks/usePinnedFavorites', () => ({
  usePinnedFavorites: () => ({
    isLeaguePinned: () => false,
    togglePinLeague: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBetSlip', () => ({
  useBetSlip: () => ({
    selections: [],
    addSelection: vi.fn(),
  }),
}));

const MOCK_PREDICTION: Prediction = {
  id: 'pred-hover-1',
  home_team: 'Arsenal',
  away_team: 'Liverpool',
  league: 'Premier League',
  match_date: '2026-11-10T16:30:00Z',
  prediction: 'Home Win',
  predicted_outcome: 'Home Win',
  confidence: 78,
  confidence_score: 78,
  home_odds: 2.10,
  draw_odds: 3.40,
  away_odds: 3.50,
  is_premium: false,
  created_at: '2026-11-02T10:00:00Z',
};

describe('PredictionCard Hover Scale & Skeleton Transition Effects', () => {
  it('applies subtle hover scale and reveal animation classes to card view mode', () => {
    render(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="card" />
      </MemoryRouter>
    );

    const card = screen.getByTestId('prediction-card');
    expect(card.className).toContain('hover:scale-[1.015]');
    expect(card.className).toContain('transition-all');
    expect(card.className).toContain('duration-200');
    expect(card.className).toContain('animate-card-reveal');
  });

  it('applies subtle hover scale and reveal animation classes to compact view mode', () => {
    render(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="compact" />
      </MemoryRouter>
    );

    const compactRow = screen.getByTestId('prediction-card-compact');
    expect(compactRow.className).toContain('hover:scale-[1.01]');
    expect(compactRow.className).toContain('transition-all');
    expect(compactRow.className).toContain('animate-card-reveal');
  });

  it('applies subtle hover scale and reveal animation classes to condensed view mode', () => {
    render(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="condensed" />
      </MemoryRouter>
    );

    const condensedRow = screen.getByTestId('prediction-card-condensed');
    expect(condensedRow.className).toContain('hover:scale-[1.005]');
    expect(condensedRow.className).toContain('transition-all');
    expect(condensedRow.className).toContain('animate-card-reveal');
  });

  it('transitions to skeleton when isLoading prop is true across all view modes', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="card" isLoading={true} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('prediction-card-skeleton')).toBeDefined();

    rerender(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="compact" isLoading={true} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('prediction-compact-skeleton')).toBeDefined();

    rerender(
      <MemoryRouter>
        <PredictionCard prediction={MOCK_PREDICTION} viewMode="condensed" isLoading={true} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('prediction-condensed-skeleton')).toBeDefined();
  });

  it('renders PredictionListSkeleton with smooth transition classes', () => {
    const { container } = render(<PredictionListSkeleton count={3} viewMode="card" />);
    const skeletons = screen.getAllByTestId('prediction-card-skeleton');
    expect(skeletons.length).toBe(3);
    expect(skeletons[0].className).toContain('animate-fade-in');
    expect(skeletons[0].className).toContain('transition-all');
    expect(container.firstElementChild?.className).toContain('transition-opacity');
  });
});
