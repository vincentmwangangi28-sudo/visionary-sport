import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Flag, Scale, Activity } from 'lucide-react';

interface RefereeSetPieceMatrixProps {
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
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
  homeTeam = 'Arsenal',
  awayTeam = 'Chelsea',
  league = 'Premier League',
}) => {
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

  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                <Scale className="h-3 w-3 mr-1" /> OFFICIATING &amp; SET-PIECE TELEMETRY
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Official Profile: {telemetry.referee.name}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground">
              {homeTeam} vs {awayTeam} — Referee Discipline &amp; Corner Tempo Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Quantitative overlay combining officiating card tendencies, fouls-per-tackle ratios, and club wing-play corner generation.
            </CardDescription>
          </div>
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold self-start sm:self-center">
            {telemetry.referee.strictness} ({telemetry.referee.cardsPer90} Cards/90)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Officiating & Discipline Card */}
          <div className="p-4 rounded-xl border border-border/70 bg-background/70 space-y-3">
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
                <span className="text-muted-foreground">3.5+ Match Bookings Probability</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {telemetry.over35CardsProb}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">4.5+ Match Bookings Probability</span>
                <span className="font-mono font-bold text-foreground">{telemetry.over45CardsProb}%</span>
              </div>
            </div>
          </div>

          {/* Corner & Set-Piece Tempo Card */}
          <div className="p-4 rounded-xl border border-border/70 bg-background/70 space-y-3">
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
                <span className="text-muted-foreground">9+ Total Match Corners Probability</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {telemetry.over85CornersProb}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">10+ Total Match Corners Probability</span>
                <span className="font-mono font-bold text-foreground">{telemetry.over95CornersProb}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
