import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import { toast } from 'sonner';
import {
  Scale,
  Copy,
  Plus,
  CheckCircle2,
  Calculator,
  SlidersHorizontal,
  ArrowRightLeft,
} from 'lucide-react';
import {
  PHASE13_CURRENCIES,
  SupportedCurrency,
  buildArbitrageOpportunitiesFromPredictions,
  ArbitrageOpportunity,
  StakeRoundingStep,
  computeArbitrageStakes,
} from '@/services/phase13EdgeService';

const ALL_ARB_BOOKMAKERS = [
  'SportyBet',
  'Betika',
  'SportPesa',
  'Bet9ja',
  '1xBet',
  'Pinnacle',
  'Betway',
];

export const ArbitrageSurebetMatrixPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();
  const { predictions } = usePredictions();

  const liveArbList = useMemo(
    () => buildArbitrageOpportunitiesFromPredictions(predictions),
    [predictions]
  );

  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [marketFilter, setMarketFilter] = useState<'all' | '2way' | '3way'>('all');
  const [minRoiFilter, setMinRoiFilter] = useState<number>(0);
  const [activeBookmakers, setActiveBookmakers] = useState<string[]>(ALL_ARB_BOOKMAKERS);

  const [selectedArbId, setSelectedArbId] = useState<string>('');
  const [totalBankroll, setTotalBankroll] = useState<string>('200');
  const [roundingStep, setRoundingStep] = useState<StakeRoundingStep>(0);

  // Custom odds override state for the interactive splitter
  const [customOdds, setCustomOdds] = useState<string[]>(['2.00', '2.00']);

  useEffect(() => {
    if (liveArbList.length > 0 && (!selectedArbId || !liveArbList.some((o) => o.id === selectedArbId))) {
      setSelectedArbId(liveArbList[0].id);
      setCustomOdds(liveArbList[0].legs.map((l) => l.odds.toFixed(2)));
    }
  }, [liveArbList, selectedArbId]);

  const currencyMeta = PHASE13_CURRENCIES[currency];

  const toggleBookmaker = (bookie: string) => {
    setActiveBookmakers((prev) => {
      if (prev.includes(bookie)) {
        if (prev.length <= 2) {
          toast.error('Keep at least 2 bookmakers enabled to scan cross-bookie arbitrage.');
          return prev;
        }
        return prev.filter((b) => b !== bookie);
      }
      return [...prev, bookie];
    });
  };

  const handleSelectOpportunity = (opp: ArbitrageOpportunity) => {
    setSelectedArbId(opp.id);
    setCustomOdds(opp.legs.map((l) => l.odds.toFixed(2)));
  };

  const handleCurrencyChange = (nextCur: SupportedCurrency) => {
    const prevRate = PHASE13_CURRENCIES[currency].rateFromUsd;
    const nextRate = PHASE13_CURRENCIES[nextCur].rateFromUsd;
    const ratio = nextRate / prevRate;
    const curBank = parseFloat(totalBankroll) || 200;
    setCurrency(nextCur);
    setTotalBankroll(String(Math.max(10, Math.round(curBank * ratio))));
  };

  const enrichedOpportunities = useMemo(() => {
    return liveArbList.map((opp) => {
      const split = computeArbitrageStakes(
        opp.legs.map((l) => l.odds),
        parseFloat(totalBankroll) || 200,
        roundingStep
      );
      return {
        opp,
        split,
      };
    }).filter(({ opp, split }) => {
      if (marketFilter !== 'all' && opp.marketType !== marketFilter) return false;
      if (split.roiPct < minRoiFilter) return false;
      const allLegsSupported = opp.legs.every((leg) => activeBookmakers.includes(leg.bookmaker));
      return allLegsSupported;
    });
  }, [liveArbList, marketFilter, minRoiFilter, activeBookmakers, totalBankroll, roundingStep]);

  const activeOpportunity = useMemo(() => {
    return (
      liveArbList.find((o) => o.id === selectedArbId) ||
      liveArbList[0] ||
      null
    );
  }, [liveArbList, selectedArbId]);

  const activeSplit = useMemo(() => {
    const parsedOdds = activeOpportunity
      ? activeOpportunity.legs.map((leg, idx) => {
          const val = parseFloat(customOdds[idx]);
          return Number.isFinite(val) && val > 1.01 ? val : leg.odds;
        })
      : [2.0, 2.0];
    return computeArbitrageStakes(parsedOdds, parseFloat(totalBankroll) || 200, roundingStep);
  }, [activeOpportunity, customOdds, totalBankroll, roundingStep]);

  const fmtMoney = (val: number) => {
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    return `${sign}${currencyMeta.symbol}${abs.toLocaleString(undefined, {
      minimumFractionDigits: roundingStep === 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const loadArbToBetSlip = (opp: ArbitrageOpportunity) => {
    opp.legs.forEach((leg) => {
      addSelection({
        homeTeam: opp.homeTeam,
        awayTeam: opp.awayTeam,
        match: `${opp.homeTeam} vs ${opp.awayTeam}`,
        league: opp.league,
        market: `${leg.outcomeLabel} (${leg.bookmaker})`,
        selection: `${leg.outcomeLabel} @ ${leg.bookmaker}`,
        odds: leg.odds,
        confidence: 92,
      });
    });
    setIsOpen(true);
    toast.success(`Loaded ${opp.legs.length} arbitrage legs into Bet Slip Drawer`);
  };

  const copySurebetPlan = () => {
    if (!activeOpportunity) return;
    const lines = [
      `PredictPro Surebet Staking Split — ${activeOpportunity.homeTeam} vs ${activeOpportunity.awayTeam} (${activeOpportunity.marketCategory})`,
      `Total Implied Book: ${activeSplit.totalImpliedPct.toFixed(2)}% · Guaranteed ROI: +${activeSplit.roiPct.toFixed(2)}%`,
      ...activeOpportunity.legs.map(
        (leg, i) =>
          `Leg ${i + 1}: Stake ${fmtMoney(activeSplit.roundedStakes[i])} on ${leg.outcomeLabel} @ ${customOdds[i] || leg.odds} (${leg.bookmaker} · Code: ${leg.bookingCode})`
      ),
      `Total Outlay: ${fmtMoney(activeSplit.totalActualOutlay)} · Min Guaranteed Net Profit: +${fmtMoney(activeSplit.minGuaranteedProfit)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Surebet staking breakdown copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Multi-Bookmaker Pricing & Margin Matrix | PredictPro"
        description="Compare live 2-way and 3-way implied probability margins across SportyBet, Betika, SportPesa, Bet9ja, 1xBet, and Pinnacle with proportional stake rounding."
        keywords="implied probability finder, cross market margin matrix, sportybet 1xbet odds comparison, proportional stake splitter"
        canonical="/arbitrage-finder"
      />

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Cross-Bookmaker Implied Probability Matrix' },
          ]}
        />

        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-emerald-500">Cross-Bookmaker Pricing Discrepancy Scanner</span>
                <span aria-hidden="true">·</span>
                <span>Implied Book &lt; 100%</span>
                <span aria-hidden="true">·</span>
                <span>2-Way &amp; 3-Way Margin Audit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Cross-Bookmaker Implied Probability &amp; Margin Matrix
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When competing sportsbooks price a fixture differently, the combined implied probability across outcomes can drop below <strong className="text-foreground">100.0%</strong>. Use our stake splitter and <strong className="text-foreground">Proportional Unit Rounding</strong> to model balanced outcome allocations.
              </p>
            </div>

            {/* Currency & Filter Controls */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Bankroll Currency
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                {(Object.keys(PHASE13_CURRENCIES) as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => handleCurrencyChange(cur)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      currency === cur
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="pt-3 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Funded Bookmakers:
              </span>
              {ALL_ARB_BOOKMAKERS.map((bookie) => {
                const active = activeBookmakers.includes(bookie);
                return (
                  <button
                    key={bookie}
                    type="button"
                    onClick={() => toggleBookmaker(bookie)}
                    className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-border bg-background text-muted-foreground opacity-60'
                    }`}
                  >
                    {bookie}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                {(['all', '2way', '3way'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarketFilter(m)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      marketFilter === m
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'all' ? 'All Surebets' : m === '2way' ? '2-Way Markets' : '3-Way 1X2'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid: Live Arbitrage Table (Left 7 cols) + Stake Splitter (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Opportunities Table */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Detected Surebet &amp; Zero-Margin Opportunities ({enrichedOpportunities.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click any fixture row to load its legs into the Stake Splitter
                </p>
              </div>
              <Link
                to="/cashout-calculator"
                className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Cash-Out Hedge Tool →
              </Link>
            </div>

            {enrichedOpportunities.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  No arbitrage opportunities match your current bookmaker filter.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveBookmakers(ALL_ARB_BOOKMAKERS);
                    setMarketFilter('all');
                    setMinRoiFilter(0);
                  }}
                >
                  Reset Bookmaker Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrichedOpportunities.map(({ opp, split }) => {
                  const isSelected = activeOpportunity?.id === opp.id;
                  return (
                    <div
                      key={opp.id}
                      onClick={() => handleSelectOpportunity(opp)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleSelectOpportunity(opp);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-border bg-background/60 hover:border-border/90'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{opp.league}</span>
                            <span aria-hidden="true">·</span>
                            <span>{opp.kickoff}</span>
                            <span aria-hidden="true">·</span>
                            <span>{opp.marketCategory}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-foreground mt-0.5">
                            {opp.homeTeam} vs {opp.awayTeam}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 font-mono tabular-nums">
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">Implied Book</div>
                            <div className="text-xs font-bold text-cyan-400">
                              {split.totalImpliedPct.toFixed(2)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">Guaranteed ROI</div>
                            <div className="text-sm font-extrabold text-emerald-400">
                              +{split.roiPct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Legs Row */}
                      <div
                        className={`grid gap-2 ${
                          opp.legs.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                        }`}
                      >
                        {opp.legs.map((leg, idx) => (
                          <div
                            key={leg.outcomeLabel}
                            className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">
                                {leg.outcomeLabel}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {leg.bookmaker} · <span className="font-mono">{leg.bookingCode}</span>
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="text-xs font-extrabold text-emerald-400">
                                {leg.odds.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Stake {fmtMoney(split.roundedStakes[idx])}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Interactive Surebet Stake Splitter */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-5 sticky top-28">
            <div className="border-b border-border pb-3">
              <div className="text-xs font-semibold text-emerald-400">
                Interactive Surebet Stake Splitter
              </div>
              {activeOpportunity ? (
                <>
                  <h2 className="text-base font-extrabold text-foreground">
                    {activeOpportunity.homeTeam} vs {activeOpportunity.awayTeam}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {activeOpportunity.marketCategory} · Total Implied Book:{' '}
                    <strong className="font-mono tabular-nums text-foreground">
                      {activeSplit.totalImpliedPct.toFixed(2)}%
                    </strong>
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  Loading live upcoming fixtures...
                </p>
              )}
            </div>

            {/* Bankroll & Rounding Controls */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Total Arbitrage Bankroll Allocation ({currencyMeta.symbol.trim()})
                </label>
                <Input
                  type="number"
                  min="10"
                  value={totalBankroll}
                  onChange={(e) => setTotalBankroll(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">
                    Proportional Stake Rounding
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Rounds stakes to clean currency increments
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

            {/* Individual Leg Staking Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              {(activeOpportunity?.legs || []).map((leg, idx) => (
                <div
                  key={leg.outcomeLabel}
                  className="p-3 rounded-lg border border-border bg-background/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-foreground">{leg.outcomeLabel}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {leg.bookmaker} · Code:{' '}
                        <span className="font-mono font-semibold text-foreground">
                          {leg.bookingCode}
                        </span>
                      </div>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.02"
                        min="1.02"
                        value={customOdds[idx] || String(leg.odds)}
                        onChange={(e) => {
                          const next = [...customOdds];
                          next[idx] = e.target.value;
                          setCustomOdds(next);
                        }}
                        className="h-8 text-xs font-mono tabular-nums font-bold text-right"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Required Stake:{' '}
                      <strong className="text-emerald-400">
                        {fmtMoney(activeSplit.roundedStakes[idx] || 0)}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Payout:{' '}
                      <strong className="text-foreground">
                        {fmtMoney(activeSplit.payoutsPerOutcome[idx] || 0)}
                      </strong>{' '}
                      (
                      <span
                        className={
                          (activeSplit.netProfitsPerOutcome[idx] || 0) >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {(activeSplit.netProfitsPerOutcome[idx] || 0) >= 0 ? '+' : ''}
                        {fmtMoney(activeSplit.netProfitsPerOutcome[idx] || 0)}
                      </span>
                      )
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Box */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between font-mono tabular-nums">
              <div>
                <div className="text-[11px] font-sans text-muted-foreground">
                  Total Actual Outlay
                </div>
                <div className="text-base font-extrabold text-foreground">
                  {fmtMoney(activeSplit.totalActualOutlay)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-sans text-emerald-300">
                  Min Guaranteed Net Profit
                </div>
                <div className="text-lg font-extrabold text-emerald-400">
                  +{fmtMoney(activeSplit.minGuaranteedProfit)} (+{activeSplit.roiPct.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                disabled={!activeOpportunity}
                onClick={() => activeOpportunity && loadArbToBetSlip(activeOpportunity)}
                className="flex-1 gap-1.5 text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                Load Surebet Legs to Slip
              </Button>
              <Button
                variant="outline"
                disabled={!activeOpportunity}
                onClick={copySurebetPlan}
                className="gap-1.5 text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Plan
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArbitrageSurebetMatrixPage;
