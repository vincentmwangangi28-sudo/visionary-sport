import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  computeRolloverLadder,
  DEFAULT_ROLLOVER_STEPS,
  RolloverCurrency,
} from '@/services/phase14SyndicateService';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  PlusCircle,
  Lock,
  Layers,
  Calculator,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY_COMPLETED_DAYS = 'predictpro_rollover_completed_days_v1';

const CURRENCY_DEFAULTS: Record<RolloverCurrency, number> = {
  USD: 25,
  KES: 1000,
  NGN: 10000,
  GHS: 250,
  ZAR: 400,
  GBP: 20,
};

export const RolloverLadderSimulatorPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [currency, setCurrency] = useState<RolloverCurrency>('KES');
  const [initialStake, setInitialStake] = useState<number>(1000);
  const [targetDays, setTargetDays] = useState<number>(7);
  const [skimPercent, setSkimPercent] = useState<number>(20);
  const [useCustomUniformOdds, setUseCustomUniformOdds] = useState<boolean>(false);
  const [customOdds, setCustomOdds] = useState<number>(1.55);

  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_DAYS);
      return raw ? JSON.parse(raw) : [1, 2];
    } catch {
      return [1, 2];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify(completedDays));
    } catch {
      // ignore storage errors
    }
  }, [completedDays]);

  const handleCurrencyChange = (nextCurr: RolloverCurrency) => {
    setCurrency(nextCurr);
    setInitialStake(CURRENCY_DEFAULTS[nextCurr]);
  };

  const ladder = useMemo(
    () =>
      computeRolloverLadder(
        initialStake,
        targetDays,
        skimPercent,
        useCustomUniformOdds ? customOdds : undefined,
        DEFAULT_ROLLOVER_STEPS
      ),
    [initialStake, targetDays, skimPercent, useCustomUniformOdds, customOdds]
  );

  const toggleDayCompleted = (day: number) => {
    setCompletedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handlePushStepToSlip = (row: (typeof ladder.rows)[0]) => {
    const [homeTeam, awayTeam] = row.fixtureLabel.split(' vs ').map((s) => s.trim());
    addSelection({
      id: `rollover-day-${row.day}`,
      matchId: `rollover-match-${row.day}`,
      homeTeam: homeTeam || row.fixtureLabel,
      awayTeam: awayTeam || 'Opponent',
      league: row.league,
      kickoff: `Day ${row.day} Banker`,
      market: row.selection,
      selection: row.selection,
      odds: row.odds,
      confidence: Math.round(row.modelProbPct),
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Compound Rollover & Profit-Skimming Ladder Simulator | PredictPro"
        description="Interactive 3-Day, 7-Day & 10-Day compound football rollover planner with Partial Profit Skimming so you bank guaranteed profit at every step without risking a final-day bust."
        canonicalUrl="https://predictpro.guru/rollover-challenge"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <header className="border-b border-border/70 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Bankroll Compounding Engine</span>
              <span aria-hidden="true">·</span>
              <span>Anti-Bust Profit Skimming</span>
              <span aria-hidden="true">·</span>
              <span>Daily 1.50x–1.65x Bankers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Compound Rollover &amp; Profit-Skimming Bankroll Ladder
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard full-compound rollovers wipe out 100% of your accumulated equity on a single late-day upset. Use our{' '}
              <strong className="text-foreground">Partial Profit Skim</strong> strategy to lock away 15%–35% of each day&apos;s profit into your safe vault while compounding the rest.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/rollover-bets-predictions"
              className="px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Today&apos;s Rollover Tips
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setCompletedDays([])}
              className="px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Ladder Progress
            </button>
          </div>
        </header>

        {/* Controls & Summary Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuration Card */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Ladder Parameters
              </h2>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                {(['KES', 'NGN', 'USD', 'GHS', 'ZAR', 'GBP'] as RolloverCurrency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                      currency === curr
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Day 1 Starting Stake */}
            <div className="space-y-1.5">
              <label htmlFor="rollover-initial-stake" className="text-xs font-semibold text-muted-foreground block">
                Day 1 Starting Stake ({currency})
              </label>
              <input
                id="rollover-initial-stake"
                type="number"
                min={1}
                value={initialStake}
                onChange={(e) => setInitialStake(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Challenge Duration */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground block">
                Ladder Horizon ({targetDays} Days)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[3, 5, 7, 8, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDays(d)}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold font-mono tabular-nums transition-colors whitespace-nowrap shrink-0 ${
                      targetDays === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Profit Skim Strategy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  Daily Profit Skim to Safe Vault
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {skimPercent}% Skimmed / {100 - skimPercent}% Compounded
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '0% (All-In)', val: 0 },
                  { label: '15% Safe', val: 15 },
                  { label: '25% Balanced', val: 25 },
                  { label: '35% Vault', val: 35 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setSkimPercent(preset.val)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      skimPercent === preset.val
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={skimPercent}
                onChange={(e) => setSkimPercent(Number(e.target.value))}
                aria-label="Profit skim percentage"
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Custom Odds Override Toggle */}
            <div className="pt-2 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Odds Source Mode
                </span>
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUseCustomUniformOdds(false)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      !useCustomUniformOdds
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Curated AI Bankers
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomUniformOdds(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      useCustomUniformOdds
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Fixed Daily Odds
                  </button>
                </div>
              </div>

              {useCustomUniformOdds && (
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="custom-daily-odds" className="text-xs text-muted-foreground">
                    Target Daily Odds (1.20x – 2.50x)
                  </label>
                  <input
                    id="custom-daily-odds"
                    type="number"
                    step="0.05"
                    min="1.15"
                    max="3.00"
                    value={customOdds}
                    onChange={(e) => setCustomOdds(Math.max(1.15, Number(e.target.value) || 1.5))}
                    className="w-28 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono tabular-nums text-right"
                  />
                </div>
              )}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Day {ladder.targetDays} Total Equity (Pot + Skimmed)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {currency} {ladder.grandTotalEquity.toLocaleString()}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Net Capital Multiplier</span>
                <span className="font-mono font-bold text-foreground">
                  {ladder.netRoiMultiple}xInitial Stake
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Protected Vault (Locked Even If Final Day Busts)</span>
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-foreground">
                  {currency} {ladder.totalSkimmedSafe.toLocaleString()}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Initial Capital Recovery</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {((ladder.totalSkimmedSafe / ladder.initialStake) * 100).toFixed(0)}% of Day 1 Stake
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Final Reinvested Rollover Pot</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
                  {currency} {ladder.finalReinvestedPot.toLocaleString()}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Skim Rule</span>
                <span className="font-mono font-semibold">
                  {ladder.skimPercent}% Banked Per Step
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Full {ladder.targetDays}-Day Survival Probability</span>
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
                  {ladder.overallSurvivalProbPct}%
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Completed Steps Checked</span>
                <span className="font-mono font-bold text-primary">
                  {completedDays.filter((d) => d <= ladder.targetDays).length} / {ladder.targetDays} Days
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Compounding Schedule Table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">
                Step-by-Step Rollover Schedule &amp; Daily Banker Queue
              </h2>
              <p className="text-xs text-muted-foreground">
                Check off completed days to track your real-world progression or push any daily banker directly to your Bet Slip.
              </p>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Currency: <strong className="text-foreground">{currency}</strong> · Skim:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{skimPercent}%</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Step</th>
                  <th className="py-3 px-4 font-semibold">Curated Banker Fixture &amp; Market</th>
                  <th className="py-3 px-3 font-semibold text-right">Odds</th>
                  <th className="py-3 px-3 font-semibold text-right">Stake In</th>
                  <th className="py-3 px-3 font-semibold text-right">Gross Return</th>
                  <th className="py-3 px-3 font-semibold text-right">Skimmed Safe</th>
                  <th className="py-3 px-3 font-semibold text-right">Vault Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Next Stake</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ladder.rows.map((row) => {
                  const isDone = completedDays.includes(row.day);
                  return (
                    <tr
                      key={row.day}
                      className={`transition-colors ${
                        isDone ? 'bg-emerald-500/5' : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleDayCompleted(row.day)}
                          className="inline-flex items-center gap-2 text-left"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              isDone ? 'text-emerald-500' : 'text-muted-foreground/40'
                            }`}
                          />
                          <span>Day {row.day}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{row.fixtureLabel}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{row.league}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-foreground/90 font-medium">{row.selection}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {row.modelProbPct}% Win Prob
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold">
                        {row.odds.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        {row.startingStake.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold">
                        {row.grossReturn.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{row.skimmedBankedThisStep.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {row.cumulativeBankedSafe.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold">
                        {row.nextStepReinvestedStake.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handlePushStepToSlip(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-primary" />
                          Add to Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RolloverLadderSimulatorPage;
