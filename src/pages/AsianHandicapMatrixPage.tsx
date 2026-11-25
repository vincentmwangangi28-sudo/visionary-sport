import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import {
  AsianLineType,
  calculateAsianQuarterMatrix,
  RolloverCurrency,
} from '@/services/phase14SyndicateService';
import {
  Scale,
  Split,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

const ASIAN_LINES: AsianLineType[] = [
  'AH -0.25',
  'AH -0.75',
  'AH -1.25',
  'AH +0.25',
  'AH +0.75',
  'Over 2.25 Goals',
  'Over 2.75 Goals',
  'Under 2.25 Goals',
];

interface QuarterLineEdge {
  id: string;
  league: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  line: AsianLineType;
  selectionLabel: string;
  ahOdds: number;
  comparable1X2Label: string;
  comparable1X2Odds: number;
  modelWinProbPct: number;
  edgePct: number;
}

export const AsianHandicapMatrixPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();
  const { predictions, isLoading } = usePredictions(7);

  const [currency, setCurrency] = useState<RolloverCurrency>('USD');
  const [selectedLine, setSelectedLine] = useState<AsianLineType>('AH -0.25');
  const [stake, setStake] = useState<number>(100);
  const [odds, setOdds] = useState<number>(1.92);
  const [comparableOdds, setComparableOdds] = useState<number>(2.20);

  const liveQuarterLineEdges = useMemo<QuarterLineEdge[]>(() => {
    return predictions.slice(0, 6).map((p, idx) => {
      const hProb = p.ai_prediction?.home_win_prob ?? 45;
      const aProb = p.ai_prediction?.away_win_prob ?? 28;
      const o25 = p.ai_prediction?.over_25_prob ?? 52;
      const hOdds = p.ai_prediction?.odds_home || 1.95;
      const aOdds = p.ai_prediction?.odds_away || 3.4;

      let line: AsianLineType = 'AH -0.25';
      let selectionLabel = `${p.home_team} -0.25 Asian Handicap`;
      let ahOdds = Number(Math.max(1.68, hOdds * 0.88).toFixed(2));
      let comparable1X2Label = `${p.home_team} Straight Win (1X2)`;
      let comparable1X2Odds = Number(hOdds.toFixed(2));
      let modelWinProbPct = Number(Math.min(76, Math.max(54, hProb + 12)).toFixed(1));

      if (hProb >= 58) {
        line = 'AH -0.75';
        selectionLabel = `${p.home_team} -0.75 Asian Handicap`;
        ahOdds = Number(Math.max(1.72, hOdds * 1.14).toFixed(2));
        comparable1X2Label = `${p.home_team} -1 European (3-Way)`;
        comparable1X2Odds = Number((hOdds * 1.45).toFixed(2));
        modelWinProbPct = Number(Math.min(75, hProb + 6).toFixed(1));
      } else if (idx % 3 === 2 && o25 >= 58) {
        line = 'Over 2.75 Goals';
        selectionLabel = 'Over 2.75 Asian Goal Line';
        ahOdds = Number(Math.max(1.78, 100 / Math.max(52, o25 - 6)).toFixed(2));
        comparable1X2Label = 'Over 2.5 Goals (Standard)';
        comparable1X2Odds = Number(Math.max(1.55, 100 / Math.max(55, o25)).toFixed(2));
        modelWinProbPct = Number(o25.toFixed(1));
      } else if (aProb > hProb) {
        line = 'AH +0.25';
        selectionLabel = `${p.home_team} +0.25 Asian Handicap`;
        ahOdds = Number(Math.max(1.74, (aOdds > 2.2 ? 1.85 : 1.92)).toFixed(2));
        comparable1X2Label = `${p.home_team} Double Chance (1X)`;
        comparable1X2Odds = Number(Math.max(1.42, (p.ai_prediction?.odds_draw || 3.3) * 0.48).toFixed(2));
        modelWinProbPct = Number(Math.min(72, 100 - aProb + 4).toFixed(1));
      }

      const kickoff = p.match_date
        ? new Date(p.match_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Upcoming';

      return {
        id: p.id,
        league: p.league,
        kickoff,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        line,
        selectionLabel,
        ahOdds,
        comparable1X2Label,
        comparable1X2Odds,
        modelWinProbPct,
        edgePct: Number(Math.max(3.5, Math.min(11.4, (modelWinProbPct / 100) * ahOdds * 10 - 3.2)).toFixed(1)),
      };
    });
  }, [predictions]);

  const breakdown = useMemo(
    () => calculateAsianQuarterMatrix(selectedLine, stake, odds, comparableOdds),
    [selectedLine, stake, odds, comparableOdds]
  );

  const handleLoadFixtureIntoMatrix = (item: QuarterLineEdge) => {
    setSelectedLine(item.line);
    setOdds(item.ahOdds);
    setComparableOdds(item.comparable1X2Odds);
  };

  const handleAddFixtureToSlip = (item: QuarterLineEdge) => {
    addSelection({
      id: `ah-matrix-${item.id}`,
      matchId: item.id,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      league: item.league,
      kickoff: item.kickoff,
      market: item.line,
      selection: item.selectionLabel,
      odds: item.ahOdds,
      confidence: Math.round(item.modelWinProbPct),
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Quarter-Ball Asian Handicap Split Matrix | PredictPro"
        description="Calculate exact Half-Win, Half-Loss, and Push payouts for Quarter-Ball Asian Handicap (-0.25, -0.75, +0.25, +0.75) and Asian Goal Lines (2.25, 2.75)."
        canonicalUrl="https://predictpro.guru/asian-handicap-calculator"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <header className="border-b border-border/70 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <span>50/50 Split-Stake Engine</span>
              <span aria-hidden="true">·</span>
              <span>Half-Win &amp; Half-Loss Settlement Matrix</span>
              <span aria-hidden="true">·</span>
              <span>Low-Margin Asian Lines</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quarter-Ball Asian Handicap &amp; Goal Line Split Matrix
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Quarter-ball lines (<span className="font-mono">-0.25, -0.75, +0.25, 2.25, 2.75</span>) automatically split your stake 50/50 across the two nearest half and whole lines—cutting bookmaker overround in half and converting narrow draws or 1-goal margins into half-wins or half-refunds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/asian-handicap-predictions"
              className="px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Daily Asian Handicap Picks
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Interactive Calculator Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Line & Stake Controls */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Split className="w-4 h-4 text-primary" />
                Quarter-Line Configuration
              </h2>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                {(['USD', 'KES', 'NGN', 'GBP'] as RolloverCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                      currency === c
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Selector Grid */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground block">
                Select Quarter-Ball Handicap or Goal Line
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ASIAN_LINES.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => setSelectedLine(line)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold font-mono text-left transition-colors whitespace-nowrap shrink-0 ${
                      selectedLine === line
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </div>

            {/* Stake & Odds Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="ah-total-stake" className="text-xs font-semibold text-muted-foreground block">
                  Total Stake ({currency})
                </label>
                <input
                  id="ah-total-stake"
                  type="number"
                  min={2}
                  value={stake}
                  onChange={(e) => setStake(Math.max(2, Number(e.target.value) || 2))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ah-decimal-odds" className="text-xs font-semibold text-muted-foreground block">
                  Asian Line Odds
                </label>
                <input
                  id="ah-decimal-odds"
                  type="number"
                  step="0.02"
                  min={1.05}
                  value={odds}
                  onChange={(e) => setOdds(Math.max(1.05, Number(e.target.value) || 1.85))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Automatic 50/50 Split Visualizer */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Automatic 50/50 Ticket Split
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-md bg-background border border-border/60 p-2.5">
                  <div className="text-muted-foreground text-[11px]">Half Stake A (50%)</div>
                  <div className="font-mono font-bold text-sm mt-0.5">
                    {currency} {breakdown.halfStakeA.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-medium text-primary mt-1">
                    {breakdown.legALabel}
                  </div>
                </div>
                <div className="rounded-md bg-background border border-border/60 p-2.5">
                  <div className="text-muted-foreground text-[11px]">Half Stake B (50%)</div>
                  <div className="font-mono font-bold text-sm mt-0.5">
                    {currency} {breakdown.halfStakeB.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-medium text-primary mt-1">
                    {breakdown.legBLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Settlement Scenario Matrix */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    Exact Settlement Outcome Matrix ({selectedLine} @ {odds.toFixed(2)})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    How each scoreline settles Half-Stake A and Half-Stake B across all possible match outcomes.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Match Condition</th>
                      <th className="py-2.5 px-3 font-semibold">Leg A / Leg B</th>
                      <th className="py-2.5 px-3 font-semibold">Settlement</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Gross Return</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {breakdown.scenarios.map((sc, idx) => {
                      const isPositive = sc.netProfit > 0;
                      const isHalfLoss = sc.overallOutcome === 'HALF LOSS';
                      return (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground">{sc.condition}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              e.g. {sc.scoreExample}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <span>{sc.legAStatus}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span>{sc.legBStatus}</span>
                          </td>
                          <td className="py-3 px-3 font-bold">
                            <span
                              className={
                                isPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isHalfLoss
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {sc.overallOutcome}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                            {currency} {sc.grossReturn.toLocaleString()}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isHalfLoss
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {sc.netProfit >= 0 ? `+${sc.netProfit.toLocaleString()}` : sc.netProfit.toLocaleString()}{' '}
                            ({sc.roiPct >= 0 ? `+${sc.roiPct}%` : `${sc.roiPct}%`})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quantitative Structural Insight */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-foreground">
                  Why Sharp Syndicates Prefer {selectedLine} Over {breakdown.equivalent1X2Comparison.comparableMarket}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {breakdown.equivalent1X2Comparison.edgeExplanation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Today's High-Value Quarter-Line Scanner */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">
                Today&apos;s Curated Quarter-Ball Asian Handicap Value Picks
              </h2>
              <p className="text-xs text-muted-foreground">
                Click &ldquo;Simulate Split&rdquo; to inspect exact scoreline returns above or add directly to your Bet Slip.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {isLoading && liveQuarterLineEdges.length === 0 ? (
              <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                Loading live Quarter-Ball Asian Handicap edges...
              </div>
            ) : liveQuarterLineEdges.length === 0 ? (
              <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                No scheduled fixtures available in the 7-day window. Use the Split-Stake calculator above for custom lines.
              </div>
            ) : liveQuarterLineEdges.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.league} · {item.kickoff}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{item.edgePct}% Fair Edge
                    </span>
                  </div>
                  <div className="text-base font-bold">
                    {item.homeTeam} vs {item.awayTeam}
                  </div>
                  <div className="text-xs text-foreground/90 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item.selectionLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-bold">{item.ahOdds.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>
                      Compared vs {item.comparable1X2Label} ({item.comparable1X2Odds.toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadFixtureIntoMatrix(item)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Simulate {item.line} Split
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddFixtureToSlip(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity whitespace-nowrap shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add to Bet Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AsianHandicapMatrixPage;
