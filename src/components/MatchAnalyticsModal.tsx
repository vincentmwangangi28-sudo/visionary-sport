import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { PitchLineupVisualizer } from '@/components/PitchLineupVisualizer';
import { TacticalAnalyticsTab } from '@/components/TacticalAnalyticsTab';
import { AdvancedMarketsTab } from '@/components/AdvancedMarketsTab';
import { OddsComparisonTable } from '@/components/OddsComparisonTable';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { toast } from 'sonner';
import {
  TrendingUp,
  Target,
  Activity,
  Users,
  Calendar,
  Layers,
  ExternalLink,
  DollarSign,
  Plus,
} from 'lucide-react';

interface Props {
  prediction: Prediction;
  open: boolean;
  onClose: () => void;
}

export const MatchAnalyticsModal: React.FC<Props> = ({ prediction: p, open, onClose }) => {
  const { formatKickoff, formatOdds } = useUserPreferences();
  const { addSelection } = useBetSlip();
  const [activeTab, setActiveTab] = useState('analytics');

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const matchSlug = formatMatchSlug(p.home_team, p.away_team, p.match_date);
  const matchUrl = `/predict/${matchSlug}`;

  const baseHome = p.home_odds || 2.10;
  const baseDraw = p.draw_odds || 3.30;
  const baseAway = p.away_odds || 3.50;

  const winProbabilities = useMemo(() => {
    const raw = p as Record<string, any>;
    const explicitHome = p.home_win_probability ?? raw.home_probability;
    const explicitDraw = p.draw_probability;
    const explicitAway = p.away_win_probability ?? raw.away_probability;
    if (explicitHome && explicitDraw && explicitAway) {
      return {
        home: Math.round(Number(explicitHome)),
        draw: Math.round(Number(explicitDraw)),
        away: Math.round(Number(explicitAway)),
      };
    }
    const h = 1 / baseHome;
    const d = 1 / baseDraw;
    const a = 1 / baseAway;
    const total = h + d + a;
    return {
      home: Math.round((h / total) * 100),
      draw: Math.round((d / total) * 100),
      away: Math.max(0, 100 - Math.round((h / total) * 100) - Math.round((d / total) * 100)),
    };
  }, [p, baseHome, baseDraw, baseAway]);

  const handleQuickAddMainTip = (market: string, odds: number) => {
    addSelection({
      matchId: p.id,
      match: `${p.home_team} vs ${p.away_team}`,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      market,
      odds,
      confidence,
    });
    toast.success(`Added ${p.home_team} vs ${p.away_team} (${market} @${odds.toFixed(2)}) to Bet Slip!`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border">
        {/* Broadcast Scoreboard Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className="font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                {p.league}
              </Badge>
              <span className="text-xs text-slate-300 flex items-center gap-1 font-mono tabular-nums">
                <Calendar className="h-3 w-3" />
                {formatKickoff(p.match_date, { includeWeekday: true, includeDate: true, includeTimezone: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={matchUrl}
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                title={`Open full Match Center page for ${p.home_team} vs ${p.away_team}`}
              >
                <span>Full Match Preview</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <NotifyMeButton
                match={{
                  id: p.id,
                  home_team: p.home_team,
                  away_team: p.away_team,
                  league: p.league,
                  match_date: p.match_date,
                  prediction: outcome,
                  confidence,
                  home_odds: p.home_odds,
                  draw_odds: p.draw_odds,
                  away_odds: p.away_odds,
                }}
                variant="compact"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 items-center text-center my-4">
            <div className="col-span-2 flex items-center gap-3 text-left">
              <TeamLogo team={p.home_team} size="lg" className="shadow-sm" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">{p.home_team}</h2>
                <span className="text-xs text-slate-400 font-medium">Home</span>
              </div>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="px-2.5 py-1 bg-slate-800 rounded-md text-xs font-mono font-bold text-slate-300 border border-slate-700">
                VS
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-3 text-right">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">{p.away_team}</h2>
                <span className="text-xs text-slate-400 font-medium">Away</span>
              </div>
              <TeamLogo team={p.away_team} size="lg" className="shadow-sm" />
            </div>
          </div>

          {/* 3-Way Interactive Odds & Probability Matrix */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
              <span>Click any 1X2 outcome to add directly to Bet Slip</span>
              <span className="font-mono text-[10px]">1 · X · 2</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums" role="group" aria-label="Match outcome probabilities">
              <button
                type="button"
                onClick={() => handleQuickAddMainTip('Home Win', baseHome)}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  outcome === 'Home Win'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold hover:bg-emerald-500/30'
                    : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium truncate">1 ({p.home_team})</div>
                <div className="font-bold text-sm mt-0.5">
                  {formatOdds(baseHome)} ({winProbabilities.home}%)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddMainTip('Draw', baseDraw)}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  outcome === 'Draw'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold hover:bg-amber-500/30'
                    : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium">X (Draw)</div>
                <div className="font-bold text-sm mt-0.5">
                  {formatOdds(baseDraw)} ({winProbabilities.draw}%)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddMainTip('Away Win', baseAway)}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  outcome === 'Away Win'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold hover:bg-sky-500/30'
                    : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium truncate">2 ({p.away_team})</div>
                <div className="font-bold text-sm mt-0.5">
                  {formatOdds(baseAway)} ({winProbabilities.away}%)
                </div>
              </button>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex" aria-hidden="true">
              <div style={{ width: `${winProbabilities.home}%` }} className="bg-emerald-500" />
              <div style={{ width: `${winProbabilities.draw}%` }} className="bg-amber-400" />
              <div style={{ width: `${winProbabilities.away}%` }} className="bg-sky-500" />
            </div>
          </div>
        </div>

        {/* 5-Tab Navigation including Odds & Booking Codes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-3 border-b bg-card">
            <TabsList className="grid grid-cols-5 w-full h-9">
              <TabsTrigger value="analytics" className="text-xs gap-1 font-semibold">
                <Target className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="markets" className="text-xs gap-1 font-semibold">
                <Layers className="h-3.5 w-3.5" /> Markets &amp; xG
              </TabsTrigger>
              <TabsTrigger value="odds" className="text-xs gap-1 font-semibold">
                <DollarSign className="h-3.5 w-3.5" /> Odds &amp; Codes
              </TabsTrigger>
              <TabsTrigger value="lineups" className="text-xs gap-1 font-semibold">
                <Users className="h-3.5 w-3.5" /> Lineups
              </TabsTrigger>
              <TabsTrigger value="tactics" className="text-xs gap-1 font-semibold">
                <Activity className="h-3.5 w-3.5" /> Stats &amp; H2H
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="analytics" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">
                      Primary AI Consensus Pick
                    </span>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{outcome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on Poisson expected goals modeling, home/away form splits, and head-to-head metrics.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                    <ConfidenceMeter
                      confidence={confidence}
                      variant="card"
                      predictionTip={outcome}
                      homeTeam={p.home_team}
                      awayTeam={p.away_team}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        handleQuickAddMainTip(
                          outcome,
                          outcome === 'Away Win' ? baseAway : outcome === 'Draw' ? baseDraw : baseHome
                        )
                      }
                      className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Pick to Bet Slip
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <ConfidenceMeter
                    confidence={confidence}
                    variant="gauge"
                    predictionTip={outcome}
                    homeTeam={p.home_team}
                    awayTeam={p.away_team}
                  />
                </div>
              </div>

              {analysis && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Tactical Breakdown
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="markets" className="mt-0">
              <AdvancedMarketsTab
                homeTeam={p.home_team}
                awayTeam={p.away_team}
                league={p.league}
                matchDate={p.match_date}
                homeOdds={baseHome}
                awayOdds={baseAway}
                drawOdds={baseDraw}
                confidence={confidence}
              />
            </TabsContent>

            <TabsContent value="odds" className="mt-0">
              <OddsComparisonTable
                matchId={p.id}
                homeTeam={p.home_team}
                awayTeam={p.away_team}
                league={p.league}
                matchDate={p.match_date}
                baseHomeOdds={baseHome}
                baseDrawOdds={baseDraw}
                baseAwayOdds={baseAway}
              />
            </TabsContent>

            <TabsContent value="lineups" className="mt-0">
              <PitchLineupVisualizer
                homeTeam={p.home_team}
                awayTeam={p.away_team}
                league={p.league}
              />
            </TabsContent>

            <TabsContent value="tactics" className="mt-0">
              <TacticalAnalyticsTab
                homeTeam={p.home_team}
                awayTeam={p.away_team}
                league={p.league}
                homeOdds={baseHome}
                awayOdds={baseAway}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
