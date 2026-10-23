import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { Calculator, Sparkles, Copy, Check, Ticket, Plus, Target } from 'lucide-react';
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

// Dixon-Coles low-scoring correlation adjustment tau(h, a)
function dixonColesTau(h: number, a: number, lambdaH: number, lambdaA: number, rho: number): number {
  if (h === 0 && a === 0) return Math.max(0.2, 1 - lambdaH * lambdaA * rho);
  if (h === 0 && a === 1) return Math.max(0.2, 1 + lambdaH * rho);
  if (h === 1 && a === 0) return Math.max(0.2, 1 + lambdaA * rho);
  if (h === 1 && a === 1) return Math.max(0.2, 1 - rho);
  return 1.0;
}

export default function PoissonCalculatorPage() {
  const [searchParams] = useSearchParams();
  const { predictions } = usePredictions(1);
  const { addSelection, setIsOpen } = useBetSlip();

  const [homeTeam, setHomeTeam] = useState<string>(() => searchParams.get('home') || 'Arsenal');
  const [awayTeam, setAwayTeam] = useState<string>(() => searchParams.get('away') || 'Chelsea');
  const [league, setLeague] = useState<string>(() => searchParams.get('league') || 'Premier League');
  const [homeXG, setHomeXG] = useState<number>(() => {
    const parsed = parseFloat(searchParams.get('hxg') || '');
    return !Number.isNaN(parsed) && parsed >= 0.2 && parsed <= 4.5 ? parsed : 1.85;
  });
  const [awayXG, setAwayXG] = useState<number>(() => {
    const parsed = parseFloat(searchParams.get('axg') || '');
    return !Number.isNaN(parsed) && parsed >= 0.2 && parsed <= 4.5 ? parsed : 1.15;
  });
  const [rho, setRho] = useState<number>(-0.08); // Dixon-Coles correlation parameter
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const qHome = searchParams.get('home');
    const qAway = searchParams.get('away');
    const qLeague = searchParams.get('league');
    const qHxg = parseFloat(searchParams.get('hxg') || '');
    const qAxg = parseFloat(searchParams.get('axg') || '');
    if (qHome) setHomeTeam(qHome);
    if (qAway) setAwayTeam(qAway);
    if (qLeague) setLeague(qLeague);
    if (!Number.isNaN(qHxg) && qHxg >= 0.2 && qHxg <= 4.5) setHomeXG(qHxg);
    if (!Number.isNaN(qAxg) && qAxg >= 0.2 && qAxg <= 4.5) setAwayXG(qAxg);
  }, [searchParams]);

  // Compute 0-5 exact score probability matrix with Dixon-Coles tau adjustment
  const matrix = useMemo(() => {
    const rawGrid: number[][] = [];
    let rawSum = 0;

    for (let h = 0; h <= 5; h++) {
      rawGrid[h] = [];
      const pHome = poissonPmf(homeXG, h);
      for (let a = 0; a <= 5; a++) {
        const pAway = poissonPmf(awayXG, a);
        const tau = dixonColesTau(h, a, homeXG, awayXG, rho);
        const prob = Math.max(0, pHome * pAway * tau);
        rawGrid[h][a] = prob;
        rawSum += prob;
      }
    }

    const normFactor = rawSum > 0 ? 1 / rawSum : 1;
    const grid: number[][] = [];
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let over15 = 0;
    let over25 = 0;
    let over35 = 0;
    let btts = 0;
    const flatScores: Array<{ score: string; h: number; a: number; prob: number; fairOdds: number }> = [];

    for (let h = 0; h <= 5; h++) {
      grid[h] = [];
      for (let a = 0; a <= 5; a++) {
        const prob = rawGrid[h][a] * normFactor;
        grid[h][a] = prob;

        if (h > a) homeWin += prob;
        else if (h === a) draw += prob;
        else awayWin += prob;

        if (h + a > 1.5) over15 += prob;
        if (h + a > 2.5) over25 += prob;
        if (h + a > 3.5) over35 += prob;
        if (h > 0 && a > 0) btts += prob;

        const pct = prob * 100;
        flatScores.push({
          score: `${h}-${a}`,
          h,
          a,
          prob: pct,
          fairOdds: pct > 0.5 ? Number(Math.min(99, 100 / pct).toFixed(2)) : 50.0,
        });
      }
    }

    flatScores.sort((x, y) => y.prob - x.prob);

    const normalizedHW = Math.max(1, homeWin * 100);
    const normalizedDraw = Math.max(1, draw * 100);
    const normalizedAW = Math.max(1, awayWin * 100);
    const over25Pct = Math.max(1, over25 * 100);
    const under25Pct = Math.max(1, (1 - over25) * 100);
    const bttsPct = Math.max(1, btts * 100);

    return {
      grid,
      topScores: flatScores.slice(0, 5),
      homeWin: normalizedHW,
      draw: normalizedDraw,
      awayWin: normalizedAW,
      over15: over15 * 100,
      over25: over25Pct,
      over35: over35 * 100,
      under25: under25Pct,
      btts: bttsPct,
      fairOdds: {
        home: Number((100 / normalizedHW).toFixed(2)),
        draw: Number((100 / normalizedDraw).toFixed(2)),
        away: Number((100 / normalizedAW).toFixed(2)),
        over25: Number((100 / over25Pct).toFixed(2)),
        under25: Number((100 / under25Pct).toFixed(2)),
        bttsYes: Number((100 / bttsPct).toFixed(2)),
      },
    };
  }, [homeXG, awayXG, rho]);

  const setPreset = (hName: string, aName: string, hX: number, aX: number, lg = 'Football') => {
    setHomeTeam(hName);
    setAwayTeam(aName);
    setLeague(lg);
    setHomeXG(hX);
    setAwayXG(aX);
    toast.success(`Loaded fixture into Poisson Simulator: ${hName} vs ${aName}`);
  };

  const handleLoadFromLiveFixture = (matchId: string) => {
    const found = predictions.find((p) => String(p.id) === matchId);
    if (!found) return;
    const hOdds = found.home_odds || 1.9;
    const aOdds = found.away_odds || 3.1;
    // Derive realistic xG from bookmaker implied odds
    const calcHomeXg = Number(Math.min(3.4, Math.max(0.65, 2.55 / Math.pow(hOdds, 0.65))).toFixed(2));
    const calcAwayXg = Number(Math.min(3.1, Math.max(0.45, 2.25 / Math.pow(aOdds, 0.65))).toFixed(2));
    setPreset(found.home_team, found.away_team, calcHomeXg, calcAwayXg, found.league);
  };

  const handleAddMarketToSlip = (marketLabel: string, odds: number, prob: number) => {
    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      market: marketLabel,
      odds: Number(Math.max(1.12, odds).toFixed(2)),
      confidence: Math.min(95, Math.max(35, Math.round(prob))),
    });
    setIsOpen(true);
    toast.success(`Added ${marketLabel} (@${odds.toFixed(2)}) to Bet Slip!`);
  };

  const copyResults = () => {
    const text = `Poisson & Dixon-Coles Simulation for ${homeTeam} vs ${awayTeam}:
Home Win: ${matrix.homeWin.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.home})
Draw: ${matrix.draw.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.draw})
Away Win: ${matrix.awayWin.toFixed(1)}% (Fair Odd: ${matrix.fairOdds.away})
Over 2.5 Goals: ${matrix.over25.toFixed(1)}% | BTTS Yes: ${matrix.btts.toFixed(1)}%
Top Exact Score: ${matrix.topScores[0]?.score} (${matrix.topScores[0]?.prob.toFixed(1)}%)
Powered by PredictPro AI Poisson Calculator: https://predictpro.guru/poisson-calculator`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Simulation results copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Interactive Poisson & Exact Score Matrix Simulator (Forebet & Understat Style)"
        description="Interactive Dixon-Coles bivariate Poisson football calculator. Simulate 6x6 exact score matrices, adjust Home/Away xG sliders, and add fair-odds picks directly to your Bet Slip."
        canonical="/poisson-calculator"
        keywords="poisson football calculator, exact score matrix simulator, expected goals calculator, dixon coles football model, fair odds calculator football"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-24 md:pb-12 max-w-6xl space-y-6">
        <Breadcrumbs className="mb-1" />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Dixon-Coles Bivariate Goal Distribution · Interactive 6x6 Exact Score Matrix
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Interactive Poisson &amp; Exact Score Simulator
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-1 max-w-3xl">
                Adjust Home and Away Expected Goals (xG) or load any live upcoming fixture to compute exact score heatmaps, fair decimal odds, and 1-click Bet Slip selections.
              </p>
            </div>

            {predictions.length > 0 && (
              <div className="w-full lg:w-72 shrink-0 space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Auto-Load Upcoming Fixture xG
                </label>
                <select
                  onChange={(e) => handleLoadFromLiveFixture(e.target.value)}
                  defaultValue=""
                  className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                >
                  <option value="" disabled>
                    Select a match from today&apos;s slate...
                  </option>
                  {predictions.slice(0, 20).map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.home_team} vs {p.away_team} ({p.league})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Presets Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-3 border-t border-slate-800">
            <span className="text-slate-400 font-semibold">Match Presets:</span>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white" onClick={() => setPreset('Arsenal', 'Chelsea', 1.85, 1.15, 'Premier League')}>
              Arsenal vs Chelsea (1.85 vs 1.15)
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white" onClick={() => setPreset('Real Madrid', 'Barcelona', 2.30, 2.10, 'LaLiga')}>
              El Clásico (2.30 vs 2.10)
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white" onClick={() => setPreset('Bayern Munich', 'Dortmund', 2.80, 1.40, 'Bundesliga')}>
              Der Klassiker (2.80 vs 1.40)
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white" onClick={() => setPreset('Gor Mahia', 'AFC Leopards', 1.25, 0.65, 'FKF Premier League')}>
              Mashemeji Derby (1.25 vs 0.65)
            </Button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <TeamLogo team={homeTeam} size="xs" />
                  <span>{homeTeam} (Home)</span>
                </span>
                <span className="text-primary font-mono font-black text-base">{homeXG.toFixed(2)} xG</span>
              </CardTitle>
              <CardDescription className="text-xs">Home attacking goal expectancy ($\lambda_H$)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="Home Team Name"
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs font-bold"
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
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <TeamLogo team={awayTeam} size="xs" />
                  <span>{awayTeam} (Away)</span>
                </span>
                <span className="text-emerald-500 font-mono font-black text-base">{awayXG.toFixed(2)} xG</span>
              </CardTitle>
              <CardDescription className="text-xs">Away attacking goal expectancy ($\lambda_A$)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="Away Team Name"
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs font-bold"
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

          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Dixon-Coles Correlation ($\rho$)</span>
                <span className="text-sky-500 font-mono font-black text-base">{rho.toFixed(2)}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Adjusts low-score (0-0, 1-1) tactical draw clustering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>Defensive (-0.20)</span>
                <span>Independent (0)</span>
                <span>Open (+0.20)</span>
              </div>
              <Slider
                value={[rho]}
                min={-0.2}
                max={0.2}
                step={0.02}
                onValueChange={(val) => setRho(val[0])}
              />
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Match Goal Expectancy:</span>
                <span className="font-mono font-black text-foreground">{(homeXG + awayXG).toFixed(2)} Goals</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fair Odds & Primary Outcome Summary with 1-Click Add to Bet Slip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: `${homeTeam} Win`, market: 'Home Win', prob: matrix.homeWin, odds: matrix.fairOdds.home, color: 'text-primary' },
            { label: 'Draw (X)', market: 'Draw', prob: matrix.draw, odds: matrix.fairOdds.draw, color: 'text-sky-500' },
            { label: `${awayTeam} Win`, market: 'Away Win', prob: matrix.awayWin, odds: matrix.fairOdds.away, color: 'text-emerald-500' },
            { label: 'Over 2.5 Goals', market: 'Over 2.5 Goals', prob: matrix.over25, odds: matrix.fairOdds.over25, color: 'text-amber-500' },
            { label: 'Under 2.5 Goals', market: 'Under 2.5 Goals', prob: matrix.under25, odds: matrix.fairOdds.under25, color: 'text-foreground' },
            { label: 'BTTS: Yes (GG)', market: 'BTTS Yes', prob: matrix.btts, odds: matrix.fairOdds.bttsYes, color: 'text-emerald-500' },
          ].map((item) => (
            <Card key={item.market} className="border bg-card hover:border-primary/50 transition-all">
              <CardContent className="p-3.5 text-center space-y-1.5 flex flex-col justify-between h-full">
                <div>
                  <div className="text-[11px] uppercase font-bold text-muted-foreground truncate">{item.label}</div>
                  <div className={`text-xl font-black font-mono ${item.color}`}>{item.prob.toFixed(1)}%</div>
                  <div className="text-[11px] font-mono text-muted-foreground">Fair Odd: @{item.odds}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddMarketToSlip(item.market, item.odds, item.prob)}
                  className="w-full h-7 text-[11px] font-bold gap-1 mt-1"
                >
                  <Plus className="h-3 w-3" /> Add Pick
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top 5 Most Likely Exact Scorelines */}
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Top 5 Most Probable Correct Scorelines (Click to Add to Slip)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {matrix.topScores.map((s, idx) => (
                <button
                  key={s.score}
                  type="button"
                  onClick={() =>
                    handleAddMarketToSlip(`Correct Score ${s.score}`, s.fairOdds, s.prob * 4)
                  }
                  className="p-3 rounded-xl border bg-muted/30 hover:bg-primary/10 hover:border-primary transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                    <span>RANK #{idx + 1}</span>
                    <span className="font-mono text-primary group-hover:underline">+ Slip</span>
                  </div>
                  <div className="font-mono font-black text-xl text-foreground">{s.score}</div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="font-bold text-emerald-500">{s.prob.toFixed(1)}%</span>
                    <span className="font-mono text-muted-foreground">@{s.fairOdds}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 6x6 Exact Score Probability Matrix */}
        <Card className="border bg-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Interactive 6x6 Exact Score Probability Matrix (Click Any Cell to Bet)
              </CardTitle>
              <CardDescription>
                Columns: {awayTeam} goals (0–5) · Rows: {homeTeam} goals (0–5) · Click any scoreline cell to add to Bet Slip
              </CardDescription>
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
                    <th className="py-2.5 px-3 text-muted-foreground font-sans font-bold text-left">
                      {homeTeam} \ {awayTeam}
                    </th>
                    {[0, 1, 2, 3, 4, 5].map((g) => (
                      <th key={g} className="py-2.5 px-2 text-muted-foreground font-bold">
                        {g} Goals
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[0, 1, 2, 3, 4, 5].map((h) => (
                    <tr key={h} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 text-left font-sans font-bold text-muted-foreground">
                        {h} Goals
                      </td>
                      {[0, 1, 2, 3, 4, 5].map((a) => {
                        const p = matrix.grid[h][a] * 100;
                        const fairOdd = p > 0.4 ? Number(Math.min(99, 100 / p).toFixed(2)) : 65.0;
                        const isHigh = p >= 9.5;
                        const isMed = p >= 5.0 && p < 9.5;
                        return (
                          <td key={a} className="p-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleAddMarketToSlip(`Correct Score ${h}-${a}`, fairOdd, Math.max(45, p * 4.5))
                              }
                              title={`Add Correct Score ${h}-${a} (@${fairOdd}) to Bet Slip`}
                              className={`w-full py-2 px-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isHigh
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 font-black shadow-xs'
                                  : isMed
                                    ? 'bg-primary/10 border-primary/30 text-foreground font-bold'
                                    : 'bg-background/50 border-border/40 text-muted-foreground hover:border-border'
                              }`}
                            >
                              <span className="text-[10px] opacity-75">
                                {h}-{a}
                              </span>
                              <span className="text-xs">{p.toFixed(1)}%</span>
                              <span className="text-[10px] opacity-75">@{fairOdd}</span>
                            </button>
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
