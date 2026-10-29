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
  Crosshair,
  Plus,
  Calculator,
  Search,
  ArrowRight,
  Flame,
} from 'lucide-react';
import {
  ELITE_PLAYER_PROP_DATABASE,
  ElitePlayerPropRow,
  computePlayerPropPoissonMatrix,
} from '@/services/phase15PropSystemService';

export const PlayerPropsLabPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].id
  );

  // Interactive Player Prop Poisson Calculator state
  const [playerName, setPlayerName] = useState<string>(ELITE_PLAYER_PROP_DATABASE[0].playerName);
  const [sotPer90, setSotPer90] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].sotPer90.toFixed(2)
  );
  const [npxgPer90, setNpxgPer90] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].nonPenaltyXgPer90.toFixed(2)
  );
  const [expectedMinutes, setExpectedMinutes] = useState<string>(
    String(ELITE_PLAYER_PROP_DATABASE[0].expectedMinutes)
  );
  const [opponentMult, setOpponentMult] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].opponentDefenseMultiplier.toFixed(2)
  );
  const [isPenaltyTaker, setIsPenaltyTaker] = useState<boolean>(
    ELITE_PLAYER_PROP_DATABASE[0].isPenaltyTaker
  );
  const [bookie1Sot, setBookie1Sot] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].bookieOdds1PlusSot.toFixed(2)
  );
  const [bookie2Sot, setBookie2Sot] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].bookieOdds2PlusSot.toFixed(2)
  );
  const [bookieGoal, setBookieGoal] = useState<string>(
    ELITE_PLAYER_PROP_DATABASE[0].bookieOddsAnytimeGoal.toFixed(2)
  );

  const leagues = useMemo(() => {
    const set = new Set(ELITE_PLAYER_PROP_DATABASE.map((p) => p.league));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredPlayers = useMemo(() => {
    return ELITE_PLAYER_PROP_DATABASE.filter((p) => {
      if (leagueFilter !== 'all' && p.league !== leagueFilter) return false;
      if (
        searchQuery.trim() &&
        !`${p.playerName} ${p.team} ${p.opponent}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [leagueFilter, searchQuery]);

  const activePlayer = useMemo(
    () =>
      ELITE_PLAYER_PROP_DATABASE.find((p) => p.id === selectedPlayerId) ||
      ELITE_PLAYER_PROP_DATABASE[0],
    [selectedPlayerId]
  );

  const handleSelectPlayer = (row: ElitePlayerPropRow) => {
    setSelectedPlayerId(row.id);
    setPlayerName(row.playerName);
    setSotPer90(row.sotPer90.toFixed(2));
    setNpxgPer90(row.nonPenaltyXgPer90.toFixed(2));
    setExpectedMinutes(String(row.expectedMinutes));
    setOpponentMult(row.opponentDefenseMultiplier.toFixed(2));
    setIsPenaltyTaker(row.isPenaltyTaker);
    setBookie1Sot(row.bookieOdds1PlusSot.toFixed(2));
    setBookie2Sot(row.bookieOdds2PlusSot.toFixed(2));
    setBookieGoal(row.bookieOddsAnytimeGoal.toFixed(2));
    toast.success(`Loaded ${row.playerName} (${row.team}) into Prop Poisson Lab`);
  };

  const propCalc = useMemo(
    () =>
      computePlayerPropPoissonMatrix({
        sotPer90: parseFloat(sotPer90) || 1.8,
        nonPenaltyXgPer90: parseFloat(npxgPer90) || 0.55,
        expectedMinutes: parseFloat(expectedMinutes) || 88,
        opponentDefenseMultiplier: parseFloat(opponentMult) || 1.0,
        isPenaltyTaker,
        bookieOdds1PlusSot: parseFloat(bookie1Sot) || 1.25,
        bookieOdds2PlusSot: parseFloat(bookie2Sot) || 2.0,
        bookieOddsAnytimeGoal: parseFloat(bookieGoal) || 2.1,
      }),
    [
      sotPer90,
      npxgPer90,
      expectedMinutes,
      opponentMult,
      isPenaltyTaker,
      bookie1Sot,
      bookie2Sot,
      bookieGoal,
    ]
  );

  const handleAddPropToSlip = (
    p: ElitePlayerPropRow,
    marketLabel: string,
    odds: number,
    probPct: number
  ) => {
    addSelection({
      id: `prop-${p.id}-${marketLabel}`,
      homeTeam: p.team,
      awayTeam: p.opponent,
      league: p.league,
      kickoff: 'Upcoming',
      market: `${p.playerName} — ${marketLabel}`,
      selection: `${p.playerName} — ${marketLabel}`,
      odds,
      confidence: Math.round(probPct),
    });
    setIsOpen(true);
    toast.success(`Added ${p.playerName} (${marketLabel} @ ${odds.toFixed(2)}) to Bet Slip`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Player Shots on Target (SoT) & Goalscorer Prop Lab | PredictPro"
        description="Per-90 Expected Goals (npxG) and Shots on Target (1+ SoT, 2+ SoT, Anytime Goalscorer) Poisson calculator with penalty duty adjustments and +EV prop scanner."
        keywords="player shots on target predictions, 1+ shot on target tips, 2+ shots on target calculator, anytime goalscorer poisson model, football player props"
        canonical="/player-props-lab"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Player Shots on Target & Goalscorer Prop Lab' },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Per-90 Shot Volume Telemetry</span>
                <span aria-hidden="true">·</span>
                <span>1+ / 2+ SoT &amp; Goalscorer Poisson</span>
                <span aria-hidden="true">·</span>
                <span>Penalty Duty Boost (+0.16 xG)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Player Shots on Target (SoT) &amp; Goalscorer Prop Lab
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Convert player per-90 shot volume, non-penalty xG, expected minutes, and opponent defensive concession rates into exact Poisson probabilities for <strong>1+ SoT</strong>, <strong>2+ SoT</strong>, and <strong>Anytime Goalscorer</strong> markets.
              </p>
            </div>

            {/* Search + League Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search player or club..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs w-full sm:w-52"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                {leagues.map((lg) => (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setLeagueFilter(lg)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      leagueFilter === lg
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lg === 'all' ? 'All' : lg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Player Prop Scanner Table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <span>Elite Attackers — Per-90 SoT &amp; Goalscorer Matrix</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any player row to load their metrics into the interactive Poisson Prop Calculator below
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              {filteredPlayers.length} Players Matched
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Player &amp; Club</th>
                  <th className="py-3 px-4 font-semibold">Matchup</th>
                  <th className="py-3 px-4 font-semibold">SoT / 90</th>
                  <th className="py-3 px-4 font-semibold">npxG / 90</th>
                  <th className="py-3 px-4 font-semibold">Set-Piece Duty</th>
                  <th className="py-3 px-4 font-semibold">2+ SoT Fair vs Bookie</th>
                  <th className="py-3 px-4 font-semibold">Goal Fair vs Bookie</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlayers.map((row) => {
                  const rowCalc = computePlayerPropPoissonMatrix({
                    sotPer90: row.sotPer90,
                    nonPenaltyXgPer90: row.nonPenaltyXgPer90,
                    expectedMinutes: row.expectedMinutes,
                    opponentDefenseMultiplier: row.opponentDefenseMultiplier,
                    isPenaltyTaker: row.isPenaltyTaker,
                    bookieOdds1PlusSot: row.bookieOdds1PlusSot,
                    bookieOdds2PlusSot: row.bookieOdds2PlusSot,
                    bookieOddsAnytimeGoal: row.bookieOddsAnytimeGoal,
                  });
                  const isSelected = row.id === selectedPlayerId;

                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? 'bg-primary/5' : 'hover:bg-muted/30 transition-colors'}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground">
                          {row.playerName}{' '}
                          <span className="text-muted-foreground font-normal">({row.position})</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.team} · {row.league}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">vs {row.opponent}</p>
                        <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                          Opp Mult: {row.opponentDefenseMultiplier.toFixed(2)}x · {row.expectedMinutes}&apos;
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-primary">
                        {row.sotPer90.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-foreground">
                        {row.nonPenaltyXgPer90.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {row.isPenaltyTaker ? 'PK Taker' : 'Open Play'}
                        {row.isFreeKickTaker ? ' · Direct FK' : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span className="text-muted-foreground">
                          Fair {rowCalc.fairOdds2PlusSot.toFixed(2)}
                        </span>{' '}
                        ·{' '}
                        <span className="font-bold text-foreground">
                          @{row.bookieOdds2PlusSot.toFixed(2)}
                        </span>{' '}
                        <span
                          className={`text-[11px] font-bold ${
                            rowCalc.ev2PlusSotPct > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        >
                          ({rowCalc.ev2PlusSotPct > 0 ? '+' : ''}
                          {rowCalc.ev2PlusSotPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span className="text-muted-foreground">
                          Fair {rowCalc.fairOddsAnytimeGoal.toFixed(2)}
                        </span>{' '}
                        ·{' '}
                        <span className="font-bold text-foreground">
                          @{row.bookieOddsAnytimeGoal.toFixed(2)}
                        </span>{' '}
                        <span
                          className={`text-[11px] font-bold ${
                            rowCalc.evAnytimeGoalPct > 0
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          ({rowCalc.evAnytimeGoalPct > 0 ? '+' : ''}
                          {rowCalc.evAnytimeGoalPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectPlayer(row)}
                            className="whitespace-nowrap shrink-0 text-xs"
                          >
                            Model
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAddPropToSlip(
                                row,
                                '2+ Shots on Target',
                                row.bookieOdds2PlusSot,
                                rowCalc.prob2PlusSotPct
                              )
                            }
                            className="whitespace-nowrap shrink-0 gap-1 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>2+ SoT</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Custom Player Prop Poisson Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Inputs */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Custom Player Prop Poisson Calculator
                </h2>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                {playerName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Player Name
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Shots on Target / 90
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={sotPer90}
                  onChange={(e) => setSotPer90(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Non-Penalty xG / 90
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={npxgPer90}
                  onChange={(e) => setNpxgPer90(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Expected Minutes (15–95)
                </label>
                <Input
                  type="number"
                  min="15"
                  max="95"
                  value={expectedMinutes}
                  onChange={(e) => setExpectedMinutes(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Opponent Defense Multiplier
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={opponentMult}
                  onChange={(e) => setOpponentMult(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie 1+ SoT Odds
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={bookie1Sot}
                  onChange={(e) => setBookie1Sot(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie 2+ SoT Odds
                </label>
                <Input
                  type="number"
                  step="0.02"
                  value={bookie2Sot}
                  onChange={(e) => setBookie2Sot(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookie Anytime Goalscorer Odds
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={bookieGoal}
                  onChange={(e) => setBookieGoal(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <span className="text-xs font-medium text-foreground">
                Designated Penalty Taker (+0.16 xG/90 Boost)
              </span>
              <button
                type="button"
                onClick={() => setIsPenaltyTaker((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isPenaltyTaker
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isPenaltyTaker ? 'Penalty Taker: YES' : 'Open Play Only'}
              </button>
            </div>
          </div>

          {/* Right: Prop Probabilities & EV Matrix */}
          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Adjusted Match λ (SoT)</p>
                <p className="text-xl font-bold font-mono tabular-nums text-primary mt-1">
                  {propCalc.adjustedLambdaSot.toFixed(2)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  Expected Shots on Target
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Adjusted Match λ (Goals)</p>
                <p className="text-xl font-bold font-mono tabular-nums text-emerald-500 mt-1">
                  {propCalc.adjustedLambdaGoal.toFixed(2)}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  Expected Goals (incl. PK)
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">3+ SoT Hat-Trick Threat</p>
                <p className="text-xl font-bold font-mono tabular-nums text-foreground mt-1">
                  {propCalc.prob3PlusSotPct.toFixed(1)}%
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  Fair: {(100 / Math.max(1, propCalc.prob3PlusSotPct)).toFixed(2)}x
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">2+ Goals (Brace) Prob</p>
                <p className="text-xl font-bold font-mono tabular-nums text-amber-500 mt-1">
                  {propCalc.probBrace2PlusGoalsPct.toFixed(1)}%
                </p>
                <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                  Fair: {(100 / Math.max(1, propCalc.probBrace2PlusGoalsPct)).toFixed(2)}x
                </p>
              </div>
            </div>

            {/* Prop Pricing Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Poisson Prop Fair Odds vs Bookmaker Quote ({playerName})
                </h3>
                <span className="text-xs text-muted-foreground">1-Click Bet Slip Export</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Prop Market</th>
                      <th className="py-3 px-4 font-semibold">True Poisson Prob</th>
                      <th className="py-3 px-4 font-semibold">Fair Decimal Odds</th>
                      <th className="py-3 px-4 font-semibold">Bookie Quote</th>
                      <th className="py-3 px-4 font-semibold">EV Edge (%)</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono tabular-nums">
                    <tr>
                      <td className="py-3.5 px-4 font-sans font-bold text-foreground">
                        {playerName} — 1+ Shot on Target
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {propCalc.prob1PlusSotPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {propCalc.fairOdds1PlusSot.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary">
                        {parseFloat(bookie1Sot || '1.25').toFixed(2)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          propCalc.ev1PlusSotPct > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}
                      >
                        {propCalc.ev1PlusSotPct > 0 ? '+' : ''}
                        {propCalc.ev1PlusSotPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAddPropToSlip(
                              activePlayer,
                              '1+ Shot on Target',
                              parseFloat(bookie1Sot) || 1.25,
                              propCalc.prob1PlusSotPct
                            )
                          }
                          className="whitespace-nowrap shrink-0 gap-1 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </Button>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-sans font-bold text-foreground">
                        {playerName} — 2+ Shots on Target
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {propCalc.prob2PlusSotPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {propCalc.fairOdds2PlusSot.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary">
                        {parseFloat(bookie2Sot || '2.0').toFixed(2)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          propCalc.ev2PlusSotPct > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}
                      >
                        {propCalc.ev2PlusSotPct > 0 ? '+' : ''}
                        {propCalc.ev2PlusSotPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAddPropToSlip(
                              activePlayer,
                              '2+ Shots on Target',
                              parseFloat(bookie2Sot) || 2.0,
                              propCalc.prob2PlusSotPct
                            )
                          }
                          className="whitespace-nowrap shrink-0 gap-1 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </Button>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-sans font-bold text-foreground">
                        {playerName} — Anytime Goalscorer
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {propCalc.probAnytimeGoalPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {propCalc.fairOddsAnytimeGoal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary">
                        {parseFloat(bookieGoal || '2.1').toFixed(2)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          propCalc.evAnytimeGoalPct > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}
                      >
                        {propCalc.evAnytimeGoalPct > 0 ? '+' : ''}
                        {propCalc.evAnytimeGoalPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAddPropToSlip(
                              activePlayer,
                              'Anytime Goalscorer',
                              parseFloat(bookieGoal) || 2.1,
                              propCalc.probAnytimeGoalPct
                            )
                          }
                          className="whitespace-nowrap shrink-0 gap-1 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  Want to combine 4–6 player props with fault-tolerant protection if 1 or 2 players miss?
                </span>
              </div>
              <Link
                to="/trixie-yankee-calculator"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Open System Bet Permutation Simulator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlayerPropsLabPage;
