import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  TODAY_CORNER_PRESSURE_FIXTURES,
  computeCornerPoissonProbabilities,
  CornerMatchProjection,
} from '@/services/phase14SyndicateService';
import {
  Flag,
  Calculator,
  PlusCircle,
  ArrowRight,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

export const CornerPressureScannerPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [minEdgeFilter, setMinEdgeFilter] = useState<number>(0);

  // Interactive Custom Corner Poisson Calculator State
  const [homeForPer90, setHomeForPer90] = useState<number>(6.8);
  const [awayAgainstPer90, setAwayAgainstPer90] = useState<number>(5.2);
  const [awayForPer90, setAwayForPer90] = useState<number>(5.1);
  const [homeAgainstPer90, setHomeAgainstPer90] = useState<number>(4.3);

  const customExpectedTotal = useMemo(() => {
    const expHome = (homeForPer90 + awayAgainstPer90) / 2;
    const expAway = (awayForPer90 + homeAgainstPer90) / 2;
    return Number((expHome + expAway).toFixed(2));
  }, [homeForPer90, awayAgainstPer90, awayForPer90, homeAgainstPer90]);

  const customPoisson = useMemo(
    () => computeCornerPoissonProbabilities(customExpectedTotal),
    [customExpectedTotal]
  );

  const leagues = useMemo(() => {
    const set = new Set(TODAY_CORNER_PRESSURE_FIXTURES.map((f) => f.league));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredFixtures = useMemo(() => {
    return TODAY_CORNER_PRESSURE_FIXTURES.filter((f) => {
      if (selectedLeague !== 'ALL' && f.league !== selectedLeague) return false;
      if (f.edgePct < minEdgeFilter) return false;
      return true;
    });
  }, [selectedLeague, minEdgeFilter]);

  const handleAddCornerPickToSlip = (item: CornerMatchProjection) => {
    addSelection({
      id: `corner-edge-${item.id}`,
      matchId: item.id,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      league: item.league,
      kickoff: item.kickoff,
      market: 'Corners',
      selection: item.recommendedMarket,
      odds: item.bookieOdds,
      confidence: Math.round(item.over95ProbPct),
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Corner Kick Pressure Scanner & Per-90 Poisson Corner Calculator | PredictPro"
        description="Per-90 team corner won/conceded matrix, First-Half Over 4.5 Corners tempo, and Poisson Over 8.5 / 9.5 / 10.5 Corners & Corner Handicap scanner."
        canonicalUrl="https://predictpro.guru/corner-stats-scanner"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <header className="border-b border-border/70 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Per-90 Wing Cross &amp; Corner Tempo</span>
              <span aria-hidden="true">·</span>
              <span>First-Half 4.5 Corner Radar</span>
              <span aria-hidden="true">·</span>
              <span>Poisson Corner Handicap Pricing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Corner Kick Pressure Scanner &amp; Per-90 Poisson Matrix
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bookmakers frequently misprice Asian Corner Totals (<span className="font-mono">Over 9.5 / 10.5</span>) and 1st-Half Corner markets when high-width wing teams face low-block defenses. Scan today&apos;s highest-edge corner spots or run custom Poisson simulations below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/corners-predictions"
              className="px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Daily Corners Predictions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Interactive Custom Corner Poisson Simulator */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-border/60 pb-3">
              <Calculator className="w-4 h-4 text-primary" />
              Custom Match Corner Poisson Calculator
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="home-corners-for" className="text-muted-foreground font-semibold block">
                  Home Corners Won / 90
                </label>
                <input
                  id="home-corners-for"
                  type="number"
                  step="0.2"
                  min={1}
                  max={12}
                  value={homeForPer90}
                  onChange={(e) => setHomeForPer90(Number(e.target.value) || 5.5)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="away-corners-against" className="text-muted-foreground font-semibold block">
                  Away Corners Conceded / 90
                </label>
                <input
                  id="away-corners-against"
                  type="number"
                  step="0.2"
                  min={1}
                  max={12}
                  value={awayAgainstPer90}
                  onChange={(e) => setAwayAgainstPer90(Number(e.target.value) || 5.0)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="away-corners-for" className="text-muted-foreground font-semibold block">
                  Away Corners Won / 90
                </label>
                <input
                  id="away-corners-for"
                  type="number"
                  step="0.2"
                  min={1}
                  max={12}
                  value={awayForPer90}
                  onChange={(e) => setAwayForPer90(Number(e.target.value) || 4.5)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="home-corners-against" className="text-muted-foreground font-semibold block">
                  Home Corners Conceded / 90
                </label>
                <input
                  id="home-corners-against"
                  type="number"
                  step="0.2"
                  min={1}
                  max={12}
                  value={homeAgainstPer90}
                  onChange={(e) => setHomeAgainstPer90(Number(e.target.value) || 4.0)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Poisson Corner Line Fair Odds &amp; True Probabilities
                </h2>
                <p className="text-xs text-muted-foreground">
                  Projected Match Total:{' '}
                  <strong className="font-mono text-foreground">
                    {customPoisson.expectedTotalCorners} Corners
                  </strong>{' '}
                  · Projected 1st Half:{' '}
                  <strong className="font-mono text-foreground">
                    {customPoisson.expectedFirstHalfCorners} Corners
                  </strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                { label: 'Over 8.5', prob: customPoisson.over85ProbPct },
                { label: 'Over 9.5', prob: customPoisson.over95ProbPct },
                { label: 'Over 10.5', prob: customPoisson.over105ProbPct },
                { label: 'Over 11.5', prob: customPoisson.over115ProbPct },
                { label: '1H Over 4.5', prob: customPoisson.firstHalfOver45ProbPct },
              ].map((line) => {
                const fairOdds = line.prob > 1 ? (100 / line.prob).toFixed(2) : '99.00';
                return (
                  <div
                    key={line.label}
                    className="rounded-lg border border-border/70 bg-background p-3 space-y-1"
                  >
                    <div className="text-muted-foreground font-semibold">{line.label}</div>
                    <div className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {line.prob}%
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Fair: <strong className="text-foreground">{fairOdds}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filter Bar & Today's Corner Pressure Table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                Today&apos;s High-Tempo Corner &amp; Wing-Cross Pressure Fixtures
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing fixtures with elevated wing-cross volume and positive EV vs bookmaker corner lines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                {leagues.map((lg) => (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setSelectedLeague(lg)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedLeague === lg
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lg}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <select
                  value={minEdgeFilter}
                  onChange={(e) => setMinEdgeFilter(Number(e.target.value))}
                  aria-label="Minimum edge filter"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono"
                >
                  <option value={0}>All Edges (0%+)</option>
                  <option value={7}>+7.0% Min Edge</option>
                  <option value={9}>+9.0% Min Edge</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Fixture &amp; League</th>
                  <th className="py-3 px-3 font-semibold text-right">Home/Away For</th>
                  <th className="py-3 px-3 font-semibold text-right">Proj. Total</th>
                  <th className="py-3 px-3 font-semibold text-right">O9.5 / O10.5 %</th>
                  <th className="py-3 px-3 font-semibold text-right">1H O4.5 %</th>
                  <th className="py-3 px-4 font-semibold">Recommended Value Line</th>
                  <th className="py-3 px-3 font-semibold text-right">Bookie / Fair</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredFixtures.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/25 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">
                        {item.homeTeam} vs {item.awayTeam}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.league} · {item.kickoff} · Wing Tempo {item.wingCrossIntensityIndex}/100
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {item.homeCornersForPer90.toFixed(1)} / {item.awayCornersForPer90.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-primary">
                      {item.projectedTotalCorners.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {item.over95ProbPct}% / {item.over105ProbPct}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {item.firstHalfOver45ProbPct}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{item.recommendedMarket}</div>
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        +{item.edgePct.toFixed(1)}% Model Edge
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      <span className="font-bold text-foreground">{item.bookieOdds.toFixed(2)}</span>
                      <span className="text-muted-foreground"> / {item.fairOdds.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleAddCornerPickToSlip(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-primary" />
                        Add to Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CornerPressureScannerPage;
