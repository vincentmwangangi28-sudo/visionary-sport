import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamLogo } from '@/components/TeamLogo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  fetchLiveJackpotPools,
  getInitialOfficialJackpotPools,
  computeJackpotSurvivalProfile,
  optimizeJackpotPicksForBudget,
  formatJackpotSmsText,
  JACKPOT_PROVIDERS,
  JackpotGame,
  JackpotExtendedPick,
  JackpotPickOption,
} from '@/services/jackpotService';
import {
  Check,
  Copy,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldCheck,
  Target,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

type MidweekProviderId = 'sportpesa_midweek' | 'betika';

export default function MidweekJackpotPredictions() {
  const { data: basePredictionsData } = usePredictions();
  const basePredictions = useMemo(
    () => basePredictionsData?.allPredictions ?? basePredictionsData?.predictions ?? [],
    [basePredictionsData]
  );
  const { addSelections, setIsOpen } = useBetSlip();

  const [provider, setProvider] = useState<MidweekProviderId>('sportpesa_midweek');
  const [pools, setPools] = useState(() => getInitialOfficialJackpotPools());
  const [customPicks, setCustomPicks] = useState<Record<string, JackpotExtendedPick>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState<number>(800);

  const loadPools = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const res = await fetchLiveJackpotPools(basePredictions, manual);
        setPools(res.pools);
        if (manual) {
          toast.success('Synced live SportPesa 13 & Betika 15 Midweek Jackpot pools.');
        }
      } catch {
        // Retain current pool state
      } finally {
        setRefreshing(false);
      }
    },
    [basePredictions]
  );

  useEffect(() => {
    loadPools(false);
  }, [loadPools]);

  const currentMeta = JACKPOT_PROVIDERS[provider];
  const currentPool: JackpotGame[] = useMemo(() => pools[provider] || [], [pools, provider]);

  const activePicks = useMemo(() => {
    const map: Record<string, JackpotExtendedPick> = {};
    for (const g of currentPool) {
      map[g.fixtureId] = customPicks[g.fixtureId] || g.recommendedPick;
    }
    return map;
  }, [currentPool, customPicks]);

  const survival = useMemo(
    () => computeJackpotSurvivalProfile(provider, currentPool, activePicks),
    [provider, currentPool, activePicks]
  );

  const handleSelectPick = (fixtureId: string, opt: JackpotPickOption) => {
    setCustomPicks((prev) => ({
      ...prev,
      [fixtureId]: opt,
    }));
  };

  const handleApplyBudgetStrategy = (budgetKes: number) => {
    setBudgetTarget(budgetKes);
    const result = optimizeJackpotPicksForBudget(provider, currentPool, budgetKes, false);
    setCustomPicks((prev) => ({ ...prev, ...result.picks }));
    toast.success(
      `Applied ${result.survivalProfile.doubleCount} optimal Double Chance hedges (${result.survivalProfile.totalCombinations} slips · ${currentMeta.currencySymbol} ${result.budgetUsed.toLocaleString()})`
    );
  };

  const handleResetSingles = () => {
    const next: Record<string, JackpotExtendedPick> = { ...customPicks };
    for (const g of currentPool) {
      next[g.fixtureId] = g.recommendedPick;
    }
    setCustomPicks(next);
    toast.success(`Reset all ${currentPool.length} Midweek matches to Pure AI Bankers (1 line).`);
  };

  const handleCopySlip = async () => {
    const smsLine = formatJackpotSmsText(currentMeta, currentPool, activePicks);
    const detailedLines = currentPool
      .map((g, idx) => `${idx + 1}. ${g.homeTeam} vs ${g.awayTeam} -> ${activePicks[g.fixtureId] || g.recommendedPick}`)
      .join('\n');
    const payload = `${smsLine}\n\n${detailedLines}\n\nTotal Combinations: ${survival.totalCombinations} | Stake: ${currentMeta.currencySymbol} ${survival.totalStake.toLocaleString()}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      }
      setCopiedSlip(true);
      setTimeout(() => setCopiedSlip(false), 2500);
      toast.success(`Copied all ${currentPool.length} ${currentMeta.shortName} selections to clipboard!`);
    } catch {
      toast.error('Clipboard permission unavailable in this browser.');
    }
  };

  const handleLoadToBetSlip = () => {
    const targetGames = currentPool.filter((g) => g.isBanker);
    const gamesToAdd = targetGames.length > 0 ? targetGames : currentPool.slice(0, 6);
    const batch = gamesToAdd.map((g) => {
      const pick = activePicks[g.fixtureId] || g.recommendedPick;
      const market =
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
          : Number((Math.min(g.homeOdds, g.awayOdds) * 0.65).toFixed(2));
      return {
        matchId: g.fixtureId,
        match: g.match,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        league: g.league,
        matchDate: g.matchDateIso,
        market,
        odds: Math.max(1.15, odds),
        confidence: Math.max(g.homeProb, g.drawProb, g.awayProb),
      };
    });
    addSelections(batch);
    setIsOpen(true);
    toast.success(`Loaded ${batch.length} Midweek core banker picks into your Bet Slip.`);
  };

  const schemas = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '13-Game & 15-Game Midweek Jackpot Predictions Today (SportPesa & Betika)',
      description:
        'Live synchronized 13-game SportPesa and 15-game Betika Midweek Jackpot predictions with Bivariate Poisson probabilities and Double Chance budget optimization.',
      url: 'https://predictpro.guru/midweek-jackpot-predictions',
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Midweek Jackpot Predictions Today: 13 & 15 Games AI Models"
        description="Live 13-game SportPesa Midweek and 15-game Betika Midweek Jackpot predictions with Poisson probabilities and Double Chance permutations."
        keywords="midweek jackpot predictions, sportpesa midweek jackpot predictions, betika midweek jackpot 15 games, 13 games jackpot tips today, midweek jackpot bonuses"
        canonical="/midweek-jackpot-predictions"
        structuredData={schemas}
      />
      <Navbar />

      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Jackpot Hub', href: '/jackpot-predictions' },
            { label: 'Midweek Jackpot Predictions (13 & 15 Games)' },
          ]}
        />

        {/* Editorial Header */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider text-emerald-400">
                Midweek Jackpot Engine
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentMeta.shortName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{currentPool.length} Official Matches</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPools(true)}
                disabled={refreshing}
                className="bg-slate-950 border-slate-700 text-white hover:bg-slate-800 text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Sync Live Pool'}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySlip}
                className="bg-slate-950 border-slate-700 text-white hover:bg-slate-800 text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
              >
                {copiedSlip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{copiedSlip ? 'Copied Slip' : `Copy ${currentPool.length}-Game Slip`}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleLoadToBetSlip}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Load Core Bankers</span>
              </Button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Midweek Jackpot Predictions <span className="text-emerald-400">(13 &amp; 15 Games)</span>
          </h1>
          <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed">
            Synchronized directly with SportPesa&apos;s 13-game Midweek and Betika&apos;s 15-game Midweek fixture slates. Lock high-conviction bankers and deploy optimal Double Chances on parity draw traps within your exact stake budget.
          </p>

          {/* Midweek Pool Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {(['sportpesa_midweek', 'betika'] as MidweekProviderId[]).map((pid) => {
              const meta = JACKPOT_PROVIDERS[pid];
              const active = provider === pid;
              const count = pools[pid]?.length || meta.gameCount;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setProvider(pid)}
                  className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">
                      {meta.countryFlag} {meta.shortName}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {count} Matches · {meta.currencySymbol} {meta.baseStake}/line
                    </span>
                  </div>
                  <div className="text-base font-black text-white font-mono tabular-nums">{meta.prizePool}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{meta.bonusTiers}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Budget Optimizer & Poisson Survival Metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2 space-y-3 border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Midweek Stake Budget Optimizer</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Formula: 2^N × {currentMeta.currencySymbol} {currentMeta.baseStake}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={survival.doubleCount === 0 ? 'default' : 'outline'}
                onClick={handleResetSingles}
                className="text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Pure Single ({currentMeta.currencySymbol} {currentMeta.baseStake})
              </Button>
              {[400, 800, 1600, 3200].map((amt) => {
                const isSelected = budgetTarget === amt && survival.doubleCount > 0;
                return (
                  <Button
                    key={amt}
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleApplyBudgetStrategy(amt)}
                    className="text-xs font-mono font-semibold whitespace-nowrap shrink-0"
                  >
                    Max {currentMeta.currencySymbol} {amt.toLocaleString()}
                  </Button>
                );
              })}
              <Button size="sm" variant="ghost" asChild className="text-xs font-semibold ml-auto whitespace-nowrap shrink-0">
                <Link to={`/jackpot-generator?provider=${provider}`}>
                  Full Combination Builder <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-4 border-primary/25 bg-primary/5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Active Ticket Summary</span>
              <span className="font-mono font-bold text-primary tabular-nums">
                {survival.doubleCount} Doubles · {survival.totalCombinations} Lines
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total Investment:</span>
              <span className="text-lg font-black font-mono tabular-nums text-foreground">
                {currentMeta.currencySymbol} {survival.totalStake.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 font-mono tabular-nums">
              <span className="text-muted-foreground">
                Projected Hits: <strong className="text-foreground">{survival.expectedCorrect}/{currentPool.length}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {survival.minBonusTarget}+ Bonus Odds: {survival.bonusZoneProbabilityPct}%
              </span>
            </div>
          </Card>
        </section>

        {/* Official Match Slate */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {currentMeta.name} — Match Breakdown
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              Click 1, X, 2 or Double Chance (1X, X2, 12) on any row
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentPool.map((item) => {
              const selectedPick = activePicks[item.fixtureId] || item.recommendedPick;
              const isHedged = selectedPick.length >= 2;
              const bestOddsProb = Math.max(item.homeProb, item.drawProb, item.awayProb);

              return (
                <Card
                  key={item.fixtureId}
                  className="p-3.5 sm:p-4 border-border/70 bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-mono font-bold text-xs shrink-0 tabular-nums">
                      #{item.id}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground flex-wrap">
                        <TeamLogo team={item.homeTeam} logoUrl={item.homeLogo} size="xs" />
                        <span className="truncate">{item.homeTeam}</span>
                        {item.matchStatus === 'finished' && item.homeScore != null && item.awayScore != null ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs tabular-nums">
                            {item.homeScore}-{item.awayScore} FT
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal text-xs">vs</span>
                        )}
                        <TeamLogo team={item.awayTeam} logoUrl={item.awayLogo} size="xs" />
                        <span className="truncate">{item.awayTeam}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">
                        <span>{item.league}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.kickoff}</span>
                        <span aria-hidden="true">·</span>
                        <span>Odds {item.homeOdds.toFixed(2)}/{item.drawOdds.toFixed(2)}/{item.awayOdds.toFixed(2)}</span>
                        <span aria-hidden="true">·</span>
                        <span>xG {item.homeXG}–{item.awayXG}</span>
                        {item.isBanker && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Banker ({bestOddsProb}%)
                            </span>
                          </>
                        )}
                        {item.isValueDraw && !item.isBanker && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              Draw Risk ({item.drawProb}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
                    <div className="inline-flex items-center gap-1">
                      {(['1', 'X', '2', '1X', 'X2', '12'] as JackpotPickOption[]).map((opt) => {
                        const isSelected = selectedPick === opt;
                        const isAiHedge = item.doubleChance === opt && opt.length === 2;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectPick(item.fixtureId, opt)}
                            aria-label={`Select ${opt} for ${item.match}`}
                            className={`h-7 px-2 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                              isSelected
                                ? isHedged
                                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                                  : 'bg-primary text-primary-foreground border-primary'
                                : isAiHedge
                                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-xs font-mono font-black tabular-nums ${
                        isHedged
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      Pick: {selectedPick}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Need Single-Line Permutations for All {currentPool.length} Midweek Games?
            </h3>
            <p className="text-xs text-muted-foreground">
              Open the Combination Generator to expand your Double Chances into printable 1-line booking coupons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild className="text-xs font-semibold whitespace-nowrap shrink-0">
              <Link to="/jackpot-predictions">17-Game Mega Hub</Link>
            </Button>
            <Button size="sm" asChild className="text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0">
              <Link to={`/jackpot-generator?provider=${provider}`}>
                Open Combination Generator <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </section>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
