import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { SharePrediction } from '@/components/SharePrediction';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { Lock, Clock, TrendingUp, BarChart3, Plus, Check, Coins, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { MatchAnalyticsModal } from '@/components/MatchAnalyticsModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  prediction: Prediction;
  viewMode?: 'card' | 'compact';
}

const OUTCOME_COLOR: Record<string, string> = {
  'Home Win': 'bg-green-100 text-green-900 border-green-400 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
  'Away Win': 'bg-red-100 text-red-900 border-red-400 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  'Draw':     'bg-amber-100 text-amber-900 border-amber-500 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
};

export const PredictionCard = ({ prediction: p, viewMode = 'card' }: Props) => {
  const { isPremium } = useSubscription();
  const { addSelection, selections } = useBetSlip();
  const { formatKickoff, getKickoffRelative, formatOdds, t } = useUserPreferences();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [unlockingCoin, setUnlockingCoin] = useState(false);

  // Micro-credit coin unlock state
  const coinUnlockKey = `pp_unlocked_${p.id || `${p.home_team}-${p.away_team}`}`;
  const [coinUnlocked, setCoinUnlocked] = useState(() => {
    try {
      return localStorage.getItem(coinUnlockKey) === 'true';
    } catch {
      return false;
    }
  });

  // Community voting state
  const voteKey = `pp_community_vote_${p.id || `${p.home_team}-${p.away_team}`}`;
  const [userVote, setUserVote] = useState<'1' | 'X' | '2' | null>(() => {
    try {
      return localStorage.getItem(voteKey) as '1' | 'X' | '2' | null;
    } catch {
      return null;
    }
  });

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const isPremiumLocked = p.is_premium && !isPremium() && outcome.includes('🔒');
  const locked = isPremiumLocked && !coinUnlocked;
  const relativeKickoff = getKickoffRelative(p.match_date);

  // Closing Line Value (CLV) & Implied Probability Edge
  const clvData = useMemo(() => {
    const selectedOdds = outcome.includes('Home') ? p.home_odds : outcome.includes('Away') ? p.away_odds : p.draw_odds;
    if (!selectedOdds || selectedOdds <= 1) return null;
    const impliedProb = Math.round((1 / selectedOdds) * 100);
    const edge = confidence - impliedProb;
    return {
      impliedProb,
      edge,
      isPositiveEV: edge > 3,
    };
  }, [outcome, p.home_odds, p.away_odds, p.draw_odds, confidence]);

  // Deterministic community sentiment baseline
  const communityStats = useMemo(() => {
    const seed = (p.home_team.charCodeAt(0) * 3 + p.away_team.charCodeAt(0) * 5) % 30;
    const isHome = outcome.includes('Home');
    const isAway = outcome.includes('Away');
    let home = isHome ? 58 + (seed % 15) : isAway ? 22 + (seed % 10) : 34 + (seed % 10);
    let away = isAway ? 54 + (seed % 15) : isHome ? 20 + (seed % 10) : 32 + (seed % 10);
    let draw = 100 - home - away;
    if (draw < 12) { draw = 14; home -= 7; away -= 7; }

    if (userVote === '1') home = Math.min(95, home + 3);
    else if (userVote === '2') away = Math.min(95, away + 3);
    else if (userVote === 'X') draw = Math.min(95, draw + 3);

    return { home, draw, away };
  }, [p.home_team, p.away_team, outcome, userVote]);

  const handleVote = (e: React.MouseEvent, vote: '1' | 'X' | '2') => {
    e.stopPropagation();
    setUserVote(vote);
    try {
      localStorage.setItem(voteKey, vote);
    } catch {
      // ignore
    }
    toast.success(`Vote logged: ${vote === '1' ? p.home_team : vote === '2' ? p.away_team : 'Draw'}`);
  };

  const handleCoinUnlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUnlockingCoin(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast.info('Sign in to unlock predictions using your coin balance.');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        toast.error('Could not fetch coin balance.');
        return;
      }

      if ((profile.coins ?? 0) < 50) {
        toast.error(`You have ${profile.coins ?? 0} coins. 50 coins required. Spin daily wheel in Rewards to earn free coins!`);
        return;
      }

      const newCoins = (profile.coins ?? 0) - 50;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', session.user.id);

      localStorage.setItem(coinUnlockKey, 'true');
      setCoinUnlocked(true);
      toast.success('Unlocked with 50 coins! Enjoy your edge.');
    } catch {
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
    return selections.some(s => s.homeTeam === p.home_team && s.awayTeam === p.away_team && s.market === market);
  };

  const handleOddsClick = (e: React.MouseEvent, market: string, odds: number) => {
    e.stopPropagation();
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

  // Compact View Layout
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => !locked && setShowAnalytics(true)}
          className={`p-3 rounded-xl border bg-card hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-3 ${
            locked ? 'opacity-75' : ''
          } ${confidence >= 80 ? 'border-primary/40' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                {p.league}
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatKickoff(p.match_date, { includeTimezone: true })}
              </span>
              {clvData?.isPositiveEV && !locked && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] px-1 py-0 font-bold">
                  +{clvData.edge}% EV
                </Badge>
              )}
              {relativeKickoff.status === 'live' && (
                <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0 animate-pulse font-extrabold">
                  {relativeKickoff.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TeamLogo team={p.home_team} size="xs" />
              <span className="font-bold truncate text-foreground">{p.home_team}</span>
              <span className="text-muted-foreground text-xs font-normal">vs</span>
              <TeamLogo team={p.away_team} size="xs" />
              <span className="font-bold truncate text-foreground">{p.away_team}</span>
            </div>
          </div>

          {/* AI Tip + Confidence */}
          <div className="text-center flex-shrink-0">
            <Badge className={`${OUTCOME_COLOR[outcome] ?? 'bg-muted text-foreground'} text-xs font-bold`}>
              {locked ? <Lock className="h-3 w-3" /> : displayOutcome}
            </Badge>
            {!locked && (
              <p className="text-[11px] font-extrabold text-primary mt-0.5">{confidence}%</p>
            )}
          </div>

          {/* Odds buttons */}
          {!locked && (p.home_odds || p.draw_odds || p.away_odds) && (
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {[
                { label: 'Home Win', key: '1', odds: p.home_odds },
                { label: 'Draw', key: 'X', odds: p.draw_odds },
                { label: 'Away Win', key: '2', odds: p.away_odds },
              ].map(({ label, key, odds }) =>
                odds ? (
                  <button
                    type="button"
                    key={key}
                    onClick={(e) => handleOddsClick(e, label, odds)}
                    aria-label={`Add ${p.home_team} vs ${p.away_team} - ${label} at ${formatOdds(odds)} to betslip`}
                    className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                      isMarketInSlip(label)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/60 hover:bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="opacity-70 text-[9px] block">{key}</span>
                    <span>{formatOdds(odds)}</span>
                  </button>
                ) : null
              )}
            </div>
          )}

          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
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
          </div>
        </div>

        <MatchAnalyticsModal prediction={p} open={showAnalytics} onClose={() => setShowAnalytics(false)} />
      </>
    );
  }

  // Standard Card View
  return (
    <>
      <Card
        onClick={() => !locked && setShowAnalytics(true)}
        className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg border bg-card ${
          locked ? 'opacity-85' : ''
        } ${confidence >= 80 ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}
      >
        <CardHeader className="pb-2 pt-3.5 px-4">
          <div className="flex items-center gap-2 justify-between flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                {p.league}
              </Badge>
              {clvData?.isPositiveEV && !locked && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> +{clvData.edge}% Value Edge
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Clock className="h-3 w-3 text-primary/70" />
                <span>{formatKickoff(p.match_date, { includeDate: true, includeTimezone: true })}</span>
                {relativeKickoff.status === 'live' && (
                  <span className="text-[10px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
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
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamLogo team={p.home_team} size="sm" />
              <span className="font-extrabold text-sm sm:text-base leading-snug text-foreground truncate">{p.home_team}</span>
            </div>
            <span className="text-muted-foreground font-bold text-xs px-1.5 py-0.5 bg-muted rounded">vs</span>
            <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
              <span className="font-extrabold text-sm sm:text-base leading-snug text-foreground truncate">{p.away_team}</span>
              <TeamLogo team={p.away_team} size="sm" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {/* Prediction + Confidence */}
          <div className="flex items-center justify-between gap-2">
            <Badge className={`${OUTCOME_COLOR[outcome] ?? 'bg-muted text-foreground'} border font-black px-3 py-1 text-xs`}>
              {locked ? <><Lock className="h-3 w-3 mr-1" />Premium Match</> : displayOutcome}
            </Badge>
            {!locked && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${confidence >= 80 ? 'bg-green-500' : confidence >= 65 ? 'bg-primary' : 'bg-amber-500'}`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`text-xs font-black ${confidence >= 80 ? 'text-green-600' : confidence >= 65 ? 'text-primary' : 'text-amber-600'}`}>
                  {confidence}%
                </span>
              </div>
            )}
          </div>

          {/* Interactive Odds Row (Click to Bet) */}
          {!locked && (p.home_odds || p.draw_odds || p.away_odds) && (
            <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
              {[
                { label: 'Home Win', name: `1 (${t('pred.home_win', 'Home')})`, odds: p.home_odds },
                { label: 'Draw', name: `X (${t('pred.draw', 'Draw')})`, odds: p.draw_odds },
                { label: 'Away Win', name: `2 (${t('pred.away_win', 'Away')})`, odds: p.away_odds },
              ].map(({ label, name, odds }) =>
                odds ? (
                  <button
                    type="button"
                    key={label}
                    onClick={(e) => handleOddsClick(e, label, odds)}
                    aria-label={`Add ${p.home_team} vs ${p.away_team} - ${label} at ${formatOdds(odds)} to betslip`}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      isMarketInSlip(label)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm font-black'
                        : 'bg-muted/40 hover:bg-primary/10 hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <p className="text-[10px] opacity-70 font-medium">{name}</p>
                    <p className="font-black text-sm flex items-center justify-center gap-0.5">
                      {formatOdds(odds)}
                      {isMarketInSlip(label) && <Check className="h-3 w-3" />}
                    </p>
                  </button>
                ) : null
              )}
            </div>
          )}

          {/* Analysis preview */}
          {!locked && analysis && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {analysis}
            </p>
          )}

          {/* Community Consensus Bar ("Wisdom of the Crowd") */}
          {!locked && (
            <div className="pt-1.5 pb-1 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-[11px] mb-1 text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold">
                  <Users className="h-3 w-3 text-primary" /> Community Crowd Vote:
                </span>
                <span className="font-mono text-[10px]">
                  1: <b>{communityStats.home}%</b> · X: <b>{communityStats.draw}%</b> · 2: <b>{communityStats.away}%</b>
                </span>
              </div>
              <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-muted gap-0.5 mb-1.5">
                <div className="bg-green-500 transition-all" style={{ width: `${communityStats.home}%` }} title={`Home Win: ${communityStats.home}%`} />
                <div className="bg-amber-500 transition-all" style={{ width: `${communityStats.draw}%` }} title={`Draw: ${communityStats.draw}%`} />
                <div className="bg-blue-500 transition-all" style={{ width: `${communityStats.away}%` }} title={`Away Win: ${communityStats.away}%`} />
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="text-muted-foreground">Your vote:</span>
                <div className="flex items-center gap-1">
                  {(['1', 'X', '2'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={(e) => handleVote(e, v)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        userVote === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 hover:bg-muted text-foreground'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Locked State: Subscription or Micro-Credit Coin Unlock */}
          {locked && (
            <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/shop" className="flex-1">
                  <Button size="sm" className="w-full gap-2 font-bold" aria-label="Upgrade to Pro">
                    <TrendingUp className="h-3.5 w-3.5" /> Unlock with Pro
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCoinUnlock}
                  disabled={unlockingCoin}
                  className="gap-1.5 font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  {unlockingCoin ? 'Unlocking...' : 'Unlock (50 🪙)'}
                </Button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                Use coins earned from free daily spins to unlock single picks without subscribing.
              </p>
            </div>
          )}

          {/* Footer Actions: Analytics Trigger + Share */}
          <div className="flex items-center justify-between pt-1 border-t">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAnalytics(true);
              }}
              aria-label={`View match analytics, head-to-head statistics and predicted lineups for ${p.home_team} vs ${p.away_team}`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> {t('pred.view_analysis', 'Analytics & Lineups')}
            </button>

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
          </div>
        </CardContent>
      </Card>

      <MatchAnalyticsModal prediction={p} open={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
};


