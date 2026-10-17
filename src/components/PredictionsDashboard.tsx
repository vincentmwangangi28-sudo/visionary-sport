import { useState, useEffect, useMemo, Fragment } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserPreferences, RiskProfile } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { GeoRegionSelector } from '@/components/GeoRegionSelector';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { LeagueDateFilterBar, DateFilterType } from '@/components/LeagueDateFilterBar';
import { hapticService } from '@/services/hapticService';
import {
  matchesDateFilter,
  calculateDateFilterCounts,
  isPlayedOrPastMatch,
  sortMatchesByDatePriority,
  groupMatchesByDate,
} from '@/lib/dateFilterUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RefreshCw,
  LayoutGrid,
  List,
  AlignJustify,
  Search,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Filter,
} from 'lucide-react';

interface PredictionsDashboardProps {
  initialLeague?: string;
  defaultLeague?: string;
}

type QuickFilter = 'all' | 'recommended' | 'high_confidence' | 'value_bets' | 'today';

export const PredictionsDashboard = ({ initialLeague, defaultLeague }: PredictionsDashboardProps = {}) => {
  const resolvedInitialLeague = initialLeague ?? defaultLeague;
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(resolvedInitialLeague);

  useEffect(() => {
    if (resolvedInitialLeague !== undefined) {
      setLeague(resolvedInitialLeague);
      setPage(1);
    }
  }, [resolvedInitialLeague]);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enableRegionalSort, setEnableRegionalSort] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'card' | 'compact' | 'condensed'>(() => {
    return (localStorage.getItem('predictpro_view_mode') as 'card' | 'compact' | 'condensed') || 'card';
  });

  const { preferences, setRiskProfile } = useUserPreferences();
  const { region, prioritizedLeagues, sortPredictions, getLeagueBadge } = useGeoRegion();
  const { predictions, data, isLoading, pageSize = 6, isFetching, refetch } = usePredictions(page, league);

  // Full unpaginated upcoming predictions pool for accurate date filter counts and filtered views
  const allUpcomingPool = useMemo(() => {
    const rawPool = data?.allPredictions ?? predictions;
    return sortMatchesByDatePriority(rawPool.filter((p) => !isPlayedOrPastMatch(p)));
  }, [data?.allPredictions, predictions]);

  const handleSetViewMode = (mode: 'card' | 'compact' | 'condensed') => {
    hapticService.selection();
    setViewMode(mode);
    try {
      localStorage.setItem('predictpro_view_mode', mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleDensityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<'card' | 'compact' | 'condensed'>;
      if (customEvent.detail) {
        setViewMode(customEvent.detail);
      }
    };
    window.addEventListener('predictpro:set-density', handleDensityEvent);
    return () => window.removeEventListener('predictpro:set-density', handleDensityEvent);
  }, []);


  // Build dynamic league options prioritizing user's detected region + favorites
  const dynamicLeagueTabs = useMemo(() => {
    const list: Array<{ id: string; name: string; flag?: string; badge?: string }> = [
      { id: 'All', name: 'All Leagues' }
    ];

    for (const pl of prioritizedLeagues) {
      if (!list.some(item => item.name.toLowerCase() === pl.name.toLowerCase())) {
        list.push({
          id: pl.name,
          name: pl.name,
          flag: pl.flag,
          badge: pl.badge,
        });
      }
    }

    return list.slice(0, 10);
  }, [prioritizedLeagues]);

  // Date filter counts computed from all upcoming league predictions (ignoring played matches)
  const dateCounts = useMemo(() => {
    return calculateDateFilterCounts(allUpcomingPool);
  }, [allUpcomingPool]);

  // Client-side filtering for date filters, quick filters, risk profiles, search and Date Priority
  const filteredPredictions = useMemo(() => {
    const rawFiltered = allUpcomingPool.filter((p) => {
      if (isPlayedOrPastMatch(p)) return false;

      // Date filter (Today, Tomorrow, Weekend)
      if (dateFilter !== 'all') {
        if (!matchesDateFilter(p.match_date, dateFilter)) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeam = p.home_team.toLowerCase().includes(q) || p.away_team.toLowerCase().includes(q) || p.league.toLowerCase().includes(q);
        if (!matchesTeam) return false;
      }

      // Risk Profile adaptive filtering
      const conf = p.confidence_score ?? p.confidence ?? 60;
      if (preferences.riskProfile === 'conservative') {
        // High confidence only, reasonable odds
        if (conf < 72) return false;
      } else if (preferences.riskProfile === 'aggressive') {
        // Look for juicy odds or higher potential yield
        const hasDecentOdds = (p.home_odds && p.home_odds >= 1.90) || (p.away_odds && p.away_odds >= 1.90) || (p.draw_odds && p.draw_odds >= 3.0);
        if (!hasDecentOdds && conf < 80) return false;
      }

      // Quick filter
      if (quickFilter === 'recommended') {
        const hasValueOdds = (p.home_odds && p.home_odds >= 1.80) || (p.away_odds && p.away_odds >= 1.80);
        if (conf < 74 && !(conf >= 65 && hasValueOdds)) return false;
      } else if (quickFilter === 'high_confidence') {
        if (conf < 80) return false;
      } else if (quickFilter === 'value_bets') {
        const hasHighOdds = (p.home_odds && p.home_odds >= 1.85) || (p.away_odds && p.away_odds >= 1.85);
        if (!hasHighOdds || conf < 70) return false;
      } else if (quickFilter === 'today') {
        if (!matchesDateFilter(p.match_date, 'today')) return false;
      }

      return true;
    });

    if (enableRegionalSort && !league) {
      return sortPredictions(rawFiltered);
    }

    return sortMatchesByDatePriority(rawFiltered);
  }, [allUpcomingPool, dateFilter, searchQuery, quickFilter, preferences.riskProfile, enableRegionalSort, league, sortPredictions]);

  const totalPages = Math.max(1, Math.ceil(filteredPredictions.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedPredictions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPredictions.slice(start, start + pageSize);
  }, [filteredPredictions, currentPage, pageSize]);

  const dateGroupedPredictions = useMemo(() => {
    return groupMatchesByDate(paginatedPredictions);
  }, [paginatedPredictions]);

  const toggleDateGroup = (dateKey: string) => {
    hapticService.selection();
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const toggleAllDateGroups = (collapse: boolean) => {
    hapticService.selection();
    const next: Record<string, boolean> = {};
    for (const g of dateGroupedPredictions) {
      next[g.dateKey] = collapse;
    }
    setCollapsedDates(next);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const el = document.getElementById('predictions-feed-root') || document.getElementById('section-predictions');
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {dynamicLeagueTabs.slice(0, 6).map((l) => (
            <div key={l.id} className="h-7 w-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <PredictionListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div id="predictions-feed-root" className="space-y-4">
      {/* 1. Primary Unified Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10 min-h-[40px] text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              aria-label="Clear search input"
              className="absolute right-1 top-1 h-8 w-8 inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Badges + Density Selector + Filter Drawer Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Quick Filters */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg" role="group" aria-label="Filter predictions">
            <button
              type="button"
              onClick={() => {
                hapticService.selection();
                setQuickFilter('all');
                setPage(1);
              }}
              aria-label="Show all predictions"
              className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center ${
                quickFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                hapticService.selection();
                setQuickFilter('recommended');
                setPage(1);
              }}
              aria-label="Filter AI recommended predictions"
              className={`px-2 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                quickFilter === 'recommended'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span className="hidden xs:inline">Top</span> Picks
            </button>
            <button
              type="button"
              onClick={() => {
                hapticService.selection();
                setQuickFilter('high_confidence');
                setPage(1);
              }}
              aria-label="Filter predictions with greater than 80% confidence"
              className={`px-2 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                quickFilter === 'high_confidence'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              &gt;80%
            </button>
            <button
              type="button"
              onClick={() => {
                hapticService.selection();
                setQuickFilter('value_bets');
                setPage(1);
              }}
              aria-label="Filter positive expected value bets"
              className={`px-2 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                quickFilter === 'value_bets'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">+EV</span>
            </button>
          </div>

          {/* 3-Way Density Toggle (Card vs Compact vs Condensed 1-Line) */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-1 rounded-lg" role="group" aria-label="Change layout density">
            <Button
              size="icon"
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              onClick={() => handleSetViewMode('card')}
              className="h-8 w-8"
              title="Comfortable Cards (Full Details)"
              aria-label="Switch to Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
              onClick={() => handleSetViewMode('compact')}
              className="h-8 w-8"
              title="Compact Cards (50% less scroll)"
              aria-label="Switch to Compact View"
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'condensed' ? 'secondary' : 'ghost'}
              onClick={() => handleSetViewMode('condensed')}
              className="h-8 w-8"
              title="Condensed Rows (75% less scroll, high density)"
              aria-label="Switch to Condensed 1-Line View"
            >
              <AlignJustify className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>

          {/* Advanced Filters Drawer Toggle */}
          <Button
            size="sm"
            variant={showAdvancedFilters ? 'secondary' : 'outline'}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-8 px-2.5 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
            title="Configure Strategy & Region"
            aria-expanded={showAdvancedFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span className="hidden md:inline">Strategy</span>
            {preferences.riskProfile !== 'balanced' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground"
            title="Refresh Fixtures"
            aria-label="Refresh Fixtures"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 2. Collapsible Advanced Filters Drawer (Strategy + Regional Priorities) */}
      {showAdvancedFilters && (
        <div className="p-3 bg-muted/30 border border-border/70 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Strategy:
              </span>
              <div className="flex items-center gap-1 bg-background p-1 rounded-lg border" role="group" aria-label="Select active risk profile">
                {(['conservative', 'balanced', 'aggressive'] as RiskProfile[]).map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => {
                      hapticService.selection();
                      setRiskProfile(profile);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                      preferences.riskProfile === profile
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <GeoRegionSelector variant="compact" />
              <button
                type="button"
                role="switch"
                aria-checked={enableRegionalSort}
                aria-label="Toggle Regional Priority Match Sorting"
                onClick={() => setEnableRegionalSort((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <span
                  className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-transparent transition-colors ${
                    enableRegionalSort ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-3 w-3 rounded-full bg-background shadow-xs transition-transform ${
                      enableRegionalSort ? 'translate-x-3' : 'translate-x-0.5'
                    }`}
                  />
                </span>
                <span className="font-semibold text-[11px]">
                  {enableRegionalSort ? `Prioritizing ${region.shortLabel}` : 'Global Order'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Link to="/archive" className="hover:text-primary hover:underline font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Results Archive
              </Link>
              <Link to="/methodology" className="hover:text-primary hover:underline font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" /> Model Methodology
              </Link>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-xs hover:text-foreground underline"
            >
              Close Tray
            </button>
          </div>
        </div>
      )}

      {/* 3. League Selection Horizontal Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter predictions by league">
        {dynamicLeagueTabs.map((l) => {
          const isSelected = (league === l.id || (l.id === 'All' && !league) || (league === l.name));
          return (
            <Button
              key={l.id}
              size="sm"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => {
                setLeague(l.id === 'All' ? undefined : l.id);
                setPage(1);
              }}
              aria-label={`Filter predictions by ${l.name}`}
              aria-pressed={isSelected}
              className={`text-xs h-8 px-3 flex-shrink-0 font-semibold gap-1.5 transition-all ${
                isSelected ? 'shadow-xs font-bold' : 'hover:border-primary/40'
              }`}
            >
              {l.flag && <span className="text-xs">{l.flag}</span>}
              <span>{l.name}</span>
            </Button>
          );
        })}
      </div>

      {/* 4. Quick-Filter Date Bar */}
      <LeagueDateFilterBar
        selectedFilter={dateFilter}
        onFilterChange={(filter) => {
          setDateFilter(filter);
          setPage(1);
        }}
        counts={dateCounts}
      />

      {/* 5. Match Density & Section Controls Overview Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="font-medium">
          Showing <strong className="text-foreground">{filteredPredictions.length}</strong> upcoming fixtures
          {viewMode === 'condensed' && ' (Condensed mode active)'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAllDateGroups(false)}
            className="hover:text-foreground underline text-[11px]"
          >
            Expand All
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => toggleAllDateGroups(true)}
            className="hover:text-foreground underline text-[11px]"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 6. Predictions Rendering */}
      {isLoading ? (
        <PredictionListSkeleton count={6} viewMode={viewMode} />
      ) : filteredPredictions.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-muted/20 rounded-2xl border border-dashed p-8">
          <Zap className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
          <p className="font-bold text-foreground">
            No predictions found matching your filter criteria
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keywords, clearing quick filters, or selecting "All" leagues.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              onClick={() => {
                setLeague(undefined);
                setDateFilter('all');
                setQuickFilter('all');
                setSearchQuery('');
                setPage(1);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reset All Filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {dateGroupedPredictions.map((group) => {
              const isCollapsed = Boolean(collapsedDates[group.dateKey]);
              return (
                <div key={group.dateKey} className="space-y-2.5 rounded-xl border border-border/50 bg-card/40 p-2 sm:p-3">
                  {/* Collapsible Chronological Date Priority Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleDateGroup(group.dateKey)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          group.isToday
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : group.isTomorrow
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-background text-foreground border border-border'
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {group.isToday ? 'Today · Priority #1' : group.isTomorrow ? 'Tomorrow' : group.subLabel}
                      </span>
                      <h2 className="text-xs sm:text-sm font-bold text-foreground">
                        {group.label}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        {isCollapsed ? 'Click to expand' : 'Collapse'}
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="pt-1">
                      {viewMode === 'card' && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.matches.map((p) => (
                            <PredictionCard key={p.id} prediction={p} viewMode="card" />
                          ))}
                        </div>
                      )}
                      {viewMode === 'compact' && (
                        <div className="space-y-2">
                          {group.matches.map((p) => (
                            <PredictionCard key={p.id} prediction={p} viewMode="compact" />
                          ))}
                        </div>
                      )}
                      {viewMode === 'condensed' && (
                        <div className="space-y-1.5">
                          {group.matches.map((p) => (
                            <PredictionCard key={p.id} prediction={p} viewMode="condensed" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination with Smooth Scroll to Top of Feed */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4" role="navigation" aria-label="Predictions pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, Math.min(page, totalPages) - 1))}
                disabled={currentPage <= 1 || isFetching}
                aria-label="Go to previous page of predictions"
                className="min-h-[40px] px-3.5 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground font-medium" aria-current="page">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, Math.min(page, totalPages) + 1))}
                disabled={currentPage >= totalPages || isFetching}
                aria-label="Go to next page of predictions"
                className="min-h-[40px] px-3.5 gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
