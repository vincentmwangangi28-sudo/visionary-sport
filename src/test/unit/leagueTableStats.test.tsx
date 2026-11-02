import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeagueTableStats } from '@/components/LeagueTableStats';
import { computeEnrichedStandings } from '@/pages/Standings';
import { FALLBACK_STANDINGS } from '@/data/standingsData';

describe('LeagueTableStats Component & Standings Advanced Sorting', () => {
  const sampleRaw = FALLBACK_STANDINGS[39].slice(0, 6);
  const sampleEnriched = computeEnrichedStandings(sampleRaw, 'all', 'official', []);

  it('computes xPTS, xG-Diff, and Goal Variance for all league rows', () => {
    expect(sampleEnriched.length).toBe(6);
    for (const row of sampleEnriched) {
      expect(typeof row.xPts).toBe('number');
      expect(typeof row.xgDiff).toBe('number');
      expect(typeof row.goalVariance).toBe('number');
      expect(row.goalVariance).toBe(Number((row.gd - row.xgDiff).toFixed(1)));
    }
  });

  it('renders LeagueTableStats and allows sorting by xPTS, xG-Diff, and Goal Variance', () => {
    const onSortChange = vi.fn();

    render(
      <LeagueTableStats
        standings={sampleEnriched}
        leagueName="Premier League"
        leagueFlag="🏴󠁧󠁢󠁥󠁮󠁧󠁿"
        season="2026/2027"
        onSortChange={onSortChange}
      />
    );

    expect(screen.getByTestId('league-table-stats')).toBeInTheDocument();
    expect(
      screen.getByText(/Advanced Metric Sorting — xPTS, xG-Diff & Goal Variance Explorer/i)
    ).toBeInTheDocument();

    // Sort by xG-Diff
    const xgDiffBtn = screen.getByTestId('sort-metric-xgDiff');
    fireEvent.click(xgDiffBtn);
    expect(onSortChange).toHaveBeenCalledWith('xgDiff', false);

    // Clicking active xG-Diff button again toggles ascending order
    fireEvent.click(xgDiffBtn);
    expect(onSortChange).toHaveBeenCalledWith('xgDiff', true);

    // Sort by Goal Variance
    const goalVarBtn = screen.getByTestId('sort-metric-goalVariance');
    fireEvent.click(goalVarBtn);
    expect(onSortChange).toHaveBeenCalledWith('goalVariance', false);

    // Filter by club name
    const searchInput = screen.getByLabelText(/Filter club in league table stats/i);
    fireEvent.change(searchInput, { target: { value: 'Arsenal' } });
    expect(screen.getAllByText('Arsenal').length).toBeGreaterThan(0);
  });

  it('toggles sorting between Expected Points (xPTS) and Expected Goals Difference (xG-Diff) via button set and dropdown', () => {
    const onSortChange = vi.fn();

    render(
      <LeagueTableStats
        standings={sampleEnriched}
        leagueName="Premier League"
        leagueFlag="🏴󠁧󠁢󠁥󠁮󠁧󠁿"
        season="2026/2027"
        onSortChange={onSortChange}
      />
    );

    const toggleXptsBtn = screen.getByTestId('toggle-sort-xpts');
    const toggleXgDiffBtn = screen.getByTestId('toggle-sort-xg-diff');
    const sortDropdown = screen.getByTestId('league-stats-sort-select') as HTMLSelectElement;
    const directionBtn = screen.getByTestId('toggle-sort-direction');

    // Initially sorted by xPTS
    expect(toggleXptsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(toggleXgDiffBtn).toHaveAttribute('aria-pressed', 'false');
    expect(sortDropdown.value).toBe('xPts');

    // Click Expected Goals Difference (xG-Diff) toggle button
    fireEvent.click(toggleXgDiffBtn);
    expect(onSortChange).toHaveBeenLastCalledWith('xgDiff', false);
    expect(toggleXgDiffBtn).toHaveAttribute('aria-pressed', 'true');
    expect(toggleXptsBtn).toHaveAttribute('aria-pressed', 'false');
    expect(sortDropdown.value).toBe('xgDiff');

    // Use dropdown to switch back to Expected Points (xPTS)
    fireEvent.change(sortDropdown, { target: { value: 'xPts' } });
    expect(onSortChange).toHaveBeenLastCalledWith('xPts', false);
    expect(toggleXptsBtn).toHaveAttribute('aria-pressed', 'true');

    // Use dropdown to switch to Expected Goals Difference (xG-Diff)
    fireEvent.change(sortDropdown, { target: { value: 'xgDiff' } });
    expect(onSortChange).toHaveBeenLastCalledWith('xgDiff', false);
    expect(toggleXgDiffBtn).toHaveAttribute('aria-pressed', 'true');

    // Toggle sort direction
    fireEvent.click(directionBtn);
    expect(onSortChange).toHaveBeenLastCalledWith('xgDiff', true);
  });

  it('supports 2-club H2H comparison selection and one-click Bet Slip value action', () => {
    render(
      <LeagueTableStats
        standings={sampleEnriched}
        leagueName="Premier League"
        leagueFlag="🏴󠁧󠁢󠁥󠁮󠁧󠁿"
        season="2026/2027"
      />
    );

    const compareBtn0 = screen.getByTestId('compare-club-0');
    const compareBtn1 = screen.getByTestId('compare-club-1');
    const addSlipBtn0 = screen.getByTestId('add-value-slip-0');

    fireEvent.click(compareBtn0);
    expect(screen.getByTestId('h2h-comparison-tray')).toBeInTheDocument();

    fireEvent.click(compareBtn1);
    const launchLink = screen.getByTestId('launch-h2h-simulator-link') as HTMLAnchorElement;
    expect(launchLink).toBeInTheDocument();
    expect(launchLink.getAttribute('href')).toContain('/h2h?team1=');

    fireEvent.click(addSlipBtn0);
    expect(addSlipBtn0).toBeInTheDocument();
  });
});


