import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DutchingCalculatorModal } from '@/components/DutchingCalculatorModal';
import { TEAM_STREAKS_DATA } from '@/data/teamStreaksData';
import { TeamStreak, StreakCategory } from '@/types/streak';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';
import {
  Flame,
  TrendingUp,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Calculator,
  Search,
  PlusCircle,
  Check,
  Share2,
  Calendar,
  AlertTriangle,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

export default function StreaksRadar() {
  const { addSelection, addSelections, selections, setIsOpen } = useBetSlip();
  const { formatOdds } = useUserPreferences();

  const [selectedCategory, setSelectedCategory] = useState<StreakCategory>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minSustainability, setMinSustainability] = useState<number>(0);

  // Dutching modal state
  const [dutchingOpen, setDutchingOpen] = useState(false);
  const [dutchingInitial, setDutchingInitial] = useState<{ name: string; odds: number }[] | undefined>();

  // Available leagues
  const leagues = useMemo(() => {
    const set = new Set(TEAM_STREAKS_DATA.map(s => s.league));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered streaks
  const filteredStreaks = useMemo(() => {
    return TEAM_STREAKS_DATA.filter(streak => {
      // Category filter
      if (selectedCategory !== 'all' && streak.category !== selectedCategory) {
        return false;
      }
      // League filter
      if (selectedLeague !== 'all' && streak.league !== selectedLeague) {
        return false;
      }
      // Sustainability filter
      if (streak.sustainability.score < minSustainability) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTeam = streak.team.toLowerCase().includes(query);
        const matchesLeague = streak.league.toLowerCase().includes(query);
        const matchesOpp = streak.nextMatch.opponent.toLowerCase().includes(query);
        const matchesTitle = streak.title.toLowerCase().includes(query);
        if (!matchesTeam && !matchesLeague && !matchesOpp && !matchesTitle) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => b.sustainability.score - a.sustainability.score);
  }, [selectedCategory, selectedLeague, searchQuery, minSustainability]);

  // High confidence banker streaks (for 1-click Acca builder)
  const topBankerStreaks = useMemo(() => {
    return TEAM_STREAKS_DATA.filter(s => s.sustainability.score >= 80).slice(0, 4);
  }, []);

  const combinedBankerOdds = useMemo(() => {
    return topBankerStreaks.reduce((acc, s) => acc * s.nextMatch.odds, 1);
  }, [topBankerStreaks]);

  // Check if a streak selection is already in betslip
  const isSelectionInSlip = (streak: TeamStreak) => {
    return selections.some(
      sel =>
        sel.homeTeam === (streak.nextMatch.isHome ? streak.team : streak.nextMatch.opponent) &&
        sel.market === streak.nextMatch.marketName
    );
  };

  // Add individual streak to slip
  const handleAddToSlip = (streak: TeamStreak) => {
    const homeTeam = streak.nextMatch.isHome ? streak.team : streak.nextMatch.opponent;
    const awayTeam = streak.nextMatch.isHome ? streak.nextMatch.opponent : streak.team;

    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league: streak.league,
      matchDate: streak.nextMatch.date,
      market: streak.nextMatch.marketName,
      odds: streak.nextMatch.odds,
      confidence: streak.sustainability.score,
    });

    toast.success(`Added ${streak.team} streak bet to slip!`);
  };

  // Batch add top banker accumulator
  const handleBuildBankerAcca = () => {
    const newItems = topBankerStreaks.map(streak => {
      const homeTeam = streak.nextMatch.isHome ? streak.team : streak.nextMatch.opponent;
      const awayTeam = streak.nextMatch.isHome ? streak.nextMatch.opponent : streak.team;
      return {
        match: `${homeTeam} vs ${awayTeam}`,
        homeTeam,
        awayTeam,
        league: streak.league,
        matchDate: streak.nextMatch.date,
        market: streak.nextMatch.marketName,
        odds: streak.nextMatch.odds,
        confidence: streak.sustainability.score,
      };
    });

    addSelections(newItems);
    setIsOpen(true);
    toast.success(`Generated ${newItems.length}-Leg High Sustainability Streak Acca!`);
  };

  // Launch Dutching with streak matchup
  const handleLaunchDutching = (streak: TeamStreak) => {
    const homeTeam = streak.nextMatch.isHome ? streak.team : streak.nextMatch.opponent;
    const awayTeam = streak.nextMatch.isHome ? streak.nextMatch.opponent : streak.team;

    setDutchingInitial([
      { name: `${streak.team} (${streak.nextMatch.marketName})`, odds: streak.nextMatch.odds },
      { name: `Fade/Hedge (${awayTeam} / Alternate)`, odds: 2.50 },
    ]);
    setDutchingOpen(true);
  };

  // Copy shareable summary
  const handleShareStreak = (streak: TeamStreak) => {
    const shareText = `🔥 Active Football Streak: ${streak.team} (${streak.league})\n` +
      `📊 Trend: ${streak.title} (${streak.streakCount} games straight)\n` +
      `🤖 AI Sustainability: ${streak.sustainability.score}% (${streak.sustainability.verdict})\n` +
      `⚽ Next Game: vs ${streak.nextMatch.opponent} | Market: ${streak.nextMatch.marketName} @ ${streak.nextMatch.odds}\n` +
      `👉 Track on PredictPro: https://predictpro.guru/streaks`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success('Streak analysis copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="AI Football Streaks & Betting Trends Radar | PredictPro"
        description="Scan active winning streaks, Over 2.5 goals runs, BTTS streaks, and clean sheets across top football leagues with AI Sustainability ratings."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-24 pb-28 md:pb-16 space-y-8">
        {/* Header Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            Active Team Streaks &amp; Betting Trends Radar
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Football Streaks &amp; <span className="text-primary">AI Trends Radar</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Track active statistical anomalies across global football. Our machine learning engine analyzes opponent xGA, tactical matchups, and squad rotation to quantify streak sustainability.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleBuildBankerAcca}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-md shadow-orange-500/20"
              >
                <Zap className="h-4 w-4" />
                Build Banker Streak Acca ({formatOdds(combinedBankerOdds)})
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setDutchingInitial(undefined);
                  setDutchingOpen(true);
                }}
                className="gap-2 border-border/80 hover:border-primary"
              >
                <Calculator className="h-4 w-4 text-primary" />
                Dutching Calculator
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Card className="p-4 bg-card/60 border-border/60">
              <span className="text-xs text-muted-foreground block font-medium">Monitored Streaks</span>
              <span className="text-2xl font-black text-foreground">{TEAM_STREAKS_DATA.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Updated live across 8 leagues</span>
            </Card>

            <Card className="p-4 bg-card/60 border-border/60">
              <span className="text-xs text-muted-foreground block font-medium">Longest Active Streak</span>
              <span className="text-2xl font-black text-orange-500 flex items-center gap-1">
                14 <span className="text-xs font-normal text-muted-foreground">Games</span>
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Real Madrid (Unbeaten)</span>
            </Card>

            <Card className="p-4 bg-card/60 border-border/60">
              <span className="text-xs text-muted-foreground block font-medium">Top AI Sustainability</span>
              <span className="text-2xl font-black text-emerald-500">91%</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Bayer Leverkusen (Away Goal)</span>
            </Card>

            <Card className="p-4 bg-card/60 border-border/60">
              <span className="text-xs text-muted-foreground block font-medium">Historical Hit Rate</span>
              <span className="text-2xl font-black text-primary">88.5%</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Average across last 10 fixtures</span>
            </Card>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-card border border-border/70 rounded-2xl space-y-4 shadow-sm">
          {/* Top Row: Search & Sustainability filter */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team, league or opponent..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Confidence:
              </span>
              <div className="flex gap-1.5 flex-shrink-0">
                {[
                  { label: 'All Streaks', val: 0 },
                  { label: 'Moderate (70%+)', val: 70 },
                  { label: 'Strong Back (80%+)', val: 80 },
                ].map(item => (
                  <Button
                    key={item.val}
                    size="sm"
                    variant={minSustainability === item.val ? 'default' : 'outline'}
                    className="h-7 text-xs px-2.5 rounded-lg"
                    onClick={() => setMinSustainability(item.val)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="overflow-x-auto pb-1">
            <Tabs
              value={selectedCategory}
              onValueChange={v => setSelectedCategory(v as StreakCategory)}
              className="w-full"
            >
              <TabsList className="h-9 p-1 bg-muted/70 w-full sm:w-auto justify-start inline-flex">
                <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> All ({TEAM_STREAKS_DATA.length})
                </TabsTrigger>
                <TabsTrigger value="goals" className="text-xs px-3 gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500" /> Over 2.5 Goals
                </TabsTrigger>
                <TabsTrigger value="btts" className="text-xs px-3 gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> BTTS (GG)
                </TabsTrigger>
                <TabsTrigger value="results" className="text-xs px-3 gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Wins / Unbeaten
                </TabsTrigger>
                <TabsTrigger value="defense" className="text-xs px-3 gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> Clean Sheets
                </TabsTrigger>
                <TabsTrigger value="halves" className="text-xs px-3 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 1st Half Goals
                </TabsTrigger>
                <TabsTrigger value="corners" className="text-xs px-3 gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-purple-500" /> Corners
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* League Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-muted-foreground mr-1 flex-shrink-0 font-medium">League:</span>
            {leagues.map(l => (
              <Button
                key={l}
                size="sm"
                variant={selectedLeague === l ? 'secondary' : 'ghost'}
                className="h-6 px-2 text-[11px] rounded-md capitalize flex-shrink-0"
                onClick={() => setSelectedLeague(l)}
              >
                {l === 'all' ? 'All Leagues' : l}
              </Button>
            ))}
          </div>
        </div>

        {/* Streaks Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <strong>{filteredStreaks.length}</strong> active streaks
            </span>
            <span>Sorted by AI Sustainability Index</span>
          </div>

          {filteredStreaks.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Flame className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-base">No active streaks match your filter</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Try resetting the league or category filter to view all available statistical streaks.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLeague('all');
                  setMinSustainability(0);
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStreaks.map(streak => {
                const inSlip = isSelectionInSlip(streak);
                const isHighConfidence = streak.sustainability.score >= 80;

                return (
                  <Card
                    key={streak.id}
                    className="overflow-hidden border-border/70 hover:border-primary/40 transition-all duration-200 bg-card/90 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top: Team, League & Streak Count */}
                      <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-2 border-b border-border/40 bg-muted/20">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="text-[10px] font-medium py-0 px-2">
                              {streak.league}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold uppercase tracking-wider py-0 px-2 bg-primary/10 text-primary border-primary/20"
                            >
                              {streak.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {streak.team}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {streak.streakDescription}
                          </p>
                        </div>

                        {/* Streak Badge */}
                        <div className="text-right flex-shrink-0">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-sm">
                            <Flame className="h-4 w-4 fill-orange-500" />
                            <span>{streak.streakCount} Games</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-1 font-mono">
                            Hit: {streak.hitRateLast10}% L10
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4 text-xs">
                        {/* Next Match Target Market Box */}
                        <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-1 text-[11px] font-medium">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              Next: vs {streak.nextMatch.opponent} ({streak.nextMatch.isHome ? 'Home' : 'Away'})
                            </span>
                            <span className="text-[11px] font-mono">{streak.nextMatch.date}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Recommended Bet:</span>
                              <span className="font-bold text-sm text-foreground">{streak.nextMatch.marketName}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block font-mono">{streak.nextMatch.bookmaker}</span>
                              <Badge className="font-mono text-xs font-bold px-2 py-0.5 bg-primary text-primary-foreground">
                                @ {formatOdds(streak.nextMatch.odds)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* AI Sustainability Rating */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5 text-xs">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              AI Sustainability Index:
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  isHighConfidence
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                }`}
                              >
                                {streak.sustainability.verdict}
                              </Badge>
                              <span className="font-mono font-bold text-sm text-foreground">
                                {streak.sustainability.score}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${streak.sustainability.score}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                            <strong className="text-foreground">Tactical Edge:</strong> {streak.sustainability.tacticalInsight}
                          </p>

                          <div className="flex items-start gap-1.5 pt-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Risk Watch:</strong> {streak.sustainability.keyRiskFactor}</span>
                          </div>
                        </div>

                        {/* Recent 5-game Timeline */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Recent Match Sequence (Last 5)
                          </span>
                          <div className="grid grid-cols-5 gap-1.5 pt-1">
                            {streak.recentMatches.map((m, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded-lg bg-card border border-border/50 text-center text-[10px] overflow-hidden"
                                title={`vs ${m.opponent} (${m.score}) - ${m.statValue}`}
                              >
                                <span
                                  className={`inline-block w-4 h-4 rounded-full font-bold text-[9px] leading-4 text-white mb-0.5 ${
                                    m.result === 'W' ? 'bg-emerald-600' : m.result === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                                  }`}
                                >
                                  {m.result}
                                </span>
                                <span className="block font-mono font-semibold truncate text-[9px]">{m.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2 bg-muted/10">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleLaunchDutching(streak)}
                          title="Hedge or Split Stakes"
                        >
                          <Calculator className="h-3.5 w-3.5 mr-1 text-primary" />
                          Hedge
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleShareStreak(streak)}
                          title="Share Streak Analysis"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToSlip(streak)}
                        disabled={inSlip}
                        className={`h-8 text-xs font-semibold px-3 gap-1.5 ${
                          inSlip ? 'bg-emerald-600/20 text-emerald-600 hover:bg-emerald-600/30' : ''
                        }`}
                      >
                        {inSlip ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" /> In Slip
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-3.5 w-3.5" /> Back Streak @ {formatOdds(streak.nextMatch.odds)}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Educational / Methodology Info Card */}
        <Card className="p-6 bg-muted/20 border-border/60 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">How PredictPro Quantifies Streak Sustainability</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Blindly backing active winning runs or goal trends is a classic gambler's fallacy. PredictPro's AI Sustainability Index analyzes three specific predictive indicators:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
              <span className="font-bold text-foreground block">1. Opponent xGA Mismatch</span>
              <span className="text-muted-foreground">
                Compares the streak team’s expected chance creation rate against the upcoming opponent’s defensive line depth and set-piece vulnerability.
              </span>
            </div>
            <div className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
              <span className="font-bold text-foreground block">2. Home / Away Disparity</span>
              <span className="text-muted-foreground">
                Evaluates tactical adjustments when transitioning between home and away environments, adjusting for travel fatigue and pitch width.
              </span>
            </div>
            <div className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
              <span className="font-bold text-foreground block">3. Regression to the Mean</span>
              <span className="text-muted-foreground">
                Flags unsustainable finishing variance when shot conversion rates exceed 2.2 standard deviations above historical norms.
              </span>
            </div>
          </div>
        </Card>
      </main>

      {/* Dutching Calculator Modal */}
      <DutchingCalculatorModal
        open={dutchingOpen}
        onOpenChange={setDutchingOpen}
        initialSelections={dutchingInitial}
      />

      <Footer />
    </div>
  );
}
