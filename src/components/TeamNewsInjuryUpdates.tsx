import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Prediction } from '@/types/prediction';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import {
  MatchTeamNewsReport,
  PlayerAvailabilityStatus,
  PlayerInjuryUpdate,
  buildBaselineTeamNewsReport,
  fetchMatchTeamNewsAndInjuries,
  getFeaturedMatchesForTeamNews,
} from '@/services/teamNewsService';
import {
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Check,
  ArrowUpRight,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

export interface TeamNewsInjuryUpdatesProps {
  /** Optional specific match when embedded on a single Match Prediction page */
  singleMatch?: Prediction;
  /** Optional custom list of featured matches */
  featuredMatches?: Prediction[];
  /** Optional initial league filter */
  leagueFilter?: string;
  className?: string;
}

type StatusFilter = 'all' | 'unavailable' | 'doubtful' | 'returning';

export const TeamNewsInjuryUpdates: React.FC<TeamNewsInjuryUpdatesProps> = ({
  singleMatch,
  featuredMatches: customFeaturedMatches,
  leagueFilter,
  className = '',
}) => {
  const { data } = usePredictions(1, leagueFilter);
  const { selections, addSelection } = useBetSlip();

  const matchesList = useMemo(() => {
    if (singleMatch) return [singleMatch];
    if (customFeaturedMatches && customFeaturedMatches.length > 0) {
      return customFeaturedMatches.slice(0, 6);
    }
    return getFeaturedMatchesForTeamNews(data?.allPredictions).slice(0, 6);
  }, [singleMatch, customFeaturedMatches, data?.allPredictions]);

  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const activeMatch = matchesList[selectedMatchIndex] || matchesList[0];

  const [report, setReport] = useState<MatchTeamNewsReport>(() =>
    buildBaselineTeamNewsReport(
      activeMatch || {
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        league: 'Premier League',
      }
    )
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [syncing, setSyncing] = useState(false);
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<Record<string, boolean>>({});

  // Default to expanding the first player of each team when report changes, while preserving manual toggles
  useEffect(() => {
    setExpandedPlayerIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      const firstHome = report.injuries.find((i) => i.team === 'home');
      const firstAway = report.injuries.find((i) => i.team === 'away');
      if (firstHome && !(firstHome.id in next)) {
        next[firstHome.id] = true;
      }
      if (firstAway && !(firstAway.id in next)) {
        next[firstAway.id] = true;
      }
      return next;
    });
  }, [report.matchId, report.injuries]);

  const togglePlayerDetails = useCallback((playerId: string) => {
    setExpandedPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }, []);

  const loadReport = useCallback(
    async (forceRefresh = false) => {
      if (!activeMatch) return;
      if (forceRefresh) {
        setSyncing(true);
      } else {
        // Immediately render deterministic baseline so there is zero layout shift
        setReport(buildBaselineTeamNewsReport(activeMatch));
      }

      try {
        const liveReport = await fetchMatchTeamNewsAndInjuries(activeMatch, forceRefresh);
        setReport(liveReport);
        if (forceRefresh) {
          toast.success(
            `Synchronized live squad & injury intelligence for ${activeMatch.home_team} vs ${activeMatch.away_team}`
          );
        }
      } catch {
        if (forceRefresh) {
          toast.error('Live feed unreachable; displaying verified club medical baseline.');
        }
      } finally {
        setSyncing(false);
      }
    },
    [activeMatch]
  );

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  const filteredInjuries = useMemo(() => {
    return report.injuries.filter((item) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unavailable') {
        return item.status === 'Ruled Out' || item.status === 'Suspended';
      }
      if (statusFilter === 'doubtful') {
        return item.status === 'Doubtful';
      }
      if (statusFilter === 'returning') {
        return item.status === 'Returning';
      }
      return true;
    });
  }, [report.injuries, statusFilter]);

  const homeUpdates = useMemo(
    () => filteredInjuries.filter((i) => i.team === 'home'),
    [filteredInjuries]
  );
  const awayUpdates = useMemo(
    () => filteredInjuries.filter((i) => i.team === 'away'),
    [filteredInjuries]
  );

  const statusCounts = useMemo(() => {
    const all = report.injuries.length;
    const unavailable = report.injuries.filter(
      (i) => i.status === 'Ruled Out' || i.status === 'Suspended'
    ).length;
    const doubtful = report.injuries.filter((i) => i.status === 'Doubtful').length;
    const returning = report.injuries.filter((i) => i.status === 'Returning').length;
    return { all, unavailable, doubtful, returning };
  }, [report.injuries]);

  const areAllVisibleExpanded = useMemo(() => {
    if (filteredInjuries.length === 0) return false;
    return filteredInjuries.every((item) => Boolean(expandedPlayerIds[item.id]));
  }, [filteredInjuries, expandedPlayerIds]);

  const handleToggleAllVisible = useCallback(() => {
    const targetState = !areAllVisibleExpanded;
    setExpandedPlayerIds((prev) => {
      const next = { ...prev };
      for (const item of filteredInjuries) {
        next[item.id] = targetState;
      }
      return next;
    });
  }, [areAllVisibleExpanded, filteredInjuries]);

  const getStatusTextClass = (status: PlayerAvailabilityStatus) => {
    switch (status) {
      case 'Ruled Out':
      case 'Suspended':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      case 'Doubtful':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'Returning':
        return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      default:
        return 'text-muted-foreground';
    }
  };

  const alreadyInSlip = useMemo(
    () =>
      selections.some(
        (s) =>
          s.homeTeam.toLowerCase() === report.homeTeam.toLowerCase() &&
          s.awayTeam.toLowerCase() === report.awayTeam.toLowerCase() &&
          s.market === report.adjustedMarketTip
      ),
    [selections, report.homeTeam, report.awayTeam, report.adjustedMarketTip]
  );

  const handleAddAdjustedPick = () => {
    addSelection({
      matchId: report.matchId,
      match: `${report.homeTeam} vs ${report.awayTeam}`,
      homeTeam: report.homeTeam,
      awayTeam: report.awayTeam,
      league: report.league,
      matchDate: report.matchDate,
      market: report.adjustedMarketTip,
      odds: report.adjustedMarketOdds,
      confidence: report.adjustedConfidence,
    });
  };

  const matchDetailPath = `/predict/${formatMatchSlug(
    report.homeTeam,
    report.awayTeam,
    report.matchDate
  )}`;

  return (
    <section
      aria-label="Team News and Injury Updates"
      className={`rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs ${className}`}
    >
      {/* Top Section Header */}
      <div className="p-5 sm:p-6 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Real-Time Medical & Lineup Wire</span>
            <span aria-hidden="true">·</span>
            <span>{report.league}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Updated {new Date(report.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Team News & Injury Updates
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Live squad availability, press conference confirmations, and starting XI adjustments quantified into Expected Goals (xG) and betting insight accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => loadReport(true)}
            disabled={syncing}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            aria-label="Synchronize real-time injury and lineup news"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-primary' : ''}`} aria-hidden="true" />
            <span>{syncing ? 'Syncing Wire...' : 'Sync Live Team News'}</span>
          </button>

          {!singleMatch && (
            <Link
              to={matchDetailPath}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Full Match Model</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/* Featured Match Selector Bar (when multiple featured matches are available) */}
      {!singleMatch && matchesList.length > 1 && (
        <div className="px-5 sm:px-6 py-3 bg-muted/25 border-b border-border/60 overflow-x-auto">
          <div
            className="flex items-center gap-1.5 min-w-max"
            role="tablist"
            aria-label="Select featured match for team news and injury updates"
          >
            {matchesList.map((m, idx) => {
              const isSelected = idx === selectedMatchIndex;
              return (
                <button
                  key={m.id || `${m.home_team}-${m.away_team}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedMatchIndex(idx);
                    setStatusFilter('all');
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-background/70 text-muted-foreground hover:text-foreground hover:bg-background border border-border/50'
                  }`}
                >
                  <TeamLogo team={m.home_team} league={m.league} size="xs" />
                  <span className="truncate max-w-[110px]">{m.home_team}</span>
                  <span className="opacity-60 font-normal">vs</span>
                  <span className="truncate max-w-[110px]">{m.away_team}</span>
                  <TeamLogo team={m.away_team} league={m.league} size="xs" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-6">
        {/* Betting Insight Accuracy & xG Calibration Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 border-b border-border/60 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {report.homeTeam} ({report.homeFormation}) vs {report.awayTeam} ({report.awayFormation})
              </span>
              <span aria-hidden="true">·</span>
              <span>Lineup Calibration</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
              {report.headline}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {report.pressConferenceSummary}
            </p>
            <p className="text-xs text-foreground/90 pt-1">
              <span className="font-semibold">Betting Insight Impact: </span>
              {report.adjustedMarketReason}
            </p>
          </div>

          {/* Tabular Quantitative Metrics & 1-Click Bet Slip Action */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 lg:pl-6 lg:border-l border-border/60">
            <div className="grid grid-cols-3 gap-3 text-left">
              <div>
                <p className="text-[11px] text-muted-foreground">Adjusted Accuracy</p>
                <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground mt-0.5">
                  {report.baselineConfidence}% →{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {report.adjustedConfidence}%
                  </span>
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                  {report.confidenceAdjustment >= 0
                    ? `+${report.confidenceAdjustment}% news edge`
                    : `${report.confidenceAdjustment}% caution`}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground">Net xG Shift</p>
                <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground mt-0.5">
                  {report.xgDeltaHome >= 0 ? `+${report.xgDeltaHome}` : report.xgDeltaHome}
                  <span className="text-muted-foreground font-normal"> / </span>
                  {report.xgDeltaAway >= 0 ? `+${report.xgDeltaAway}` : report.xgDeltaAway}
                </p>
                <p className="text-[11px] text-muted-foreground">Home / Away xG</p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground">XI Availability</p>
                <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground mt-0.5">
                  {report.homeLineupStrength}%
                  <span className="text-muted-foreground font-normal"> vs </span>
                  {report.awayLineupStrength}%
                </p>
                <p className="text-[11px] text-muted-foreground">Confirmed Fit</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Injury-Adjusted Pick</p>
                <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {report.adjustedMarketTip}{' '}
                  <span className="font-mono tabular-nums text-primary">
                    @{report.adjustedMarketOdds.toFixed(2)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAdjustedPick}
                disabled={alreadyInSlip}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
                  alreadyInSlip
                    ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {alreadyInSlip ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>In Bet Slip</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Adjusted Pick</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Filter Controls for Player Statuses */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50"
            role="group"
            aria-label="Filter squad updates by availability status"
          >
            {(
              [
                { id: 'all', label: `All Squad News (${statusCounts.all})` },
                { id: 'unavailable', label: `Ruled Out & Suspended (${statusCounts.unavailable})` },
                { id: 'doubtful', label: `Late Fitness Tests (${statusCounts.doubtful})` },
                { id: 'returning', label: `Returning to XI (${statusCounts.returning})` },
              ] as Array<{ id: StatusFilter; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                aria-pressed={statusFilter === tab.id}
                className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div>
              <span>Projected Shapes: </span>
              <span className="font-mono tabular-nums text-foreground font-medium">
                {report.homeTeam} {report.homeFormation}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums text-foreground font-medium">
                {report.awayTeam} {report.awayFormation}
              </span>
            </div>

            {filteredInjuries.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllVisible}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={areAllVisibleExpanded ? 'Collapse all player details' : 'Expand all player details'}
              >
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>{areAllVisibleExpanded ? 'Collapse All Details' : 'Expand All Details'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Side-by-Side Home & Away Squad Availability Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              side: 'home' as const,
              teamName: report.homeTeam,
              formation: report.homeFormation,
              strength: report.homeLineupStrength,
              label: 'Home Squad',
              updates: homeUpdates,
              lineupNote: report.lineupNotes[0],
            },
            {
              side: 'away' as const,
              teamName: report.awayTeam,
              formation: report.awayFormation,
              strength: report.awayLineupStrength,
              label: 'Away Squad',
              updates: awayUpdates,
              lineupNote: report.lineupNotes[1],
            },
          ].map((column) => (
            <div key={column.side} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <TeamLogo team={column.teamName} league={report.league} size="sm" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{column.teamName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {column.label} · {column.formation} ·{' '}
                      <span className="font-mono tabular-nums text-foreground font-medium">
                        {column.strength}% Strength
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Click player to inspect
                </span>
              </div>

              {column.updates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  No {statusFilter !== 'all' ? statusFilter : ''} squad updates recorded for {column.teamName}.
                </p>
              ) : (
                <div className="divide-y divide-border/50">
                  {column.updates.map((item: PlayerInjuryUpdate) => {
                    const isExpanded = Boolean(expandedPlayerIds[item.id]);
                    const panelId = `player-injury-panel-${item.id}`;
                    return (
                      <div key={item.id} className="py-1 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          onClick={() => togglePlayerDetails(item.id)}
                          aria-expanded={isExpanded}
                          aria-controls={panelId}
                          className="w-full min-h-[44px] py-2 px-2 -mx-2 rounded-lg text-left flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-sm font-semibold text-foreground">
                              {item.player}
                            </span>
                            <span aria-hidden="true" className="text-muted-foreground">·</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {item.position}
                            </span>
                            <span aria-hidden="true" className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {item.roleImportance}
                            </span>
                            <span aria-hidden="true" className="text-muted-foreground">·</span>
                            <span className="text-xs font-mono tabular-nums text-foreground/90 font-medium">
                              {item.xgImpact}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs ${getStatusTextClass(item.status)}`}>
                              {item.status}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                                isExpanded ? 'rotate-180 text-primary' : 'text-muted-foreground'
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                        </button>

                        <div
                          id={panelId}
                          role="region"
                          aria-label={`${item.player} injury and lineup details`}
                          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pt-1.5 pb-3 space-y-1.5 border-t border-border/40 mt-0.5">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <span className="text-foreground font-medium">Medical / Status:</span>
                                <span>{item.injuryType}</span>
                                <span aria-hidden="true">·</span>
                                <span className="text-foreground font-medium">Timeline:</span>
                                <span>{item.expectedReturn}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-foreground font-medium">
                                  Model Impact: {item.xgImpact}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.note}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {column.lineupNote && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span className="font-semibold text-foreground">Tactical Lineup Note: </span>
                  {column.lineupNote}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Live Press & Medical Wire Feed */}
        {report.liveWireItems.length > 0 && (
          <div className="pt-5 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Live Press Conference & Medical Bulletins
              </h4>
              {report.groundingMetadata?.sources && report.groundingMetadata.sources.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {report.groundingMetadata.sources.slice(0, 2).map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="truncate max-w-[180px]">{src.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.liveWireItems.slice(0, 2).map((wire) => (
                <div
                  key={wire.id}
                  className="p-3.5 rounded-xl bg-muted/25 border border-border/50 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{wire.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{wire.source}</span>
                    </div>
                    <a
                      href={wire.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      <span>{wire.headline}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
                    </a>
                    <p className="text-xs text-muted-foreground line-clamp-2">{wire.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamNewsInjuryUpdates;
