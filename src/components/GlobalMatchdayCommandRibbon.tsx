import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/TeamLogo';
import { queryClient } from '@/lib/queryClient';
import type { Prediction } from '@/types/prediction';

export interface CommandRibbonMatch {
  id: string;
  slug: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: 'LIVE' | 'UPCOMING' | 'FT';
  minute?: string;
  homeScore?: number;
  awayScore?: number;
  homeXg: number;
  awayXg: number;
  kickoffTime: string;
  tvChannels: string[];
  topPlayer: {
    name: string;
    team: string;
    rating: number;
    keyStat: string;
  };
  aiPick: string;
  confidence: number;
}

export interface LineupNewsAlert {
  id: string;
  team: string;
  league: string;
  player: string;
  status: 'CONFIRMED SQUAD' | 'PRE-MATCH BRIEF' | 'TACTICAL MODEL';
  impact: 'HIGH' | 'MEDIUM';
  summary: string;
  updatedAgo: string;
}

function formatSlug(home: string, away: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${clean(home)}-vs-${clean(away)}`;
}

function resolveBroadcastChannels(league: string): string[] {
  const l = league.toLowerCase();
  if (l.includes('champions league') || l.includes('ucl')) {
    return ['TNT Sports', 'Paramount+', 'SuperSport Maximo', 'Canal+'];
  }
  if (l.includes('europa') || l.includes('conference')) {
    return ['TNT Sports', 'Paramount+', 'SuperSport Variety', 'Stan Sport'];
  }
  if (l.includes('premier league') && !l.includes('kenya')) {
    return ['Sky Sports EPL', 'Peacock', 'SuperSport EPL', 'Showmax PL'];
  }
  if (l.includes('la liga') || l.includes('laliga')) {
    return ['ESPN+', 'SuperSport LaLiga', 'Premier Sports', 'DAZN'];
  }
  if (l.includes('serie a')) {
    return ['Paramount+', 'TNT Sports', 'SuperSport Football', 'DAZN'];
  }
  if (l.includes('bundesliga')) {
    return ['ESPN+', 'Sky Sport Bundesliga', 'StarTimes World Football'];
  }
  if (l.includes('ligue 1')) {
    return ['beIN SPORTS', 'Ligue 1 Pass', 'SuperSport', 'Canal+'];
  }
  if (l.includes('kpl') || l.includes('kenya')) {
    return ['Azam Sports HD', 'KBC Channel 1', 'FKF Live'];
  }
  if (l.includes('caf') || l.includes('afcon')) {
    return ['SuperSport PSL', 'beIN SPORTS', 'Azam Sports', 'Canal+ Sport'];
  }
  return ['Official League Pass', 'SuperSport Football', 'ESPN+'];
}

function formatKickoffDisplay(dateStr?: string): string {
  if (!dateStr) return 'Upcoming';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Upcoming';

  const now = new Date();
  const isToday =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();

  const timePart = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) {
    return timePart;
  }

  const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${monthDay}, ${timePart}`;
}

function mapFixtureToRibbonMatch(raw: Record<string, any>, idx: number): CommandRibbonMatch {
  const homeTeam = String(raw.home_team || raw.homeTeam || 'Home');
  const awayTeam = String(raw.away_team || raw.awayTeam || 'Away');
  const league = String(raw.league || 'Football');
  const rawStatus = String(raw.status || 'upcoming').toLowerCase();

  const isLive = rawStatus === 'live' || rawStatus === 'halftime' || rawStatus === 'in_play';
  const isFt = rawStatus === 'finished' || rawStatus === 'ft';
  const status: 'LIVE' | 'UPCOMING' | 'FT' = isLive ? 'LIVE' : isFt ? 'FT' : 'UPCOMING';

  const homeOdds = Number(raw.home_odds) || 2.1;
  const awayOdds = Number(raw.away_odds) || 3.1;
  const homeXg = Number(Math.max(0.65, Math.min(2.85, 2.9 / Math.max(1.15, homeOdds))).toFixed(2));
  const awayXg = Number(Math.max(0.55, Math.min(2.45, 2.7 / Math.max(1.2, awayOdds))).toFixed(2));

  const confidence = Number(raw.confidence || raw.confidence_score) || 76;
  const aiPick = String(raw.prediction || raw.predicted_outcome || `${homeTeam} or Draw`);
  const favoredTeam = homeXg >= awayXg ? homeTeam : awayTeam;
  const rating = Number(Math.min(9.4, Math.max(7.6, 7.2 + (confidence - 60) * 0.05)).toFixed(1));

  const rawMin = String(raw.minute || '').replace(/'/g, '').trim();
  const minute = isLive ? (rawMin && rawMin !== '0' ? `${rawMin}'` : 'LIVE') : undefined;

  return {
    id: String(raw.id || raw.match_id || `fixture-${idx}`),
    slug: formatSlug(homeTeam, awayTeam),
    league,
    homeTeam,
    awayTeam,
    status,
    minute,
    homeScore: isLive || isFt ? Number(raw.home_score ?? 0) : undefined,
    awayScore: isLive || isFt ? Number(raw.away_score ?? 0) : undefined,
    homeXg,
    awayXg,
    kickoffTime: formatKickoffDisplay(raw.match_date || raw.kickoff),
    tvChannels: resolveBroadcastChannels(league),
    topPlayer: {
      name: `${favoredTeam} Attack Unit`,
      team: favoredTeam,
      rating,
      keyStat: `${Math.max(homeXg, awayXg).toFixed(2)} Projected xG · ${confidence}% Model Conf.`,
    },
    aiPick,
    confidence,
  };
}

function buildLineupWireFromMatches(matches: CommandRibbonMatch[]): LineupNewsAlert[] {
  return matches.slice(0, 3).map((m, idx) => ({
    id: `lw-${m.id}-${idx}`,
    team: `${m.homeTeam} vs ${m.awayTeam}`,
    league: m.league,
    player: `Model Pick: ${m.aiPick} (${m.confidence}% Confidence)`,
    status: m.status === 'LIVE' ? 'TACTICAL MODEL' : 'PRE-MATCH BRIEF',
    impact: m.confidence >= 80 ? 'HIGH' : 'MEDIUM',
    summary: `Projected Expected Goals (xG): ${m.homeTeam} ${m.homeXg.toFixed(2)} – ${m.awayXg.toFixed(2)} ${m.awayTeam}. Kickoff: ${m.kickoffTime}.`,
    updatedAgo: m.status === 'LIVE' ? 'Live' : m.kickoffTime,
  }));
}

const INITIAL_FALLBACK_MATCHES: CommandRibbonMatch[] = [
  {
    id: 'ucl-avl-vik',
    slug: 'aston-villa-vs-viking-fk',
    league: 'Champions League',
    homeTeam: 'Aston Villa',
    awayTeam: 'Viking FK',
    status: 'UPCOMING',
    homeXg: 1.82,
    awayXg: 0.94,
    kickoffTime: formatKickoffDisplay(new Date(Date.now() + 3600 * 1000 * 3).toISOString()),
    tvChannels: ['TNT Sports', 'Paramount+', 'SuperSport Maximo'],
    topPlayer: {
      name: 'Aston Villa Attack Unit',
      team: 'Aston Villa',
      rating: 8.4,
      keyStat: '1.82 Projected xG · 78% Model Conf.',
    },
    aiPick: 'Aston Villa Win',
    confidence: 78,
  },
  {
    id: 'uecl-kai-pan',
    slug: 'kairat-almaty-vs-panathinaikos',
    league: 'Conference League',
    homeTeam: 'Kairat Almaty',
    awayTeam: 'Panathinaikos',
    status: 'UPCOMING',
    homeXg: 1.18,
    awayXg: 1.34,
    kickoffTime: formatKickoffDisplay(new Date(Date.now() + 3600 * 1000 * 5).toISOString()),
    tvChannels: ['TNT Sports', 'Paramount+', 'SuperSport Variety'],
    topPlayer: {
      name: 'Panathinaikos Attack Unit',
      team: 'Panathinaikos',
      rating: 8.1,
      keyStat: '1.34 Projected xG · 72% Model Conf.',
    },
    aiPick: 'Panathinaikos or Draw (X2)',
    confidence: 72,
  },
  {
    id: 'uecl-nor-csk',
    slug: 'fc-nordsjaelland-vs-cska-sofia',
    league: 'Conference League',
    homeTeam: 'FC Nordsjælland',
    awayTeam: 'CSKA Sofia',
    status: 'UPCOMING',
    homeXg: 1.64,
    awayXg: 0.89,
    kickoffTime: formatKickoffDisplay(new Date(Date.now() + 3600 * 1000 * 7).toISOString()),
    tvChannels: ['TNT Sports', 'Paramount+', 'SuperSport Variety'],
    topPlayer: {
      name: 'FC Nordsjælland Attack Unit',
      team: 'FC Nordsjælland',
      rating: 8.3,
      keyStat: '1.64 Projected xG · 76% Model Conf.',
    },
    aiPick: 'FC Nordsjælland Win',
    confidence: 76,
  },
];

export const GlobalMatchdayCommandRibbon: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'TV'>('ALL');
  const [activeDrawer, setActiveDrawer] = useState<'NONE' | 'RATINGS' | 'LINEUPS' | 'TRIVIA'>('NONE');
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);
  const [ribbonMatches, setRibbonMatches] = useState<CommandRibbonMatch[]>(() => {
    try {
      const cachedQuery = queryClient.getQueryData<{ allPredictions?: Prediction[] }>(['predictions', 'list', 'all']);
      if (cachedQuery?.allPredictions && cachedQuery.allPredictions.length > 0) {
        return cachedQuery.allPredictions.slice(0, 8).map((item, idx) => mapFixtureToRibbonMatch(item as Record<string, any>, idx));
      }
      if (typeof window !== 'undefined' && !((import.meta as any).env?.MODE === 'test' || (globalThis as any).__vitest_worker__)) {
        const storedRibbon = localStorage.getItem('predictpro_ribbon_matches_v1');
        if (storedRibbon) {
          const parsed = JSON.parse(storedRibbon) as { timestamp: number; matches: CommandRibbonMatch[] };
          if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0 && Date.now() - parsed.timestamp < 3600_000) {
            return parsed.matches;
          }
        }
        const storedUpcoming = localStorage.getItem('predictpro_real_upcoming_v1');
        if (storedUpcoming) {
          const parsedUp = JSON.parse(storedUpcoming) as { timestamp: number; fixtures: Record<string, any>[] };
          if (parsedUp && Array.isArray(parsedUp.fixtures) && parsedUp.fixtures.length > 0) {
            return parsedUp.fixtures.slice(0, 8).map((item, idx) => mapFixtureToRibbonMatch(item, idx));
          }
        }
      }
    } catch {
      // ignore cache read errors
    }
    return INITIAL_FALLBACK_MATCHES;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    // Skip network polling in unit test environment
    if ((import.meta as any).env?.MODE === 'test' || (globalThis as any).__vitest_worker__) {
      return;
    }

    let cancelled = false;

    const syncRealMatchdayFixtures = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.allSettled([
          fetch('/api/football?type=live'),
          fetch('/api/football?type=upcoming'),
        ]);

        if (cancelled) return;

        const combined: Record<string, any>[] = [];
        const seenSlugs = new Set<string>();

        if (liveRes.status === 'fulfilled' && liveRes.value.ok) {
          const liveData = await liveRes.value.json();
          const liveList = Array.isArray(liveData?.matches) ? liveData.matches : [];
          for (const item of liveList) {
            if (!item?.home_team || !item?.away_team) continue;
            const slug = formatSlug(item.home_team, item.away_team);
            if (!seenSlugs.has(slug)) {
              seenSlugs.add(slug);
              combined.push(item);
            }
          }
        }

        if (upcomingRes.status === 'fulfilled' && upcomingRes.value.ok) {
          const upData = await upcomingRes.value.json();
          const upList = Array.isArray(upData?.fixtures)
            ? upData.fixtures
            : Array.isArray(upData?.predictions)
              ? upData.predictions
              : [];
          for (const item of upList) {
            if (!item?.home_team || !item?.away_team) continue;
            const slug = formatSlug(item.home_team, item.away_team);
            if (!seenSlugs.has(slug)) {
              seenSlugs.add(slug);
              combined.push(item);
            }
          }
        }

        if (!cancelled && combined.length > 0) {
          // Prioritize truly live matches first, then soonest upcoming kickoffs
          combined.sort((a, b) => {
            const aLive = a.status === 'live' || a.status === 'halftime' ? 0 : 1;
            const bLive = b.status === 'live' || a.status === 'halftime' ? 0 : 1;
            if (aLive !== bLive) return aLive - bLive;
            const aTime = new Date(a.match_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
            const bTime = new Date(b.match_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          });

          const nextMatches = combined.slice(0, 10).map((item, idx) => mapFixtureToRibbonMatch(item, idx));
          setRibbonMatches(nextMatches);
          try {
            localStorage.setItem(
              'predictpro_ribbon_matches_v1',
              JSON.stringify({ timestamp: Date.now(), matches: nextMatches })
            );
          } catch {
            // ignore storage errors
          }
        }
      } catch {
        // Keep existing ribbon matches on transient network error
      }
    };

    syncRealMatchdayFixtures();
    const interval = window.setInterval(syncRealMatchdayFixtures, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const liveMatchesCount = useMemo(
    () => ribbonMatches.filter((m) => m.status === 'LIVE').length,
    [ribbonMatches]
  );

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'LIVE') {
      const liveOnly = ribbonMatches.filter((m) => m.status === 'LIVE');
      return liveOnly.length > 0 ? liveOnly : ribbonMatches.slice(0, 6);
    }
    return ribbonMatches;
  }, [activeFilter, ribbonMatches]);

  const lineupWire = useMemo(() => buildLineupWireFromMatches(ribbonMatches), [ribbonMatches]);

  const toggleDrawer = (drawer: 'RATINGS' | 'LINEUPS' | 'TRIVIA') => {
    setActiveDrawer((prev) => (prev === drawer ? 'NONE' : drawer));
  };

  return (
    <section
      aria-label="Live Matchday Scoreboard & Broadcast Ticker"
      data-testid="global-matchday-command-ribbon"
      className="w-full bg-card border-b border-border"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
          {/* Left: Subtle Scoreboard Filter */}
          <div className="flex items-center gap-1 shrink-0 border-r border-border pr-3">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              data-testid="ribbon-filter-all"
              className={`px-2 py-1 min-h-[24px] inline-flex items-center rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fixtures ({ribbonMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('LIVE')}
              data-testid="ribbon-filter-live"
              className={`px-2 py-1 min-h-[24px] rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer ${
                activeFilter === 'LIVE'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  liveMatchesCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-muted-foreground/50'
                }`}
              />
              Live {liveMatchesCount > 0 ? `(${liveMatchesCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('TV')}
              data-testid="ribbon-filter-tv"
              className={`px-2 py-1 min-h-[24px] inline-flex items-center rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'TV'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              TV
            </button>
          </div>

          {/* Center: Clean Horizontal Scoreboard Strip (Synced with Live & Upcoming API Feed) */}
          <div className="flex items-center divide-x divide-border overflow-x-auto no-scrollbar flex-1 min-w-0">
            {activeFilter === 'LIVE' && liveMatchesCount === 0 && (
              <Link
                to="/live"
                className="px-3 py-1 min-h-[24px] inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground shrink-0 font-medium"
              >
                0 in-play right now · Showing next kickoffs:
              </Link>
            )}
            {filteredMatches.map((m) => (
              <Link
                key={m.id}
                to={m.status === 'LIVE' ? '/live' : `/predict/${m.slug}`}
                data-testid={`ribbon-match-card-${m.id}`}
                className="px-3 py-1 min-h-[24px] hover:bg-muted/40 transition-colors shrink-0 flex items-center gap-2.5 text-xs"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {m.league}
                </span>

                <div className="flex items-center gap-1.5">
                  <TeamLogo team={m.homeTeam} size="xs" badgeOnly />
                  <span className="font-medium text-foreground">{m.homeTeam}</span>
                  {m.status === 'LIVE' || m.status === 'FT' ? (
                    <span className="font-mono tabular-nums font-bold text-foreground px-1">
                      {m.homeScore ?? 0} - {m.awayScore ?? 0}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">v</span>
                  )}
                  <TeamLogo team={m.awayTeam} size="xs" badgeOnly />
                  <span className="font-medium text-foreground">{m.awayTeam}</span>
                </div>

                {activeFilter === 'TV' ? (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {m.tvChannels[0]}
                  </span>
                ) : m.status === 'LIVE' ? (
                  <span className="font-mono tabular-nums text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    {m.minute}
                  </span>
                ) : (
                  <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                    {m.kickoffTime}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right: Quiet Text Toggles for Matchday Drawers & Pro Tools */}
          <div className="hidden md:flex items-center gap-3 shrink-0 border-l border-border pl-3 text-[11px]">
            <Link
              to="/slip-generator"
              data-testid="ribbon-link-slip-generator"
              className="min-h-[24px] px-1.5 inline-flex items-center rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-semibold transition-colors whitespace-nowrap"
            >
              Booking Codes
            </Link>
            <Link
              to="/closing-line-value"
              data-testid="ribbon-link-clv-scanner"
              className="min-h-[24px] px-1 inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap"
            >
              CLV Scanner
            </Link>
            <Link
              to="/sgp-builder"
              data-testid="ribbon-link-sgp-builder"
              className="min-h-[24px] px-1 inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap"
            >
              SGP Copula
            </Link>
            <Link
              to="/poisson-calculator"
              data-testid="ribbon-link-poisson-matrix"
              className="min-h-[24px] px-1 inline-flex items-center text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap"
            >
              6×6 Matrix
            </Link>
            <button
              type="button"
              onClick={() => toggleDrawer('RATINGS')}
              data-testid="toggle-player-ratings-drawer"
              className={`min-h-[24px] px-1 inline-flex items-center transition-colors cursor-pointer whitespace-nowrap ${
                activeDrawer === 'RATINGS'
                  ? 'text-foreground font-semibold underline underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              Player Ratings
            </button>
            <button
              type="button"
              onClick={() => toggleDrawer('LINEUPS')}
              data-testid="toggle-tactical-pulse-drawer"
              className={`min-h-[24px] px-1 inline-flex items-center transition-colors cursor-pointer whitespace-nowrap ${
                activeDrawer === 'LINEUPS'
                  ? 'text-foreground font-semibold underline underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              Lineups
            </button>
            <button
              type="button"
              onClick={() => toggleDrawer('TRIVIA')}
              data-testid="toggle-iq-challenge-drawer"
              className={`min-h-[24px] px-1 inline-flex items-center transition-colors cursor-pointer whitespace-nowrap ${
                activeDrawer === 'TRIVIA'
                  ? 'text-foreground font-semibold underline underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              Daily Quiz
            </button>
          </div>
        </div>

        {/* Expandable Drawers */}
        {activeDrawer === 'RATINGS' && (
          <div
            data-testid="player-ratings-drawer"
            className="py-3 border-t border-border animate-fade-in space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Matchday Unit Ratings &amp; TV Broadcast Channels
              </p>
              <Link to="/players" className="text-xs font-medium text-foreground hover:underline">
                Full Player Database →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {ribbonMatches.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-md border border-border bg-background flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{m.topPlayer.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {m.homeTeam} vs {m.awayTeam} · {m.league}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-mono tabular-nums text-xs font-bold shrink-0">
                      {m.topPlayer.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {m.topPlayer.keyStat}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate pt-1 border-t border-border">
                    TV: {m.tvChannels.slice(0, 2).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDrawer === 'LINEUPS' && (
          <div
            data-testid="tactical-pulse-drawer"
            className="py-3 border-t border-border animate-fade-in space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Pre-Match Tactical Models &amp; Fixture Briefings
              </p>
              <Link to="/news" className="text-xs font-medium text-foreground hover:underline">
                All Team News →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {lineupWire.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-md border border-border bg-background space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">
                      {item.league} · {item.status}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">{item.updatedAgo}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{item.team}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDrawer === 'TRIVIA' && (
          <div
            data-testid="iq-challenge-drawer"
            className="py-3 border-t border-border animate-fade-in"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Daily Football Quiz: Which Premier League club posted the highest single-match xG (4.38) this season?
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {['Arsenal vs Chelsea', 'Liverpool vs Spurs', 'Man City vs Newcastle'].map((opt, idx) => {
                  const isCorrect = idx === 1;
                  const isChosen = triviaSelected === idx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTriviaSelected(idx)}
                      data-testid={`trivia-option-${idx}`}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        isChosen
                          ? isCorrect
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            {triviaSelected !== null && (
              <p
                data-testid="trivia-feedback"
                className="mt-2 text-xs font-medium text-foreground"
              >
                {triviaSelected === 1
                  ? 'Correct! Liverpool generated 4.38 xG from 9 big chances created.'
                  : 'Not quite — Liverpool vs Spurs recorded the 4.38 xG peak this campaign.'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default GlobalMatchdayCommandRibbon;
