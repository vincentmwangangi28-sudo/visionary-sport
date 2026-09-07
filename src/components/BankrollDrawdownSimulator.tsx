import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';
import { Activity, Play, RotateCcw, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  initialBankroll: number;
  stakePercent: number;
  odds: number;
  winProbability: number; // 0-100
}

export const BankrollDrawdownSimulator: React.FC<Props> = ({
  initialBankroll,
  stakePercent,
  odds,
  winProbability,
}) => {
  const { format } = useCurrency();
  const [numBets, setNumBets] = useState([50]);
  const [simulationSeed, setSimulationSeed] = useState(1);

  // Run Monte Carlo simulation of 100 paths
  const simulationResults = useMemo(() => {
    const totalSimulations = 150;
    const betsCount = numBets[0];
    const winRate = winProbability / 100;
    const stakeFraction = stakePercent / 100;

    const finalBankrolls: number[] = [];
    let maxDrawdownObserved = 0;
    let bankrollDoubledCount = 0;
    let bankrollHalvedCount = 0;

    // Track a representative median path for the visual trajectory
    const samplePaths: number[][] = [];

    // Seeded pseudo-random generator driven by simulationSeed
    let seedState = (simulationSeed * 1664525 + 1013904223) >>> 0;
    const nextRandom = () => {
      seedState = (1664525 * seedState + 1013904223) >>> 0;
      return seedState / 4294967296;
    };

    for (let sim = 0; sim < totalSimulations; sim++) {
      let current = initialBankroll;
      let peak = current;
      let maxSimDrawdown = 0;
      const path: number[] = [current];

      for (let b = 0; b < betsCount; b++) {
        const betStake = current * stakeFraction;
        const rand = nextRandom();
        if (rand < winRate) {
          current += betStake * (odds - 1);
        } else {
          current -= betStake;
        }

        if (current > peak) peak = current;
        const currentDrawdown = ((peak - current) / peak) * 100;
        if (currentDrawdown > maxSimDrawdown) maxSimDrawdown = currentDrawdown;

        path.push(Math.round(current));
        if (current <= 1) break; // Ruin
      }

      if (maxSimDrawdown > maxDrawdownObserved) maxDrawdownObserved = maxSimDrawdown;
      if (current >= initialBankroll * 2) bankrollDoubledCount++;
      if (current <= initialBankroll * 0.5) bankrollHalvedCount++;
      finalBankrolls.push(current);

      if (sim < 5) samplePaths.push(path);
    }

    finalBankrolls.sort((a, b) => a - b);
    const medianFinal = finalBankrolls[Math.floor(finalBankrolls.length / 2)];
    const top10Final = finalBankrolls[Math.floor(finalBankrolls.length * 0.9)];
    const bottom10Final = finalBankrolls[Math.floor(finalBankrolls.length * 0.1)];

    const roi = ((medianFinal - initialBankroll) / initialBankroll) * 100;

    return {
      medianFinal,
      top10Final,
      bottom10Final,
      roi: Math.round(roi),
      doubleProb: Math.round((bankrollDoubledCount / totalSimulations) * 100),
      halfProb: Math.round((bankrollHalvedCount / totalSimulations) * 100),
      maxDrawdown: Math.round(maxDrawdownObserved),
      samplePaths,
    };
  }, [initialBankroll, stakePercent, odds, winProbability, numBets, simulationSeed]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-black">
                Monte Carlo Bankroll Trajectory Simulator
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Simulating 150 parallel {numBets[0]}-bet sequences with {stakePercent}% stake & {winProbability}% win rate
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSimulationSeed(s => s + 1)}
            className="h-8 gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Re-run Trials
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Slider for bet sequence length */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Bet Horizon Length:</span>
            <span className="font-bold text-primary font-mono">{numBets[0]} Consecutive Bets</span>
          </div>
          <Slider
            value={numBets}
            onValueChange={setNumBets}
            min={10}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* 4 Outcome Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/30 border rounded-xl text-center">
            <span className="text-[11px] text-muted-foreground font-medium">Expected Median Capital</span>
            <p className="text-lg font-black text-foreground font-mono mt-0.5">
              {format(simulationResults.medianFinal)}
            </p>
            <span className={`text-[10px] font-bold ${simulationResults.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {simulationResults.roi >= 0 ? '+' : ''}{simulationResults.roi}% Projected ROI
            </span>
          </div>

          <div className="p-3 bg-muted/30 border rounded-xl text-center">
            <span className="text-[11px] text-muted-foreground font-medium">90th Percentile (Bull)</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {format(simulationResults.top10Final)}
            </p>
            <span className="text-[10px] text-muted-foreground">Top 10% performance</span>
          </div>

          <div className="p-3 bg-muted/30 border rounded-xl text-center">
            <span className="text-[11px] text-muted-foreground font-medium">Max Drawdown Risk</span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {simulationResults.maxDrawdown}%
            </p>
            <span className="text-[10px] text-muted-foreground">Peak-to-trough drop</span>
          </div>

          <div className="p-3 bg-muted/30 border rounded-xl text-center">
            <span className="text-[11px] text-muted-foreground font-medium">Ruin / Half Risk</span>
            <p className="text-lg font-black text-rose-600 font-mono mt-0.5">
              {simulationResults.halfProb}%
            </p>
            <span className="text-[10px] text-muted-foreground">Chance of losing 50%+</span>
          </div>
        </div>

        {/* Simulation Path Sparklines Preview */}
        <div className="p-4 bg-muted/20 border rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Sample Trajectory Pathways
            </span>
            <Badge variant="outline" className="text-[10px]">
              Double Bankroll Chance: {simulationResults.doubleProb}%
            </Badge>
          </div>

          <div className="h-24 w-full flex items-end gap-1 pt-4 border-b border-muted relative">
            {simulationResults.samplePaths[0]?.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(5, (val / (initialBankroll * 2.5)) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 bg-primary/40 hover:bg-primary rounded-t transition-all group relative"
                  style={{ height: `${heightPercent}%` }}
                  title={`Bet #${idx}: ${format(val)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
            <span>Bet #1 ({format(initialBankroll)})</span>
            <span>Final Bet #{numBets[0]} ({format(simulationResults.medianFinal)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
