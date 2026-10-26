import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Check,
  Copy,
  Flame,
  GitMerge,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  SGP_MATCH_TEMPLATES,
  evaluateGaussianCopulaSgp,
  SgpMatchTemplate,
} from '@/services/clvAndCopulaService';
import { syncSlipToBankroll } from '@/services/socialCardPngGenerator';
import { useAppLocale } from '@/services/i18nLocalizationService';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export const SgpCopulaBuilderPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const { t } = useAppLocale();

  const [selectedMatchId, setSelectedMatchId] = useState<string>(SGP_MATCH_TEMPLATES[0].id);
  const [selectedLegIds, setSelectedLegIds] = useState<string[]>([
    'home_win',
    'over_25',
    'corners_o95',
  ]);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const activeMatch: SgpMatchTemplate = useMemo(() => {
    return (
      SGP_MATCH_TEMPLATES.find((m) => m.id === selectedMatchId) || SGP_MATCH_TEMPLATES[0]
    );
  }, [selectedMatchId]);

  const evaluation = useMemo(() => {
    return evaluateGaussianCopulaSgp(activeMatch, selectedLegIds);
  }, [activeMatch, selectedLegIds]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    const nextMatch =
      SGP_MATCH_TEMPLATES.find((m) => m.id === matchId) || SGP_MATCH_TEMPLATES[0];
    setSelectedLegIds(nextMatch.availableLegs.slice(0, 3).map((l) => l.id));
  };

  const toggleLeg = (legId: string) => {
    setSelectedLegIds((prev) => {
      if (prev.includes(legId)) {
        return prev.filter((id) => id !== legId);
      }
      if (prev.length >= 5) {
        toast.info('Maximum 5 correlated legs per Same-Game Parlay');
        return prev;
      }
      return [...prev, legId];
    });
  };

  const handleLoadPositiveCorrelationPreset = () => {
    const ids = activeMatch.availableLegs
      .filter((l) => ['RESULT', 'GOALS', 'CORNERS', 'PLAYER_PROP'].includes(l.category))
      .slice(0, 4)
      .map((l) => l.id);
    setSelectedLegIds(ids);
    toast.success('Loaded High-Synergy Positive Correlation Cluster!');
  };

  const handleAddSgpToBetSlip = () => {
    if (evaluation.legsCount === 0) return;
    const chosenLabels = activeMatch.availableLegs
      .filter((l) => selectedLegIds.includes(l.id))
      .map((l) => l.label)
      .join(' + ');

    addSelection({
      id: `sgp-${activeMatch.id}-${Date.now()}`,
      matchId: activeMatch.id,
      match: `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`,
      homeTeam: activeMatch.homeTeam,
      awayTeam: activeMatch.awayTeam,
      league: activeMatch.league,
      kickoff: activeMatch.kickoff,
      market: `Correlated SGP (${evaluation.legsCount} Legs): ${chosenLabels}`,
      selection: chosenLabels,
      odds: evaluation.bookmakerQuotedSgpOdds,
      confidence: Math.round(evaluation.copulaTrueProbPct),
    });
    toast.success(
      `Loaded ${evaluation.legsCount}-Leg Correlated SGP (@ ${evaluation.bookmakerQuotedSgpOdds.toFixed(
        2
      )}) into Bet Slip!`
    );
  };

  const handleSyncSgpToBankroll = () => {
    if (evaluation.legsCount === 0) return;
    const chosenLegs = activeMatch.availableLegs.filter((l) =>
      selectedLegIds.includes(l.id)
    );
    syncSlipToBankroll({
      source: 'SGP_COPULA_BUILDER',
      bookmaker: 'Bet365 / SportyBet / 1xBet SGP',
      bookingCode: `SGP-${Math.floor(1000 + Math.random() * 9000)}`,
      totalOdds: evaluation.bookmakerQuotedSgpOdds,
      suggestedStake: 20,
      kellyPct: evaluation.kellyStakePct,
      legs: chosenLegs.map((l) => ({
        match: `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`,
        market: l.label,
        odds: l.bookieSingleOdds,
      })),
    });
    toast.success('Synced Correlated SGP to Bankroll Portfolio!');
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(evaluation.summaryReport);
      setCopiedBrief(true);
      toast.success('Copied SGP Gaussian Copula Brief to clipboard!');
      setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Correlated Same-Game Parlay (SGP) Gaussian Copula Builder | PredictPro"
        description="Build mathematically correlated Same-Game Parlays (Bet Builders) using pairwise Gaussian Copula correlation matrices (ρ) across Goals, BTTS, Corners, Cards, and Player Props."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 pt-6 pb-24 space-y-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Bet Builder Tips', href: '/bet-builder-predictions' },
            { label: 'SGP Gaussian Copula Correlation Builder' },
          ]}
        />

        {/* Hero Header */}
        <section className="rounded-2xl border border-primary/30 bg-slate-950 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
                  GAUSSIAN COPULA CORRELATION MATRIX (ρ)
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  100% Free Multi-Leg Synergy &amp; True SGP Pricing Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <GitMerge className="h-6 w-6 text-emerald-400" />
                <span>{t.sgpBuilderTitle}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Standard bookmaker Bet Builders multiply single-leg odds and apply a generic penalty, often mispricing <strong>positively correlated game scripts</strong> (such as <em>Attacking Favorite Win + Over 2.5 Goals + Star Winger Shots on Target + High Corners</em>). Select up to 5 legs below to compute the exact pairwise correlation ($\rho$) and joint survival probability.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleLoadPositiveCorrelationPreset}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-9"
              >
                <Sparkles className="h-4 w-4" />
                Auto-Load High-ρ Synergy Cluster
              </Button>
              <Link to="/closing-line-value">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-semibold bg-slate-900 border-slate-700 text-white hover:bg-slate-800 h-9"
                >
                  CLV &amp; Steam Scanner &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* Match Selector Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 mr-1">Select Fixture:</span>
            {SGP_MATCH_TEMPLATES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMatch(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedMatchId === m.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>
                  {m.homeTeam} vs {m.awayTeam}
                </span>
                <span className="font-mono text-[10px] opacity-80">({m.league})</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 6 COLS: Candidate SGP Legs Selector */}
          <Card className="lg:col-span-6 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamLogo team={activeMatch.homeTeam} size="sm" />
                  <CardTitle className="text-base font-black">
                    {activeMatch.homeTeam} vs {activeMatch.awayTeam}
                  </CardTitle>
                  <TeamLogo team={activeMatch.awayTeam} size="sm" />
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">
                  xG: {activeMatch.homeXg} – {activeMatch.awayXg}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Click any 2 to 5 legs below to include them in the Gaussian Copula correlation matrix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeMatch.availableLegs.map((leg) => {
                const isSelected = selectedLegIds.includes(leg.id);
                return (
                  <button
                    key={leg.id}
                    type="button"
                    onClick={() => toggleLeg(leg.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-foreground'
                        : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-5 w-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isSelected ? '✓' : '+'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary block">
                          {leg.category}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-foreground block truncate">
                          {leg.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <span className="text-xs font-bold text-foreground block">
                        {leg.bookieSingleOdds.toFixed(2)}x
                      </span>
                      <span className="text-[11px] text-emerald-500 font-semibold">
                        {leg.baseProbabilityPct}% Prob
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* RIGHT 6 COLS: Copula Correlation Matrix & True Pricing Output */}
          <div className="lg:col-span-6 space-y-4">
            {/* Pricing Comparison Card */}
            <Card className="border-emerald-500/40 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Gaussian Copula Joint Probability &amp; True Odds</span>
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-mono text-[11px]">
                    {evaluation.correlationBoostPct >= 0 ? '+' : ''}
                    {evaluation.correlationBoostPct}% CORRELATION LIFT
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono tabular-nums">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                    <span className="text-[10px] font-sans text-muted-foreground block">
                      Independent Product
                    </span>
                    <span className="text-base font-bold text-muted-foreground">
                      {evaluation.uncorrelatedFairOdds.toFixed(2)}x
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      ({evaluation.uncorrelatedProbPct}% Prob)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] font-sans text-emerald-500 font-bold block">
                      Copula True Fair
                    </span>
                    <span className="text-base font-black text-emerald-500">
                      {evaluation.copulaTrueFairOdds.toFixed(2)}x
                    </span>
                    <span className="text-[11px] text-emerald-500 font-bold block">
                      ({evaluation.copulaTrueProbPct}% True Prob)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                    <span className="text-[10px] font-sans text-primary font-bold block">
                      Bookmaker SGP Quote
                    </span>
                    <span className="text-base font-black text-foreground">
                      {evaluation.bookmakerQuotedSgpOdds.toFixed(2)}x
                    </span>
                    <span className="text-[11px] text-emerald-500 font-bold block">
                      +{evaluation.valueEdgePct}% EV Edge
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleAddSgpToBetSlip}
                    disabled={evaluation.legsCount === 0}
                    className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add {evaluation.legsCount}-Leg SGP to Slip (@{' '}
                    {evaluation.bookmakerQuotedSgpOdds.toFixed(2)})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncSgpToBankroll}
                    disabled={evaluation.legsCount === 0}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                    Sync SGP to Bankroll
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyReport}
                    className="gap-1.5 text-xs ml-auto"
                  >
                    {copiedBrief ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedBrief ? 'Copied Brief!' : 'Copy SGP Brief'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pairwise Correlation Coefficient (ρ) Breakdown */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">
                  Pairwise Leg Correlation Coefficients (ρ)
                </CardTitle>
                <CardDescription className="text-xs">
                  How each selected leg mathematically amplifies or conflicts with the others.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {evaluation.pairwiseCorrelations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Select at least 2 legs on the left to compute pairwise correlation coefficients.
                  </p>
                ) : (
                  evaluation.pairwiseCorrelations.map((pair) => (
                    <div
                      key={`${pair.legAId}-${pair.legBId}`}
                      className="p-2.5 rounded-xl bg-muted/30 border border-border/60 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground">
                          {pair.legALabel} <span className="text-muted-foreground">×</span>{' '}
                          {pair.legBLabel}
                        </span>
                        <span
                          className={`font-mono tabular-nums font-black px-2 py-0.5 rounded text-[11px] ${
                            pair.rho >= 0.3
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : pair.rho > 0
                              ? 'bg-sky-500/15 text-sky-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          ρ = {pair.rho >= 0 ? '+' : ''}
                          {pair.rho.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{pair.explanation}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SgpCopulaBuilderPage;
