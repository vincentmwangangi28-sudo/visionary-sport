import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { TeamLogo } from '@/components/TeamLogo';
import { Pin, ArrowRight, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo, memo, Suspense } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePinnedFavorites } from '@/hooks/usePinnedFavorites';
import { useBetSlip } from '@/hooks/useBetSlip';
import { hapticService } from '@/services/hapticService';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { toast } from 'sonner';

const MatchAnalyticsModal = lazyWithRetry(() =>
  import('./MatchAnalyticsModal').then((m) => ({ default: m.MatchAnalyticsModal }))
);
const SharePrediction = lazyWithRetry(() =>
  import('@/components/SharePrediction').then((m) => ({ default: m.SharePrediction }))
);
const NotifyMeButton = lazyWithRetry(() =>
  import('@/components/NotifyMeButton').then((m) => ({ default: m.NotifyMeButton }))
);

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
});

function formatMatchSlug(homeTeam: string, awayTeam: string, _matchDate?: string): string {
  const clean = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${clean(homeTeam)}-vs-${clean(awayTeam)}`;
}

interface Props {
  prediction: Prediction;
  viewMode?: 'card' | 'compact' | 'condensed';
}

export const PredictionCard = memo(({ prediction: p, viewMode = 'compact' }: Props) => {
  const { formatKickoff, getKickoffRelative, formatOdds, isProbabilitiesMode, t } = useUserPreferences();
  const { isLeaguePinned, togglePinLeague } = usePinnedFavorites();
  const { selections, addSelection } = useBetSlip();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const relativeKickoff = getKickoffRelative(p.match_date);
  const matchSlug = formatMatchSlug(p.home_team, p.away_team, p.match_date);
  const matchUrl = `/predict/${matchSlug}`;
  const matchTitle = `${p.home_team} vs ${p.away_team}`;

  const isMarketInSlip = (marketLabel: string) =>
    selections.some((s) => s.match === matchTitle && s.market === marketLabel);

  const handleAddMarketToSlip = (
    e: React.MouseEvent,
    marketLabel: string,
    oddsVal: number | null | undefined
  ) => {
    e.stopPropagation();
    hapticService.selection();
    const resolvedOdds = oddsVal && oddsVal > 1 ? oddsVal : marketLabel === 'Draw' ? 3.30 : 1.90;
    addSelection({
      matchId: p.id,
      match: matchTitle,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      market: marketLabel,
      odds: resolvedOdds,
      confidence,
    });
    toast.success(`Added ${p.home_team} vs ${p.away_team} (${marketLabel} @${resolvedOdds.toFixed(2)}) to Bet Slip`);
  };

  const winProbabilities = useMemo(() => {
    const raw = p as Record<string, any>;
    const meta = (raw.metadata as Record<string, any>) || {};
    const explicitHome = p.home_win_probability ?? raw.home_probability ?? meta.home_win_probability;
    const explicitDraw = p.draw_probability ?? meta.draw_probability;
    const explicitAway = p.away_win_probability ?? raw.away_probability ?? meta.away_win_probability;

    if (explicitHome != null && explicitDraw != null && explicitAway != null) {
      return {
        home: Math.round(Number(explicitHome)),
        draw: Math.round(Number(explicitDraw)),
        away: Math.round(Number(explicitAway)),
      };
    }

    const h = p.home_odds && p.home_odds > 1 ? 1 / p.home_odds : 0;
    const d = p.draw_odds && p.draw_odds > 1 ? 1 / p.draw_odds : 0;
    const a = p.away_odds && p.away_odds > 1 ? 1 / p.away_odds : 0;
    const total = h + d + a;
    if (total > 0) {
      const home = Math.round((h / total) * 100);
      const draw = Math.round((d / total) * 100);
      const away = Math.max(0, 100 - home - draw);
      return { home, draw, away };
    }

    const isHome = outcome.includes('Home');
    const isAway = outcome.includes('Away');
    if (isHome) return { home: Math.max(52, confidence), draw: 25, away: Math.max(10, 100 - Math.max(52, confidence) - 25) };
    if (isAway) return { home: 20, draw: 25, away: Math.max(52, confidence) };
    return { home: 34, draw: Math.max(34, confidence), away: 32 };
  }, [p, outcome, confidence]);

  const teamStats = useMemo(() => {
    const totalExpectedGoals = p.over_under_line ? Number(p.over_under_line) + 0.15 : 2.65;
    const homeShare = winProbabilities.home / Math.max(1, winProbabilities.home + winProbabilities.away);
    const homeXg = Number(Math.max(0.55, totalExpectedGoals * homeShare).toFixed(2));
    const awayXg = Number(Math.max(0.45, totalExpectedGoals * (1 - homeShare)).toFixed(2));
    return { homeXg, awayXg };
  }, [p.over_under_line, winProbabilities.home, winProbabilities.away]);

  const displayOutcome =
    outcome === 'Home Win' ? t('pred.home_win', 'Home Win') :
    outcome === 'Draw' ? t('pred.draw', 'Draw') :
    outcome === 'Away Win' ? t('pred.away_win', 'Away Win') :
    outcome;

  const formattedTime = formatKickoff(p.match_date, { includeTimezone: false }).slice(-5);
  const formattedShortDate = useMemo(() => {
    try {
      const d = new Date(p.match_date);
      if (isNaN(d.getTime())) return 'Upcoming';
      return SHORT_DATE_FORMATTER.format(d);
    } catch {
      return 'Upcoming';
    }
  }, [p.match_date]);

  // 1. Condensed Single-Line Row
  if (viewMode === 'condensed') {
    return (
      <>
        <div
          onClick={() => {
            hapticService.selection();
            setShowAnalytics(true);
          }}
          className="py-2.5 px-4 bg-card hover:bg-muted/40 transition-colors cursor-pointer grid grid-cols-[52px_1fr_auto] sm:grid-cols-[64px_1fr_130px_168px] items-center gap-3 text-xs"
        >
          <span className="font-mono tabular-nums text-muted-foreground">
            {formattedTime}
          </span>

          <div className="flex items-center gap-2 min-w-0 truncate">
            <TeamLogo team={p.home_team} size="xs" badgeOnly />
            <span className="font-medium truncate text-foreground">{p.home_team}</span>
            <span className="text-muted-foreground">vs</span>
            <TeamLogo team={p.away_team} size="xs" badgeOnly />
            <span className="font-medium truncate text-foreground">{p.away_team}</span>
          </div>

          <div className="hidden sm:flex items-center justify-end gap-2 text-xs">
            <span className="font-medium text-foreground truncate">{displayOutcome}</span>
            <span className="font-mono tabular-nums font-bold text-primary">{confidence}%</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-[156px] sm:w-[168px] font-mono tabular-nums">
            {[
              { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds ?? 1.95 },
              { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds ?? 3.30 },
              { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds ?? 2.85 },
            ].map(({ label, key, prob, odds }) => {
              const favored = outcome === label;
              const inSlip = isMarketInSlip(label);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={(e) => handleAddMarketToSlip(e, label, odds)}
                  className={`py-1 rounded text-center text-[11px] border transition-colors cursor-pointer ${
                    inSlip
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                      : favored
                      ? 'bg-primary/10 text-primary border-primary/30 font-bold hover:bg-primary/20'
                      : 'bg-muted/40 border-border text-foreground font-medium hover:bg-muted'
                  }`}
                  title={`Click to add ${label} to Bet Slip`}
                >
                  {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
                </button>
              );
            })}
          </div>
        </div>

        {showAnalytics && (
          <Suspense fallback={null}>
            <MatchAnalyticsModal prediction={p} open={showAnalytics} onClose={() => setShowAnalytics(false)} />
          </Suspense>
        )}
      </>
    );
  }

  // 2. Default Aligned Tabular Match Row with 1-Click Add to Bet Slip
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => {
            hapticService.selection();
            setShowAnalytics(true);
          }}
          className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer grid grid-cols-1 sm:grid-cols-[64px_1fr_130px_168px] items-center gap-3"
        >
          {/* Column 1: Kickoff Time & Date */}
          <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 sm:gap-0.5 font-mono tabular-nums sm:border-r sm:border-border/60 sm:pr-3">
            {relativeKickoff.status === 'live' ? (
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 animate-pulse">
                LIVE
              </span>
            ) : (
              <>
                <span className="text-xs font-semibold text-foreground">{formattedTime}</span>
                <span className="text-[11px] text-muted-foreground">{formattedShortDate}</span>
              </>
            )}
            <span className="sm:hidden text-xs font-semibold text-primary">
              {displayOutcome} · {confidence}%
            </span>
          </div>

          {/* Column 2: Clubs & Expected Goals (xG) */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={matchUrl}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2.5 min-w-0 group/team"
              >
                <TeamLogo team={p.home_team} size="xs" />
                <span className="text-sm font-medium text-foreground truncate group-hover/team:text-primary transition-colors">
                  {p.home_team}
                </span>
              </Link>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.homeXg} xG
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Link
                to={matchUrl}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2.5 min-w-0 group/team"
              >
                <TeamLogo team={p.away_team} size="xs" />
                <span className="text-sm font-medium text-foreground truncate group-hover/team:text-primary transition-colors">
                  {p.away_team}
                </span>
              </Link>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.awayXg} xG
              </span>
            </div>
          </div>

          {/* Column 3: AI Pick & Confidence */}
          <div className="hidden sm:flex flex-col items-end justify-center text-right pr-2">
            <span className="text-xs font-semibold text-foreground truncate max-w-[125px]">
              {displayOutcome}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-primary font-semibold mt-0.5">
              {confidence}% conf.
            </span>
          </div>

          {/* Column 4: Interactive 1 · X · 2 Odds Buttons (Click to Add to Bet Slip) */}
          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-[168px] font-mono tabular-nums">
            {[
              { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds ?? 1.95 },
              { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds ?? 3.30 },
              { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds ?? 2.85 },
            ].map(({ label, key, prob, odds }) => {
              const isFavored = outcome === label;
              const inSlip = isMarketInSlip(label);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={(e) => handleAddMarketToSlip(e, label, odds)}
                  className={`h-9 rounded-md text-xs border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    inSlip
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-sm'
                      : isFavored
                      ? 'bg-primary/10 hover:bg-primary/20 border-primary/35 text-primary font-bold'
                      : 'bg-muted/40 hover:bg-muted border-border text-foreground font-medium'
                  }`}
                  title={`Add ${label} (@${Number(odds).toFixed(2)}) to Bet Slip`}
                >
                  <span className={`text-[9px] leading-none ${inSlip ? 'text-white' : 'text-muted-foreground'}`}>
                    {key}
                  </span>
                  <span className="text-[11px] leading-tight mt-0.5">
                    {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {showAnalytics && (
          <Suspense fallback={null}>
            <MatchAnalyticsModal prediction={p} open={showAnalytics} onClose={() => setShowAnalytics(false)} />
          </Suspense>
        )}
      </>
    );
  }

  // 3. Detailed Card View
  const recommendedOdds =
    outcome === 'Away Win' ? p.away_odds ?? 2.65 : outcome === 'Draw' ? p.draw_odds ?? 3.30 : p.home_odds ?? 1.85;
  const recommendedInSlip = isMarketInSlip(outcome);

  return (
    <>
      <Card
        onClick={() => {
          hapticService.selection();
          setShowAnalytics(true);
        }}
        className="group overflow-hidden cursor-pointer transition-colors hover:border-primary/40 border border-border bg-card flex flex-col justify-between shadow-sm"
      >
        <CardHeader className="pb-3 pt-4 px-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="font-semibold text-foreground truncate">{p.league}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[11px] shrink-0">
                {formattedShortDate}, {formattedTime}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  hapticService.selection();
                  togglePinLeague(p.league);
                }}
                className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center"
                aria-label={isLeaguePinned(p.league) ? `Unpin ${p.league} from My Dashboard` : `Pin ${p.league} to My Dashboard`}
              >
                <Pin className={`h-3.5 w-3.5 ${isLeaguePinned(p.league) ? 'fill-primary text-primary' : ''}`} />
              </button>
              <Suspense fallback={null}>
                <NotifyMeButton
                  match={{
                    id: p.id,
                    home_team: p.home_team,
                    away_team: p.away_team,
                    league: p.league,
                    match_date: p.match_date,
                    prediction: outcome,
                    confidence,
                    home_odds: p.home_odds,
                    draw_odds: p.draw_odds,
                    away_odds: p.away_odds,
                  }}
                  variant="icon"
                />
              </Suspense>
            </div>
          </div>

          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <TeamLogo team={p.home_team} size="sm" />
                <span className="font-semibold text-sm text-foreground truncate">{p.home_team}</span>
              </div>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.homeXg} xG
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <TeamLogo team={p.away_team} size="sm" />
                <span className="font-semibold text-sm text-foreground truncate">{p.away_team}</span>
              </div>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.awayXg} xG
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          <div className="pt-2.5 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              AI Pick: <strong className="text-foreground font-semibold">{displayOutcome}</strong>
            </span>
            <span className="font-mono tabular-nums font-semibold text-primary">
              {confidence}% conf.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
            {[
              { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds ?? 1.95 },
              { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds ?? 3.30 },
              { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds ?? 2.85 },
            ].map(({ label, key, prob, odds }) => {
              const favored = outcome === label;
              const inSlip = isMarketInSlip(label);
              return (
                <button
                  type="button"
                  key={label}
                  onClick={(e) => handleAddMarketToSlip(e, label, odds)}
                  className={`min-h-[36px] py-1 px-2.5 rounded-md border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    inSlip
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                      : favored
                      ? 'bg-primary/10 border-primary/35 text-primary font-bold hover:bg-primary/20'
                      : 'bg-muted/40 hover:bg-muted border-border text-foreground'
                  }`}
                  title={`Add ${label} to Bet Slip`}
                >
                  <span className={inSlip ? 'text-white' : 'text-muted-foreground'}>{key}</span>
                  <span className="font-semibold">
                    {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
                  </span>
                </button>
              );
            })}
          </div>

          {analysis && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {analysis}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/70 text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={(e) => handleAddMarketToSlip(e, outcome, recommendedOdds)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  recommendedInSlip
                    ? 'bg-emerald-700 text-white'
                    : 'bg-primary/10 hover:bg-primary/20 text-primary'
                }`}
              >
                {recommendedInSlip ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                <span>{recommendedInSlip ? 'In Slip' : '+ Bet Slip'}</span>
              </button>
              <Link
                to={matchUrl}
                className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Preview</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <Suspense fallback={null}>
              <SharePrediction
                prediction={{
                  ...p,
                  predicted_outcome: outcome,
                  confidence_score: confidence,
                  status: p.status ?? 'pending',
                  is_premium: p.is_premium,
                  created_at: p.created_at,
                }}
              />
            </Suspense>
          </div>
        </CardContent>
      </Card>

      {showAnalytics && (
        <Suspense fallback={null}>
          <MatchAnalyticsModal prediction={p} open={showAnalytics} onClose={() => setShowAnalytics(false)} />
        </Suspense>
      )}
    </>
  );
});

PredictionCard.displayName = 'PredictionCard';
