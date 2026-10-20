import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import { PitchLineupVisualizer } from '@/components/PitchLineupVisualizer';
import { TacticalAnalyticsTab } from '@/components/TacticalAnalyticsTab';
import { OddsComparisonTable } from '@/components/OddsComparisonTable';
import { AdvancedMarketsTab } from '@/components/AdvancedMarketsTab';
import { GeminiMatchIntelligenceTab } from '@/components/GeminiMatchIntelligenceTab';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import {
  TrendingUp,
  Target,
  Activity,
  Users,
  Scale,
  Check,
  Calendar,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  prediction: Prediction;
  open: boolean;
  onClose: () => void;
}

export const MatchAnalyticsModal: React.FC<Props> = ({ prediction: p, open, onClose }) => {
  const { addSelection, selections } = useBetSlip();
  const { formatKickoff } = useUserPreferences();
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

  const isSelected = (market: string) => {
    return selections.some((s) => s.homeTeam === p.home_team && s.awayTeam === p.away_team && s.market === market);
  };

  const handleAddBet = (market: string, odds: number) => {
    addSelection({
      match: `${p.home_team} vs ${p.away_team}`,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      market,
      odds,
      confidence,
    });
    toast.success(`Added ${p.home_team} vs ${p.away_team} - ${market} to Match Slip`);
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
                <span>Match Center</span>
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
              <TeamLogo team={p.home_team} size="lg" className="shadow-xs" />
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
              <TeamLogo team={p.away_team} size="lg" className="shadow-xs" />
            </div>
          </div>

          {/* 3-Way Probability Matrix */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
              <span>3-Way Match Outcome Probabilities</span>
              <span className="font-mono text-[10px]">1 · X · 2</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums" role="group" aria-label="Select match outcome probabilities">
              <button
                type="button"
                onClick={() => handleAddBet('Home Win', baseHome)}
                aria-label={`Select 1 (${p.home_team}) outcome - ${winProbabilities.home}% probability`}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  isSelected('Home Win')
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium truncate">1 ({p.home_team})</div>
                <div className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                  {winProbabilities.home}%
                  {isSelected('Home Win') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBet('Draw', baseDraw)}
                aria-label={`Select X (Draw) outcome - ${winProbabilities.draw}% probability`}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  isSelected('Draw')
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium">X (Draw)</div>
                <div className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                  {winProbabilities.draw}%
                  {isSelected('Draw') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBet('Away Win', baseAway)}
                aria-label={`Select 2 (${p.away_team}) outcome - ${winProbabilities.away}% probability`}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  isSelected('Away Win')
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <div className="text-[11px] opacity-80 font-sans font-medium truncate">2 ({p.away_team})</div>
                <div className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                  {winProbabilities.away}%
                  {isSelected('Away Win') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
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

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-3 border-b bg-card">
            <TabsList className="grid grid-cols-6 w-full h-9">
              <TabsTrigger value="analytics" className="text-xs gap-1 font-semibold">
                <Target className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="markets" className="text-xs gap-1 font-semibold">
                <Layers className="h-3.5 w-3.5" /> Markets
              </TabsTrigger>
              <TabsTrigger value="lineups" className="text-xs gap-1 font-semibold">
                <Users className="h-3.5 w-3.5" /> Lineups
              </TabsTrigger>
              <TabsTrigger value="tactics" className="text-xs gap-1 font-semibold">
                <Activity className="h-3.5 w-3.5" /> Stats &amp; xG
              </TabsTrigger>
              <TabsTrigger value="odds" className="text-xs gap-1 font-semibold">
                <Scale className="h-3.5 w-3.5" /> Odds
              </TabsTrigger>
              <TabsTrigger value="gemini" className="text-xs gap-1 font-semibold">
                <Search className="h-3.5 w-3.5" /> Scout
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="analytics" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">
                      Primary Statistical Forecast
                    </span>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{outcome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on Poisson expected goals modeling, home/away form splits, and head-to-head metrics.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Confidence Rating</span>
                    <ConfidenceMeter
                      confidence={confidence}
                      variant="card"
                      predictionTip={outcome}
                      homeTeam={p.home_team}
                      awayTeam={p.away_team}
                    />
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

              <div className="bg-muted/20 rounded-xl p-4 border border-border space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Head-to-Head</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border">
                    <span className="font-semibold">{p.home_team}</span>
                    <span className="font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded">2 - 1</span>
                    <span className="font-semibold">{p.away_team}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border">
                    <span className="font-semibold">{p.away_team}</span>
                    <span className="font-mono font-bold px-2 py-0.5 bg-muted text-foreground rounded">1 - 1</span>
                    <span className="font-semibold">{p.home_team}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="markets" className="mt-0 space-y-4">
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

            <TabsContent value="lineups" className="mt-0 space-y-4">
              <PitchLineupVisualizer homeTeam={p.home_team} awayTeam={p.away_team} />
            </TabsContent>

            <TabsContent value="tactics" className="mt-0 space-y-4">
              <TacticalAnalyticsTab homeTeam={p.home_team} awayTeam={p.away_team} league={p.league} />
            </TabsContent>

            <TabsContent value="odds" className="mt-0 space-y-4">
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

            <TabsContent value="gemini" className="mt-0 space-y-4">
              <GeminiMatchIntelligenceTab prediction={p} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
