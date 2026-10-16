import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Calculator,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Percent,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ValueBetCalculator() {
  const [decimalOdds, setDecimalOdds] = useState<number>(2.15);
  const [winProb, setWinProb] = useState<number>(52);
  const [stake, setStake] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);

  // Calculations
  const stats = useMemo(() => {
    const odds = Math.max(1.01, Number(decimalOdds) || 1.01);
    const probDecimal = Math.min(0.999, Math.max(0.001, (Number(winProb) || 50) / 100));
    
    // EV formula: EV% = (Probability * Odds - 1) * 100
    const evPercent = (probDecimal * odds - 1) * 100;
    const isPositiveEV = evPercent > 0;
    
    // Expected monetary return per stake
    const expectedReturn = (Number(stake) || 100) * (evPercent / 100);
    
    // Fair Odds = 1 / probability
    const fairOdds = 1 / probDecimal;
    
    // Implied Bookmaker Probability = 1 / odds
    const impliedProb = (1 / odds) * 100;
    
    // Edge = WinProb% - ImpliedProb%
    const edgePercentage = probDecimal * 100 - impliedProb;

    // Fractional Kelly recommendation (Half Kelly)
    // Kelly f* = (b*p - q) / b where b = odds - 1, p = prob, q = 1 - p
    const b = odds - 1;
    const p = probDecimal;
    const q = 1 - p;
    const fullKelly = (b * p - q) / b;
    const halfKelly = Math.max(0, fullKelly * 0.5 * 100);

    return {
      odds,
      probDecimal,
      evPercent,
      isPositiveEV,
      expectedReturn,
      fairOdds,
      impliedProb,
      edgePercentage,
      halfKelly,
    };
  }, [decimalOdds, winProb, stake]);

  const handleCopySummary = () => {
    const text = `PredictPro +EV Bet Analysis:\n• Bookmaker Odds: ${stats.odds.toFixed(2)}\n• Estimated Win Probability: ${winProb}%\n• Fair Odds: ${stats.fairOdds.toFixed(2)}\n• Expected Value (+EV): ${stats.evPercent > 0 ? '+' : ''}${stats.evPercent.toFixed(2)}%\n• Expected Profit per $${stake}: $${stats.expectedReturn.toFixed(2)}\n• Half-Kelly Bet Sizing: ${stats.halfKelly.toFixed(2)}% of bankroll\nCalculated at https://predictpro.guru/value-bet-calculator`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied +EV breakdown to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (odds: number, prob: number) => {
    setDecimalOdds(odds);
    setWinProb(prob);
    toast.info(`Loaded preset: ${odds.toFixed(2)} Odds @ ${prob}% True Probability`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Value Bet Calculator (+EV): Sports Betting Expected Value Tool"
        description="Free +EV Value Bet Calculator. Calculate positive expected value, bookmaker edge vs true probability, fair decimal odds, and recommended Kelly staking size."
        canonical="/value-bet-calculator"
        keywords="value bet calculator, expected value sports betting calculator, +ev calculator, positive expected value betting, betting edge calculator, fair odds calculator"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl space-y-8">
        <Breadcrumbs className="mb-2" />

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1">
            <Calculator className="w-3.5 h-3.5 mr-1" /> QUANTITATIVE +EV BETTING ENGINE
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Value Bet (+EV) Calculator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Determine whether a bookmaker line offers genuine positive expected value (+EV). Calculate your mathematical edge over bookmaker vig and find optimal bankroll stake sizes.
          </p>
        </div>

        {/* Interactive Calculator Card */}
        <Card className="border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Edge & Expected Value Inputs
                </CardTitle>
                <CardDescription className="text-xs">
                  Adjust decimal odds and true win probability to instantly calculate mathematical value.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDecimalOdds(2.00);
                  setWinProb(50);
                  setStake(100);
                }}
                className="text-xs h-8"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="text-muted-foreground font-semibold">Quick Presets:</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyPreset(2.20, 52)}
                className="h-7 text-xs"
              >
                +14.4% Underdog Value
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyPreset(1.55, 70)}
                className="h-7 text-xs"
              >
                +8.5% Banker Value
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyPreset(3.40, 33)}
                className="h-7 text-xs"
              >
                +12.2% Draw Stalemate
              </Button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Decimal Odds */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Bookmaker Decimal Odds
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    max="100"
                    value={decimalOdds}
                    onChange={(e) => setDecimalOdds(parseFloat(e.target.value) || 1.01)}
                    className="font-mono text-lg font-bold"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Implied Prob: <span className="font-bold text-foreground">{stats.impliedProb.toFixed(1)}%</span>
                </div>
              </div>

              {/* Estimated True Probability */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    True Win Probability
                  </label>
                  <span className="font-mono text-sm font-black text-primary">{winProb}%</span>
                </div>
                <Slider
                  min={1}
                  max={99}
                  step={1}
                  value={[winProb]}
                  onValueChange={(val) => setWinProb(val[0])}
                  className="py-2"
                />
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Fair Odds:</span>
                  <span className="font-bold text-foreground font-mono">{stats.fairOdds.toFixed(2)}</span>
                </div>
              </div>

              {/* Stake Amount */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Bet Stake Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="number"
                    min="1"
                    max="100000"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 100)}
                    className="pl-8 font-mono text-lg font-bold"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Recommended Half-Kelly: <span className="font-bold text-foreground">{stats.halfKelly.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Results Showcase Banner */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                stats.isPositiveEV
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-50'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-50'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Badge
                      className={
                        stats.isPositiveEV
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-rose-600 text-white font-bold'
                      }
                    >
                      {stats.isPositiveEV ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {stats.isPositiveEV ? 'POSITIVE EXPECTED VALUE (+EV)' : 'NEGATIVE EXPECTED VALUE (-EV)'}
                    </Badge>
                  </div>
                  <div className="text-3xl md:text-5xl font-black font-mono">
                    {stats.evPercent > 0 ? '+' : ''}
                    {stats.evPercent.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {stats.isPositiveEV
                      ? `For every $${stake} wagered at these odds over time, your expected net mathematical profit is $${stats.expectedReturn.toFixed(2)}.`
                      : `The bookmaker holds a ${Math.abs(stats.evPercent).toFixed(2)}% mathematical house edge. Long term this bet will bleed bankroll.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-center font-mono">
                  <div className="p-3 bg-background/80 rounded-xl border min-w-[120px]">
                    <div className="text-[10px] text-muted-foreground font-sans font-semibold">Bettor Edge</div>
                    <div className="text-base font-bold text-foreground">
                      {stats.edgePercentage > 0 ? '+' : ''}
                      {stats.edgePercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-background/80 rounded-xl border min-w-[120px]">
                    <div className="text-[10px] text-muted-foreground font-sans font-semibold">Expected Profit</div>
                    <div
                      className={`text-base font-bold ${
                        stats.expectedReturn > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {stats.expectedReturn > 0 ? '+$' : '-$'}
                      {Math.abs(stats.expectedReturn).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="gap-1.5 text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy +EV Breakdown'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Educational Guide */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl md:text-2xl font-black">
            The Mathematics of Expected Value (+EV) in Sports Betting
          </h2>
          <div className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
            <p>
              Expected Value (EV) measures the average outcome of a wager if it were repeated infinitely under identical conditions. Successful professional sports bettors do not try to predict individual match winners; instead, they exploit discrepancies where bookmaker odds underestimate the true probability of an event.
            </p>
            <div className="p-4 bg-muted/40 rounded-xl border font-mono text-xs text-foreground space-y-1">
              <div className="font-bold text-primary">Formula:</div>
              <div>EV = (Probability × (Decimal Odds - 1)) - (1 - Probability)</div>
            </div>
            <p>
              When your calculated EV is greater than 0, you possess an actionable market edge. When combined with disciplined fractional Kelly bankroll staking, a bettor guarantees positive long-term geometric compounding.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
