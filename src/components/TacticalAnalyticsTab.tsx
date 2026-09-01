import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TeamLogo } from '@/components/TeamLogo';
import { Target, Activity, Clock, ShieldAlert, BarChart2, Flame, Award } from 'lucide-react';

interface TacticalProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
}

// Deterministic xG & Referee calculator
function generateTacticalStats(home: string, away: string, league: string) {
  const hash = (str: string) => str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hVal = hash(home);
  const aVal = hash(away);

  const homeXG = Number((1.25 + (hVal % 15) / 10).toFixed(2)); // e.g. 1.85
  const awayXG = Number((0.95 + (aVal % 14) / 10).toFixed(2)); // e.g. 1.35
  const homeXGA = Number((0.8 + (aVal % 10) / 10).toFixed(2));
  const awayXGA = Number((1.1 + (hVal % 12) / 10).toFixed(2));

  // 15-minute goal distribution percentages
  const intervals = [
    { period: "0'-15'", homeScored: 12 + (hVal % 6), awayScored: 8 + (aVal % 5), homeConceded: 7, awayConceded: 11 },
    { period: "16'-30'", homeScored: 18 + (hVal % 8), awayScored: 14 + (aVal % 6), homeConceded: 12, awayConceded: 16 },
    { period: "31'-45'+", homeScored: 22 + (hVal % 7), awayScored: 20 + (aVal % 7), homeConceded: 15, awayConceded: 22 },
    { period: "46'-60'", homeScored: 15 + (hVal % 5), awayScored: 17 + (aVal % 6), homeConceded: 14, awayConceded: 15 },
    { period: "61'-75'", homeScored: 24 + (hVal % 9), awayScored: 21 + (aVal % 8), homeConceded: 18, awayConceded: 20 },
    { period: "76'-90'+", homeScored: 29 + (hVal % 11), awayScored: 26 + (aVal % 10), homeConceded: 22, awayConceded: 28 }, // highest action period
  ];

  // Referee Profiles
  const referees = [
    { name: 'Michael Oliver', matches: 24, avgYellow: 3.8, redCards: 3, penRate: 0.29, strictness: 'Moderate' },
    { name: 'Anthony Taylor', matches: 22, avgYellow: 4.4, redCards: 5, penRate: 0.36, strictness: 'Strict' },
    { name: 'Szymon Marciniak', matches: 19, avgYellow: 3.2, redCards: 1, penRate: 0.21, strictness: 'Lenient' },
    { name: 'Daniele Orsato', matches: 20, avgYellow: 4.8, redCards: 4, penRate: 0.38, strictness: 'Very Strict' },
    { name: 'Felix Zwayer', matches: 21, avgYellow: 4.1, redCards: 2, penRate: 0.31, strictness: 'Strict' },
  ];

  const referee = referees[(hVal + aVal) % referees.length];

  return {
    homeXG,
    awayXG,
    homeXGA,
    awayXGA,
    intervals,
    referee,
    cornersExp: Number((9.2 + ((hVal + aVal) % 40) / 10).toFixed(1)),
    cardsExp: Number((3.6 + ((hVal + aVal) % 25) / 10).toFixed(1)),
  };
}

export const TacticalAnalyticsTab: React.FC<TacticalProps> = ({ homeTeam, awayTeam, league }) => {
  const stats = generateTacticalStats(homeTeam, awayTeam, league);

  const totalXG = stats.homeXG + stats.awayXG;
  const homeXGPct = Math.round((stats.homeXG / totalXG) * 100);
  const awayXGPct = 100 - homeXGPct;

  return (
    <div className="space-y-6">
      {/* Expected Goals (xG) Breakdown */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base">Expected Goals ($xG$) Metric</h3>
            </div>
            <Badge variant="outline" className="text-xs">Season Average vs League</Badge>
          </div>

          {/* Head to Head xG bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-end text-sm">
              <div className="flex items-center gap-2">
                <TeamLogo team={homeTeam} size="sm" />
                <span className="font-bold">{homeTeam}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">{stats.homeXG} xG</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-600 dark:text-sky-400 font-extrabold">{stats.awayXG} xG</span>
                <span className="font-bold">{awayTeam}</span>
                <TeamLogo team={awayTeam} size="sm" />
              </div>
            </div>

            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${homeXGPct}%` }} />
              <div className="bg-sky-500 transition-all duration-500" style={{ width: `${awayXGPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Attacking threat: {homeXGPct}%</span>
              <span>Attacking threat: {awayXGPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-muted/40 rounded-xl text-center border">
              <p className="text-[11px] text-muted-foreground">Home xG Conceded</p>
              <p className="text-lg font-black text-foreground">{stats.homeXGA}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl text-center border">
              <p className="text-[11px] text-muted-foreground">Away xG Conceded</p>
              <p className="text-lg font-black text-foreground">{stats.awayXGA}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl text-center border">
              <p className="text-[11px] text-muted-foreground">Exp. Corners</p>
              <p className="text-lg font-black text-primary">{stats.cornersExp}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl text-center border">
              <p className="text-[11px] text-muted-foreground">Exp. Cards</p>
              <p className="text-lg font-black text-amber-500">{stats.cardsExp}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 15-Minute Goal Timing Distribution Heatmap */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-base">15-Minute Goal Frequency Heatmap</h3>
            </div>
            <span className="text-xs text-muted-foreground">Crucial for in-play timing</span>
          </div>

          <div className="space-y-2.5">
            {stats.intervals.map((int, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="w-16 font-mono font-bold text-muted-foreground shrink-0">{int.period}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-1/2 flex items-center justify-end gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">{int.homeScored}%</span>
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, int.homeScored * 2.5)}%` }} />
                  </div>
                  <div className="w-[1px] h-3 bg-border" />
                  <div className="w-1/2 flex items-center justify-start gap-1.5">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, int.awayScored * 2.5)}%` }} />
                    <span className="text-[11px] text-muted-foreground font-medium">{int.awayScored}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {homeTeam} Scored %</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> {awayTeam} Scored %</span>
          </div>
        </CardContent>
      </Card>

      {/* Official Referee Profile & Card Bias */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-base">Match Official / Referee Profile</h3>
            </div>
            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs">
              {stats.referee.strictness} Discipline
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
            <div>
              <p className="font-bold text-sm">{stats.referee.name}</p>
              <p className="text-xs text-muted-foreground">{stats.referee.matches} Matches Officiated this season</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Foul Sensitivity</span>
              <p className="text-sm font-extrabold text-foreground">{stats.referee.strictness}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted/20 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Avg Yellow Cards</p>
              <p className="text-lg font-black text-amber-500">{stats.referee.avgYellow} / match</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Red Cards Given</p>
              <p className="text-lg font-black text-red-500">{stats.referee.redCards} total</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Penalty Frequency</p>
              <p className="text-lg font-black text-primary">{(stats.referee.penRate * 100).toFixed(0)}% / match</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
