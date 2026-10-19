import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LivePitchVisualizer, computeTacticalPitchData } from '@/components/LivePitchVisualizer';
import { getMatchBroadcastInfo } from '@/services/liveBroadcastService';
import { LiveStreamHubModal } from '@/components/LiveStreamHubModal';
import { sanitizeLogoCdnUrl } from '@/components/TeamLogo';
import { GlobalMatchdayCommandRibbon } from '@/components/GlobalMatchdayCommandRibbon';
import { computeEnrichedStandings } from '@/pages/Standings';
import { ELITE_PLAYER_DATABASE } from '@/pages/PlayerSearch';
import { LIVE_LINEUP_TRANSFER_WIRE } from '@/pages/News';
import { FALLBACK_STANDINGS } from '@/data/standingsData';

describe('LivePitchVisualizer, Broadcast Hub & GlobalMatchdayCommandRibbon', () => {
  it('strips /combiner/i?img= from espncdn URLs so Googlebot never hits robot-disallowed combiner paths', () => {
    const combinerUrl = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/103.png&w=40&h=40&scale=crop';
    expect(sanitizeLogoCdnUrl(combinerUrl)).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/103.png');
    expect(sanitizeLogoCdnUrl('https://a.espncdn.com/i/teamlogos/soccer/500/165.png')).toBe(
      'https://a.espncdn.com/i/teamlogos/soccer/500/165.png'
    );
  });

  const sampleProps = {
    matchId: 'live-ars-che-101',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    homeXG: 1.84,
    awayXG: 0.92,
    homePossession: 58,
    awayPossession: 42,
    prediction: 'Over 2.5 Goals',
    confidence: 84,
    status: 'live',
  };

  it('computes 3-zone field tilt summing to 100% and generates 0.0-10.0 player ratings', () => {
    const data = computeTacticalPitchData(sampleProps);
    expect(data.zones.awayThird + data.zones.middleThird + data.zones.homeThird).toBe(100);
    expect(data.homeTilt + data.awayTilt).toBe(100);
    expect(data.playerRatings.homePlayers).toHaveLength(3);
    expect(data.playerRatings.awayPlayers).toHaveLength(3);
  });

  it('generates 6 15-minute momentum intervals and shot map events', () => {
    const data = computeTacticalPitchData(sampleProps);
    expect(data.intervals).toHaveLength(6);
    expect(data.intervals[0].period).toBe("1-15'");
    expect(data.intervals[5].period).toBe("76-90'");
    expect(data.shots.length).toBeGreaterThanOrEqual(5);
  });

  it('evaluates Pre-Match Model Calibration as hit when Over 2.5 Goals has 3+ total goals', () => {
    const data = computeTacticalPitchData(sampleProps);
    expect(data.calibration.status).toBe('hit');
    expect(data.calibration.statusText).toContain('Verified');
  });

  it('renders 2D SVG pitch, 15-minute phase chart, 10.0 player ratings, and interactive shot tooltip on click', () => {
    render(<LivePitchVisualizer {...sampleProps} />);

    expect(screen.getByTestId('live-pitch-visualizer')).toBeInTheDocument();
    expect(screen.getByText(/2D Tactical Pitch Control/i)).toBeInTheDocument();
    expect(screen.getByText(/15-Min Phase Dominance/i)).toBeInTheDocument();
    expect(screen.getByText(/Pre-Match Model vs. Live Reality/i)).toBeInTheDocument();
    expect(screen.getByText(/Projected Live Standings Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Match Player Ratings/i)).toBeInTheDocument();

    const svg = screen.getByRole('img', { name: /2D Shot Map and Field Tilt for Arsenal vs Chelsea/i });
    const circles = svg.querySelectorAll('g.cursor-pointer');
    expect(circles.length).toBeGreaterThan(0);

    fireEvent.click(circles[0]);
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });

  it('resolves regional broadcasters and free stream availability via getMatchBroadcastInfo', () => {
    const infoEA = getMatchBroadcastInfo({
      matchId: 'm-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      regionId: 'east_africa',
    });
    expect(infoEA.isAvailableToWatch).toBe(true);
    expect(infoEA.primaryBroadcaster.shortName).toBe('Showmax PL');
    expect(infoEA.hasFreeStream).toBe(true);

    const infoUK = getMatchBroadcastInfo({
      matchId: 'm-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      regionId: 'uk_ireland',
    });
    expect(infoUK.primaryBroadcaster.shortName).toBe('Sky Sports PL');

    const infoUndefined = getMatchBroadcastInfo({
      matchId: undefined,
      homeTeam: undefined,
      awayTeam: undefined,
      league: undefined,
    });
    expect(infoUndefined.isAvailableToWatch).toBe(true);
    expect(infoUndefined.regionalBroadcasters.length).toBeGreaterThan(0);
  });

  it('renders LiveStreamHubModal with 2D Live Cast and TV & Streams tabs', () => {
    render(
      <LiveStreamHubModal
        match={{
          id: 'm-101',
          homeTeam: 'Gor Mahia',
          awayTeam: 'AFC Leopards',
          league: 'FKF Premier League',
          homeScore: 1,
          awayScore: 0,
          minute: "67'",
          status: 'live',
          homeXG: 1.45,
          awayXG: 0.62,
          homePossession: 56,
          awayPossession: 44,
        }}
        regionId="east_africa"
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId('live-stream-hub-modal')).toBeInTheDocument();
    expect(screen.getByText(/Gor Mahia vs AFC Leopards/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-where-to-watch'));
    expect(screen.getAllByText(/Azam Sports HD/i).length).toBeGreaterThan(0);
  });

  it('renders GlobalMatchdayCommandRibbon with Player Ratings, Lineup Wire, and Daily IQ Challenge drawers', () => {
    render(
      <MemoryRouter>
        <GlobalMatchdayCommandRibbon />
      </MemoryRouter>
    );

    expect(screen.getByTestId('global-matchday-command-ribbon')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-player-ratings-drawer'));
    expect(screen.getByTestId('player-ratings-drawer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-tactical-pulse-drawer'));
    expect(screen.getByTestId('tactical-pulse-drawer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-iq-challenge-drawer'));
    expect(screen.getByTestId('iq-challenge-drawer')).toBeInTheDocument();
  });

  it('computes Expected Points (xPTS) Justice Table and Home/Away splits in Standings', () => {
    const eplRows = FALLBACK_STANDINGS[39] || [];
    const justiceRows = computeEnrichedStandings(eplRows, 'all', 'xg_justice');
    expect(justiceRows.length).toBeGreaterThan(0);
    expect(justiceRows[0].xPts).toBeGreaterThanOrEqual(justiceRows[1].xPts);
    expect(typeof justiceRows[0].justiceDelta).toBe('number');

    const homeSplit = computeEnrichedStandings(eplRows, 'home', 'official');
    expect(homeSplit[0].played).toBeLessThan(eplRows[0].played);
  });

  it('provides 10.0 ratings and 5-axis radar percentiles for global and CAF stars in ELITE_PLAYER_DATABASE', () => {
    expect(ELITE_PLAYER_DATABASE.length).toBeGreaterThanOrEqual(10);
    const haaland = ELITE_PLAYER_DATABASE.find((p) => p.name === 'Erling Haaland');
    expect(haaland?.rating).toBeGreaterThan(8.5);
    expect(haaland?.radar.finishingXg).toBeGreaterThanOrEqual(95);
    const cafStars = ELITE_PLAYER_DATABASE.filter((p) => p.isCafStar);
    expect(cafStars.length).toBeGreaterThanOrEqual(3);
  });

  it('provides regional press desk lineup & tactical xG wire entries in LIVE_LINEUP_TRANSFER_WIRE', () => {
    expect(LIVE_LINEUP_TRANSFER_WIRE).toHaveLength(4);
    expect(LIVE_LINEUP_TRANSFER_WIRE[0].xgDelta).toContain('xG');
    expect(LIVE_LINEUP_TRANSFER_WIRE[0].matchSlug).toMatch(/^\/predict\//);
  });
});
