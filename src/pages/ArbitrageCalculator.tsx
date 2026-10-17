import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle2, AlertTriangle, Scale, ArrowRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ArbitrageCalculator() {
  const [mode, setMode] = useState<'2way' | '3way'>('3way');
  const [totalStake, setTotalStake] = useState<string>('1000');
  const [odds1, setOdds1] = useState<string>('2.45');
  const [oddsX, setOddsX] = useState<string>('3.80');
  const [odds2, setOdds2] = useState<string>('3.40');

  const calc = useMemo(() => {
    const stake = Math.max(1, parseFloat(totalStake) || 100);
    const o1 = Math.max(1.01, parseFloat(odds1) || 2.0);
    const oX = Math.max(1.01, parseFloat(oddsX) || 3.0);
    const o2 = Math.max(1.01, parseFloat(odds2) || 2.0);

    const imp1 = 1 / o1;
    const impX = mode === '3way' ? 1 / oX : 0;
    const imp2 = 1 / o2;
    const totalImplied = imp1 + impX + imp2;

    const isArb = totalImplied < 1;
    const roiPercent = ((1 / totalImplied - 1) * 100);

    const stake1 = (stake * imp1) / totalImplied;
    const stakeX = mode === '3way' ? (stake * impX) / totalImplied : 0;
    const stake2 = (stake * imp2) / totalImplied;

    const guaranteedPayout = stake / totalImplied;
    const netProfit = guaranteedPayout - stake;

    return {
      stake,
      imp1: (imp1 * 100).toFixed(2),
      impX: (impX * 100).toFixed(2),
      imp2: (imp2 * 100).toFixed(2),
      totalImpliedPercent: (totalImplied * 100).toFixed(2),
      isArb,
      roiPercent: roiPercent.toFixed(2),
      stake1: stake1.toFixed(2),
      stakeX: stakeX.toFixed(2),
      stake2: stake2.toFixed(2),
      guaranteedPayout: guaranteedPayout.toFixed(2),
      netProfit: netProfit.toFixed(2),
    };
  }, [mode, totalStake, odds1, oddsX, odds2]);

  const loadSampleArb = () => {
    setMode('3way');
    setTotalStake('1000');
    setOdds1('2.45');
    setOddsX('3.85');
    setOdds2('3.45');
    toast.success('Loaded live 3-Way 1X2 Surebet example (+2.41% guaranteed ROI)');
  };

  const copyBreakdown = () => {
    const summary = `Arbitrage Staking Breakdown ($${calc.stake} Total):\n- Outcome 1 (@${odds1}): Stake $${calc.stake1}\n${
      mode === '3way' ? `- Draw X (@${oddsX}): Stake $${calc.stakeX}\n` : ''
    }- Outcome 2 (@${odds2}): Stake $${calc.stake2}\nGuaranteed Payout: $${calc.guaranteedPayout} (${calc.roiPercent}% ROI)`;
    navigator.clipboard.writeText(summary);
    toast.success('Staking breakdown copied to clipboard!');
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Arbitrage Betting Calculator (2-Way & 3-Way Surebet & Dutching Tool)',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'All',
      url: 'https://predictpro.guru/arbitrage-calculator',
      description:
        'Free 2-way and 3-way sports betting arbitrage (surebet) and dutching calculator. Calculate exact stakes across bookmakers to lock in risk-free guaranteed profit.',
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
        title="Arbitrage Betting Calculator: 2-Way & 3-Way Surebet Staking Tool"
        description="Free 2-way and 3-way arbitrage betting calculator (Surebet & Dutching tool). Enter bookmaker odds to calculate exact stakes and lock in risk-free profit."
        canonical="/arbitrage-calculator"
        keywords="arbitrage betting calculator, surebet calculator, 3 way arbitrage calculator, dutching calculator football, hedge bet calculator, risk free betting calculator"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Arbitrage & Surebet Calculator' },
          ]}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold">
              <Calculator className="h-3.5 w-3.5 mr-1.5" /> Quantitative Staking Tool
            </Badge>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-semibold">
              2-Way &amp; 3-Way 1X2 Surebets
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Arbitrage Betting &amp; Surebet Calculator (2-Way &amp; 3-Way)
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Enter the highest decimal odds available across different bookmakers for a 2-way (Over/Under, BTTS, Tennis) or 3-way (Football 1X2) market. Our calculator instantly computes the exact stake per leg to lock in an equal profit regardless of the match result.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <Card className="lg:col-span-6 border-border/80">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Market Odds &amp; Bankroll</CardTitle>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={mode === '3way' ? 'default' : 'outline'}
                    onClick={() => setMode('3way')}
                    className="text-xs font-bold h-8"
                  >
                    3-Way (1X2)
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === '2way' ? 'default' : 'outline'}
                    onClick={() => setMode('2way')}
                    className="text-xs font-bold h-8"
                  >
                    2-Way (O/U)
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Input decimal odds from your bookmakers and total capital to deploy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="total-stake" className="text-xs font-bold">
                  Total Combined Stake ($)
                </Label>
                <Input
                  id="total-stake"
                  type="number"
                  min="1"
                  step="10"
                  value={totalStake}
                  onChange={(e) => setTotalStake(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="odds-1" className="text-xs font-semibold">
                    {mode === '3way' ? 'Home (1) Odds' : 'Outcome 1 Odds'}
                  </Label>
                  <Input
                    id="odds-1"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={odds1}
                    onChange={(e) => setOdds1(e.target.value)}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground block">Implied: {calc.imp1}%</span>
                </div>

                {mode === '3way' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="odds-x" className="text-xs font-semibold">
                      Draw (X) Odds
                    </Label>
                    <Input
                      id="odds-x"
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={oddsX}
                      onChange={(e) => setOddsX(e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground block">Implied: {calc.impX}%</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="odds-2" className="text-xs font-semibold">
                    {mode === '3way' ? 'Away (2) Odds' : 'Outcome 2 Odds'}
                  </Label>
                  <Input
                    id="odds-2"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={odds2}
                    onChange={(e) => setOdds2(e.target.value)}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground block">Implied: {calc.imp2}%</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={loadSampleArb} className="text-xs font-semibold">
                  Load Sample +2.4% Surebet
                </Button>
                <Button size="sm" variant="outline" onClick={copyBreakdown} className="text-xs font-semibold gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copy Stakes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-6 border-border/80 bg-muted/15">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Optimal Staking Allocation</CardTitle>
                {calc.isArb ? (
                  <Badge className="bg-emerald-500 text-emerald-950 font-black">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> SUREBET (+{calc.roiPercent}% ROI)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> No Arb ({calc.totalImpliedPercent}% Margin)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Stake on Outcome 1</span>
                  <span className="text-xl font-black font-mono text-foreground">${calc.stake1}</span>
                </div>
                {mode === '3way' && (
                  <div className="p-3.5 rounded-xl bg-background border border-border">
                    <span className="text-[11px] text-muted-foreground block">Stake on Draw (X)</span>
                    <span className="text-xl font-black font-mono text-foreground">${calc.stakeX}</span>
                  </div>
                )}
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Stake on Outcome 2</span>
                  <span className="text-xl font-black font-mono text-foreground">${calc.stake2}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-background border border-primary/30">
                <div>
                  <span className="text-xs text-muted-foreground block">Guaranteed Total Return</span>
                  <span className="text-2xl font-black font-mono text-foreground">${calc.guaranteedPayout}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Risk-Free Net Profit</span>
                  <span
                    className={`text-2xl font-black font-mono ${
                      Number(calc.netProfit) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {Number(calc.netProfit) >= 0 ? `+$${calc.netProfit}` : `-$${Math.abs(Number(calc.netProfit)).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Combined Market Implied Probability: <strong>{calc.totalImpliedPercent}%</strong>. Anytime the sum of implied probabilities across outcomes is strictly below <strong>100.00%</strong>, a mathematical arbitrage (surebet) exists.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
