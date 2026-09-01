import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/TeamLogo';
import { useBetSlip } from '@/hooks/useBetSlip';
import { Activity, Flame, Zap, AlertCircle, TrendingUp, BellRing, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LiveAlertMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  minute: number;
  homeScore: number;
  awayScore: number;
  league: string;
  homeMomentum: number; // 0-100
  awayMomentum: number; // 0-100
  opportunityAlert: {
    title: string;
    type: 'Over Goal Spike' | 'Momentum Shift' | 'Corner Wave' | 'Late Goal Value';
    probability: number;
    recommendedMarket: string;
    liveOdds: number;
    urgency: 'HIGH' | 'CRITICAL' | 'NORMAL';
  };
}

export const LiveMomentumRadar: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [liveMatches, setLiveMatches] = useState<LiveAlertMatch[]>([
    {
      id: 'live-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Brighton',
      minute: 68,
      homeScore: 1,
      awayScore: 1,
      league: 'Premier League',
      homeMomentum: 78,
      awayMomentum: 22,
      opportunityAlert: {
        title: 'Over 2.5 Live Pressure Spike (xG 2.45)',
        type: 'Over Goal Spike',
        probability: 86,
        recommendedMarket: 'Over 2.5 Live Goals',
        liveOdds: 1.95,
        urgency: 'CRITICAL',
      },
    },
    {
      id: 'live-2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Real Betis',
      minute: 74,
      homeScore: 0,
      awayScore: 0,
      league: 'La Liga',
      homeMomentum: 84,
      awayMomentum: 16,
      opportunityAlert: {
        title: 'Late Home Goal Imminent (Heavy Box Entries)',
        type: 'Late Goal Value',
        probability: 81,
        recommendedMarket: 'Real Madrid to Score Next',
        liveOdds: 1.80,
        urgency: 'HIGH',
      },
    },
    {
      id: 'live-3',
      homeTeam: 'Gor Mahia',
      awayTeam: 'Tusker FC',
      minute: 52,
      homeScore: 1,
      awayScore: 0,
      league: 'Kenyan Premier League',
      homeMomentum: 62,
      awayMomentum: 38,
      opportunityAlert: {
        title: 'Over 8.5 Corners Momentum Escalation',
        type: 'Corner Wave',
        probability: 79,
        recommendedMarket: 'Over 8.5 Corners',
        liveOdds: 1.88,
        urgency: 'NORMAL',
      },
    },
  ]);

  const handleAddLiveBet = (m: LiveAlertMatch) => {
    addSelection({
      match: `${m.homeTeam} vs ${m.awayTeam} (Live ${m.minute}')`,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      league: m.league,
      matchDate: new Date().toISOString(),
      market: m.opportunityAlert.recommendedMarket,
      odds: m.opportunityAlert.liveOdds,
      confidence: m.opportunityAlert.probability,
    });
    toast.success(`Added Live Alert (${m.opportunityAlert.recommendedMarket} @ ${m.opportunityAlert.liveOdds}) to Slip!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              In-Play Dynamic Momentum & AI Opportunity Triggers
              <Badge className="bg-emerald-600 text-white text-[10px] animate-pulse">LIVE IN-GAME</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time attacking pressure waves detecting live value opportunities before sportsbooks adjust.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {liveMatches.map((m) => (
          <Card key={m.id} className="border-border/80 hover:border-emerald-500/50 transition-all shadow-sm">
            <CardContent className="p-4 space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline">{m.league}</Badge>
                <div className="flex items-center gap-1.5 font-mono text-emerald-500 font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  {m.minute}' LIVE
                </div>
              </div>

              {/* Scoreline */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamLogo team={m.homeTeam} size="sm" />
                  <span className="font-bold text-xs truncate">{m.homeTeam}</span>
                </div>
                <div className="px-3 py-1 bg-muted rounded-lg font-mono font-black text-sm">
                  {m.homeScore} - {m.awayScore}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="font-bold text-xs truncate text-right">{m.awayTeam}</span>
                  <TeamLogo team={m.awayTeam} size="sm" />
                </div>
              </div>

              {/* Attacking Pressure Wave */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Home Pressure ({m.homeMomentum}%)</span>
                  <span>Away Pressure ({m.awayMomentum}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500" style={{ width: `${m.homeMomentum}%` }} />
                  <div className="bg-sky-500" style={{ width: `${m.awayMomentum}%` }} />
                </div>
              </div>

              {/* Alert Callout */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    {m.opportunityAlert.type}
                  </Badge>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {m.opportunityAlert.probability}% AI Model
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {m.opportunityAlert.title}
                </p>
              </div>

              {/* Action Button */}
              <Button
                size="sm"
                onClick={() => handleAddLiveBet(m)}
                className="w-full gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90"
              >
                <Zap className="h-3.5 w-3.5" />
                Bet {m.opportunityAlert.recommendedMarket} @ {m.opportunityAlert.liveOdds.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
