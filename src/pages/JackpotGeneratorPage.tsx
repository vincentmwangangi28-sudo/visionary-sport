import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  CheckCircle2,
  Copy,
  Layers,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import {
  getAdminJackpotOverrides,
  recordAffiliatePartnerClick,
} from '@/services/adminOverrideSyncService';
import {
  fetchLiveJackpotPools,
  getInitialOfficialJackpotPools,
  buildUpcomingJackpotPoolFromEspn,
  computeJackpotSurvivalProfile,
  optimizeJackpotPicksForBudget,
  generatePlayableSingleLines,
  formatJackpotSmsText,
  getPickOutcomes,
  JACKPOT_PROVIDERS,
  JackpotProviderId,
  JackpotExtendedPick,
} from '@/services/jackpotService';
import { settleJackpotPool } from '@/services/jackpotResultsService';
import { toast } from 'sonner';

type SinglePick = '1' | 'X' | '2';

const GENERATOR_PROVIDERS: Array<{
  id: JackpotProviderId;
  bookingPrefix: string;
}> = [
  { id: 'sportpesa', bookingPrefix: 'SPMJ' },
  { id: 'betika_grand', bookingPrefix: 'BTKG' },
  { id: 'mozzart', bookingPrefix: 'MZJP' },
  { id: 'sportpesa_midweek', bookingPrefix: 'SPMW' },
  { id: 'betika', bookingPrefix: 'BTKM' },
];

const MAX_HEDGED_GAMES = 6; // 2^6 = 64 max lines for clean interactive preview

function parseSelectedProviderParam(raw: string | null): JackpotProviderId {
  if (
    raw === 'sportpesa' ||
    raw === 'betika' ||
    raw === 'betika_grand' ||
    raw === 'sportpesa_midweek' ||
    raw === 'mozzart'
  ) {
    return raw;
  }
  return 'sportpesa';
}

export const JackpotGeneratorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addSelection } = useBetSlip();
  const { data: basePredictionsData } = usePredictions();
  const basePredictions = useMemo(
    () => basePredictionsData?.allPredictions ?? basePredictionsData?.predictions ?? [],
    [basePredictionsData]
  );

  const [selectedProviderId, setSelectedProviderId] = useState<JackpotProviderId>(() =>
    parseSelectedProviderParam(searchParams.get('provider'))
  );
  const [pools, setPools] = useState(() => getInitialOfficialJackpotPools());
  const [useLiveEspnSlate, setUseLiveEspnSlate] = useState<boolean>(false);
  const [syncingEspn, setSyncingEspn] = useState<boolean>(false);
  const [realFeedMatches, setRealFeedMatches] = useState<any[]>([]);
  const [customPicksByProvider, setCustomPicksByProvider] = useState<
    Partial<Record<JackpotProviderId, Record<string, JackpotExtendedPick>>>
  >({});
  const [budgetInput, setBudgetInput] = useState<number>(1600);
  const [allowTriples, setAllowTriples] = useState<boolean>(false);

  const activeProviderMeta = JACKPOT_PROVIDERS[selectedProviderId];
  const activePrefix =
    GENERATOR_PROVIDERS.find((p) => p.id === selectedProviderId)?.bookingPrefix || 'SPMJ';

  const loadLivePools = useCallback(
    async (showToast = false) => {
      setSyncingEspn(true);
      try {
        const [poolRes, liveRes, resultsRes] = await Promise.all([
          fetchLiveJackpotPools(basePredictions, showToast),
          fetch('/api/football?type=live').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/football?type=results').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setPools(poolRes.pools);

        const combined = [
          ...(Array.isArray(liveRes?.predictions) ? liveRes.predictions : []),
          ...(Array.isArray(liveRes?.matches) ? liveRes.matches : []),
          ...(Array.isArray(resultsRes?.predictions) ? resultsRes.predictions : []),
          ...(Array.isArray(resultsRes?.results) ? resultsRes.results : []),
          ...(Array.isArray(resultsRes?.matches) ? resultsRes.matches : []),
        ];
        if (combined.length > 0) {
          setRealFeedMatches(combined);
        }

        if (showToast) {
          toast.success('Synced live bookmaker jackpot pools and scoreboards.');
        }
      } catch {
        if (showToast) {
          toast.info('Using verified local jackpot pool telemetry.');
        }
      } finally {
        setSyncingEspn(false);
      }
    },
    [basePredictions]
  );

  useEffect(() => {
    loadLivePools(false);
  }, [loadLivePools]);

  const activeFixtures = useMemo(() => {
    if (useLiveEspnSlate && basePredictions.length >= 10) {
      return buildUpcomingJackpotPoolFromEspn(selectedProviderId, basePredictions);
    }
    return pools[selectedProviderId] || [];
  }, [useLiveEspnSlate, basePredictions, selectedProviderId, pools]);

  // Default balanced slate (3 Double Chances on highest variance games) if user has not customized yet
  const activePicksMap = useMemo<Record<string, JackpotExtendedPick>>(() => {
    const existing = customPicksByProvider[selectedProviderId];
    if (existing && Object.keys(existing).length > 0) {
      const merged: Record<string, JackpotExtendedPick> = {};
      for (const g of activeFixtures) {
        merged[g.fixtureId] = existing[g.fixtureId] || g.recommendedPick;
      }
      return merged;
    }
    const defaultOpt = optimizeJackpotPicksForBudget(
      selectedProviderId,
      activeFixtures,
      activeProviderMeta.baseStake * 8,
      false
    );
    return defaultOpt.picks;
  }, [customPicksByProvider, selectedProviderId, activeFixtures, activeProviderMeta.baseStake]);

  const survivalProfile = useMemo(
    () => computeJackpotSurvivalProfile(selectedProviderId, activeFixtures, activePicksMap),
    [selectedProviderId, activeFixtures, activePicksMap]
  );

  const settledResult = useMemo(
    () => settleJackpotPool(selectedProviderId, activeFixtures, {}, realFeedMatches),
    [selectedProviderId, activeFixtures, realFeedMatches]
  );

  const bonusGraderStats = useMemo(() => {
    let gradedCount = 0;
    let coveredHits = 0;
    for (const m of settledResult.matches) {
      if ((m.status === 'finished' || m.status === 'live') && m.actualOutcome) {
        gradedCount++;
        const selectedOutcomes = getPickOutcomes(activePicksMap[m.fixtureId] || m.recommendedPick);
        if (selectedOutcomes.includes(m.actualOutcome)) {
          coveredHits++;
        }
      }
    }
    const pendingCount = activeFixtures.length - gradedCount;
    const projectedTotalHits = Math.min(
      activeFixtures.length,
      Math.round(coveredHits + pendingCount * 0.78)
    );
    return {
      gradedCount,
      coveredHits,
      pendingCount,
      projectedTotalHits,
    };
  }, [settledResult.matches, activeFixtures.length, activePicksMap]);

  const hedgedCount = survivalProfile.doubleCount + survivalProfile.tripleCount;

  const setProviderPicks = (next: Record<string, JackpotExtendedPick>) => {
    setCustomPicksByProvider((prev) => ({
      ...prev,
      [selectedProviderId]: next,
    }));
  };

  const handleTogglePick = (fixtureId: string, option: SinglePick) => {
    const currentPick = activePicksMap[fixtureId] || '1';
    const current = getPickOutcomes(currentPick);

    let updated: SinglePick[];
    if (current.includes(option)) {
      if (current.length === 1) {
        toast.info('Each jackpot fixture must have at least 1 outcome selected.');
        return;
      }
      updated = current.filter((o) => o !== option);
    } else {
      if (current.length >= 2) {
        if (allowTriples && current.length === 2) {
          updated = [...current, option];
        } else {
          updated = [current[0], option];
        }
      } else {
        if (hedgedCount >= MAX_HEDGED_GAMES) {
          toast.warning(
            `Maximum ${MAX_HEDGED_GAMES} multi-outcome hedges (${Math.pow(2, MAX_HEDGED_GAMES)} lines) reached.`
          );
          return;
        }
        updated = [...current, option];
      }
    }

    const order: Record<SinglePick, number> = { '1': 0, X: 1, '2': 2 };
    const normalized = updated
      .slice()
      .sort((a, b) => order[a] - order[b])
      .join('') as JackpotExtendedPick;

    setProviderPicks({
      ...activePicksMap,
      [fixtureId]: normalized,
    });
  };

  const applyStrategyPreset = (hedgeCountTarget: number) => {
    const maxBudget = activeProviderMeta.baseStake * Math.pow(2, hedgeCountTarget);
    const opt = optimizeJackpotPicksForBudget(selectedProviderId, activeFixtures, maxBudget, false);
    setProviderPicks(opt.picks);
    toast.success(
      hedgeCountTarget === 0
        ? 'Applied Pure 1-Line AI Banker Slip.'
        : `Applied AI Double-Chance Hedge on ${opt.survivalProfile.doubleCount} riskiest fixtures (${opt.survivalProfile.totalCombinations} combinations).`
    );
  };

  const handleApplyBudgetOptimization = () => {
    const opt = optimizeJackpotPicksForBudget(
      selectedProviderId,
      activeFixtures,
      Math.max(activeProviderMeta.baseStake, budgetInput),
      allowTriples
    );
    setProviderPicks(opt.picks);
    toast.success(
      `Optimized ${opt.hedgedFixtureIds.length} hedges within ${activeProviderMeta.currencySymbol} ${opt.budgetUsed.toLocaleString()} (${opt.survivalProfile.bonusZoneProbabilityPct}% bonus zone odds).`
    );
  };

  const handleApplyAdminBankerLocks = () => {
    const adminPool = getAdminJackpotOverrides();
    const nextMap: Record<string, JackpotExtendedPick> = { ...activePicksMap };
    let applied = 0;

    activeFixtures.forEach((f, idx) => {
      const override = adminPool.find((item) => item.gameNo === idx + 1);
      if (!override) return;
      applied++;
      if (override.isBankerLock) {
        nextMap[f.fixtureId] = override.singlePick;
      } else if (
        override.doubleCover === '1X' ||
        override.doubleCover === 'X2' ||
        override.doubleCover === '12'
      ) {
        nextMap[f.fixtureId] = override.doubleCover;
      } else {
        nextMap[f.fixtureId] = override.singlePick;
      }
    });

    setProviderPicks(nextMap);
    toast.success(`Synced ${applied} curated Banker Locks & Hedges onto ${activeProviderMeta.shortName}.`);
  };

  const { lines: generatedLines, totalPossible, truncated } = useMemo(
    () => generatePlayableSingleLines(activeFixtures, activePicksMap, activePrefix, 64),
    [activeFixtures, activePicksMap, activePrefix]
  );

  const handleLoadTopBankersToSlip = () => {
    const bankers = activeFixtures.filter((f) => f.isBanker).slice(0, 6);
    const toLoad = bankers.length > 0 ? bankers : activeFixtures.slice(0, 6);
    toLoad.forEach((f) => {
      const odds =
        f.recommendedPick === '1'
          ? f.homeOdds
          : f.recommendedPick === 'X'
          ? f.drawOdds
          : f.awayOdds;
      const marketLabel =
        f.recommendedPick === '1'
          ? 'Home Win (1)'
          : f.recommendedPick === 'X'
          ? 'Draw (X)'
          : 'Away Win (2)';
      addSelection({
        matchId: f.fixtureId,
        match: f.match,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        league: f.league,
        matchDate: f.matchDateIso,
        market: marketLabel,
        odds,
        confidence: Math.max(f.homeProb, f.drawProb, f.awayProb),
      });
    });
    toast.success(`Loaded ${toLoad.length} Jackpot AI Bankers into your Bet Slip.`);
  };

  const handleCopyAllCombinations = async () => {
    const header = formatJackpotSmsText(activeProviderMeta, activeFixtures, activePicksMap);
    const text =
      `${activeProviderMeta.name} (${totalPossible} Combinations)\n` +
      `Pool: ${activeProviderMeta.prizePool} | Total Stake: ${activeProviderMeta.currencySymbol} ${survivalProfile.totalStake.toLocaleString()}\n` +
      `Summary: ${header}\n\n` +
      generatedLines
        .map((l) => `Line #${l.lineNo} [${l.code}]: ${l.picks.map((p, idx) => `${idx + 1}:${p}`).join(' ')}`)
        .join('\n') +
      `\n\nVIP Jackpot Syndicate WhatsApp: https://wa.me/254721418238`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      toast.success(`Copied ${generatedLines.length} playable jackpot combinations!`);
    } catch {
      toast.error('Clipboard permission unavailable.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="17-Game Mega & Midweek Jackpot Combination Generator | SportPesa, Betika & Mozzart AI"
        description="Interactive 17-Game Mega Jackpot and 13-Game Midweek Jackpot combination generator. Lock AI Poisson Bankers and optimize Double Chance hedges under your budget."
        canonical="/jackpot-generator"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mega Jackpot Hub', href: '/jackpot-predictions' },
            { label: 'Jackpot Combination Generator' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Header */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Combinatorial Poisson Jackpot Engine</span>
                <span aria-hidden="true">·</span>
                <span>2^N Multi-Line Generator</span>
                <span aria-hidden="true">·</span>
                <span>Bonus Zone Survival</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mega &amp; Midweek Jackpot Combination Generator
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lock high-consensus AI Bankers and optimize Double Chance hedges (1X, X2, 12) on high-variance coin flips to generate playable single-line coupons within your exact budget.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={useLiveEspnSlate ? 'default' : 'outline'}
                onClick={() => {
                  const next = !useLiveEspnSlate;
                  setUseLiveEspnSlate(next);
                  toast.success(
                    next
                      ? 'Switched to Live ESPN Matchweek Slate.'
                      : `Switched to Official ${activeProviderMeta.shortName} Pool.`
                  );
                }}
                className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                {useLiveEspnSlate ? 'Viewing ESPN Upcoming Slate' : 'Switch to ESPN Upcoming'}
              </Button>
              <Button
                variant="outline"
                onClick={() => loadLivePools(true)}
                disabled={syncingEspn}
                className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingEspn ? 'animate-spin' : ''}`} />
                Sync Live Pools
              </Button>
              <Button
                variant="outline"
                onClick={handleApplyAdminBankerLocks}
                className="gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5" />
                Load Locked Bankers
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const target = selectedProviderId.includes('betika')
                    ? 'betika'
                    : selectedProviderId.includes('mozzart')
                    ? 'mozzartbet'
                    : 'sportpesa';
                  const partner = recordAffiliatePartnerClick(target);
                  if (partner?.promoCode) {
                    navigator.clipboard?.writeText(partner.promoCode);
                    toast.success(`Copied Promo Code ${partner.promoCode} for ${partner.name}.`);
                  }
                }}
                className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Bonus Promo Code
              </Button>
              <Button onClick={handleLoadTopBankersToSlip} className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0">
                <Plus className="h-3.5 w-3.5" />
                Load Bankers to Slip
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyAllCombinations}
                className="gap-1.5 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy {generatedLines.length} Lines
              </Button>
            </div>
          </div>

          {/* Live Telemetry & Survival Grader Strip */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Radio className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-foreground">
                  Live Poisson Survival &amp; Bonus Grader ({activeProviderMeta.name})
                </span>
                <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                  {bonusGraderStats.gradedCount > 0
                    ? `${bonusGraderStats.coveredHits}/${bonusGraderStats.gradedCount} Settled/In-Play Covered · ${bonusGraderStats.pendingCount} Upcoming`
                    : `${activeFixtures.length} Official Fixtures Synced · Expected Hits: ${survivalProfile.expectedCorrect}/${activeFixtures.length}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums">
              <span className="px-2.5 py-1 rounded-md bg-background border border-border font-bold text-foreground">
                {survivalProfile.minBonusTarget}+ Bonus Odds: {survivalProfile.bonusZoneProbabilityPct}%
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold">
                Projected Finish: {bonusGraderStats.projectedTotalHits}/{activeFixtures.length}
              </span>
            </div>
          </div>

          {/* Provider Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {GENERATOR_PROVIDERS.map(({ id }) => {
              const meta = JACKPOT_PROVIDERS[id];
              const isSelected = id === selectedProviderId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedProviderId(id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-mono tabular-nums">
                    <span>
                      {meta.countryFlag} {pools[id]?.length || meta.gameCount} Games
                    </span>
                    <span className="font-bold text-primary">
                      {meta.currencySymbol} {meta.baseStake}/line
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{meta.shortName}</p>
                  <p className="text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {meta.prizePool}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Control Bar: Preset Hedges + Budget Optimizer + Live Cost Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                AI Hedging Presets &amp; Budget Optimizer
              </CardTitle>
              <CardDescription className="text-xs">
                Assign Double Chances by highest marginal survival gain or optimize automatically for a maximum stake budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[0, 2, 3, 4, 5].map((cnt) => {
                  const lines = Math.pow(2, cnt);
                  const active = hedgedCount === cnt && survivalProfile.tripleCount === 0;
                  return (
                    <Button
                      key={cnt}
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => applyStrategyPreset(cnt)}
                      className="text-xs font-semibold font-mono tabular-nums whitespace-nowrap shrink-0"
                    >
                      {cnt === 0 ? 'Pure Banker (1 Line)' : `${cnt} Doubles (${lines}x)`} · {activeProviderMeta.currencySymbol}{' '}
                      {(lines * activeProviderMeta.baseStake).toLocaleString()}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
                <span className="text-xs font-semibold text-foreground">Budget Target ({activeProviderMeta.currencySymbol}):</span>
                <input
                  type="number"
                  min={activeProviderMeta.baseStake}
                  step={50}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Math.max(activeProviderMeta.baseStake, Number(e.target.value) || activeProviderMeta.baseStake))}
                  className="w-28 h-8 px-2.5 rounded-md border border-border bg-background text-xs font-mono tabular-nums"
                  aria-label="Maximum stake budget"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowTriples}
                    onChange={(e) => setAllowTriples(e.target.checked)}
                    className="rounded border-border"
                  />
                  Allow Triples (1X2)
                </label>
                <Button size="sm" onClick={handleApplyBudgetOptimization} className="h-8 text-xs font-bold gap-1.5 whitespace-nowrap shrink-0">
                  <Sparkles className="w-3.5 h-3.5" /> Optimize Within Budget
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Combination Telemetry</span>
                <span className="font-mono text-xs text-primary tabular-nums">
                  {totalPossible} Slips
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-sans">Bankers / Multi-Picks:</span>
                <span className="font-bold text-foreground">
                  {survivalProfile.singleCount} Single · {survivalProfile.doubleCount} DC · {survivalProfile.tripleCount} Triple
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-sans">Expected Hits (Poisson):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {survivalProfile.expectedCorrect} / {activeFixtures.length}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                <span className="font-semibold text-foreground font-sans">Total Combination Stake:</span>
                <span className="text-base font-black text-primary">
                  {activeProviderMeta.currencySymbol} {survivalProfile.totalStake.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans truncate">
                {activeProviderMeta.bonusTiers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Jackpot Fixture Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Interactive {activeFixtures.length}-Game Selection Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Click 1, X, or 2 to toggle outcomes. Selecting 2 outcomes creates a Double Chance hedge across your generated slips.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Up to {MAX_HEDGED_GAMES} Double Chances (64 Preview Lines)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-muted-foreground uppercase">
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Fixture &amp; Poisson Model</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Profile</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Select Outcomes (1 / X / 2)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Active Pick &amp; Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeFixtures.map((fixture) => {
                  const activeCode = activePicksMap[fixture.fixtureId] || fixture.recommendedPick;
                  const selected = getPickOutcomes(activeCode);
                  const isHedged = selected.length > 1;
                  const settledMatch = settledResult.matches.find((m) => m.fixtureId === fixture.fixtureId);
                  const isCoveredHit =
                    settledMatch && settledMatch.actualOutcome && (settledMatch.status === 'finished' || settledMatch.status === 'live')
                      ? selected.includes(settledMatch.actualOutcome)
                      : null;
                  const topProb = Math.max(fixture.homeProb, fixture.drawProb, fixture.awayProb);

                  return (
                    <tr
                      key={fixture.fixtureId}
                      className={`hover:bg-muted/30 transition-colors ${isHedged ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-muted-foreground tabular-nums">
                        {fixture.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground flex-wrap">
                          <TeamLogo team={fixture.homeTeam} logoUrl={fixture.homeLogo} size="xs" />
                          <span>{fixture.homeTeam}</span>
                          {settledMatch && (settledMatch.status === 'live' || settledMatch.status === 'finished') && settledMatch.homeScore != null ? (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[11px] font-black tabular-nums bg-slate-900 text-emerald-400">
                              {settledMatch.homeScore}-{settledMatch.awayScore} {settledMatch.minute || settledMatch.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal text-xs">vs</span>
                          )}
                          <TeamLogo team={fixture.awayTeam} logoUrl={fixture.awayLogo} size="xs" />
                          <span>{fixture.awayTeam}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">
                          <span>{fixture.league}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fixture.kickoff}</span>
                          <span aria-hidden="true">·</span>
                          <span>xG {fixture.homeXG}–{fixture.awayXG}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`font-bold text-[11px] ${
                              fixture.isBanker
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : fixture.isValueDraw
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            {fixture.isBanker ? 'BANKER LOCK' : fixture.isValueDraw ? 'HIGH VARIANCE DRAW RISK' : 'BALANCED PARITY'}
                          </span>
                          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            Prob {topProb}% · AI: {fixture.recommendedPick}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {(
                            [
                              { opt: '1' as SinglePick, odds: fixture.homeOdds },
                              { opt: 'X' as SinglePick, odds: fixture.drawOdds },
                              { opt: '2' as SinglePick, odds: fixture.awayOdds },
                            ] as const
                          ).map(({ opt, odds }) => {
                            const active = selected.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleTogglePick(fixture.fixtureId, opt)}
                                className={`min-w-[64px] py-1.5 px-2 rounded-md border text-xs font-bold transition-colors cursor-pointer font-mono tabular-nums ${
                                  active
                                    ? isHedged
                                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                                      : 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted text-foreground border-border'
                                }`}
                              >
                                <span className="block">{opt}</span>
                                <span className="block text-[10px] opacity-85">{odds.toFixed(2)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right space-y-1">
                        <span
                          className={`font-mono font-black text-xs block ${
                            isHedged ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                          }`}
                        >
                          {selected.length === 3
                            ? 'TRIPLE (1X2)'
                            : isHedged
                            ? `HEDGE (${activeCode})`
                            : `BANKER (${activeCode})`}
                        </span>
                        {isCoveredHit !== null && settledMatch?.actualOutcome && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isCoveredHit
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {isCoveredHit ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> HIT ({settledMatch.actualOutcome})
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" /> MISS ({settledMatch.actualOutcome})
                              </>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Generated Playable Combination Slips Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Generated Single-Line Combinations ({generatedLines.length}
                {truncated ? ` of ${totalPossible}` : ''} Slips)
              </h2>
              <p className="text-xs text-muted-foreground">
                Each card is a playable single-line ticket covering a unique permutation of your Double Chance hedges.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/254721418238?text=${encodeURIComponent(
                  `Hello PredictPro VIP, I generated ${totalPossible} lines for ${activeProviderMeta.name} and want the VIP Syndicate Split.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Share2 className="h-3.5 w-3.5" />
                VIP Jackpot Syndicate (+254721418238)
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {generatedLines.map((line) => (
              <Card key={line.lineNo} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between font-mono tabular-nums">
                    <span className="text-xs font-bold text-foreground">
                      Combination #{line.lineNo}
                    </span>
                    <span className="text-xs font-bold text-primary">{line.code}</span>
                  </div>

                  <div className="grid grid-cols-6 gap-1 p-2 rounded-lg bg-muted/40 border border-border/60 font-mono text-[11px] tabular-nums">
                    {line.picks.map((pick, idx) => {
                      const f = activeFixtures[idx];
                      const isHedgedGame = f
                        ? getPickOutcomes(activePicksMap[f.fixtureId] || f.recommendedPick).length > 1
                        : false;
                      return (
                        <div
                          key={idx}
                          className={`text-center py-0.5 rounded ${
                            isHedgedGame
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
                              : 'text-foreground'
                          }`}
                        >
                          <span className="text-[9px] text-muted-foreground block">G{idx + 1}</span>
                          <span>{pick}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                      Stake: <strong className="text-foreground">{activeProviderMeta.currencySymbol} {activeProviderMeta.baseStake}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `${activeProviderMeta.name} Line #${line.lineNo} [${line.code}]: ${line.picks
                            .map((p, i) => `${i + 1}:${p}`)
                            .join(', ')}`
                        );
                        toast.success(`Copied Line #${line.lineNo} (${line.code}).`);
                      }}
                      className="h-7 px-2 text-xs gap-1 font-semibold"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Line
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default JackpotGeneratorPage;
