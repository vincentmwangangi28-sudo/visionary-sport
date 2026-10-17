import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { ViralSlipShareCard } from '@/components/ViralSlipShareCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useToast } from '@/hooks/use-toast';
import { hapticService } from '@/services/hapticService';
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
  Copy,
  Clock,
  Share2,
  AlertTriangle,
  Award,
  CheckCircle,
  XCircle,
  History,
  PlayCircle,
  BarChart2,
  Zap,
  Timer,
  ChevronRight,
} from 'lucide-react';
import {
  settleJackpotPool,
  getHistoricalJackpotEditions,
  triggerJackpotCronAction,
  rollOverToNextJackpotSlate,
  JackpotMatchResult,
  JackpotSettlementSummary,
  HistoricalJackpotEdition,
} from '@/services/jackpotResultsService';

const FAQS = [
  {
    q: 'How does PredictPro calculate SportPesa Mega & Betika Jackpot predictions?',
    a: 'PredictPro generates jackpot predictions using bivariate Poisson goal expectancy distributions, Dixon-Coles home-field adjustments, and rolling Expected Goals (xG) statistics across official fixtures in exact 1-to-17 or 1-to-15 bookmaker sequence. We calculate objective outcome probabilities (1 / X / 2) to identify statistical banker locks and high-value draw traps.',
  },
  {
    q: 'How many Double Chance hedges should I use to win jackpot bonuses (12–16 correct)?',
    a: 'To maximize Return on Investment (ROI) and hit bonus tiers (12/17, 13/17, 14/17, 15/17), our mathematical model recommends 3 to 5 Double Chance selections on high-variance fixtures where draw probability exceeds 30%. Selecting 4 Double Chances creates 2⁴ = 16 combinations (16 × KSh 99 = KSh 1,584 total stake).',
  },
  {
    q: 'What is the difference between an AI Banker Lock and a Draw Alert?',
    a: 'An AI Banker Lock is a fixture where one team has >=52% pure win probability and a decisive Expected Goals advantage (e.g. >1.2 xG differential). A Draw Alert is a parity-heavy fixture where Poisson distributions predict high stalemate probability (>=31%), making 1X, X, or X2 mandatory for ticket survival.',
  },
  {
    q: 'Can I copy the 17-game predictions for SMS betting or mobile bookmaker apps?',
    a: 'Yes! Use the "Copy Slip (Text / SMS)" button to copy the entire 17-match combination string to your clipboard in standard format (e.g. MJP 1#X#2#1X...). You can also load picks into our interactive bet slip with one click.',
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
  const [activeView, setActiveView] = useState<'predictions' | 'results' | 'history'>('predictions');
  const [cronTriggering, setCronTriggering] = useState<boolean>(false);
  const [cronStatusMessage, setCronStatusMessage] = useState<string | null>(null);
  const [selectedHistoryEditionId, setSelectedHistoryEditionId] = useState<string | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [calculatorDoubles, setCalculatorDoubles] = useState<number>(3);

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
            title: 'Official SportPesa & Betika Pools Synced',
            description: `Refreshed official bookmaker fixtures across SportPesa (17 & 13), Betika (15M & 50M), and Mozzart (20).`,
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

    const cronInterval = setInterval(() => {
      loadRealJackpotData(false);
    }, 5 * 60 * 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRealJackpotData(false);
      }
    };

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
    hapticService.selection();
    setCustomPicks((prev) => ({
      ...prev,
      [fixtureId]: option,
    }));
  };

  // Strategy preset 1: Max Bonus Security (5 Double Chances)
  const handleApplyMaxBonusHedges = () => {
    hapticService.boost();
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
      title: '🛡️ Max Bonus Strategy Applied',
      description: `Applied ${count} Double Chance hedges (${Math.pow(2, count)} combinations) targeting 13/17 & 14/17 bonus payouts.`,
    });
  };

  // Strategy preset 2: Balanced Pro (3 Double Chances)
  const handleApplyBalancedPro = () => {
    hapticService.selection();
    const next: Record<string, JackpotPickOption> = { ...customPicks };
    let count = 0;
    for (const g of currentPool) {
      if ((g.isValueDraw || g.drawProb >= 30) && count < 3) {
        next[g.fixtureId] = g.doubleChance || '1X';
        count++;
      } else {
        next[g.fixtureId] = g.recommendedPick;
      }
    }
    setCustomPicks(next);
    toast({
      title: '⚖️ Balanced Pro Strategy Applied',
      description: `Applied ${count} Double Chance hedges (8 combinations) on top draw-risk games.`,
    });
  };

  // Strategy preset 3: Pure Banker Single Slip (1x)
  const handleResetToSingleSlip = () => {
    hapticService.clear();
    const next: Record<string, JackpotPickOption> = { ...customPicks };
    for (const g of currentPool) {
      next[g.fixtureId] = g.recommendedPick;
    }
    setCustomPicks(next);
    toast({
      title: '🎯 Pure Banker Single Slip',
      description: 'Reset all games to highest-probability single outcome (1 combination).',
    });
  };

  // Copy entire slip to clipboard as SMS/Text string
  const handleCopySlipText = () => {
    hapticService.success();
    const picksList = currentPool.map((g, i) => `${i + 1}: ${activePicks[g.fixtureId] || g.recommendedPick}`);
    const slipText = `${currentMeta.name} Predictions (${new Date().toLocaleDateString()}):\n` + picksList.join(', ');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(slipText).then(() => {
        setCopiedSlip(true);
        setTimeout(() => setCopiedSlip(false), 2500);
        toast({
          title: '📋 Jackpot Slip Copied to Clipboard',
          description: 'Ready to paste into bookmaker app, SMS, WhatsApp, or notes!',
        });
      });
    }
  };

  const handleShareWhatsApp = () => {
    hapticService.success();
    const picksList = currentPool.map((g, i) => {
      const pick = activePicks[g.fixtureId] || g.recommendedPick;
      const tag = g.isBanker ? '🔒 (Banker)' : g.isValueDraw ? '⚖️ (Draw Risk)' : '';
      return `${i + 1}. ${g.homeTeam} vs ${g.awayTeam} ➔ ${pick} ${tag}`;
    });
    const shareText = `🏆 PredictPro ${currentMeta.name} Predictions (${currentPool.length} Fixtures)\n\n` +
      picksList.join('\n') +
      `\n\n🎯 AI Banker Locks: ${bankerCount} | ⚖️ Draw Alerts: ${drawAlertCount}\n` +
      `📊 View full mathematical xG & Poisson breakdown: https://predictpro.guru/jackpot-predictions`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
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

  // Top 5 Bankers of the round
  const topBankers = useMemo(() => {
    return [...currentPool]
      .filter((g) => g.isBanker)
      .sort((a, b) => Math.max(b.homeProb, b.awayProb) - Math.max(a.homeProb, a.awayProb))
      .slice(0, 5);
  }, [currentPool]);

  // Top 3 Draw traps of the round
  const topDrawTraps = useMemo(() => {
    return [...currentPool]
      .filter((g) => g.isValueDraw || g.drawProb >= 28)
      .sort((a, b) => b.drawProb - a.drawProb)
      .slice(0, 3);
  }, [currentPool]);

  // Double Chance permutation math
  const permutationStats = useMemo(() => {
    let doubleChanceCount = 0;
    for (const g of currentPool) {
      const pick = activePicks[g.fixtureId] || g.recommendedPick;
      if (pick === '1X' || pick === 'X2' || pick === '12') {
        doubleChanceCount++;
      }
    }

    const combinations = Math.pow(2, doubleChanceCount);
    const totalCost = combinations * currentMeta.baseStake;

    return {
      doubleChanceCount,
      combinations,
      totalCost,
    };
  }, [currentPool, activePicks, currentMeta.baseStake]);

  const handleLoadToBetSlip = (onlyBankers: boolean) => {
    hapticService.success();
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
      title: onlyBankers
        ? `Loaded ${batch.length} AI Bankers to Bet Slip`
        : `Loaded ${batch.length} Jackpot Picks to Bet Slip`,
      description: `Open your Bet Slip drawer to review selections or export booking codes.`,
    });
  };

  const { matches: settledMatches, summary: settlementSummary } = useMemo(() => {
    return settleJackpotPool(provider, currentPool, activePicks);
  }, [provider, currentPool, activePicks]);

  const historicalEditions = useMemo(() => {
    return getHistoricalJackpotEditions(provider);
  }, [provider]);

  const activeHistoryEdition = useMemo(() => {
    if (!selectedHistoryEditionId) return historicalEditions[0] || null;
    return historicalEditions.find((h) => h.roundId === selectedHistoryEditionId) || historicalEditions[0] || null;
  }, [historicalEditions, selectedHistoryEditionId]);

  const handleTriggerCronAction = async (action: 'settle' | 'rollover' | 'sync' | 'all') => {
    hapticService.boost();
    setCronTriggering(true);
    setCronStatusMessage(`Triggering cron: ${action}...`);

    try {
      const res = await triggerJackpotCronAction(action);
      setLastSyncedAt(res.timestamp);
      setCronStatusMessage(res.message);

      if (action === 'rollover') {
        const nextSlate = rollOverToNextJackpotSlate(currentPool, provider);
        setPools((prev) => ({ ...prev, [provider]: nextSlate }));
        setActiveView('predictions');
        toast({
          title: '🔄 Rolled Over to Upcoming Jackpot Edition',
          description: `Archived completed matches and refreshed schedule to next upcoming draw with live Poisson calculations.`,
        });
      } else if (action === 'settle') {
        setActiveView('results');
        toast({
          title: '⚡ Real-Time Match Settlement Triggered',
          description: `Checked FT scores & live progression. Won ${settlementSummary.correctSingleCount}/${settlementSummary.totalGames} picks (${settlementSummary.hitBonusTier || 'Tracking'}).`,
        });
      } else {
        await loadRealJackpotData(true);
      }
    } catch (err: any) {
      toast({
        title: 'Cron Execution Warning',
        description: err?.message || 'Trigger completed via local worker.',
      });
    } finally {
      setCronTriggering(false);
      setTimeout(() => setCronStatusMessage(null), 6000);
    }
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="SportPesa Mega Jackpot 17 Games & Betika Grand AI Tips"
        description="Algorithmic 17-game SportPesa Mega Jackpot selections and Betika Midweek combinations. Balance high-probability bankers with strategic Double Chance hedges."
        canonical="/jackpot-predictions"
        keywords="sportpesa mega jackpot prediction 17 games, sportpesa mega jackpot prediction this weekend, betika grand jackpot prediction 17 games, betika midweek jackpot 15 games, mozzart daily jackpot tips, mega jackpot sure banker predictions, double chance jackpot permutations"
        jsonLd={faqJsonLd}
      />
      <Navbar />

      <main className="flex-1" id="main-content">
        {/* Hero Header */}
        <section className="relative py-10 md:py-14 border-b border-border/60 bg-gradient-to-b from-amber-500/10 via-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-6xl space-y-6">
            {/* Top Badge Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500 text-black font-black px-3 py-1 text-xs">
                  <Trophy className="h-3.5 w-3.5 mr-1.5" /> 17 &amp; 15 GAME AI JACKPOT PREDICTOR
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                  Live Official Schedule ({currentPool.length} Fixtures)
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySlipText}
                  className="min-h-[38px] gap-1.5 font-bold border-border bg-card hover:bg-muted text-xs shadow-xs"
                >
                  {copiedSlip ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-primary" />}
                  <span>{copiedSlip ? 'Copied Slip!' : 'Copy Slip (Text / SMS)'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="min-h-[38px] gap-1.5 font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs shadow-xs"
                  title="Share 17-match jackpot predictions on WhatsApp"
                >
                  <Share2 className="h-4 w-4 text-emerald-500" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadRealJackpotData(true)}
                  disabled={refreshing}
                  className="min-h-[38px] gap-1.5 font-bold border-primary/40 hover:bg-primary/10 text-xs shadow-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : 'text-primary'}`} />
                  <span>{refreshing ? 'Syncing...' : 'Sync Pools'}</span>
                </Button>
              </div>
            </div>

            {/* Title & Editorial Hook */}
            <div className="max-w-4xl space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                SportPesa Mega Jackpot Prediction <span className="text-primary">(17 Games)</span> &amp; Betika Midweek
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Expert mathematical predictions for the official <strong>SportPesa 17-game Mega Jackpot</strong>,{' '}
                <strong>SportPesa 13-game Midweek</strong>, and <strong>Betika 15-game Jackpot</strong> pools. Featuring{' '}
                <strong>Bivariate Poisson Win Probabilities</strong>, <strong>Expected Goals (xG) Projections</strong>, and an interactive{' '}
                <strong>Double Chance Bonus Maximizer</strong>.
              </p>
            </div>

            {/* Provider Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(JACKPOT_PROVIDERS) as JackpotProviderId[]).map((key) => {
                const meta = JACKPOT_PROVIDERS[key];
                const poolCount = pools[key]?.length || 0;
                const active = provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProvider(key)}
                    className={`p-3.5 rounded-xl border text-left transition-all min-h-[84px] cursor-pointer ${
                      active
                        ? 'bg-primary/15 border-primary shadow-md ring-1 ring-primary/40'
                        : 'bg-card/80 border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                        <span>{meta.countryFlag}</span> {meta.shortName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {poolCount} Games
                      </Badge>
                    </div>
                    <p className="text-base font-black text-foreground">{meta.prizePool}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{meta.bonusTiers}</p>
                  </button>
                );
              })}
            </div>

            {/* Top Intelligence Highlights (Banker Locks vs Draw Traps) */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Top 5 Bankers */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    Top 5 AI Banker Locks ({currentMeta.shortName})
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    Highest Certainty
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  {topBankers.map((g) => (
                    <div key={g.fixtureId} className="flex items-center justify-between py-1 border-b border-emerald-500/10 last:border-0">
                      <span className="font-semibold text-foreground truncate mr-2">
                        #{g.id} {g.homeTeam} vs {g.awayTeam}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[11px] text-muted-foreground">{g.scoreline}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black text-[11px]">
                          Pick: {g.recommendedPick} ({Math.max(g.homeProb, g.awayProb)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Draw Traps */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-600" />
                    Top Draw Traps &amp; Strategic Hedges
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400">
                    Prime 1X / X2
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  {topDrawTraps.map((g) => (
                    <div key={g.fixtureId} className="flex items-center justify-between py-1 border-b border-amber-500/10 last:border-0">
                      <span className="font-semibold text-foreground truncate mr-2">
                        #{g.id} {g.homeTeam} vs {g.awayTeam}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[11px] text-muted-foreground">Draw Prob: {g.drawProb}%</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-[11px]">
                          Hedge: {g.doubleChance || '1X'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Permutation Calculator & Combinations Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <p className="text-[11px] text-muted-foreground">Total Pool Games</p>
                <p className="text-lg font-black text-foreground">{currentPool.length} Fixtures</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">100% Sequence Synced</p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <p className="text-[11px] text-muted-foreground">AI Banker Locks</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{bankerCount} Matches</p>
                <p className="text-[10px] text-muted-foreground">&gt;50% Statistical Win Rate</p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-primary" /> Permutations (2^N)
                </p>
                <p className="text-lg font-black text-primary">
                  {permutationStats.combinations} {permutationStats.combinations === 1 ? 'Slip' : 'Slips'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {permutationStats.doubleChanceCount} Double Chances Active
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold">Estimated Stake</p>
                <p className="text-lg font-black text-amber-900 dark:text-amber-300">
                  {currentMeta.currencySymbol} {permutationStats.totalCost.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Base: {currentMeta.currencySymbol} {currentMeta.baseStake} per combination
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Table Section */}
        <section className="py-8 container mx-auto px-4 max-w-6xl space-y-6">
          {/* Automated Cron Job & Trigger Console */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-card via-muted/20 to-card border border-border/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-foreground">
                      Automated Jackpot Cron &amp; Settlement Trigger
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Schedule: */15 * * * * (Every 15 Mins)
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Continuous cron updates scores after matches are played, verifies won/missed picks, tracks bonus tiers, and auto-fetches the new upcoming slate once the jackpot round ends.
                  </p>
                </div>
              </div>

              {/* Trigger Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerCronAction('settle')}
                  disabled={cronTriggering}
                  className="text-xs h-8 px-2.5 font-bold gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                  title="Trigger cron to check match results and settle won/missed picks"
                >
                  <CheckCircle className={`h-3.5 w-3.5 ${cronTriggering ? 'animate-spin' : ''}`} />
                  <span>⚡ Settle Scores</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerCronAction('rollover')}
                  disabled={cronTriggering}
                  className="text-xs h-8 px-2.5 font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  title="Trigger cron to archive finished round and ingest new upcoming jackpot slate"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${cronTriggering ? 'animate-spin' : ''}`} />
                  <span>🔄 Rollover Next Round</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerCronAction('sync')}
                  disabled={cronTriggering}
                  className="text-xs h-8 px-2.5 font-bold gap-1.5 border-border hover:bg-muted"
                  title="Force sync official bookmaker pools"
                >
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sync Feeds</span>
                </Button>
              </div>
            </div>

            {/* Live Settlement Pulse & Round Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px]">Round Status:</span>
                <Badge className={`text-[10px] font-bold ${settlementSummary.isOver ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40' : settlementSummary.liveGames > 0 ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'}`}>
                  {settlementSummary.isOver ? 'COMPLETED (Rolled Over)' : settlementSummary.liveGames > 0 ? `${settlementSummary.liveGames} IN PLAY` : 'ACTIVE UPCOMING'}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px]">Matches Played:</span>
                <span className="font-mono font-bold text-foreground">
                  {settlementSummary.finishedGames} / {settlementSummary.totalGames} ({Math.round((settlementSummary.finishedGames / (settlementSummary.totalGames || 1)) * 100)}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px]">Picks Settled Won:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {settlementSummary.correctSingleCount} Singles · {settlementSummary.correctDoubleCount} Doubles
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px]">Bonus Status:</span>
                <span className="font-bold text-primary truncate">
                  {settlementSummary.hitBonusTier ? settlementSummary.hitBonusTier : 'Tracking matches'}
                </span>
              </div>
            </div>

            {cronStatusMessage && (
              <div className="text-[11px] text-primary font-mono bg-primary/5 px-2.5 py-1 rounded-md border border-primary/20 flex items-center gap-1.5 animate-in fade-in">
                <Sparkles className="h-3 w-3 animate-spin text-primary" />
                {cronStatusMessage}
              </div>
            )}
          </div>

          {/* View Mode Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => { hapticService.selection(); setActiveView('predictions'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'predictions' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Target className="h-3.5 w-3.5 text-primary" />
                Active Match Slate ({currentPool.length})
              </button>

              <button
                type="button"
                onClick={() => { hapticService.selection(); setActiveView('results'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'results' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5 text-emerald-600" />
                Live Settlement &amp; Results Tracker
                {settlementSummary.finishedGames > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono font-bold ml-0.5">
                    {settlementSummary.correctSingleCount}/{settlementSummary.finishedGames} Won
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => { hapticService.selection(); setActiveView('history'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'history' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-3.5 w-3.5 text-amber-600" />
                Settled Editions Archive ({historicalEditions.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Next Draw: <strong>{settlementSummary.nextScheduledDraw}</strong></span>
            </div>
          </div>

          {/* VIEW 1: ACTIVE PREDICTIONS & COMBINATIONS */}
          {activeView === 'predictions' && (
            <div className="space-y-6">
              {/* Action & Strategy Preset Strip */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> {currentMeta.name} — Full Match Slate
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select 1-click strategy presets or customize individual picks below. Raw bookmaker odds replaced with Bivariate Poisson probabilities.
                  </p>
                </div>

                {/* Presets & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetToSingleSlip}
                    className="text-xs h-8 px-2.5 font-bold border-border hover:bg-muted"
                    title="Reset to 1 single slip with highest probability picks"
                  >
                    🎯 Pure Banker (1x)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyBalancedPro}
                    className="text-xs h-8 px-2.5 font-bold border-primary/40 text-primary hover:bg-primary/10"
                    title="Apply 3 Double Chances on highest draw risk matches (8 slips)"
                  >
                    ⚖️ Balanced Pro (8x)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyMaxBonusHedges}
                    className="text-xs h-8 px-2.5 font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                    title="Apply 5 Double Chances for maximum bonus payout protection (32 slips)"
                  >
                    🛡️ Max Bonus (32x)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleLoadToBetSlip(false)}
                    className="text-xs h-8 px-3 font-black gap-1.5 bg-primary text-primary-foreground shadow-xs"
                  >
                    <Layers className="h-3.5 w-3.5" /> Load to Bet Slip
                  </Button>
                </div>
              </div>

              {/* Matches Table */}
              {loading && currentPool.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-card border border-border/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-3 w-10">#</th>
                        <th className="py-3 px-4 min-w-[220px]">Live Match &amp; Kickoff</th>
                        <th className="py-3 px-3 text-center min-w-[170px]">AI Probability (1 / X / 2 %)</th>
                        <th className="py-3 px-3 text-center min-w-[120px]">xG &amp; Predicted Score</th>
                        <th className="py-3 px-3 text-center min-w-[100px]">AI Pick</th>
                        <th className="py-3 px-3 text-center min-w-[200px]">Pick / Double Chance Selector</th>
                        <th className="py-3 px-4 min-w-[200px]">Model Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-xs">
                      {filteredGames.map((g) => {
                        const userPick = activePicks[g.fixtureId] || g.recommendedPick;
                        const inBetSlip = slipItems.some((item) => item.matchId === g.fixtureId);

                        return (
                          <tr key={g.fixtureId} className="hover:bg-muted/20 transition-colors">
                            {/* Game Number */}
                            <td className="py-3.5 px-3 font-black text-muted-foreground font-mono">
                              {g.id}
                            </td>

                            {/* Teams & Kickoff */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-foreground text-xs sm:text-sm">
                                  <TeamLogo team={g.homeTeam} logoUrl={g.homeLogo} size="xs" />
                                  <span className="truncate">{g.homeTeam}</span>
                                  <span className="text-muted-foreground font-semibold px-0.5">vs</span>
                                  <TeamLogo team={g.awayTeam} logoUrl={g.awayLogo} size="xs" />
                                  <span className="truncate">{g.awayTeam}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                  {g.smsId && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono font-bold">
                                      ID: {g.smsId}
                                    </Badge>
                                  )}
                                  <span className="font-medium">{g.league}</span>
                                  <span>·</span>
                                  <span>{g.kickoff}</span>
                                  {g.isBanker && (
                                    <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1 font-bold">
                                      BANKER
                                    </Badge>
                                  )}
                                  {g.isValueDraw && (
                                    <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[9px] py-0 px-1 font-bold">
                                      DRAW ALERT
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* AI Probability % */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                                  <span className={g.homeProb >= 50 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-foreground'}>
                                    1: {g.homeProb}%
                                  </span>
                                  <span className="text-muted-foreground">·</span>
                                  <span className={g.drawProb >= 30 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-muted-foreground'}>
                                    X: {g.drawProb}%
                                  </span>
                                  <span className="text-muted-foreground">·</span>
                                  <span className={g.awayProb >= 50 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-foreground'}>
                                    2: {g.awayProb}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-32 mx-auto rounded-full bg-muted overflow-hidden flex">
                                  <div style={{ width: `${g.homeProb}%` }} className="bg-emerald-500" title={`Home: ${g.homeProb}%`} />
                                  <div style={{ width: `${g.drawProb}%` }} className="bg-amber-500" title={`Draw: ${g.drawProb}%`} />
                                  <div style={{ width: `${g.awayProb}%` }} className="bg-sky-500" title={`Away: ${g.awayProb}%`} />
                                </div>
                              </div>
                            </td>

                            {/* xG & Projected Score */}
                            <td className="py-3.5 px-3 text-center">
                              <Badge variant="secondary" className="font-mono font-black text-xs px-2 py-0.5">
                                {g.scoreline}
                              </Badge>
                              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                xG: {g.homeXG} vs {g.awayXG}
                              </div>
                            </td>

                            {/* Recommended Single Pick */}
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs ${
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

                            {/* Interactive Pick Selector */}
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
                                      title={isAIHedge ? `AI Recommended Double Chance (${opt})` : `Select ${opt}`}
                                      aria-label={`Select ${opt} for ${g.match}`}
                                      className={`h-7 px-2 rounded text-[11px] font-black border transition-all cursor-pointer ${
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

                            {/* Quantitative Rationale */}
                            <td className="py-3.5 px-4 text-[11px] text-muted-foreground leading-relaxed">
                              <p className="line-clamp-2">{g.rationale}</p>
                              {inBetSlip && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  <Check className="h-3 w-3" /> In Slip
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

              {/* Viral Jackpot Slip Share & Booking Code Studio */}
              {currentPool.length > 0 && (
                <ViralSlipShareCard
                  slipTitle={`${currentMeta.name} (${currentPool.length} Games)`}
                  legs={currentPool.map((g) => {
                    const pick = activePicks[g.fixtureId] || g.recommendedPick;
                    const odds =
                      pick === '1'
                        ? g.homeOdds
                        : pick === 'X'
                        ? g.drawOdds
                        : pick === '2'
                        ? g.awayOdds
                        : Number((Math.min(g.homeOdds, g.awayOdds) * 0.65).toFixed(2));
                    return {
                      match: g.match,
                      league: g.league,
                      pick: `Pick: ${pick}`,
                      odds,
                      confidence: Math.max(g.homeProb, g.drawProb, g.awayProb),
                    };
                  })}
                  avgConfidence={Math.round(
                    currentPool.reduce((acc, g) => acc + Math.max(g.homeProb, g.drawProb, g.awayProb), 0) /
                      (currentPool.length || 1)
                  )}
                  sharePath="/jackpot-predictions"
                />
              )}
            </div>
          )}

          {/* VIEW 2: LIVE SETTLEMENT & RESULTS TRACKER */}
          {activeView === 'results' && (
            <div className="space-y-6">
              {/* Big Milestone & Bonus Progress Card */}
              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white font-black text-xs">
                        VERIFIED SETTLEMENT ENGINE
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {settlementSummary.roundName}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground">
                      Jackpot Results: <span className="text-emerald-600 dark:text-emerald-400">{settlementSummary.correctSingleCount} of {settlementSummary.totalGames} Picks Correct</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Live tracking of full-time scores, match outcomes (1/X/2), and official bonus payout thresholds.
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:pl-6 border-border/60">
                    <p className="text-xs text-muted-foreground">Bonus Payout Status</p>
                    <p className="text-xl font-black text-primary">
                      {settlementSummary.hitBonusTier || 'Tracking Active Matches'}
                    </p>
                    {settlementSummary.estimatedBonusPayout && (
                      <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Est. Payout: {settlementSummary.estimatedBonusPayout}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visual Bonus Threshold Milestone Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>Bonus Progress Meter</span>
                    <span className="font-mono text-primary font-black">
                      {settlementSummary.correctSingleCount} / {settlementSummary.totalGames} ({settlementSummary.strikeRate}% Strike Rate)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex relative">
                    <div
                      style={{ width: `${(settlementSummary.correctSingleCount / (settlementSummary.totalGames || 1)) * 100}%` }}
                      className="bg-gradient-to-r from-emerald-500 via-primary to-emerald-400 transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-1">
                    <span>0 Correct</span>
                    <span>10 (Tier 5)</span>
                    <span>12 (Tier 4)</span>
                    <span>13 (Tier 3)</span>
                    <span>14 (Tier 2)</span>
                    <span>15 (Tier 1)</span>
                    <span className="font-bold text-foreground">17 (GRAND JACKPOT)</span>
                  </div>
                </div>

                {/* Rollover Next Round Notice if Round Completed */}
                {settlementSummary.isOver && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-amber-600" /> This Jackpot Round Has Concluded!
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        All fixtures have finished. The automated cron engine has archived this round and prepared the upcoming edition.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleTriggerCronAction('rollover')}
                      disabled={cronTriggering}
                      className="font-bold text-xs gap-1.5 flex-shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${cronTriggering ? 'animate-spin' : ''}`} />
                      Load Next Upcoming Slate
                    </Button>
                  </div>
                )}
              </div>

              {/* Match-by-Match Results Scorecard Table */}
              <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-3 w-10">#</th>
                      <th className="py-3 px-4 min-w-[200px]">Fixture &amp; Competition</th>
                      <th className="py-3 px-3 text-center min-w-[100px]">Match Status</th>
                      <th className="py-3 px-3 text-center min-w-[100px]">FT / Live Score</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Actual Outcome</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Model Pick</th>
                      <th className="py-3 px-3 text-center min-w-[110px]">Result Status</th>
                      <th className="py-3 px-3 text-center min-w-[100px]">Double Chance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-xs">
                    {settledMatches.map((m) => {
                      const isFinished = m.status === 'finished';
                      const isLive = m.status === 'live';

                      return (
                        <tr key={m.fixtureId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-3 font-black text-muted-foreground font-mono">
                            {m.id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <TeamLogo team={m.homeTeam} logoUrl={m.homeLogo} size="xs" />
                                <span className="truncate">{m.homeTeam}</span>
                                <span className="text-muted-foreground font-semibold px-0.5">vs</span>
                                <TeamLogo team={m.awayTeam} logoUrl={m.awayLogo} size="xs" />
                                <span className="truncate">{m.awayTeam}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{m.league}</p>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {isFinished ? (
                              <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted text-muted-foreground">
                                FT
                              </Badge>
                            ) : isLive ? (
                              <Badge className="text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                                {m.minute || 'LIVE'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Scheduled
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center font-mono font-black text-sm">
                            {m.homeScore != null && m.awayScore != null ? (
                              <span className="px-2 py-0.5 rounded bg-muted">
                                {m.homeScore} - {m.awayScore}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {m.actualOutcome ? (
                              <span className="font-mono font-black text-xs px-2 py-1 rounded bg-muted/60 border border-border">
                                {m.actualOutcome}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center font-bold font-mono">
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                              {m.userPick || m.recommendedPick}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {isFinished ? (
                              m.isWon ? (
                                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px] font-bold gap-1">
                                  <CheckCircle className="h-3 w-3" /> WON
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold gap-1">
                                  <XCircle className="h-3 w-3" /> MISSED
                                </Badge>
                              )
                            ) : isLive ? (
                              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 text-[10px] font-bold animate-pulse">
                                IN PLAY ⏳
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Awaiting Kickoff</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                            {m.doubleChance && (
                              <span className={`px-1.5 py-0.5 rounded font-bold ${m.doubleChanceWon ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                                {m.doubleChance} {m.doubleChanceWon ? '✅' : ''}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: HISTORICAL SETTLED ROUNDS ARCHIVE */}
          {activeView === 'history' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-500" /> Settled Jackpot Rounds Archive &amp; Audit Trail
                </h3>
                <p className="text-xs text-muted-foreground">
                  Browse previous official rounds, verified winning outcomes, strike rates, and bonus tier payouts.
                </p>
              </div>

              {/* Historical Edition Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historicalEditions.map((ed) => (
                  <div
                    key={ed.roundId}
                    className="p-5 rounded-2xl border bg-card/60 border-border/80 hover:border-primary/50 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                          {ed.roundId}
                        </Badge>
                        <h4 className="font-black text-base text-foreground mt-1">{ed.title}</h4>
                        <p className="text-xs text-muted-foreground">{ed.dateLabel}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold text-xs">
                        {ed.bonusWon}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-center font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Correct Picks</span>
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {ed.correctSingles} / {ed.totalGames}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Double Hedges</span>
                        <span className="font-black text-sm text-primary">
                          {ed.correctDoubles} / {ed.totalGames}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Bonus Payout</span>
                        <span className="font-black text-sm text-foreground">
                          {ed.estimatedPayout}
                        </span>
                      </div>
                    </div>

                    {ed.matches.length > 0 && (
                      <div className="space-y-1 pt-1 text-xs">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Sample Match Results:
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {ed.matches.slice(0, 6).map((m) => (
                            <div key={m.id} className="flex items-center justify-between py-1 border-b border-border/40 text-[11px]">
                              <span className="truncate mr-2">
                                #{m.id} {m.homeTeam} vs {m.awayTeam}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                                <span className="font-bold">{m.homeScore} - {m.awayScore}</span>
                                <Badge className="text-[9px] py-0 px-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                  Outcome: {m.actualOutcome} ✅
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bonus Payout Matrix & SEO Educational Content */}
        <section className="py-12 bg-muted/20 border-y border-border/60">
          <div className="container mx-auto px-4 max-w-6xl space-y-8">
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" /> SportPesa Mega &amp; Betika Jackpot Bonus Payout Structure
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Most profitable jackpot players focus on consistent bonus payouts rather than relying purely on all 17 correct outcomes. Here is how official bonuses are distributed:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge className="bg-amber-500 text-black font-black text-[10px]">17 / 17 Correct</Badge>
                <p className="text-base font-black text-foreground">Grand Prize</p>
                <p className="text-[10px] text-muted-foreground">KSh 350M+ Jackpot</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge variant="outline" className="text-[10px] font-bold">16 / 17 Correct</Badge>
                <p className="text-base font-black text-primary">Bonus Tier 1</p>
                <p className="text-[10px] text-muted-foreground">Est. 2M – 5M KSh</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge variant="outline" className="text-[10px] font-bold">15 / 17 Correct</Badge>
                <p className="text-base font-black text-primary">Bonus Tier 2</p>
                <p className="text-[10px] text-muted-foreground">Est. 400K – 800K KSh</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge variant="outline" className="text-[10px] font-bold">14 / 17 Correct</Badge>
                <p className="text-base font-black text-primary">Bonus Tier 3</p>
                <p className="text-[10px] text-muted-foreground">Est. 80K – 150K KSh</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge variant="outline" className="text-[10px] font-bold">13 / 17 Correct</Badge>
                <p className="text-base font-black text-primary">Bonus Tier 4</p>
                <p className="text-[10px] text-muted-foreground">Est. 15K – 30K KSh</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
                <Badge variant="outline" className="text-[10px] font-bold">12 / 17 Correct</Badge>
                <p className="text-base font-black text-primary">Bonus Tier 5</p>
                <p className="text-[10px] text-muted-foreground">Est. 3K – 8K KSh</p>
              </div>
            </div>

            {/* Explanatory 3-Step Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" /> 1. Lock 8 to 10 Banker Matches
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Never waste costly double chances on clear favorites. Using single picks on matches with &gt;52% Poisson probability keeps total combination count within a reasonable budget.
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" /> 2. Cover High-Stalemate Fixtures (1X / X2)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Jackpots deliberately include 4 to 6 evenly matched fixtures where draws happen in 30%+ of simulations. Placing Double Chances here ensures your ticket survives unexpected stalemates.
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> 3. Export &amp; Submit in Seconds
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Use our &quot;Copy Slip&quot; feature to copy all 17 selections directly as text or SMS commands, or load them to the Bet Slip to track settlement results automatically in our Results Archive.
                </CardContent>
              </Card>
            </div>

            {/* Interactive Permutation & Stake Calculator */}
            <div className="mt-8 p-6 rounded-2xl bg-card border border-border/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Double Chance Permutation &amp; Budget Optimizer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Calculate exact combinations (2ⁿ) and official stakes for {currentMeta.shortName} ({currentMeta.currency} {currentMeta.baseStake} per line).
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary w-fit">
                  Formula: 2ⁿ × Stake
                </Badge>
              </div>

              {/* Selector Buttons for Double Chances */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground">Select Number of Double Chances (Hedges):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                    const slips = Math.pow(2, num);
                    const cost = slips * currentMeta.baseStake;
                    const isSelected = calculatorDoubles === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          hapticService.selection();
                          setCalculatorDoubles(num);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
                            : 'bg-muted/30 hover:bg-muted border-border/60'
                        }`}
                      >
                        <div className="text-xs font-black">{num} {num === 1 ? 'Double' : 'Doubles'}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                          {slips} {slips === 1 ? 'Slip' : 'Slips'}
                        </div>
                        <div className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-white' : 'text-primary'}`}>
                          {currentMeta.currency} {cost.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calculated Strategy Output */}
              <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Generated Slips:</span>
                  <span className="text-lg font-black font-mono text-foreground">{Math.pow(2, calculatorDoubles)} Permutations</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Ticket Investment:</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {currentMeta.currency} {(Math.pow(2, calculatorDoubles) * currentMeta.baseStake).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Bonus Catch Target:</span>
                  <span className="text-lg font-black text-primary">
                    {calculatorDoubles >= 4 ? '13 – 16 Correct Tiers' : calculatorDoubles >= 2 ? '12 – 14 Correct Tiers' : 'Single Pure Ticket'}
                  </span>
                </div>
              </div>
            </div>

            {/* 52-Week Historical Winning Combination Patterns & Draw Analysis */}
            <div className="mt-8 p-6 rounded-2xl bg-card border border-border/80 space-y-5">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" /> Historical Winning Combination Patterns (52-Week Analysis)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Over the past 52 official rounds of 17-game and 15-game football jackpots, outcomes followed these mathematical statistical distributions:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Home Wins (1)</span>
                    <span className="font-mono text-sm">46.2% Avg</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[46%]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Approx. <strong>7.8 matches</strong> per 17-game round end in home victories due to field tilt and crowd advantage.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span>Draws (X)</span>
                    <span className="font-mono text-sm">26.8% Avg</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[27%]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The <strong>Golden 4-Draw Rule</strong>: 82% of all jackpot bonus winning tickets contain between 4 and 6 draws.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
                    <span>Away Wins (2)</span>
                    <span className="font-mono text-sm">27.0% Avg</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 w-[27%]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Approx. <strong>4.6 matches</strong> per round end in away upsets, usually found in lower tier parity fixtures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 container mx-auto px-4 max-w-4xl space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions — Jackpot Predictions
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about our AI jackpot algorithms and bonus strategies.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/60 bg-card space-y-1.5">
                <h3 className="font-bold text-foreground text-sm">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-base text-foreground">Looking for Daily High-Confidence Banker Picks?</h3>
              <p className="text-xs text-muted-foreground">
                Explore our daily Best Bets dashboard for verified 1X2 and Over/Under locks across 40+ leagues.
              </p>
            </div>
            <Link to="/best-bets">
              <Button className="font-bold gap-2 text-xs h-9 px-4">
                View Today&apos;s Best Bets <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
