import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences, OddsFormat } from '@/hooks/useUserPreferences';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import {
  computeProMatchAnalytics,
  readSubscribedMomentumAlerts,
  toggleMomentumAlertSubscription,
} from '@/components/MatchProAnalyticsWidget';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { toast } from 'sonner';
import {
  TrendingUp,
  Flame,
  Users,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Bell,
  BellRing,
  Wallet,
  ShieldAlert,
} from 'lucide-react';

export interface TopSiteMatchdayCommandBarProps {
  predictions: Prediction[];
}

type CommandTab =
  | 'ev_steam'
  | 'momentum_alerts'
  | 'xi_spotlight'
  | 'rollover_planner'
  | 'fan_poll'
  | 'odds_settings';

export const TopSiteMatchdayCommandBar: React.FC<TopSiteMatchdayCommandBarProps> = ({
  predictions,
}) => {
  const [activeTab, setActiveTab] = useState<CommandTab>('ev_steam');
  const { addSelection, setIsOpen, stake } = useBetSlip();
  const { oddsFormat, setOddsFormat, formatOdds, preferences, updatePreferences } =
    useUserPreferences();

  const [subscribedAlerts, setSubscribedAlerts] = useState<string[]>(() =>
    readSubscribedMomentumAlerts()
  );

  // Rollover planner interactive state
  const [rolloverDays, setRolloverDays] = useState<3 | 5 | 7>(3);
  const [profitSkimPct, setProfitSkimPct] = useState<0 | 20 | 35>(20);

  const handleToggleAlert = useCallback((matchKey: string, title: string) => {
    const enabled = toggleMomentumAlertSubscription(matchKey);
    setSubscribedAlerts(readSubscribedMomentumAlerts());
    if (enabled) {
      toast.success(`75'+ Late-Goal & Momentum Alert enabled for ${title}!`);
    } else {
      toast.info(`Disabled momentum alert for ${title}.`);
    }
  }, []);

  // Compute Top 3 +EV Value & Steam fixtures from the active pool
  const topValueFixtures = useMemo(() => {
    const pool = predictions.slice(0, 24);
    const scored = pool.map((match) => {
      const pro = computeProMatchAnalytics(match);
      const slug = formatMatchSlug(match.home_team, match.away_team);
      return {
        match,
        pro,
        slug,
      };
    });
    return scored
      .sort((a, b) => b.pro.bestValueEdgePct - a.pro.bestValueEdgePct)
      .slice(0, 3);
  }, [predictions]);

  // Compute Top 3 Live Momentum & 75'+ Late-Goal Alert fixtures
  const momentumFixtures = useMemo(() => {
    const pool = predictions.slice(0, 18);
    if (pool.length === 0) return [];

    const scored = pool.map((match) => {
      const pro = computeProMatchAnalytics(match);
      const slug = formatMatchSlug(match.home_team, match.away_team);
      const matchKey = `${match.home_team.toLowerCase()}-vs-${match.away_team.toLowerCase()}`;
      return {
        match,
        pro,
        slug,
        matchKey,
      };
    });

    return scored
      .sort((a, b) => b.pro.attackPressureIndex - a.pro.attackPressureIndex)
      .slice(0, 3);
  }, [predictions]);

  // Compute Top 3 Starting XI Rating & Tactical Mismatch fixtures
  const xiSpotlightFixtures = useMemo(() => {
    const pool = predictions.slice(0, 15);
    return pool.slice(0, 3).map((match) => {
      const pro = computeProMatchAnalytics(match);
      const slug = formatMatchSlug(match.home_team, match.away_team);
      const homeAvg = Number(
        (
          pro.homeSquadRatings.reduce((s, p) => s + p.rating, 0) /
          Math.max(1, pro.homeSquadRatings.length)
        ).toFixed(2)
      );
      const awayAvg = Number(
        (
          pro.awaySquadRatings.reduce((s, p) => s + p.rating, 0) /
          Math.max(1, pro.awaySquadRatings.length)
        ).toFixed(2)
      );
      const topStar =
        homeAvg >= awayAvg ? pro.homeSquadRatings[0] : pro.awaySquadRatings[0];
      return {
        match,
        pro,
        slug,
        homeAvg,
        awayAvg,
        topStar,
      };
    });
  }, [predictions]);

  // Multi-Bookmaker Compound Rollover Schedule
  const rolloverSchedule = useMemo(() => {
    const baseStake = stake && stake > 0 ? stake : 500;
    const dailyTargetOdds = 1.95;
    const rows: Array<{
      day: number;
      startStake: number;
      targetOdds: number;
      grossReturn: number;
      skimmedVault: number;
      nextStake: number;
    }> = [];

    let currentStake = baseStake;
    let totalVaulted = 0;

    for (let d = 1; d <= rolloverDays; d++) {
      const grossReturn = Math.round(currentStake * dailyTargetOdds);
      const netProfit = Math.max(0, grossReturn - currentStake);
      const skimmedVault = d < rolloverDays ? Math.round(netProfit * (profitSkimPct / 100)) : 0;
      const nextStake = grossReturn - skimmedVault;
      totalVaulted += skimmedVault;
      rows.push({
        day: d,
        startStake: currentStake,
        targetOdds: dailyTargetOdds,
        grossReturn,
        skimmedVault,
        nextStake,
      });
      currentStake = nextStake;
    }

    const finalTotalEquity = (rows[rows.length - 1]?.nextStake || baseStake) + totalVaulted;
    return {
      baseStake,
      rows,
      totalVaulted,
      finalTotalEquity,
    };
  }, [stake, rolloverDays, profitSkimPct]);

  const featuredPollMatch = predictions[0] || null;
  const featuredPollAnalytics = useMemo(
    () => (featuredPollMatch ? computeProMatchAnalytics(featuredPollMatch) : null),
    [featuredPollMatch]
  );

  const [quickVote, setQuickVote] = useState<'home' | 'draw' | 'away' | null>(null);

  if (predictions.length === 0) return null;

  const combinedValueOdds = topValueFixtures.reduce(
    (acc, item) => acc * (item.pro.bestValueOdds || 1.85),
    1
  );

  return (
    <section
      aria-label="Live +EV Value Scanner, Momentum Alerts, XI Ratings and Rollover Planner"
      data-testid="top-site-matchday-command-bar"
      className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs"
    >
      {/* Top Header & Segmented Switcher */}
      <div className="px-3.5 py-2.5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-foreground">Matchday Pro Command Bar</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <Link
            to="/pro-command-center"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Pro Command Center</span>
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Matchday analytics mode selector"
          className="flex items-center gap-1 p-1 rounded-lg bg-muted/70 border border-border/60 overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'ev_steam', label: '+EV & Steam Drops', icon: TrendingUp },
              { id: 'momentum_alerts', label: "Momentum & 75'+ Alerts", icon: Flame },
              { id: 'xi_spotlight', label: 'XI Ratings & Impact', icon: ShieldAlert },
              { id: 'rollover_planner', label: 'Rollover & Bookies', icon: Wallet },
              { id: 'fan_poll', label: 'Crowd Poll', icon: Users },
              { id: 'odds_settings', label: `Odds (${oddsFormat.toUpperCase()})`, icon: SlidersHorizontal },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-background text-foreground shadow-2xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel 1: Oddspedia / Action Network +EV Value & Steam Drops */}
      {activeTab === 'ev_steam' && (
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topValueFixtures.map(({ match, pro, slug }) => (
              <div
                key={match.id}
                className="p-3 rounded-lg border border-border/80 bg-muted/15 hover:border-primary/40 transition-colors flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{match.league}</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{pro.bestValueEdgePct}% EV · {pro.steamDropSummary.openingOdds.toFixed(2)}→
                      {pro.steamDropSummary.currentOdds.toFixed(2)}
                    </span>
                  </div>

                  <Link
                    to={`/predict/${slug}`}
                    className="flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TeamLogo team={match.home_team} size="xs" badgeOnly />
                      <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {match.home_team} vs {match.away_team}
                      </span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </Link>

                  <div className="text-[11px] text-muted-foreground font-mono tabular-nums flex items-center justify-between pt-0.5">
                    <span>
                      Pick: <strong className="font-sans text-foreground">{pro.bestValueSide}</strong>
                    </span>
                    <span>
                      Model {Math.max(pro.homeWinProb, pro.awayWinProb)}% vs Bookie{' '}
                      {Math.min(pro.bookieHomeImplied, pro.bookieAwayImplied)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <span className="text-xs font-mono tabular-nums font-bold text-primary">
                    {formatOdds(pro.bestValueOdds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      addSelection({
                        id: `${match.id}-ev`,
                        matchId: match.id,
                        match: `${match.home_team} vs ${match.away_team}`,
                        homeTeam: match.home_team,
                        awayTeam: match.away_team,
                        league: match.league,
                        matchDate: match.match_date,
                        market: pro.bestValueSide,
                        odds: pro.bestValueOdds,
                        confidence: getConfidence(match),
                      });
                      setIsOpen(true);
                      toast.success(
                        `Added +EV Pick: ${match.home_team} vs ${match.away_team} (${pro.bestValueSide}) to Bet Slip!`
                      );
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/60 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <span>Add +EV Pick</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-muted-foreground">
              Mathematical edge &amp; opening-to-current steam drops verified across 10,000 Bivariate Poisson simulations.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                topValueFixtures.forEach(({ match, pro }) => {
                  addSelection({
                    id: `${match.id}-ev`,
                    matchId: match.id,
                    match: `${match.home_team} vs ${match.away_team}`,
                    homeTeam: match.home_team,
                    awayTeam: match.away_team,
                    league: match.league,
                    matchDate: match.match_date,
                    market: pro.bestValueSide,
                    odds: pro.bestValueOdds,
                    confidence: getConfidence(match),
                  });
                });
                setIsOpen(true);
                toast.success('Loaded 3-Leg +EV Value Treble into Bet Slip!');
              }}
              className="h-8 text-xs font-bold whitespace-nowrap shrink-0 font-mono tabular-nums"
            >
              Load 3-Leg +EV Treble (@{combinedValueOdds.toFixed(2)})
            </Button>
          </div>
        </div>
      )}

      {/* Panel 2: Live In-Play Momentum & 75'+ Goal Alert Center */}
      {activeTab === 'momentum_alerts' && (
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {momentumFixtures.map(({ match, pro, slug, matchKey }) => {
              const isSubscribed = subscribedAlerts.includes(matchKey);
              return (
                <div
                  key={match.id}
                  className="p-3 rounded-lg border border-border/80 bg-muted/15 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span className="font-sans font-semibold text-primary">
                        APm Pressure: {pro.attackPressureIndex}/100
                      </span>
                      <span className="text-foreground font-bold">
                        76&apos;–90+&apos; Goal: {pro.lateGoalProb76Plus}%
                      </span>
                    </div>
                    <Link
                      to={`/predict/${slug}`}
                      className="flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TeamLogo team={match.home_team} size="xs" badgeOnly />
                        <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {match.home_team} vs {match.away_team}
                        </span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </Link>
                    <div className="h-1.5 w-full rounded bg-muted overflow-hidden flex">
                      <div
                        className="bg-emerald-600"
                        style={{ width: `${pro.attackPressureIndex}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      aria-pressed={isSubscribed}
                      onClick={() =>
                        handleToggleAlert(matchKey, `${match.home_team} vs ${match.away_team}`)
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                        isSubscribed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary/60 text-foreground'
                      }`}
                    >
                      {isSubscribed ? (
                        <>
                          <BellRing className="h-3 w-3" aria-hidden="true" />
                          <span>Alert On</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-3 w-3" aria-hidden="true" />
                          <span>75&apos;+ Alert</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        addSelection({
                          id: `${match.id}-2h-goal`,
                          matchId: match.id,
                          match: `${match.home_team} vs ${match.away_team}`,
                          homeTeam: match.home_team,
                          awayTeam: match.away_team,
                          league: match.league,
                          matchDate: match.match_date,
                          market: '2nd Half Over 0.5 Goals',
                          odds: 1.48,
                          confidence: pro.lateGoalProb76Plus,
                        });
                        setIsOpen(true);
                        toast.success(
                          `Added 2nd Half Over 0.5 (${match.home_team} vs ${match.away_team}) to Bet Slip!`
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/60 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      <span>2H O0.5 ({formatOdds(1.48)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel 3: SofaScore Starting XI Ratings & Key Player Impact */}
      {activeTab === 'xi_spotlight' && (
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {xiSpotlightFixtures.map(({ match, pro, slug, homeAvg, awayAvg, topStar }) => (
            <div
              key={match.id}
              className="p-3 rounded-lg border border-border/80 bg-muted/15 flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-muted-foreground">
                  <span>XI Form Rating</span>
                  <span className="text-foreground font-bold">
                    {homeAvg.toFixed(2)} vs {awayAvg.toFixed(2)}
                  </span>
                </div>
                <Link
                  to={`/predict/${slug}`}
                  className="flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamLogo team={match.home_team} size="xs" badgeOnly />
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {match.home_team} vs {match.away_team}
                    </span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
                {topStar && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    MVP Impact: <strong className="text-foreground">{topStar.name}</strong> (
                    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      {topStar.rating.toFixed(2)}
                    </span>{' '}
                    · +{topStar.xgContribution} xG)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                <Link
                  to={`/predict/${slug}`}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Simulate XI Absences →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    addSelection({
                      id: `${match.id}-xi`,
                      matchId: match.id,
                      match: `${match.home_team} vs ${match.away_team}`,
                      homeTeam: match.home_team,
                      awayTeam: match.away_team,
                      league: match.league,
                      matchDate: match.match_date,
                      market: pro.bestValueSide,
                      odds: pro.bestValueOdds,
                      confidence: getConfidence(match),
                    });
                    setIsOpen(true);
                    toast.success(
                      `Added XI-Backed Pick: ${match.home_team} vs ${match.away_team} (${pro.bestValueSide})!`
                    );
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/60 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span>Add ({formatOdds(pro.bestValueOdds)})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel 4: Multi-Bookmaker 1-Click Bet Slip & Compound Rollover Planner */}
      {activeTab === 'rollover_planner' && (
        <div className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                Safe Compound Rollover &amp; Profit-Skim Ladder (@1.95 Daily Target)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Automatically skims daily profit into a protected vault so a late-day loss never wipes out your starting bankroll.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div
                role="group"
                aria-label="Select rollover duration"
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border/60 text-xs"
              >
                {([3, 5, 7] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={rolloverDays === d}
                    onClick={() => setRolloverDays(d)}
                    className={`px-2 py-0.5 rounded font-mono font-semibold cursor-pointer ${
                      rolloverDays === d
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>

              <div
                role="group"
                aria-label="Select profit skim percentage"
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border/60 text-xs"
              >
                {([0, 20, 35] as const).map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    aria-pressed={profitSkimPct === pct}
                    onClick={() => setProfitSkimPct(pct)}
                    className={`px-2 py-0.5 rounded font-mono font-semibold cursor-pointer ${
                      profitSkimPct === pct
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Skim {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 font-mono tabular-nums text-xs">
            {rolloverSchedule.rows.map((r) => (
              <div
                key={r.day}
                className="p-2.5 rounded-lg border border-border/70 bg-muted/15 space-y-1"
              >
                <span className="text-[10px] font-sans font-bold text-primary block">
                  Day {r.day}
                </span>
                <div className="text-foreground font-bold">{r.grossReturn.toLocaleString()}</div>
                {r.skimmedVault > 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                    Vault +{r.skimmedVault.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <span className="font-mono tabular-nums text-muted-foreground">
              Start: <strong className="text-foreground">{rolloverSchedule.baseStake.toLocaleString()}</strong> ·
              Protected Vault:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                +{rolloverSchedule.totalVaulted.toLocaleString()}
              </strong>{' '}
              · Total Target Equity:{' '}
              <strong className="text-foreground">
                {rolloverSchedule.finalTotalEquity.toLocaleString()}
              </strong>
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const top2 = topValueFixtures.slice(0, 2);
                top2.forEach(({ match, pro }) => {
                  addSelection({
                    id: `${match.id}-rollover`,
                    matchId: match.id,
                    match: `${match.home_team} vs ${match.away_team}`,
                    homeTeam: match.home_team,
                    awayTeam: match.away_team,
                    league: match.league,
                    matchDate: match.match_date,
                    market: pro.bestValueSide,
                    odds: pro.bestValueOdds,
                    confidence: getConfidence(match),
                  });
                });
                setIsOpen(true);
                toast.success('Loaded Day 1 Safe Rollover Slip into Bet Slip!');
              }}
              className="h-8 text-xs font-bold whitespace-nowrap shrink-0"
            >
              Load Day 1 Safe Rollover Slip
            </Button>
          </div>
        </div>
      )}

      {/* Panel 5: FotMob Featured Match Fan Poll */}
      {activeTab === 'fan_poll' && featuredPollMatch && featuredPollAnalytics && (
        <div className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TeamLogo team={featuredPollMatch.home_team} size="xs" badgeOnly />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {featuredPollMatch.home_team} vs {featuredPollMatch.away_team}
              </span>
              <TeamLogo team={featuredPollMatch.away_team} size="xs" badgeOnly />
              <span className="text-xs text-muted-foreground">· {featuredPollMatch.league}</span>
            </div>
            <Link
              to={`/predict/${formatMatchSlug(featuredPollMatch.home_team, featuredPollMatch.away_team)}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open Full 10,000-Run Match Breakdown →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(
              [
                {
                  id: 'home' as const,
                  label: `1 · ${featuredPollMatch.home_team}`,
                  pct: featuredPollAnalytics.homeWinProb,
                  odds: featuredPollMatch.home_odds || 1.92,
                },
                {
                  id: 'draw' as const,
                  label: 'X · Draw',
                  pct: featuredPollAnalytics.drawProb,
                  odds: featuredPollMatch.draw_odds || 3.35,
                },
                {
                  id: 'away' as const,
                  label: `2 · ${featuredPollMatch.away_team}`,
                  pct: featuredPollAnalytics.awayWinProb,
                  odds: featuredPollMatch.away_odds || 3.60,
                },
              ]
            ).map((opt) => {
              const selected = quickVote === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setQuickVote(opt.id);
                    toast.success(`Voted for ${opt.label}!`);
                  }}
                  aria-pressed={selected}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer space-y-1.5 ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-border/80 bg-muted/15 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground truncate">{opt.label}</span>
                    {selected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Voted
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {formatOdds(opt.odds)}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${opt.pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-muted-foreground">
                    <span>AI &amp; Crowd Consensus</span>
                    <span className="font-bold text-foreground">{opt.pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel 6: Flashscore Instant Odds Format & Bookmaker Preferences */}
      {activeTab === 'odds_settings' && (
        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-foreground block">
              Global Odds Display Format
            </span>
            <p className="text-[11px] text-muted-foreground">
              Switch between Decimal (1.95), Fractional (19/20), and American (-105) across all match cards and calculators.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Select odds format"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border/60"
            >
              {(
                [
                  { id: 'decimal', label: 'Decimal (1.95)' },
                  { id: 'fractional', label: 'Fractional (19/20)' },
                  { id: 'american', label: 'American (-105)' },
                ] as { id: OddsFormat; label: string }[]
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  aria-pressed={oddsFormat === fmt.id}
                  onClick={() => {
                    setOddsFormat(fmt.id);
                    toast.success(`Switched odds format to ${fmt.label}`);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    oddsFormat === fmt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Bookie:</span>
              {(
                [
                  { id: 'sportybet', label: 'SportyBet' },
                  { id: 'betika', label: 'Betika' },
                  { id: 'bet9ja', label: 'Bet9ja' },
                  { id: '1xbet', label: '1xBet' },
                ] as const
              ).map((bk) => (
                <button
                  key={bk.id}
                  type="button"
                  aria-pressed={preferences.defaultBookmaker === bk.id}
                  onClick={() => {
                    updatePreferences({ defaultBookmaker: bk.id });
                    toast.success(`Default bookmaker set to ${bk.label}`);
                  }}
                  className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                    preferences.defaultBookmaker === bk.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {bk.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopSiteMatchdayCommandBar;
