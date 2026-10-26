import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CloudRain,
  Copy,
  Check,
  Flame,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  runMonteCarloTacticalSimulation,
  RedCardScenario,
  PitchWeatherCondition,
  TacticalTempoMode,
  RefereeStrictnessMode,
} from '@/services/monteCarloSimulatorService';
import { syncSlipToBankroll } from '@/services/socialCardPngGenerator';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export interface MatchTacticalSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  baseHomeXg?: number;
  baseAwayXg?: number;
  currentHomeScore?: number;
  currentAwayScore?: number;
  minuteElapsed?: number;
  bookieHomeOdds?: number;
  bookieDrawOdds?: number;
  bookieAwayOdds?: number;
}

export const MatchTacticalSimulatorModal: React.FC<MatchTacticalSimulatorModalProps> = ({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  league = 'Premier League',
  baseHomeXg = 1.72,
  baseAwayXg = 1.24,
  currentHomeScore = 0,
  currentAwayScore = 0,
  minuteElapsed = 0,
  bookieHomeOdds,
  bookieDrawOdds,
  bookieAwayOdds,
}) => {
  const { addSelection } = useBetSlip();

  const [homeStarAbsencePct, setHomeStarAbsencePct] = useState<number>(0);
  const [awayStarAbsencePct, setAwayStarAbsencePct] = useState<number>(0);
  const [redCardScenario, setRedCardScenario] = useState<RedCardScenario>('NONE');
  const [pitchCondition, setPitchCondition] = useState<PitchWeatherCondition>('STANDARD');
  const [tacticalTempo, setTacticalTempo] = useState<TacticalTempoMode>('BALANCED');
  const [refereeStrictness, setRefereeStrictness] = useState<RefereeStrictnessMode>('STANDARD');
  const [copiedReport, setCopiedReport] = useState(false);

  const simResult = useMemo(() => {
    return runMonteCarloTacticalSimulation({
      homeTeam,
      awayTeam,
      league,
      baseHomeXg,
      baseAwayXg,
      currentHomeScore,
      currentAwayScore,
      minuteElapsed,
      homeStarAbsencePct,
      awayStarAbsencePct,
      redCardScenario,
      pitchCondition,
      tacticalTempo,
      refereeStrictness,
      bookieHomeOdds,
      bookieDrawOdds,
      bookieAwayOdds,
      iterations: 10000,
    });
  }, [
    homeTeam,
    awayTeam,
    league,
    baseHomeXg,
    baseAwayXg,
    currentHomeScore,
    currentAwayScore,
    minuteElapsed,
    homeStarAbsencePct,
    awayStarAbsencePct,
    redCardScenario,
    pitchCondition,
    tacticalTempo,
    refereeStrictness,
    bookieHomeOdds,
    bookieDrawOdds,
    bookieAwayOdds,
  ]);

  const handleReset = () => {
    setHomeStarAbsencePct(0);
    setAwayStarAbsencePct(0);
    setRedCardScenario('NONE');
    setPitchCondition('STANDARD');
    setTacticalTempo('BALANCED');
    setRefereeStrictness('STANDARD');
    toast.success('Reset What-If sliders to baseline match telemetry');
  };

  const handleApplyQuickPreset = (
    preset: 'HOME_STAR_OUT' | 'AWAY_RED_CARD' | 'MONSOON_LOW_BLOCK' | 'END_TO_END_DERBY'
  ) => {
    if (preset === 'HOME_STAR_OUT') {
      setHomeStarAbsencePct(22);
      setAwayStarAbsencePct(0);
      setRedCardScenario('NONE');
      setPitchCondition('STANDARD');
      setTacticalTempo('BALANCED');
      setRefereeStrictness('STANDARD');
      toast.info(`Applied Scenario: ${homeTeam} Key Striker Out (-22% xG)`);
    } else if (preset === 'AWAY_RED_CARD') {
      setHomeStarAbsencePct(0);
      setAwayStarAbsencePct(0);
      setRedCardScenario('AWAY_10_MEN');
      setPitchCondition('STANDARD');
      setTacticalTempo('HIGH_PRESS');
      setRefereeStrictness('CARD_HAPPY');
      toast.info(`Applied Scenario: ${awayTeam} Early Red Card (10 Men)`);
    } else if (preset === 'MONSOON_LOW_BLOCK') {
      setHomeStarAbsencePct(0);
      setAwayStarAbsencePct(0);
      setRedCardScenario('NONE');
      setPitchCondition('HEAVY_RAIN');
      setTacticalTempo('LOW_BLOCK');
      setRefereeStrictness('LENIENT');
      toast.info('Applied Scenario: Heavy Rain + Deep Low-Block Park the Bus');
    } else if (preset === 'END_TO_END_DERBY') {
      setHomeStarAbsencePct(0);
      setAwayStarAbsencePct(0);
      setRedCardScenario('NONE');
      setPitchCondition('DRY_FAST');
      setTacticalTempo('ALL_OUT_ATTACK');
      setRefereeStrictness('CARD_HAPPY');
      toast.info('Applied Scenario: High-Line End-to-End Derby + Card-Happy Ref');
    }
  };

  const handleAddScenarioToSlip = () => {
    addSelection({
      id: `mc-${homeTeam}-${awayTeam}-${Date.now()}`,
      matchId: `mc-${homeTeam}-${awayTeam}`,
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league,
      kickoff: minuteElapsed > 0 ? `LIVE ${minuteElapsed}'` : 'Today',
      market: simResult.recommendedMarket,
      selection: simResult.recommendedMarket,
      odds: simResult.recommendedBookieOdds,
      confidence: simResult.recommendedProbPct,
    });
    toast.success(
      `Added ${simResult.recommendedMarket} (@ ${simResult.recommendedBookieOdds.toFixed(2)}) to Bet Slip!`
    );
  };

  const handleSyncToBankroll = () => {
    syncSlipToBankroll({
      source: 'MONTE_CARLO_SANDBOX',
      bookmaker: 'SportyBet / 1xBet',
      bookingCode: `MC-${Math.floor(1000 + Math.random() * 9000)}`,
      totalOdds: simResult.recommendedBookieOdds,
      suggestedStake: 25,
      kellyPct: simResult.kellyFractionPct,
      legs: [
        {
          match: `${homeTeam} vs ${awayTeam}`,
          market: simResult.recommendedMarket,
          odds: simResult.recommendedBookieOdds,
        },
      ],
    });
    toast.success('Synced Monte Carlo Scenario Pick to Bankroll Portfolio!');
  };

  const handleCopyTacticalReport = async () => {
    try {
      await navigator.clipboard.writeText(simResult.tacticalSummaryText);
      setCopiedReport(true);
      toast.success('Copied 10,000-Run Tactical Sandbox Report!');
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background border-border">
        <DialogHeader className="space-y-1.5 border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-mono text-[11px]">
                10,000-RUN MONTE CARLO SANDBOX
              </Badge>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                Computed in {simResult.executionTimeMs}ms
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Baseline
            </Button>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <span>
              What-If Tactical Simulator: {homeTeam} vs {awayTeam}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Stress-test this fixture against lineup absences, red cards, pitch conditions, and pressing tempo across 10,000 Bivariate Poisson-Gamma simulations.
          </DialogDescription>
        </DialogHeader>

        {/* Quick 1-Tap Scenario Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Quick Scenarios:
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyQuickPreset('HOME_STAR_OUT')}
            className="h-7 text-[11px] px-2.5"
          >
            {homeTeam} Striker Out (-22% xG)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyQuickPreset('AWAY_RED_CARD')}
            className="h-7 text-[11px] px-2.5"
          >
            {awayTeam} Early Red Card (10 Men)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyQuickPreset('MONSOON_LOW_BLOCK')}
            className="h-7 text-[11px] px-2.5"
          >
            Heavy Rain + Low Block
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyQuickPreset('END_TO_END_DERBY')}
            className="h-7 text-[11px] px-2.5"
          >
            High-Tempo Derby + Strict Ref
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* LEFT 5 COLS: Interactive Tactical Sliders & Toggles */}
          <div className="lg:col-span-5 space-y-4 rounded-xl border border-border bg-muted/20 p-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              1. Lineup &amp; Tactical Parameters
            </h3>

            {/* Home Star Absence Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="mc-home-absence" className="font-semibold text-foreground">
                  {homeTeam} Key Injury / Absence Impact
                </label>
                <span className="font-mono tabular-nums font-bold text-rose-500">
                  -{homeStarAbsencePct}% xG
                </span>
              </div>
              <input
                id="mc-home-absence"
                type="range"
                min={0}
                max={35}
                step={1}
                value={homeStarAbsencePct}
                onChange={(e) => setHomeStarAbsencePct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Full Strength XI (0%)</span>
                <span>Star Striker Out (-20%)</span>
                <span>2+ Key Out (-35%)</span>
              </div>
            </div>

            {/* Away Star Absence Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="mc-away-absence" className="font-semibold text-foreground">
                  {awayTeam} Key Injury / Absence Impact
                </label>
                <span className="font-mono tabular-nums font-bold text-rose-500">
                  -{awayStarAbsencePct}% xG
                </span>
              </div>
              <input
                id="mc-away-absence"
                type="range"
                min={0}
                max={35}
                step={1}
                value={awayStarAbsencePct}
                onChange={(e) => setAwayStarAbsencePct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Full Strength XI (0%)</span>
                <span>Playmaker Out (-20%)</span>
                <span>Depleted (-35%)</span>
              </div>
            </div>

            {/* Red Card Scenario */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Red Card / Dismissal State
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'NONE', label: '11 vs 11 (Normal)' },
                    { id: 'HOME_10_MEN', label: `${homeTeam} 10 Men` },
                    { id: 'AWAY_10_MEN', label: `${awayTeam} 10 Men` },
                    { id: 'BOTH_10_MEN', label: '10 vs 10 Open' },
                  ] as { id: RedCardScenario; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRedCardScenario(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                      redCardScenario === item.id
                        ? 'bg-rose-500/15 border-rose-500 text-rose-500 font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Tempo */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Tactical Pressing &amp; Game State Tempo
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'LOW_BLOCK', label: 'Low Block (-22% Goals)' },
                    { id: 'BALANCED', label: 'Balanced Tempo' },
                    { id: 'HIGH_PRESS', label: 'High Press (+15% Goals)' },
                    { id: 'ALL_OUT_ATTACK', label: 'End-to-End (+27% Goals)' },
                  ] as { id: TacticalTempoMode; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTacticalTempo(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                      tacticalTempo === item.id
                        ? 'bg-primary/15 border-primary text-primary font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch & Weather */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CloudRain className="h-3.5 w-3.5 text-sky-500" />
                Pitch Surface &amp; Weather Conditions
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'STANDARD', label: 'Standard Turf' },
                    { id: 'DRY_FAST', label: 'Fast Slick Pitch (+7%)' },
                    { id: 'HEAVY_RAIN', label: 'Heavy Rain (-16% xG)' },
                    { id: 'HIGH_ALTITUDE', label: 'High Altitude (+Home)' },
                  ] as { id: PitchWeatherCondition; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPitchCondition(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                      pitchCondition === item.id
                        ? 'bg-sky-500/15 border-sky-500 text-sky-500 font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Referee Strictness */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                Referee Card Strictness Profile
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'LENIENT', label: 'Lenient' },
                    { id: 'STANDARD', label: 'Standard' },
                    { id: 'CARD_HAPPY', label: 'Strict (+34%)' },
                  ] as { id: RefereeStrictnessMode; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRefereeStrictness(item.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      refereeStrictness === item.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-500 font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: 10,000-Run Simulation Output, 6x6 Matrix & Value Action */}
          <div className="lg:col-span-7 space-y-4">
            {/* Adjusted Expected Goals & Shifted 1X2 Bar */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    {homeTeam} Sim xG
                  </span>
                  <span className="font-mono tabular-nums font-black text-base text-foreground">
                    {simResult.adjustedHomeXg.toFixed(2)}
                  </span>
                  <span
                    className={`block text-[10px] font-mono tabular-nums font-bold ${
                      simResult.homeXgDeltaPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {simResult.homeXgDeltaPct >= 0 ? '+' : ''}
                    {simResult.homeXgDeltaPct}% vs base
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    {awayTeam} Sim xG
                  </span>
                  <span className="font-mono tabular-nums font-black text-base text-foreground">
                    {simResult.adjustedAwayXg.toFixed(2)}
                  </span>
                  <span
                    className={`block text-[10px] font-mono tabular-nums font-bold ${
                      simResult.awayXgDeltaPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {simResult.awayXgDeltaPct >= 0 ? '+' : ''}
                    {simResult.awayXgDeltaPct}% vs base
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    Over 2.5 / BTTS
                  </span>
                  <span className="font-mono tabular-nums font-black text-base text-emerald-500">
                    {simResult.over25Pct}% / {simResult.bttsYesPct}%
                  </span>
                  <span className="block text-[10px] font-mono tabular-nums text-muted-foreground">
                    Over 1.5: {simResult.over15Pct}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] uppercase text-muted-foreground block">
                    Corners / Cards
                  </span>
                  <span className="font-mono tabular-nums font-black text-base text-amber-500">
                    {simResult.expectedCorners} / {simResult.expectedYellowCards}
                  </span>
                  <span className="block text-[10px] font-mono tabular-nums text-muted-foreground">
                    Red Risk: {simResult.redCardRiskPct}%
                  </span>
                </div>
              </div>

              {/* 1X2 Probability Split Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="font-bold text-emerald-500">
                    1 ({homeTeam}): {simResult.homeWinPct}%
                  </span>
                  <span className="font-bold text-amber-500">Draw: {simResult.drawPct}%</span>
                  <span className="font-bold text-sky-500">
                    2 ({awayTeam}): {simResult.awayWinPct}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${simResult.homeWinPct}%` }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${simResult.drawPct}%` }}
                  />
                  <div
                    className="bg-sky-500 h-full transition-all"
                    style={{ width: `${simResult.awayWinPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top 5 Exact Scorelines + Goal Distribution Histogram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Top 5 Simulated Scorelines</span>
                  <span className="font-mono text-[10px] text-primary">6×6 Poisson</span>
                </p>
                <div className="space-y-1.5">
                  {simResult.topExactScores.map((sc, i) => (
                    <div
                      key={`${sc.homeGoals}-${sc.awayGoals}`}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          #{i + 1}
                        </span>
                        <span className="font-mono tabular-nums font-black text-foreground">
                          {sc.homeGoals} - {sc.awayGoals}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="font-bold text-emerald-500">{sc.probabilityPct}%</span>
                        <span className="text-[11px] text-muted-foreground">
                          ({sc.fairOdds.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Total Goals Distribution</span>
                  <span className="font-mono text-[10px] text-primary">n = 10,000</span>
                </p>
                <div className="space-y-1.5">
                  {simResult.goalDistribution.map((b) => (
                    <div key={b.label} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-foreground font-semibold">{b.label}</span>
                        <span className="text-muted-foreground">{b.probabilityPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(b.probabilityPct * 2.2, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sharpest Scenario Recommendation & 1-Click Actions */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">
                    Sharpest Post-Simulation Market Edge
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    {simResult.recommendedMarket}
                  </h4>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs font-bold text-emerald-500 block">
                    Sim Win Prob: {simResult.recommendedProbPct}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Bookie: {simResult.recommendedBookieOdds.toFixed(2)} · Fair:{' '}
                    {simResult.recommendedFairOdds.toFixed(2)} · Kelly:{' '}
                    {simResult.kellyFractionPct}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleAddScenarioToSlip}
                  className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Scenario Pick (@ {simResult.recommendedBookieOdds.toFixed(2)})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncToBankroll}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                  Sync to Bankroll Portfolio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyTacticalReport}
                  className="gap-1.5 text-xs font-semibold ml-auto"
                >
                  {copiedReport ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedReport ? 'Copied Report!' : 'Copy Tactical Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
