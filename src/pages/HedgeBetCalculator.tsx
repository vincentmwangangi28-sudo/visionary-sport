import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, ArrowLeftRight, ArrowRight } from 'lucide-react';

export default function HedgeBetCalculator() {
  const [originalStake, setOriginalStake] = useState<string>('25');
  const [originalOdds, setOriginalOdds] = useState<string>('12.50');
  const [hedgeOdds, setHedgeOdds] = useState<string>('2.15');
  const [cashOutOffer, setCashOutOffer] = useState<string>('120');

  const result = useMemo(() => {
    const s1 = Math.max(1, parseFloat(originalStake) || 0);
    const o1 = Math.max(1.01, parseFloat(originalOdds) || 1.01);
    const o2 = Math.max(1.01, parseFloat(hedgeOdds) || 1.01);
    const cashOut = Math.max(0, parseFloat(cashOutOffer) || 0);

    const grossPayoutIfOriginalWins = s1 * o1;
    const optimalHedgeStake = grossPayoutIfOriginalWins / o2;
    const totalRisked = s1 + optimalHedgeStake;
    const lockedNetProfit = grossPayoutIfOriginalWins - totalRisked;
    const cashOutNetProfit = cashOut - s1;
    const hedgeAdvantage = lockedNetProfit - cashOutNetProfit;

    return {
      grossPayoutIfOriginalWins,
      optimalHedgeStake,
      lockedNetProfit,
      cashOutNetProfit,
      hedgeAdvantage,
    };
  }, [originalStake, originalOdds, hedgeOdds, cashOutOffer]);

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Hedge Bet & Cash-Out Comparison Calculator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description:
          'Free sports betting Hedge Bet Calculator. Compare bookmaker Cash-Out offers against manual live hedging to lock in maximum guaranteed profit.',
        url: 'https://predictpro.guru/hedge-bet-calculator',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Hedge Bet Calculator: Lock In Profit vs Bookmaker Cash-Out Tool"
        description="Free Hedge Bet & Cash-Out Calculator. Calculate the exact opposite stake needed on the final leg of your accumulator to lock in guaranteed risk-free profit."
        keywords="hedge bet calculator, cash out vs hedge calculator, lock in profit betting calculator, how to hedge a parlay calculator, live hedge staking tool"
        canonicalPath="/hedge-bet-calculator"
        schema={schemas}
      />
      <Navbar />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Hedge Bet & Cash-Out Calculator' },
          ]}
        />

        <section className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 via-card to-background p-6 sm:p-8">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 mb-3">
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Parlay Final-Leg Profit Lock
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Hedge Bet &amp; Cash-Out Comparison Calculator
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
            Bookmaker <strong>Cash-Out buttons charge an hidden 12%–18% margin penalty</strong>. When your accumulator reaches its final leg, use this calculator to place a manual opposite hedge bet and keep 100% of your mathematical equity.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 p-6 border-border/60 bg-card/75 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Original Bet / Acca Stake ($)
              </label>
              <input
                type="number"
                value={originalStake}
                onChange={(e) => setOriginalStake(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Original Ticket Total Decimal Odds
              </label>
              <input
                type="number"
                step="0.1"
                value={originalOdds}
                onChange={(e) => setOriginalOdds(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Opposite Outcome (Hedge / Double Chance) Decimal Odds
              </label>
              <input
                type="number"
                step="0.05"
                value={hedgeOdds}
                onChange={(e) => setHedgeOdds(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Bookmaker&apos;s Current Cash-Out Offer ($) (Optional Comparison)
              </label>
              <input
                type="number"
                value={cashOutOffer}
                onChange={(e) => setCashOutOffer(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
          </Card>

          <Card className="lg:col-span-6 p-6 border-emerald-500/30 bg-card/85 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Optimal Hedge Instruction
              </h2>
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <div className="text-xs text-muted-foreground">Place This Exact Stake on the Opposite Outcome:</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                  ${result.optimalHedgeStake.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Original Potential Payout: <strong>${result.grossPayoutIfOriginalWins.toFixed(2)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/60">
                  <div className="text-xs text-muted-foreground">Guaranteed Net Profit</div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    +${result.lockedNetProfit.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/60">
                  <div className="text-xs text-muted-foreground">Extra Profit vs Cash-Out</div>
                  <div className="text-xl font-extrabold text-cyan-400">
                    {result.hedgeAdvantage >= 0 ? '+' : ''}${result.hedgeAdvantage.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link to="/arbitrage-calculator">
                Open 2-Way &amp; 3-Way Arbitrage Calculator <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </Card>
        </div>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
