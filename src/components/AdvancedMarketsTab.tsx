import React, { useMemo } from 'react';
import {
  calculateMatchXG,
  calculateAsianHandicap,
  calculatePropsMetrics,
} from '@/utils/predictiveEngine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  TrendingUp,
  Target,
  Layers,
  Flag,
  AlertTriangle,
  Plus,
  Check,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

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
  drawOdds = 3.30,
  confidence = 70,
}) => {
  const { addSelection, selections } = useBetSlip();
  const { formatOdds } = useUserPreferences();

  const xg = useMemo(() => {
    return calculateMatchXG(homeTeam, awayTeam, homeOdds, awayOdds, matchDate);
  }, [homeTeam, awayTeam, homeOdds, awayOdds, matchDate]);

  const handicapLines = useMemo(() => {
    return calculateAsianHandicap(homeTeam, awayTeam, homeOdds, awayOdds, matchDate);
  }, [homeTeam, awayTeam, homeOdds, awayOdds, matchDate]);

  const propsData = useMemo(() => {
    return calculatePropsMetrics(homeTeam, awayTeam, matchDate);
  }, [homeTeam, awayTeam, matchDate]);

  const isSelected = (market: string) => {
    return selections.some(
      s => s.homeTeam === homeTeam && s.awayTeam === awayTeam && s.market === market
    );
  };

  const handleAddBet = (market: string, odds: number, conf = confidence) => {
    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      matchDate,
      market,
      odds,
      confidence: conf,
    });
    toast.success(`Added ${homeTeam} vs ${awayTeam} - ${market} to Bet Slip`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Expected Goals (xG) Engine Banner */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">Bivariate Poisson xG Engine</h3>
              <p className="text-xs text-muted-foreground">
                Algorithmic expected goals based on offensive conversion & defensive conceded rates
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

        {/* Goal Totals Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <Button
            type="button"
            variant={isSelected('Over 2.5 Goals') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAddBet('Over 2.5 Goals', 1.85, xg.over25Prob)}
            className="text-xs h-9 justify-between"
          >
            <span>Over 2.5 ({xg.over25Prob}%)</span>
            <span className="font-bold font-mono">1.85</span>
          </Button>

          <Button
            type="button"
            variant={isSelected('Under 2.5 Goals') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAddBet('Under 2.5 Goals', 1.95, xg.under25Prob)}
            className="text-xs h-9 justify-between"
          >
            <span>Under 2.5 ({xg.under25Prob}%)</span>
            <span className="font-bold font-mono">1.95</span>
          </Button>

          <Button
            type="button"
            variant={isSelected('BTTS: Yes') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAddBet('BTTS: Yes', 1.80, xg.bttsProb)}
            className="text-xs h-9 justify-between"
          >
            <span>BTTS Yes ({xg.bttsProb}%)</span>
            <span className="font-bold font-mono">1.80</span>
          </Button>

          <Button
            type="button"
            variant={isSelected('BTTS: No') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAddBet('BTTS: No', 2.05, 100 - xg.bttsProb)}
            className="text-xs h-9 justify-between"
          >
            <span>BTTS No ({100 - xg.bttsProb}%)</span>
            <span className="font-bold font-mono">2.05</span>
          </Button>
        </div>
      </div>

      {/* 2. Asian Handicap Lines Matrix */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">Asian Handicap Lines</h3>
              <p className="text-xs text-muted-foreground">Cover probabilities & estimated market pricing</p>
            </div>
          </div>
          <Badge className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 border-indigo-200">
            Split Risk
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {handicapLines.map(line => {
            const marketLabel = `Asian ${line.team} ${line.line}`;
            const selected = isSelected(marketLabel);
            return (
              <div
                key={line.line + line.team}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  selected
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{line.team}</span>
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4">
                      {line.line}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>Cover: {line.probability}%</span>
                    {line.evEdge > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        +{line.evEdge}% EV
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  onClick={() => handleAddBet(marketLabel, line.odds, line.probability)}
                  className="h-8 gap-1.5 font-mono text-xs"
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {line.odds.toFixed(2)}
                </Button>
              </div>
            );
          })}
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
                <h4 className="text-xs font-black">Corner Kick Forecast</h4>
                <p className="text-[11px] text-muted-foreground">Expected total: {propsData.expectedCorners.total}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 8.5 Corners</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCorners.over85Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 8.5 Corners') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 8.5 Corners', 1.62, propsData.expectedCorners.over85Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  1.62
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 9.5 Corners</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCorners.over95Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 9.5 Corners') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 9.5 Corners', 1.95, propsData.expectedCorners.over95Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  1.95
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 10.5 Corners</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCorners.over105Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 10.5 Corners') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 10.5 Corners', 2.45, propsData.expectedCorners.over105Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  2.45
                </Button>
              </div>
            </div>
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
                <h4 className="text-xs font-black">Bookings & Disciplinary</h4>
                <p className="text-[11px] text-muted-foreground">Expected cards: {propsData.expectedCards.total}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 2.5 Cards</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCards.over25Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 2.5 Cards') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 2.5 Cards', 1.48, propsData.expectedCards.over25Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  1.48
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 3.5 Cards</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCards.over35Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 3.5 Cards') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 3.5 Cards', 1.88, propsData.expectedCards.over35Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  1.88
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
              <span>Over 4.5 Cards</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{propsData.expectedCards.over45Prob}%</span>
                <Button
                  size="sm"
                  variant={isSelected('Over 4.5 Cards') ? 'default' : 'outline'}
                  onClick={() => handleAddBet('Over 4.5 Cards', 2.60, propsData.expectedCards.over45Prob)}
                  className="h-7 text-xs px-2 font-mono"
                >
                  2.60
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Poisson Scoreline Projections */}
      <div className="bg-muted/20 border rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Most Probable Correct Scorelines
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {propsData.topScorelines.map(s => (
            <div
              key={s.score}
              className="p-2.5 rounded-xl bg-background border text-center flex flex-col items-center justify-center"
            >
              <span className="font-black text-sm font-mono text-primary">{s.score}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{s.probability}% probability</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
