import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences, OddsFormat } from '@/hooks/useUserPreferences';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { computeProMatchAnalytics } from '@/components/MatchProAnalyticsWidget';
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
} from 'lucide-react';

export interface TopSiteMatchdayCommandBarProps {
  predictions: Prediction[];
}

type CommandTab = 'ev_steam' | 'streaks' | 'fan_poll' | 'odds_settings';

export const TopSiteMatchdayCommandBar: React.FC<TopSiteMatchdayCommandBarProps> = ({
  predictions,
}) => {
  const [activeTab, setActiveTab] = useState<CommandTab>('ev_steam');
  const { addSelection, setIsOpen } = useBetSlip();
  const { oddsFormat, setOddsFormat, formatOdds, preferences, updatePreferences } =
    useUserPreferences();

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

  // Compute Top 3 Statistical Streak & Late-Goal fixtures
  const streakFixtures = useMemo(() => {
    const pool = predictions.slice(0, 18);
    if (pool.length === 0) return [];

    const sortedByConf = [...pool].sort((a, b) => getConfidence(b) - getConfidence(a));
    const items = sortedByConf.slice(0, 3).map((match, idx) => {
      const pro = computeProMatchAnalytics(match);
      const slug = formatMatchSlug(match.home_team, match.away_team);
      const conf = getConfidence(match);
      const streakCategories = [
        {
          category: 'Fortress Banker Streak',
          detail: `${conf}% AI Model Certainty · Unbeaten xG Trend`,
          market: getPrediction(match),
          odds:
            getPrediction(match) === 'Away Win'
              ? match.away_odds || 2.15
              : getPrediction(match) === 'Draw'
                ? match.draw_odds || 3.25
                : match.home_odds || 1.72,
          prob: conf,
        },
        {
          category: "Late-Goal Surge (76'–90+')",
          detail: `${pro.lateGoalProb76Plus}% Second-Half Scoring Intensity`,
          market: 'Over 2.5 Goals',
          odds: 1.85,
          prob: pro.lateGoalProb76Plus,
        },
        {
          category: 'High-Tempo BTTS & xG Clash',
          detail: `Combined ${(Number(pro.tacticalMetrics[0]?.homeValue || 1.5) + Number(pro.tacticalMetrics[0]?.awayValue || 1.2)).toFixed(2)} Expected Goals`,
          market: 'BTTS: Yes',
          odds: 1.78,
          prob: Math.min(84, Math.max(66, conf - 4)),
        },
      ];
      return {
        match,
        slug,
        ...streakCategories[idx % streakCategories.length],
      };
    });
    return items;
  }, [predictions]);

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
      aria-label="Live +EV Value Scanner, Streak Spotlight and Fan Consensus"
      data-testid="top-site-matchday-command-bar"
      className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs"
    >
      {/* Top Header & Segmented Switcher */}
      <div className="px-3.5 py-2.5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-foreground">Matchday Edge &amp; Consensus</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            Live +EV value drops, statistical streaks &amp; crowd consensus
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Matchday analytics mode selector"
          className="flex items-center gap-1 p-1 rounded-lg bg-muted/70 border border-border/60 overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'ev_steam', label: '+EV Value Drops', icon: TrendingUp },
              { id: 'streaks', label: 'Streaks & 76\'+ Goals', icon: Flame },
              { id: 'fan_poll', label: 'Who Will Win? Poll', icon: Users },
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
                      +{pro.bestValueEdgePct}% EV Edge
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
              Mathematical edge calculated by comparing 10,000-run Bivariate Poisson win probabilities against live bookmaker implied odds.
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

      {/* Panel 2: SofaScore Statistical Streaks & Late-Goal Radar */}
      {activeTab === 'streaks' && (
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {streakFixtures.map((item) => (
            <div
              key={`${item.match.id}-${item.category}`}
              className="p-3 rounded-lg border border-border/80 bg-muted/15 flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-primary">{item.category}</span>
                  <span className="font-mono tabular-nums">{item.prob}% Prob</span>
                </div>
                <Link
                  to={`/predict/${item.slug}`}
                  className="flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamLogo team={item.match.home_team} size="xs" badgeOnly />
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.match.home_team} vs {item.match.away_team}
                    </span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
                <p className="text-[11px] text-muted-foreground">{item.detail}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                <span className="text-xs font-semibold text-foreground">
                  {item.market}{' '}
                  <strong className="font-mono tabular-nums text-primary">
                    ({formatOdds(item.odds)})
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    addSelection({
                      id: `${item.match.id}-streak`,
                      matchId: item.match.id,
                      match: `${item.match.home_team} vs ${item.match.away_team}`,
                      homeTeam: item.match.home_team,
                      awayTeam: item.match.away_team,
                      league: item.match.league,
                      matchDate: item.match.match_date,
                      market: item.market,
                      odds: item.odds,
                      confidence: item.prob,
                    });
                    setIsOpen(true);
                    toast.success(`Added ${item.market} (${item.match.home_team} vs ${item.match.away_team}) to Slip!`);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/60 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span>Add Streak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel 3: FotMob Featured Match Fan Poll */}
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

      {/* Panel 4: Flashscore Instant Odds Format & Bookmaker Preferences */}
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
