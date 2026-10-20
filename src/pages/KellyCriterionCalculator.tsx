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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  ShieldCheck,
  TrendingUp,
  Percent,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type KellyFraction = 'full' | 'half' | 'quarter';

export default function KellyCriterionCalculator() {
  const [bankroll, setBankroll] = useState<number>(2500);
  const [odds, setOdds] = useState<number>(2.20);
  const [winProb, setWinProb] = useState<number>(50);
  const [fraction, setFraction] = useState<KellyFraction>('half');
  const [copied, setCopied] = useState<boolean>(false);

  const stats = useMemo(() => {
    const bRoll = Math.max(1, Number(bankroll) || 100);
    const decOdds = Math.max(1.01, Number(odds) || 1.01);
    const p = Math.min(0.999, Math.max(0.001, (Number(winProb) || 50) / 100));
    const q = 1 - p;
    const b = decOdds - 1; // net odds received on the wager

    // Standard Kelly formula: f* = (b*p - q) / b
    const rawKellyFraction = (b * p - q) / b;
    const hasEdge = rawKellyFraction > 0;

    const multiplier = fraction === 'full' ? 1.0 : fraction === 'half' ? 0.5 : 0.25;
    const recommendedPercentage = hasEdge ? rawKellyFraction * multiplier * 100 : 0;
    const recommendedStake = hasEdge ? (bRoll * recommendedPercentage) / 100 : 0;

    // Expected value %
    const evPercent = (p * decOdds - 1) * 100;

    // Estimated expected growth rate per bet (log growth)
    const growthRate = hasEdge
      ? (p * Math.log(1 + (recommendedPercentage / 100) * b) + q * Math.log(1 - recommendedPercentage / 100)) * 100
      : 0;

    // Estimated 50-bet bankroll trajectory
    const trajectory = [10, 25, 50, 100].map((numBets) => {
      const projected = bRoll * Math.pow(1 + (hasEdge ? growthRate / 100 : 0), numBets);
      return {
        bets: numBets,
        amount: Math.round(projected),
      };
    });

    return {
      hasEdge,
      rawKellyFraction,
      recommendedPercentage,
      recommendedStake,
      evPercent,
      growthRate,
      trajectory,
    };
  }, [bankroll, odds, winProb, fraction]);

  const handleCopy = () => {
    const text = `Kelly Criterion Staking Calculation:\n• Bankroll: $${bankroll}\n• Decimal Odds: ${odds.toFixed(2)}\n• Win Probability: ${winProb}%\n• Fraction: ${fraction.toUpperCase()} Kelly\n• Optimal Bet Size: $${stats.recommendedStake.toFixed(2)} (${stats.recommendedPercentage.toFixed(2)}% of bankroll)\n• Expected Value (+EV): ${stats.evPercent.toFixed(2)}%\nCalculated with PredictPro (https://predictpro.guru/kelly-criterion-calculator)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied Kelly calculation to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Kelly Criterion Calculator: Sports Betting Bankroll Staking Tool"
        description="Free Kelly Criterion Calculator. Calculate optimal bet sizing, fractional Kelly (Half/Quarter), expected bankroll growth rate, and bankroll protection."
        canonical="/kelly-criterion-calculator"
        keywords="kelly criterion calculator, fractional kelly sports betting, bankroll management calculator, optimal bet sizing, half kelly calculator, kelly formula betting"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-4xl space-y-6">
        <Breadcrumbs className="mb-1" />

        {/* Dark Broadcast Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Bankroll Staking &amp; Risk Optimization
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">Full, Half &amp; Quarter Kelly</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelly Criterion Calculator
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Eliminate the risk of ruin. The Kelly Criterion mathematically optimizes bet sizing to maximize the geometric growth rate of your bankroll while preventing over-staking on variance.
          </p>
        </div>

        {/* Calculator Main Card */}
        <Card className="border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Optimal Bet Sizing Parameters
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter your current total sports betting bankroll, the available odds, and your estimated true win probability.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBankroll(2500);
                  setOdds(2.20);
                  setWinProb(50);
                  setFraction('half');
                }}
                className="text-xs h-8"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Fraction Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Kelly Fraction (Risk Tolerance)
              </label>
              <Tabs
                value={fraction}
                onValueChange={(val) => setFraction(val as KellyFraction)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full h-10 bg-muted/60 p-1">
                  <TabsTrigger value="half" className="text-xs font-bold">
                    Half Kelly (0.5x - Recommended)
                  </TabsTrigger>
                  <TabsTrigger value="quarter" className="text-xs font-bold">
                    Quarter Kelly (0.25x - Ultra Safe)
                  </TabsTrigger>
                  <TabsTrigger value="full" className="text-xs font-bold">
                    Full Kelly (1.0x - High Volatility)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Parameter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Bankroll */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Bankroll ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="number"
                    min="10"
                    max="1000000"
                    value={bankroll}
                    onChange={(e) => setBankroll(parseFloat(e.target.value) || 100)}
                    className="pl-8 font-mono text-lg font-bold"
                  />
                </div>
              </div>

              {/* Decimal Odds */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Decimal Odds
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="1.01"
                  max="50"
                  value={odds}
                  onChange={(e) => setOdds(parseFloat(e.target.value) || 1.01)}
                  className="font-mono text-lg font-bold"
                />
              </div>

              {/* Win Probability */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Win Probability
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
              </div>
            </div>

            {/* Results Showcase */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                stats.hasEdge
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-amber-500/10 border-amber-500/40'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center md:text-left">
                  <Badge
                    className={
                      stats.hasEdge
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-amber-600 text-white font-bold'
                    }
                  >
                    {stats.hasEdge ? 'OPTIMAL POSITIVE STAKE' : 'NO MATHEMATICAL EDGE - DO NOT BET'}
                  </Badge>

                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <div className="text-3xl md:text-5xl font-black font-mono text-foreground">
                      ${stats.recommendedStake.toFixed(2)}
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ({stats.recommendedPercentage.toFixed(2)}% of Bankroll)
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground max-w-md">
                    {stats.hasEdge
                      ? `Based on a ${fraction.toUpperCase()} Kelly model with +${stats.evPercent.toFixed(1)}% expected value, staking this precise fraction optimizes long-term compound growth.`
                      : 'The expected value is negative or zero. The Kelly formula dictates a $0.00 wager to protect your bankroll.'}
                  </p>
                </div>

                {/* Growth Projections */}
                <div className="p-4 bg-background/80 rounded-xl border space-y-2 min-w-[200px] text-center font-mono">
                  <div className="text-[10px] text-muted-foreground font-sans font-semibold">
                    Simulated 50-Bet Horizon
                  </div>
                  <div className="text-xl font-black text-foreground">
                    ${stats.trajectory[2].amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    +{stats.growthRate.toFixed(2)}% Growth / Bet
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Staking Breakdown'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kelly Strategy Notes */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl md:text-2xl font-black">
            Why Professional Sports Bettors Use Half-Kelly
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1.5">
              <strong className="text-foreground text-sm block">1. Defense Against Over-Confidence</strong>
              Even advanced machine learning models occasionally overestimate true win probabilities. Using Half-Kelly (0.5x multiplier) provides a 50% margin of error buffer while capturing 75% of the theoretical maximum growth rate.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1.5">
              <strong className="text-foreground text-sm block">2. Volatility Reduction</strong>
              Full Kelly staking experiences massive 50%+ drawdowns during routine negative variance streaks. Half-Kelly slashes expected drawdowns by more than two-thirds, ensuring mental discipline and bankroll longevity.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
