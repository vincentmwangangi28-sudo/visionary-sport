import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamLogo } from '@/components/TeamLogo';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Download,
  Search,
  RotateCcw,
  ArrowLeftRight,
  Plus,
} from 'lucide-react';
import type { EnrichedStandingRow } from '@/pages/Standings';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export type AdvancedSortField =
  | 'position'
  | 'points'
  | 'xPts'
  | 'xgDiff'
  | 'goalVariance'
  | 'justiceDelta'
  | 'xgf'
  | 'xga'
  | 'gd'
  | 'gf'
  | 'ga'
  | 'ppg';

export type VarianceFilterMode =
  | 'all'
  | 'positive_regression'
  | 'overperforming'
  | 'elite_xg_diff';

interface LeagueTableStatsProps {
  standings: EnrichedStandingRow[];
  leagueName: string;
  leagueFlag: string;
  season?: string;
  activeSortField?: AdvancedSortField;
  activeSortAsc?: boolean;
  onSortChange?: (field: AdvancedSortField, asc: boolean) => void;
}

interface SortMetricOption {
  id: AdvancedSortField;
  label: string;
  shortLabel: string;
  description: string;
  defaultAsc?: boolean;
}

const SORT_METRICS: SortMetricOption[] = [
  {
    id: 'xPts',
    label: 'Expected Points (xPTS)',
    shortLabel: 'Expected Points (xPTS)',
    description: 'Simulated points earned from shot-quality & Bivariate Poisson match probabilities',
  },
  {
    id: 'xgDiff',
    label: 'Expected Goals Difference (xG-Diff)',
    shortLabel: 'Expected Goals Difference (xG-Diff)',
    description: 'Net expected goals created minus expected goals conceded (xGF − xGA)',
  },
  {
    id: 'goalVariance',
    label: 'Goal Variance (GD − xGD)',
    shortLabel: 'Goal Variance',
    description: 'Actual goal difference minus expected goal difference; measures finishing & goalkeeper variance',
  },
  {
    id: 'justiceDelta',
    label: 'Points Variance (Pts − xPTS)',
    shortLabel: 'Pts − xPTS',
    description: 'Actual points minus Expected Points; negative values indicate clubs due positive regression',
    defaultAsc: true,
  },
  {
    id: 'xgf',
    label: 'Expected Goals For (xGF)',
    shortLabel: 'xGF',
    description: 'Cumulative attacking shot quality generated across all fixtures',
  },
  {
    id: 'xga',
    label: 'Expected Goals Against (xGA)',
    shortLabel: 'xGA',
    description: 'Cumulative defensive shot quality conceded (lower is stronger)',
    defaultAsc: true,
  },
  {
    id: 'ppg',
    label: 'Points Per Game (PPG)',
    shortLabel: 'PPG',
    description: 'Average official points earned per match played',
  },
  {
    id: 'points',
    label: 'Official Points (Pts)',
    shortLabel: 'Official Pts',
    description: 'Official league table points tally',
  },
];

export const LeagueTableStats: React.FC<LeagueTableStatsProps> = ({
  standings,
  leagueName,
  leagueFlag,
  season = '2026/2027',
  activeSortField: controlledSortField,
  activeSortAsc: controlledSortAsc,
  onSortChange,
}) => {
  const { addSelection } = useBetSlip();
  const [internalSortField, setInternalSortField] = useState<AdvancedSortField>('xPts');
  const [internalSortAsc, setInternalSortAsc] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<VarianceFilterMode>('all');
  const [clubQuery, setClubQuery] = useState<string>('');
  const [compareClubs, setCompareClubs] = useState<string[]>([]);

  const sortField = controlledSortField ?? internalSortField;
  const sortAsc = controlledSortAsc ?? internalSortAsc;

  const handleToggleCompareClub = (teamName: string) => {
    setCompareClubs((prev) => {
      if (prev.includes(teamName)) {
        return prev.filter((t) => t !== teamName);
      }
      if (prev.length >= 2) {
        return [prev[1], teamName];
      }
      return [...prev, teamName];
    });
  };

  const handleAddClubValuePlay = (row: EnrichedStandingRow & { xgDiffPer90: number }) => {
    const isPositiveRegression = row.goalVariance < -0.5 || row.justiceDelta < -0.8;
    const isHighAttack = row.xgf / Math.max(1, row.played) >= 1.65;
    const market = isPositiveRegression
      ? `${row.team} Draw No Bet (xPTS Edge)`
      : isHighAttack
      ? 'Over 2.5 Goals (xGF Model)'
      : `${row.team} 1X2 Win`;
    const fairOdds = Number(
      Math.max(1.52, Math.min(2.65, 2.15 - row.xgDiffPer90 * 0.35)).toFixed(2)
    );
    const confidence = Math.min(89, Math.max(72, Math.round(74 + row.xgDiffPer90 * 8)));

    addSelection({
      id: `standings-xpts-${row.team}-${Date.now()}`,
      matchId: `standings-xpts-${row.team}`,
      match: `${row.team} (Next ${leagueName} Fixture)`,
      homeTeam: row.team,
      awayTeam: `${leagueName} Opponent`,
      league: leagueName,
      kickoff: 'Next Matchday',
      market,
      selection: market,
      odds: fairOdds,
      confidence,
    });
    toast.success(`Added ${row.team} (${market} @ ${fairOdds.toFixed(2)}) to Bet Slip`);
  };

  const handleSelectSort = (field: AdvancedSortField) => {
    const metricMeta = SORT_METRICS.find((m) => m.id === field);
    let nextAsc = false;
    if (sortField === field) {
      nextAsc = !sortAsc;
    } else {
      nextAsc = metricMeta?.defaultAsc ?? false;
    }
    setInternalSortField(field);
    setInternalSortAsc(nextAsc);
    onSortChange?.(field, nextAsc);
  };

  const handleDropdownSort = (field: AdvancedSortField) => {
    const metricMeta = SORT_METRICS.find((m) => m.id === field);
    const nextAsc = metricMeta?.defaultAsc ?? false;
    setInternalSortField(field);
    setInternalSortAsc(nextAsc);
    onSortChange?.(field, nextAsc);
  };

  const handleToggleDirection = () => {
    const nextAsc = !sortAsc;
    setInternalSortAsc(nextAsc);
    onSortChange?.(sortField, nextAsc);
  };

  const handleReset = () => {
    setInternalSortField('xPts');
    setInternalSortAsc(false);
    setFilterMode('all');
    setClubQuery('');
    setCompareClubs([]);
    onSortChange?.('xPts', false);
  };

  // Compute derived metrics including per-90 xG-Diff and rank comparisons
  const normalizedRows = useMemo(() => {
    const base = standings.map((row) => {
      const gf = typeof row.gf === 'number' ? row.gf : Math.max(row.played, Math.round(row.played * 1.4 + row.gd * 0.5));
      const ga = typeof row.ga === 'number' ? row.ga : Math.max(1, gf - row.gd);
      const goalVariance =
        typeof row.goalVariance === 'number'
          ? row.goalVariance
          : Number((row.gd - row.xgDiff).toFixed(1));
      const attackVariance =
        typeof row.attackVariance === 'number'
          ? row.attackVariance
          : Number((gf - row.xgf).toFixed(1));
      const defenseVariance =
        typeof row.defenseVariance === 'number'
          ? row.defenseVariance
          : Number((row.xga - ga).toFixed(1));
      const ppg =
        typeof row.ppg === 'number'
          ? row.ppg
          : Number((row.points / Math.max(1, row.played)).toFixed(2));
      const xgDiffPer90 = Number((row.xgDiff / Math.max(1, row.played)).toFixed(2));

      return {
        ...row,
        gf,
        ga,
        goalVariance,
        attackVariance,
        defenseVariance,
        ppg,
        xgDiffPer90,
      };
    });

    const xptsOrder = [...base].sort((a, b) => b.xPts - a.xPts || b.xgDiff - a.xgDiff);
    const xgDiffOrder = [...base].sort((a, b) => b.xgDiff - a.xgDiff || b.xPts - a.xPts);

    const xptsRankMap = new Map<string, number>();
    const xgDiffRankMap = new Map<string, number>();
    xptsOrder.forEach((r, idx) => xptsRankMap.set(r.team, idx + 1));
    xgDiffOrder.forEach((r, idx) => xgDiffRankMap.set(r.team, idx + 1));

    return base.map((r) => ({
      ...r,
      xptsRank: xptsRankMap.get(r.team) ?? r.position,
      xgDiffRank: xgDiffRankMap.get(r.team) ?? r.position,
    }));
  }, [standings]);

  // League-wide insight leaders
  const insights = useMemo(() => {
    if (normalizedRows.length === 0) return null;

    const byXpts = [...normalizedRows].sort((a, b) => b.xPts - a.xPts || b.xgDiff - a.xgDiff);
    const byXgDiff = [...normalizedRows].sort((a, b) => b.xgDiff - a.xgDiff || b.xPts - a.xPts);
    const byUnderperforming = [...normalizedRows].sort(
      (a, b) => a.goalVariance - b.goalVariance || a.justiceDelta - b.justiceDelta
    );
    const byOverperforming = [...normalizedRows].sort(
      (a, b) => b.goalVariance - a.goalVariance || b.justiceDelta - a.justiceDelta
    );

    return {
      xptsLeader: byXpts[0],
      xgDiffLeader: byXgDiff[0],
      regressionBuy: byUnderperforming[0],
      clinicalFinisher: byOverperforming[0],
      maxAbsXgDiff: Math.max(...normalizedRows.map((r) => Math.abs(r.xgDiff)), 1),
      maxAbsGoalVariance: Math.max(...normalizedRows.map((r) => Math.abs(r.goalVariance)), 1),
    };
  }, [normalizedRows]);

  // Filter and sort rows
  const sortedRows = useMemo(() => {
    let list = [...normalizedRows];

    if (clubQuery.trim()) {
      const q = clubQuery.trim().toLowerCase();
      list = list.filter((r) => r.team.toLowerCase().includes(q));
    }

    if (filterMode === 'positive_regression') {
      list = list.filter((r) => r.goalVariance < -0.5 || r.justiceDelta < -0.8);
    } else if (filterMode === 'overperforming') {
      list = list.filter((r) => r.goalVariance > 0.5 || r.justiceDelta > 0.8);
    } else if (filterMode === 'elite_xg_diff') {
      list = list.filter((r) => r.xgDiff >= 2.0);
    }

    list.sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA === valB) {
        return b.xPts - a.xPts;
      }
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return list;
  }, [normalizedRows, clubQuery, filterMode, sortField, sortAsc]);

  const handleExportCsv = () => {
    if (sortedRows.length === 0) return;
    const headers = [
      'Rank',
      'Official Pos',
      'Club',
      'Played',
      'Points',
      'PPG',
      'xPTS',
      'Pts-xPTS',
      'GF',
      'GA',
      'GD',
      'xGF',
      'xGA',
      'xG-Diff',
      'Goal Variance (GD-xGD)',
      'Attack Variance (GF-xGF)',
      'Defense Variance (xGA-GA)',
    ];
    const csvLines = [
      headers.join(','),
      ...sortedRows.map((r, idx) =>
        [
          idx + 1,
          r.position,
          `"${r.team.replace(/"/g, '""')}"`,
          r.played,
          r.points,
          r.ppg.toFixed(2),
          r.xPts.toFixed(1),
          r.justiceDelta > 0 ? `+${r.justiceDelta.toFixed(1)}` : r.justiceDelta.toFixed(1),
          r.gf,
          r.ga,
          r.gd > 0 ? `+${r.gd}` : r.gd,
          r.xgf.toFixed(1),
          r.xga.toFixed(1),
          r.xgDiff > 0 ? `+${r.xgDiff.toFixed(1)}` : r.xgDiff.toFixed(1),
          r.goalVariance > 0 ? `+${r.goalVariance.toFixed(1)}` : r.goalVariance.toFixed(1),
          r.attackVariance > 0 ? `+${r.attackVariance.toFixed(1)}` : r.attackVariance.toFixed(1),
          r.defenseVariance > 0 ? `+${r.defenseVariance.toFixed(1)}` : r.defenseVariance.toFixed(1),
        ].join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${leagueName.toLowerCase().replace(/\s+/g, '-')}-league-table-stats-${sortField}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leagueName} advanced stats sorted by ${sortField}`);
  };

  const activeMetricConfig = SORT_METRICS.find((m) => m.id === sortField);

  const renderSortIcon = (field: AdvancedSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 shrink-0" aria-hidden="true" />;
    }
    return sortAsc ? (
      <ArrowUp className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
    );
  };

  return (
    <Card
      id="league-table-stats-component"
      data-testid="league-table-stats"
      className="border-border bg-card overflow-hidden"
    >
      <CardHeader className="py-4 px-4 sm:px-6 border-b border-border bg-muted/15">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">League Table Stats</span>
              <span aria-hidden="true">·</span>
              <span>
                {leagueFlag} {leagueName}
              </span>
              <span aria-hidden="true">·</span>
              <span>{season}</span>
            </div>
            <CardTitle className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">
              Advanced Metric Sorting — xPTS, xG-Diff &amp; Goal Variance Explorer
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {activeMetricConfig
                ? `${activeMetricConfig.label}: ${activeMetricConfig.description}`
                : 'Sort clubs by underlying expected metrics to spot positive and negative variance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Primary Analytical Toggle Button Set: Expected Points (xPTS) vs Expected Goals Difference (xG-Diff) */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg bg-background border border-border/80"
              role="group"
              aria-label="Toggle sorting between Expected Points and Expected Goals Difference"
            >
              <button
                type="button"
                onClick={() => handleSelectSort('xPts')}
                data-testid="toggle-sort-xpts"
                aria-pressed={sortField === 'xPts'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  sortField === 'xPts'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Expected Points (xPTS)</span>
                {sortField === 'xPts' &&
                  (sortAsc ? (
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  ))}
              </button>
              <button
                type="button"
                onClick={() => handleSelectSort('xgDiff')}
                data-testid="toggle-sort-xg-diff"
                aria-pressed={sortField === 'xgDiff'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  sortField === 'xgDiff'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Expected Goals Difference (xG-Diff)</span>
                {sortField === 'xgDiff' &&
                  (sortAsc ? (
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  ))}
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs gap-1.5"
              title="Reset sorting and filters"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* 4 Key Statistical Benchmarks for Current League */}
        {insights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleDropdownSort('xPts')}
              className={`text-left rounded-lg border p-3.5 space-y-1 transition-colors cursor-pointer ${
                sortField === 'xPts'
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 bg-background/60 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Expected Points (xPTS) Leader</span>
                <Target className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className="font-bold text-sm text-foreground truncate">
                  {insights.xptsLeader.team}
                </span>
                <span className="font-mono tabular-nums text-sm font-black text-primary">
                  {insights.xptsLeader.xPts.toFixed(1)} xPTS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                Official: {insights.xptsLeader.points} Pts (#{insights.xptsLeader.position}) · xGD{' '}
                {insights.xptsLeader.xgDiff > 0
                  ? `+${insights.xptsLeader.xgDiff.toFixed(1)}`
                  : insights.xptsLeader.xgDiff.toFixed(1)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleDropdownSort('xgDiff')}
              className={`text-left rounded-lg border p-3.5 space-y-1 transition-colors cursor-pointer ${
                sortField === 'xgDiff'
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-border/80 bg-background/60 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Expected Goals Diff (xG-Diff) Leader</span>
                <Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className="font-bold text-sm text-foreground truncate">
                  {insights.xgDiffLeader.team}
                </span>
                <span className="font-mono tabular-nums text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {insights.xgDiffLeader.xgDiff > 0
                    ? `+${insights.xgDiffLeader.xgDiff.toFixed(1)}`
                    : insights.xgDiffLeader.xgDiff.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {insights.xgDiffLeader.xgf.toFixed(1)} xGF vs {insights.xgDiffLeader.xga.toFixed(1)}{' '}
                xGA ({insights.xgDiffLeader.played} matches)
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setInternalSortField('goalVariance');
                setInternalSortAsc(true);
                onSortChange?.('goalVariance', true);
              }}
              className="text-left rounded-lg border border-border/80 bg-background/60 hover:bg-muted/30 p-3.5 space-y-1 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Top Positive Regression</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className="font-bold text-sm text-foreground truncate">
                  {insights.regressionBuy.team}
                </span>
                <span className="font-mono tabular-nums text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {insights.regressionBuy.goalVariance > 0
                    ? `+${insights.regressionBuy.goalVariance.toFixed(1)}`
                    : insights.regressionBuy.goalVariance.toFixed(1)}{' '}
                  Var
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Underperforming xG by {Math.abs(insights.regressionBuy.goalVariance).toFixed(1)}{' '}
                goals · Due upward correction
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setInternalSortField('goalVariance');
                setInternalSortAsc(false);
                onSortChange?.('goalVariance', false);
              }}
              className="text-left rounded-lg border border-border/80 bg-background/60 hover:bg-muted/30 p-3.5 space-y-1 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Highest Clinical Surplus</span>
                <TrendingDown className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className="font-bold text-sm text-foreground truncate">
                  {insights.clinicalFinisher.team}
                </span>
                <span className="font-mono tabular-nums text-sm font-black text-amber-600 dark:text-amber-400">
                  {insights.clinicalFinisher.goalVariance > 0
                    ? `+${insights.clinicalFinisher.goalVariance.toFixed(1)}`
                    : insights.clinicalFinisher.goalVariance.toFixed(1)}{' '}
                  Var
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Scoring/saving above expected model baseline
              </p>
            </button>
          </div>
        )}

        {/* Primary Metric Sort Bar (Dropdown + Button Set) + Filter Controls */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Metric Dropdown Selector + Sort Direction Button */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="league-stats-sort-dropdown"
                className="text-xs font-semibold text-muted-foreground whitespace-nowrap"
              >
                Sort By Metric:
              </label>
              <select
                id="league-stats-sort-dropdown"
                name="league-stats-sort-dropdown"
                data-testid="league-stats-sort-select"
                aria-label="Sort teams by analytical metric"
                value={sortField}
                onChange={(e) => handleDropdownSort(e.target.value as AdvancedSortField)}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {SORT_METRICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleToggleDirection}
                data-testid="toggle-sort-direction"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-muted/50 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                title="Toggle ascending or descending order"
              >
                {sortAsc ? (
                  <>
                    <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Ascending (Low → High)</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Descending (High → Low)</span>
                  </>
                )}
              </button>
            </div>

            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              Showing {sortedRows.length} of {normalizedRows.length} clubs · Active Sort:{' '}
              <strong className="text-foreground">{activeMetricConfig?.label || sortField}</strong>{' '}
              ({sortAsc ? 'Asc ↑' : 'Desc ↓'})
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-muted/40 border border-border/60"
            role="group"
            aria-label="Sort teams by advanced metric"
          >
            {SORT_METRICS.map((metric) => {
              const isActive = sortField === metric.id;
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => handleSelectSort(metric.id)}
                  data-testid={`sort-metric-${metric.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                  }`}
                >
                  <span>{metric.shortLabel}</span>
                  {isActive &&
                    (sortAsc ? (
                      <ArrowUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="h-3 w-3" aria-hidden="true" />
                    ))}
                </button>
              );
            })}
          </div>

          {/* Secondary Filter Bar: Regression Profile & Club Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/60"
              role="group"
              aria-label="Filter clubs by variance profile"
            >
              {(
                [
                  { id: 'all', label: 'All Clubs' },
                  { id: 'positive_regression', label: 'Due Positive Regression' },
                  { id: 'overperforming', label: 'Clinical Overperformers' },
                  { id: 'elite_xg_diff', label: 'Elite xG-Diff (+2.0+)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  data-testid={`variance-filter-${tab.id}`}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    filterMode === tab.id
                      ? 'bg-background text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search
                className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="league-table-stats-club-search"
                name="league-table-stats-club-search"
                type="search"
                value={clubQuery}
                onChange={(e) => setClubQuery(e.target.value)}
                placeholder="Filter club in stats table..."
                aria-label="Filter club in league table stats"
                className="h-8 pl-8 pr-3 text-xs bg-background"
              />
            </div>
          </div>
        </div>

        {/* Interactive 2-Club xPTS & xG-Diff H2H Comparison Tray */}
        {compareClubs.length > 0 && (
          <div
            data-testid="h2h-comparison-tray"
            className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-primary inline-flex items-center gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>xPTS &amp; xG-Diff H2H Compare ({compareClubs.length}/2):</span>
              </span>
              {compareClubs.map((clubName) => {
                const clubRow = normalizedRows.find((r) => r.team === clubName);
                if (!clubRow) return null;
                return (
                  <div
                    key={clubName}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-background border border-border text-xs font-mono tabular-nums"
                  >
                    <span className="font-sans font-bold text-foreground">{clubRow.team}</span>
                    <span className="text-primary font-bold">{clubRow.xPts.toFixed(1)} xPTS</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {clubRow.xgDiff > 0 ? `+${clubRow.xgDiff.toFixed(1)}` : clubRow.xgDiff.toFixed(1)} xGD
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleCompareClub(clubName)}
                      className="text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
                      aria-label={`Remove ${clubName} from comparison`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {compareClubs.length === 1 && (
                <span className="text-xs text-muted-foreground">
                  Select 1 more club in the table below to compare head-to-head
                </span>
              )}
            </div>

            {compareClubs.length === 2 && (
              <div className="flex items-center gap-2">
                <a
                  href={`/h2h?team1=${encodeURIComponent(compareClubs[0])}&team2=${encodeURIComponent(compareClubs[1])}`}
                  data-testid="launch-h2h-simulator-link"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Open H2H Simulator ({compareClubs[0]} vs {compareClubs[1]})</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Interactive Sortable Advanced Metrics Table */}
        <div
          className="overflow-x-auto rounded-lg border border-border"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 680px' }}
        >
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground select-none">
                <th className="text-left py-2.5 px-3 w-12">Rank</th>
                <th className="text-left py-2.5 px-3">Club</th>
                <th className="text-right py-2.5 px-2 hidden sm:table-cell">P</th>
                <th className="text-right py-2.5 px-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('points')}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground cursor-pointer ml-auto"
                  >
                    <span>Pts</span>
                    {renderSortIcon('points')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2 hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('ppg')}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground cursor-pointer ml-auto"
                  >
                    <span>PPG</span>
                    {renderSortIcon('ppg')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('xPts')}
                    className="inline-flex items-center justify-end gap-1 text-primary font-bold hover:opacity-80 cursor-pointer ml-auto"
                  >
                    <span>xPTS</span>
                    {renderSortIcon('xPts')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('justiceDelta')}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground cursor-pointer ml-auto"
                    title="Official Points minus Expected Points (Pts - xPTS)"
                  >
                    <span>Pts−xPTS</span>
                    {renderSortIcon('justiceDelta')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2 hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('xgf')}
                    className="inline-flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80 cursor-pointer ml-auto"
                  >
                    <span>xGF</span>
                    {renderSortIcon('xgf')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2 hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('xga')}
                    className="inline-flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400 hover:opacity-80 cursor-pointer ml-auto"
                  >
                    <span>xGA</span>
                    {renderSortIcon('xga')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('xgDiff')}
                    className="inline-flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary cursor-pointer ml-auto"
                  >
                    <span>xG-Diff</span>
                    {renderSortIcon('xgDiff')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-2 hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('gd')}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground cursor-pointer ml-auto"
                  >
                    <span>Actual GD</span>
                    {renderSortIcon('gd')}
                  </button>
                </th>
                <th className="text-right py-2.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSelectSort('goalVariance')}
                    className="inline-flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary cursor-pointer ml-auto"
                    title="Goal Variance = Actual Goal Difference minus Expected Goal Difference (GD - xGD)"
                  >
                    <span>Goal Variance</span>
                    {renderSortIcon('goalVariance')}
                  </button>
                </th>
                <th className="text-left py-2.5 px-3 hidden xl:table-cell">Regression Signal</th>
                <th className="text-right py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums divide-y divide-border/60">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-xs text-muted-foreground font-sans">
                    No clubs match the current filter criteria.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, idx) => {
                  const rankDiff = row.position - (idx + 1);
                  const xgBarPct = insights
                    ? Math.min(100, Math.round((Math.abs(row.xgDiff) / insights.maxAbsXgDiff) * 100))
                    : 50;
                  const varBarPct = insights
                    ? Math.min(
                        100,
                        Math.round((Math.abs(row.goalVariance) / insights.maxAbsGoalVariance) * 100)
                      )
                    : 50;

                  const regressionSignal =
                    row.goalVariance <= -2.0 || row.justiceDelta <= -2.0
                      ? { label: 'Strong Positive Regression', tone: 'text-emerald-600 dark:text-emerald-400' }
                      : row.goalVariance < -0.6
                      ? { label: 'Slight Underperformance', tone: 'text-emerald-600/80 dark:text-emerald-400/80' }
                      : row.goalVariance >= 2.0 || row.justiceDelta >= 2.0
                      ? { label: 'High Clinical Surplus', tone: 'text-amber-600 dark:text-amber-400' }
                      : row.goalVariance > 0.6
                      ? { label: 'Above Expected Output', tone: 'text-amber-600/80 dark:text-amber-400/80' }
                      : { label: 'Performing to xG Model', tone: 'text-muted-foreground' };

                  return (
                    <tr
                      key={`${row.team}-${idx}`}
                      className="hover:bg-muted/25 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex w-6 h-6 rounded-md bg-muted text-foreground text-xs font-bold items-center justify-center">
                            {idx + 1}
                          </span>
                          {sortField !== 'position' && sortField !== 'points' && rankDiff !== 0 && (
                            <span
                              className={`text-[10px] font-bold ${
                                rankDiff > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500'
                              }`}
                              title={`Official League Position: #${row.position}`}
                            >
                              {rankDiff > 0 ? `+${rankDiff}` : rankDiff}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={row.team} logoUrl={row.logo} size="xs" />
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block max-w-[140px] sm:max-w-none">
                              {row.team}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Official #{row.position} · {row.gf}GF / {row.ga}GA
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="text-right py-2.5 px-2 hidden sm:table-cell text-muted-foreground">
                        {row.played}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 font-bold ${
                          sortField === 'points' ? 'bg-primary/5 text-primary' : 'text-foreground'
                        }`}
                      >
                        {row.points}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 hidden md:table-cell ${
                          sortField === 'ppg'
                            ? 'bg-primary/5 font-bold text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {row.ppg.toFixed(2)}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 ${
                          sortField === 'xPts'
                            ? 'bg-primary/10 text-primary'
                            : 'text-primary'
                        }`}
                      >
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-black">{row.xPts.toFixed(1)}</span>
                          <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">
                            xPTS #{row.xptsRank}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 font-semibold ${
                          sortField === 'justiceDelta' ? 'bg-primary/5 ' : ''
                        }${
                          row.justiceDelta < -1.0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.justiceDelta > 1.0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {row.justiceDelta > 0
                          ? `+${row.justiceDelta.toFixed(1)}`
                          : row.justiceDelta.toFixed(1)}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 hidden lg:table-cell text-emerald-600 dark:text-emerald-400 ${
                          sortField === 'xgf' ? 'bg-emerald-500/10 font-bold' : ''
                        }`}
                      >
                        {row.xgf.toFixed(1)}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 hidden lg:table-cell text-rose-600 dark:text-rose-400 ${
                          sortField === 'xga' ? 'bg-rose-500/10 font-bold' : ''
                        }`}
                      >
                        {row.xga.toFixed(1)}
                      </td>

                      <td
                        className={`text-right py-2.5 px-2 ${
                          sortField === 'xgDiff' ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`font-bold ${
                              row.xgDiff > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : row.xgDiff < 0
                                ? 'text-rose-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {row.xgDiff > 0 ? `+${row.xgDiff.toFixed(1)}` : row.xgDiff.toFixed(1)}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">
                            #{row.xgDiffRank} · {row.xgDiffPer90 > 0 ? `+${row.xgDiffPer90.toFixed(2)}` : row.xgDiffPer90.toFixed(2)}/90
                          </span>
                          <div className="w-14 h-1 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                row.xgDiff >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${xgBarPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="text-right py-2.5 px-2 hidden md:table-cell text-muted-foreground">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>

                      <td
                        className={`text-right py-2.5 px-3 ${
                          sortField === 'goalVariance' ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`font-bold ${
                              row.goalVariance < -1.0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : row.goalVariance > 1.0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-foreground'
                            }`}
                            title={`Finishing Var: ${
                              row.attackVariance > 0
                                ? `+${row.attackVariance.toFixed(1)}`
                                : row.attackVariance.toFixed(1)
                            } · GK Prevention: ${
                              row.defenseVariance > 0
                                ? `+${row.defenseVariance.toFixed(1)}`
                                : row.defenseVariance.toFixed(1)
                            }`}
                          >
                            {row.goalVariance > 0
                              ? `+${row.goalVariance.toFixed(1)}`
                              : row.goalVariance.toFixed(1)}
                          </span>
                          <div className="w-14 h-1 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                row.goalVariance < 0 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${varBarPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 hidden xl:table-cell font-sans text-xs">
                        <span className={`font-medium ${regressionSignal.tone}`}>
                          {regressionSignal.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCompareClub(row.team)}
                            data-testid={`compare-club-${idx}`}
                            aria-pressed={compareClubs.includes(row.team)}
                            className={`h-7 px-2 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                              compareClubs.includes(row.team)
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title={`Compare ${row.team} in H2H Simulator`}
                          >
                            H2H
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddClubValuePlay(row)}
                            data-testid={`add-value-slip-${idx}`}
                            className="inline-flex items-center gap-0.5 h-7 px-2 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition-colors cursor-pointer"
                            title={`Add ${row.team} next fixture xPTS value selection to Bet Slip`}
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                            <span>Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Explanatory Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              <strong className="text-foreground">xPTS:</strong> Expected Points from Bivariate Poisson simulation
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-foreground">xG-Diff:</strong> Expected Goals For minus Expected Goals Against (xGF − xGA)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-foreground">Goal Variance:</strong> Actual GD minus Expected GD (GD − xGD)
            </span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Negative Goal Variance = Club is creating high-quality chances and due for positive goal regression
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
