import React, { Suspense, useMemo, useState } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { TeamLogo } from '@/components/TeamLogo';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { hapticService } from '@/services/hapticService';

const MatchAnalyticsModal = lazyWithRetry(() =>
  import('@/components/MatchAnalyticsModal').then((m) => ({ default: m.MatchAnalyticsModal }))
);
import {
  selectDailyTop5BestBets,
  type BestBetMarketScope,
  type DailyBestBetItem,
} from '@/services/topSiteIntelEngine';
import type { Prediction } from '@/types/prediction';
import { toast } from 'sonner';
import { Check, Plus, Eye, Layers, RotateCcw } from 'lucide-react';

export const DailyTopFiveBestBets: React.FC = () => {
  const { data, isLoading } = usePredictions(1);
  const { addSelection, isInSlip, setIsOpen } = useBetSlip();
  const { formatOdds, formatKickoff } = useUserPreferences();

  const [marketScope, setMarketScope] = useState<BestBetMarketScope>('all');
  const [minConfidence, setMinConfidence] = useState<number>(65);
  const [inspectedMatch, setInspectedMatch] = useState<Prediction | null>(null);

  const sourcePool = useMemo(
    () => data?.allPredictions ?? data?.predictions ?? [],
    [data?.allPredictions, data?.predictions]
  );

  const topFiveBets = useMemo(
    () =>
      selectDailyTop5BestBets(sourcePool, {
        marketScope,
        minConfidence,
      }),
    [sourcePool, marketScope, minConfidence]
  );

  const handleAddSinglePick = (item: DailyBestBetItem) => {
    hapticService.selection();
    addSelection({
      matchId: item.prediction.id,
      match: `${item.homeTeam} vs ${item.awayTeam}`,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      league: item.league,
      matchDate: item.matchDate,
      market: item.recommendedMarket,
      odds: item.marketOdds,
      confidence: item.poissonConfidence,
    });
    toast.success(
      `Added ${item.homeTeam} vs ${item.awayTeam} (${item.recommendedMarket} @${item.marketOdds.toFixed(2)})`
    );
  };

  const handleLoadAllFive = () => {
    if (topFiveBets.length === 0) return;
    hapticService.success();
    topFiveBets.forEach((item) => {
      addSelection({
        matchId: item.prediction.id,
        match: `${item.homeTeam} vs ${item.awayTeam}`,
        homeTeam: item.homeTeam,
        awayTeam: item.awayTeam,
        league: item.league,
        matchDate: item.matchDate,
        market: item.recommendedMarket,
        odds: item.marketOdds,
        confidence: item.poissonConfidence,
      });
    });
    setIsOpen(true);
    toast.success(`Loaded Daily Top ${topFiveBets.length} Best Bets into your Bet Slip`);
  };

  const combinedAccaOdds = useMemo(
    () => topFiveBets.reduce((acc, item) => acc * item.marketOdds, 1),
    [topFiveBets]
  );

  return (
    <section
      id="section-daily-top-5"
      aria-label="Daily Top 5 Best Bets"
      className="container mx-auto max-w-7xl px-4 sm:px-6 pt-5"
    >
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Header & Interactive Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Dixon-Coles Bivariate Poisson</span>
              <span aria-hidden="true">·</span>
              <span>6×6 Score Matrix</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Top 5 Ranked by Model Confidence</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Daily Top 5 Best Bets
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Market Scope Filter */}
            <div
              className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg"
              role="group"
              aria-label="Filter Daily Top 5 market scope"
            >
              {(
                [
                  { id: 'all', label: 'All Markets' },
                  { id: '1x2', label: '1X2 Result' },
                  { id: 'goals', label: 'Goals & BTTS' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setMarketScope(tab.id);
                  }}
                  aria-pressed={marketScope === tab.id}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    marketScope === tab.id
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Minimum Confidence Threshold */}
            <div
              className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg"
              role="group"
              aria-label="Minimum Bivariate Poisson confidence"
            >
              {[65, 75, 80].map((floor) => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setMinConfidence(floor);
                  }}
                  aria-pressed={minConfidence === floor}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    minConfidence === floor
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {floor}%+
                </button>
              ))}
            </div>

            {topFiveBets.length > 0 && (
              <button
                type="button"
                onClick={handleLoadAllFive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Load Top {topFiveBets.length} ({combinedAccaOdds.toFixed(2)}x)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && topFiveBets.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                className="h-[196px] rounded-lg border border-border bg-muted/30 animate-pulse p-3"
              />
            ))}
          </div>
        ) : topFiveBets.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-2 rounded-lg border border-border bg-muted/20">
            <p className="text-sm font-semibold text-foreground">
              No active fixtures meet the {minConfidence}%+ Bivariate Poisson confidence threshold.
            </p>
            <p className="text-xs text-muted-foreground">
              Lower the confidence threshold or switch back to All Markets to inspect today&apos;s top ranked picks.
            </p>
            <button
              type="button"
              onClick={() => {
                setMarketScope('all');
                setMinConfidence(65);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topFiveBets.map((item) => {
              const matchTitle = `${item.homeTeam} vs ${item.awayTeam}`;
              const alreadyAdded = isInSlip(matchTitle, item.recommendedMarket);

              return (
                <article
                  key={item.prediction.id || `${item.rank}-${item.homeTeam}`}
                  className="rounded-lg border border-border bg-background p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    {/* Rank · Competition · Kickoff (Unboxed Metadata) */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate">
                        <strong className="font-mono text-foreground">#{String(item.rank).padStart(2, '0')}</strong>
                        <span aria-hidden="true"> · </span>
                        <span>{item.league}</span>
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatKickoff(item.matchDate, { includeWeekday: false, includeDate: false, includeTimezone: false })}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <TeamLogo team={item.homeTeam} logoUrl={item.prediction.home_logo} league={item.league} size="xs" />
                        <span className="truncate">{item.homeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <TeamLogo team={item.awayTeam} logoUrl={item.prediction.away_logo} league={item.league} size="xs" />
                        <span className="truncate">{item.awayTeam}</span>
                      </div>
                    </div>

                    {/* Selection & Odds */}
                    <div className="pt-2 border-t border-border flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-foreground truncate" title={item.recommendedMarket}>
                        {item.recommendedMarket}
                      </span>
                      <span className="font-mono tabular-nums text-sm font-bold text-primary shrink-0">
                        {formatOdds(item.marketOdds)}
                      </span>
                    </div>

                    {/* Bivariate Poisson Confidence Rating & xG Telemetry */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-muted-foreground">Poisson Conf.</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {item.poissonConfidence}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
                        <div
                          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                          style={{ width: `${item.poissonConfidence}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-muted-foreground">
                        <span>xG {item.homeXG.toFixed(2)}–{item.awayXG.toFixed(2)}</span>
                        <span>Score {item.topScoreline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddSinglePick(item)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-md border text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card hover:bg-muted border-border text-foreground'
                      }`}
                    >
                      {alreadyAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>In Slip</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Add Pick</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedMatch(item.prediction)}
                      aria-label={`Inspect Bivariate Poisson analytics for ${item.homeTeam} vs ${item.awayTeam}`}
                      className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {inspectedMatch && (
        <Suspense fallback={null}>
          <MatchAnalyticsModal
            prediction={inspectedMatch}
            open={Boolean(inspectedMatch)}
            onClose={() => setInspectedMatch(null)}
          />
        </Suspense>
      )}
    </section>
  );
};

export default DailyTopFiveBestBets;
