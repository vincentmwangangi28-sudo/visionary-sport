import React, { useState, useMemo } from 'react';
import { useUpcomingMatches, UpcomingMatch } from '@/hooks/useUpcomingMatches';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePersonalizedDashboard } from '@/hooks/usePersonalizedDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UpcomingMatchListSkeleton } from '@/components/PredictionCardSkeleton';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { MatchAnalyticsModal } from '@/components/MatchAnalyticsModal';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Zap,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Check,
  BarChart3,
  TrendingUp,
  Pin,
  Flame,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type TimeframeFilter = 'all' | 'today' | 'tomorrow' | 'weekend';

const OUTCOME_STYLES: Record<string, string> = {
  'Home Win': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Away Win': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'Draw': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

export const UpcomingMatches: React.FC = () => {
  const { matches, loading, isRealTime, refresh } = useUpcomingMatches();
  const { region, sortPredictions, getLeagueBadge } = useGeoRegion();
  const { formatKickoff, getKickoffRelative, formatOdds, t } = useUserPreferences();
  const { addSelection, selections } = useBetSlip();
  const { isTeamPinned, togglePinTeam, isLeaguePinned, togglePinLeague } = usePersonalizedDashboard();

  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    toast.success('Upcoming fixtures updated from live schedule');
  };

  // Distinct leagues present in upcoming matches
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.league) set.add(m.league);
    });
    return Array.from(set).slice(0, 8);
  }, [matches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const list = matches.filter(m => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. League Filter
      if (selectedLeague !== 'all') {
        if (m.league.toLowerCase() !== selectedLeague.toLowerCase()) return false;
      }

      // 3. Timeframe Filter
      if (timeframe !== 'all') {
        const mDate = new Date(m.match_date);
        const mDateStr = mDate.toDateString();
        const dayOfWeek = mDate.getDay(); // 0 = Sunday, 6 = Saturday, 5 = Friday

        if (timeframe === 'today' && mDateStr !== todayStr) return false;
        if (timeframe === 'tomorrow' && mDateStr !== tomorrowStr) return false;
        if (timeframe === 'weekend' && dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0) return false;
      }

      return true;
    });

    // Prioritize user's region
    return sortPredictions(list);
  }, [matches, searchQuery, selectedLeague, timeframe, sortPredictions]);

  const isMarketInSlip = (match: UpcomingMatch, market: string) => {
    return selections.some(
      s => s.homeTeam === match.home_team && s.awayTeam === match.away_team && s.market === market
    );
  };

  const handleOddsClick = (e: React.MouseEvent, match: UpcomingMatch, market: string, odds: number) => {
    e.stopPropagation();
    addSelection({
      match: `${match.home_team} vs ${match.away_team}`,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      league: match.league,
      matchDate: match.match_date,
      market,
      odds,
      confidence: match.confidence,
    });
  };

  if (loading && matches.length === 0) {
    return (
      <section className="py-10 bg-background/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <UpcomingMatchListSkeleton count={6} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-background/50 border-t border-border/40">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Upcoming with AI Tips
              </h2>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                {region.flag} {region.shortLabel}
              </Badge>
              {isRealTime && (
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Fixture Feed
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Live scheduled matches with predictive win probabilities, market odds & one-click bet slip integration.
            </p>
          </div>

          {/* QUICK SHORTCUTS & REFRESH */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs font-semibold gap-1.5"
              title="Refresh upcoming schedule"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Sync
            </Button>
            <Link to="/accumulator">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Acca Builder
              </Button>
            </Link>
            <Link to="/best-bets">
              <Button size="sm" className="h-8 text-xs font-bold gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Best Bets
              </Button>
            </Link>
          </div>
        </div>

        {/* FILTER & SEARCH CONTROLS */}
        <div className="mb-6 space-y-3 bg-card border border-border/70 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  timeframe === 'all'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Fixtures
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  timeframe === 'today'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('tomorrow')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  timeframe === 'tomorrow'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('weekend')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  timeframe === 'weekend'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Weekend
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search team or league..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick League pills */}
          {availableLeagues.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Competitions:
              </span>
              <button
                type="button"
                onClick={() => setSelectedLeague('all')}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors shrink-0 font-medium ${
                  selectedLeague === 'all'
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-muted/30 border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                All ({matches.length})
              </button>
              {availableLeagues.map(lg => {
                const badge = getLeagueBadge(lg);
                const count = matches.filter(m => m.league === lg).length;
                return (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setSelectedLeague(lg)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors shrink-0 font-medium flex items-center gap-1 ${
                      selectedLeague.toLowerCase() === lg.toLowerCase()
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-muted/30 border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span>{lg}</span>
                    <span className="text-[9px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MATCHES GRID */}
        {filteredMatches.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.slice(0, 9).map(m => {
              const badgeMeta = getLeagueBadge(m.league);
              const outcome = m.predicted_outcome || m.prediction || 'Match Winner';
              const confidence = m.confidence_score ?? m.confidence ?? 75;
              const isBanker = confidence >= 80;
              const isHomePinned = isTeamPinned(m.home_team);
              const isAwayPinned = isTeamPinned(m.away_team);
              const relativeKickoff = getKickoffRelative(m.match_date);
              const matchSlug = `${m.home_team.toLowerCase().replace(/\s+/g, '-')}-vs-${m.away_team.toLowerCase().replace(/\s+/g, '-')}`;

              return (
                <Card
                  key={m.id}
                  className="hover:border-primary/50 transition-all duration-200 h-full flex flex-col justify-between group bg-card shadow-xs hover:shadow-md cursor-pointer"
                  onClick={() => setSelectedMatch(m)}
                >
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div>
                      {/* Top Bar: League & Kickoff time */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <Badge variant="outline" className="text-[11px] font-bold border-border/80">
                            {m.league}
                          </Badge>
                          {badgeMeta.badgeLabel && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-medium"
                            >
                              {badgeMeta.badgeLabel}
                            </Badge>
                          )}
                        </div>

                        {/* Kickoff timing */}
                        <div className="flex items-center gap-1.5 text-right shrink-0">
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                              relativeKickoff.status === 'live'
                                ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                                : 'text-muted-foreground'
                            }`}
                            title={formatKickoff(m.match_date)}
                          >
                            <Clock className="h-3 w-3" />
                            {relativeKickoff.label}
                          </span>
                          <div onClick={e => e.stopPropagation()}>
                            <NotifyMeButton
                              match={{
                                id: m.id,
                                home_team: m.home_team,
                                away_team: m.away_team,
                                league: m.league,
                                match_date: m.match_date,
                                prediction: outcome,
                                confidence,
                                home_odds: m.home_odds,
                                draw_odds: m.draw_odds,
                                away_odds: m.away_odds,
                              }}
                              variant="icon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Teams Row */}
                      <div className="py-2.5 px-2.5 bg-muted/25 rounded-xl border border-border/40 my-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <TeamLogo team={m.home_team} size="sm" />
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-sm text-foreground block truncate group-hover:text-primary transition-colors">
                                {m.home_team}
                              </span>
                              {isHomePinned && (
                                <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                                  <Pin className="h-2.5 w-2.5 fill-primary" /> Pinned
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-center px-2 shrink-0">
                            <span className="text-[10px] font-black text-muted-foreground bg-muted/80 px-2 py-0.5 rounded uppercase tracking-wider">
                              VS
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-sm text-foreground block truncate group-hover:text-primary transition-colors">
                                {m.away_team}
                              </span>
                              {isAwayPinned && (
                                <span className="text-[9px] font-bold text-primary flex items-center justify-end gap-0.5">
                                  <Pin className="h-2.5 w-2.5 fill-primary" /> Pinned
                                </span>
                              )}
                            </div>
                            <TeamLogo team={m.away_team} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Prediction & Confidence pill */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold border ${
                              OUTCOME_STYLES[outcome] || 'bg-primary/10 text-primary border-primary/20'
                            }`}
                          >
                            {outcome}
                          </Badge>
                          {isBanker && (
                            <Badge variant="secondary" className="text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1">
                              <Flame className="h-2.5 w-2.5" /> Banker
                            </Badge>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-primary">
                            {confidence}% Edge
                          </span>
                        </div>
                      </div>

                      {/* Interactive 1X2 Odds with Bet Slip Integration */}
                      {m.home_odds && (
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {/* 1 - Home */}
                          <button
                            type="button"
                            onClick={e => handleOddsClick(e, m, '1', m.home_odds || 2.1)}
                            className={`p-1.5 rounded-lg border text-xs text-center transition-all flex flex-col items-center justify-center ${
                              isMarketInSlip(m, '1')
                                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                : 'bg-muted/40 hover:bg-muted/80 border-border/70 text-foreground'
                            }`}
                            title={`Add ${m.home_team} win to Bet Slip`}
                          >
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">1</span>
                            <span className="font-mono font-bold">{formatOdds(m.home_odds)}</span>
                          </button>

                          {/* X - Draw */}
                          <button
                            type="button"
                            onClick={e => handleOddsClick(e, m, 'X', m.draw_odds || 3.3)}
                            className={`p-1.5 rounded-lg border text-xs text-center transition-all flex flex-col items-center justify-center ${
                              isMarketInSlip(m, 'X')
                                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                : 'bg-muted/40 hover:bg-muted/80 border-border/70 text-foreground'
                            }`}
                            title="Add Draw to Bet Slip"
                          >
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">X</span>
                            <span className="font-mono font-bold">{formatOdds(m.draw_odds || 3.3)}</span>
                          </button>

                          {/* 2 - Away */}
                          <button
                            type="button"
                            onClick={e => handleOddsClick(e, m, '2', m.away_odds || 3.4)}
                            className={`p-1.5 rounded-lg border text-xs text-center transition-all flex flex-col items-center justify-center ${
                              isMarketInSlip(m, '2')
                                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                : 'bg-muted/40 hover:bg-muted/80 border-border/70 text-foreground'
                            }`}
                            title={`Add ${m.away_team} win to Bet Slip`}
                          >
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">2</span>
                            <span className="font-mono font-bold">{formatOdds(m.away_odds || 3.4)}</span>
                          </button>
                        </div>
                      )}

                      {/* Card Footer: Match Details button */}
                      <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="text-[11px] font-medium flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-primary" />
                          H2H & xG Model
                        </span>
                        <div className="flex items-center gap-1 font-bold text-primary hover:underline text-[11px]">
                          <span>Analysis &rarr;</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 border border-dashed rounded-2xl p-6">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-foreground">No upcoming fixtures match your filters</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Try choosing a different timeframe or clearing your search query to see upcoming scheduled fixtures.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLeague('all');
                  setTimeframe('all');
                  setSearchQuery('');
                }}
                className="text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        )}

        {/* BOTTOM LINK */}
        {filteredMatches.length > 9 && (
          <div className="mt-6 text-center">
            <Link to="/screener">
              <Button variant="outline" className="gap-2 text-xs font-semibold">
                Explore All {filteredMatches.length} Fixtures in Match Screener
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* MATCH ANALYTICS MODAL */}
      {selectedMatch && (
        <MatchAnalyticsModal
          prediction={selectedMatch}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </section>
  );
};
