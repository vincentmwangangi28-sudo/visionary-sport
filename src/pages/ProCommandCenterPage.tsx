import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { TopSiteMatchdayCommandBar } from '@/components/TopSiteMatchdayCommandBar';
import { MatchProAnalyticsWidget, computeProMatchAnalytics } from '@/components/MatchProAnalyticsWidget';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useCurrency } from '@/hooks/useCurrency';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import {
  Activity,
  TrendingDown,
  Users,
  Wallet,
  Bell,
  ArrowUpRight,
  Plus,
  Check,
  Filter,
} from 'lucide-react';

export default function ProCommandCenterPage() {
  const { data: predictions = [] } = usePredictions(1);
  const { addSelection, isInSlip } = useBetSlip();
  const { formatOdds } = useCurrency();

  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const leagues = useMemo(() => {
    const counts = new Map<string, number>();
    predictions.forEach((p) => {
      if (p.league) counts.set(p.league, (counts.get(p.league) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([league]) => league);
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    const list =
      selectedLeague === 'ALL'
        ? predictions
        : predictions.filter((p) => p.league === selectedLeague);
    return list.slice(0, 24);
  }, [predictions, selectedLeague]);

  const activePrediction = useMemo(() => {
    if (filteredPredictions.length === 0) return predictions[0] || null;
    if (selectedMatchId) {
      const found = filteredPredictions.find((p) => p.id === selectedMatchId);
      if (found) return found;
    }
    return filteredPredictions[0];
  }, [filteredPredictions, predictions, selectedMatchId]);

  const activePro = useMemo(
    () => (activePrediction ? computeProMatchAnalytics(activePrediction) : null),
    [activePrediction]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Pro Matchday Command Center — Live Momentum, Steam Moves & XI Ratings | PredictPro"
        description="Unified football intelligence command center combining Opta 10k simulations, Oddspedia line-movement sparklines, SofaScore interactive Starting XI absence simulator, 75'+ late-goal alerts, and compound rollover planning."
        keywords="pro matchday command center, football steam moves, starting XI impact calculator, live momentum radar, compound rollover planner, sportybet code optimizer"
        canonical="/pro-command-center"
      />

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Pro Command Center' },
          ]}
        />

        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                UNIFIED TOP-SITE QUANTITATIVE WORKSPACE
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Pro Matchday Command Center
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
                Real-time Oddspedia line-movement trajectories, SofaScore Starting XI absence simulator,
                Flashscore 75&apos;+ late-goal momentum alerts, and multi-bookmaker compound rollover planning in one workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-emerald-600" /> Shot Map &amp; xT
                </span>
                <p className="text-xs font-mono font-black tabular-nums text-foreground mt-0.5">
                  2D Pitch + 12 Zones
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" /> Ref &amp; SGP Lab
                </span>
                <p className="text-xs font-mono font-black tabular-nums text-foreground mt-0.5">
                  Cards + Copula SGP
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Bell className="h-3 w-3 text-amber-500" /> 75&apos;+ Audio Alerts
                </span>
                <p className="text-xs font-mono font-black tabular-nums text-foreground mt-0.5">
                  APm / Goal Chime
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-emerald-600" /> Rollover Vault
                </span>
                <p className="text-xs font-mono font-black tabular-nums text-foreground mt-0.5">
                  3D / 5D / 7D + Skim
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Matchday Command Bar (All 4 Top-Site Suites Across Full Slate) */}
        <TopSiteMatchdayCommandBar predictions={predictions} />

        {/* Deep-Dive Fixture Selector & Interactive 6-Tab MatchProAnalyticsWidget */}
        {activePrediction && activePro && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Fixture Selector List */}
            <div className="lg:col-span-4 rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    Select Fixture to Inspect
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Click any match to run its Starting XI Simulator &amp; Line-Movement Curve
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold tabular-nums text-muted-foreground">
                  {filteredPredictions.length} matches
                </span>
              </div>

              {/* Competition Filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedLeague('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedLeague === 'ALL'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Leagues
                </button>
                {leagues.map((lg) => (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setSelectedLeague(lg)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedLeague === lg
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lg}
                  </button>
                ))}
              </div>

              {/* Match List */}
              <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredPredictions.map((match) => {
                  const isSelected = match.id === activePrediction.id;
                  const matchAnalytics = computeProMatchAnalytics(match);
                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setSelectedMatchId(match.id)}
                      className={`w-full text-left rounded-lg border p-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-2xs'
                          : 'border-border/60 bg-background/60 hover:border-primary/40 hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground mb-1">
                        <span className="font-semibold truncate">{match.league}</span>
                        <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          +{matchAnalytics.bestValueEdgePct.toFixed(1)}% EV · APm {matchAnalytics.attackPressureIndex}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamLogo teamName={match.home_team} size="sm" className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold text-foreground truncate">
                            {match.home_team} vs {match.away_team}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold tabular-nums text-primary shrink-0">
                          {match.confidence}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Fixture Header + Full 6-Tab MatchProAnalyticsWidget */}
            <div className="lg:col-span-8 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <TeamLogo teamName={activePrediction.home_team} size="md" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      {activePrediction.league} · Deep Quantitative Inspection
                    </p>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground truncate">
                      {activePrediction.home_team} vs {activePrediction.away_team}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      Model Pick: <strong className="text-foreground">{activePrediction.prediction}</strong> ({activePrediction.confidence}% conf) · Peak Goal Window{' '}
                      {activePro.goalIntervals.find((i) => i.isPeak)?.window || "76'–90+'"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      addSelection({
                        match: `${activePrediction.home_team} vs ${activePrediction.away_team}`,
                        homeTeam: activePrediction.home_team,
                        awayTeam: activePrediction.away_team,
                        league: activePrediction.league,
                        matchDate: activePrediction.match_date,
                        market: activePro.bestValueSide,
                        odds: activePro.bestValueOdds,
                        confidence: activePrediction.confidence,
                      });
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold font-mono tabular-nums transition-all cursor-pointer ${
                      isInSlip(
                        `${activePrediction.home_team} vs ${activePrediction.away_team}`,
                        activePro.bestValueSide
                      )
                        ? 'bg-emerald-700 text-white'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isInSlip(
                      `${activePrediction.home_team} vs ${activePrediction.away_team}`,
                      activePro.bestValueSide
                    ) ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Added ({activePro.bestValueSide})
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Add {activePro.bestValueSide} @{' '}
                        {formatOdds(activePro.bestValueOdds)}
                      </>
                    )}
                  </button>

                  <Link
                    to={`/predict/${formatMatchSlug(activePrediction.home_team, activePrediction.away_team)}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 hover:bg-muted px-3 py-2 text-xs font-bold text-foreground transition-colors"
                  >
                    Full Match Page <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  </Link>
                </div>
              </div>

              <MatchProAnalyticsWidget prediction={activePrediction} defaultTab="steam" />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
