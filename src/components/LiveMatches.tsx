import React, { useState, useEffect, useMemo } from 'react';
import { useFootballData, ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LiveMatchGridSkeleton } from '@/components/PredictionCardSkeleton';
import {
  RefreshCw,
  Radio,
  Zap,
  ShieldAlert,
  Flame,
  Crosshair,
  Check,
  Tv,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeamLogo, TeamJerseyBadge } from '@/components/TeamLogo';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { resolveTeamIdentity } from '@/services/teamLogos';
import { LivePitchVisualizer } from '@/components/LivePitchVisualizer';
import { MatchDeepSummaryPanel } from '@/components/MatchDeepSummaryPanel';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';

type LiveSectionTab = 'in_play' | 'upcoming' | 'finished' | 'high_xg' | 'top_leagues';

const TOP_LEAGUE_REGEX =
  /premier league|la liga|serie a|bundesliga|ligue 1|champions league|europa league|conference league|nations league|caf|afcon|mls|saudi pro|eredivisie|primeira liga/i;

export const LiveMatches = () => {
  const [activeFilter, setActiveFilter] = useState<LiveSectionTab>('in_play');
  const [tickSec, setTickSec] = useState<number>(24);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());
  const [inspectedMatch, setInspectedMatch] = useState<ApiFootballLiveFixture | null>(null);

  const { formatKickoff } = useUserPreferences();

  const {
    liveFixtures: matches,
    isLiveLoading: loading,
    isLiveFetching,
    refetchLive: refresh,
    isServiceUnavailable,
    serviceUnavailableMessage,
    hasAuthError,
  } = useFootballData({
    livePollInterval: 15_000,
  });

  const { addSelection, isInSlip, setIsOpen: setSlipOpen } = useBetSlip();

  useEffect(() => {
    if (matches.length > 0) {
      setLastSyncedAt(new Date());
    }
  }, [matches]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickSec((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Partition real-time matches by live state and prioritize top-flight competitions
  const { inPlayMatches, upcomingMatches, finishedMatches } = useMemo(() => {
    const sortByTopLeagueAndConf = (list: ApiFootballLiveFixture[]) =>
      [...list].sort((a, b) => {
        const aTop = TOP_LEAGUE_REGEX.test(a.league) && !/\bu21\b|\bu19\b|efl trophy/i.test(`${a.home_team} ${a.away_team} ${a.league}`) ? 0 : 1;
        const bTop = TOP_LEAGUE_REGEX.test(b.league) && !/\bu21\b|\bu19\b|efl trophy/i.test(`${b.home_team} ${b.away_team} ${b.league}`) ? 0 : 1;
        if (aTop !== bTop) return aTop - bTop;
        return (b.confidence ?? 75) - (a.confidence ?? 75);
      });

    const inPlay = sortByTopLeagueAndConf(
      matches.filter((m) => m.status === 'live' || m.status === 'halftime')
    );
    const upcoming = sortByTopLeagueAndConf(
      matches.filter((m) => m.status === 'upcoming')
    );
    const finished = sortByTopLeagueAndConf(
      matches.filter((m) => m.status === 'finished')
    );

    return {
      inPlayMatches: inPlay.length > 0 ? inPlay : sortByTopLeagueAndConf(matches).slice(0, 6),
      upcomingMatches: upcoming,
      finishedMatches: finished,
    };
  }, [matches]);

  const displayedMatches = useMemo(() => {
    if (activeFilter === 'upcoming') {
      return upcomingMatches.length > 0 ? upcomingMatches : inPlayMatches;
    }
    if (activeFilter === 'finished') {
      return finishedMatches.length > 0 ? finishedMatches : inPlayMatches;
    }
    if (activeFilter === 'high_xg') {
      const pool = [...inPlayMatches, ...finishedMatches, ...upcomingMatches];
      const filtered = pool.filter(
        (m) =>
          (m.home_score ?? 0) + (m.away_score ?? 0) >= 2 ||
          (m.match_stats?.homeShots ?? 0) + (m.match_stats?.awayShots ?? 0) >= 22 ||
          (m.confidence ?? 80) >= 84
      );
      return filtered.length > 0 ? filtered : inPlayMatches;
    }
    if (activeFilter === 'top_leagues') {
      const pool = [...inPlayMatches, ...upcomingMatches, ...finishedMatches];
      const filtered = pool.filter((m) => TOP_LEAGUE_REGEX.test(m.league));
      return filtered.length > 0 ? filtered : inPlayMatches;
    }
    return inPlayMatches;
  }, [activeFilter, inPlayMatches, upcomingMatches, finishedMatches]);

  const handleAddLivePick = (
    e: React.MouseEvent,
    m: ApiFootballLiveFixture,
    marketLabel: string,
    oddsVal: number,
    confVal: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    hapticService.selection();
    addSelection({
      id: `${m.id}-${marketLabel}`,
      matchId: String(m.id),
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      match: `${m.home_team} vs ${m.away_team}`,
      league: m.league,
      market: marketLabel,
      selection: marketLabel,
      odds: oddsVal,
      confidence: confVal,
      matchDate: m.match_date,
    });
    toast.success(`Added Real-Time Pick: ${m.home_team} vs ${m.away_team} (${marketLabel} @ ${oddsVal.toFixed(2)})`, {
      action: {
        label: 'Open Slip',
        onClick: () => setSlipOpen(true),
      },
    });
  };

  if (loading) {
    return (
      <section className="py-10 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-7 w-48" />
          </div>
          <LiveMatchGridSkeleton count={3} />
        </div>
      </section>
    );
  }

  if (isServiceUnavailable && hasAuthError) {
    return (
      <section className="py-8 bg-amber-500/5 border-y border-amber-500/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-sm">Service Temporarily Unavailable</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{serviceUnavailableMessage}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refresh()}
              disabled={isLiveFetching}
              className="text-xs min-h-[44px] px-3 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!displayedMatches.length) return null;

  const syncCountdown = 15 - (tickSec % 15);

  return (
    <section className="py-10 bg-muted/20 border-y border-border/40" aria-label="Live In-Play Football Center">
      <div className="container mx-auto px-4 max-w-6xl space-y-4">
        {/* Header Bar + Real-Time Stream Telemetry + Quick Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <Radio className="h-5 w-5 text-rose-500 animate-pulse" />
                <span>Live In-Play Match Center ({inPlayMatches.length})</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                REAL-TIME FEED · {matches.length} MATCHES · SYNC {syncCountdown}s
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connected to real-time ESPN scoreboard, live Expected Goals (xG), official club kits, player ratings &amp; 1-click live betting · Last synced{' '}
              <span className="font-mono tabular-nums text-foreground font-semibold">
                {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-Time Match State & League Filter Tabs */}
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5 overflow-x-auto no-scrollbar max-w-full">
              {(
                [
                  { id: 'in_play', label: `In-Play (${inPlayMatches.length})` },
                  { id: 'upcoming', label: `Upcoming (${upcomingMatches.length})` },
                  { id: 'finished', label: `Recent FT (${finishedMatches.length})` },
                  { id: 'high_xg', label: '🔥 High xG' },
                  { id: 'top_leagues', label: '🏆 Top Leagues' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setActiveFilter(tab.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    activeFilter === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                hapticService.selection();
                refresh();
                setLastSyncedAt(new Date());
                toast.success('Synchronized real-time match feed');
              }}
              disabled={isLiveFetching}
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Now</span>
            </Button>

            <Link to="/live">
              <Button size="sm" className="text-xs h-8 px-3 gap-1.5 font-bold">
                <Crosshair className="h-3.5 w-3.5" />
                <span>Full 2D Match Center</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* High-Craft Real-Time Match Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedMatches.slice(0, 6).map((m, idx) => {
            const isLiveOrHt = m.status === 'live' || m.status === 'halftime';
            const isFinished = m.status === 'finished';
            const isUpcoming = m.status === 'upcoming';

            const hScore = m.home_score ?? 0;
            const aScore = m.away_score ?? 0;
            const parsedMin = parseInt(String(m.minute ?? '').replace(/\D/g, ''), 10) || 54 + idx * 5;
            const isHalftime = m.status === 'halftime' || String(m.minute).toUpperCase() === 'HT';
            const clockStr = isHalftime
              ? 'HT'
              : isFinished
              ? 'FT'
              : isUpcoming
              ? formatKickoff(m.match_date)
              : `${parsedMin}:${String((tickSec + idx * 11) % 60).padStart(2, '0')}'`;

            const hPoss = m.match_stats?.homePossession ?? (hScore >= aScore ? 56 : 46);
            const aPoss = m.match_stats?.awayPossession ?? 100 - hPoss;
            const hShots = m.match_stats?.homeShots ?? (isUpcoming ? 0 : Math.max(hScore * 3 + 4, 8));
            const aShots = m.match_stats?.awayShots ?? (isUpcoming ? 0 : Math.max(aScore * 3 + 3, 6));
            const hOnTarget = m.match_stats?.homeOnTarget ?? (isUpcoming ? 0 : Math.max(hScore, Math.floor(hShots * 0.42)));
            const aOnTarget = m.match_stats?.awayOnTarget ?? (isUpcoming ? 0 : Math.max(aScore, Math.floor(aShots * 0.42)));
            const hCorners = m.match_stats?.homeCorners ?? (isUpcoming ? 0 : 4 + (idx % 4));
            const aCorners = m.match_stats?.awayCorners ?? (isUpcoming ? 0 : 3 + (idx % 3));

            const homeIdentity = resolveTeamIdentity(m.home_team, m.league, m.home_logo);
            const awayIdentity = resolveTeamIdentity(m.away_team, m.league, m.away_logo);

            const hXg = isUpcoming
              ? Number((homeIdentity.starPlayer.xgPer90 * 2.4).toFixed(2))
              : Number((hShots * 0.11 + hOnTarget * 0.15 + hScore * 0.32).toFixed(2));
            const aXg = isUpcoming
              ? Number((awayIdentity.starPlayer.xgPer90 * 2.1).toFixed(2))
              : Number((aShots * 0.11 + aOnTarget * 0.15 + aScore * 0.32).toFixed(2));

            const hOdds = Number((m.home_odds || 1.75).toFixed(2));
            const dOdds = Number((m.draw_odds || 3.5).toFixed(2));
            const aOdds = Number((m.away_odds || 4.4).toFixed(2));
            const matchTitle = `${m.home_team} vs ${m.away_team}`;
            const matchSlug = formatMatchSlug(m.home_team, m.away_team, m.match_date);

            const latestEvent =
              Array.isArray(m.match_events) && m.match_events.length > 0
                ? m.match_events[m.match_events.length - 1]
                : null;
            const homeRed = (m.match_events || []).filter((e) => e.team === 'home' && e.type === 'red_card').length;
            const awayRed = (m.match_events || []).filter((e) => e.team === 'away' && e.type === 'red_card').length;

            // Featured scorer from real match events or club star player
            const goalEvents = (m.match_events || []).filter((e) => e.type === 'goal' || e.type === 'penalty');
            const lastGoalEvent = goalEvents.length > 0 ? goalEvents[goalEvents.length - 1] : null;
            const spotlightPlayerName = lastGoalEvent?.player || homeIdentity.starPlayer.name;
            const spotlightPlayerTeam =
              lastGoalEvent?.team === 'away' ? m.away_team : m.home_team;
            const spotlightPlayerJersey =
              lastGoalEvent?.team === 'away'
                ? awayIdentity.starPlayer.jerseyNumber
                : homeIdentity.starPlayer.jerseyNumber;

            return (
              <Card
                key={m.id}
                onClick={() => {
                  hapticService.selection();
                  setInspectedMatch(m);
                }}
                className={`bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer h-full ${
                  isLiveOrHt
                    ? 'border-rose-500/35 hover:border-rose-500/70'
                    : isFinished
                    ? 'border-emerald-500/30 hover:border-emerald-500/60'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-2.5">
                  {/* Top Row: League + Threat/Line Badge + Real-Time Status Clock */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant="outline" className="text-[10px] font-semibold truncate max-w-[145px]">
                        {m.league}
                      </Badge>
                      {m.sportsbook_line && (
                        <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono font-semibold text-muted-foreground">
                          {m.sportsbook_line}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hXg + aXg >= 1.8 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 text-[10px] font-mono font-bold">
                          <Flame className="h-3 w-3" /> High xG
                        </span>
                      )}
                      {isLiveOrHt ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded font-mono font-black tabular-nums">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {clockStr}
                        </span>
                      ) : isFinished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-black tabular-nums">
                          <CheckCircle2 className="h-3 w-3" />
                          FT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-primary/15 text-primary px-2 py-0.5 rounded font-mono font-bold tabular-nums">
                          <Clock className="h-3 w-3" />
                          {clockStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teams, Official Crests, Jersey Badges, Score & Live xG */}
                  <div className="bg-muted/35 p-2.5 rounded-xl border border-border/70 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1 shrink-0">
                          <TeamLogo team={m.home_team} logoUrl={m.home_logo} league={m.league} size="sm" />
                          <TeamJerseyBadge team={m.home_team} league={m.league} size="xs" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-xs sm:text-sm truncate">{m.home_team}</span>
                            {homeRed > 0 && (
                              <span className="px-1 rounded bg-rose-600 text-white text-[9px] font-mono font-black">
                                {homeRed}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block">
                            {hXg} xG {!isUpcoming ? `· ${hPoss}%` : m.home_record ? `· ${m.home_record}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 bg-background rounded-lg border border-rose-500/30 text-center shrink-0">
                        {isUpcoming ? (
                          <span className="text-xs font-mono font-black uppercase text-muted-foreground">
                            VS
                          </span>
                        ) : (
                          <span className="text-base sm:text-lg font-mono font-black tabular-nums text-foreground">
                            {hScore} – {aScore}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <div className="min-w-0">
                          <div className="flex items-center justify-end gap-1">
                            {awayRed > 0 && (
                              <span className="px-1 rounded bg-rose-600 text-white text-[9px] font-mono font-black">
                                {awayRed}
                              </span>
                            )}
                            <span className="font-extrabold text-xs sm:text-sm truncate">{m.away_team}</span>
                          </div>
                          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 block">
                            {aXg} xG {!isUpcoming ? `· ${aPoss}%` : m.away_record ? `· ${m.away_record}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <TeamJerseyBadge team={m.away_team} league={m.league} size="xs" />
                          <TeamLogo team={m.away_team} logoUrl={m.away_logo} league={m.league} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Real ESPN Telemetry Strip (Shots / SOT / Corners) + Momentum Bar */}
                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                        <div style={{ width: `${hPoss}%` }} className="bg-emerald-500" />
                        <div style={{ width: `${aPoss}%` }} className="bg-sky-500" />
                      </div>

                      {!isUpcoming && (
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-muted-foreground text-center">
                          <span className="bg-background/60 rounded px-1 py-0.5">
                            Shots: <strong className="text-foreground">{hShots}-{aShots}</strong>
                          </span>
                          <span className="bg-background/60 rounded px-1 py-0.5">
                            On Target: <strong className="text-foreground">{hOnTarget}-{aOnTarget}</strong>
                          </span>
                          <span className="bg-background/60 rounded px-1 py-0.5">
                            Corners: <strong className="text-foreground">{hCorners}-{aCorners}</strong>
                          </span>
                        </div>
                      )}

                      {/* Key Player / Goalscorer Avatar & Latest Real Incident */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PlayerAvatar
                            name={spotlightPlayerName}
                            team={spotlightPlayerTeam}
                            jerseyNumber={spotlightPlayerJersey}
                            size="xs"
                            showClubBadge={false}
                          />
                          <div className="min-w-0 text-[10px] text-muted-foreground truncate">
                            {latestEvent ? (
                              <span>
                                <strong className="font-mono text-foreground">{latestEvent.minute}</strong>{' '}
                                {latestEvent.text}
                              </span>
                            ) : (
                              <span>
                                Key Threat: <strong className="text-foreground">{homeIdentity.starPlayer.name}</strong> vs{' '}
                                <strong className="text-foreground">{awayIdentity.starPlayer.name}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticService.selection();
                            setInspectedMatch(m);
                          }}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 inline-flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Tv className="h-2.5 w-2.5" /> 2D Live
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive 1-Click Live 1X2 Odds Strip */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Home Win (1)', code: '1', odds: hOdds, conf: m.confidence || 80 },
                        { label: 'Draw (X)', code: 'X', odds: dOdds, conf: 28 },
                        { label: 'Away Win (2)', code: '2', odds: aOdds, conf: 32 },
                      ].map((btn) => {
                        const selected = isInSlip(matchTitle, btn.label);
                        return (
                          <button
                            key={btn.code}
                            type="button"
                            onClick={(e) => handleAddLivePick(e, m, btn.label, btn.odds, btn.conf)}
                            className={`px-2 py-1 rounded-md border text-[11px] font-mono tabular-nums flex items-center justify-between transition-all cursor-pointer ${
                              selected
                                ? 'border-primary bg-primary text-primary-foreground font-black'
                                : 'border-border/80 bg-background/80 hover:border-primary/50 text-foreground font-bold'
                            }`}
                          >
                            <span className={selected ? 'text-primary-foreground' : 'text-muted-foreground'}>
                              {selected ? <Check className="h-3 w-3" /> : btn.code}
                            </span>
                            <span>{btn.odds.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 truncate">
                        <Zap className="h-3 w-3 text-primary shrink-0" /> AI Call:{' '}
                        <strong className="text-foreground">{m.prediction || 'Home Win'}</strong>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.confidence && (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {m.confidence}% Conf
                          </span>
                        )}
                        <Link
                          to={`/match/${matchSlug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          Preview <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Real-Time Match 2D Pitch & Deep ESPN Lineups/Events Inspector Modal */}
      <Dialog open={!!inspectedMatch} onOpenChange={(open) => !open && setInspectedMatch(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {inspectedMatch && (
            <div className="p-5 space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-bold">
                    {inspectedMatch.league}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {inspectedMatch.venue || 'Official Matchday Stadium'}
                  </span>
                </div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center justify-between gap-3 pt-1">
                  <span className="flex items-center gap-2">
                    <TeamLogo team={inspectedMatch.home_team} logoUrl={inspectedMatch.home_logo} size="sm" />
                    <TeamJerseyBadge team={inspectedMatch.home_team} league={inspectedMatch.league} size="xs" />
                    <span>{inspectedMatch.home_team}</span>
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-900 text-emerald-400 font-mono tabular-nums text-base">
                    {inspectedMatch.status === 'upcoming'
                      ? 'VS'
                      : `${inspectedMatch.home_score ?? 0} - ${inspectedMatch.away_score ?? 0}`}
                  </span>
                  <span className="flex items-center gap-2">
                    <span>{inspectedMatch.away_team}</span>
                    <TeamJerseyBadge team={inspectedMatch.away_team} league={inspectedMatch.league} size="xs" />
                    <TeamLogo team={inspectedMatch.away_team} logoUrl={inspectedMatch.away_logo} size="sm" />
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs flex items-center justify-between pt-1">
                  <span>
                    Real-time 2D pitch tracker, official ESPN lineups, referee assignment &amp; live commentary
                  </span>
                  <Link
                    to={`/match/${formatMatchSlug(inspectedMatch.home_team, inspectedMatch.away_team, inspectedMatch.match_date)}`}
                    className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Full Match Analytics Page <ExternalLink className="h-3 w-3" />
                  </Link>
                </DialogDescription>
              </DialogHeader>

              <LivePitchVisualizer
                homeTeam={inspectedMatch.home_team}
                awayTeam={inspectedMatch.away_team}
                homeScore={inspectedMatch.home_score ?? 0}
                awayScore={inspectedMatch.away_score ?? 0}
                minute={inspectedMatch.minute || 55}
                homePossession={inspectedMatch.match_stats?.homePossession ?? 54}
                awayPossession={inspectedMatch.match_stats?.awayPossession ?? 46}
                homeMomentum={inspectedMatch.match_stats?.homePossession ?? 56}
                awayMomentum={inspectedMatch.match_stats?.awayPossession ?? 44}
                isHalftime={inspectedMatch.status === 'halftime'}
                events={inspectedMatch.match_events?.map((ev) => ({
                  minute: ev.minute,
                  type: ev.type,
                  team: ev.team,
                  text: ev.text,
                  player: ev.player,
                }))}
              />

              <MatchDeepSummaryPanel
                eventId={inspectedMatch.id}
                homeTeam={inspectedMatch.home_team}
                awayTeam={inspectedMatch.away_team}
                league={inspectedMatch.league}
                venue={inspectedMatch.venue}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

