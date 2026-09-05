import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Trophy,
  BookOpen,
  Shield,
  Activity,
  Calendar,
  ChevronRight,
  Plus,
  Check,
  TrendingUp,
  History,
  Trash2,
  SlidersHorizontal,
  ExternalLink,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatOdds } from '@/services/oddsConverter';
import {
  executeUnifiedSearch,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  POPULAR_SEARCH_SUGGESTIONS,
  UnifiedSearchResult,
  MatchSearchResult,
  LeagueSearchResult,
  TeamSearchResult,
  BlogSearchResult,
  SearchItemType,
} from '@/services/unifiedSearch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const UnifiedSearchModal: React.FC = () => {
  const { isOpen, closeSearch, query, setQuery, activeCategory, setActiveCategory } = useUnifiedSearch();
  const navigate = useNavigate();
  const { addSelection, selections } = useBetSlip();
  const { oddsFormat } = useUserPreferences();

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches when opening
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setSelectedIndex(0);
      // Autofocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Execute search
  const { results, counts } = useMemo(() => {
    return executeUnifiedSearch(query, activeCategory);
  }, [query, activeCategory]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelectResult = useCallback((item: UnifiedSearchResult) => {
    if (query.trim()) {
      const updated = saveRecentSearch(query.trim());
      setRecentSearches(updated);
    }
    closeSearch();
    navigate(item.url);
  }, [query, closeSearch, navigate]);

  const handleApplySuggestion = (suggestionQuery: string, cat: 'all' | SearchItemType = 'all') => {
    setQuery(suggestionQuery);
    setActiveCategory(cat);
    inputRef.current?.focus();
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
    toast.info('Search history cleared');
  };

  const handleAddToSlip = (e: React.MouseEvent, match: MatchSearchResult) => {
    e.stopPropagation();
    const isAlreadySelected = selections.some((s) => s.matchId === match.rawPrediction?.match_id || s.match === match.title);
    if (isAlreadySelected) {
      toast.info(`${match.title} is already in your Bet Slip`);
      return;
    }

    const oddsVal = match.prediction.toLowerCase().includes('home')
      ? match.odds.home
      : match.prediction.toLowerCase().includes('away')
      ? match.odds.away
      : match.odds.draw;

    addSelection({
      matchId: match.rawPrediction?.match_id || match.id,
      match: match.title,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      matchDate: match.matchDate,
      market: match.prediction,
      odds: oddsVal,
      confidence: match.confidence,
    });
    toast.success(`Added ${match.title} (${match.prediction}) to Bet Slip`);
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) {
        handleSelectResult(item);
      }
    }
  };

  // Keep highlighted item in view
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl sm:rounded-2xl top-[20%] sm:top-[25%] translate-y-[-20%] sm:translate-y-[-25%]">
        <DialogTitle className="sr-only">Unified Search</DialogTitle>
        <DialogDescription className="sr-only">
          Query across football matches, league tournaments, blog strategy articles, and live team statistics.
        </DialogDescription>

        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-border/80 px-4 py-3 bg-muted/20">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search matches, leagues, teams, blog posts..."
            className="w-full bg-transparent text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 outline-none pr-8"
            aria-label="Unified Search Input"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/30 border-b border-border/60 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            )}
          >
            All {counts.all > 0 && `(${counts.all})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('matches')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap',
              activeCategory === 'matches'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            )}
          >
            <Zap className="h-3 w-3" />
            Matches {counts.matches > 0 && `(${counts.matches})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('leagues')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap',
              activeCategory === 'leagues'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            )}
          >
            <Trophy className="h-3 w-3" />
            Leagues {counts.leagues > 0 && `(${counts.leagues})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('teams')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap',
              activeCategory === 'teams'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            )}
          >
            <Shield className="h-3 w-3" />
            Team Stats {counts.teams > 0 && `(${counts.teams})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('blog')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap',
              activeCategory === 'blog'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            )}
          >
            <BookOpen className="h-3 w-3" />
            Blog & Guides {counts.blog > 0 && `(${counts.blog})`}
          </button>
        </div>

        {/* Results / Discovery Viewport */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] sm:max-h-[62vh] overflow-y-auto divide-y divide-border/40 p-2 sm:p-3 focus:outline-none"
        >
          {/* 1. ZERO-STATE: Popular & Recent Searches */}
          {!query.trim() && (
            <div className="p-3 sm:p-4 space-y-4">
              {/* AI Recommendations Hub Shortcut Banner */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  closeSearch();
                  navigate('/recommendations');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    closeSearch();
                    navigate('/recommendations');
                  }
                }}
                className="p-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/60 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        AI Recommendations Hub
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 py-0 px-1.5 h-4">
                        Daily Banker & +EV
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Browse algorithmic banker tips, goal machines & high-EV picks
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>

              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleApplySuggestion(term)}
                        className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs text-foreground font-medium transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Discovery Suggestions */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Popular Suggestions
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_SEARCH_SUGGESTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleApplySuggestion(item.query, item.type)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/60 text-left text-xs font-medium transition-all group"
                    >
                      {item.type === 'match' && <Zap className="h-4 w-4 text-amber-500 shrink-0" />}
                      {item.type === 'league' && <Trophy className="h-4 w-4 text-blue-500 shrink-0" />}
                      {item.type === 'team' && <Shield className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {item.type === 'blog' && <BookOpen className="h-4 w-4 text-purple-500 shrink-0" />}
                      <span className="truncate group-hover:text-primary transition-colors">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Navigation Helper */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Search across verified fixtures, live tables, strategy guides, and team performance
                </span>
                <div className="flex items-center gap-2">
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↵</kbd> to select</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. NO RESULTS STATE */}
          {query.trim() && results.length === 0 && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-base">No results found for &ldquo;{query}&rdquo;</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                We couldn&apos;t find any matches, leagues, team stats, or guides matching your criteria. Try adjusting your query or switching categories.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveCategory('all')}
                  className="text-xs h-8"
                >
                  Reset Category
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApplySuggestion('Arsenal')}
                  className="text-xs h-8"
                >
                  Search &ldquo;Arsenal&rdquo;
                </Button>
              </div>
            </div>
          )}

          {/* 3. RESULTS LIST */}
          {query.trim() && results.length > 0 && (
            <div className="space-y-1.5 py-1">
              {results.map((item, index) => {
                const isSelected = selectedIndex === index;

                // MATCH RESULT CARD
                if (item.type === 'match') {
                  const m = item as MatchSearchResult;
                  const isSelectedInSlip = selections.some(
                    (s) => s.matchId === m.rawPrediction?.match_id || s.match === m.title
                  );
                  const formattedOdd = formatOdds(m.odds.home, oddsFormat);

                  return (
                    <div
                      key={m.id}
                      data-index={index}
                      onClick={() => handleSelectResult(m)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all cursor-pointer gap-2 sm:gap-4',
                        isSelected
                          ? 'bg-primary/5 border-primary/40 shadow-xs'
                          : 'bg-card/70 border-border/60 hover:bg-muted/50 hover:border-border'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {m.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {m.awayTeam}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30">
                              {m.league}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.matchDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-foreground/80 font-medium">
                              Tip: <span className="text-primary font-semibold">{m.prediction}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              'text-xs font-bold px-2 py-0.5',
                              m.confidence >= 80
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                            )}
                          >
                            {m.confidence}% AI
                          </Badge>
                          <span className="text-xs font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border/60">
                            {formattedOdd}
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isSelectedInSlip ? 'secondary' : 'outline'}
                          onClick={(e) => handleAddToSlip(e, m)}
                          className={cn(
                            'h-7 px-2 text-xs gap-1',
                            isSelectedInSlip ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : ''
                          )}
                          title={isSelectedInSlip ? 'In bet slip' : 'Add to bet slip'}
                        >
                          {isSelectedInSlip ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="hidden sm:inline">Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span className="hidden sm:inline">Bet Slip</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                }

                // LEAGUE RESULT CARD
                if (item.type === 'league') {
                  const l = item as LeagueSearchResult;
                  return (
                    <div
                      key={l.id}
                      data-index={index}
                      onClick={() => handleSelectResult(l)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer gap-3',
                        isSelected
                          ? 'bg-primary/5 border-primary/40 shadow-xs'
                          : 'bg-card/70 border-border/60 hover:bg-muted/50 hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg shrink-0">
                          {l.flag}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {l.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/30">
                              League
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {l.season} • {l.matchdayLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {l.predictionsUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeSearch();
                              navigate(l.predictionsUrl!);
                            }}
                            className="text-xs text-primary hover:underline font-medium hidden sm:inline-flex items-center gap-1"
                          >
                            Predictions <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          Standings <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                }

                // TEAM STATISTICS CARD
                if (item.type === 'team') {
                  const t = item as TeamSearchResult;
                  return (
                    <div
                      key={t.id}
                      data-index={index}
                      onClick={() => handleSelectResult(t)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all cursor-pointer gap-2 sm:gap-4',
                        isSelected
                          ? 'bg-primary/5 border-primary/40 shadow-xs'
                          : 'bg-card/70 border-border/60 hover:bg-muted/50 hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {t.logo ? (
                          <img
                            src={t.logo}
                            alt={t.team}
                            className="w-8 h-8 object-contain shrink-0 rounded-full bg-muted/40 p-0.5 border"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {t.team.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {t.team}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                              #{t.position} in {t.league}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>
                              P: <strong className="text-foreground">{t.played}</strong> • W: <strong className="text-emerald-600">{t.won}</strong> • D: {t.drawn} • L: {t.lost}
                            </span>
                            <span>
                              GD: <strong className={t.gd >= 0 ? 'text-emerald-600' : 'text-red-500'}>{t.gd > 0 ? `+${t.gd}` : t.gd}</strong>
                            </span>
                            <span>
                              Pts: <strong className="text-foreground font-bold">{t.points}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form badges & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        {t.form && (
                          <div className="flex items-center gap-0.5">
                            {t.form.split('').map((char, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white',
                                  char === 'W'
                                    ? 'bg-emerald-500'
                                    : char === 'L'
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                                )}
                              >
                                {char}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium group-hover:text-primary transition-colors">
                          View Table <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                }

                // BLOG ARTICLE CARD
                if (item.type === 'blog') {
                  const b = item as BlogSearchResult;
                  return (
                    <div
                      key={b.id}
                      data-index={index}
                      onClick={() => handleSelectResult(b)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'group flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer gap-3',
                        isSelected
                          ? 'bg-primary/5 border-primary/40 shadow-xs'
                          : 'bg-card/70 border-border/60 hover:bg-muted/50 hover:border-border'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {b.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-500/30">
                              {b.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {b.excerpt}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 mt-1">
                            <span>{b.readTime} read</span>
                            <span>•</span>
                            <span>{b.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/70 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            {query && (
              <span className="text-muted-foreground truncate">
                for &ldquo;{query}&rdquo;
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↵</kbd> open</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">ESC</kbd> close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
