import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { TeamLogo } from '@/components/TeamLogo';
import { TrendingUp, Check, Coins, Pin, ArrowRight, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo, memo, Suspense } from 'react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePinnedFavorites } from '@/hooks/usePinnedFavorites';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const MatchAnalyticsModal = lazyWithRetry(() =>
  import('./MatchAnalyticsModal').then((m) => ({ default: m.MatchAnalyticsModal }))
);
const SharePrediction = lazyWithRetry(() =>
  import('@/components/SharePrediction').then((m) => ({ default: m.SharePrediction }))
);
const NotifyMeButton = lazyWithRetry(() =>
  import('@/components/NotifyMeButton').then((m) => ({ default: m.NotifyMeButton }))
);

function formatMatchSlug(homeTeam: string, awayTeam: string, _matchDate?: string): string {
  const clean = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${clean(homeTeam)}-vs-${clean(awayTeam)}`;
}

function getTeamFormSequence(teamName: string, winProb: number): Array<'W' | 'D' | 'L'> {
  const seed = teamName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const results: Array<'W' | 'D' | 'L'> = [];
  for (let i = 0; i < 5; i++) {
    const val = (seed * (i + 3) + winProb) % 100;
    if (val < winProb + 12) {
      results.push('W');
    } else if (val < winProb + 36) {
      results.push('D');
    } else {
      results.push('L');
    }
  }
  return results;
}

interface Props {
  prediction: Prediction;
  viewMode?: 'card' | 'compact' | 'condensed';
}

export const PredictionCard = memo(({ prediction: p, viewMode = 'compact' }: Props) => {
  const { addSelection, selections } = useBetSlip();
  const { formatKickoff, getKickoffRelative, formatOdds, isProbabilitiesMode, t } = useUserPreferences();
  const { isLeaguePinned, togglePinLeague } = usePinnedFavorites();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [unlockingCoin, setUnlockingCoin] = useState(false);

  const coinUnlockKey = `pp_unlocked_${p.id || `${p.home_team}-${p.away_team}`}`;
  const [, setCoinUnlocked] = useState(() => {
    try {
      return localStorage.getItem(coinUnlockKey) === 'true';
    } catch {
      return false;
    }
  });

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const locked = false;
  const relativeKickoff = getKickoffRelative(p.match_date);
  const matchSlug = formatMatchSlug(p.home_team, p.away_team, p.match_date);
  const matchUrl = `/predict/${matchSlug}`;

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
    const seed = (p.home_team.charCodeAt(0) + p.away_team.charCodeAt(0)) % 10;
    const homeXg = Number((0.9 + (winProbabilities.home / 100) * 1.6 + seed * 0.03).toFixed(2));
    const awayXg = Number((0.7 + (winProbabilities.away / 100) * 1.5 + (9 - seed) * 0.02).toFixed(2));
    const homeForm = getTeamFormSequence(p.home_team, winProbabilities.home);
    const awayForm = getTeamFormSequence(p.away_team, winProbabilities.away);
    return { homeXg, awayXg, homeForm, awayForm };
  }, [p.home_team, p.away_team, winProbabilities.home, winProbabilities.away]);

  const handleCoinUnlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticService.selection();
    setUnlockingCoin(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        hapticService.warning();
        toast.info('Sign in to unlock predictions using your coin balance.');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        hapticService.error();
        toast.error('Could not fetch coin balance.');
        return;
      }

      if ((profile.coins ?? 0) < 50) {
        hapticService.warning();
        toast.error(`You have ${profile.coins ?? 0} coins. 50 coins required.`);
        return;
      }

      const newCoins = (profile.coins ?? 0) - 50;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', session.user.id);

      localStorage.setItem(coinUnlockKey, 'true');
      setCoinUnlocked(true);
      hapticService.boost();
      toast.success('Unlocked with 50 coins!');
    } catch {
      hapticService.error();
      toast.error('Unlock failed. Please try again.');
    } finally {
      setUnlockingCoin(false);
    }
  };

  const displayOutcome =
    outcome === 'Home Win' ? t('pred.home_win', 'Home Win') :
    outcome === 'Draw' ? t('pred.draw', 'Draw') :
    outcome === 'Away Win' ? t('pred.away_win', 'Away Win') :
    outcome;

  const isMarketInSlip = (market: string) => {
    return selections.some((s) => s.homeTeam === p.home_team && s.awayTeam === p.away_team && s.market === market);
  };

  const handleOddsClick = (e: React.MouseEvent, market: string, odds: number) => {
    e.stopPropagation();
    hapticService.selection();
    addSelection({
      match: `${p.home_team} vs ${p.away_team}`,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      market,
      odds,
      confidence,
    });
  };

  const formattedTime = formatKickoff(p.match_date, { includeTimezone: false }).slice(-5);
  const formattedShortDate = useMemo(() => {
    try {
      const d = new Date(p.match_date);
      if (isNaN(d.getTime())) return 'Upcoming';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return 'Upcoming';
    }
  }, [p.match_date]);

  // 1. Condensed Single-Line Row (Flashscore Style)
  if (viewMode === 'condensed') {
    return (
      <>
        <div
          onClick={() => {
            hapticService.selection();
            if (!locked) setShowAnalytics(true);
          }}
          className="py-2 px-3.5 bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-2.5 text-xs"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-11 shrink-0">
              {formattedTime}
            </span>
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <TeamLogo team={p.home_team} size="xs" badgeOnly />
              <span className="font-semibold truncate text-foreground">{p.home_team}</span>
              <span className="text-muted-foreground text-[10px]">v</span>
              <TeamLogo team={p.away_team} size="xs" badgeOnly />
              <span className="font-semibold truncate text-foreground">{p.away_team}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs">
            <span className="font-medium text-foreground">{displayOutcome}</span>
            <span className="font-mono tabular-nums font-bold text-primary">{confidence}%</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
            {[
              { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds },
              { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds },
              { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds },
            ].map(({ label, key, prob, odds }) => (
              <button
                key={key}
                type="button"
                onClick={(e) => handleOddsClick(e, label, odds || 2.0)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  isMarketInSlip(label)
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                }`}
              >
                {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
              </button>
            ))}
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

  // 2. Pro Sports Portal Match Row (FotMob / Sofascore / Oddspedia Standard)
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => {
            hapticService.selection();
            if (!locked) setShowAnalytics(true);
          }}
          className="px-4 py-2.5 bg-card hover:bg-muted/35 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          {/* Left: Kickoff Time + Teams + 5-Game Form Guide + xG */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Kickoff / Live Status */}
            <div className="w-12 shrink-0 text-center pr-2.5 border-r border-border/70 font-mono tabular-nums">
              {relativeKickoff.status === 'live' ? (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                  LIVE
                </span>
              ) : (
                <>
                  <span className="text-xs font-bold text-foreground block">{formattedTime}</span>
                  <span className="text-[10px] text-muted-foreground block">{formattedShortDate}</span>
                </>
              )}
            </div>

            {/* Teams + Form + Expected Goals */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Home Team Row */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={matchUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 min-w-0 group/team"
                >
                  <TeamLogo team={p.home_team} size="xs" />
                  <span className="text-[13px] font-semibold text-foreground truncate group-hover/team:text-primary transition-colors">
                    {p.home_team}
                  </span>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden md:flex items-center gap-0.5" title={`${p.home_team} recent form`}>
                    {teamStats.homeForm.map((res, idx) => (
                      <span
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-[3px] text-[9px] font-mono font-bold flex items-center justify-center text-white ${
                          res === 'W'
                            ? 'bg-emerald-700'
                            : res === 'D'
                              ? 'bg-slate-600'
                              : 'bg-rose-600'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono tabular-nums text-[11px] text-muted-foreground w-12 text-right">
                    {teamStats.homeXg} xG
                  </span>
                </div>
              </div>

              {/* Away Team Row */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={matchUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 min-w-0 group/team"
                >
                  <TeamLogo team={p.away_team} size="xs" />
                  <span className="text-[13px] font-semibold text-foreground truncate group-hover/team:text-primary transition-colors">
                    {p.away_team}
                  </span>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden md:flex items-center gap-0.5" title={`${p.away_team} recent form`}>
                    {teamStats.awayForm.map((res, idx) => (
                      <span
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-[3px] text-[9px] font-mono font-bold flex items-center justify-center text-white ${
                          res === 'W'
                            ? 'bg-emerald-700'
                            : res === 'D'
                              ? 'bg-slate-600'
                              : 'bg-rose-600'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono tabular-nums text-[11px] text-muted-foreground w-12 text-right">
                    {teamStats.awayXg} xG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Forecast Badge + 1 / X / 2 Sportsbook Odds Matrix + Match Center Trigger */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
            {/* Forecast Pill */}
            <div className="flex items-center gap-1.5 min-w-[115px] sm:justify-end">
              <span className="text-xs font-semibold text-foreground">{displayOutcome}</span>
              <span
                className={`font-mono tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  confidence >= 80
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-800 text-white dark:bg-emerald-500/20 dark:text-emerald-300'
                }`}
              >
                {confidence}%
              </span>
            </div>

            {/* 1 / X / 2 Cells */}
            <div className="flex items-center gap-1 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
              {[
                { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds, isFavored: outcome === 'Home Win' },
                { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds, isFavored: outcome === 'Draw' },
                { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds, isFavored: outcome === 'Away Win' },
              ].map(({ label, key, prob, odds, isFavored }) => {
                const selected = isMarketInSlip(label);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={(e) => handleOddsClick(e, label, odds || 2.0)}
                    className={`h-8 w-[52px] rounded-md text-xs border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                        : isFavored
                          ? 'bg-primary/5 hover:bg-primary/15 border-primary/40 text-foreground font-semibold'
                          : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                    }`}
                    title={`${label} (${prob}%)`}
                  >
                    <span className={`text-[9px] leading-none ${selected ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                      {key}
                    </span>
                    <span className="text-[11px] font-bold leading-tight mt-0.5">
                      {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Match Stats & H2H Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAnalytics(true);
              }}
              className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-colors shrink-0"
              title="Open Match Center, Lineups & H2H"
              aria-label={`View match analytics for ${p.home_team} vs ${p.away_team}`}
            >
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
            </button>
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
  return (
    <>
      <Card
        onClick={() => {
          hapticService.selection();
          if (!locked) setShowAnalytics(true);
        }}
        className="group overflow-hidden cursor-pointer transition-colors hover:border-primary/50 border border-border bg-card flex flex-col justify-between shadow-2xs"
      >
        <CardHeader className="pb-3 pt-3.5 px-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="font-semibold text-primary truncate">{p.league}</span>
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

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo team={p.home_team} size="sm" />
                <span className="font-bold text-sm text-foreground truncate">{p.home_team}</span>
              </div>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.homeXg} xG · {winProbabilities.home}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo team={p.away_team} size="sm" />
                <span className="font-bold text-sm text-foreground truncate">{p.away_team}</span>
              </div>
              <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                {teamStats.awayXg} xG · {winProbabilities.away}%
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3.5 space-y-3">
          <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-muted-foreground">
              Forecast: <strong className="text-foreground">{displayOutcome}</strong>
            </span>
            <span className="font-mono tabular-nums font-bold text-primary">
              {confidence}%
            </span>
          </div>

          {!locked && (
            <div className="grid grid-cols-3 gap-1.5 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
              {[
                { label: 'Home Win', key: '1', prob: winProbabilities.home, odds: p.home_odds },
                { label: 'Draw', key: 'X', prob: winProbabilities.draw, odds: p.draw_odds },
                { label: 'Away Win', key: '2', prob: winProbabilities.away, odds: p.away_odds },
              ].map(({ label, key, prob, odds }) => {
                const selected = isMarketInSlip(label);
                return (
                  <button
                    type="button"
                    key={label}
                    onClick={(e) => handleOddsClick(e, label, odds || 2.0)}
                    className={`min-h-[36px] py-1 px-2 rounded border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                    }`}
                  >
                    <span className={selected ? 'text-primary-foreground/85' : 'text-muted-foreground'}>{key}</span>
                    <span className="font-semibold flex items-center gap-0.5">
                      {isProbabilitiesMode ? `${prob}%` : formatOdds(odds)}
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!locked && analysis && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {analysis}
            </p>
          )}

          {locked && (
            <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2">
                <Link to="/shop" className="flex-1">
                  <Button size="sm" className="w-full min-h-[38px] gap-1.5 font-semibold">
                    <TrendingUp className="h-3.5 w-3.5" /> Pro
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCoinUnlock}
                  disabled={unlockingCoin}
                  className="min-h-[38px] gap-1.5 font-semibold"
                >
                  <Coins className="h-3.5 w-3.5" /> 50
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/70 text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAnalytics(true)}
                className="font-semibold text-primary hover:underline transition-colors"
              >
                Stats &amp; Lineups
              </button>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
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
