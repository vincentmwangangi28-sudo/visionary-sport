import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEAMS_DATABASE, DERBY_PRESETS, simulateH2HMatch } from '@/data/h2hTeamsData';
import { TeamProfile, DerbyPreset } from '@/types/h2h';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Sparkles,
  Zap,
  Target,
  PlusCircle,
  Check,
  Trophy,
  History,
  Shield,
  Activity,
  Flame,
  Award,
  Calendar,
  Share2,
} from 'lucide-react';

export default function H2HComparisonPage() {
  const { addSelection, selections, setIsOpen } = useBetSlip();
  const { formatOdds } = useUserPreferences();

  // Selected teams state
  const [teamAId, setTeamAId] = useState<string>('arsenal');
  const [teamBId, setTeamBId] = useState<string>('tottenham');
  const [activeDerbyId, setActiveDerbyId] = useState<string>('north-london-derby');
  const [isSimulating, setIsSimulating] = useState(false);

  const teamA = useMemo(() => {
    return TEAMS_DATABASE.find(t => t.id === teamAId) || TEAMS_DATABASE[0];
  }, [teamAId]);

  const teamB = useMemo(() => {
    return TEAMS_DATABASE.find(t => t.id === teamBId) || TEAMS_DATABASE[1];
  }, [teamBId]);

  // Check if current matchup matches any preset derby
  const activeDerby = useMemo(() => {
    return DERBY_PRESETS.find(
      d =>
        (d.teamAId === teamAId && d.teamBId === teamBId) ||
        (d.teamAId === teamBId && d.teamBId === teamAId)
    );
  }, [teamAId, teamBId]);

  // Run Poisson distribution match simulation
  const simulation = useMemo(() => {
    return simulateH2HMatch(teamA, teamB);
  }, [teamA, teamB]);

  // Swap teams (Home vs Away)
  const handleSwap = () => {
    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  // Select a preset derby
  const handleSelectDerby = (derby: DerbyPreset) => {
    setActiveDerbyId(derby.id);
    setTeamAId(derby.teamAId);
    setTeamBId(derby.teamBId);
  };

  // Trigger re-simulation animation
  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      toast.success(`Match simulation updated for ${teamA.name} vs ${teamB.name}`);
    }, 450);
  };

  // Check if bet is in slip
  const isBetInSlip = selections.some(
    s => s.homeTeam === teamA.name && s.awayTeam === teamB.name
  );

  // Add recommended market to slip
  const handleAddToSlip = () => {
    addSelection({
      match: `${teamA.name} vs ${teamB.name}`,
      homeTeam: teamA.name,
      awayTeam: teamB.name,
      league: teamA.league,
      matchDate: 'Upcoming Matchup',
      market: simulation.recommendedMarket,
      odds: simulation.recommendedOdds,
      confidence: Math.max(simulation.homeWinProb, simulation.over25Prob, simulation.bttsProb),
    });
    setIsOpen(true);
    toast.success(`Added ${simulation.recommendedMarket} to your bet slip!`);
  };

  // Share matchup analysis
  const handleShare = () => {
    const text = `⚽ H2H Simulation: ${teamA.name} vs ${teamB.name}\n` +
      `📊 Win Probabilities: ${teamA.name} ${simulation.homeWinProb}% | Draw ${simulation.drawProb}% | ${teamB.name} ${simulation.awayWinProb}%\n` +
      `🔥 Over 2.5: ${simulation.over25Prob}% | BTTS: ${simulation.bttsProb}%\n` +
      `🎯 Top Score: ${simulation.topScores[0].score} (${simulation.topScores[0].prob}%)\n` +
      `💡 Value Pick: ${simulation.recommendedMarket} @ ${simulation.recommendedOdds}\n` +
      `👉 Simulated on PredictPro: https://predictpro.guru/h2h`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Matchup analysis copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="AI Football Head-to-Head (H2H) Comparison & Simulator | PredictPro"
        description="Compare any two football clubs head-to-head with Poisson scoreline simulations, comparative attack ratings, and value betting recommendations."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-24 pb-28 md:pb-16 space-y-8">
        {/* Header Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Head-to-Head Matchup &amp; Poisson Simulator
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Team H2H &amp; <span className="text-primary">Matchup Simulator</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mt-1">
                Select any two global football clubs to generate side-by-side tactical metrics, Monte Carlo Poisson scoreline probabilities, historical derby archives, and value betting recommendations.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleShare}
              >
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                Share Analysis
              </Button>
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="gap-2 bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 text-xs"
              >
                <Zap className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Derby Quick Picks */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Iconic Derby &amp; Rivalry Matchups
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DERBY_PRESETS.map(derby => {
              const isSelected = activeDerbyId === derby.id;
              return (
                <button
                  key={derby.id}
                  onClick={() => handleSelectDerby(derby)}
                  className={`px-3 py-2 rounded-xl border text-left flex-shrink-0 transition-all text-xs flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                      : 'bg-card border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <span className="font-semibold text-foreground text-xs">{derby.name}</span>
                  <span className="text-[10px] text-muted-foreground">{derby.league}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Matchup Selector Card */}
        <Card className="p-6 bg-card/90 border-border/80 rounded-2xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Team A (Home) */}
            <div className="md:col-span-5 p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Home Team
                </span>
                <Badge variant="outline" className="text-[10px]">{teamA.league}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0"
                  style={{ backgroundColor: teamA.badgeColor || '#333' }}
                >
                  {teamA.logoText}
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    value={teamAId}
                    onChange={e => {
                      setTeamAId(e.target.value);
                      setActiveDerbyId('');
                    }}
                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TEAMS_DATABASE.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground block mt-1 truncate">
                    Star: {teamA.starPlayer.name} ({teamA.starPlayer.goals}G, {teamA.starPlayer.assists}A)
                  </span>
                </div>
              </div>
            </div>

            {/* Swap & VS Center */}
            <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
              <span className="font-black text-xs text-muted-foreground tracking-widest uppercase">VS</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border hover:bg-primary/10 hover:text-primary hover:border-primary"
                onClick={handleSwap}
                title="Swap Home & Away"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Team B (Away) */}
            <div className="md:col-span-5 p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                  Away Team
                </span>
                <Badge variant="outline" className="text-[10px]">{teamB.league}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0"
                  style={{ backgroundColor: teamB.badgeColor || '#555' }}
                >
                  {teamB.logoText}
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    value={teamBId}
                    onChange={e => {
                      setTeamBId(e.target.value);
                      setActiveDerbyId('');
                    }}
                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TEAMS_DATABASE.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground block mt-1 truncate">
                    Star: {teamB.starPlayer.name} ({teamB.starPlayer.goals}G, {teamB.starPlayer.assists}A)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Simulation Output Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulation Probabilities */}
          <Card className="lg:col-span-2 p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-bold">Poisson Matchup Simulation Results</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[11px] font-mono">
                xG: {simulation.expectedHomeGoals} - {simulation.expectedAwayGoals}
              </Badge>
            </div>

            {/* 1X2 Win Probability Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-primary">{teamA.name} Win: {simulation.homeWinProb}%</span>
                <span className="text-muted-foreground">Draw: {simulation.drawProb}%</span>
                <span className="text-foreground">{teamB.name} Win: {simulation.awayWinProb}%</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${simulation.homeWinProb}%` }}
                  title={`${teamA.name} Win: ${simulation.homeWinProb}%`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${simulation.drawProb}%` }}
                  title={`Draw: ${simulation.drawProb}%`}
                />
                <div
                  className="bg-sky-600 h-full transition-all duration-500"
                  style={{ width: `${simulation.awayWinProb}%` }}
                  title={`${teamB.name} Win: ${simulation.awayWinProb}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-0.5">
                <span>Fair Odds: @{(100 / simulation.homeWinProb).toFixed(2)}</span>
                <span>Fair Odds: @{(100 / simulation.drawProb).toFixed(2)}</span>
                <span>Fair Odds: @{(100 / simulation.awayWinProb).toFixed(2)}</span>
              </div>
            </div>

            {/* Goal Market Probabilities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Over 2.5 Goals</span>
                <span className="text-xl font-black text-foreground">{simulation.over25Prob}%</span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Fair: @{(100 / simulation.over25Prob).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Both Teams Score (BTTS)</span>
                <span className="text-xl font-black text-foreground">{simulation.bttsProb}%</span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Fair: @{(100 / simulation.bttsProb).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{teamA.shortName} Exp. Goals</span>
                <span className="text-xl font-black text-primary">{simulation.expectedHomeGoals}</span>
                <span className="text-[10px] text-muted-foreground block">Attack vs Defense</span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{teamB.shortName} Exp. Goals</span>
                <span className="text-xl font-black text-foreground">{simulation.expectedAwayGoals}</span>
                <span className="text-[10px] text-muted-foreground block">Away conversion</span>
              </div>
            </div>

            {/* Most Probable Correct Scores */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Top Probable Exact Scorelines (Poisson Matrix)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {simulation.topScores.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-black text-foreground font-mono text-sm">{item.score}</span>
                    <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                      {item.prob}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Value Bet Recommendation Box */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-base">Algorithmic Best Bet</h3>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
                <span className="text-[11px] text-muted-foreground block">Recommended Selection:</span>
                <span className="text-lg font-black text-foreground block leading-tight">
                  {simulation.recommendedMarket}
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Estimated Odds:</span>
                  <Badge className="text-sm font-black font-mono px-2.5 py-0.5 bg-primary text-primary-foreground">
                    @ {formatOdds(simulation.recommendedOdds)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-foreground block">AI Tactical Verdict:</span>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  {simulation.tacticalVerdict}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddToSlip}
              disabled={isBetInSlip}
              className={`w-full h-10 text-xs font-bold gap-2 ${
                isBetInSlip ? 'bg-emerald-600/20 text-emerald-600' : 'bg-primary text-primary-foreground shadow-md'
              }`}
            >
              {isBetInSlip ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> Selection In Slip
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" /> Add Selection to Bet Slip
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Head-to-Head Comparative Attribute Meters */}
        <Card className="p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Tactical Power &amp; Ratings Comparison</CardTitle>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Attacking Threat', valA: teamA.attackRating, valB: teamB.attackRating },
              { label: 'Defensive Solidity', valA: teamA.defenseRating, valB: teamB.defenseRating },
              { label: 'Possession Control', valA: teamA.possessionRating, valB: teamB.possessionRating },
              { label: 'Set Piece Efficiency', valA: teamA.setPieceRating, valB: teamB.setPieceRating },
              { label: 'Current Form Index', valA: teamA.formRating, valB: teamB.formRating },
            ].map(metric => (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="font-bold font-mono text-primary">{metric.valA}</span>
                  <span className="text-muted-foreground text-center">{metric.label}</span>
                  <span className="font-bold font-mono text-foreground">{metric.valB}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 h-2.5">
                  {/* Left (Team A) fills from right to left */}
                  <div className="bg-muted rounded-full overflow-hidden flex justify-end">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${metric.valA}%` }}
                    />
                  </div>
                  {/* Right (Team B) fills from left to right */}
                  <div className="bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metric.valB}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Season Statistics Table */}
          <div className="pt-4 border-t border-border/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
              Season Statistical Metrics
            </span>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Goals / Game</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.goalsScoredPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.goalsScoredPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Conceded / Game</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.goalsConcededPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.goalsConcededPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">xG Expected Goals</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.xGPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.xGPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">xGA Conceded</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.xGAPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.xGAPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Clean Sheet %</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.cleanSheetPct}%</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.cleanSheetPct}%</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">BTTS Rate %</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.bttsRatePct}%</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.bttsRatePct}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Historical H2H Meetings */}
        {activeDerby && activeDerby.pastMeetings.length > 0 && (
          <Card className="p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg font-bold">Historical Encounters: {activeDerby.name}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Last {activeDerby.pastMeetings.length} Matches</span>
            </div>

            <div className="space-y-2">
              {activeDerby.pastMeetings.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-[11px]">{m.date}</span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <span className="text-right min-w-[110px] truncate">{m.homeTeam}</span>
                    <Badge className="font-mono text-xs px-2.5 py-0.5 bg-card border border-border text-foreground">
                      {m.homeScore} - {m.awayScore}
                    </Badge>
                    <span className="text-left min-w-[110px] truncate">{m.awayTeam}</span>
                  </div>

                  <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                    {m.competition}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
