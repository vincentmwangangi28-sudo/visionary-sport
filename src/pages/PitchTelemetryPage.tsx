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
  Clock,
  Crosshair,
  Flame,
  Plus,
  Radar,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  MATCH_PITCH_TELEMETRY_PACKAGES,
  MatchPitchTelemetryPackage,
  PitchShotEvent,
  FormationPlayerNode,
} from '@/services/pitchTelemetryAndXptsService';
import {
  isGoalHornAudioEnabled,
  setGoalHornAudioEnabled,
  playStadiumGoalHorn,
  playXgSteamPing,
  playRefereeWhistleAlert,
} from '@/services/goalHornAudioService';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export const PitchTelemetryPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    MATCH_PITCH_TELEMETRY_PACKAGES[0].id
  );
  const [activePitchTab, setActivePitchTab] = useState<'SHOT_MAP' | 'FORMATION_XI'>(
    'SHOT_MAP'
  );
  const [selectedShot, setSelectedShot] = useState<PitchShotEvent | null>(
    MATCH_PITCH_TELEMETRY_PACKAGES[0].shotMap[0]
  );
  const [selectedPlayer, setSelectedPlayer] = useState<FormationPlayerNode | null>(
    MATCH_PITCH_TELEMETRY_PACKAGES[0].homeLineup[8]
  );
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() =>
    isGoalHornAudioEnabled()
  );

  const match: MatchPitchTelemetryPackage = useMemo(() => {
    return (
      MATCH_PITCH_TELEMETRY_PACKAGES.find((m) => m.id === selectedMatchId) ||
      MATCH_PITCH_TELEMETRY_PACKAGES[0]
    );
  }, [selectedMatchId]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setGoalHornAudioEnabled(next);
    setAudioEnabled(next);
    if (next) {
      playStadiumGoalHorn();
      toast.success('Live Stadium Goal Horn & Whistle Audio Alerts ENABLED!');
    } else {
      toast.info('Goal Horn Audio Alerts Muted');
    }
  };

  const handleAddIntervalPick = (windowStr: string, probPct: number) => {
    const fairOdds = Number((100 / Math.max(probPct - 4, 20)).toFixed(2));
    addSelection({
      id: `int-${match.id}-${windowStr}`,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      kickoff: match.minuteLabel,
      market: `Goal Scored in ${windowStr} Window`,
      selection: `Goal in ${windowStr}`,
      odds: fairOdds,
      confidence: probPct,
    });
    toast.success(`Added Goal in ${windowStr} (@ ${fairOdds.toFixed(2)}) to Bet Slip!`);
  };

  const handleAddHtFtPick = (code: string, label: string, fairOdds: number, probPct: number) => {
    addSelection({
      id: `htft-${match.id}-${code}`,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      kickoff: match.minuteLabel,
      market: `HT/FT (${code}) — ${label}`,
      selection: code,
      odds: fairOdds,
      confidence: Math.round(probPct),
    });
    toast.success(`Added HT/FT ${code} (@ ${fairOdds.toFixed(2)}) to Bet Slip!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="90-Minute Attack Momentum Wave, 2D Pitch Shot Map & Formation XI Visualizer | PredictPro"
        description="Sofascore-style 90-minute Attack Momentum Wave, FotMob 2D xG Shot Map, 22-Player Tactical Formation Ratings, and Forebet 15-Minute Goal Interval Matrix."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 pt-6 pb-24 space-y-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: '4-Match Multi-View TV', href: '/live-multiview' },
            { label: 'Pitch Shot Map, Momentum Wave & Formation XI' },
          ]}
        />

        {/* Top Broadcast Header + Web Audio Goal Horn Controls */}
        <section className="rounded-2xl border border-emerald-500/30 bg-slate-950 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
                  SOFASCORE + FOTMOB + FOREBET VISUAL SUITE
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  90m Momentum Wave · 2D xG Shot Map · 22-Player 10.0 Ratings · 15m Goal Windows
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Interactive 2D Pitch Shot Map, Attack Momentum Wave &amp; Tactical XIs
              </h1>
            </div>

            {/* Web Audio API Goal Horn & Whistle Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleToggleAudio}
                className={`gap-1.5 text-xs font-bold h-9 ${
                  audioEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-900 border border-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                {audioEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
                {audioEnabled ? 'Goal Horn Audio: ON' : 'Enable Goal Horn Audio'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  playStadiumGoalHorn();
                  toast.success('⚽ GOAL HORN! Synthesized via Web Audio API');
                }}
                className="h-9 text-xs bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800"
              >
                Test Goal Horn
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  playRefereeWhistleAlert();
                  toast.info('🏁 Referee Double-Whistle Alert!');
                }}
                className="h-9 text-xs bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800"
              >
                Test Whistle
              </Button>
            </div>
          </div>

          {/* Match Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {MATCH_PITCH_TELEMETRY_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    setSelectedMatchId(pkg.id);
                    setSelectedShot(pkg.shotMap[0] || null);
                    setSelectedPlayer(pkg.homeLineup[8] || null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedMatchId === pkg.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>
                    {pkg.homeTeam} {pkg.scoreline} {pkg.awayTeam}
                  </span>
                  <span className="font-mono text-[10px] opacity-80">{pkg.minuteLabel}</span>
                </button>
              ))}
            </div>

            <Link to="/xpts-standings">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-slate-900 border-slate-700 text-sky-400 hover:bg-slate-800"
              >
                Open xPTS Justice Standings &rarr;
              </Button>
            </Link>
          </div>
        </section>

        {/* SECTION 1: Sofascore-Style 90-Minute Attack Momentum Wave */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  1. 90-Minute Attack Momentum Wave ({match.homeTeam} vs {match.awayTeam})
                </CardTitle>
                <CardDescription className="text-xs">
                  Positive emerald bars indicate {match.homeTeam} attacking dominance; negative sky-blue bars indicate {match.awayTeam} pressure surges.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                <span className="text-emerald-500 font-bold">
                  ■ {match.homeTeam} ({match.homeXg.toFixed(2)} xG)
                </span>
                <span className="text-sky-500 font-bold">
                  ■ {match.awayTeam} ({match.awayXg.toFixed(2)} xG)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
              <div className="relative h-36 flex items-center">
                {/* Center neutral axis line */}
                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-700 z-0" />

                <div className="w-full h-full flex items-center gap-[2px] z-10">
                  {match.momentumWave.map((bar) => {
                    const isHome = bar.value >= 0;
                    const heightPct = Math.min(Math.abs(bar.value) * 0.48, 48);
                    return (
                      <div
                        key={bar.minute}
                        title={
                          bar.eventLabel ||
                          `Minute ${bar.minute}’: ${isHome ? match.homeTeam : match.awayTeam} Momentum (${Math.abs(
                            bar.value
                          )})`
                        }
                        className="flex-1 h-full relative flex items-center justify-center group"
                      >
                        <div
                          style={{
                            height: `${heightPct}%`,
                            top: isHome ? `${50 - heightPct}%` : '50%',
                          }}
                          className={`w-full absolute rounded-xs transition-all ${
                            bar.event === 'HOME_GOAL' || bar.event === 'AWAY_GOAL'
                              ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                              : isHome
                              ? 'bg-emerald-500/90 group-hover:bg-emerald-400'
                              : 'bg-sky-500/90 group-hover:bg-sky-400'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline Minute Axis + Goal Event Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span>1&apos; Kickoff</span>
                <span>15&apos;</span>
                <span>30&apos;</span>
                <span>HT 45&apos;</span>
                <span>60&apos;</span>
                <span>75&apos;</span>
                <span>90&apos; FT</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2.5">
                {match.momentumWave
                  .filter((b) => b.eventLabel)
                  .map((ev) => (
                    <span
                      key={ev.minute}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-amber-400"
                    >
                      <span>⚽</span>
                      <span>{ev.eventLabel}</span>
                    </span>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Interactive 2D Pitch Shot Map & 22-Player Tactical Formation XI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-primary" />
                    2. Interactive 2D Pitch Telemetry Canvas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Switch between FotMob-style xG Shot Bubble Map and Sofascore-style 22-Player Formation Ratings.
                  </CardDescription>
                </div>

                <div className="inline-flex rounded-lg bg-muted p-1 border border-border">
                  <button
                    type="button"
                    onClick={() => setActivePitchTab('SHOT_MAP')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      activePitchTab === 'SHOT_MAP'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    2D xG Shot Map ({match.shotMap.length} Shots)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePitchTab('FORMATION_XI')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      activePitchTab === 'FORMATION_XI'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tactical Formation XIs ({match.homeFormation})
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* SVG Football Pitch */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-[#0b2919] shadow-inner">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Pitch Markings */}
                  <rect
                    x="2"
                    y="4"
                    width="96"
                    height="92"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="50"
                    y1="4"
                    x2="50"
                    y2="96"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="11"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.5"
                  />
                  {/* Left Penalty Box */}
                  <rect
                    x="2"
                    y="22"
                    width="15"
                    height="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.5"
                  />
                  {/* Right Penalty Box */}
                  <rect
                    x="83"
                    y="22"
                    width="15"
                    height="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.5"
                  />
                </svg>

                {/* Shot Map Bubbles */}
                {activePitchTab === 'SHOT_MAP' &&
                  match.shotMap.map((shot) => {
                    const sizePx = Math.max(16, Math.round(shot.xg * 44));
                    const isSelected = selectedShot?.id === shot.id;
                    return (
                      <button
                        key={shot.id}
                        type="button"
                        onClick={() => {
                          setSelectedShot(shot);
                          if (shot.outcome === 'GOAL') playXgSteamPing();
                        }}
                        style={{
                          left: `${shot.x}%`,
                          top: `${shot.y}%`,
                          width: `${sizePx}px`,
                          height: `${sizePx}px`,
                        }}
                        title={`${shot.player} (${shot.minute}’) · ${shot.xg.toFixed(2)} xG · ${shot.outcome}`}
                        className={`-translate-x-1/2 -translate-y-1/2 absolute rounded-full border-2 flex items-center justify-center font-mono text-[9px] font-black transition-transform hover:scale-125 cursor-pointer ${
                          shot.outcome === 'GOAL'
                            ? 'bg-emerald-400 text-slate-950 border-white shadow-[0_0_12px_#10b981]'
                            : shot.outcome === 'SAVED'
                            ? 'bg-amber-400/90 text-slate-950 border-amber-200'
                            : 'bg-slate-400/70 text-slate-950 border-slate-200'
                        } ${isSelected ? 'ring-4 ring-white scale-125 z-20' : 'z-10'}`}
                      >
                        {shot.outcome === 'GOAL' ? '⚽' : shot.xg.toFixed(2)}
                      </button>
                    );
                  })}

                {/* 22-Player Tactical Formation Nodes */}
                {activePitchTab === 'FORMATION_XI' && (
                  <>
                    {match.homeLineup.map((pl) => (
                      <button
                        key={`h-${pl.number}`}
                        type="button"
                        onClick={() => setSelectedPlayer(pl)}
                        style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
                        className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col items-center group cursor-pointer z-10"
                      >
                        <div className="h-7 w-7 rounded-full bg-emerald-500 text-slate-950 border-2 border-white font-mono text-[10px] font-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          {pl.number}
                        </div>
                        <span className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-950/90 text-white text-[10px] font-bold whitespace-nowrap">
                          {pl.name}{' '}
                          <strong className="text-emerald-400 font-mono">
                            {pl.rating.toFixed(1)}
                          </strong>
                        </span>
                      </button>
                    ))}
                    {match.awayLineup.map((pl) => (
                      <button
                        key={`a-${pl.number}`}
                        type="button"
                        onClick={() => setSelectedPlayer(pl)}
                        style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
                        className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col items-center group cursor-pointer z-10"
                      >
                        <div className="h-7 w-7 rounded-full bg-sky-400 text-slate-950 border-2 border-white font-mono text-[10px] font-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          {pl.number}
                        </div>
                        <span className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-950/90 text-white text-[10px] font-bold whitespace-nowrap">
                          {pl.name}{' '}
                          <strong className="text-sky-300 font-mono">
                            {pl.rating.toFixed(1)}
                          </strong>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Selected Shot or Player Inspector Strip */}
              {activePitchTab === 'SHOT_MAP' && selectedShot && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold">
                      {selectedShot.outcome} ({selectedShot.minute}&apos;)
                    </Badge>
                    <span className="font-black text-sm text-foreground">
                      {selectedShot.player}
                    </span>
                    <span className="text-muted-foreground">· {selectedShot.situation}</span>
                  </div>
                  <div className="font-mono tabular-nums flex items-center gap-4">
                    <span>
                      Shot Quality: <strong className="text-emerald-500">{selectedShot.xg.toFixed(2)} xG</strong>
                    </span>
                    <span>
                      Pitch Coord: ({selectedShot.x}, {selectedShot.y})
                    </span>
                  </div>
                </div>
              )}

              {activePitchTab === 'FORMATION_XI' && selectedPlayer && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold">
                      #{selectedPlayer.number} · {selectedPlayer.role}
                    </Badge>
                    <span className="font-black text-sm text-foreground">
                      {selectedPlayer.name}
                    </span>
                    {selectedPlayer.isMvp && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/40">
                        ★ Match MVP
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono tabular-nums flex items-center gap-4">
                    <span>
                      Sofascore Rating:{' '}
                      <strong className="text-emerald-500">
                        {selectedPlayer.rating.toFixed(1)} / 10.0
                      </strong>
                    </span>
                    <span>
                      xG Chain Contribution: <strong>{selectedPlayer.xgChain.toFixed(2)} xG</strong>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT 4 COLS: 5-Axis Team Attribute Radar Comparison */}
          <Card className="lg:col-span-4 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Radar className="h-4 w-4 text-emerald-500" />
                5-Axis Team Attribute Radar
              </CardTitle>
              <CardDescription className="text-xs">
                Head-to-head tactical percentile comparison (0–100 scale).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  {
                    label: 'Attacking xG Output',
                    home: match.homeRadar.attackingOutput,
                    away: match.awayRadar.attackingOutput,
                  },
                  {
                    label: 'Box Chance Creation',
                    home: match.homeRadar.chanceCreation,
                    away: match.awayRadar.chanceCreation,
                  },
                  {
                    label: 'High-Pressing Intensity (PPDA)',
                    home: match.homeRadar.pressingIntensity,
                    away: match.awayRadar.pressingIntensity,
                  },
                  {
                    label: 'Set-Piece & Corner Threat',
                    home: match.homeRadar.setPieceThreat,
                    away: match.awayRadar.setPieceThreat,
                  },
                  {
                    label: 'Defensive Box Solidity',
                    home: match.homeRadar.defensiveSolidity,
                    away: match.awayRadar.defensiveSolidity,
                  },
                ] as Array<{ label: string; home: number; away: number }>
              ).map((metric) => (
                <div key={metric.label} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono tabular-nums">
                    <span className="font-bold text-emerald-500">{metric.home}</span>
                    <span className="font-sans font-semibold text-foreground">
                      {metric.label}
                    </span>
                    <span className="font-bold text-sky-500">{metric.away}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 h-2.5">
                    <div className="bg-muted rounded-l-full overflow-hidden flex justify-end">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${metric.home}%` }}
                      />
                    </div>
                    <div className="bg-muted rounded-r-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full"
                        style={{ width: `${metric.away}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Forebet-Style 15-Minute Goal Interval Matrix + HT/FT 9-Way Transition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                3. 15-Minute Goal Interval Probability Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Exact 15-minute windows where {match.homeTeam} and {match.awayTeam} generate peak goal probabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {match.goalIntervals.map((intv) => (
                <div
                  key={intv.window}
                  className="p-2.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="w-20 shrink-0">
                    <span className="font-mono font-black text-sm text-foreground">
                      {intv.window}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono tabular-nums">
                      <span className="text-emerald-500">
                        {match.homeTeam}: {intv.homeScoringProbPct}%
                      </span>
                      <span className="font-bold text-foreground">
                        Combined Goal: {intv.combinedGoalProbPct}%
                      </span>
                      <span className="text-sky-500">
                        {match.awayTeam}: {intv.awayScoringProbPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${intv.combinedGoalProbPct}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAddIntervalPick(intv.window, intv.combinedGoalProbPct)
                    }
                    className="h-7 px-2.5 text-[11px] font-mono shrink-0"
                  >
                    +Slip
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-6 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-emerald-500" />
                4. HT / FT (Halftime / Fulltime) 9-Way Transition Grid
              </CardTitle>
              <CardDescription className="text-xs">
                Click any HT/FT transition cell to add it to your Bet Slip at fair Poisson odds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2.5">
                {match.htFtMatrix.map((cell) => (
                  <button
                    key={cell.code}
                    type="button"
                    onClick={() =>
                      handleAddHtFtPick(cell.code, cell.label, cell.fairOdds, cell.probPct)
                    }
                    className="p-3 rounded-xl border border-border bg-muted/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono tabular-nums">
                      <span className="font-black text-sm text-primary">{cell.code}</span>
                      <span className="text-xs font-bold text-emerald-500">
                        {cell.probPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{cell.label}</p>
                    <p className="font-mono tabular-nums text-xs font-bold text-foreground">
                      Fair: {cell.fairOdds.toFixed(2)}x
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PitchTelemetryPage;
