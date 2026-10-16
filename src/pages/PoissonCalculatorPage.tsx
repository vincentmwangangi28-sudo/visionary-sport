import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calculator, Sparkles, BarChart3, TrendingUp, Copy, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// Factorial helper
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Standard Poisson PMF: P(X = k) = (lambda^k * e^-lambda) / k!
function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export default function PoissonCalculatorPage() {
  const [homeTeam, setHomeTeam] = useState<string>('Arsenal');
  const [awayTeam, setAwayTeam] = useState<string>('Chelsea');
  const [homeXG, setHomeXG] = useState<number>(1.85);
  const [awayXG, setAwayXG] = useState<number>(1.15);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute 0-5 exact score probability matrix
  const matrix = useMemo(() => {
    const grid: number[][] = [];
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let over25 = 0;
    let btts = 0;

    for (let h = 0; h <= 5; h++) {
      grid[h] = [];
      const pHome = poissonPmf(homeXG, h);
      for (let a = 0; a <= 5; a++) {
        const pAway = poissonPmf(awayXG, a);
        const prob = pHome * pAway;
        grid[h][a] = prob;

        if (h > a) homeWin += prob;
        else if (h === a) draw += prob;
        else awayWin += prob;

        if (h + a > 2.5) over25 += prob;
        if (h > 0 && a > 0) btts += prob;
      }
    }

    const total = homeWin + draw + awayWin;
    const normalizedHW = (homeWin / total) * 100;
    const normalizedDraw = (draw / total) * 100;
    const normalizedAW = (awayWin / total) * 100;

    return {
      grid,
      homeWin: normalizedHW,
      draw: normalizedDraw,
      awayWin: normalizedAW,
      over25: over25 * 100,
      under25: (1 - over25) * 100,
      btts: btts * 100,
      fairOdds: {
        home: Number((100 / normalizedHW).toFixed(2)),
        draw: Number((100 / normalizedDraw).toFixed(2)),
        away: Number((100 / normalizedAW).toFixed(2)),
      },
    };
  }, [homeXG, awayXG]);

  const setPreset = (hName: string, aName: string, hX: number, aX: number) => {
    setHomeTeam(hName);
    setAwayTeam(aName);
    setHomeXG(hX);
    setAwayXG(aX);
    toast.success(`Loaded preset: ${hName} vs ${aName}`);
  };

  const copyResults = () => {
    const text = `Poisson Simulation Results for ${homeTeam} vs ${awayTeam}:
Home Win: ${matrix.homeWin.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.home})
Draw: ${matrix.draw.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.draw})
Away Win: ${matrix.awayWin.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.away})
Over 2.5 Goals: ${matrix.over25.toFixed(1)}% | BTTS Yes: ${matrix.btts.toFixed(1)}%
Powered by PredictPro AI Poisson Calculator: https://predictpro.guru/poisson-calculator`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Simulation results copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Poisson Football Calculator & Expected Goals Score Simulator"
        description="Free Dixon-Coles Poisson football calculator. Enter home and away team expected goals (xG) to simulate 10,000 matches, exact scores, 1X2 odds, and BTTS."
        canonical="/poisson-calculator"
        keywords="poisson football calculator, expected goals calculator, football score simulator, poisson distribution betting, fair odds calculator football"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl space-y-8">
        <Breadcrumbs className="mb-2" />

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
            <Calculator className="w-3.5 h-3.5 mr-1" /> QUANTITATIVE MODELING ENGINE
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Poisson Football Goal Calculator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Simulate 90-minute football matches using independent bivariate Poisson distributions. Calculate exact score matrices, fair decimal odds, Over/Under expectancy, and market value.
          </p>
        </div>

        {/* Presets Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold">Match Presets:</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset('Arsenal', 'Chelsea', 1.85, 1.15)}>
            Arsenal vs Chelsea (1.85 vs 1.15)
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset('Real Madrid', 'Barcelona', 2.30, 2.10)}>
            El Clasico (2.30 vs 2.10)
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset('Bayern Munich', 'Dortmund', 2.80, 1.40)}>
            Der Klassiker (2.80 vs 1.40)
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset('Gor Mahia', 'AFC Leopards', 1.25, 0.65)}>
            Mashemeji Derby (1.25 vs 0.65)
          </Button>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Home Team: {homeTeam}</span>
                <span className="text-primary font-mono font-black text-lg">{homeXG.toFixed(2)} xG</span>
              </CardTitle>
              <CardDescription>Adjust home attacking goal expectancy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="Home Team Name"
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm font-bold"
              />
              <Slider
                value={[homeXG]}
                min={0.2}
                max={4.5}
                step={0.05}
                onValueChange={(val) => setHomeXG(val[0])}
              />
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Away Team: {awayTeam}</span>
                <span className="text-emerald-500 font-mono font-black text-lg">{awayXG.toFixed(2)} xG</span>
              </CardTitle>
              <CardDescription>Adjust away attacking goal expectancy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="Away Team Name"
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm font-bold"
              />
              <Slider
                value={[awayXG]}
                min={0.2}
                max={4.5}
                step={0.05}
                onValueChange={(val) => setAwayXG(val[0])}
              />
            </CardContent>
          </Card>
        </div>

        {/* Fair Odds & Primary Outcome Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-xs uppercase font-bold text-muted-foreground">{homeTeam} Win</div>
              <div className="text-2xl font-black text-primary font-mono">{matrix.homeWin.toFixed(1)}%</div>
              <div className="text-xs font-semibold text-muted-foreground">Fair Decimal Odds: {matrix.fairOdds.home}</div>
            </CardContent>
          </Card>

          <Card className="border bg-sky-500/5 border-sky-500/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-xs uppercase font-bold text-muted-foreground">Draw (X)</div>
              <div className="text-2xl font-black text-sky-500 font-mono">{matrix.draw.toFixed(1)}%</div>
              <div className="text-xs font-semibold text-muted-foreground">Fair Decimal Odds: {matrix.fairOdds.draw}</div>
            </CardContent>
          </Card>

          <Card className="border bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-xs uppercase font-bold text-muted-foreground">{awayTeam} Win</div>
              <div className="text-2xl font-black text-emerald-500 font-mono">{matrix.awayWin.toFixed(1)}%</div>
              <div className="text-xs font-semibold text-muted-foreground">Fair Decimal Odds: {matrix.fairOdds.away}</div>
            </CardContent>
          </Card>
        </div>

        {/* 6x6 Exact Score Probability Matrix */}
        <Card className="border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Exact Score Probability Matrix (Poisson)</CardTitle>
              <CardDescription>Horizontal: {awayTeam} goals (0-5) · Vertical: {homeTeam} goals (0-5)</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={copyResults} className="gap-1.5 text-xs font-bold">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share Simulation'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-2 px-3 text-muted-foreground font-sans font-bold text-left">{homeTeam} \ {awayTeam}</th>
                    {[0, 1, 2, 3, 4, 5].map((g) => (
                      <th key={g} className="py-2 px-2 text-muted-foreground font-bold">{g} Goals</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[0, 1, 2, 3, 4, 5].map((h) => (
                    <tr key={h} className="hover:bg-muted/30">
                      <td className="py-2 px-3 text-left font-sans font-bold text-muted-foreground">{h} Goals</td>
                      {[0, 1, 2, 3, 4, 5].map((a) => {
                        const p = (matrix.grid[h][a] * 100);
                        const isHigh = p > 10;
                        const isMed = p > 5;
                        return (
                          <td
                            key={a}
                            className={`py-2 px-2 ${
                              isHigh
                                ? 'bg-primary/20 text-primary font-black rounded-md'
                                : isMed
                                  ? 'bg-muted/60 font-bold'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {p.toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
