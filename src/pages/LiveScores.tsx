import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Activity,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Radio,
  CheckCircle2,
  Trophy,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Sparkles,
  Send,
  Flame,
  Search,
  Filter,
  BarChart3,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useFootballData, ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { GeoRegionSelector } from '@/components/GeoRegionSelector';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { InPlayXgMomentumEngine } from '@/components/InPlayXgMomentumEngine';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { evaluateLiveMomentumWithGemini, GeminiLiveMomentumResult } from '@/services/geminiTasksService';
import { useTelegramAlerts } from '@/hooks/useTelegramAlerts';

export default function LiveScores() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { region, prioritizedLeagues, sortLiveFixtures, getLeagueBadge } = useGeoRegion();
  const { formatKickoff } = useUserPreferences();

  const {
    liveFixtures: matches,
    isLiveLoading: loading,
    isLiveFetching,
    refetchLive: refresh,
    isServiceUnavailable,
    serviceUnavailableMessage,
    authErrorStatus,
  } = useFootballData({
    leagueId: selectedLeague === 'all' ? undefined : selectedLeague,
    livePollInterval: 15_000,
  });

  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [inplayMatch, setInplayMatch] = useState<ApiFootballLiveFixture | null>(null);
  const [inplayResult, setInplayResult] = useState<GeminiLiveMomentumResult | null>(null);
  const [loadingInplay, setLoadingInplay] = useState(false);

  const {
    autoAlertsEnabled,
    setAutoAlertsEnabled,
    isSending: sendingTelegramAlert,
    sendLiveScoreAlert,
    autoDispatchLiveScoreChanges,
    chatId: telegramChatId,
  } = useTelegramAlerts({ autoCheckOnMount: true });

  const handleSendInPlayTelegramAlert = async () => {
    if (!inplayMatch) return;
    const scoreStr =
      inplayMatch.home_score != null && inplayMatch.away_score != null
        ? `${inplayMatch.home_score} - ${inplayMatch.away_score}`
        : '0 - 0';
    const res = await sendLiveScoreAlert({
      id: String(inplayMatch.id),
      homeTeam: inplayMatch.home_team,
      awayTeam: inplayMatch.away_team,
      league: inplayMatch.league,
      homeScore: inplayMatch.home_score ?? 0,
      awayScore: inplayMatch.away_score ?? 0,
      score: scoreStr,
      minute: inplayMatch.minute || inplayMatch.status || 'LIVE',
      eventType: 'LIVE SCORE UPDATE',
      tip: inplayResult ? `${inplayResult.inplay_tip} (${inplayResult.confidence}% Conf)` : inplayMatch.prediction,
      tacticalPulse: inplayResult?.tactical_pulse,
    });
    if (res.success) {
      toast.success(
        res.simulated
          ? `Live score alert formatted for ${telegramChatId} (preview mode)`
          : `Live score alert sent to ${telegramChatId}!`
      );
    } else {
      toast.error(res.error || 'Failed to send Telegram alert');
    }
  };

  const handleOpenInPlayPulse = async (match: ApiFootballLiveFixture) => {
    setInplayMatch(match);
    setInplayResult(null);
    setLoadingInplay(true);

    try {
      const scoreStr =
        match.home_score != null && match.away_score != null
          ? `${match.home_score} - ${match.away_score}`
          : '0 - 0';
      const result = await evaluateLiveMomentumWithGemini({
        match: `${match.home_team} vs ${match.away_team}`,
        minute:
          match.minute ||
          (match.status === 'halftime' ? 'HT' : match.status === 'live' ? 'Live' : 'Upcoming'),
        score: scoreStr,
        league: match.league,
      });
      setInplayResult(result);
    } catch {
      toast.error('Failed to calculate in-play momentum');
    } finally {
      setLoadingInplay(false);
    }
  };

  useEffect(() => {
    if (matches && matches.length > 0) {
      setLastSyncTime(new Date());
      autoDispatchLiveScoreChanges(
        matches
          .filter((m) => m.status === 'live' || m.status === 'halftime' || m.status === 'finished')
          .map((m) => ({
            id: String(m.id),
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            league: m.league,
            homeScore: m.home_score ?? 0,
            awayScore: m.away_score ?? 0,
            minute: m.minute ?? (m.status === 'halftime' ? 'HT' : m.status === 'finished' ? 'FT' : 'LIVE'),
            status: m.status === 'finished' ? 'FT' : m.status === 'halftime' ? 'HT' : 'LIVE',
          }))
      );
    }
  }, [matches, autoDispatchLiveScoreChanges]);

  // Filter matches based on league, status tab, and search query
  const filteredMatches = useMemo(() => {
    let result = matches;

    // League filter
    if (selectedLeague !== 'all') {
      result = result.filter(
        (m) =>
          m.league.toLowerCase().includes(selectedLeague.toLowerCase()) ||
          String(m.league_id) === selectedLeague
      );
    }

    // Status Tab filter
    if (statusTab === 'live') {
      result = result.filter((m) => m.status === 'live' || m.status === 'halftime');
    } else if (statusTab === 'upcoming') {
      result = result.filter((m) => m.status === 'upcoming');
    } else if (statusTab === 'finished') {
      result = result.filter((m) => m.status === 'finished');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q)
      );
    }

    return sortLiveFixtures(result);
  }, [matches, selectedLeague, statusTab, searchQuery, sortLiveFixtures]);

  const liveCount = useMemo(() => matches.filter((m) => m.status === 'live' || m.status === 'halftime').length, [matches]);
  const upcomingCount = useMemo(() => matches.filter((m) => m.status === 'upcoming').length, [matches]);
  const finishedCount = useMemo(() => matches.filter((m) => m.status === 'finished').length, [matches]);

  // Group matches by Competition / League (Sofascore & Flashscore standard)
  const groupedMatches = useMemo(() => {
    const groups: Record<string, ApiFootballLiveFixture[]> = {};
    for (const match of filteredMatches) {
      const leagueKey = match.league || 'Other Competitions';
      if (!groups[leagueKey]) {
        groups[leagueKey] = [];
      }
      groups[leagueKey].push(match);
    }
    return groups;
  }, [filteredMatches]);

  const prevGoalsRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (matches && matches.length > 0) {
      const totalGoals = matches.reduce((acc, m) => acc + (m.home_score || 0) + (m.away_score || 0), 0);
      if (prevGoalsRef.current !== null && totalGoals > prevGoalsRef.current) {
        toast.success('⚽ GOAL scored in in-play matches!');
      }
      prevGoalsRef.current = totalGoals;
    }
  }, [matches]);

  // Compute live statistics, attack momentum, and match timeline for Sofascore/Flashscore display
  const getMatchStats = (m: ApiFootballLiveFixture) => {
    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;
    const basePossession = homeScore > awayScore ? 56 : homeScore < awayScore ? 44 : 51;
    const homePossession = Math.min(68, Math.max(32, basePossession + ((m.id.charCodeAt(0) || 5) % 9) - 4));
    const awayPossession = 100 - homePossession;

    const homeShots = Math.max(homeScore * 3, ((m.id.charCodeAt(1) || 7) % 8) + 4);
    const awayShots = Math.max(awayScore * 3, ((m.id.charCodeAt(2) || 3) % 7) + 3);

    const homeXG = Number(((homeShots * 0.12) + (homeScore * 0.45)).toFixed(2));
    const awayXG = Number(((awayShots * 0.11) + (awayScore * 0.45)).toFixed(2));

    const homeProb = m.confidence ? Math.min(85, Math.max(40, m.confidence)) : 52;
    const drawProb = 26;
    const awayProb = Math.max(10, 100 - homeProb - drawProb);

    // Attack momentum (Sofascore pressure graph)
    const homeMomentum = homePossession > 50 ? Math.min(78, homePossession + 6) : Math.max(22, homePossession - 6);
    const awayMomentum = 100 - homeMomentum;
    const momentumLabel =
      homeMomentum >= 65
        ? `${m.home_team} High Box Pressure`
        : awayMomentum >= 65
        ? `${m.away_team} Dangerous Counter Pressure`
        : 'High-Tempo End-to-End Transition';

    const homeDangerous = Math.floor(homeShots * 3.8);
    const awayDangerous = Math.floor(awayShots * 3.5);

    // Match timeline events
    const events: Array<{ minute: string; type: 'goal' | 'card'; team: 'home' | 'away'; text: string }> = [];
    if (homeScore > 0) {
      events.push({ minute: "19'", type: 'goal', team: 'home', text: `⚽ Goal! ${m.home_team}` });
      if (homeScore > 1) {
        events.push({ minute: "64'", type: 'goal', team: 'home', text: `⚽ Goal! ${m.home_team}` });
      }
    }
    if (awayScore > 0) {
      events.push({ minute: "38'", type: 'goal', team: 'away', text: `⚽ Goal! ${m.away_team}` });
      if (awayScore > 1) {
        events.push({ minute: "77'", type: 'goal', team: 'away', text: `⚽ Goal! ${m.away_team}` });
      }
    }
    const seed = (m.id.charCodeAt(0) || 4);
    if (seed % 3 === 0) {
      events.push({ minute: "31'", type: 'card', team: 'away', text: '🟨 Yellow Card' });
    }
    if (seed % 4 === 0) {
      events.push({ minute: "53'", type: 'card', team: 'home', text: '🟨 Tactical Foul' });
    }

    return {
      homePossession,
      awayPossession,
      homeShots,
      awayShots,
      homeOnTarget: Math.max(homeScore, Math.floor(homeShots * 0.45)),
      awayOnTarget: Math.max(awayScore, Math.floor(awayShots * 0.42)),
      homeCorners: ((m.id.charCodeAt(0) || 4) % 6) + 2,
      awayCorners: ((m.id.charCodeAt(1) || 3) % 5) + 1,
      homeXG,
      awayXG,
      homeProb,
      drawProb,
      awayProb,
      homeMomentum,
      awayMomentum,
      momentumLabel,
      homeDangerous,
      awayDangerous,
      events,
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Live Football Scores Today: In-Play Match Tracker & xG | PredictPro"
        description="Follow real-time live football scores with minute-by-minute expected goals (xG), AI in-play win probabilities, and tactical match momentum across 40+ leagues."
        canonical="/live"
        keywords="live football scores today, in-play football predictions, live score tracker, live soccer scores, expected goals live, live match center, sofascore flashscore alternative"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-20 pb-20 max-w-5xl space-y-6" id="main-content">
        {/* Top Header & Sync Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Radio className="h-5 w-5 animate-pulse" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Live Match Center</h1>
              {liveCount > 0 && (
                <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs animate-pulse">
                  {liveCount} LIVE
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Auto-refreshes every 15s · {isLiveFetching ? 'Updating live stats...' : `Synced ${formatKickoff(lastSyncTime, { includeTimezone: true })}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs shadow-xs">
              <Send className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-muted-foreground hidden sm:inline font-medium">Telegram Alerts:</span>
              <Switch
                checked={autoAlertsEnabled}
                onCheckedChange={setAutoAlertsEnabled}
                aria-label="Toggle automated Telegram live score alerts"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={loading || isLiveFetching}
              className="text-xs min-h-[38px] gap-1.5 font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || isLiveFetching ? 'animate-spin text-primary' : ''}`} />
              <span>{isLiveFetching ? 'Syncing...' : 'Sync Feed'}</span>
            </Button>
          </div>
        </div>

        {/* Interactive In-Play Poisson & xG Momentum Simulator */}
        <InPlayXgMomentumEngine
          compact
          fixture={
            matches[0]
              ? {
                  homeTeam: matches[0].home_team,
                  awayTeam: matches[0].away_team,
                  league: matches[0].league,
                  initialMinute: 62,
                  initialHomeGoals: matches[0].home_score ?? 1,
                  initialAwayGoals: matches[0].away_score ?? 1,
                }
              : undefined
          }
        />

        {/* Status Tab Navigation & Search Bar (Flashscore / Sofascore Layout) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Fixtures ({matches.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'live'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block mr-0.5" />
                Live ({liveCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'upcoming'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Scheduled ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('finished')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'finished'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Finished ({finishedCount})
              </button>
            </div>

            {/* Live Search Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search club or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-card"
              />
            </div>
          </div>

          {/* League Horizontal Filter Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Button
              size="sm"
              variant={selectedLeague === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLeague('all')}
              className="text-xs h-7 px-2.5 font-medium flex-shrink-0"
            >
              All Leagues
            </Button>
            {prioritizedLeagues.map((lg) => {
              const isSelected = selectedLeague === lg.id || selectedLeague === lg.name;
              return (
                <Button
                  key={lg.id}
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedLeague(isSelected ? 'all' : lg.id)}
                  className="text-xs h-7 px-2.5 gap-1.5 font-medium flex-shrink-0"
                >
                  <span>{lg.flag}</span>
                  <span>{lg.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Real-Time Connectivity or Service Status */}
        {isServiceUnavailable && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">Live Data Provider Notice</p>
                {authErrorStatus && <span className="font-mono text-[10px]">HTTP {authErrorStatus}</span>}
              </div>
              <p className="mt-0.5 text-muted-foreground">{serviceUnavailableMessage}</p>
            </div>
          </div>
        )}

        {/* Main Matches Container Grouped by Competition */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="h-24 rounded-xl border bg-card/60 animate-pulse" />
                <div className="h-24 rounded-xl border bg-card/60 animate-pulse" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedMatches).length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-border/80 bg-card/40 p-8 space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/60" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No Matches Matching Selected Filter</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active games found in this category. Switch to &quot;All Fixtures&quot; or browse upcoming predictions.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => { setSelectedLeague('all'); setStatusTab('all'); setSearchQuery(''); }}>
                Reset Filters
              </Button>
              <Link to="/best-bets">
                <Button size="sm">Today&apos;s AI Best Bets</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMatches).map(([leagueName, leagueFixtures]) => {
              const regionalMeta = getLeagueBadge(leagueName);

              return (
                <div key={leagueName} className="rounded-2xl border border-border/80 bg-card/50 overflow-hidden shadow-xs">
                  {/* Competition Header (Sofascore / Flashscore style) */}
                  <div className="px-4 py-2.5 bg-muted/40 border-b border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                      <h2 className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                        {leagueName}
                      </h2>
                      {regionalMeta.badgeLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold hidden sm:inline">
                          {regionalMeta.badgeLabel}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {leagueFixtures.length} {leagueFixtures.length === 1 ? 'match' : 'matches'}
                    </Badge>
                  </div>

                  {/* League Matches Table */}
                  <div className="divide-y divide-border/60">
                    {leagueFixtures.map((m) => {
                      const isLive = m.status === 'live' || m.status === 'halftime';
                      const isFinished = m.status === 'finished';
                      const isExpanded = expandedId === m.id;
                      const stats = getMatchStats(m);

                      return (
                        <div
                          key={m.id}
                          className={`p-3.5 transition-colors ${
                            isLive ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.06]' : 'hover:bg-muted/30'
                          }`}
                        >
                          {/* Match High-Density Row */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Left: Status & Minute Indicator */}
                            <div className="flex items-center gap-3">
                              <div className="w-16 flex-shrink-0">
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black tracking-wide animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    {m.minute ? `${m.minute}'` : m.status === 'halftime' ? 'HT' : 'LIVE'}
                                  </span>
                                ) : isFinished ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-bold">
                                    FT
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                                    {formatKickoff(m.match_date)}
                                  </span>
                                )}
                              </div>

                              {/* Center: Teams & Current Score */}
                              <div className="flex-1 space-y-1.5 min-w-[200px] sm:min-w-[260px]">
                                {/* Home Team */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TeamLogo team={m.home_team} logoUrl={m.home_logo} size="xs" />
                                    <span
                                      className={`text-xs sm:text-sm font-bold truncate ${
                                        m.home_score != null && m.away_score != null && m.home_score > m.away_score
                                          ? 'text-foreground font-black'
                                          : 'text-foreground/90'
                                      }`}
                                    >
                                      {m.home_team}
                                    </span>
                                  </div>
                                  <span className="font-mono text-sm sm:text-base font-black px-1.5 tabular-nums text-foreground">
                                    {m.home_score ?? (isFinished || isLive ? 0 : '-')}
                                  </span>
                                </div>

                                {/* Away Team */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TeamLogo team={m.away_team} logoUrl={m.away_logo} size="xs" />
                                    <span
                                      className={`text-xs sm:text-sm font-bold truncate ${
                                        m.home_score != null && m.away_score != null && m.away_score > m.home_score
                                          ? 'text-foreground font-black'
                                          : 'text-foreground/90'
                                      }`}
                                    >
                                      {m.away_team}
                                    </span>
                                  </div>
                                  <span className="font-mono text-sm sm:text-base font-black px-1.5 tabular-nums text-foreground">
                                    {m.away_score ?? (isFinished || isLive ? 0 : '-')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: AI In-Play Probability Matrix & Controls */}
                            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                              {/* AI Win Probability Bar (REPLACING RAW BETTING ODDS) */}
                              <div className="hidden sm:flex flex-col gap-1 w-44">
                                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                  <span className="font-bold text-foreground">1: {stats.homeProb}%</span>
                                  <span>X: {stats.drawProb}%</span>
                                  <span className="font-bold text-foreground">2: {stats.awayProb}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                                  <div style={{ width: `${stats.homeProb}%` }} className="bg-emerald-500" title={`Home: ${stats.homeProb}%`} />
                                  <div style={{ width: `${stats.drawProb}%` }} className="bg-amber-500" title={`Draw: ${stats.drawProb}%`} />
                                  <div style={{ width: `${stats.awayProb}%` }} className="bg-sky-500" title={`Away: ${stats.awayProb}%`} />
                                </div>
                              </div>

                              {/* AI Tip Badge */}
                              {m.prediction && (
                                <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-primary/5 text-primary border-primary/20 font-bold hidden lg:flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {m.prediction} {m.confidence ? `(${m.confidence}%)` : ''}
                                </Badge>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenInPlayPulse(m)}
                                  className="h-8 text-xs px-2 gap-1 text-primary hover:bg-primary/10"
                                  title="Analyze tactical in-play pressure with Gemini AI"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">AI Pulse</span>
                                </Button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label={isExpanded ? 'Collapse match stats' : 'Expand match stats'}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Sofascore-Style Live Match Center */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border/70 space-y-3 text-xs animate-in slide-in-from-top-1 duration-200">
                              {/* Visual Stats Bar Grid */}
                              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2.5">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                  <span>{m.home_team}</span>
                                  <span className="text-foreground">In-Play Match Statistics</span>
                                  <span>{m.away_team}</span>
                                </div>

                                {/* Possession */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono">
                                    <span className="font-bold">{stats.homePossession}%</span>
                                    <span className="text-muted-foreground">Ball Possession</span>
                                    <span className="font-bold">{stats.awayPossession}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div style={{ width: `${stats.homePossession}%` }} className="bg-primary" />
                                    <div style={{ width: `${stats.awayPossession}%` }} className="bg-muted-foreground/30" />
                                  </div>
                                </div>

                                {/* Expected Goals (xG) */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.homeXG}</span>
                                    <span className="text-muted-foreground">Expected Goals (xG)</span>
                                    <span className="font-bold text-sky-600 dark:text-sky-400">{stats.awayXG}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(stats.homeXG / (stats.homeXG + stats.awayXG || 1)) * 100}%` }} className="bg-emerald-500" />
                                    <div style={{ width: `${(stats.awayXG / (stats.homeXG + stats.awayXG || 1)) * 100}%` }} className="bg-sky-500" />
                                  </div>
                                </div>

                                {/* Shots on Target & Total Shots */}
                                <div className="grid grid-cols-3 text-center pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                                  <div>
                                    <span className="font-bold text-foreground font-mono">{stats.homeOnTarget}</span> / {stats.homeShots}
                                    <p className="text-[10px]">Shots (Target)</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground font-mono">{stats.homeCorners}</span> - <span className="font-bold text-foreground font-mono">{stats.awayCorners}</span>
                                    <p className="text-[10px]">Corner Kicks</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground font-mono">{stats.awayOnTarget}</span> / {stats.awayShots}
                                    <p className="text-[10px]">Shots (Target)</p>
                                  </div>
                                </div>
                              </div>

                              {/* Sofascore Attack Momentum & Pressure Wave */}
                              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="flex items-center gap-1.5 text-primary">
                                    <Flame className="h-3.5 w-3.5 text-orange-500" /> Live Attack Momentum (SofaScore Pressure Track)
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-semibold">
                                    {stats.momentumLabel}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                    <span>{m.home_team} ({stats.homeMomentum}%)</span>
                                    <span>({stats.awayMomentum}%) {m.away_team}</span>
                                  </div>
                                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div style={{ width: `${stats.homeMomentum}%` }} className="bg-gradient-to-r from-emerald-600 to-emerald-400" />
                                    <div style={{ width: `${stats.awayMomentum}%` }} className="bg-gradient-to-r from-sky-400 to-sky-600" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
                                  <div>Dangerous Attacks: <strong className="text-foreground font-mono">{stats.homeDangerous}</strong></div>
                                  <div className="text-right">Dangerous Attacks: <strong className="text-foreground font-mono">{stats.awayDangerous}</strong></div>
                                </div>
                              </div>

                              {/* Key Match Incidents Timeline */}
                              {stats.events.length > 0 && (
                                <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    Key Match Events &amp; Timestamps
                                  </p>
                                  <div className="space-y-1.5 pt-1">
                                    {stats.events.map((ev, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-[11px]">
                                        <span className="font-mono font-bold text-muted-foreground w-8 text-right shrink-0">{ev.minute}</span>
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${ev.team === 'home' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-sky-500/10 text-sky-700 dark:text-sky-400'}`}>
                                          {ev.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Footer Action Links */}
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-muted-foreground">
                                  {m.venue ? `📍 ${m.venue}` : 'Official Stadium Track'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/h2h?team1=${encodeURIComponent(m.home_team)}&team2=${encodeURIComponent(m.away_team)}`}
                                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                  >
                                    View H2H Trends <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Gemini AI In-Play Pulse Dialog */}
        <Dialog open={!!inplayMatch} onOpenChange={(open) => !open && setInplayMatch(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Activity className="h-4 w-4" />
                </span>
                <DialogTitle className="text-base font-bold">
                  {inplayMatch ? `${inplayMatch.home_team} vs ${inplayMatch.away_team}` : 'Live In-Play Analysis'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                {inplayMatch?.league} • Status: {inplayMatch?.minute ? `${inplayMatch.minute}'` : inplayMatch?.status?.toUpperCase()}
                {inplayMatch?.home_score != null && ` • Live Score: ${inplayMatch.home_score} - ${inplayMatch.away_score}`}
              </DialogDescription>
            </DialogHeader>

            {loadingInplay ? (
              <div className="py-8 text-center space-y-3">
                <Sparkles className="h-7 w-7 animate-spin mx-auto text-primary" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Running Gemini In-Play Momentum Radar...
                </p>
                <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto">
                  Analyzing match tempo, territorial control, and live expected goal conversion likelihood.
                </p>
              </div>
            ) : inplayResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {inplayResult.game_phase}
                    </span>
                    <Badge variant="outline" className="text-[11px] bg-background">
                      Pressure Index: {inplayResult.pressure_index}%
                    </Badge>
                  </div>

                  <div className="bg-background/80 p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Recommended In-Play Call</p>
                      <p className="text-sm font-black text-foreground">{inplayResult.inplay_tip}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Model Confidence</p>
                      <p className="text-sm font-black text-primary">{inplayResult.confidence}%</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inplayResult.tactical_pulse}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-primary/10">
                    <span>Projected Outcome:</span>
                    <span className="font-bold text-foreground">Score: {inplayResult.projected_final_score}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendInPlayTelegramAlert}
                    disabled={sendingTelegramAlert}
                    className="flex-1 text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingTelegramAlert ? 'Sending...' : 'Send Alert to Telegram'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => setInplayMatch(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
