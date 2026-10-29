import React, { useMemo } from 'react';
import {
  calculateMatchXG,
  calculateAsianHandicap,
  calculatePropsMetrics,
} from '@/utils/predictiveEngine';
import { useBetSlip } from '@/hooks/useBetSlip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Target,
  Layers,
  Flag,
  AlertTriangle,
  Zap,
  Plus,
} from 'lucide-react';

interface Props {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
  confidence?: number;
}

export const AdvancedMarketsTab: React.FC<Props> = ({
  homeTeam,
  awayTeam,
  league,
  matchDate = '',
  homeOdds = 2.10,
  awayOdds = 3.50,
  confidence = 75,
}) => {
  const { addSelection } = useBetSlip();

  const xg = useMemo(() => {
    return calculateMatchXG(homeTeam, awayTeam, homeOdds, awayOdds, matchDate);
  }, [homeTeam, awayTeam, homeOdds, awayOdds, matchDate]);

  const handicapLines = useMemo(() => {
    return calculateAsianHandicap(homeTeam, awayTeam, homeOdds, awayOdds, matchDate);
  }, [homeTeam, awayTeam, homeOdds, awayOdds, matchDate]);

  const propsData = useMemo(() => {
    return calculatePropsMetrics(homeTeam, awayTeam, matchDate);
  }, [homeTeam, awayTeam, matchDate]);

  const handleAddMarket = (marketLabel: string, probPct: number, explicitOdds?: number) => {
    const fairOdds = explicitOdds || Number(Math.max(1.22, Math.min(9.5, 0.94 / (Math.max(12, probPct) / 100))).toFixed(2));
    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      matchDate: matchDate || new Date().toISOString(),
      market: marketLabel,
      odds: fairOdds,
      confidence: probPct || confidence,
    });
    toast.success(`Added ${homeTeam} vs ${awayTeam} (${marketLabel} @${fairOdds}) to Bet Slip`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Expected Goals (xG) Engine & 1-Click Goal Markets */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">Bivariate Poisson xG &amp; Goal Markets</h3>
              <p className="text-xs text-muted-foreground">
                Click any Over/Under or BTTS market below to add directly to your Bet Slip
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Total Match xG: {xg.totalXG}
          </Badge>
        </div>

        {/* Visual xG Split Bar */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-muted/30 rounded-xl p-3 border">
            <div className="flex justify-between items-center text-xs mb-1 font-medium">
              <span className="truncate">{homeTeam} (Home)</span>
              <span className="font-bold text-primary font-mono text-sm">{xg.homeXG} xG</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (xg.homeXG / (xg.homeXG + xg.awayXG || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>Home Win: {xg.homeWinProb}%</span>
              <span>Draw: {xg.drawProb}%</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-3 border">
            <div className="flex justify-between items-center text-xs mb-1 font-medium">
              <span className="truncate">{awayTeam} (Away)</span>
              <span className="font-bold text-amber-500 font-mono text-sm">{xg.awayXG} xG</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (xg.awayXG / (xg.homeXG + xg.awayXG || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>Away Win: {xg.awayWinProb}%</span>
              <span>Draw: {xg.drawProb}%</span>
            </div>
          </div>
        </div>

        {/* Interactive Goal Totals & BTTS Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAddMarket('Over 2.5 Goals', xg.over25Prob)}
            className="p-2.5 rounded-xl border bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
          >
            <span className="text-muted-foreground font-medium">Over 2.5</span>
            <span className="font-bold font-mono text-primary flex items-center gap-0.5">
              {xg.over25Prob}% <Plus className="h-3 w-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleAddMarket('Under 2.5 Goals', xg.under25Prob)}
            className="p-2.5 rounded-xl border bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
          >
            <span className="text-muted-foreground font-medium">Under 2.5</span>
            <span className="font-bold font-mono text-primary flex items-center gap-0.5">
              {xg.under25Prob}% <Plus className="h-3 w-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleAddMarket('BTTS: Yes', xg.bttsProb)}
            className="p-2.5 rounded-xl border bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
          >
            <span className="text-muted-foreground font-medium">BTTS: Yes</span>
            <span className="font-bold font-mono text-primary flex items-center gap-0.5">
              {xg.bttsProb}% <Plus className="h-3 w-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleAddMarket('BTTS: No', 100 - xg.bttsProb)}
            className="p-2.5 rounded-xl border bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between text-xs cursor-pointer"
          >
            <span className="text-muted-foreground font-medium">BTTS: No</span>
            <span className="font-bold font-mono text-primary flex items-center gap-0.5">
              {100 - xg.bttsProb}% <Plus className="h-3 w-3" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. Asian Handicap & Spread Markets */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">Asian Handicap &amp; Spread Markets</h3>
              <p className="text-xs text-muted-foreground">Projected goal differential cover probabilities &amp; odds</p>
            </div>
          </div>
          <Badge className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 border-indigo-200">
            Asian Handicap
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {handicapLines.map((line) => (
            <div
              key={line.line + line.team}
              className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{line.team}</span>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4">
                    {line.line}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  <span>Cover Prob: {line.probability}%</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddMarket(`${line.team} ${line.line} (AH)`, line.probability, line.odds)}
                className="h-7 text-xs font-mono font-bold gap-1"
              >
                <Plus className="h-3 w-3" /> @{line.odds}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Disciplinary (Cards) & Corners Props Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Corners Box */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Flag className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black">Corner Kick Markets</h4>
                <p className="text-[11px] text-muted-foreground">Expected total: {propsData.expectedCorners.total}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Over 8.5 Corners', prob: propsData.expectedCorners.over85Prob },
              { label: 'Over 9.5 Corners', prob: propsData.expectedCorners.over95Prob },
              { label: 'Over 10.5 Corners', prob: propsData.expectedCorners.over105Prob },
            ].map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => handleAddMarket(c.label, c.prob)}
                className="w-full flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <span>{c.label}</span>
                <span className="font-mono font-bold text-primary flex items-center gap-1">
                  {c.prob}% <Plus className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards / Bookings Box */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black">Cards &amp; Bookings Markets</h4>
                <p className="text-[11px] text-muted-foreground">Expected cards: {propsData.expectedCards.total}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Over 2.5 Cards', prob: propsData.expectedCards.over25Prob },
              { label: 'Over 3.5 Cards', prob: propsData.expectedCards.over35Prob },
              { label: 'Over 4.5 Cards', prob: propsData.expectedCards.over45Prob },
            ].map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => handleAddMarket(c.label, c.prob)}
                className="w-full flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <span>{c.label}</span>
                <span className="font-mono font-bold text-primary flex items-center gap-1">
                  {c.prob}% <Plus className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Top Poisson Scoreline Projections */}
      <div className="bg-muted/20 border rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Most Probable Correct Scorelines (Click to Add)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {propsData.topScorelines.map((s) => (
            <button
              type="button"
              key={s.score}
              onClick={() => handleAddMarket(`Correct Score ${s.score}`, s.probability, s.fairOdds)}
              className="p-2.5 rounded-xl bg-background hover:border-primary/50 border text-center flex flex-col items-center justify-center transition-colors cursor-pointer"
            >
              <span className="text-base font-black font-mono text-foreground">{s.score}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {s.probability}% (@{s.fairOdds})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
