import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useToast } from '@/hooks/use-toast';
import {
  fetchLiveJackpotPools,
  getInitialOfficialJackpotPools,
  JACKPOT_PROVIDERS,
  JackpotProviderId,
  JackpotGame,
  JackpotPickOption,
} from '@/services/jackpotService';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Shield,
  Flame,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  Layers,
  Target,
  RefreshCw,
  Calculator,
  PlusCircle,
  Check,
  Radio,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How are PredictPro.guru Mega & Midweek Jackpot pools populated?',
    a: 'Our jackpot pools sync directly with the official SportPesa (ke.sportpesa.com/api/jackpots) and Betika (api.betika.com/v1/jackpot/events) bookmaker jackpot feeds. Every fixture is listed in the exact official 1-to-17 or 1-to-15 match order with official 1X2 odds, SMS/Game IDs, and Bivariate Poisson xG probabilities.',
  },
  {
    q: 'What is the difference between a Banker Pick and a Double Chance Hedge?',
    a: 'A Banker Pick is a single outcome (1, X, or 2) where our Poisson and ELO models calculate >=52% true win probability or >=80% confidence. A Double Chance Hedge (1X, X2, or 12) covers two outcomes on high-variance or draw-heavy fixtures, doubling your combination count (2^N) to protect jackpot bonus tiers.',
  },
  {
    q: 'How does the Double Chance Permutation Calculator work?',
    a: 'Each Double Chance selection (1X, X2, or 12) multiplies the number of required jackpot slips by 2. For example, selecting 3 Double Chance hedges across a 17-game SportPesa Mega Jackpot creates 2³ = 8 combinations (8 × KSh 99 = KSh 792 total stake).',
  },
  {
    q: 'Can I load the AI Jackpot picks directly into my PredictPro Bet Slip?',
    a: 'Yes! Click "Load Bankers to Bet Slip" to add only the highest-certainty AI Banker locks, or "Load Full Jackpot Slip" to export all games in the current pool to your interactive bet slip with instant bookmaker booking codes.',
  },
];

export default function JackpotPredictions() {
  const { data: basePredictionsData } = usePredictions();
  const basePredictions = useMemo(
    () => basePredictionsData?.allPredictions ?? basePredictionsData?.predictions ?? [],
    [basePredictionsData]
  );
  const { addSelections, selections: slipItems, setIsOpen } = useBetSlip();
  const { toast } = useToast();

  const [provider, setProvider] = useState<JackpotProviderId>('sportpesa');
  const [filterMode, setFilterMode] = useState<'all' | 'bankers' | 'draws'>('all');
  const [pools, setPools] = useState<Record<JackpotProviderId, JackpotGame[]>>(() =>
    getInitialOfficialJackpotPools()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toISOString());
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([
    'SPORTPESA DIRECT API',
    'BETIKA DIRECT API',
    'MOZZART OFFICIAL',
  ]);
  const [customPicks, setCustomPicks] = useState<Record<string, JackpotPickOption>>({});

  const loadRealJackpotData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await fetchLiveJackpotPools(basePredictions, isManual);
        setPools(result.pools);
        setLastSyncedAt(result.lastSyncedAt);
        setSourcesUsed(result.sourcesUsed);

        if (isManual) {
          toast({
            title: 'Official SportPesa & Betika Jackpot Cron Executed',
            description: `Synced ${result.totalRealFixtures} official bookmaker matches across SportPesa (17 & 13), Betika (15M & 50M), and Mozzart (20).`,
          });
        }
      } catch {
        // Keep existing pools if network hiccups
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [basePredictions, toast]
  );

  useEffect(() => {
    loadRealJackpotData(false);

    // 1. Autonomous Scheduled Cron Trigger: Refresh official SportPesa & Betika pools every 5 minutes
    const cronInterval = setInterval(() => {
      loadRealJackpotData(false);
    }, 5 * 60 * 1000);

    // 2. Event Trigger: Refresh when user returns to tab (visibilitychange)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRealJackpotData(false);
      }
    };

    // 3. Event Trigger: Refresh immediately when network connectivity restores
    const onOnline = () => {
      loadRealJackpotData(true);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(cronInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [loadRealJackpotData]);

  const currentMeta = JACKPOT_PROVIDERS[provider];
  const currentPool = useMemo(() => pools[provider] || [], [pools, provider]);

  // Reset or initialize user's interactive picks when switching provider pool
  const activePicks = useMemo(() => {
    const map: Record<string, JackpotPickOption> = {};
    for (const g of currentPool) {
      map[g.fixtureId] = customPicks[g.fixtureId] || g.recommendedPick;
    }
    return map;
  }, [currentPool, customPicks]);

  const handleSelectPick = (fixtureId: string, option: JackpotPickOption) => {
    setCustomPicks((prev) => ({
      ...prev,
      [fixtureId]: option,
    }));
  };

  const handleApplyAIDoubleChances = () => {
    const next: Record<string, JackpotPickOption> = { ...customPicks };
    let count = 0;
    for (const g of currentPool) {
      if (!g.isBanker && (g.doubleChance === '1X' || g.doubleChance === 'X2' || g.doubleChance === '12') && count < 5) {
        next[g.fixtureId] = g.doubleChance;
        count++;
      } else {
        next[g.fixtureId] = g.recommendedPick;
      }
    }
    setCustomPicks(next);
    toast({
      title: 'AI Double Chance Strategy Applied',
      description: `Applied ${count} optimal Double Chance hedges (${Math.pow(2, count)} combinations) on high-variance fixtures.`,
    });
  };

  const handleResetToSingleSlip = () => {
    const next: Record<string, JackpotPickOption> = { ...customPicks };
    for (const g of currentPool) {
      next[g.fixtureId] = g.recommendedPick;
    }
    setCustomPicks(next);
  };

  const filteredGames = useMemo(() => {
    return currentPool.filter((g) => {
      if (filterMode === 'bankers') return g.isBanker;
      if (filterMode === 'draws') return g.isValueDraw || g.recommendedPick === 'X';
      return true;
    });
  }, [currentPool, filterMode]);

  const bankerCount = useMemo(() => currentPool.filter((g) => g.isBanker).length, [currentPool]);
  const drawAlertCount = useMemo(
    () => currentPool.filter((g) => g.isValueDraw || g.recommendedPick === 'X').length,
    [currentPool]
  );

  // Double Chance permutation math: 2^(number of double-chance picks in current pool)
  const permutationStats = useMemo(() => {
    let doubleChanceCount = 0;
    let combinedSingleOdds = 1;

    for (const g of currentPool) {
      const pick = activePicks[g.fixtureId] || g.recommendedPick;
      if (pick === '1X' || pick === 'X2' || pick === '12') {
        doubleChanceCount++;
      }
      const odd =
        pick === '1'
          ? g.homeOdds
          : pick === 'X'
          ? g.drawOdds
          : pick === '2'
          ? g.awayOdds
          : pick === '1X'
          ? Number(((g.homeOdds * g.drawOdds) / (g.homeOdds + g.drawOdds)).toFixed(2))
          : pick === 'X2'
          ? Number(((g.drawOdds * g.awayOdds) / (g.drawOdds + g.awayOdds)).toFixed(2))
          : Number(((g.homeOdds * g.awayOdds) / (g.homeOdds + g.awayOdds)).toFixed(2));

      combinedSingleOdds *= Math.max(1.12, odd);
    }

    const combinations = Math.pow(2, doubleChanceCount);
    const totalCost = combinations * currentMeta.baseStake;

    return {
      doubleChanceCount,
      combinations,
      totalCost,
      combinedSingleOdds: Math.min(999999, Math.round(combinedSingleOdds)),
    };
  }, [currentPool, activePicks, currentMeta.baseStake]);

  const handleLoadToBetSlip = (onlyBankers: boolean) => {
    const targetGames = onlyBankers ? currentPool.filter((g) => g.isBanker) : currentPool;
    const batch = targetGames.map((g) => {
      const pick = activePicks[g.fixtureId] || g.recommendedPick;
      const marketLabel =
        pick === '1'
          ? 'Home Win'
          : pick === 'X'
          ? 'Draw'
          : pick === '2'
          ? 'Away Win'
          : `Double Chance ${pick}`;
      const odds =
        pick === '1'
          ? g.homeOdds
          : pick === 'X'
          ? g.drawOdds
          : pick === '2'
          ? g.awayOdds
          : Number((Math.min(g.homeOdds, g.awayOdds) * 0.62).toFixed(2));

      return {
        matchId: g.fixtureId,
        match: g.match,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        league: g.league,
        matchDate: g.matchDateIso,
        market: marketLabel,
        odds: Math.max(1.18, odds),
        confidence: Math.max(g.homeProb, g.drawProb, g.awayProb),
      };
    });

    addSelections(batch);
    setIsOpen(true);

    toast({
      title: onlyBankers ? `Loaded ${batch.length} AI Bankers to Bet Slip` : `Loaded ${batch.length} Jackpot Picks to Bet Slip`,
      description: `Open your Bet Slip drawer to review combined odds or generate bookmaker booking codes.`,
    });
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Mega & Midweek Jackpot Predictions Today (17 Games) | PredictPro"
        description="Live AI Mega & Midweek Jackpot predictions for SportPesa 17, Betika 15 & Mozzart 16 games with 1X2 banker picks and Double Chance calculator."
        canonical="/jackpot-predictions"
        keywords="mega jackpot predictions this weekend, midweek jackpot predictions today, sportpesa mega jackpot 17 games analysis, betika jackpot 15 predictions, mozzart super grand jackpot tips, mathematical double chance jackpot combinations"
        jsonLd={faqJsonLd}
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="relative py-10 md:py-14 border-b border-border/60 bg-gradient-to-b from-amber-500/10 via-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500 text-black font-black px-3 py-1">
                  <Trophy className="h-3.5 w-3.5 mr-1.5" /> LIVE JACKPOT INTELLIGENCE HUB
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                  Live API Schedule ({currentPool.length} Real Upcoming Fixtures)
                </Badge>
                {sourcesUsed.length > 0 && (
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    Feeds: {sourcesUsed.map((s) => s.replace('_live', '').toUpperCase()).join(' + ')}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRealJackpotData(true)}
                disabled={refreshing}
                className="min-h-[44px] gap-2 font-bold border-primary/40 hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : 'text-primary'}`} />
                {refreshing ? 'Syncing Live Fixtures...' : 'Sync Live Jackpot Pool'}
              </Button>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight mb-4">
              Official <span className="text-primary">SportPesa &amp; Betika</span> Mega &amp; Midweek Jackpot Predictions
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Synced directly from <strong>SportPesa</strong> and <strong>Betika</strong> official jackpot APIs in exact{' '}
              <strong>#1 to #17 / #15</strong> bookmaker match order. Featuring official 1X2 odds, SMS game IDs,{' '}
              <strong>Bivariate Poisson xG probabilities</strong>, and an interactive{' '}
              <strong>Double Chance (1X/X2/12) Permutation Calculator</strong>.
            </p>

            {/* Provider Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              {(Object.keys(JACKPOT_PROVIDERS) as JackpotProviderId[]).map((key) => {
                const meta = JACKPOT_PROVIDERS[key];
                const poolCount = pools[key]?.length || 0;
                const active = provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProvider(key)}
                    className={`p-4 rounded-xl border text-left transition-all min-h-[88px] ${
                      active
                        ? 'bg-primary/15 border-primary shadow-md ring-1 ring-primary/40'
                        : 'bg-card/80 border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                        <span>{meta.countryFlag}</span> {meta.shortName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {poolCount}/{meta.gameCount} Live
                      </Badge>
                    </div>
                    <p className="text-lg font-black text-foreground">{meta.prizePool}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{meta.bonusTiers}</p>
                  </button>
                );
              })}
            </div>

            {/* Summary KPI Strip + Permutation Cost Calculator */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-card border border-border/60">
                <p className="text-xs text-muted-foreground">Active Pool</p>
                <p className="text-xl font-black text-foreground">{currentPool.length} Live Games</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Real Kickoff Times</p>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border/60">
                <p className="text-xs text-muted-foreground">AI Banker Locks</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{bankerCount} Games</p>
                <p className="text-[11px] text-muted-foreground">&gt;52% Single-Pick Edge</p>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border/60">
                <p className="text-xs text-muted-foreground">Draw / Parity Alerts</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400">{drawAlertCount} Games</p>
                <p className="text-[11px] text-muted-foreground">Prime X / Double Chance</p>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border/60">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-primary" /> Combinations (2^N)
                </p>
                <p className="text-xl font-black text-primary">
                  {permutationStats.combinations} {permutationStats.combinations === 1 ? 'Slip' : 'Slips'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {permutationStats.doubleChanceCount} Double Chance Hedges
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 col-span-2 sm:col-span-1">
                <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold">Estimated Stake</p>
                <p className="text-xl font-black text-amber-900 dark:text-amber-300">
                  {currentMeta.currencySymbol} {permutationStats.totalCost.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Base: {currentMeta.currencySymbol} {currentMeta.baseStake}/slip
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Jackpot Table Section */}
        <section className="py-10 container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> {currentMeta.name} — Live Mathematical Breakdown
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {currentMeta.description}
                {lastSyncedAt && (
                  <span className="ml-2 text-primary font-semibold">
                    · Synced {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={filterMode === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterMode('all')}
                className="min-h-[44px] text-xs font-bold"
              >
                All Games ({currentPool.length})
              </Button>
              <Button
                size="sm"
                variant={filterMode === 'bankers' ? 'default' : 'outline'}
                onClick={() => setFilterMode('bankers')}
                className="min-h-[44px] text-xs font-bold gap-1"
              >
                <Shield className="h-3.5 w-3.5" /> AI Bankers ({bankerCount})
              </Button>
              <Button
                size="sm"
                variant={filterMode === 'draws' ? 'default' : 'outline'}
                onClick={() => setFilterMode('draws')}
                className="min-h-[44px] text-xs font-bold gap-1"
              >
                <Flame className="h-3.5 w-3.5" /> Value Draws ({drawAlertCount})
              </Button>
            </div>
          </div>

          {/* Interactive Strategy Bar */}
          <div className="mb-5 p-4 rounded-xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Interactive Permutation Builder:</span> Click any{' '}
              <code className="px-1.5 py-0.5 rounded bg-background border font-bold text-primary">1 / X / 2 / 1X / X2 / 12</code>{' '}
              button below to customize your slip combinations, or use one-click AI presets:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleApplyAIDoubleChances}
                className="min-h-[42px] text-xs font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
              >
                Apply AI Double Chances (Top 5 Hedges)
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetToSingleSlip}
                className="min-h-[42px] text-xs font-semibold"
              >
                Reset to Single Slip (1x)
              </Button>
              <Button
                size="sm"
                onClick={() => handleLoadToBetSlip(true)}
                className="min-h-[42px] text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Load Bankers to Slip ({bankerCount})
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleLoadToBetSlip(false)}
                className="min-h-[42px] text-xs font-bold gap-1.5"
              >
                <Layers className="h-3.5 w-3.5" /> Load Full Jackpot ({currentPool.length})
              </Button>
            </div>
          </div>

          {loading && currentPool.length === 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-3">#</th>
                    <th className="py-3.5 px-4">Live Fixture & Real Kickoff</th>
                    <th className="py-3.5 px-3 text-center">1X2 Market Odds</th>
                    <th className="py-3.5 px-3 text-center">Poisson 1 / X / 2 %</th>
                    <th className="py-3.5 px-3 text-center">AI Single</th>
                    <th className="py-3.5 px-3 text-center">Interactive Pick / Double Chance</th>
                    <th className="py-3.5 px-3 text-center">xG & Score</th>
                    <th className="py-3.5 px-4">Quantitative Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {filteredGames.map((g) => {
                    const userPick = activePicks[g.fixtureId] || g.recommendedPick;
                    const inBetSlip = slipItems.some((item) => item.matchId === g.fixtureId);

                    return (
                      <tr key={g.fixtureId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-3 font-black text-muted-foreground text-xs">{g.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 mb-1">
                            <TeamLogo team={g.homeTeam} logoUrl={g.homeLogo} size="xs" />
                            <span className="font-bold text-foreground">{g.homeTeam}</span>
                            <span className="text-xs text-muted-foreground font-semibold">vs</span>
                            <TeamLogo team={g.awayTeam} logoUrl={g.awayLogo} size="xs" />
                            <span className="font-bold text-foreground">{g.awayTeam}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {g.smsId && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono font-bold">
                                {g.smsId}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold border-primary/30 text-primary">
                              {g.league}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-medium">{g.kickoff}</span>
                            {g.isBanker && (
                              <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-1.5 font-bold">
                                BANKER LOCK
                              </Badge>
                            )}
                            {g.isValueDraw && (
                              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-bold">
                                DRAW ALERT
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Live 1X2 Odds */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
                            <span className="font-bold text-foreground">{g.homeOdds.toFixed(2)}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-bold text-foreground">{g.drawOdds.toFixed(2)}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-bold text-foreground">{g.awayOdds.toFixed(2)}</span>
                          </div>
                        </td>

                        {/* Probability Distribution */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                            <span className={g.homeProb >= 50 ? 'font-black text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>
                              {g.homeProb}%
                            </span>
                            <span className="text-border">/</span>
                            <span className={g.drawProb >= 30 ? 'font-black text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
                              {g.drawProb}%
                            </span>
                            <span className="text-border">/</span>
                            <span className={g.awayProb >= 50 ? 'font-black text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>
                              {g.awayProb}%
                            </span>
                          </div>
                          <div className="w-28 mx-auto h-1.5 rounded-full bg-muted overflow-hidden flex mt-1.5">
                            <div style={{ width: `${g.homeProb}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${g.drawProb}%` }} className="bg-amber-500" />
                            <div style={{ width: `${g.awayProb}%` }} className="bg-sky-500" />
                          </div>
                        </td>

                        {/* Recommended Single */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-black text-sm ${
                              g.recommendedPick === '1'
                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                                : g.recommendedPick === 'X'
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                                : 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40'
                            }`}
                          >
                            {g.recommendedPick}
                          </span>
                        </td>

                        {/* Interactive 1 / X / 2 / 1X / X2 / 12 Selector */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                            {(['1', 'X', '2', '1X', 'X2', '12'] as JackpotPickOption[]).map((opt) => {
                              const isSelected = userPick === opt;
                              const isAIHedge = g.doubleChance === opt && opt.length === 2;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSelectPick(g.fixtureId, opt)}
                                  title={isAIHedge ? `AI Recommended Double Chance (${opt})` : `Select ${opt} for ${g.match}`}
                                  aria-label={`Select ${opt} for ${g.match}`}
                                  className={`min-h-[36px] min-w-[36px] px-2 py-1 rounded-md text-xs font-extrabold border transition-all ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-105'
                                      : isAIHedge
                                      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                                      : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* xG & Projected Score */}
                        <td className="py-3.5 px-3 text-center">
                          <Badge variant="secondary" className="font-mono font-bold text-xs">
                            {g.scoreline}
                          </Badge>
                          <div className="text-[10px] font-mono text-muted-foreground mt-1">
                            xG: {g.homeXG} - {g.awayXG}
                          </div>
                        </td>

                        {/* Quantitative Rationale + Quick Add */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground leading-relaxed max-w-xs">
                          <p className="line-clamp-2">{g.rationale}</p>
                          {inBetSlip && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                              <Check className="h-3 w-3" /> In Bet Slip
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Mathematical Permutation Strategy Guide */}
        <section className="py-10 bg-muted/20 border-y border-border/60">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" /> How Our AI Builds Winning Jackpot Permutations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 1. Isolate 6–8 Banker Locks
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Never waste double-chance permutations on heavy statistical favorites (&gt;55% win probability). Locking
                  6 to 8 high-certainty bankers keeps your combination cost low while anchoring your jackpot slip.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" /> 2. Attack the Draw Zone (28%–33%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Most jackpot pools include 4 to 6 dead-heat fixtures where Home and Away ELO ratings are within 25
                  points. Deploying <strong>1X</strong> or <strong>X2</strong> double-chance hedges on these specific matches
                  captures the draws that eliminate 90% of public tickets.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> 3. Target Bonus Tiers (13/17 & 14/15)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Using 4 to 5 Double Chance selections (16 to 32 combinations) mathematically maximizes Expected Value
                  (+EV) for hitting the 13/17, 14/17, and 15/17 consolation bonus payouts consistently.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions — Jackpot Predictions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/60 bg-card">
                <h3 className="font-bold text-foreground text-base mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-lg text-foreground">Want Custom Accumulator Slips & Daily Bankers?</h3>
              <p className="text-xs text-muted-foreground">
                Use our AI Smart Slip Generator on the main dashboard to build 3-fold, 5-fold, and 10-fold accas.
              </p>
            </div>
            <Link to="/">
              <Button className="font-bold gap-2 min-h-[44px]">
                Explore Today&apos;s AI Predictions <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
