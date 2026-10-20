import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, Trash2, Layers } from 'lucide-react';

interface ParlayLeg {
  id: number;
  label: string;
  odds: string;
}

export default function ParlayCalculator() {
  const [stake, setStake] = useState<string>('50');
  const [legs, setLegs] = useState<ParlayLeg[]>([
    { id: 1, label: 'Leg 1 (Home Banker)', odds: '1.55' },
    { id: 2, label: 'Leg 2 (Over 1.5 Goals)', odds: '1.35' },
    { id: 3, label: 'Leg 3 (BTTS - Yes)', odds: '1.75' },
  ]);

  const addLeg = () => {
    setLegs((prev) => [
      ...prev,
      { id: Date.now(), label: `Leg ${prev.length + 1}`, odds: '1.60' },
    ]);
  };

  const removeLeg = (id: number) => {
    if (legs.length <= 2) return;
    setLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const updateOdds = (id: number, val: string) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, odds: val } : l)));
  };

  const summary = useMemo(() => {
    const wager = Math.max(1, parseFloat(stake) || 10);
    const validOdds = legs.map((l) => Math.max(1.01, parseFloat(l.odds) || 1.5));
    const combinedDecimal = validOdds.reduce((acc, o) => acc * o, 1);
    const impliedWinProb = (1 / combinedDecimal) * 100;
    const totalReturn = wager * combinedDecimal;
    const netProfit = totalReturn - wager;

    return {
      combinedDecimal: combinedDecimal.toFixed(2),
      impliedWinProb: impliedWinProb.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      netProfit: netProfit.toFixed(2),
    };
  }, [stake, legs]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Parlay & Football Accumulator Odds Calculator',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'All',
      url: 'https://predictpro.guru/parlay-calculator',
      description:
        'Free multi-leg Parlay and Football Accumulator (Acca) odds calculator. Calculate combined decimal odds, implied hit probability, and exact multi-bet payouts.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Parlay & Accumulator Odds Calculator: Multi-Bet Payout Tool"
        description="Free Parlay and Football Accumulator (Acca) odds calculator. Add up to 15 legs to calculate combined decimal odds, true hit probability, and net profit."
        canonical="/parlay-calculator"
        keywords="parlay calculator, accumulator odds calculator, football acca calculator, multi bet payout calculator, parlay implied probability"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 max-w-5xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Parlay & Accumulator Calculator' },
          ]}
        />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Multi-Bet Payout &amp; Compounded Odds Engine
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">Up to 15 Selections</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Parlay &amp; Football Accumulator Odds Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Enter your stake and add decimal odds for each selection in your accumulator or parlay slip to calculate exact compounded payouts and true implied win probability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Accumulator Legs ({legs.length})</CardTitle>
                <CardDescription className="text-xs">Add or adjust individual match odds</CardDescription>
              </div>
              <Button size="sm" onClick={addLeg} className="text-xs font-bold gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Leg
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 pb-2 border-b border-border/60">
                <Label htmlFor="parlay-stake" className="text-xs font-bold">
                  Total Parlay Stake ($)
                </Label>
                <Input
                  id="parlay-stake"
                  type="number"
                  min="1"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>

              {legs.map((leg, i) => (
                <div key={leg.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                    Leg #{i + 1}
                  </span>
                  <Input
                    type="number"
                    step="0.05"
                    min="1.01"
                    value={leg.odds}
                    onChange={(e) => updateOdds(leg.id, e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={legs.length <= 2}
                    onClick={() => removeLeg(leg.id)}
                    aria-label={`Remove Leg ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-500" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 border-border/80 bg-muted/15">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Compounded Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Combined Odds</span>
                  <span className="text-2xl font-black font-mono text-primary">{summary.combinedDecimal}x</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Implied Hit Rate</span>
                  <span className="text-2xl font-black font-mono text-foreground">{summary.impliedWinProb}%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Net Profit:</span>
                  <span className="text-xl font-black font-mono text-emerald-500">+${summary.netProfit}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-xs font-bold text-foreground">Total Payout:</span>
                  <span className="text-2xl font-black font-mono text-foreground">${summary.totalReturn}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
