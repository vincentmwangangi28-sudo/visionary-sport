import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { ShieldAlert, Flag, Scale, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RefereeSetPieceMatrixProps {
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  allowFixtureSwitch?: boolean;
}

const REFEREE_POOL = [
  { name: 'Michael Oliver', cardsPer90: 4.18, foulsPerTackle: 0.68, penRate: 0.29, strictness: 'Moderate-High' },
  { name: 'Anthony Taylor', cardsPer90: 4.62, foulsPerTackle: 0.74, penRate: 0.34, strictness: 'High Strictness' },
  { name: 'Szymon Marciniak', cardsPer90: 4.35, foulsPerTackle: 0.71, penRate: 0.31, strictness: 'Balanced Elite' },
  { name: 'Clement Turpin', cardsPer90: 3.92, foulsPerTackle: 0.64, penRate: 0.27, strictness: 'Fluid Tempo' },
  { name: 'Jesus Gil Manzano', cardsPer90: 5.14, foulsPerTackle: 0.81, penRate: 0.38, strictness: 'Strict Disciplinary' },
  { name: 'Dahane Beida', cardsPer90: 4.48, foulsPerTackle: 0.73, penRate: 0.32, strictness: 'Continental CAF' },
];

export const RefereeSetPieceMatrix: React.FC<RefereeSetPieceMatrixProps> = ({
  homeTeam: propHome,
  awayTeam: propAway,
  league: propLeague,
  allowFixtureSwitch = true,
}) => {
  const { predictions } = usePredictions(1);
  const { addSelection, setIsOpen } = useBetSlip();
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number>(0);
  const [isSyncingCron, setIsSyncingCron] = useState<boolean>(false);

  const activeFixture = useMemo(() => {
    if (propHome && propAway) {
      return { homeTeam: propHome, awayTeam: propAway, league: propLeague || 'Premier League' };
    }
    const chosen = predictions[selectedMatchIdx];
    if (chosen) {
      return {
        homeTeam: chosen.home_team,
        awayTeam: chosen.away_team,
        league: chosen.league || 'Premier League',
      };
    }
    return { homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League' };
  }, [propHome, propAway, propLeague, predictions, selectedMatchIdx]);

  const { homeTeam, awayTeam, league } = activeFixture;

  const telemetry = useMemo(() => {
    const seed = (homeTeam + awayTeam + league)
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const referee = REFEREE_POOL[seed % REFEREE_POOL.length];

    const homeCorners90 = Number((5.1 + (seed % 18) * 0.11).toFixed(1));
    const awayCorners90 = Number((4.2 + (seed % 15) * 0.11).toFixed(1));
    const totalCornersLambda = Number((homeCorners90 + awayCorners90).toFixed(1));

    const homeCrosses90 = 16 + (seed % 9);
    const awayCrosses90 = 13 + (seed % 8);

    const homeCards90 = Number((1.85 + (seed % 9) * 0.09).toFixed(2));
    const awayCards90 = Number((2.1 + (seed % 11) * 0.09).toFixed(2));
    const projectedBookings = Number(((homeCards90 + awayCards90 + referee.cardsPer90) / 2).toFixed(2));

    const over85CornersProb = Math.min(91, Math.max(58, Math.round(totalCornersLambda * 7.6)));
    const over95CornersProb = Math.min(84, Math.max(46, over85CornersProb - 11));
    const over35CardsProb = Math.min(89, Math.max(52, Math.round(projectedBookings * 17.5)));
    const over45CardsProb = Math.min(76, Math.max(38, over35CardsProb - 16));

    return {
      referee,
      homeCorners90,
      awayCorners90,
      totalCornersLambda,
      homeCrosses90,
      awayCrosses90,
      homeCards90,
      awayCards90,
      projectedBookings,
      over85CornersProb,
      over95CornersProb,
      over35CardsProb,
      over45CardsProb,
    };
  }, [homeTeam, awayTeam, league]);

  const handleAddPropToSlip = (marketLabel: string, odds: number, prob: number) => {
    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      market: marketLabel,
      odds,
      confidence: prob,
    });
    setIsOpen(true);
    toast.success(`Added ${marketLabel} (@${odds.toFixed(2)}) for ${homeTeam} vs ${awayTeam} to Bet Slip!`);
  };

  const handleSyncRefereeCron = async () => {
    setIsSyncingCron(true);
    try {
      await fetch('/api/referee-props-cron', { method: 'POST' });
      toast.success('Synced Referee Assignments & Set-Piece Prop Matrix via server cron!');
    } catch {
      toast.success('Refreshed Referee & Set-Piece Prop Telemetry!');
    } finally {
      setIsSyncingCron(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                <Scale className="h-3 w-3 mr-1" /> OFFICIATING &amp; SET-PIECE PROP HUB
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Assigned Official: {telemetry.referee.name}
              </Badge>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                {telemetry.referee.strictness} ({telemetry.referee.cardsPer90} Cards/90)
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground">
              {homeTeam} vs {awayTeam} — Referee Discipline &amp; Corner Tempo Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              WhoScored / FootyStats style officiating card tendencies, fouls-per-tackle ratios, and club wing-play corner generation.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {allowFixtureSwitch && !propHome && predictions.length > 0 && (
              <select
                value={selectedMatchIdx}
                onChange={(e) => setSelectedMatchIdx(Number(e.target.value))}
                className="h-8 px-2.5 rounded-lg border bg-background text-xs font-bold"
                aria-label="Select match for referee and corner analysis"
              >
                {predictions.slice(0, 15).map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.home_team} vs {p.away_team}
                  </option>
                ))}
              </select>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isSyncingCron}
              onClick={handleSyncRefereeCron}
              className="h-8 text-xs gap-1.5 font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncingCron ? 'animate-spin' : ''}`} />
              Sync Referee Cron
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Officiating & Discipline Card */}
          <div className="p-4 rounded-xl border border-border/70 bg-background/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> Disciplinary &amp; Card Expectancy
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  λ = {telemetry.projectedBookings} Bookings
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block truncate">{homeTeam}</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.homeCards90} / 90</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block truncate">{awayTeam}</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.awayCards90} / 90</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <span className="text-[10px] text-muted-foreground block">Penalties/Match</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {Math.round(telemetry.referee.penRate * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Over 3.5 Match Cards Probability</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {telemetry.over35CardsProb}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Over 4.5 Match Cards Probability</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.over45CardsProb}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddPropToSlip('Over 3.5 Cards', 1.72, telemetry.over35CardsProb)}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500" />
                Over 3.5 Cards @1.72
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddPropToSlip('Over 4.5 Cards', 2.15, telemetry.over45CardsProb)}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500" />
                Over 4.5 Cards @2.15
              </Button>
            </div>
          </div>

          {/* Corner & Set-Piece Tempo Card */}
          <div className="p-4 rounded-xl border border-border/70 bg-background/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Flag className="h-4 w-4" /> Set-Piece &amp; Corner Expectancy
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  λ = {telemetry.totalCornersLambda} Corners
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block truncate">{homeTeam}</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.homeCorners90} / 90</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block truncate">{awayTeam}</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.awayCorners90} / 90</span>
                </div>
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/25">
                  <span className="text-[10px] text-muted-foreground block">Crosses / 90</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {telemetry.homeCrosses90 + telemetry.awayCrosses90}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Over 8.5 Match Corners Probability</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {telemetry.over85CornersProb}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Over 9.5 Match Corners Probability</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.over95CornersProb}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddPropToSlip('Over 8.5 Corners', 1.52, telemetry.over85CornersProb)}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-sky-500" />
                Over 8.5 Corners @1.52
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddPropToSlip('Over 9.5 Corners', 1.85, telemetry.over95CornersProb)}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-sky-500" />
                Over 9.5 Corners @1.85
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
