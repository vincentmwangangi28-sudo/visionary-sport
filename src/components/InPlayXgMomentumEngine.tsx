import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Activity, Clock, TrendingUp, Target, ShieldAlert, RotateCcw } from 'lucide-react';

export interface InPlayFixturePreset {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  initialMinute?: number;
  initialHomeGoals?: number;
  initialAwayGoals?: number;
  baseHomeXg?: number;
  baseAwayXg?: number;
}

interface InPlayXgMomentumEngineProps {
  fixture?: InPlayFixturePreset;
  compact?: boolean;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poissonProb(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export const InPlayXgMomentumEngine: React.FC<InPlayXgMomentumEngineProps> = ({
  fixture,
  compact = false,
}) => {
  const homeTeam = fixture?.homeTeam || 'Arsenal';
  const awayTeam = fixture?.awayTeam || 'Chelsea';
  const league = fixture?.league || 'Premier League';
  const preHomeXg = fixture?.baseHomeXg ?? 1.78;
  const preAwayXg = fixture?.baseAwayXg ?? 1.12;

  const [minute, setMinute] = useState<number>(fixture?.initialMinute ?? 58);
  const [homeGoals, setHomeGoals] = useState<number>(fixture?.initialHomeGoals ?? 1);
  const [awayGoals, setAwayGoals] = useState<number>(fixture?.initialAwayGoals ?? 1);
  const [homeRedCards, setHomeRedCards] = useState<number>(0);
  const [awayRedCards, setAwayRedCards] = useState<number>(0);

  const metrics = useMemo(() => {
    const remainingRatio = Math.max(0.02, (90 - minute) / 90);
    // Late-game tempo acceleration factor (0.88 exponent models higher goal density in final 25 mins)
    const timeDecay = Math.pow(remainingRatio, 0.88);

    // Game-state & red-card adjustments
    const scoreDiff = homeGoals - awayGoals;
    const homeStateMod = scoreDiff < 0 ? 1.16 : scoreDiff > 0 ? 0.91 : 1.04;
    const awayStateMod = scoreDiff > 0 ? 1.18 : scoreDiff < 0 ? 0.89 : 1.02;

    const homeRedMod = Math.pow(0.68, homeRedCards) * Math.pow(1.24, awayRedCards);
    const awayRedMod = Math.pow(0.68, awayRedCards) * Math.pow(1.24, homeRedCards);

    const remHomeXg = Math.max(0.03, preHomeXg * timeDecay * homeStateMod * homeRedMod);
    const remAwayXg = Math.max(0.03, preAwayXg * timeDecay * awayStateMod * awayRedMod);

    const liveAccumHomeXg = Number(((preHomeXg * (minute / 90)) + homeGoals * 0.22).toFixed(2));
    const liveAccumAwayXg = Number(((preAwayXg * (minute / 90)) + awayGoals * 0.22).toFixed(2));

    // Calculate full-time outcome probabilities from current score + remaining Poisson goals (0..5)
    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;

    for (let hAdd = 0; hAdd <= 5; hAdd++) {
      const pH = poissonProb(remHomeXg, hAdd);
      for (let aAdd = 0; aAdd <= 5; aAdd++) {
        const pA = poissonProb(remAwayXg, aAdd);
        const joint = pH * pA;
        const finalH = homeGoals + hAdd;
        const finalA = awayGoals + aAdd;
        if (finalH > finalA) homeWinProb += joint;
        else if (finalH === finalA) drawProb += joint;
        else awayWinProb += joint;
      }
    }

    const total = homeWinProb + drawProb + awayWinProb || 1;
    const normHome = Math.round((homeWinProb / total) * 100);
    const normDraw = Math.round((drawProb / total) * 100);
    const normAway = Math.max(0, 100 - normHome - normDraw);

    // Next Goal Probability via competing Poisson processes
    const totalRemLambda = remHomeXg + remAwayXg;
    const noMoreGoalsProb = Math.round(Math.exp(-totalRemLambda) * 100);
    const goalScoredProb = 100 - noMoreGoalsProb;
    const nextGoalHomeProb = Math.round(goalScoredProb * (remHomeXg / (totalRemLambda || 1)));
    const nextGoalAwayProb = Math.max(0, 100 - noMoreGoalsProb - nextGoalHomeProb);

    // 6-interval 15-min xG pressure segments
    const intervals = [
      { label: "1-15'", h: 0.24, a: 0.16 },
      { label: "16-30'", h: 0.31, a: 0.21 },
      { label: "31-45'", h: 0.36, a: 0.25 },
      { label: "46-60'", h: 0.33, a: 0.28 },
      { label: "61-75'", h: 0.39, a: 0.24 },
      { label: "76-90'", h: 0.45, a: 0.32 },
    ];

    return {
      remHomeXg: remHomeXg.toFixed(2),
      remAwayXg: remAwayXg.toFixed(2),
      liveAccumHomeXg,
      liveAccumAwayXg,
      normHome,
      normDraw,
      normAway,
      nextGoalHomeProb,
      nextGoalAwayProb,
      noMoreGoalsProb,
      intervals,
    };
  }, [minute, homeGoals, awayGoals, homeRedCards, awayRedCards, preHomeXg, preAwayXg]);

  const handleReset = () => {
    setMinute(fixture?.initialMinute ?? 58);
    setHomeGoals(fixture?.initialHomeGoals ?? 1);
    setAwayGoals(fixture?.initialAwayGoals ?? 1);
    setHomeRedCards(0);
    setAwayRedCards(0);
  };

  return (
    <Card className="border-primary/25 bg-card shadow-xs">
      <CardHeader className={compact ? 'p-4 pb-3' : 'p-5 pb-3'}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                <Activity className="h-3 w-3 mr-1" /> IN-PLAY POISSON &amp; xG MOMENTUM ENGINE
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {league} · {minute}&apos; Elapsed
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground">
              {homeTeam} vs {awayTeam} — Live Remaining-Time Probability Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Adjust live match minute, current scoreline, and red-card state to recalculate remaining Expected Goals ($\lambda_t$) and Next-Goal probabilities.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs h-8 gap-1.5 self-start sm:self-center shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset State
          </Button>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-4 pt-2 space-y-4' : 'p-5 pt-2 space-y-5'}>
        {/* Interactive Match State Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-xl bg-muted/40 border border-border/60">
          {/* Elapsed Minute Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Match Minute
              </span>
              <span className="font-mono font-black text-sm text-primary">{minute}&apos; / 90&apos;</span>
            </div>
            <Slider
              value={[minute]}
              min={1}
              max={89}
              step={1}
              onValueChange={(v) => setMinute(v[0] ?? 58)}
              aria-label="Match Minute"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Kickoff (1&apos;)</span>
              <span>HT (45&apos;)</span>
              <span>89&apos;</span>
            </div>
          </div>

          {/* Live Scoreline Stepper */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground block text-center">
              Current Scoreline ({homeGoals} - {awayGoals})
            </span>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHomeGoals(Math.max(0, homeGoals - 1))}
                  className="h-7 w-7 rounded border bg-background text-xs font-black hover:bg-muted"
                  aria-label={`Decrease ${homeTeam} goals`}
                >
                  -
                </button>
                <span className="font-mono font-black text-base w-6 text-center">{homeGoals}</span>
                <button
                  type="button"
                  onClick={() => setHomeGoals(Math.min(6, homeGoals + 1))}
                  className="h-7 w-7 rounded border bg-background text-xs font-black hover:bg-muted"
                  aria-label={`Increase ${homeTeam} goals`}
                >
                  +
                </button>
              </div>
              <span className="text-xs font-bold text-muted-foreground">vs</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAwayGoals(Math.max(0, awayGoals - 1))}
                  className="h-7 w-7 rounded border bg-background text-xs font-black hover:bg-muted"
                  aria-label={`Decrease ${awayTeam} goals`}
                >
                  -
                </button>
                <span className="font-mono font-black text-base w-6 text-center">{awayGoals}</span>
                <button
                  type="button"
                  onClick={() => setAwayGoals(Math.min(6, awayGoals + 1))}
                  className="h-7 w-7 rounded border bg-background text-xs font-black hover:bg-muted"
                  aria-label={`Increase ${awayTeam} goals`}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Red Card Discipline State */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Red Card Dismissals
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setHomeRedCards((prev) => (prev + 1) % 3)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                  homeRedCards > 0
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-background border-border text-muted-foreground'
                }`}
              >
                {homeTeam.slice(0, 10)}: {homeRedCards} RC
              </button>
              <button
                type="button"
                onClick={() => setAwayRedCards((prev) => (prev + 1) % 3)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                  awayRedCards > 0
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-background border-border text-muted-foreground'
                }`}
              >
                {awayTeam.slice(0, 10)}: {awayRedCards} RC
              </button>
            </div>
          </div>
        </div>

        {/* Output Row 1: Live 90-Minute Outcome & Remaining xG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-border/70 bg-background/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Live 90-Min Outcome Probability
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Rem xG: {metrics.remHomeXg} – {metrics.remAwayXg}
              </span>
            </div>

            <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
              <div
                style={{ width: `${metrics.normHome}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`${homeTeam}: ${metrics.normHome}%`}
              />
              <div
                style={{ width: `${metrics.normDraw}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Draw: ${metrics.normDraw}%`}
              />
              <div
                style={{ width: `${metrics.normAway}%` }}
                className="bg-sky-500 transition-all duration-300"
                title={`${awayTeam}: ${metrics.normAway}%`}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-xs pt-0.5">
              <div>
                <span className="text-[10px] text-muted-foreground block truncate">{homeTeam} (1)</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{metrics.normHome}%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Draw (X)</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{metrics.normDraw}%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block truncate">{awayTeam} (2)</span>
                <span className="font-mono font-black text-sky-600 dark:text-sky-400">{metrics.normAway}%</span>
              </div>
            </div>
          </div>

          {/* Next Team to Score Competing Poisson Process */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-background/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Next Goal Probability ({90 - minute} mins left)
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Live xG: {metrics.liveAccumHomeXg} – {metrics.liveAccumAwayXg}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                <span className="text-[10px] text-muted-foreground block truncate">Next: {homeTeam}</span>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  {metrics.nextGoalHomeProb}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/60 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">No More Goals</span>
                <span className="font-mono font-black text-sm text-foreground">
                  {metrics.noMoreGoalsProb}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/25">
                <span className="text-[10px] text-muted-foreground block truncate">Next: {awayTeam}</span>
                <span className="font-mono font-black text-sm text-sky-600 dark:text-sky-400">
                  {metrics.nextGoalAwayProb}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
