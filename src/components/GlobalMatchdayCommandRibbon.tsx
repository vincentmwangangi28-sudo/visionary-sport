import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Tv,
  Activity,
  Award,
  Flame,
  Newspaper,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Crosshair,
  Calendar,
} from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

export interface CommandRibbonMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'live' | 'upcoming' | 'finished';
  minuteOrTime: string;
  homeXG: number;
  awayXG: number;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  mvpPlayer: string;
  mvpRating: number;
  broadcaster: string;
  isFreeStream: boolean;
  previewSlug: string;
}

export interface TopRatedPlayerItem {
  id: string;
  name: string;
  club: string;
  league: string;
  position: string;
  rating: number;
  xgPlusXa: string;
  keyStat: string;
}

export interface TacticalPulseNewsItem {
  id: string;
  tag: string;
  clubOrMatch: string;
  headline: string;
  xgImpact: string;
  timeAgo: string;
}

const DEFAULT_RIBBON_MATCHES: CommandRibbonMatch[] = [
  {
    id: 'cmd-1',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    minuteOrTime: "68'",
    homeXG: 1.94,
    awayXG: 0.88,
    homeProb: 74,
    drawProb: 17,
    awayProb: 9,
    mvpPlayer: 'B. Saka',
    mvpRating: 8.8,
    broadcaster: 'Showmax PL / Sky',
    isFreeStream: false,
    previewSlug: '/predict/arsenal-vs-chelsea',
  },
  {
    id: 'cmd-2',
    league: 'Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 1,
    awayScore: 1,
    status: 'live',
    minuteOrTime: "54'",
    homeXG: 1.42,
    awayXG: 1.38,
    homeProb: 44,
    drawProb: 28,
    awayProb: 28,
    mvpPlayer: 'J. Bellingham',
    mvpRating: 8.6,
    broadcaster: 'SuperSport / Paramount+',
    isFreeStream: true,
    previewSlug: '/predict/real-madrid-vs-barcelona',
  },
  {
    id: 'cmd-3',
    league: 'FKF Premier League',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    minuteOrTime: "72'",
    homeXG: 1.56,
    awayXG: 0.54,
    homeProb: 78,
    drawProb: 15,
    awayProb: 7,
    mvpPlayer: 'A. Odhiambo',
    mvpRating: 8.4,
    broadcaster: 'Azam HD / KBC FTA',
    isFreeStream: true,
    previewSlug: '/predict/gor-mahia-vs-afc-leopards',
  },
  {
    id: 'cmd-4',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Manchester City',
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    minuteOrTime: '19:30',
    homeXG: 1.78,
    awayXG: 1.61,
    homeProb: 43,
    drawProb: 26,
    awayProb: 31,
    mvpPlayer: 'M. Salah',
    mvpRating: 8.9,
    broadcaster: 'SuperSport 203 / Peacock',
    isFreeStream: false,
    previewSlug: '/predict/liverpool-vs-manchester-city',
  },
  {
    id: 'cmd-5',
    league: 'Bundesliga',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    homeScore: 3,
    awayScore: 1,
    status: 'finished',
    minuteOrTime: 'FT',
    homeXG: 2.65,
    awayXG: 1.12,
    homeProb: 82,
    drawProb: 11,
    awayProb: 7,
    mvpPlayer: 'H. Kane',
    mvpRating: 9.2,
    broadcaster: 'FIFA+ / ESPN+',
    isFreeStream: true,
    previewSlug: '/predict/bayern-munich-vs-borussia-dortmund',
  },
];

const TOP_RATED_PLAYERS: TopRatedPlayerItem[] = [
  {
    id: 'p-1',
    name: 'Harry Kane',
    club: 'Bayern Munich',
    league: 'Bundesliga',
    position: 'ST',
    rating: 9.2,
    xgPlusXa: '1.48 xG + 0.42 xA',
    keyStat: '2 Goals · 6 Box Touches',
  },
  {
    id: 'p-2',
    name: 'Mohamed Salah',
    club: 'Liverpool',
    league: 'Premier League',
    position: 'RW',
    rating: 8.9,
    xgPlusXa: '1.15 xG + 0.68 xA',
    keyStat: '4 Key Passes · 91% Pass Acc',
  },
  {
    id: 'p-3',
    name: 'Bukayo Saka',
    club: 'Arsenal',
    league: 'Premier League',
    position: 'RW',
    rating: 8.8,
    xgPlusXa: '0.92 xG + 0.74 xA',
    keyStat: '7 Progressive Carries',
  },
  {
    id: 'p-4',
    name: 'Jude Bellingham',
    club: 'Real Madrid',
    league: 'La Liga / UCL',
    position: 'CAM',
    rating: 8.6,
    xgPlusXa: '0.78 xG + 0.51 xA',
    keyStat: '11 Duels Won · 3 Tackles',
  },
];

const TACTICAL_PULSE_ITEMS: TacticalPulseNewsItem[] = [
  {
    id: 'tp-1',
    tag: 'Confirmed Lineup Impact',
    clubOrMatch: 'Arsenal vs Chelsea',
    headline: 'High-press 4-3-3 confirmed; Ødegaard & Saka start in right half-space overload.',
    xgImpact: '+0.34 Home xG',
    timeAgo: '12m ago',
  },
  {
    id: 'tp-2',
    tag: 'Tactical Press Shift',
    clubOrMatch: 'Liverpool vs Man City',
    headline: 'Midblock transition model projects 14+ high turnovers in central midfield zone.',
    xgImpact: '68% BTTS Prob',
    timeAgo: '24m ago',
  },
  {
    id: 'tp-3',
    tag: 'CAF & East Africa Derby',
    clubOrMatch: 'Gor Mahia vs AFC Leopards',
    headline: 'Full-back overlapping width driving 64% final-third field tilt in Nairobi.',
    xgImpact: '+0.41 Home xG',
    timeAgo: '35m ago',
  },
];

const IQ_STORAGE_KEY = 'predictpro_daily_iq_picks_v1';

export const GlobalMatchdayCommandRibbon: React.FC = () => {
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'ratings' | 'pulse' | 'iq_challenge'>('none');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'free_stream'>('all');
  const [userPicks, setUserPicks] = useState<Record<string, '1' | 'X' | '2'>>(() => {
    try {
      const raw = localStorage.getItem(IQ_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const filteredMatches = useMemo(() => {
    if (statusFilter === 'live') return DEFAULT_RIBBON_MATCHES.filter((m) => m.status === 'live');
    if (statusFilter === 'upcoming') return DEFAULT_RIBBON_MATCHES.filter((m) => m.status === 'upcoming');
    if (statusFilter === 'free_stream') return DEFAULT_RIBBON_MATCHES.filter((m) => m.isFreeStream);
    return DEFAULT_RIBBON_MATCHES;
  }, [statusFilter]);

  const handleSelectIqPick = (matchId: string, choice: '1' | 'X' | '2') => {
    setUserPicks((prev) => {
      const next = { ...prev, [matchId]: choice };
      try {
        localStorage.setItem(IQ_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const iqScore = useMemo(() => {
    let aligned = 0;
    const total = Object.keys(userPicks).length;
    for (const m of DEFAULT_RIBBON_MATCHES) {
      const pick = userPicks[m.id];
      if (!pick) continue;
      const modelFav = m.homeProb >= m.awayProb && m.homeProb >= m.drawProb ? '1' : m.awayProb > m.homeProb ? '2' : 'X';
      if (pick === modelFav) aligned++;
    }
    return { total, aligned, rating: 1200 + total * 25 + aligned * 40 };
  }, [userPicks]);

  return (
    <section
      aria-label="Live Matchday Scoreboard, Player Ratings & Tactical Command Ribbon"
      className="border-b border-border/70 bg-card/80 backdrop-blur-md"
      data-testid="global-matchday-command-ribbon"
    >
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-2.5 space-y-2.5">
        {/* Top Control Row: Mode Filters (ESPN/Flashscore) + Feature Drawers (FotMob/Marca/Chess.com IQ) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Quick Matchday Filter Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Matchday Pulse ({DEFAULT_RIBBON_MATCHES.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('live')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'live'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              In-Play ({DEFAULT_RIBBON_MATCHES.filter((m) => m.status === 'live').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('free_stream')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'free_stream'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tv className="h-3 w-3" />
              Free Streams / TV ({DEFAULT_RIBBON_MATCHES.filter((m) => m.isFreeStream).length})
            </button>
          </div>

          {/* Right: FotMob 10.0 Ratings, Marca Tactical Wire & Daily IQ Streak Toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'ratings' ? 'none' : 'ratings')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDrawer === 'ratings'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted/70 text-foreground border-border/80'
              }`}
              data-testid="toggle-player-ratings-drawer"
            >
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>Player Ratings (10.0)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'pulse' ? 'none' : 'pulse')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDrawer === 'pulse'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted/70 text-foreground border-border/80'
              }`}
              data-testid="toggle-tactical-pulse-drawer"
            >
              <Newspaper className="h-3.5 w-3.5 text-sky-500" />
              <span>Lineup &amp; xG Wire</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'iq_challenge' ? 'none' : 'iq_challenge')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDrawer === 'iq_challenge'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted/70 text-foreground border-border/80'
              }`}
              data-testid="toggle-iq-challenge-drawer"
            >
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              <span>Daily IQ Challenge ({iqScore.rating} ELO)</span>
            </button>

            <Link
              to="/live"
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 whitespace-nowrap"
            >
              <Crosshair className="h-3 w-3" />
              <span>2D Live Center</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ESPN / SofaScore / FotMob Horizontal Matchday Scoreboard Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {filteredMatches.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl border border-border/70 bg-background/90 hover:border-primary/40 transition-all flex flex-col justify-between gap-2"
            >
              {/* Top Meta Line: Unboxed Clean Typography (League · Status · TV) */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-semibold truncate max-w-[115px] text-foreground/80">
                  {m.league}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  {m.status === 'live' ? (
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      ● {m.minuteOrTime}
                    </span>
                  ) : (
                    <span className="font-bold">{m.minuteOrTime}</span>
                  )}
                </div>
              </div>

              {/* Teams & Score / xG */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamLogo team={m.homeTeam} size="xs" badgeOnly />
                    <span className="font-bold truncate text-foreground">{m.homeTeam}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <span className="text-[10px] text-muted-foreground">({m.homeXG})</span>
                    <span className="font-black text-foreground">{m.homeScore ?? '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamLogo team={m.awayTeam} size="xs" badgeOnly />
                    <span className="font-bold truncate text-foreground">{m.awayTeam}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <span className="text-[10px] text-muted-foreground">({m.awayXG})</span>
                    <span className="font-black text-foreground">{m.awayScore ?? '-'}</span>
                  </div>
                </div>
              </div>

              {/* 1X2 Probability Bar + FotMob MVP Rating & Broadcast Link */}
              <div className="pt-1 border-t border-border/50 space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden flex">
                  <div style={{ width: `${m.homeProb}%` }} className="bg-emerald-500" />
                  <div style={{ width: `${m.drawProb}%` }} className="bg-amber-500" />
                  <div style={{ width: `${m.awayProb}%` }} className="bg-sky-500" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-mono text-foreground font-semibold">
                    ★ {m.mvpPlayer} {m.mvpRating.toFixed(1)}
                  </span>
                  <Link
                    to={m.status === 'live' ? '/live' : m.previewSlug}
                    className="font-bold text-primary hover:underline truncate max-w-[95px]"
                  >
                    {m.broadcaster} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DRAWER 1: FotMob / SofaScore 10.0 Algorithmic Player Ratings */}
        {activeDrawer === 'ratings' && (
          <div
            className="p-3 rounded-xl border border-border/80 bg-background space-y-2.5 animate-in fade-in duration-150"
            data-testid="player-ratings-drawer"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                Matchday Top Player Performance Ratings (0.0–10.0 Opta/xG Index)
              </span>
              <Link to="/players" className="text-[11px] font-bold text-primary hover:underline">
                Full Player xG Database →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {TOP_RATED_PLAYERS.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-foreground truncate">
                      {p.name} <span className="text-[10px] font-mono text-muted-foreground">({p.position})</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.club} · {p.xgPlusXa}
                    </p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {p.keyStat}
                    </p>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-emerald-600 text-white font-mono text-xs font-black shrink-0">
                    {p.rating.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAWER 2: Marca / Kicker / Gazzetta Breaking Lineup & Tactical xG Wire */}
        {activeDrawer === 'pulse' && (
          <div
            className="p-3 rounded-xl border border-border/80 bg-background space-y-2.5 animate-in fade-in duration-150"
            data-testid="tactical-pulse-drawer"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-sky-500" />
                Confirmed Starting Lineups &amp; Tactical xG Impact Wire
              </span>
              <Link to="/news" className="text-[11px] font-bold text-primary hover:underline">
                All Injury &amp; Lineup Intel →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {TACTICAL_PULSE_ITEMS.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-bold text-primary">{item.tag}</span>
                    <span>{item.timeAgo}</span>
                  </div>
                  <p className="text-xs font-extrabold text-foreground">{item.clubOrMatch}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.headline}</p>
                  <p className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Model Shift: {item.xgImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAWER 3: Chess.com-Style Free Daily Football IQ Challenge */}
        {activeDrawer === 'iq_challenge' && (
          <div
            className="p-3 rounded-xl border border-border/80 bg-background space-y-2.5 animate-in fade-in duration-150"
            data-testid="iq-challenge-drawer"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-emerald-500" />
                Daily Football IQ Challenge — Test Your Forecast vs. Gemini Poisson AI (100% Free)
              </span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Your Analyst ELO: {iqScore.rating} · {iqScore.aligned}/{iqScore.total || 0} Aligned with AI Consensus
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {DEFAULT_RIBBON_MATCHES.slice(0, 3).map((m) => {
                const picked = userPicks[m.id];
                const aiFav = m.homeProb >= m.awayProb ? `${m.homeTeam} (${m.homeProb}%)` : `${m.awayTeam} (${m.awayProb}%)`;
                return (
                  <div key={m.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{m.homeTeam} vs {m.awayTeam}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{m.league}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['1', 'X', '2'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectIqPick(m.id, opt)}
                          className={`py-1 rounded text-xs font-bold border transition-colors ${
                            picked === opt
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-background hover:bg-muted text-foreground border-border/70'
                          }`}
                        >
                          {opt === '1' ? '1 (Home)' : opt === 'X' ? 'X (Draw)' : '2 (Away)'}
                        </button>
                      ))}
                    </div>
                    {picked && (
                      <p className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>Your Call: <strong>{picked}</strong></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          AI Consensus: {aiFav}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
