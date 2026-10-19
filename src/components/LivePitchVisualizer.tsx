import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Crosshair, TrendingUp, Shield, Activity, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface ShotEventPoint {
  id: string;
  team: 'home' | 'away';
  minute: number;
  x: number; // 0 to 100 along pitch length
  y: number; // 0 to 100 across pitch width
  xg: number;
  outcome: 'goal' | 'on_target' | 'blocked';
  player: string;
}

export interface MomentumInterval {
  period: '1-15\'' | '16-30\'' | '31-45\'' | '46-60\'' | '61-75\'' | '76-90\'';
  /** Positive = Home dominance (0 to 100), Negative = Away dominance (-100 to 0) */
  dominance: number;
  homeXgDelta: number;
  awayXgDelta: number;
  hasGoal?: 'home' | 'away' | null;
}

export interface LiveTableDelta {
  homeRank: number;
  homeRankDelta: number;
  homeLivePoints: number;
  awayRank: number;
  awayRankDelta: number;
  awayLivePoints: number;
}

export interface ModelCalibrationStatus {
  forecastLabel: string;
  confidence: number;
  status: 'hit' | 'on_track' | 'challenged';
  statusText: string;
  explanation: string;
}

interface LivePitchVisualizerProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeXG: number;
  awayXG: number;
  homePossession: number;
  awayPossession: number;
  prediction?: string;
  confidence?: number;
  status?: string;
}

export function computeTacticalPitchData(props: LivePitchVisualizerProps) {
  const safeId = String(props.matchId || 'match-01');
  const safeHome = String(props.homeTeam || 'Home Club');
  const safeAway = String(props.awayTeam || 'Away Club');
  const seed = (safeId.charCodeAt(0) || 7) + (safeId.charCodeAt(safeId.length - 1) || 13);

  // 3-Zone Field Tilt (%)
  const homeTilt = Math.min(72, Math.max(28, props.homePossession + ((seed % 9) - 4)));
  const middleZone = Math.min(46, Math.max(32, 38 + ((seed % 7) - 3)));
  const remaining = 100 - middleZone;
  const homeAttackZone = Math.round((remaining * homeTilt) / 100);
  const awayAttackZone = remaining - homeAttackZone;

  // Deterministic Shot Map Points
  const shots: ShotEventPoint[] = [];
  const totalHomeShots = Math.max(props.homeScore + 2, ((seed % 5) + 3));
  const totalAwayShots = Math.max(props.awayScore + 2, (((seed * 3) % 5) + 2));

  for (let i = 0; i < totalHomeShots; i++) {
    const isGoal = i < props.homeScore;
    const isOnTarget = isGoal || i % 2 === 0;
    const xg = isGoal
      ? Number((0.32 + ((i * 7 + seed) % 25) / 100).toFixed(2))
      : Number((0.06 + ((i * 11 + seed) % 18) / 100).toFixed(2));
    shots.push({
      id: `h-${i}`,
      team: 'home',
      minute: Math.min(89, 8 + i * 14 + (seed % 6)),
      // Home attacks right side of pitch (x: 72 to 95)
      x: isGoal ? 88 + (i % 6) : 74 + ((i * 9 + seed) % 18),
      y: 24 + ((i * 17 + seed) % 52),
      xg,
      outcome: isGoal ? 'goal' : isOnTarget ? 'on_target' : 'blocked',
      player: `${safeHome.split(' ')[0]} #${9 + (i % 4)}`,
    });
  }

  for (let i = 0; i < totalAwayShots; i++) {
    const isGoal = i < props.awayScore;
    const isOnTarget = isGoal || i % 2 === 1;
    const xg = isGoal
      ? Number((0.29 + ((i * 5 + seed) % 24) / 100).toFixed(2))
      : Number((0.05 + ((i * 13 + seed) % 16) / 100).toFixed(2));
    shots.push({
      id: `a-${i}`,
      team: 'away',
      minute: Math.min(89, 12 + i * 16 + (seed % 5)),
      // Away attacks left side of pitch (x: 5 to 28)
      x: isGoal ? 12 - (i % 5) : 10 + ((i * 11 + seed) % 18),
      y: 25 + ((i * 19 + seed) % 50),
      xg,
      outcome: isGoal ? 'goal' : isOnTarget ? 'on_target' : 'blocked',
      player: `${safeAway.split(' ')[0]} #${7 + (i % 5)}`,
    });
  }

  // 15-Minute Momentum Intervals
  const periods: MomentumInterval['period'][] = ['1-15\'', '16-30\'', '31-45\'', '46-60\'', '61-75\'', '76-90\''];
  const intervals: MomentumInterval[] = periods.map((period, idx) => {
    const wave = Math.sin(idx * 1.3 + seed) * 55 + (props.homePossession - 50) * 1.2;
    const dominance = Math.max(-88, Math.min(88, Math.round(wave)));
    const hasGoal =
      idx === 1 && props.homeScore > 0
        ? 'home'
        : idx === 2 && props.awayScore > 0
        ? 'away'
        : idx === 4 && props.homeScore > 1
        ? 'home'
        : idx === 5 && props.awayScore > 1
        ? 'away'
        : null;

    return {
      period,
      dominance,
      homeXgDelta: Number((Math.max(0.05, (dominance > 0 ? dominance : 15) * 0.005)).toFixed(2)),
      awayXgDelta: Number((Math.max(0.05, (dominance < 0 ? Math.abs(dominance) : 15) * 0.005)).toFixed(2)),
      hasGoal,
    };
  });

  // Live League Table Impact Delta
  const baseHomeRank = (seed % 12) + 2;
  const baseAwayRank = ((seed * 3) % 14) + 3;
  const homeRankDelta = props.homeScore > props.awayScore ? 2 : props.homeScore < props.awayScore ? -1 : 0;
  const awayRankDelta = props.awayScore > props.homeScore ? 2 : props.awayScore < props.homeScore ? -1 : 0;

  const tableDelta: LiveTableDelta = {
    homeRank: Math.max(1, baseHomeRank - homeRankDelta),
    homeRankDelta,
    homeLivePoints: 34 + (seed % 18) + (props.homeScore > props.awayScore ? 3 : props.homeScore === props.awayScore ? 1 : 0),
    awayRank: Math.max(1, baseAwayRank - awayRankDelta),
    awayRankDelta,
    awayLivePoints: 31 + ((seed * 2) % 16) + (props.awayScore > props.homeScore ? 3 : props.homeScore === props.awayScore ? 1 : 0),
  };

  // Pre-Match Forecast vs Live Reality Calibration
  const forecast = props.prediction || 'Home Win (1)';
  const conf = props.confidence || 76;
  const totalGoals = props.homeScore + props.awayScore;
  const fLower = forecast.toLowerCase();

  let status: ModelCalibrationStatus['status'] = 'on_track';
  let statusText = 'Trajectory On Track';
  let explanation = `Live xG (${props.homeXG} - ${props.awayXG}) aligns with pre-match statistical model projection.`;

  if (fLower.includes('over 2.5')) {
    if (totalGoals >= 3) {
      status = 'hit';
      statusText = 'Forecast Verified ✓';
      explanation = `${totalGoals} total goals already scored, validating the Over 2.5 Goals projection.`;
    } else if (totalGoals === 2 || props.homeXG + props.awayXG >= 2.1) {
      status = 'on_track';
      statusText = `${3 - totalGoals} Goal Needed`;
      explanation = `Combined live xG is ${(props.homeXG + props.awayXG).toFixed(2)} with high final-third box entries.`;
    } else {
      status = 'challenged';
      statusText = 'Below Projected Tempo';
      explanation = `Need ${3 - totalGoals} more goals; current xG accumulation is slower than baseline.`;
    }
  } else if (fLower.includes('btts') || fLower.includes('both teams')) {
    if (props.homeScore > 0 && props.awayScore > 0) {
      status = 'hit';
      statusText = 'Forecast Verified ✓';
      explanation = 'Both clubs have scored in regulation play.';
    } else {
      status = 'on_track';
      statusText = 'Awaiting Counter Goal';
      explanation = `Both sides generating shots on target (${props.homeXG} vs ${props.awayXG} xG).`;
    }
  } else if (fLower.includes('away') || fLower === '2') {
    if (props.awayScore > props.homeScore) {
      status = 'hit';
      statusText = 'Leading In-Play ✓';
      explanation = `${props.awayTeam} holds the lead (${props.awayScore}-${props.homeScore}) with ${props.awayXG} xG.`;
    } else if (props.awayScore === props.homeScore) {
      status = 'on_track';
      statusText = 'Level — Pressing';
      explanation = `Match tied ${props.homeScore}-${props.awayScore}; ${props.awayTeam} generating ${props.awayXG} xG.`;
    } else {
      status = 'challenged';
      statusText = 'Trailing In-Play';
      explanation = `${props.awayTeam} trails despite ${props.awayXG} expected goals created.`;
    }
  } else {
    // Default Home Win / 1X
    if (props.homeScore > props.awayScore) {
      status = 'hit';
      statusText = 'Leading In-Play ✓';
      explanation = `${props.homeTeam} leads ${props.homeScore}-${props.awayScore} backed by ${props.homeXG} xG.`;
    } else if (props.homeScore === props.awayScore && fLower.includes('1x')) {
      status = 'hit';
      statusText = '1X Cushion Active ✓';
      explanation = `Current ${props.homeScore}-${props.awayScore} scoreline satisfies Double Chance (1X) parameters.`;
    } else if (props.homeScore === props.awayScore) {
      status = 'on_track';
      statusText = 'Level — High Pressure';
      explanation = `${props.homeTeam} pushing with ${homeTilt}% field tilt and ${props.homeXG} xG.`;
    } else {
      status = 'challenged';
      statusText = 'Chasing Equalizer';
      explanation = `${props.homeTeam} trailing ${props.homeScore}-${props.awayScore} while creating ${props.homeXG} xG.`;
    }
  }

  const calibration: ModelCalibrationStatus = {
    forecastLabel: forecast,
    confidence: conf,
    status,
    statusText,
    explanation,
  };

  const homeMvpRating = Number(Math.min(9.6, 7.2 + props.homeScore * 0.65 + props.homeXG * 0.35).toFixed(1));
  const awayMvpRating = Number(Math.min(9.5, 7.0 + props.awayScore * 0.65 + props.awayXG * 0.35).toFixed(1));

  const playerRatings = {
    homeFormation: seed % 2 === 0 ? '4-3-3 High Press' : '4-2-3-1 Vertical',
    awayFormation: seed % 2 === 0 ? '4-2-3-1 Midblock' : '3-4-2-1 Transition',
    homePlayers: [
      { name: `${safeHome.split(' ')[0]} #9 (ST)`, rating: homeMvpRating, metric: `${(props.homeXG * 0.52).toFixed(2)} xG · ${Math.max(1, props.homeScore)} G` },
      { name: `${safeHome.split(' ')[0]} #10 (CAM)`, rating: Number(Math.max(6.8, homeMvpRating - 0.4).toFixed(1)), metric: '3 Key Passes · 91% Pass' },
      { name: `${safeHome.split(' ')[0]} #6 (CDM)`, rating: Number(Math.max(6.7, homeMvpRating - 0.6).toFixed(1)), metric: '8 Duels Won · 4 Recoveries' },
    ],
    awayPlayers: [
      { name: `${safeAway.split(' ')[0]} #7 (RW)`, rating: awayMvpRating, metric: `${(props.awayXG * 0.48).toFixed(2)} xG · ${Math.max(0, props.awayScore)} G` },
      { name: `${safeAway.split(' ')[0]} #8 (CM)`, rating: Number(Math.max(6.7, awayMvpRating - 0.4).toFixed(1)), metric: '5 Progressive Carries' },
      { name: `${safeAway.split(' ')[0]} #4 (CB)`, rating: Number(Math.max(6.6, awayMvpRating - 0.6).toFixed(1)), metric: '6 Clearances · 3 Blocks' },
    ],
  };

  return {
    homeTilt,
    awayTilt: 100 - homeTilt,
    zones: {
      awayThird: awayAttackZone,
      middleThird: middleZone,
      homeThird: homeAttackZone,
    },
    shots,
    intervals,
    tableDelta,
    calibration,
    playerRatings,
  };
}

export const LivePitchVisualizer: React.FC<LivePitchVisualizerProps> = (props) => {
  const [selectedShot, setSelectedShot] = useState<ShotEventPoint | null>(null);
  const data = computeTacticalPitchData(props);

  return (
    <div className="space-y-3" data-testid="live-pitch-visualizer">
      {/* 1. 2D SVG Tactical Pitch & Shot Map */}
      <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold flex items-center gap-1.5 text-foreground">
            <Crosshair className="h-3.5 w-3.5 text-emerald-500" />
            2D Tactical Pitch Control &amp; Live xG Shot Map
          </span>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-white/50" /> Goal
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> On Target
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400/70 inline-block" /> Blocked/Wide
            </span>
          </div>
        </div>

        {/* SVG Football Pitch */}
        <div className="relative w-full rounded-xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-950/90">
          <svg
            viewBox="0 0 100 56"
            className="w-full h-36 sm:h-44 block select-none"
            role="img"
            aria-label={`2D Shot Map and Field Tilt for ${props.homeTeam} vs ${props.awayTeam}`}
          >
            {/* Pitch Turf Stripes */}
            {[0, 20, 40, 60, 80].map((stripeX) => (
              <rect
                key={stripeX}
                x={stripeX}
                y={0}
                width={10}
                height={56}
                fill="rgba(255,255,255,0.025)"
              />
            ))}

            {/* Outer Boundary Lines */}
            <rect x="2" y="2" width="96" height="52" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />
            {/* Halfway Line */}
            <line x1="50" y1="2" x2="50" y2="54" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />
            {/* Center Circle */}
            <circle cx="50" cy="28" r="7.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />
            <circle cx="50" cy="28" r="0.8" fill="rgba(255,255,255,0.45)" />

            {/* Thirds Divider Dashed Lines */}
            <line x1="34" y1="2" x2="34" y2="54" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" strokeDasharray="1.5,1.5" />
            <line x1="66" y1="2" x2="66" y2="54" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" strokeDasharray="1.5,1.5" />

            {/* Left Penalty Area (Home Defending / Away Attacking) */}
            <rect x="2" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />
            <rect x="2" y="20" width="5" height="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />

            {/* Right Penalty Area (Away Defending / Home Attacking) */}
            <rect x="84" y="13" width="14" height="30" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />
            <rect x="93" y="20" width="5" height="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />

            {/* Zone Control Labels on Pitch */}
            <text x="18" y="8" fill="rgba(255,255,255,0.55)" fontSize="2.7" fontWeight="bold" textAnchor="middle">
              {props.awayTeam.slice(0, 10)} Attack ({data.zones.awayThird}%)
            </text>
            <text x="50" y="8" fill="rgba(255,255,255,0.55)" fontSize="2.7" fontWeight="bold" textAnchor="middle">
              Midfield ({data.zones.middleThird}%)
            </text>
            <text x="82" y="8" fill="rgba(255,255,255,0.55)" fontSize="2.7" fontWeight="bold" textAnchor="middle">
              {props.homeTeam.slice(0, 10)} Attack ({data.zones.homeThird}%)
            </text>

            {/* Plotted Shot Markers */}
            {data.shots.map((shot) => {
              const radius = Math.max(1.4, Math.min(3.2, shot.xg * 6.5));
              const fill =
                shot.outcome === 'goal'
                  ? '#10b981'
                  : shot.outcome === 'on_target'
                  ? '#fbbf24'
                  : 'rgba(148, 163, 184, 0.75)';
              const stroke = shot.team === 'home' ? '#ffffff' : '#38bdf8';

              return (
                <g
                  key={shot.id}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => setSelectedShot(shot)}
                >
                  <circle
                    cx={shot.x}
                    cy={(shot.y / 100) * 52 + 2}
                    r={radius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={shot.outcome === 'goal' ? '0.7' : '0.4'}
                  />
                  {shot.outcome === 'goal' && (
                    <circle
                      cx={shot.x}
                      cy={(shot.y / 100) * 52 + 2}
                      r={radius + 1.1}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.35"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected Shot Tooltip Overlay */}
          {selectedShot ? (
            <div className="px-3 py-1.5 bg-background/95 border-t border-border/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedShot.minute}&apos;
                </Badge>
                <span className="font-bold text-foreground">{selectedShot.player}</span>
                <span className="text-muted-foreground">
                  ({selectedShot.outcome === 'goal' ? '⚽ Goal' : selectedShot.outcome === 'on_target' ? 'Shot on Target' : 'Blocked / Off-Target'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedShot.xg} xG
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedShot(null)}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1 bg-black/30 text-[10px] text-emerald-100/80 flex items-center justify-between">
              <span>← {props.awayTeam} Attacking Direction</span>
              <span className="hidden sm:inline">Tap any shot circle on pitch to inspect xG</span>
              <span>{props.homeTeam} Attacking Direction →</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. 15-Minute Interval Momentum Timeline & Model Calibration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 15-Minute Interval Pressure Chart */}
        <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold flex items-center gap-1.5 text-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" />
              15-Min Phase Dominance &amp; xG Flow
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Field Tilt: {data.homeTilt}% / {data.awayTilt}%
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {data.intervals.map((item) => {
              const isHomeDom = item.dominance >= 0;
              const heightPct = Math.max(18, Math.min(100, Math.abs(item.dominance)));
              return (
                <div key={item.period} className="flex flex-col items-center space-y-1">
                  <div className="h-14 w-full rounded-md bg-muted/40 border border-border/50 flex flex-col justify-end p-1 relative overflow-hidden">
                    {item.hasGoal && (
                      <span
                        className="absolute top-0.5 right-0.5 text-[9px]"
                        title={`Goal in ${item.period}`}
                      >
                        ⚽
                      </span>
                    )}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-xs transition-all ${
                        isHomeDom
                          ? 'bg-emerald-500/85'
                          : 'bg-sky-500/85'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">{item.period}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" /> {props.homeTeam} Phase Control
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-sky-500 inline-block" /> {props.awayTeam} Phase Control
            </span>
          </div>
        </div>

        {/* Pre-Match AI Model Calibration & Live Table Impact */}
        <div className="p-3 rounded-xl bg-card border border-border/80 flex flex-col justify-between space-y-2.5">
          {/* Model Calibration Tracker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold flex items-center gap-1.5 text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Pre-Match Model vs. Live Reality
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  data.calibration.status === 'hit'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : data.calibration.status === 'on_track'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {data.calibration.status === 'hit' ? (
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                ) : (
                  <Clock className="h-3 w-3 mr-1 inline" />
                )}
                {data.calibration.statusText}
              </Badge>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Pre-Match Call: {data.calibration.forecastLabel}</span>
                <span className="font-mono text-primary">{data.calibration.confidence}% Conf</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                {data.calibration.explanation}
              </p>
            </div>
          </div>

          {/* Live Standings Impact */}
          <div className="pt-1.5 border-t border-border/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" /> Projected Live Standings Impact
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 border border-border/40">
                <span className="font-semibold truncate max-w-[90px]">{props.homeTeam}</span>
                <span className="font-mono text-[10px] flex items-center gap-1">
                  #{data.tableDelta.homeRank} ({data.tableDelta.homeLivePoints} pts)
                  {data.tableDelta.homeRankDelta > 0 ? (
                    <span className="text-emerald-500 font-bold inline-flex items-center">
                      <ArrowUpRight className="h-3 w-3" />+{data.tableDelta.homeRankDelta}
                    </span>
                  ) : data.tableDelta.homeRankDelta < 0 ? (
                    <span className="text-rose-500 font-bold inline-flex items-center">
                      <ArrowDownRight className="h-3 w-3" />{data.tableDelta.homeRankDelta}
                    </span>
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 border border-border/40">
                <span className="font-semibold truncate max-w-[90px]">{props.awayTeam}</span>
                <span className="font-mono text-[10px] flex items-center gap-1">
                  #{data.tableDelta.awayRank} ({data.tableDelta.awayLivePoints} pts)
                  {data.tableDelta.awayRankDelta > 0 ? (
                    <span className="text-emerald-500 font-bold inline-flex items-center">
                      <ArrowUpRight className="h-3 w-3" />+{data.tableDelta.awayRankDelta}
                    </span>
                  ) : data.tableDelta.awayRankDelta < 0 ? (
                    <span className="text-rose-500 font-bold inline-flex items-center">
                      <ArrowDownRight className="h-3 w-3" />{data.tableDelta.awayRankDelta}
                    </span>
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SofaScore / FotMob 0.0-10.0 Live Player Ratings & Tactical Formations */}
      <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-foreground">
            Top Match Player Ratings (0.0–10.0 Algorithmic Index)
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Formations: {props.homeTeam} ({data.playerRatings.homeFormation}) vs {props.awayTeam} ({data.playerRatings.awayFormation})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            {data.playerRatings.homePlayers.map((hp, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/25 border border-border/50 text-[11px]"
              >
                <div className="min-w-0">
                  <span className="font-bold text-foreground block truncate">{hp.name}</span>
                  <span className="text-[10px] text-muted-foreground">{hp.metric}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-black shrink-0">
                  {hp.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {data.playerRatings.awayPlayers.map((ap, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/25 border border-border/50 text-[11px]"
              >
                <div className="min-w-0">
                  <span className="font-bold text-foreground block truncate">{ap.name}</span>
                  <span className="text-[10px] text-muted-foreground">{ap.metric}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-sky-600 text-white font-mono text-[10px] font-black shrink-0">
                  {ap.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
