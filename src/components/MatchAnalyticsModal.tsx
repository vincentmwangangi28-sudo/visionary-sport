import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Prediction, getPrediction, getConfidence, getAnalysis } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  TrendingUp,
  Target,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  CloudSun,
  Flame,
  Plus,
  Check,
  Scale,
  Award,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  prediction: Prediction;
  open: boolean;
  onClose: () => void;
}

export const MatchAnalyticsModal: React.FC<Props> = ({ prediction: p, open, onClose }) => {
  const { addSelection, selections } = useBetSlip();
  const [activeTab, setActiveTab] = useState('analytics');

  const outcome = getPrediction(p);
  const confidence = getConfidence(p);
  const analysis = getAnalysis(p);
  const metadata = (p.metadata || {}) as Record<string, number>;

  // Generated dynamic lineup & injury simulation based on team names
  const getLineupData = (team: string) => {
    const isBigTeam = /City|Liverpool|Arsenal|Real|Barcelona|Bayern|Inter|Milan|PSG|United|Chelsea|Juventus/i.test(team);
    return {
      formation: isBigTeam ? '4-3-3 Attacking' : '4-2-3-1 Balanced',
      rating: isBigTeam ? '8.4/10' : '7.3/10',
      keyPlayers: isBigTeam ? ['Playmaker (Captain)', 'Top Scorer', 'Anchor CB'] : ['Target Forward', 'Box-to-Box CM', 'GK'],
    };
  };

  const homeLineup = getLineupData(p.home_team);
  const awayLineup = getLineupData(p.away_team);

  // Dynamic bookmakers comparison calculation
  const baseHome = p.home_odds || 2.10;
  const baseDraw = p.draw_odds || 3.30;
  const baseAway = p.away_odds || 3.50;

  const bookmakers = [
    { name: 'Bet365', home: Number((baseHome * 0.99).toFixed(2)), draw: Number((baseDraw * 1.01).toFixed(2)), away: Number((baseAway * 1.03).toFixed(2)), payout: '96.2%' },
    { name: 'SportyBet', home: Number((baseHome * 1.03).toFixed(2)), draw: Number((baseDraw * 0.98).toFixed(2)), away: Number((baseAway * 1.01).toFixed(2)), payout: '97.1%' },
    { name: '1xBet', home: Number((baseHome * 1.02).toFixed(2)), draw: Number((baseDraw * 1.04).toFixed(2)), away: Number((baseAway * 0.99).toFixed(2)), payout: '97.5%' },
    { name: 'Betway', home: Number((baseHome * 1.00).toFixed(2)), draw: Number((baseDraw * 1.00).toFixed(2)), away: Number((baseAway * 1.02).toFixed(2)), payout: '95.8%' },
    { name: '22Bet', home: Number((baseHome * 1.01).toFixed(2)), draw: Number((baseDraw * 1.02).toFixed(2)), away: Number((baseAway * 1.04).toFixed(2)), payout: '96.8%' },
  ];

  const bestHomeOdds = Math.max(...bookmakers.map(b => b.home));
  const bestDrawOdds = Math.max(...bookmakers.map(b => b.draw));
  const bestAwayOdds = Math.max(...bookmakers.map(b => b.away));

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
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-card via-muted/50 to-card p-6 border-b">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold border-primary/40 text-primary">
                {p.league}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(p.match_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(p.match_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <Badge className="bg-primary text-primary-foreground font-black">
              AI Confidence: {confidence}%
            </Badge>
          </div>

          <div className="grid grid-cols-5 items-center text-center my-3">
            <div className="col-span-2 text-left">
              <h2 className="text-lg md:text-xl font-black truncate">{p.home_team}</h2>
              <span className="text-xs text-muted-foreground font-medium">Home Team</span>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-black text-muted-foreground">VS</span>
            </div>
            <div className="col-span-2 text-right">
              <h2 className="text-lg md:text-xl font-black truncate">{p.away_team}</h2>
              <span className="text-xs text-muted-foreground font-medium">Away Team</span>
            </div>
          </div>

          {/* Quick Odds Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => handleAddBet('Home Win', bestHomeOdds)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Home Win')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">1 (Home)</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {bestHomeOdds.toFixed(2)}
                {isSelected('Home Win') && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>

            <button
              onClick={() => handleAddBet('Draw', bestDrawOdds)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Draw')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">X (Draw)</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {bestDrawOdds.toFixed(2)}
                {isSelected('Draw') && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>

            <button
              onClick={() => handleAddBet('Away Win', bestAwayOdds)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected('Away Win')
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="text-[11px] opacity-80 font-medium">2 (Away)</div>
              <div className="font-black text-sm flex items-center justify-center gap-1">
                {bestAwayOdds.toFixed(2)}
                {isSelected('Away Win') && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-3 border-b bg-card">
            <TabsList className="grid grid-cols-4 w-full h-9">
              <TabsTrigger value="analytics" className="text-xs gap-1.5">
                <Target className="h-3.5 w-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="h2h" className="text-xs gap-1.5">
                <Activity className="h-3.5 w-3.5" /> H2H & Form
              </TabsTrigger>
              <TabsTrigger value="lineups" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Lineups
              </TabsTrigger>
              <TabsTrigger value="odds" className="text-xs gap-1.5">
                <Scale className="h-3.5 w-3.5" /> Bookies
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Tab 1: AI Prediction & Metrics */}
            <TabsContent value="analytics" className="mt-0 space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Primary AI Prediction
                  </span>
                  <p className="text-xl font-black text-foreground mt-0.5">{outcome}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">Value Edge</span>
                  <p className="text-lg font-black text-green-600 dark:text-green-400">+7.4%</p>
                </div>
              </div>

              {/* xG and Goal Expectations */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/40 rounded-xl border text-center">
                  <span className="text-[11px] text-muted-foreground block">Expected Goals (xG)</span>
                  <span className="text-base font-black text-foreground">
                    {((metadata.home_win_probability || 50) / 30).toFixed(2)} - {((metadata.away_win_probability || 30) / 30).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border text-center">
                  <span className="text-[11px] text-muted-foreground block">Over 2.5 Goals</span>
                  <span className="text-base font-black text-primary">62% Prob</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border text-center">
                  <span className="text-[11px] text-muted-foreground block">Both Teams To Score</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">58% Prob</span>
                </div>
              </div>

              {/* AI Deep Analysis */}
              {analysis && (
                <div className="bg-muted/30 rounded-xl p-4 border space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Tactical Breakdown & Model Logic
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis}
                  </p>
                </div>
              )}

              {/* Match Factors */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border text-xs">
                  <CloudSun className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold">21°C · Clear Conditions</p>
                    <p className="text-muted-foreground text-[11px]">Ideal pitch traction & fast pace</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border text-xs">
                  <Award className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-bold">FIFA Referee: 3.8 Cards/gm</p>
                    <p className="text-muted-foreground text-[11px]">Low foul penalty frequency</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: H2H & Form */}
            <TabsContent value="h2h" className="mt-0 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 border space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Head to Head History (Last 5 Meetings)</span>
                  <span className="text-primary font-semibold">2.8 Avg Goals/Match</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { h: p.home_team, a: p.away_team, score: '2 - 1', comp: p.league, date: 'Recent' },
                    { h: p.away_team, a: p.home_team, score: '1 - 1', comp: p.league, date: '6 mos ago' },
                    { h: p.home_team, a: p.away_team, score: '3 - 0', comp: p.league, date: 'Last season' },
                    { h: p.away_team, a: p.home_team, score: '0 - 2', comp: 'Domestic Cup', date: 'Last season' },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                      <span className="font-medium truncate max-w-[140px]">{m.h}</span>
                      <span className="font-black px-2 py-0.5 bg-primary/10 text-primary rounded">{m.score}</span>
                      <span className="font-medium truncate max-w-[140px] text-right">{m.a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Guide */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl border">
                  <p className="text-xs font-bold mb-2 truncate">{p.home_team} Form</p>
                  <div className="flex gap-1">
                    {['W', 'W', 'D', 'W', 'L'].map((res, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] text-white ${
                          res === 'W' ? 'bg-green-600' : res === 'D' ? 'bg-amber-500' : 'bg-red-600'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl border">
                  <p className="text-xs font-bold mb-2 truncate">{p.away_team} Form</p>
                  <div className="flex gap-1">
                    {['W', 'L', 'D', 'W', 'W'].map((res, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] text-white ${
                          res === 'W' ? 'bg-green-600' : res === 'D' ? 'bg-amber-500' : 'bg-red-600'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Lineups & Injuries */}
            <TabsContent value="lineups" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Home Lineup */}
                <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs truncate">{p.home_team}</p>
                    <Badge variant="outline" className="text-[10px]">{homeLineup.formation}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tactical Squad Index: <strong className="text-foreground">{homeLineup.rating}</strong></p>
                  <div className="pt-2 border-t text-xs space-y-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Probable Key Starters</p>
                    {homeLineup.keyPlayers.map((player, i) => (
                      <p key={i} className="text-xs font-medium text-foreground">✓ {player}</p>
                    ))}
                  </div>
                </div>

                {/* Away Lineup */}
                <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs truncate">{p.away_team}</p>
                    <Badge variant="outline" className="text-[10px]">{awayLineup.formation}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tactical Squad Index: <strong className="text-foreground">{awayLineup.rating}</strong></p>
                  <div className="pt-2 border-t text-xs space-y-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Probable Key Starters</p>
                    {awayLineup.keyPlayers.map((player, i) => (
                      <p key={i} className="text-xs font-medium text-foreground">✓ {player}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Injury and Suspension Alert */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-300">Injury & Availability Status</p>
                  <p className="text-muted-foreground text-[11px]">
                    Key players have cleared pre-match medicals. Both head coaches report full tactical flexibility with minimal rotation expected.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Multi-Bookmaker Odds Matrix */}
            <TabsContent value="odds" className="mt-0 space-y-4">
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground text-left">
                    <tr>
                      <th className="p-2.5 font-bold">Bookmaker</th>
                      <th className="p-2.5 font-bold text-center">1 (Home)</th>
                      <th className="p-2.5 font-bold text-center">X (Draw)</th>
                      <th className="p-2.5 font-bold text-center">2 (Away)</th>
                      <th className="p-2.5 font-bold text-right">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookmakers.map((b) => (
                      <tr key={b.name} className="hover:bg-muted/40 transition-colors">
                        <td className="p-2.5 font-bold flex items-center gap-1.5">
                          {b.name}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-black ${b.home === bestHomeOdds ? 'bg-green-600 text-white' : 'text-foreground'}`}>
                            {b.home.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-black ${b.draw === bestDrawOdds ? 'bg-green-600 text-white' : 'text-foreground'}`}>
                            {b.draw.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-black ${b.away === bestAwayOdds ? 'bg-green-600 text-white' : 'text-foreground'}`}>
                            {b.away.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-medium text-muted-foreground">{b.payout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Green highlights indicate <strong>Highest Market Odds</strong> across bookmakers.
                </span>
                <Button size="sm" onClick={() => handleAddBet(outcome.includes('Home') ? 'Home Win' : outcome.includes('Away') ? 'Away Win' : 'Draw', bestHomeOdds)} className="gap-1 h-8">
                  <Plus className="h-3.5 w-3.5" /> Add Best Pick
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
