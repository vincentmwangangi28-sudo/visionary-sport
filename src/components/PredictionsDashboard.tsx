import { useState, useMemo, Fragment } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  Calendar,
  Sparkles
} from 'lucide-react';
import { AdBannerFluid } from '@/components/AdBanner';

const LEAGUES = [
  'All',
  'Premier League',
  'La Liga',
  'Champions League',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Copa Libertadores',
  'AFC Champions League',
  'FA Cup',
  'AFCON Qualifier',
  'KPL',
  'MLS',
  'World Cup',
];

interface PredictionsDashboardProps {
  initialLeague?: string;
}

type QuickFilter = 'all' | 'high_confidence' | 'value_bets' | 'today';

export const PredictionsDashboard = ({ initialLeague }: PredictionsDashboardProps = {}) => {
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(initialLeague);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>(() => {
    return (localStorage.getItem('predictpro_view_mode') as 'card' | 'compact') || 'card';
  });

  const { predictions, isLoading, totalPages, isFetching, refetch } = usePredictions(page, league);

  const handleSetViewMode = (mode: 'card' | 'compact') => {
    setViewMode(mode);
    localStorage.setItem('predictpro_view_mode', mode);
  };

  // Client-side filtering for quick filters and search
  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeam = p.home_team.toLowerCase().includes(q) || p.away_team.toLowerCase().includes(q) || p.league.toLowerCase().includes(q);
        if (!matchesTeam) return false;
      }

      // Quick filter
      const conf = p.confidence_score ?? p.confidence ?? 60;
      if (quickFilter === 'high_confidence') {
        if (conf < 80) return false;
      } else if (quickFilter === 'value_bets') {
        const hasHighOdds = (p.home_odds && p.home_odds >= 1.85) || (p.away_odds && p.away_odds >= 1.85);
        if (!hasHighOdds || conf < 70) return false;
      } else if (quickFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        const matchStr = String(p.match_date).split('T')[0];
        if (matchStr !== todayStr) return false;
      }

      return true;
    });
  }, [predictions, searchQuery, quickFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {LEAGUES.slice(0, 6).map((l) => (
            <div key={l} className="h-7 w-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <PredictionListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls Bar: Search + Filter Pills + View Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Badges + View Mode Switch */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Quick Filters */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                quickFilter === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setQuickFilter('high_confidence')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                quickFilter === 'high_confidence'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3 w-3" /> &gt;80% AI
            </button>
            <button
              onClick={() => setQuickFilter('value_bets')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                quickFilter === 'value_bets'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3 w-3" /> Value Bets
            </button>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-1 rounded-lg">
            <Button
              size="icon"
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              onClick={() => handleSetViewMode('card')}
              className="h-7 w-7"
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
              onClick={() => handleSetViewMode('compact')}
              className="h-7 w-7"
              title="Compact List View"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            title="Refresh Fixtures"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* League Selection Horizontal Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {LEAGUES.map((l) => (
          <Button
            key={l}
            size="sm"
            variant={(league === l || (l === 'All' && !league)) ? 'default' : 'outline'}
            onClick={() => {
              setLeague(l === 'All' ? undefined : l);
              setPage(1);
            }}
            className="text-xs h-7 px-3 flex-shrink-0 font-medium"
          >
            {l}
          </Button>
        ))}
      </div>

      {/* Predictions Rendering */}
      {filteredPredictions.length === 0 ? (
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
          {viewMode === 'card' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPredictions.map((p, i) => (
                <Fragment key={p.id}>
                  <PredictionCard prediction={p} viewMode="card" />
                  {i === 5 && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <AdBannerFluid />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPredictions.map((p, i) => (
                <Fragment key={p.id}>
                  <PredictionCard prediction={p} viewMode="compact" />
                  {i === 5 && <AdBannerFluid />}
                </Fragment>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || isFetching}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isFetching}
                className="h-8 gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
