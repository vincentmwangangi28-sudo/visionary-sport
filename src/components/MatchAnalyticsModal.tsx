import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Shield,
  Activity,
  Users,
  Scale,
  Sparkles,
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
  const { formatKickoff, formatOdds } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('analytics');

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const matchSlug = formatMatchSlug(p.home_team, p.away_team, p.match_date);
  const matchUrl = `/predict/${matchSlug}`;

  const baseHome = p.home_odds || 2.10;
  const baseDraw = p.draw_odds || 3.30;
  const baseAway = p.away_odds || 3.50;

  const isSelected = (market: string) => {
    return selections.some(s => s.homeTeam === p.home_team && s.awayTeam === p.away_team && s.market === market);
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
    toast.success(`Added ${p.home_team} vs ${p.away_team} - ${market} to Bet Slip`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-card via-muted/40 to-card p-6 border-b">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold border-primary/40 text-primary">
                {p.league}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatKickoff(p.match_date, { includeWeekday: true, includeDate: true, includeTimezone: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceMeter
                confidence={confidence}
                variant="inline"
                predictionTip={outcome}
                homeTeam={p.home_team}
                awayTeam={p.away_team}
              />
              <Link
                to={matchUrl}
                onClick={onClose}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted/80 hover:bg-primary/10 hover:text-primary transition-colors border text-muted-foreground"
                title={`Open full dedicated page for ${p.home_team} vs ${p.away_team}`}
              >
                <span>Full Page</span>
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
                <h2 className="text-base sm:text-lg font-black truncate">{p.home_team}</h2>
                <span className="text-xs text-muted-foreground font-medium">Home Team</span>
              </div>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-black text-muted-foreground border">VS</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-3 text-right">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black truncate">{p.away_team}</h2>
                <span className="text-xs text-muted-foreground font-medium">Away Team</span>
              </div>
              <TeamLogo team={p.away_team} size="lg" className="shadow-sm" />
            </div>
          </div>

          {/* Quick Odds Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4" role="group" aria-label="Select match outcome odds">
            <button
              type="button"
              onClick={() => handleAddBet('Home Win', baseHome)}
              aria-label={`Select 1 (${p.home_team}) outcome at odds ${baseHome.toFixed(2)}`}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Home Win')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">1 ({p.home_team})</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {baseHome.toFixed(2)}
                {isSelected('Home Win') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAddBet('Draw', baseDraw)}
              aria-label={`Select X (Draw) outcome at odds ${baseDraw.toFixed(2)}`}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Draw')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">X (Draw)</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {baseDraw.toFixed(2)}
                {isSelected('Draw') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAddBet('Away Win', baseAway)}
              aria-label={`Select 2 (${p.away_team}) outcome at odds ${baseAway.toFixed(2)}`}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Away Win')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">2 ({p.away_team})</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {baseAway.toFixed(2)}
                {isSelected('Away Win') && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-3 border-b bg-card">
            <TabsList className="grid grid-cols-6 w-full h-9">
              <TabsTrigger value="gemini" className="text-xs gap-1 font-semibold text-primary">
                <Search className="h-3.5 w-3.5" /> Google AI
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1 font-semibold">
                <Target className="h-3.5 w-3.5" /> Model
              </TabsTrigger>
              <TabsTrigger value="markets" className="text-xs gap-1 font-semibold">
                <Layers className="h-3.5 w-3.5" /> Markets
              </TabsTrigger>
              <TabsTrigger value="lineups" className="text-xs gap-1 font-semibold">
                <Users className="h-3.5 w-3.5" /> Pitch
              </TabsTrigger>
              <TabsTrigger value="tactics" className="text-xs gap-1 font-semibold">
                <Activity className="h-3.5 w-3.5" /> Referee
              </TabsTrigger>
              <TabsTrigger value="odds" className="text-xs gap-1 font-semibold">
                <Scale className="h-3.5 w-3.5" /> Bookies
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Tab 0: Gemini AI Tactical Deep Dive & Scout */}
            <TabsContent value="gemini" className="mt-0 space-y-4">
              <GeminiMatchIntelligenceTab prediction={p} />
            </TabsContent>

            {/* Tab 1: AI Prediction & Deep Analysis */}
            <TabsContent value="analytics" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" /> Primary AI Recommendation
                    </span>
                    <p className="text-2xl font-black text-foreground mt-1">{outcome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Synthesized from Dixon-Coles Poisson modeling, home/away xG splits, and market odds velocity.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Certainty Level</span>
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

              {/* AI Deep Analysis */}
              {analysis && (
                <div className="bg-muted/30 rounded-xl p-4 border space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Model Logic & Breakdown
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis}
                  </p>
                </div>
              )}

              {/* H2H recent clashes */}
              <div className="bg-muted/20 rounded-xl p-4 border space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">Recent Direct Encounters</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
                    <span className="font-medium">{p.home_team}</span>
                    <span className="font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">2 - 1</span>
                    <span className="font-medium">{p.away_team}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
                    <span className="font-medium">{p.away_team}</span>
                    <span className="font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">1 - 1</span>
                    <span className="font-medium">{p.home_team}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Advanced Markets & Poisson xG */}
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

            {/* Tab 3: Tactical Pitch & Lineup Visualizer */}
            <TabsContent value="lineups" className="mt-0 space-y-4">
              <PitchLineupVisualizer homeTeam={p.home_team} awayTeam={p.away_team} />
            </TabsContent>

            {/* Tab 3: Tactical xG and Referee Analytics */}
            <TabsContent value="tactics" className="mt-0 space-y-4">
              <TacticalAnalyticsTab homeTeam={p.home_team} awayTeam={p.away_team} league={p.league} />
            </TabsContent>

            {/* Tab 4: Multi-Bookmaker Odds Matrix & Booking Codes */}
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
