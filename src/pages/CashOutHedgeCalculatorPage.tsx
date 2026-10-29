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
  ShieldCheck,
  Scale,
  Copy,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Sparkles,
} from 'lucide-react';
import {
  PHASE13_CURRENCIES,
  SupportedCurrency,
  HEDGE_PRESET_SCENARIOS,
  HedgePresetScenario,
  HedgeStrategyMode,
  StakeRoundingStep,
  calculateAccaHedge,
} from '@/services/phase13EdgeService';

export const CashOutHedgeCalculatorPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(HEDGE_PRESET_SCENARIOS[0].id);
  const [marketType, setMarketType] = useState<'2way' | '3way'>('2way');
  const [strategy, setStrategy] = useState<HedgeStrategyMode>('equal_profit');
  const [biasPct, setBiasPct] = useState<number>(50);
  const [roundingStep, setRoundingStep] = useState<StakeRoundingStep>(0);

  const [finalFixture, setFinalFixture] = useState<string>(HEDGE_PRESET_SCENARIOS[0].finalFixture);
  const [homeTeam, setHomeTeam] = useState<string>(HEDGE_PRESET_SCENARIOS[0].homeTeam);
  const [awayTeam, setAwayTeam] = useState<string>(HEDGE_PRESET_SCENARIOS[0].awayTeam);
  const [league, setLeague] = useState<string>(HEDGE_PRESET_SCENARIOS[0].league);
  const [originalSelection, setOriginalSelection] = useState<string>(
    HEDGE_PRESET_SCENARIOS[0].originalSelection
  );
  const [hedgeSelectionLabel, setHedgeSelectionLabel] = useState<string>(
    HEDGE_PRESET_SCENARIOS[0].hedgeSelectionLabel
  );
  const [secondaryHedgeLabel, setSecondaryHedgeLabel] = useState<string>(
    'Away Win (2) Counter-Hedge'
  );

  const [originalStake, setOriginalStake] = useState<string>('25');
  const [accaTotalOdds, setAccaTotalOdds] = useState<string>('14.40');
  const [bookieCashOutOffer, setBookieCashOutOffer] = useState<string>('162');
  const [hedgeOddsPrimary, setHedgeOddsPrimary] = useState<string>('2.18');
  const [hedgeOddsSecondary, setHedgeOddsSecondary] = useState<string>('4.40');

  const currencyMeta = PHASE13_CURRENCIES[currency];

  const applyPreset = (preset: HedgePresetScenario) => {
    setSelectedPresetId(preset.id);
    setMarketType(preset.hedgeMarketType);
    setFinalFixture(preset.finalFixture);
    setHomeTeam(preset.homeTeam);
    setAwayTeam(preset.awayTeam);
    setLeague(preset.league);
    setOriginalSelection(preset.originalSelection);
    setHedgeSelectionLabel(preset.hedgeSelectionLabel);
    if (preset.secondaryHedgeLabel) {
      setSecondaryHedgeLabel(preset.secondaryHedgeLabel);
    }
    const mult = currencyMeta.rateFromUsd;
    setOriginalStake(String(Math.round(preset.originalStakeUsd * mult)));
    setAccaTotalOdds(preset.accaTotalOdds.toFixed(2));
    setBookieCashOutOffer(String(Math.round(preset.bookieCashOutUsd * mult)));
    setHedgeOddsPrimary(preset.hedgeOddsPrimary.toFixed(2));
    if (preset.hedgeOddsSecondary) {
      setHedgeOddsSecondary(preset.hedgeOddsSecondary.toFixed(2));
    }
    toast.success(`Loaded scenario: ${preset.title}`);
  };

  const handleCurrencyChange = (nextCur: SupportedCurrency) => {
    const prevRate = PHASE13_CURRENCIES[currency].rateFromUsd;
    const nextRate = PHASE13_CURRENCIES[nextCur].rateFromUsd;
    const ratio = nextRate / prevRate;

    const curStake = parseFloat(originalStake) || 25;
    const curCashOut = parseFloat(bookieCashOutOffer) || 162;

    setCurrency(nextCur);
    setOriginalStake(String(Math.max(1, Math.round(curStake * ratio))));
    setBookieCashOutOffer(String(Math.max(1, Math.round(curCashOut * ratio))));
  };

  const calc = useMemo(
    () =>
      calculateAccaHedge({
        originalStake: parseFloat(originalStake) || 10,
        accaTotalOdds: parseFloat(accaTotalOdds) || 5,
        bookieCashOutOffer: parseFloat(bookieCashOutOffer) || 0,
        marketType,
        hedgeOddsPrimary: parseFloat(hedgeOddsPrimary) || 2.0,
        hedgeOddsSecondary: parseFloat(hedgeOddsSecondary) || 3.5,
        strategy,
        biasPct,
        roundingStep,
      }),
    [
      originalStake,
      accaTotalOdds,
      bookieCashOutOffer,
      marketType,
      hedgeOddsPrimary,
      hedgeOddsSecondary,
      strategy,
      biasPct,
      roundingStep,
    ]
  );

  const fmtMoney = (val: number) => {
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    return `${sign}${currencyMeta.symbol}${abs.toLocaleString(undefined, {
      minimumFractionDigits: roundingStep === 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const pushHedgeToBetSlip = () => {
    addSelection({
      homeTeam,
      awayTeam,
      match: finalFixture,
      league,
      market: hedgeSelectionLabel,
      selection: hedgeSelectionLabel,
      odds: parseFloat(hedgeOddsPrimary) || 2.18,
      confidence: 85,
    });

    if (marketType === '3way') {
      addSelection({
        homeTeam,
        awayTeam,
        match: finalFixture,
        league,
        market: secondaryHedgeLabel,
        selection: secondaryHedgeLabel,
        odds: parseFloat(hedgeOddsSecondary) || 4.4,
        confidence: 80,
      });
    }

    setIsOpen(true);
    toast.success('Hedge counter-leg added to your Bet Slip Drawer');
  };

  const copyHedgeSummary = () => {
    const text = [
      `PredictPro Live Acca Hedge Plan — ${finalFixture}`,
      `Original Ticket: ${fmtMoney(parseFloat(originalStake) || 0)} @ ${accaTotalOdds}x (Potential: ${fmtMoney(calc.grossPayoutIfAccaWins)})`,
      `Primary Hedge: Stake ${fmtMoney(calc.optimalHedgeStakePrimary)} on ${hedgeSelectionLabel} @ ${hedgeOddsPrimary}`,
      marketType === '3way'
        ? `Secondary Hedge: Stake ${fmtMoney(calc.optimalHedgeStakeSecondary)} on ${secondaryHedgeLabel} @ ${hedgeOddsSecondary}`
        : null,
      `Guaranteed Minimum Net Profit: ${fmtMoney(calc.guaranteedMinProfit)} (Beats Bookie Cash-Out by ${fmtMoney(calc.diyHedgeAdvantage)})`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Hedge staking plan copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Acca Cash-Out & Live Hedge Calculator | Lock In Guaranteed Profit | PredictPro"
        description="Audit bookmaker Cash-Out haircuts and calculate exact 2-way or 3-way counter-hedge stakes on the final leg of your accumulator to lock in guaranteed risk-free profit."
        keywords="acca cash out calculator, live hedge bet calculator, double chance hedge calculator, sportybet cash out vs hedge, lock in parlay profit"
        canonical="/cashout-calculator"
      />

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Acca Cash-Out & Live Hedge Calculator' },
          ]}
        />

        {/* Header Banner */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-emerald-500">Phase 13 Quantitative Staking Tool</span>
                <span aria-hidden="true">·</span>
                <span>2-Way &amp; 3-Way Final-Leg Profit Lock</span>
                <span aria-hidden="true">·</span>
                <span>Anti-Limit Stake Rounding</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Acca Cash-Out Audit &amp; Live Hedge Calculator
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When your accumulator hits its final leg, bookmaker Cash-Out buttons typically shave{' '}
                <strong className="text-foreground">14% to 24% off your true mathematical equity</strong>. Compare the bookie&apos;s offer against a manual opposite-market hedge (`Double Chance X2`, `Under 2.5`, or `3-Way Draw/Away split`) to keep 100% of your edge.
              </p>
            </div>

            {/* Currency Switcher */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Active Staking Currency
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                {(Object.keys(PHASE13_CURRENCIES) as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => handleCurrencyChange(cur)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
          </div>

          {/* Matchday Presets Strip */}
          <div className="pt-3 border-t border-border/60 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              Load Live Final-Leg Ticket Preset:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {HEDGE_PRESET_SCENARIOS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background/60 hover:border-border/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mb-1">
                      <span className="font-semibold text-foreground truncate">{preset.finalFixture}</span>
                      <span className="font-mono tabular-nums text-emerald-500 font-bold shrink-0">
                        {preset.accaTotalOdds.toFixed(1)}x
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground truncate">{preset.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {preset.originalSelection} vs {preset.hedgeSelectionLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Workspace Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Ticket & Hedge Parameters */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  01. Ticket &amp; Opposite Market Inputs
                </h2>
                <p className="text-xs text-muted-foreground">
                  Enter your active accumulator and live opposing odds
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setMarketType('2way')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    marketType === '2way'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  2-Way Hedge
                </button>
                <button
                  type="button"
                  onClick={() => setMarketType('3way')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    marketType === '3way'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  3-Way Split
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Original Acca Stake ({currencyMeta.symbol.trim()})
                </label>
                <Input
                  type="number"
                  min="1"
                  value={originalStake}
                  onChange={(e) => setOriginalStake(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Total Combined Acca Odds
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="1.1"
                  value={accaTotalOdds}
                  onChange={(e) => setAccaTotalOdds(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookmaker Cash-Out Offer ({currencyMeta.symbol.trim()})
                </label>
                <Input
                  type="number"
                  min="0"
                  value={bookieCashOutOffer}
                  onChange={(e) => setBookieCashOutOffer(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Primary Hedge Decimal Odds
                </label>
                <Input
                  type="number"
                  step="0.02"
                  min="1.05"
                  value={hedgeOddsPrimary}
                  onChange={(e) => setHedgeOddsPrimary(e.target.value)}
                  className="font-mono tabular-nums font-bold border-emerald-500/40"
                />
              </div>
            </div>

            {marketType === '3way' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/60">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    2nd Counter-Outcome Label
                  </label>
                  <Input
                    type="text"
                    value={secondaryHedgeLabel}
                    onChange={(e) => setSecondaryHedgeLabel(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    2nd Counter-Outcome Decimal Odds
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={hedgeOddsSecondary}
                    onChange={(e) => setHedgeOddsSecondary(e.target.value)}
                    className="font-mono tabular-nums font-bold border-emerald-500/40"
                  />
                </div>
              </div>
            )}

            {/* Strategy Mode Selector */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-muted-foreground block">
                02. Hedge Optimization Strategy
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setStrategy('equal_profit')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    strategy === 'equal_profit'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Equal Profit
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('free_roll')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    strategy === 'free_roll'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Free Roll (0 Risk)
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('custom_bias')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    strategy === 'custom_bias'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom Slider
                </button>
              </div>

              {strategy === 'custom_bias' && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Favor Hedge Safety</span>
                    <span className="font-mono tabular-nums font-bold text-primary">
                      Bias: {biasPct}% Acca Ride
                    </span>
                    <span className="text-muted-foreground">Favor Acca Upside</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={biasPct}
                    onChange={(e) => setBiasPct(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Anti-Limit Stake Rounding */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  03. Anti-Detection Stake Rounding
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Avoid bookmaker fractional-stake limits
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {([0, 1, 5, 10, 50, 100] as StakeRoundingStep[]).map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setRoundingStep(step)}
                    className={`px-2.5 py-1 rounded border text-xs font-mono tabular-nums font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      roundingStep === step
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {step === 0 ? 'Exact (.00)' : `Nearest ${step}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Audit & Staking Output */}
          <div className="lg:col-span-7 space-y-5">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-1">
                <div className="text-xs font-semibold text-emerald-400">
                  Required Counter-Hedge Stake
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-foreground">
                  {fmtMoney(calc.totalHedgeOutlay)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {marketType === '2way'
                    ? `On ${hedgeSelectionLabel} @ ${hedgeOddsPrimary}`
                    : `Split: ${fmtMoney(calc.optimalHedgeStakePrimary)} + ${fmtMoney(calc.optimalHedgeStakeSecondary)}`}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">
                  Guaranteed Minimum Net Profit
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono tabular-nums ${
                    calc.guaranteedMinProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {calc.guaranteedMinProfit >= 0 ? '+' : ''}
                  {fmtMoney(calc.guaranteedMinProfit)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  After deducting {fmtMoney(calc.totalCombinedRisk)} total outlay
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">
                  Manual Hedge vs Cash-Out Edge
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono tabular-nums ${
                    calc.diyHedgeAdvantage >= 0 ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {calc.diyHedgeAdvantage >= 0 ? '+' : ''}
                  {fmtMoney(calc.diyHedgeAdvantage)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Bookie Haircut: {calc.bookieHaircutPct.toFixed(1)}% ({fmtMoney(calc.bookieHaircutAmount)})
                </div>
              </div>
            </div>

            {/* Detailed Scenario Outcome Matrix */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Outcome Payout &amp; Net Profit Matrix ({finalFixture})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Exact net return across every possible final-leg match result
                  </p>
                </div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{calc.recommendationLabel}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2.5 pr-3 font-semibold">Scenario / Outcome</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Stake Placed</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Decimal Odds</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Gross Return</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                    <tr className="hover:bg-muted/40">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-bold text-foreground">
                          Original Acca Wins ({originalSelection})
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Final leg lands in your favor
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">{fmtMoney(parseFloat(originalStake) || 0)}</td>
                      <td className="py-3 px-3 text-right">{Number(accaTotalOdds).toFixed(2)}x</td>
                      <td className="py-3 px-3 text-right font-bold">
                        {fmtMoney(calc.grossPayoutIfAccaWins)}
                      </td>
                      <td
                        className={`py-3 pl-3 text-right font-bold ${
                          calc.netProfitIfAccaWins >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {calc.netProfitIfAccaWins >= 0 ? '+' : ''}
                        {fmtMoney(calc.netProfitIfAccaWins)}
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/40 bg-emerald-500/5">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-bold text-foreground">
                          Primary Hedge Wins ({hedgeSelectionLabel})
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Counter-bet covers final leg loss
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {fmtMoney(calc.optimalHedgeStakePrimary)}
                      </td>
                      <td className="py-3 px-3 text-right">{Number(hedgeOddsPrimary).toFixed(2)}x</td>
                      <td className="py-3 px-3 text-right font-bold">
                        {fmtMoney(calc.optimalHedgeStakePrimary * (parseFloat(hedgeOddsPrimary) || 2))}
                      </td>
                      <td
                        className={`py-3 pl-3 text-right font-bold ${
                          calc.netProfitIfPrimaryHedgeWins >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {calc.netProfitIfPrimaryHedgeWins >= 0 ? '+' : ''}
                        {fmtMoney(calc.netProfitIfPrimaryHedgeWins)}
                      </td>
                    </tr>

                    {marketType === '3way' && (
                      <tr className="hover:bg-muted/40 bg-emerald-500/5">
                        <td className="py-3 pr-3 font-sans">
                          <div className="font-bold text-foreground">
                            Secondary Hedge Wins ({secondaryHedgeLabel})
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            3-Way split second opposing outcome
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {fmtMoney(calc.optimalHedgeStakeSecondary)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {Number(hedgeOddsSecondary).toFixed(2)}x
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          {fmtMoney(
                            calc.optimalHedgeStakeSecondary * (parseFloat(hedgeOddsSecondary) || 3)
                          )}
                        </td>
                        <td
                          className={`py-3 pl-3 text-right font-bold ${
                            calc.netProfitIfSecondaryHedgeWins >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {calc.netProfitIfSecondaryHedgeWins >= 0 ? '+' : ''}
                          {fmtMoney(calc.netProfitIfSecondaryHedgeWins)}
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-muted/40">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-semibold text-muted-foreground">
                          Bookmaker Instant Cash-Out Button
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Includes {calc.bookieHaircutPct.toFixed(1)}% bookmaker margin penalty
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {fmtMoney(parseFloat(originalStake) || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">—</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {fmtMoney(parseFloat(bookieCashOutOffer) || 0)}
                      </td>
                      <td className="py-3 pl-3 text-right font-semibold text-amber-400">
                        {calc.cashOutNetProfit >= 0 ? '+' : ''}
                        {fmtMoney(calc.cashOutNetProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={pushHedgeToBetSlip} className="gap-1.5 text-xs font-bold">
                    <Plus className="h-3.5 w-3.5" />
                    Add Hedge Leg to Bet Slip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyHedgeSummary}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Staking Breakdown
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">
                  <Link to="/arbitrage-finder" className="text-primary hover:underline">
                    Surebet Arbitrage Matrix →
                  </Link>
                  <Link to="/code-converter" className="text-muted-foreground hover:text-foreground">
                    Code Converter →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CashOutHedgeCalculatorPage;
