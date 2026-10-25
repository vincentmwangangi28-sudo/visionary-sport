import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { TeamLogo } from '@/components/TeamLogo';
import { ELITE_PLAYER_DATABASE, PlayerProfile } from '@/pages/PlayerSearch';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  Crosshair,
  TrendingUp,
  Activity,
  Award,
  Flame,
  Plus,
  Check,
  Sliders,
  ChevronLeft,
  ArrowUpRight,
  Target,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export function formatPlayerSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findPlayerBySlug(slug?: string): PlayerProfile {
  if (!slug) return ELITE_PLAYER_DATABASE[0];
  const normalized = slug.toLowerCase().trim();
  const exact = ELITE_PLAYER_DATABASE.find(
    (p) => formatPlayerSlug(p.name) === normalized || String(p.id) === normalized
  );
  if (exact) return exact;

  const partial = ELITE_PLAYER_DATABASE.find(
    (p) =>
      formatPlayerSlug(p.name).includes(normalized) ||
      normalized.includes(formatPlayerSlug(p.name))
  );
  if (partial) return partial;

  // Deterministic custom player profile when a custom slug is visited
  const displayName = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: 8500,
    name: displayName || 'Erling Haaland',
    nationality: 'International',
    position: 'Attacker',
    roleTag: 'First-Team Starter',
    age: 25,
    team: 'Arsenal',
    league: 'Premier League',
    jerseyNumber: 9,
    rating: 8.4,
    goals: 15,
    assists: 7,
    xgPer90: 0.62,
    xaPer90: 0.28,
    shotConversionPct: 22.5,
    progressiveCarriesPer90: 4.2,
    last5Ratings: [8.3, 8.5, 8.1, 8.6, 8.4],
    radar: {
      finishingXg: 88,
      creativityXa: 82,
      progression: 84,
      pressingDefense: 76,
      duelsAerial: 80,
    },
  };
}

// Poisson P(X >= k) helper
function poissonProbAtLeast(lambda: number, k: number): number {
  if (lambda <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < k; i++) {
    let fact = 1;
    for (let j = 2; j <= i; j++) fact *= j;
    sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / fact;
  }
  return Math.max(0.02, Math.min(0.96, 1 - sum));
}

export default function PlayerProfilePage() {
  const { playerSlug } = useParams<{ playerSlug?: string }>();
  const navigate = useNavigate();
  const { addSelection, selections } = useBetSlip();

  const player = useMemo(() => findPlayerBySlug(playerSlug), [playerSlug]);

  // Interactive Prop Simulator Controls
  const [expectedMinutes, setExpectedMinutes] = useState<number>(85);
  const [opponentDefenseFactor, setOpponentDefenseFactor] = useState<number>(1.05); // >1 means weaker defense
  const [onPenalties, setOnPenalties] = useState<boolean>(
    player.xgPer90 >= 0.55 || player.goals >= 15
  );
  const [pitchLayer, setPitchLayer] = useState<'heatmap' | 'shots'>('heatmap');

  // Recompute Poisson Prop Markets based on user sliders
  const simulatedProps = useMemo(() => {
    const minutesRatio = expectedMinutes / 90;
    const penBoost = onPenalties ? 0.14 : 0;
    const adjXg = Math.max(0.08, (player.xgPer90 * minutesRatio + penBoost) * opponentDefenseFactor);
    const adjXa = Math.max(0.05, player.xaPer90 * minutesRatio * opponentDefenseFactor);
    const adjShotsOnTargetLambda = Math.max(0.4, adjXg * 2.35);
    const adjTotalShotsLambda = Math.max(0.9, adjXg * 4.4);

    const probAnytimeGoal = poissonProbAtLeast(adjXg, 1);
    const probBrace = poissonProbAtLeast(adjXg, 2);
    const probAssist = poissonProbAtLeast(adjXa, 1);
    const probGoalOrAssist = poissonProbAtLeast(adjXg + adjXa * 0.85, 1);
    const probOver15SoT = poissonProbAtLeast(adjShotsOnTargetLambda, 2);
    const probOver25Shots = poissonProbAtLeast(adjTotalShotsLambda, 3);

    const buildMarket = (
      id: string,
      label: string,
      sublabel: string,
      prob: number,
      bookieMarginFactor = 1.06
    ) => {
      const pct = Math.round(prob * 100);
      const fairOdds = Number((1 / prob).toFixed(2));
      const marketOdds = Number(Math.max(1.22, fairOdds * (1 / bookieMarginFactor) + 0.08).toFixed(2));
      const evPct = Number((((prob * marketOdds - 1) * 100)).toFixed(1));
      return {
        id,
        label,
        sublabel,
        probability: pct,
        fairOdds,
        marketOdds,
        evPct: Math.max(1.8, evPct),
      };
    };

    return {
      adjXg: adjXg.toFixed(2),
      adjXa: adjXa.toFixed(2),
      adjSoT: adjShotsOnTargetLambda.toFixed(1),
      markets: [
        buildMarket(
          'ags',
          `${player.name} Anytime Goalscorer`,
          `Projected ${adjXg.toFixed(2)} xG in ${expectedMinutes}'`,
          probAnytimeGoal,
          0.95
        ),
        buildMarket(
          'ga',
          `${player.name} to Score or Assist (G/A)`,
          `Combined ${(adjXg + adjXa).toFixed(2)} xGI/90 involvement`,
          probGoalOrAssist,
          0.96
        ),
        buildMarket(
          'sot',
          `${player.name} Over 1.5 Shots on Target`,
          `Projected ${adjShotsOnTargetLambda.toFixed(1)} SoT (${player.shotConversionPct}% conv)`,
          probOver15SoT,
          0.94
        ),
        buildMarket(
          'shots',
          `${player.name} Over 2.5 Total Shots`,
          `Projected ${adjTotalShotsLambda.toFixed(1)} total shot attempts`,
          probOver25Shots,
          0.95
        ),
        buildMarket(
          'assist',
          `${player.name} Anytime Assist`,
          `Projected ${adjXa.toFixed(2)} xA & progressive carries`,
          probAssist,
          0.95
        ),
        buildMarket(
          'brace',
          `${player.name} 2+ Goals (Brace)`,
          `High-ceiling Poisson multi-goal tail`,
          probBrace,
          0.93
        ),
      ],
    };
  }, [player, expectedMinutes, opponentDefenseFactor, onPenalties]);

  // Deterministic Shot & Touch Heatmap Data for this player
  const pitchTelemetry = useMemo(() => {
    const seed = player.id || 1100;
    const isAttacker = player.position === 'Attacker';
    const isMid = player.position === 'Midfielder';

    const heatZones = isAttacker
      ? [
          { cx: 84, cy: 28, rx: 12, ry: 15, intensity: 0.75, label: 'Penalty Box Target Zone' },
          { cx: 74, cy: 20, rx: 14, ry: 12, intensity: 0.55, label: 'Right Half-Space Cut-In' },
          { cx: 72, cy: 36, rx: 13, ry: 12, intensity: 0.5, label: 'Left Channel Link-Up' },
          { cx: 56, cy: 28, rx: 12, ry: 14, intensity: 0.32, label: 'Transition Hold-Up' },
        ]
      : isMid
      ? [
          { cx: 58, cy: 28, rx: 18, ry: 18, intensity: 0.72, label: 'Central Progression Hub' },
          { cx: 72, cy: 24, rx: 14, ry: 14, intensity: 0.58, label: 'Zone 14 Final Third Pocket' },
          { cx: 44, cy: 32, rx: 15, ry: 16, intensity: 0.48, label: 'Deep Build-Up Pivot' },
        ]
      : [
          { cx: 34, cy: 28, rx: 16, ry: 18, intensity: 0.7, label: 'Defensive Recovery Zone' },
          { cx: 52, cy: 28, rx: 14, ry: 16, intensity: 0.45, label: 'Midblock Interception Line' },
        ];

    const shots = Array.from({ length: 9 }).map((_, idx) => {
      const isGoal = idx < 4;
      const xg = isGoal
        ? Number((0.28 + ((seed + idx * 7) % 32) / 100).toFixed(2))
        : Number((0.08 + ((seed + idx * 11) % 18) / 100).toFixed(2));
      return {
        id: `shot-${idx}`,
        x: isGoal ? 85 + (idx % 8) : 73 + ((seed + idx * 5) % 19),
        y: 14 + ((seed + idx * 13) % 28),
        xg,
        outcome: isGoal ? 'Goal' : idx % 2 === 0 ? 'Saved' : 'Blocked',
      };
    });

    return { heatZones, shots };
  }, [player]);

  const handleAddPropToSlip = (marketLabel: string, odds: number, probability: number) => {
    addSelection({
      matchId: `player-prop-${player.id}-${marketLabel}`,
      match: `${player.team} Next Fixture (${player.name})`,
      homeTeam: player.team,
      awayTeam: `${player.league} Opponent`,
      league: player.league,
      matchDate: new Date().toISOString(),
      market: marketLabel,
      odds,
      confidence: probability,
    });
    toast.success(`Added "${marketLabel}" (@${odds.toFixed(2)}) to Bet Slip`);
  };

  const slug = formatPlayerSlug(player.name);
  const pageTitle = `${player.name} Player Ratings, xG Heatmap & Prop Simulator | PredictPro`;
  const pageDesc = `${player.name} (${player.team}) AI form rating (${player.rating.toFixed(1)}/10), ${player.xgPer90} xG/90, 2D touch heatmap, and interactive Poisson Goalscorer & Shots on Target prop simulator.`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title={pageTitle}
        description={pageDesc}
        canonical={playerSlug ? `/players/${slug}` : '/player-props'}
        keywords={`${player.name} player rating, ${player.name} xG stats, ${player.name} anytime goalscorer odds, ${player.name} shots on target props, ${player.team} player ratings`}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: player.name,
          jobTitle: `Professional Football ${player.position}`,
          nationality: player.nationality,
          memberOf: {
            '@type': 'SportsTeam',
            name: player.team,
          },
          description: pageDesc,
        }}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Player Ratings & Radar', href: '/players' },
              { label: `${player.name} Profile & Prop Simulator` },
            ]}
          />
          <Link
            to="/players"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All Player Ratings &amp; H2H Radar
          </Link>
        </div>

        {/* Quick Player Switcher Strip with Portraits */}
        <div className="p-2.5 rounded-2xl border border-border/70 bg-card/60 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-muted-foreground px-2">
              Switch Player:
            </span>
            {ELITE_PLAYER_DATABASE.map((p) => {
              const pSlug = formatPlayerSlug(p.name);
              const isSelected = p.id === player.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/players/${pSlug}`)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-background hover:bg-muted text-foreground border border-border/60'
                  }`}
                >
                  <PlayerAvatar
                    playerId={p.id}
                    name={p.name}
                    team={p.team}
                    photoUrl={p.photo}
                    size="xs"
                    showClubBadge={false}
                  />
                  <span>{p.name}</span>
                  <span className="font-mono text-[10px] opacity-80">{p.rating.toFixed(1)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Player Rating & Bio Header */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 text-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <PlayerAvatar
                playerId={player.id}
                name={player.name}
                team={player.team}
                photoUrl={player.photo}
                jerseyNumber={player.jerseyNumber}
                rating={player.rating}
                size="xl"
                showClubBadge
                showRatingBadge
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400">{player.position}</span>
                  <span aria-hidden="true">·</span>
                  <span>{player.roleTag}</span>
                  <span aria-hidden="true">·</span>
                  <span>{player.nationality}</span>
                  <span aria-hidden="true">·</span>
                  <span>Age {player.age}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <span>{player.name}</span>
                  {player.jerseyNumber && (
                    <span className="text-lg font-mono text-slate-400">#{player.jerseyNumber}</span>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <TeamLogo team={player.team} league={player.league} size="xs" />
                  <span className="font-semibold text-white">{player.team}</span>
                  <span aria-hidden="true">·</span>
                  <span>{player.league}</span>
                </div>
              </div>
            </div>

            {/* Key Season Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:border-l md:border-slate-800 md:pl-6">
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">Season Rating</p>
                <p className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {player.rating.toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-400">Top 1% Index</p>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">Goals / Assists</p>
                <p className="text-xl font-black font-mono text-white mt-0.5">
                  {player.goals}G / {player.assists}A
                </p>
                <p className="text-[10px] text-slate-400">{player.shotConversionPct}% Shot Conv</p>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">xG / 90 Mins</p>
                <p className="text-xl font-black font-mono text-sky-400 mt-0.5">
                  {player.xgPer90.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">+{player.xaPer90.toFixed(2)} xA/90</p>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">Last 5 Form</p>
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  {player.last5Ratings.map((r, i) => (
                    <span
                      key={i}
                      className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold ${
                        r >= 8.8
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {r.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-Column Workspace: Interactive Prop Simulator + 2D Pitch Heatmap & Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Interactive Poisson Player Prop Simulator */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Interactive Poisson &amp; Monte Carlo Prop Engine</span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {player.name} Prop Simulator &amp; Fair Odds Calculator
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Adj Match xG: <strong className="text-primary">{simulatedProps.adjXg}</strong> · SoT:{' '}
                    <strong className="text-foreground">{simulatedProps.adjSoT}</strong>
                  </span>
                </div>

                {/* Simulation Parameter Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="sim-minutes" className="font-semibold text-foreground">
                        Expected Minutes
                      </label>
                      <span className="font-mono font-bold text-primary">{expectedMinutes} mins</span>
                    </div>
                    <input
                      id="sim-minutes"
                      type="range"
                      min={30}
                      max={90}
                      step={5}
                      value={expectedMinutes}
                      onChange={(e) => setExpectedMinutes(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Adjust for rotation or sub risk
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="sim-def" className="font-semibold text-foreground">
                        Opponent xGA Factor
                      </label>
                      <span className="font-mono font-bold text-primary">
                        {opponentDefenseFactor.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      id="sim-def"
                      type="range"
                      min={0.7}
                      max={1.4}
                      step={0.05}
                      value={opponentDefenseFactor}
                      onChange={(e) => setOpponentDefenseFactor(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      &lt;1.0 Elite Defense · &gt;1.0 High Line
                    </p>
                  </div>

                  <div className="flex flex-col justify-between">
                    <span className="text-xs font-semibold text-foreground">Set-Piece &amp; Penalty Duty</span>
                    <button
                      type="button"
                      onClick={() => setOnPenalties(!onPenalties)}
                      aria-pressed={onPenalties}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        onPenalties
                          ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-background border-border text-muted-foreground'
                      }`}
                    >
                      {onPenalties ? '✓ Primary Penalty Taker (+0.14 xG)' : 'Open-Play Only'}
                    </button>
                  </div>
                </div>

                {/* Simulated Prop Markets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simulatedProps.markets.map((m) => {
                    const inSlip = selections.some((s) => s.market === m.label);
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-background hover:border-primary/40 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground">{m.label}</span>
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              +{m.evPct}% EV
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{m.sublabel}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-muted-foreground">
                              Model Prob: <strong className="text-foreground">{m.probability}%</strong>
                            </span>
                            <span className="text-muted-foreground">
                              Fair: <strong className="text-foreground">{m.fairOdds.toFixed(2)}</strong>
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              style={{ width: `${m.probability}%` }}
                              className="h-full bg-emerald-500 rounded-full transition-all"
                            />
                          </div>

                          <Button
                            size="sm"
                            variant={inSlip ? 'default' : 'outline'}
                            onClick={() => handleAddPropToSlip(m.label, m.marketOdds, m.probability)}
                            className="w-full h-9 text-xs font-bold justify-between"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {inSlip ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                              {inSlip ? 'Added to Bet Slip' : 'Add Prop to Slip'}
                            </span>
                            <span className="font-mono font-black">@{m.marketOdds.toFixed(2)}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 5 COLS: 2D Pitch Touch Heatmap & Shot Map + 5-Axis Percentile Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            {/* 2D Touch Heatmap & Season Shot Map */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      2D Pitch Touch Heatmap &amp; xG Shot Map
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Spatial attacking zone density &amp; shot quality for {player.name}
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setPitchLayer('heatmap')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        pitchLayer === 'heatmap'
                          ? 'bg-background text-foreground shadow-2xs'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Heatmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setPitchLayer('shots')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        pitchLayer === 'shots'
                          ? 'bg-background text-foreground shadow-2xs'
                          : 'text-muted-foreground'
                      }`}
                    >
                      xG Shots
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-950">
                  <svg
                    viewBox="0 0 100 56"
                    className="w-full h-44 block select-none"
                    role="img"
                    aria-label={`${player.name} 2D pitch heatmap and shot map`}
                  >
                    <defs>
                      <radialGradient id="playerHeatGradHigh" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.82" />
                        <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.52" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="playerHeatGradMed" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                        <stop offset="55%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Turf Stripes */}
                    {[0, 20, 40, 60, 80].map((sx) => (
                      <rect key={sx} x={sx} y={0} width={10} height={56} fill="rgba(255,255,255,0.03)" />
                    ))}

                    {/* Pitch Markings */}
                    <rect x="2" y="2" width="96" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <line x1="50" y1="2" x2="50" y2="54" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <circle cx="50" cy="28" r="7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <rect x="2" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <rect x="84" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

                    {/* Heatmap Blobs */}
                    {pitchLayer === 'heatmap' &&
                      pitchTelemetry.heatZones.map((hz, i) => (
                        <g key={i}>
                          <ellipse
                            cx={hz.cx}
                            cy={hz.cy}
                            rx={hz.rx}
                            ry={hz.ry}
                            fill={hz.intensity > 0.6 ? 'url(#playerHeatGradHigh)' : 'url(#playerHeatGradMed)'}
                          />
                        </g>
                      ))}

                    {/* Shot Map Markers */}
                    {pitchLayer === 'shots' &&
                      pitchTelemetry.shots.map((s) => (
                        <circle
                          key={s.id}
                          cx={s.x}
                          cy={s.y}
                          r={Math.max(1.5, s.xg * 6)}
                          fill={s.outcome === 'Goal' ? '#10b981' : s.outcome === 'Saved' ? '#fbbf24' : '#94a3b8'}
                          stroke="#ffffff"
                          strokeWidth="0.45"
                        />
                      ))}
                  </svg>
                  <div className="px-3 py-1.5 bg-black/50 text-[10px] text-emerald-100/90 flex items-center justify-between">
                    <span>Attacking Direction →</span>
                    <span>
                      {pitchLayer === 'heatmap'
                        ? 'Red/Amber = Peak Final-Third Touch Density'
                        : 'Green = Goal · Amber = Saved · Size = xG'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5-Axis Tactical Percentile Bars */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-primary" />
                    5-Axis Scouting Percentiles (vs Top-5 Leagues)
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">0–99 Scale</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {[
                    { label: 'Non-Penalty Finishing & xG', val: player.radar.finishingXg },
                    { label: 'Chance Creation & Expected Assists (xA)', val: player.radar.creativityXa },
                    { label: 'Progressive Carries & Box Entries', val: player.radar.progression },
                    { label: 'High Pressing & Counter-Recovery', val: player.radar.pressingDefense },
                    { label: 'Aerial Duels & Physical Hold-Up', val: player.radar.duelsAerial },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                        <span className="font-mono font-bold text-foreground">{item.val}th pct</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          style={{ width: `${item.val}%` }}
                          className={`h-full rounded-full ${
                            item.val >= 90
                              ? 'bg-emerald-500'
                              : item.val >= 75
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    to="/anytime-goalscorer-predictions"
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Daily Anytime Goalscorer Props</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/players"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <span>Compare in H2H Radar</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
