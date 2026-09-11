import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useUpcomingMatches, UpcomingMatch } from '@/hooks/useUpcomingMatches';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useBetSlip } from '@/hooks/useBetSlip';
import { PredictionCard } from '@/components/PredictionCard';
import { UpcomingMatchListSkeleton } from '@/components/PredictionCardSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Zap,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  Flame,
  LayoutGrid,
  List,
  ShieldCheck,
  TrendingUp,
  Radio,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type TimeframeFilter = 'all' | 'today' | 'tomorrow' | 'weekend';

export default function UpcomingFixturesPage() {
  const { matches, loading, isRealTime, refresh } = useUpcomingMatches();
  const { region, sortPredictions, getLeagueBadge } = useGeoRegion();
  const { formatOdds } = useUserPreferences();
  const { addSelections } = useBetSlip();

  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    toast.success('Live fixture schedules and AI modeling refreshed');
  };

  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.league) set.add(m.league);
    });
    return Array.from(set);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const list = matches.filter(m => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (selectedLeague !== 'all') {
        if (m.league.toLowerCase() !== selectedLeague.toLowerCase()) return false;
      }

      if (timeframe !== 'all') {
        const mDate = new Date(m.match_date);
        const mDateStr = mDate.toDateString();
        const dayOfWeek = mDate.getDay();

        if (timeframe === 'today' && mDateStr !== todayStr) return false;
        if (timeframe === 'tomorrow' && mDateStr !== tomorrowStr) return false;
        if (timeframe === 'weekend' && dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0) return false;
      }

      return true;
    });

    return sortPredictions(list);
  }, [matches, searchQuery, selectedLeague, timeframe, sortPredictions]);

  const bankerMatches = useMemo(() => {
    return filteredMatches.filter(m => (m.confidence_score ?? m.confidence ?? 0) >= 80);
  }, [filteredMatches]);

  const handleLoadBankersToSlip = () => {
    if (bankerMatches.length === 0) {
      toast.info('No 80%+ banker picks in currently filtered fixtures');
      return;
    }
    const selectionsToAdd = bankerMatches.slice(0, 4).map(m => ({
      match: `${m.home_team} vs ${m.away_team}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      matchDate: m.match_date,
      market: m.predicted_outcome || m.prediction || 'Home Win',
      odds: m.home_odds || 1.85,
      confidence: m.confidence,
    }));
    addSelections(selectionsToAdd);
    toast.success(`Loaded ${selectionsToAdd.length} high-confidence banker picks into Bet Slip!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Upcoming Football Fixtures & AI Matchday Predictions | PredictPro"
        description="Browse all upcoming verified football fixtures across European and international leagues with win probabilities, AI predictions, and value edge odds."
        keywords="upcoming football matches, soccer fixtures schedule, AI predictions upcoming, football matchday tips"
      />

      <Navbar />

      <main className="container mx-auto px-4 py-20 max-w-6xl flex-1">
        {/* HERO / INTRO HEADER */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-bold gap-1 text-primary border-primary/20 bg-primary/5">
                  <Calendar className="h-3.5 w-3.5" />
                  Upcoming Matchday Center
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                  {region.flag} {region.shortLabel} Priority
                </Badge>
                {isRealTime && (
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Real-Time Feed
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Upcoming Football Fixtures & AI Odds
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Explore confirmed fixtures scheduled for today, tomorrow, and this weekend. Every matchup is
                augmented with expected goals (xG) form regressions, win probabilities, and value odds.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                Sync Fixtures
              </Button>
              {bankerMatches.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleLoadBankersToSlip}
                  className="gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 dark:text-amber-950 shadow-xs"
                >
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  Load {bankerMatches.length} Bankers to Slip
                </Button>
              )}
            </div>
          </div>

          {/* SUMMARY STATS BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border/50">
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Fixtures</p>
              <p className="text-lg font-black text-foreground">{matches.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Filtered Schedule</p>
              <p className="text-lg font-black text-foreground">{filteredMatches.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Banker Picks (≥80%)</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">{bankerMatches.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Competitions</p>
              <p className="text-lg font-black text-primary">{availableLeagues.length}</p>
            </div>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="mb-6 space-y-3 bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Timeframe tabs */}
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
                All Upcoming
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
                This Weekend
              </button>
            </div>

            {/* View Mode & Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter team or league..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-muted/30 shrink-0">
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="h-7 w-7 p-0"
                  title="Card View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className="h-7 w-7 p-0"
                  title="Compact View"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
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

        {/* FIXTURES LIST */}
        {loading && matches.length === 0 ? (
          <UpcomingMatchListSkeleton count={8} />
        ) : filteredMatches.length > 0 ? (
          <div
            className={
              viewMode === 'card'
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {filteredMatches.map(m => (
              <PredictionCard key={m.id} prediction={m} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-bold text-base text-foreground">No upcoming fixtures found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No matches match your current competition or timeframe filters. Reset filters to view all upcoming games.
            </p>
            <div className="mt-4">
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
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
