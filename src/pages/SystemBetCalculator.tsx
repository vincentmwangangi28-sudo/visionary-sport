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
import { Calculator, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

type SystemType = 'trixie' | 'patent' | 'yankee' | 'lucky15';

interface LegInput {
  id: number;
  odds: string;
  won: boolean;
}

export default function SystemBetCalculator() {
  const [systemType, setSystemType] = useState<SystemType>('trixie');
  const [unitStake, setUnitStake] = useState<string>('5');
  const [legs, setLegs] = useState<LegInput[]>([
    { id: 1, odds: '2.10', won: true },
    { id: 2, odds: '1.95', won: true },
    { id: 3, odds: '2.40', won: false },
    { id: 4, odds: '2.25', won: true },
  ]);

  const activeLegCount = systemType === 'trixie' || systemType === 'patent' ? 3 : 4;
  const activeLegs = legs.slice(0, activeLegCount);

  const calculation = useMemo(() => {
    const stake = Math.max(0.1, parseFloat(unitStake) || 0);
    const parsed = activeLegs.map((l) => ({
      ...l,
      val: l.won ? Math.max(1.01, parseFloat(l.odds) || 1) : 0,
    }));

    let singlesReturn = 0;
    let doublesReturn = 0;
    let treblesReturn = 0;
    let fourfoldReturn = 0;
    let numBets = 0;

    if (systemType === 'patent' || systemType === 'lucky15') {
      parsed.forEach((p) => {
        numBets++;
        singlesReturn += p.val * stake;
      });
    }

    // Doubles
    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        numBets++;
        doublesReturn += parsed[i].val * parsed[j].val * stake;
      }
    }

    // Trebles
    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        for (let k = j + 1; k < parsed.length; k++) {
          numBets++;
          treblesReturn += parsed[i].val * parsed[j].val * parsed[k].val * stake;
        }
      }
    }

    // 4-Fold
    if (parsed.length === 4) {
      numBets++;
      fourfoldReturn += parsed[0].val * parsed[1].val * parsed[2].val * parsed[3].val * stake;
    }

    const totalOutlay = numBets * stake;
    const totalReturn = singlesReturn + doublesReturn + treblesReturn + fourfoldReturn;
    const netProfit = totalReturn - totalOutlay;

    return {
      numBets,
      totalOutlay,
      totalReturn,
      netProfit,
      singlesReturn,
      doublesReturn,
      treblesReturn,
      fourfoldReturn,
    };
  }, [systemType, unitStake, activeLegs]);

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'System Bet Calculator (Trixie, Patent, Yankee & Lucky 15)',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description:
          'Interactive sports betting System Bet Calculator for Trixie (4 bets), Patent (7 bets), Yankee (11 bets), and Lucky 15 (15 bets) combinations.',
        url: 'https://predictpro.guru/system-bet-calculator',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="System Bet Calculator: Trixie, Yankee, Patent & Lucky 15 Tool"
        description="Free System Bet Calculator for football betting. Calculate exact payouts for Trixie (4 bets), Patent (7), Yankee (11), and Lucky 15 (15) combinations."
        keywords="system bet calculator, trixie bet calculator, yankee calculator, patent bet calculator, lucky 15 calculator, round robin bet calculator"
        canonical="/system-bet-calculator"
        structuredData={schemas}
      />
      <Navbar />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'System Bet Calculator (Trixie / Yankee / Lucky 15)' },
          ]}
        />

        <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-card to-background p-6 sm:p-8">
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 mb-3">
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Multi-Combination Cover Tool
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            System Bet Calculator (Trixie, Patent, Yankee &amp; Lucky 15)
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
            Unlike standard accumulators where a single losing leg wipes out your entire ticket, <strong>System Bets</strong> split your stake across all possible Doubles, Trebles, and 4-Folds so you still profit when 1 or 2 selections lose.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 p-6 border-border/60 bg-card/75 space-y-5">
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'trixie', label: 'Trixie (3 Legs • 4 Bets)' },
                { id: 'patent', label: 'Patent (3 Legs • 7 Bets)' },
                { id: 'yankee', label: 'Yankee (4 Legs • 11 Bets)' },
                { id: 'lucky15', label: 'Lucky 15 (4 Legs • 15 Bets)' },
              ] as const).map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={systemType === t.id ? 'default' : 'outline'}
                  onClick={() => setSystemType(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Unit Stake per Combination ($)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={unitStake}
                onChange={(e) => setUnitStake(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            </div>

            <div className="space-y-3">
              {activeLegs.map((leg, i) => (
                <div key={leg.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-background/50">
                  <span className="text-xs font-bold text-muted-foreground w-16">Leg #{i + 1}</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    value={leg.odds}
                    onChange={(e) =>
                      setLegs((prev) =>
                        prev.map((item) => (item.id === leg.id ? { ...item, odds: e.target.value } : item))
                      )
                    }
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold"
                  />
                  <Button
                    size="sm"
                    variant={leg.won ? 'default' : 'destructive'}
                    onClick={() =>
                      setLegs((prev) =>
                        prev.map((item) => (item.id === leg.id ? { ...item, won: !item.won } : item))
                      )
                    }
                  >
                    {leg.won ? 'WON ✓' : 'LOST ✕'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6 border-cyan-500/30 bg-card/85 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-cyan-400" /> System Payout Breakdown
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-xs text-muted-foreground">Total Bets</div>
                  <div className="text-lg font-extrabold">{calculation.numBets} Lines</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-xs text-muted-foreground">Total Stake Outlay</div>
                  <div className="text-lg font-extrabold">${calculation.totalOutlay.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-border/60 pt-3">
                {(systemType === 'patent' || systemType === 'lucky15') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Singles Return:</span>
                    <span className="font-bold">${calculation.singlesReturn.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doubles Return:</span>
                  <span className="font-bold">${calculation.doublesReturn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trebles Return:</span>
                  <span className="font-bold">${calculation.treblesReturn.toFixed(2)}</span>
                </div>
                {activeLegCount === 4 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">4-Fold Return:</span>
                    <span className="font-bold">${calculation.fourfoldReturn.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xs text-muted-foreground">Total Gross Payout</div>
                <div className="text-2xl font-extrabold text-emerald-400">
                  ${calculation.totalReturn.toFixed(2)}
                </div>
                <div className="text-xs font-semibold mt-1">
                  Net Profit:{' '}
                  <span className={calculation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {calculation.netProfit >= 0 ? '+' : ''}${calculation.netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link to="/parlay-calculator">
                Compare with Standard Parlay Calculator <ArrowRight className="w-4 h-4 ml-1.5" />
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
