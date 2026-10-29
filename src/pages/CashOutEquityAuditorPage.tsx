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
  Scale,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Copy,
  CheckCircle2,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import {
  PHASE13_CURRENCIES,
  SupportedCurrency,
  CURATED_CASHOUT_SCENARIOS,
  CuratedCashOutScenario,
  computeCashOutEquityAudit,
} from '@/services/phase15PropSystemService';

export const CashOutEquityAuditorPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    CURATED_CASHOUT_SCENARIOS[0].id
  );

  const [remainingMatch, setRemainingMatch] = useState<string>(
    CURATED_CASHOUT_SCENARIOS[0].remainingMatch
  );
  const [homeTeam, setHomeTeam] = useState<string>(CURATED_CASHOUT_SCENARIOS[0].homeTeam);
  const [awayTeam, setAwayTeam] = useState<string>(CURATED_CASHOUT_SCENARIOS[0].awayTeam);
  const [league, setLeague] = useState<string>(CURATED_CASHOUT_SCENARIOS[0].league);
  const [remainingPick, setRemainingPick] = useState<string>(
    CURATED_CASHOUT_SCENARIOS[0].remainingPick
  );
  const [oppositeHedgePick, setOppositeHedgePick] = useState<string>(
    CURATED_CASHOUT_SCENARIOS[0].oppositeHedgePick
  );

  const [originalStake, setOriginalStake] = useState<string>('20');
  const [totalTicketOdds, setTotalTicketOdds] = useState<string>('15.17');
  const [remainingUnplayedOdds, setRemainingUnplayedOdds] = useState<string>('1.85');
  const [bookieCashOutOffer, setBookieCashOutOffer] = useState<string>('132');
  const [oppositeHedgeOdds, setOppositeHedgeOdds] = useState<string>('2.04');
  const [bookieMarginPct, setBookieMarginPct] = useState<string>('5.5');

  const currencyMeta = PHASE13_CURRENCIES[currency];

  const handleCurrencyChange = (nextCur: SupportedCurrency) => {
    const prevRate = PHASE13_CURRENCIES[currency].rateFromUsd;
    const nextRate = PHASE13_CURRENCIES[nextCur].rateFromUsd;
    const ratio = nextRate / prevRate;

    const s = parseFloat(originalStake) || 20;
    const c = parseFloat(bookieCashOutOffer) || 132;

    setCurrency(nextCur);
    setOriginalStake(String(Math.max(1, Math.round(s * ratio))));
    setBookieCashOutOffer(String(Math.max(1, Math.round(c * ratio))));
  };

  const applyScenario = (scenario: CuratedCashOutScenario) => {
    setSelectedScenarioId(scenario.id);
    setRemainingMatch(scenario.remainingMatch);
    setHomeTeam(scenario.homeTeam);
    setAwayTeam(scenario.awayTeam);
    setLeague(scenario.league);
    setRemainingPick(scenario.remainingPick);
    setOppositeHedgePick(scenario.oppositeHedgePick);

    const rate = currencyMeta.rateFromUsd;
    setOriginalStake(String(Math.max(1, Math.round(scenario.originalStakeUsd * rate))));
    setTotalTicketOdds(scenario.totalTicketOdds.toFixed(2));
    setRemainingUnplayedOdds(scenario.remainingUnplayedOdds.toFixed(2));
    setBookieCashOutOffer(
      String(Math.max(1, Math.round(scenario.bookieCashOutOfferUsd * rate)))
    );
    setOppositeHedgeOdds(scenario.oppositeHedgeOdds.toFixed(2));
    toast.success(`Loaded ${scenario.bookmaker} ticket audit: ${scenario.remainingMatch}`);
  };

  const audit = useMemo(
    () =>
      computeCashOutEquityAudit({
        originalStake: parseFloat(originalStake) || 10,
        totalTicketOdds: parseFloat(totalTicketOdds) || 10,
        remainingUnplayedOdds: parseFloat(remainingUnplayedOdds) || 1.85,
        bookieCashOutOffer: parseFloat(bookieCashOutOffer) || 0,
        oppositeHedgeOdds: parseFloat(oppositeHedgeOdds) || 2.0,
        bookieMarginPct: parseFloat(bookieMarginPct) || 5.5,
      }),
    [
      originalStake,
      totalTicketOdds,
      remainingUnplayedOdds,
      bookieCashOutOffer,
      oppositeHedgeOdds,
      bookieMarginPct,
    ]
  );

  const fmtMoney = (val: number) =>
    `${currencyMeta.symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: currencyMeta.decimals,
      maximumFractionDigits: currencyMeta.decimals,
    })}`;

  const handleAddDiyHedgeToSlip = () => {
    addSelection({
      id: `diy-hedge-${Date.now()}`,
      homeTeam,
      awayTeam,
      league,
      kickoff: 'Tonight',
      market: oppositeHedgePick,
      selection: oppositeHedgePick,
      odds: parseFloat(oppositeHedgeOdds) || 2.0,
      confidence: 84,
    });
    setIsOpen(true);
    toast.success(`Added DIY Hedge (${oppositeHedgePick}) to Bet Slip`);
  };

  const handleCopyAuditSummary = () => {
    const summary = [
      `PredictPro Cash-Out Equity Audit — ${remainingMatch}`,
      `Original Stake: ${fmtMoney(audit.originalStake)} @ ${audit.totalTicketOdds}x (Max Payout: ${fmtMoney(audit.potentialMaxPayout)})`,
      `True Fair Ticket Equity: ${fmtMoney(audit.fairMathematicalEquity)} (${audit.trueFairRemainingWinProbPct}% Fair Win Prob)`,
      `Bookie Cash-Out Offer: ${fmtMoney(audit.bookieCashOutOffer)} (Haircut Penalty: -${audit.bookieHaircutPct}%)`,
      `Manual DIY Hedge Stake: ${fmtMoney(audit.diyHedgeStake)} on ${oppositeHedgePick} @ ${oppositeHedgeOdds}`,
      `Guaranteed Net Profit via DIY Hedge: +${fmtMoney(audit.diyHedgeGuaranteedProfit)} (+${fmtMoney(audit.diyAdvantageOverCashOut)} better than Cash-Out)`,
    ].join('\n');
    navigator.clipboard.writeText(summary);
    toast.success('Copied Cash-Out Equity Audit to clipboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Cash-Out Equity Auditor & Live Hedge Optimizer | PredictPro"
        description="Audit bookmaker Cash-Out offers on SportyBet, Betika, SportPesa, and 1xBet. Calculate true mathematical ticket equity, hidden margin haircuts, and DIY hedge stakes."
        keywords="cash out calculator, bookmaker cash out margin audit, live hedge optimizer, accumulator cash out vs hedge, sportybet cashout calculator"
        canonical="/cash-out-calculator"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Cash-Out Equity & Live Hedge Optimizer' },
          ]}
        />

        {/* Header Banner */}
        <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Quantitative Ticket Valuation</span>
                <span aria-hidden="true">·</span>
                <span>De-Vigged Equity vs Bookie Haircut</span>
                <span aria-hidden="true">·</span>
                <span>1-Click DIY Counter-Hedge</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Cash-Out Equity &amp; Live Hedge Optimizer
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sportsbooks routinely deduct an <strong>8% to 18% hidden margin haircut</strong> from early Cash-Out offers. Enter your accumulator stake, total odds, remaining unplayed leg odds, and the bookie&apos;s offer to expose the exact haircut and compute a higher-paying DIY opposite hedge.
              </p>
            </div>

            {/* Currency Selector */}
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

        {/* Preset Ticket Scenarios */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Live Final-Leg Ticket Presets (SportyBet · Betika · SportPesa · 1xBet)
            </h2>
            <span className="text-xs text-muted-foreground">
              Click any real-world ticket below to audit its Cash-Out haircut
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CURATED_CASHOUT_SCENARIOS.map((sc) => {
              const active = selectedScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => applyScenario(sc)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'border-primary bg-primary/5 shadow-2xs'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">{sc.bookmaker}</span>
                    <span className="font-mono tabular-nums text-primary font-bold">
                      {sc.totalTicketOdds.toFixed(2)}x Total
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{sc.remainingMatch}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{sc.remainingPick}</p>
                  <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-2">
                    Rem Odds: {sc.remainingUnplayedOdds.toFixed(2)} · Hedge: {sc.oppositeHedgeOdds.toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ticket Inputs */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Ticket &amp; Bookie Offer Inputs</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{currency} Mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Original Acca Stake ({currencyMeta.symbol})
                </label>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={originalStake}
                  onChange={(e) => setOriginalStake(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Total Ticket Combined Odds
                </label>
                <Input
                  type="number"
                  min="1.1"
                  step="0.05"
                  value={totalTicketOdds}
                  onChange={(e) => setTotalTicketOdds(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Remaining Unplayed Leg Odds
                </label>
                <Input
                  type="number"
                  min="1.05"
                  step="0.02"
                  value={remainingUnplayedOdds}
                  onChange={(e) => setRemainingUnplayedOdds(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Cash-Out Offer ({currencyMeta.symbol})
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={bookieCashOutOffer}
                  onChange={(e) => setBookieCashOutOffer(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Opposite Hedge Odds (X2 / Under / No)
                </label>
                <Input
                  type="number"
                  min="1.05"
                  step="0.02"
                  value={oppositeHedgeOdds}
                  onChange={(e) => setOppositeHedgeOdds(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Est. Bookmaker Overround (%)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  step="0.5"
                  value={bookieMarginPct}
                  onChange={(e) => setBookieMarginPct(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-border">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Remaining Unplayed Fixture
                </label>
                <Input
                  type="text"
                  value={remainingMatch}
                  onChange={(e) => setRemainingMatch(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Opposite Hedge Market Label
                </label>
                <Input
                  type="text"
                  value={oppositeHedgePick}
                  onChange={(e) => setOppositeHedgePick(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Equity Audit & Verdict */}
          <div className="lg:col-span-7 space-y-5">
            {/* Optimal Verdict Banner */}
            <div
              className={`rounded-xl border p-5 ${
                audit.optimalRecommendation === 'DIY_HEDGE'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : audit.optimalRecommendation === 'ACCEPT_CASHOUT'
                  ? 'border-sky-500/40 bg-sky-500/5'
                  : 'border-amber-500/40 bg-amber-500/5'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    {audit.optimalRecommendation === 'DIY_HEDGE' ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    ) : audit.optimalRecommendation === 'ACCEPT_CASHOUT' ? (
                      <CheckCircle2 className="h-4 w-4 text-sky-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span>
                      Mathematical Verdict:{' '}
                      {audit.optimalRecommendation === 'DIY_HEDGE'
                        ? 'EXECUTE MANUAL DIY HEDGE'
                        : audit.optimalRecommendation === 'ACCEPT_CASHOUT'
                        ? 'ACCEPT BOOKMAKER CASH-OUT'
                        : 'REJECT CASH-OUT & HOLD TICKET'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{audit.recommendationReason}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={handleAddDiyHedgeToSlip}
                    className="whitespace-nowrap shrink-0 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Hedge to Slip</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyAuditSummary}
                    className="whitespace-nowrap shrink-0 gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Audit</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Key Valuation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">True Fair Ticket Equity</p>
                <p className="text-lg font-bold font-mono tabular-nums text-foreground mt-1">
                  {fmtMoney(audit.fairMathematicalEquity)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  {audit.trueFairRemainingWinProbPct}% Fair Win Prob
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Bookie Cash-Out Haircut</p>
                <p className="text-lg font-bold font-mono tabular-nums text-rose-500 mt-1">
                  -{audit.bookieHaircutPct}%
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  -{fmtMoney(audit.bookieHaircutAmount)} withheld
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Required DIY Hedge Stake</p>
                <p className="text-lg font-bold font-mono tabular-nums text-primary mt-1">
                  {fmtMoney(audit.diyHedgeStake)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  @ {parseFloat(oppositeHedgeOdds || '2').toFixed(2)} opposite odds
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">DIY Hedge Extra Profit</p>
                <p
                  className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                    audit.diyAdvantageOverCashOut >= 0 ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {audit.diyAdvantageOverCashOut >= 0 ? '+' : ''}
                  {fmtMoney(audit.diyAdvantageOverCashOut)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  vs Cash-Out button
                </p>
              </div>
            </div>

            {/* 3-Path Comparison Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span>Side-by-Side Strategy Comparison ({remainingMatch})</span>
                </h3>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  Max Gross Payout: {fmtMoney(audit.potentialMaxPayout)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Strategy Path</th>
                      <th className="py-3 px-4 font-semibold">Additional Outlay</th>
                      <th className="py-3 px-4 font-semibold">If Original Pick Wins</th>
                      <th className="py-3 px-4 font-semibold">If Opposite Outcome Hits</th>
                      <th className="py-3 px-4 font-semibold">Guaranteed Floor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono tabular-nums">
                    <tr className="bg-emerald-500/5">
                      <td className="py-3.5 px-4 font-sans font-bold text-foreground">
                        1. Manual DIY Hedge ({oppositeHedgePick})
                      </td>
                      <td className="py-3.5 px-4 text-foreground">{fmtMoney(audit.diyHedgeStake)}</td>
                      <td className="py-3.5 px-4 text-emerald-500 font-bold">
                        +{fmtMoney(audit.diyHedgeGuaranteedProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-500 font-bold">
                        +{fmtMoney(audit.diyHedgeGuaranteedProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-500 font-bold">
                        +{fmtMoney(audit.diyHedgeGuaranteedProfit)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-sans font-semibold text-foreground">
                        2. Bookmaker Early Cash-Out Button
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{fmtMoney(0)}</td>
                      <td className="py-3.5 px-4 text-foreground">
                        +{fmtMoney(audit.cashOutNetProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        +{fmtMoney(audit.cashOutNetProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        +{fmtMoney(audit.cashOutNetProfit)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-sans font-semibold text-foreground">
                        3. Let Ticket Ride Unhedged ({remainingPick})
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{fmtMoney(0)}</td>
                      <td className="py-3.5 px-4 text-emerald-500 font-bold">
                        +{fmtMoney(audit.potentialMaxPayout - audit.originalStake)}
                      </td>
                      <td className="py-3.5 px-4 text-rose-500 font-bold">
                        -{fmtMoney(audit.originalStake)}
                      </td>
                      <td className="py-3.5 px-4 text-rose-500">
                        -{fmtMoney(audit.originalStake)} (EV: +{fmtMoney(audit.evHoldRide)})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-link footer bar */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Need 3-Way (1X2) Dutching or Partial Profit Bias sliders for your final leg?
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/cashout-calculator"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>3-Way Hedge Calculator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/rollover-challenge"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Compound Rollover Ladder</span>
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

export default CashOutEquityAuditorPage;
