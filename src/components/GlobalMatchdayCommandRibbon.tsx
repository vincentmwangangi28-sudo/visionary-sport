import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/TeamLogo';

export interface CommandRibbonMatch {
  id: string;
  slug: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: 'LIVE' | 'UPCOMING' | 'FT';
  minute?: number;
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
  status: 'CONFIRMED XI' | 'LATE FITNESS TEST' | 'RULED OUT' | 'TACTICAL SHIFT';
  impact: 'HIGH' | 'MEDIUM';
  summary: string;
  updatedAgo: string;
}

const FEATURED_MATCHDAY_RIBBON: CommandRibbonMatch[] = [
  {
    id: 'epl-ars-che',
    slug: 'arsenal-vs-chelsea',
    league: 'EPL',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    status: 'LIVE',
    minute: 68,
    homeScore: 2,
    awayScore: 1,
    homeXg: 1.94,
    awayXg: 0.88,
    kickoffTime: '19:00 UTC',
    tvChannels: ['Sky Sports Main Event', 'Peacock', 'SuperSport EPL', 'Showmax Pro KE'],
    topPlayer: {
      name: 'Bukayo Saka',
      team: 'Arsenal',
      rating: 8.9,
      keyStat: '1G · 0.78 xG · 4 Key Passes',
    },
    aiPick: 'Arsenal Win & Over 2.5',
    confidence: 86,
  },
  {
    id: 'epl-liv-mci',
    slug: 'liverpool-vs-manchester-city',
    league: 'EPL',
    homeTeam: 'Liverpool',
    awayTeam: 'Man City',
    status: 'LIVE',
    minute: 54,
    homeScore: 1,
    awayScore: 1,
    homeXg: 1.42,
    awayXg: 1.38,
    kickoffTime: '19:30 UTC',
    tvChannels: ['TNT Sports 1', 'USA Network', 'SuperSport Maximo', 'Canal+ Foot'],
    topPlayer: {
      name: 'Mohamed Salah',
      team: 'Liverpool',
      rating: 8.6,
      keyStat: '1G · 5 Progressive Carries',
    },
    aiPick: 'Both Teams To Score',
    confidence: 88,
  },
  {
    id: 'laliga-rma-bar',
    slug: 'real-madrid-vs-barcelona',
    league: 'LaLiga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    status: 'UPCOMING',
    homeXg: 1.85,
    awayXg: 1.62,
    kickoffTime: '20:00 UTC',
    tvChannels: ['ESPN+', 'Premier Sports 1', 'SuperSport LaLiga', 'DAZN LaLiga'],
    topPlayer: {
      name: 'Jude Bellingham',
      team: 'Real Madrid',
      rating: 8.5,
      keyStat: '0.64 xG + xA / 90',
    },
    aiPick: 'Over 2.5 Goals',
    confidence: 84,
  },
  {
    id: 'kpl-gor-afc',
    slug: 'gor-mahia-vs-afc-leopards',
    league: 'KPL',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    status: 'UPCOMING',
    homeXg: 1.56,
    awayXg: 0.79,
    kickoffTime: '15:00 EAT',
    tvChannels: ['Azam Sports 1 HD', 'KBC Channel 1', 'FKF Live Stream'],
    topPlayer: {
      name: 'Austin Odhiambo',
      team: 'Gor Mahia',
      rating: 8.3,
      keyStat: '0.58 xG+xA · 3 Key Passes/90',
    },
    aiPick: 'Gor Mahia Win (1X2)',
    confidence: 82,
  },
  {
    id: 'ucl-bay-bvb',
    slug: 'bayern-munich-vs-borussia-dortmund',
    league: 'Bundesliga',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Dortmund',
    status: 'UPCOMING',
    homeXg: 2.34,
    awayXg: 1.28,
    kickoffTime: '17:30 UTC',
    tvChannels: ['Sky Sport Bundesliga 1', 'ESPN+', 'StarTimes World Football'],
    topPlayer: {
      name: 'Harry Kane',
      team: 'Bayern Munich',
      rating: 9.1,
      keyStat: '1.12 xG/90 · 5 Shots On Target',
    },
    aiPick: 'Bayern Win & Over 2.5',
    confidence: 89,
  },
];

const CONFIRMED_LINEUP_WIRE: LineupNewsAlert[] = [
  {
    id: 'lw-1',
    team: 'Arsenal',
    league: 'Premier League',
    player: 'Martin Ødegaard & Bukayo Saka',
    status: 'CONFIRMED XI',
    impact: 'HIGH',
    summary: 'Both start in Arsenal 4-3-3 high-press setup; boosts home attacking xG by +0.34.',
    updatedAgo: '4m ago',
  },
  {
    id: 'lw-2',
    team: 'Real Madrid',
    league: 'LaLiga',
    player: 'Kylian Mbappé & Vinícius Jr.',
    status: 'CONFIRMED XI',
    impact: 'HIGH',
    summary: 'Ancelotti deploys dual-split forwards to target high defensive line in transition.',
    updatedAgo: '11m ago',
  },
  {
    id: 'lw-3',
    team: 'Gor Mahia',
    league: 'FKF Premier League',
    player: 'Austin Odhiambo',
    status: 'CONFIRMED XI',
    impact: 'MEDIUM',
    summary: 'Cleared to start in central attacking midfield for the Mashemeji Derby clash.',
    updatedAgo: '18m ago',
  },
];

export const GlobalMatchdayCommandRibbon: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'TV'>('ALL');
  const [activeDrawer, setActiveDrawer] = useState<'NONE' | 'RATINGS' | 'LINEUPS' | 'TRIVIA'>('NONE');
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'LIVE') {
      return FEATURED_MATCHDAY_RIBBON.filter((m) => m.status === 'LIVE');
    }
    return FEATURED_MATCHDAY_RIBBON;
  }, [activeFilter]);

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
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Scores
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('LIVE')}
              data-testid="ribbon-filter-live"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer ${
                activeFilter === 'LIVE'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Live
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('TV')}
              data-testid="ribbon-filter-tv"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'TV'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              TV
            </button>
          </div>

          {/* Center: Clean Horizontal Scoreboard Strip (ESPN / BBC Sport Style) */}
          <div className="flex items-center divide-x divide-border overflow-x-auto no-scrollbar flex-1 min-w-0">
            {filteredMatches.map((m) => (
              <Link
                key={m.id}
                to={m.status === 'LIVE' ? '/live' : `/predict/${m.slug}`}
                data-testid={`ribbon-match-card-${m.id}`}
                className="px-3 py-0.5 hover:bg-muted/40 transition-colors shrink-0 flex items-center gap-2.5 text-xs"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {m.league}
                </span>

                <div className="flex items-center gap-1.5">
                  <TeamLogo team={m.homeTeam} size="xs" badgeOnly />
                  <span className="font-medium text-foreground">{m.homeTeam}</span>
                  {m.status === 'LIVE' ? (
                    <span className="font-mono tabular-nums font-bold text-foreground px-1">
                      {m.homeScore} - {m.awayScore}
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
                    {m.minute}&apos;
                  </span>
                ) : (
                  <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                    {m.kickoffTime.replace(' UTC', '')}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right: Quiet Text Toggles for Matchday Drawers */}
          <div className="hidden md:flex items-center gap-3 shrink-0 border-l border-border pl-3 text-[11px]">
            <button
              type="button"
              onClick={() => toggleDrawer('RATINGS')}
              data-testid="toggle-player-ratings-drawer"
              className={`transition-colors cursor-pointer whitespace-nowrap ${
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
              className={`transition-colors cursor-pointer whitespace-nowrap ${
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
              className={`transition-colors cursor-pointer whitespace-nowrap ${
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
                Matchday Player Ratings &amp; TV Broadcast Channels
              </p>
              <Link to="/players" className="text-xs font-medium text-foreground hover:underline">
                Full Player Database →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {FEATURED_MATCHDAY_RIBBON.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-md border border-border bg-background flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{m.topPlayer.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {m.topPlayer.team} · {m.league}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono tabular-nums text-xs font-bold shrink-0">
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
                Confirmed Starting XIs &amp; Team News
              </p>
              <Link to="/news" className="text-xs font-medium text-foreground hover:underline">
                All Team News →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {CONFIRMED_LINEUP_WIRE.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-md border border-border bg-background space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">
                      {item.team} · {item.status}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">{item.updatedAgo}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{item.player}</p>
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
                            ? 'bg-emerald-600 text-white border-emerald-600'
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
