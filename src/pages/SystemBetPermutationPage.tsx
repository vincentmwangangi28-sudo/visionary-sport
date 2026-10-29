import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';
import {
  Layers,
  Calculator,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  PHASE13_CURRENCIES,
  SupportedCurrency,
  SYSTEM_BET_PRESETS,
  SystemBetPresetId,
  SystemLegItem,
  computeSystemBetPermutations,
} from '@/services/phase15PropSystemService';

const INITIAL_SYSTEM_LEGS: SystemLegItem[] = [
  { id: 1, label: 'Arsenal vs Chelsea — Over 2.5 Goals', odds: 1.85, status: 'won' },
  { id: 2, label: 'Real Madrid vs Bayern — BTTS Yes', odds: 1.78, status: 'won' },
  { id: 3, label: 'Liverpool vs Newcastle — Home Win (1)', odds: 1.92, status: 'won' },
  { id: 4, label: 'Inter Milan vs Juventus — Under 2.5 Goals', odds: 2.05, status: 'lost' },
  { id: 5, label: 'Dortmund vs Leipzig — Over 9.5 Corners', odds: 1.88, status: 'won' },
  { id: 6, label: 'Al Ahly vs Espérance — Home -0.5 AH', odds: 1.95, status: 'won' },
];

export const SystemBetPermutationPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [presetId, setPresetId] = useState<SystemBetPresetId>('yankee');
  const [unitStake, setUnitStake] = useState<string>('5');
  const [legs, setLegs] = useState<SystemLegItem[]>(INITIAL_SYSTEM_LEGS);

  const currencyMeta = PHASE13_CURRENCIES[currency];

  const handleCurrencyChange = (nextCur: SupportedCurrency) => {
    const prevRate = PHASE13_CURRENCIES[currency].rateFromUsd;
    const nextRate = PHASE13_CURRENCIES[nextCur].rateFromUsd;
    const ratio = nextRate / prevRate;
    const curUnit = parseFloat(unitStake) || 5;
    setCurrency(nextCur);
    setUnitStake(String(Math.max(1, Math.round(curUnit * ratio))));
  };

  const sim = useMemo(
    () =>
      computeSystemBetPermutations(
        presetId,
        parseFloat(unitStake) || 1,
        legs
      ),
    [presetId, unitStake, legs]
  );

  const activeLegs = legs.slice(0, sim.preset.selectionsCount);

  const updateLegOdds = (id: number, val: string) => {
    const parsed = parseFloat(val);
    setLegs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, odds: isNaN(parsed) ? 1.01 : parsed } : l))
    );
  };

  const updateLegLabel = (id: number, label: string) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, label } : l)));
  };

  const cycleLegStatus = (id: number) => {
    const order: Array<'won' | 'lost' | 'void'> = ['won', 'lost', 'void'];
    setLegs((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: order[(order.indexOf(l.status) + 1) % order.length] }
          : l
      )
    );
  };

  const fmtMoney = (val: number) =>
    `${currencyMeta.symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: currencyMeta.decimals,
      maximumFractionDigits: currencyMeta.decimals,
    })}`;

  const handleLoadActiveLegsToSlip = () => {
    activeLegs.forEach((leg) => {
      const parts = leg.label.split('—');
      const matchPart = parts[0]?.trim() || `Selection #${leg.id}`;
      const pickPart = parts[1]?.trim() || 'System Pick';
      const teams = matchPart.split('vs');
      addSelection({
        id: `sys-leg-${leg.id}-${Date.now()}`,
        homeTeam: teams[0]?.trim() || matchPart,
        awayTeam: teams[1]?.trim() || 'Opponent',
        league: sim.preset.name,
        kickoff: 'Today',
        market: pickPart,
        selection: pickPart,
        odds: leg.odds,
        confidence: 78,
      });
    });
    setIsOpen(true);
    toast.success(`Loaded ${activeLegs.length} legs (${sim.preset.name}) into Bet Slip`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="System Bet & Permutation Calculator: Trixie, Yankee, Lucky 15, Canadian & Heinz | PredictPro"
        description="Interactive sports betting System Bet Calculator for Trixie (4 bets), Patent (7), Yankee (11), Lucky 15 (15), Canadian (26), Heinz (57), and 3/5 or 4/6 Round Robins."
        keywords="system bet calculator, trixie calculator, yankee bet calculator, lucky 15 calculator, canadian bet calculator, heinz bet calculator, round robin betting"
        canonical="/system-bet-calculator"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'System Bet & Permutation Simulator' },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Combinatorial Risk Shield</span>
                <span aria-hidden="true">·</span>
                <span>Trixie · Yankee · Lucky 15 · Canadian · Heinz</span>
                <span aria-hidden="true">·</span>
                <span>k-of-n Round Robins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                System Bet &amp; Fault-Tolerant Permutation Simulator
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Straight accumulators fail completely when a single 90th-minute goal goes against you. Use combinatorial system tickets to lock in profitable returns even when <strong>1, 2, or 3 legs miss</strong>.
              </p>
            </div>

            {/* Currency Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-lg border border-border self-start">
              {(Object.keys(PHASE13_CURRENCIES) as SupportedCurrency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => handleCurrencyChange(cur)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currency === cur
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 8 System Preset Selector Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Select System Architecture ({sim.preset.totalBetsCount} Permutations)
            </h2>
            <span className="text-xs text-muted-foreground">{sim.preset.description}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {SYSTEM_BET_PRESETS.map((p) => {
              const active = p.id === presetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-primary bg-primary/10 shadow-2xs'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <p className="text-xs font-bold text-foreground truncate">{p.name.split('(')[0].trim()}</p>
                  <p className="text-[11px] font-mono tabular-nums text-primary font-semibold mt-0.5">
                    {p.totalBetsCount} Bets ({p.selectionsCount} Picks)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Min {p.minLegsToReturn}/{p.selectionsCount} to return
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Unit Stake & Leg Status Controls */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  {sim.preset.name} — Leg Editor
                </h2>
              </div>
              <Button
                size="sm"
                onClick={handleLoadActiveLegsToSlip}
                className="whitespace-nowrap shrink-0 gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Send to Slip</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Unit Stake per Combination ({currencyMeta.symbol})
                </label>
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  value={unitStake}
                  onChange={(e) => setUnitStake(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Total Ticket Outlay ({sim.totalCombinations} × Unit)
                </label>
                <div className="h-9 px-3 rounded-md border border-border bg-muted/50 flex items-center font-mono tabular-nums text-sm font-bold text-foreground">
                  {fmtMoney(sim.totalOutlay)}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Selections ({activeLegs.length})</span>
                <span>Click status button to toggle WON / LOST / VOID</span>
              </div>

              {activeLegs.map((leg) => (
                <div
                  key={leg.id}
                  className="p-3 rounded-lg border border-border bg-background/60 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      type="text"
                      value={leg.label}
                      onChange={(e) => updateLegLabel(leg.id, e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-primary"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Leg #{leg.id} Odds:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1.01"
                        value={leg.odds}
                        onChange={(e) => updateLegOdds(leg.id, e.target.value)}
                        className="w-20 rounded border border-border bg-card px-2 py-0.5 text-xs font-mono tabular-nums font-bold text-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => cycleLegStatus(leg.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      leg.status === 'won'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : leg.status === 'lost'
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    }`}
                  >
                    {leg.status === 'won' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : leg.status === 'lost' ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <MinusCircle className="h-3.5 w-3.5" />
                    )}
                    <span className="uppercase">{leg.status}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Payout Breakdown & Fault-Tolerance Table */}
          <div className="lg:col-span-7 space-y-5">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Outlay</p>
                <p className="text-lg font-bold font-mono tabular-nums text-foreground mt-1">
                  {fmtMoney(sim.totalOutlay)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  {sim.totalCombinations} combinations
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Winning Combinations</p>
                <p className="text-lg font-bold font-mono tabular-nums text-primary mt-1">
                  {sim.winningBetsCount} / {sim.totalCombinations}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active winning lines</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Gross System Return</p>
                <p className="text-lg font-bold font-mono tabular-nums text-foreground mt-1">
                  {fmtMoney(sim.grossReturn)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  Includes stake return
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Net Profit &amp; Yield</p>
                <p
                  className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                    sim.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {sim.netProfit >= 0 ? '+' : ''}
                  {fmtMoney(sim.netProfit)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  ROI: {sim.roiPct >= 0 ? '+' : ''}
                  {sim.roiPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Fold-by-Fold Combinatorial Breakdown */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Fold-by-Fold Permutation Breakdown ({sim.preset.name})</span>
                </h3>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  Unit Stake: {fmtMoney(sim.unitStake)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Combination Tier</th>
                      <th className="py-3 px-4 font-semibold">Total Lines</th>
                      <th className="py-3 px-4 font-semibold">Winning Lines</th>
                      <th className="py-3 px-4 font-semibold text-right">Tier Gross Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono tabular-nums">
                    {sim.foldBreakdown.map((fb) => (
                      <tr key={fb.foldSize}>
                        <td className="py-3 px-4 font-sans font-bold text-foreground">
                          {fb.foldLabel}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{fb.totalCombinations}</td>
                        <td className="py-3 px-4 font-bold text-primary">
                          {fb.winningCombinations} / {fb.totalCombinations}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-foreground">
                          {fmtMoney(fb.grossReturn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fault-Tolerant Stress Test Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Fault-Tolerance Stress Test (System Ticket vs Straight Accumulator)</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  What happens when 1, 2, or 3 legs lose?
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Outcome Scenario</th>
                      <th className="py-3 px-4 font-semibold">System Gross Return</th>
                      <th className="py-3 px-4 font-semibold">System Net Profit</th>
                      <th className="py-3 px-4 font-semibold">System ROI%</th>
                      <th className="py-3 px-4 font-semibold text-right">Straight Acca Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono tabular-nums">
                    {sim.faultToleranceTable.map((row) => (
                      <tr key={row.legsLostCount}>
                        <td className="py-3.5 px-4 font-sans font-bold text-foreground">
                          {row.scenarioLabel}
                        </td>
                        <td className="py-3.5 px-4 text-foreground">
                          {fmtMoney(row.systemGrossReturn)}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            row.systemNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {row.systemNetProfit >= 0 ? '+' : ''}
                          {fmtMoney(row.systemNetProfit)}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            row.systemRoiPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {row.systemRoiPct >= 0 ? '+' : ''}
                          {row.systemRoiPct.toFixed(1)}%
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            row.straightAccaNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {row.straightAccaNetProfit >= 0 ? '+' : ''}
                          {fmtMoney(row.straightAccaNetProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Looking to split stakes across multiple Correct Scores on a single match instead?
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/dutching-calculator"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Dutching Calculator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/asian-handicap-calculator"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Asian Quarter-Line Matrix</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SystemBetPermutationPage;
