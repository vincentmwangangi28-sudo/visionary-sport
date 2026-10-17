import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';

export default function RoiYieldCalculator() {
  const [totalBets, setTotalBets] = useState<string>('250');
  const [avgStake, setAvgStake] = useState<string>('20');
  const [avgOdds, setAvgOdds] = useState<string>('1.95');
  const [winRatePct, setWinRatePct] = useState<string>('55.5');

  const stats = useMemo(() => {
    const n = Math.max(1, parseInt(totalBets, 10) || 250);
    const stake = Math.max(1, parseFloat(avgStake) || 20);
    const odds = Math.max(1.01, parseFloat(avgOdds) || 1.95);
    const wr = Math.min(99, Math.max(1, parseFloat(winRatePct) || 55.5)) / 100;

    const totalTurnover = n * stake;
    const expectedWins = n * wr;
    const grossReturn = expectedWins * stake * odds;
    const netProfit = grossReturn - totalTurnover;
    const yieldPct = (netProfit / totalTurnover) * 100;
    const breakEvenWinRate = (1 / odds) * 100;
    const edgeOverBreakEven = wr * 100 - breakEvenWinRate;

    return {
      totalTurnover,
      netProfit,
      yieldPct,
      breakEvenWinRate,
      edgeOverBreakEven,
    };
  }, [totalBets, avgStake, avgOdds, winRatePct]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Betting ROI & Yield Calculator: Break-Even Win Rate Tool"
        description="Free Sports Betting ROI, Yield, and Break-Even Win Rate Calculator. Measure long-term profitability, turnover efficiency, and true mathematical edge."
        keywords="betting yield calculator, sports betting roi calculator, break even win rate calculator, football betting profit calculator"
        canonicalPath="/roi-yield-calculator"
      />
      <Navbar />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Betting ROI, Yield & Break-Even Calculator' },
          ]}
        />

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/35 via-card to-background p-6 sm:p-8">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 mb-3">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Quantitative Performance Audit
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Sports Betting ROI, Yield &amp; Break-Even Win Rate Calculator
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
            Professional syndicates measure performance by <strong>Yield % (Net Profit ÷ Total Turnover)</strong> across 250+ bets. Calculate your exact break-even strike rate and projected long-term profit.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 p-6 border-border/60 bg-card/75 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Number of Bets Placed</label>
              <input
                type="number"
                value={totalBets}
                onChange={(e) => setTotalBets(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Average Stake per Bet ($)</label>
              <input
                type="number"
                value={avgStake}
                onChange={(e) => setAvgStake(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Average Decimal Odds</label>
              <input
                type="number"
                step="0.05"
                value={avgOdds}
                onChange={(e) => setAvgOdds(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Your Win Strike Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={winRatePct}
                onChange={(e) => setWinRatePct(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>
          </Card>

          <Card className="lg:col-span-6 p-6 border-emerald-500/30 bg-card/85 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" /> Long-Term Yield &amp; Profit Output
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-secondary/50">
                <div className="text-xs text-muted-foreground">Break-Even Win Rate</div>
                <div className="text-xl font-extrabold">{stats.breakEvenWinRate.toFixed(1)}%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/50">
                <div className="text-xs text-muted-foreground">Betting Yield (%)</div>
                <div className={`text-xl font-extrabold ${stats.yieldPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.yieldPct >= 0 ? '+' : ''}{stats.yieldPct.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs text-muted-foreground">
                Total Turnover: <strong>${stats.totalTurnover.toFixed(0)}</strong> • Projected Net Profit:
              </div>
              <div className={`text-3xl font-extrabold mt-1 ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
              </div>
            </div>
          </Card>
        </div>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
