import React, { useMemo } from 'react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { gradeSelectionAgainstFeed } from '@/services/autoSettlementService';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Ticket, Sparkles } from 'lucide-react';

interface LiveParlaySettlementBarProps {
  matches: ApiFootballLiveFixture[];
}

export const LiveParlaySettlementBar: React.FC<LiveParlaySettlementBarProps> = ({ matches }) => {
  const { selections, addSelections, setIsOpen, totalOdds } = useBetSlip();

  const gradedLegs = useMemo(() => {
    return selections.map((sel) => {
      const graded = gradeSelectionAgainstFeed(
        {
          homeTeam: sel.homeTeam,
          awayTeam: sel.awayTeam,
          market: sel.market,
          odds: sel.odds,
        },
        matches
      );
      return {
        ...sel,
        graded,
      };
    });
  }, [selections, matches]);

  const wonCount = gradedLegs.filter((l) => l.graded.status === 'Won').length;
  const lostCount = gradedLegs.filter((l) => l.graded.status === 'Lost').length;
  const liveCount = gradedLegs.filter((l) => l.graded.status === 'Live').length;

  const handleAutoBuildLiveSlip = () => {
    const candidates = matches
      .filter((m) => m.status === 'live' || m.status === 'halftime' || m.status === 'upcoming')
      .slice(0, 3);
    if (candidates.length === 0) return;

    addSelections(
      candidates.map((m) => {
        const pick = m.prediction || 'Home Win';
        const odds =
          pick === 'Away Win'
            ? m.away_odds || 2.15
            : pick === 'Draw'
            ? m.draw_odds || 3.25
            : m.home_odds || 1.85;
        return {
          match: `${m.home_team} vs ${m.away_team}`,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          matchDate: m.match_date,
          market: pick,
          odds,
          confidence: m.confidence || 78,
        };
      })
    );
  };

  if (selections.length === 0) {
    return (
      <div className="p-3.5 rounded-xl border border-border/80 bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Ticket className="h-4 w-4 text-primary" />
            <span>Automated Parlay &amp; Slip Live Tracker</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Add matches to your Bet Slip to track leg-by-leg live scores, CLV edge, and automatic full-time grading.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAutoBuildLiveSlip}
          disabled={matches.length === 0}
          className="text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Auto-Build 3-Leg Live Parlay</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Ticket className="h-4 w-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Active Parlay Auto-Settlement Tracker ({selections.length} Legs · Combined @{totalOdds.toFixed(2)})
          </h3>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            · {wonCount} Won · {liveCount} In-Play · {lostCount} Lost
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="text-xs h-8 font-semibold whitespace-nowrap shrink-0"
        >
          Open Full Slip
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {gradedLegs.map((leg) => {
          const st = leg.graded.status;
          return (
            <div
              key={leg.id}
              className="p-2.5 rounded-lg border border-border/70 bg-muted/20 flex items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-bold text-foreground truncate">
                  {leg.homeTeam} vs {leg.awayTeam}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono tabular-nums">
                  <span className="font-sans font-semibold text-primary">{leg.market}</span>
                  <span aria-hidden="true">·</span>
                  <span>@{leg.odds.toFixed(2)}</span>
                  {leg.graded.actualScore && (
                    <>
                      <span aria-hidden="true">·</span>
                      <strong className="text-foreground">({leg.graded.actualScore})</strong>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 font-mono tabular-nums text-[11px] font-bold">
                {st === 'Won' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> WON
                  </span>
                ) : st === 'Lost' ? (
                  <span className="inline-flex items-center gap-1 text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> LOST
                  </span>
                ) : st === 'Live' ? (
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <Clock className="h-3.5 w-3.5" /> {leg.graded.minute}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
