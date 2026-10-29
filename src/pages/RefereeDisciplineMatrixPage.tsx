import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Plus,
  Calculator,
  Scale,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  REFEREE_DISCIPLINE_MATCHUPS,
  RefereeMatchupRow,
  computeRefereeCardPoissonMatrix,
} from '@/services/phase15PropSystemService';

export const RefereeDisciplineMatrixPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [selectedMatchupId, setSelectedMatchupId] = useState<string>(
    REFEREE_DISCIPLINE_MATCHUPS[0].id
  );

  // Interactive Poisson Card & Booking Points Calculator state
  const [refYellowsPer90, setRefYellowsPer90] = useState<string>('5.42');
  const [refRedsPer90, setRefRedsPer90] = useState<string>('0.31');
  const [homeAggression, setHomeAggression] = useState<string>('1.18');
  const [awayAggression, setAwayAggression] = useState<string>('1.24');
  const [isDerbyOrKnockout, setIsDerbyOrKnockout] = useState<boolean>(true);
  const [oddsOver35, setOddsOver35] = useState<string>('1.36');
  const [oddsOver45, setOddsOver45] = useState<string>('1.74');
  const [oddsOver55, setOddsOver55] = useState<string>('2.28');
  const [oddsRedCard, setOddsRedCard] = useState<string>('3.45');

  const leagues = useMemo(() => {
    const set = new Set(REFEREE_DISCIPLINE_MATCHUPS.map((r) => r.league));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredMatchups = useMemo(() => {
    if (leagueFilter === 'all') return REFEREE_DISCIPLINE_MATCHUPS;
    return REFEREE_DISCIPLINE_MATCHUPS.filter((m) => m.league === leagueFilter);
  }, [leagueFilter]);

  const activeMatchup = useMemo(
    () =>
      REFEREE_DISCIPLINE_MATCHUPS.find((m) => m.id === selectedMatchupId) ||
      REFEREE_DISCIPLINE_MATCHUPS[0],
    [selectedMatchupId]
  );

  const handleSelectMatchup = (row: RefereeMatchupRow) => {
    setSelectedMatchupId(row.id);
    setRefYellowsPer90(row.yellowsPer90.toFixed(2));
    setRefRedsPer90(row.redsPer90.toFixed(2));
    setHomeAggression(row.homeAggressionIndex.toFixed(2));
    setAwayAggression(row.awayAggressionIndex.toFixed(2));
    setIsDerbyOrKnockout(row.isDerbyOrKnockout);
    setOddsOver35(row.bookieOddsOver35Cards.toFixed(2));
    setOddsOver45(row.bookieOddsOver45Cards.toFixed(2));
    setOddsOver55(row.bookieOddsOver55Cards.toFixed(2));
    setOddsRedCard(row.bookieOddsRedCardYes.toFixed(2));
    toast.success(`Loaded ${row.refereeName} (${row.match}) into Card Poisson Engine`);
  };

  const poissonResult = useMemo(
    () =>
      computeRefereeCardPoissonMatrix({
        refereeYellowsPer90: parseFloat(refYellowsPer90) || 4.5,
        refereeRedsPer90: parseFloat(refRedsPer90) || 0.22,
        homeAggressionIndex: parseFloat(homeAggression) || 1.0,
        awayAggressionIndex: parseFloat(awayAggression) || 1.0,
        isDerbyOrKnockout,
        bookieOddsOver35Cards: parseFloat(oddsOver35) || 1.45,
        bookieOddsOver45Cards: parseFloat(oddsOver45) || 1.85,
        bookieOddsOver55Cards: parseFloat(oddsOver55) || 2.5,
        bookieOddsRedCardYes: parseFloat(oddsRedCard) || 3.9,
      }),
    [
      refYellowsPer90,
      refRedsPer90,
      homeAggression,
      awayAggression,
      isDerbyOrKnockout,
      oddsOver35,
      oddsOver45,
      oddsOver55,
      oddsRedCard,
    ]
  );

  const handleAddCardMarket = (
    matchup: RefereeMatchupRow,
    marketLabel: string,
    odds: number,
    probPct: number
  ) => {
    addSelection({
      id: `ref-card-${matchup.id}-${marketLabel}`,
      homeTeam: matchup.homeTeam,
      awayTeam: matchup.awayTeam,
      league: matchup.league,
      kickoff: matchup.kickoffTime,
      market: `${marketLabel} (${matchup.refereeName})`,
      selection: `${marketLabel} (${matchup.refereeName})`,
      odds,
      confidence: Math.round(probPct),
    });
    setIsOpen(true);
    toast.success(`Added ${marketLabel} @ ${odds.toFixed(2)} to Bet Slip`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Referee Discipline, Booking Points & Card Markets Scanner | PredictPro"
        description="Per-90 referee yellow/red card profiler, fouls-per-tackle ratio, penalty frequency, and Poisson Over 3.5 / 4.5 / 5.5 Cards value calculator."
        keywords="referee stats scanner, football card predictions, over 4.5 cards tips, booking points calculator, referee yellow cards per 90"
        canonical="/referee-stats-scanner"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Referee Discipline & Card Markets Scanner' },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Officiating Telemetry</span>
                <span aria-hidden="true">·</span>
                <span>Yellows &amp; Reds Per 90</span>
                <span aria-hidden="true">·</span>
                <span>Booking Points Poisson Model</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Referee Discipline, Card &amp; Penalty Matrix
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Card and Booking Points lines are heavily driven by referee whistle thresholds and tactical foul tempo. Select any assigned official below or customize team aggression multipliers to price <strong>Over 3.5 / 4.5 / 5.5 Cards</strong>, <strong>Red Card Shown</strong>, and <strong>Player Booking</strong> edges.
              </p>
            </div>

            {/* League Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-lg border border-border self-start">
              {leagues.map((lg) => (
                <button
                  key={lg}
                  type="button"
                  onClick={() => setLeagueFilter(lg)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    leagueFilter === lg
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lg === 'all' ? 'All Competitions' : lg}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Assigned Referees Table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>Assigned Referee Whistle &amp; Tactical Aggression Ledger</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click &quot;Load in Poisson Lab&quot; on any fixture to run full card &amp; booking points pricing
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              Showing {filteredMatchups.length} High-Alert Assignments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Referee &amp; Competition</th>
                  <th className="py-3 px-4 font-semibold">Assigned Fixture</th>
                  <th className="py-3 px-4 font-semibold">Yellows / 90</th>
                  <th className="py-3 px-4 font-semibold">Reds / 90</th>
                  <th className="py-3 px-4 font-semibold">Penalty Rate</th>
                  <th className="py-3 px-4 font-semibold">Away Bias</th>
                  <th className="py-3 px-4 font-semibold">Top Player Booking Watch</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMatchups.map((row) => {
                  const isSelected = row.id === selectedMatchupId;
                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? 'bg-primary/5' : 'hover:bg-muted/30 transition-colors'}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground">{row.refereeName}</p>
                        <p className="text-[11px] text-muted-foreground">{row.league}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{row.match}</p>
                        <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                          Aggression: H {row.homeAggressionIndex.toFixed(2)}x · A{' '}
                          {row.awayAggressionIndex.toFixed(2)}x
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-amber-500">
                        {row.yellowsPer90.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-rose-500 font-semibold">
                        {row.redsPer90.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-foreground">
                        {row.penaltyRatePct}%
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-muted-foreground">
                        {row.awayBookingBiasPct}% Away
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleAddCardMarket(
                              row,
                              row.topBookingCandidate,
                              row.topBookingCandidateOdds,
                              68
                            )
                          }
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors block">
                            {row.topBookingCandidate}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-emerald-500 font-bold">
                            @{row.topBookingCandidateOdds.toFixed(2)} (+ Add Slip)
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => handleSelectMatchup(row)}
                          className="whitespace-nowrap shrink-0 text-xs"
                        >
                          {isSelected ? 'Loaded in Lab' : 'Load in Poisson Lab'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Interactive Card & Booking Points Poisson Lab */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Model Inputs */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Card &amp; Booking Points Poisson Parameters
                </h2>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {activeMatchup.refereeName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Ref Yellow Cards / 90
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={refYellowsPer90}
                  onChange={(e) => setRefYellowsPer90(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Ref Red Cards / 90
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={refRedsPer90}
                  onChange={(e) => setRefRedsPer90(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Home Aggression Index (0.7–1.5)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={homeAggression}
                  onChange={(e) => setHomeAggression(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Away Aggression Index (0.7–1.5)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={awayAggression}
                  onChange={(e) => setAwayAggression(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Over 3.5 Cards Odds
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={oddsOver35}
                  onChange={(e) => setOddsOver35(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Over 4.5 Cards Odds
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={oddsOver45}
                  onChange={(e) => setOddsOver45(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Over 5.5 Cards Odds
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={oddsOver55}
                  onChange={(e) => setOddsOver55(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Red Card (Yes) Odds
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={oddsRedCard}
                  onChange={(e) => setOddsRedCard(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-xs font-medium text-foreground">
                Rivalry Derby / Knockout Elimination Intensity (+16% Card Tempo)
              </span>
              <button
                type="button"
                onClick={() => setIsDerbyOrKnockout((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isDerbyOrKnockout
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDerbyOrKnockout ? 'Derby Boost ON' : 'Standard Match'}
              </button>
            </div>
          </div>

          {/* Right: Poisson Output & Fair Odds Table */}
          <div className="lg:col-span-7 space-y-5">
            {/* 4 Telemetry Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Expected Total Cards (λ)</p>
                <p className="text-xl font-bold font-mono tabular-nums text-amber-500 mt-1">
                  {poissonResult.expectedTotalCards.toFixed(2)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  {poissonResult.expectedYellows.toFixed(2)} Y · {poissonResult.expectedReds.toFixed(2)} R
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Expected Booking Points</p>
                <p className="text-xl font-bold font-mono tabular-nums text-foreground mt-1">
                  {poissonResult.expectedBookingPoints.toFixed(1)} pts
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Yellow = 10 · Red = 25</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Penalty Award Prob</p>
                <p className="text-xl font-bold font-mono tabular-nums text-primary mt-1">
                  {poissonResult.penaltyAwardProbPct}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">VAR &amp; Box Contact</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Active Fixture</p>
                <p className="text-sm font-bold text-foreground mt-1 truncate">
                  {activeMatchup.match}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Ref: {activeMatchup.refereeName}
                </p>
              </div>
            </div>

            {/* Market Value Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span>Poisson Card Market Pricing vs Bookmaker Odds</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  Positive EV% indicates mathematical edge
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Card Market Line</th>
                      <th className="py-3 px-4 font-semibold">Poisson Prob</th>
                      <th className="py-3 px-4 font-semibold">Fair No-Vig Odds</th>
                      <th className="py-3 px-4 font-semibold">Bookie Odds</th>
                      <th className="py-3 px-4 font-semibold">Expected Value</th>
                      <th className="py-3 px-4 font-semibold text-right">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono tabular-nums">
                    {poissonResult.markets.map((m) => (
                      <tr key={m.marketLabel}>
                        <td className="py-3.5 px-4 font-sans">
                          <p className="font-bold text-foreground">{m.marketLabel}</p>
                          <p className="text-[11px] text-muted-foreground">{m.lineDescription}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {m.modelProbPct.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {m.fairOdds.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-primary">
                          {m.bookieOdds.toFixed(2)}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            m.evEdgePct > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        >
                          {m.evEdgePct > 0 ? '+' : ''}
                          {m.evEdgePct.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-sans">
                          <Button
                            size="sm"
                            variant={m.evEdgePct > 0 ? 'default' : 'outline'}
                            onClick={() =>
                              handleAddCardMarket(
                                activeMatchup,
                                m.marketLabel,
                                m.bookieOdds,
                                m.modelProbPct
                              )
                            }
                            className="whitespace-nowrap shrink-0 gap-1 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  Combine high-card referee edges with Player Shots on Target (SoT) props or Corner Tempo models.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/player-props-lab"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Player SoT Prop Lab</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/corner-stats-scanner"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Corner Tempo Scanner</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefereeDisciplineMatrixPage;
