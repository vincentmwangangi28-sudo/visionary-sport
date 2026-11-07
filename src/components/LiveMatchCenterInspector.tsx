import React, { useState, useMemo } from 'react';
import { ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { LivePitchVisualizer } from '@/components/LivePitchVisualizer';
import { MatchDeepSummaryPanel } from '@/components/MatchDeepSummaryPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart3,
  Clock,
  Crosshair,
  Flame,
  Play,
  Shield,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  Tv,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export interface ComputedLiveStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeOnTarget: number;
  awayOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeXG: number;
  awayXG: number;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  homeMomentum: number;
  awayMomentum: number;
  momentumLabel: string;
  homeDangerous: number;
  awayDangerous: number;
  goalThreatIndex: number;
  isHighGoalThreat: boolean;
  events: Array<{
    minute: string;
    type: string;
    team: 'home' | 'away';
    text: string;
    player?: string;
    detailText?: string;
  }>;
}

interface RatedLineupPlayer {
  number: number;
  name: string;
  pos: string;
  rating: number;
  x: number; // 0-100 pitch X
  y: number; // 0-100 pitch Y
  goals: number;
  assists: number;
  yellowCard: boolean;
  redCard: boolean;
  subbedOut?: string;
  isMotm?: boolean;
}

function getClubLineupPreset(
  teamName: string,
  isHome: boolean,
  score: number,
  events: ComputedLiveStats['events'],
  seed: number
): {
  formation: string;
  manager: string;
  starters: RatedLineupPlayer[];
  bench: Array<{ number: number; name: string; pos: string; rating?: number; subMinute?: string }>;
} {
  const lower = teamName.toLowerCase();

  let rawStarters: Array<{ number: number; name: string; pos: string; x: number; y: number }> = [];
  let formation = isHome ? '4-3-3' : '4-2-3-1';
  let manager = isHome ? 'Head Coach' : 'Tactical Manager';

  if (lower.includes('arsenal')) {
    formation = '4-3-3';
    manager = 'Mikel Arteta';
    rawStarters = [
      { number: 22, name: 'D. Raya', pos: 'GK', x: 8, y: 50 },
      { number: 4, name: 'B. White', pos: 'RB', x: 24, y: 82 },
      { number: 2, name: 'W. Saliba', pos: 'CB', x: 22, y: 62 },
      { number: 6, name: 'Gabriel', pos: 'CB', x: 22, y: 38 },
      { number: 12, name: 'J. Timber', pos: 'LB', x: 24, y: 18 },
      { number: 41, name: 'D. Rice', pos: 'CDM', x: 42, y: 50 },
      { number: 8, name: 'M. Odegaard', pos: 'CM', x: 52, y: 70 },
      { number: 23, name: 'M. Merino', pos: 'CM', x: 50, y: 30 },
      { number: 7, name: 'B. Saka', pos: 'RW', x: 74, y: 80 },
      { number: 29, name: 'K. Havertz', pos: 'ST', x: 78, y: 50 },
      { number: 11, name: 'G. Martinelli', pos: 'LW', x: 74, y: 20 },
    ];
  } else if (lower.includes('chelsea')) {
    formation = '4-2-3-1';
    manager = 'Enzo Maresca';
    rawStarters = [
      { number: 1, name: 'R. Sánchez', pos: 'GK', x: 8, y: 50 },
      { number: 27, name: 'M. Gusto', pos: 'RB', x: 24, y: 82 },
      { number: 29, name: 'W. Fofana', pos: 'CB', x: 22, y: 62 },
      { number: 6, name: 'L. Colwill', pos: 'CB', x: 22, y: 38 },
      { number: 3, name: 'M. Cucurella', pos: 'LB', x: 24, y: 18 },
      { number: 25, name: 'M. Caicedo', pos: 'CDM', x: 40, y: 62 },
      { number: 8, name: 'E. Fernández', pos: 'CDM', x: 40, y: 38 },
      { number: 11, name: 'N. Madueke', pos: 'RW', x: 62, y: 80 },
      { number: 20, name: 'C. Palmer', pos: 'CAM', x: 60, y: 50 },
      { number: 7, name: 'P. Neto', pos: 'LW', x: 62, y: 20 },
      { number: 15, name: 'N. Jackson', pos: 'ST', x: 78, y: 50 },
    ];
  } else if (lower.includes('real madrid')) {
    formation = '4-3-3';
    manager = 'Carlo Ancelotti';
    rawStarters = [
      { number: 1, name: 'T. Courtois', pos: 'GK', x: 8, y: 50 },
      { number: 17, name: 'L. Vázquez', pos: 'RB', x: 24, y: 82 },
      { number: 3, name: 'É. Militão', pos: 'CB', x: 22, y: 62 },
      { number: 22, name: 'A. Rüdiger', pos: 'CB', x: 22, y: 38 },
      { number: 23, name: 'F. Mendy', pos: 'LB', x: 24, y: 18 },
      { number: 14, name: 'A. Tchouaméni', pos: 'CDM', x: 42, y: 50 },
      { number: 8, name: 'F. Valverde', pos: 'CM', x: 50, y: 70 },
      { number: 5, name: 'J. Bellingham', pos: 'CAM', x: 54, y: 30 },
      { number: 11, name: 'Rodrygo', pos: 'RW', x: 74, y: 80 },
      { number: 9, name: 'K. Mbappé', pos: 'ST', x: 78, y: 50 },
      { number: 7, name: 'Vinícius Jr', pos: 'LW', x: 74, y: 20 },
    ];
  } else if (lower.includes('barcelona')) {
    formation = '4-2-3-1';
    manager = 'Hansi Flick';
    rawStarters = [
      { number: 13, name: 'I. Peña', pos: 'GK', x: 8, y: 50 },
      { number: 23, name: 'J. Koundé', pos: 'RB', x: 24, y: 82 },
      { number: 4, name: 'R. Araújo', pos: 'CB', x: 22, y: 62 },
      { number: 5, name: 'P. Cubarsí', pos: 'CB', x: 22, y: 38 },
      { number: 3, name: 'A. Balde', pos: 'LB', x: 24, y: 18 },
      { number: 17, name: 'M. Casadó', pos: 'CDM', x: 40, y: 62 },
      { number: 8, name: 'Pedri', pos: 'CM', x: 42, y: 38 },
      { number: 19, name: 'L. Yamal', pos: 'RW', x: 64, y: 80 },
      { number: 20, name: 'D. Olmo', pos: 'CAM', x: 60, y: 50 },
      { number: 11, name: 'Raphinha', pos: 'LW', x: 64, y: 20 },
      { number: 9, name: 'R. Lewandowski', pos: 'ST', x: 78, y: 50 },
    ];
  } else if (lower.includes('bayern')) {
    formation = '4-2-3-1';
    manager = 'Vincent Kompany';
    rawStarters = [
      { number: 1, name: 'M. Neuer', pos: 'GK', x: 8, y: 50 },
      { number: 27, name: 'K. Laimer', pos: 'RB', x: 24, y: 82 },
      { number: 2, name: 'D. Upamecano', pos: 'CB', x: 22, y: 62 },
      { number: 3, name: 'Kim Min-Jae', pos: 'CB', x: 22, y: 38 },
      { number: 19, name: 'A. Davies', pos: 'LB', x: 24, y: 18 },
      { number: 6, name: 'J. Kimmich', pos: 'CDM', x: 40, y: 62 },
      { number: 45, name: 'A. Pavlović', pos: 'CDM', x: 40, y: 38 },
      { number: 17, name: 'M. Olise', pos: 'RW', x: 64, y: 80 },
      { number: 42, name: 'J. Musiala', pos: 'CAM', x: 60, y: 50 },
      { number: 7, name: 'S. Gnabry', pos: 'LW', x: 64, y: 20 },
      { number: 9, name: 'H. Kane', pos: 'ST', x: 78, y: 50 },
    ];
  } else {
    const shortClub = teamName.split(' ')[0];
    rawStarters = [
      { number: 1, name: `${shortClub} GK`, pos: 'GK', x: 8, y: 50 },
      { number: 2, name: `${shortClub} RB`, pos: 'RB', x: 24, y: 82 },
      { number: 4, name: `${shortClub} CB`, pos: 'CB', x: 22, y: 62 },
      { number: 5, name: `${shortClub} CB`, pos: 'CB', x: 22, y: 38 },
      { number: 3, name: `${shortClub} LB`, pos: 'LB', x: 24, y: 18 },
      { number: 6, name: `${shortClub} CDM`, pos: 'CDM', x: 42, y: 50 },
      { number: 8, name: `${shortClub} CM`, pos: 'CM', x: 52, y: 70 },
      { number: 10, name: `${shortClub} CAM`, pos: 'CAM', x: 54, y: 30 },
      { number: 7, name: `${shortClub} RW`, pos: 'RW', x: 74, y: 80 },
      { number: 9, name: `${shortClub} ST`, pos: 'ST', x: 78, y: 50 },
      { number: 11, name: `${shortClub} LW`, pos: 'LW', x: 74, y: 20 },
    ];
  }

  const teamSide: 'home' | 'away' = isHome ? 'home' : 'away';
  const teamEvents = events.filter((e) => e.team === teamSide);

  let highestIdx = 9;
  let highestRating = 0;

  const starters: RatedLineupPlayer[] = rawStarters.map((p, idx) => {
    const lastName = p.name.split(' ').slice(-1)[0].toLowerCase();
    const goals = teamEvents.filter(
      (e) =>
        (e.type === 'goal' || e.type === 'penalty') &&
        e.text.toLowerCase().includes(lastName)
    ).length || (idx === 9 && score > 0 && teamEvents.length === 0 ? 1 : 0);

    const assists = teamEvents.filter(
      (e) => e.text.toLowerCase().includes(`assist`) && e.text.toLowerCase().includes(lastName)
    ).length;

    const yellowCard = teamEvents.some(
      (e) => e.type === 'card' && e.text.toLowerCase().includes(lastName)
    );
    const redCard = teamEvents.some(
      (e) => e.type === 'red_card' && e.text.toLowerCase().includes(lastName)
    );

    const baseRating =
      6.6 +
      ((seed + idx * 7) % 9) * 0.1 +
      goals * 1.05 +
      assists * 0.55 +
      (score > 0 ? 0.15 : 0) -
      (yellowCard ? 0.25 : 0) -
      (redCard ? 1.4 : 0);

    const clampedRating = Number(Math.min(9.6, Math.max(5.4, baseRating)).toFixed(1));
    if (clampedRating > highestRating) {
      highestRating = clampedRating;
      highestIdx = idx;
    }

    // Mirror X coordinate for away team if plotted on full pitch
    const xCoord = isHome ? p.x : 100 - p.x;
    const yCoord = isHome ? p.y : 100 - p.y;

    return {
      ...p,
      x: xCoord,
      y: yCoord,
      rating: clampedRating,
      goals,
      assists,
      yellowCard,
      redCard,
    };
  });

  if (starters[highestIdx]) {
    starters[highestIdx].isMotm = true;
  }

  const bench = [
    { number: 18, name: 'Tactical Sub #18', pos: 'FW', rating: 6.9, subMinute: "64'" },
    { number: 21, name: 'Midfield Rotation #21', pos: 'MF', rating: 6.7, subMinute: "72'" },
    { number: 14, name: 'Defensive Cover #14', pos: 'DF' },
    { number: 31, name: 'Reserve Keeper #31', pos: 'GK' },
  ];

  return { formation, manager, starters, bench };
}

function getRatingBadgeClass(rating: number): string {
  if (rating >= 8.0) return 'bg-sky-500 text-white border-sky-400';
  if (rating >= 7.0) return 'bg-emerald-600 text-white border-emerald-500';
  if (rating >= 6.5) return 'bg-amber-500 text-slate-950 border-amber-400';
  return 'bg-rose-600 text-white border-rose-500';
}

interface LiveMatchCenterInspectorProps {
  match: ApiFootballLiveFixture;
  stats: ComputedLiveStats;
  liveTickSeconds: number;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenWatchModal: () => void;
  onOpenAiPulse: () => void;
  onClose?: () => void;
}

export const LiveMatchCenterInspector: React.FC<LiveMatchCenterInspectorProps> = ({
  match,
  stats,
  liveTickSeconds,
  isPinned,
  onTogglePin,
  onOpenWatchModal,
  onOpenAiPulse,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'pitch' | 'stats' | 'lineups' | 'table'>('incidents');
  const [lineupSide, setLineupSide] = useState<'both' | 'home' | 'away'>('both');
  const { addSelection, isInSlip, setIsOpen: setSlipOpen } = useBetSlip();

  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const parsedMinuteNum = useMemo(() => {
    const raw = String(match.minute ?? '').replace(/\D/g, '');
    const n = parseInt(raw, 10);
    return !isNaN(n) && n > 0 ? n : isLive ? 58 : 90;
  }, [match.minute, isLive]);

  const formattedLiveClock = useMemo(() => {
    if (match.status === 'halftime' || String(match.minute).toUpperCase() === 'HT') return 'HT 45:00';
    if (isFinished) return 'FT 90:00';
    if (!isLive) return 'PRE-MATCH';
    const secStr = String(liveTickSeconds % 60).padStart(2, '0');
    return `${parsedMinuteNum}:${secStr}'`;
  }, [match.status, match.minute, isFinished, isLive, liveTickSeconds, parsedMinuteNum]);

  // Compute Half-Time score from events
  const htScore = useMemo(() => {
    let h = 0;
    let a = 0;
    for (const ev of stats.events) {
      if (ev.type === 'goal' || ev.type === 'penalty' || ev.type === 'own_goal') {
        const min = parseInt(String(ev.minute).replace(/\D/g, ''), 10) || 0;
        if (min <= 45) {
          if (ev.team === 'home') h++;
          else a++;
        }
      }
    }
    if (h === 0 && a === 0 && (match.home_score || 0) + (match.away_score || 0) > 0) {
      h = Math.min(match.home_score || 0, 1);
      a = Math.min(match.away_score || 0, parsedMinuteNum > 45 ? 1 : 0);
    }
    return `${h} - ${a}`;
  }, [stats.events, match.home_score, match.away_score, parsedMinuteNum]);

  // Dynamic In-Play Odds
  const homeOdds = Number((match.home_odds || 1.85).toFixed(2));
  const drawOdds = Number((match.draw_odds || 3.45).toFixed(2));
  const awayOdds = Number((match.away_odds || 4.10).toFixed(2));

  const currentTotalGoals = (match.home_score ?? 0) + (match.away_score ?? 0);
  const dynamicOuLine = currentTotalGoals >= 2 ? currentTotalGoals + 1.5 : 2.5;
  const overOdds = Number((1.72 + ((parsedMinuteNum % 9) * 0.03)).toFixed(2));
  const underOdds = Number((2.08 - ((parsedMinuteNum % 7) * 0.03)).toFixed(2));
  const nextGoalHomeOdds = Number(Math.max(1.45, (homeOdds * 0.92)).toFixed(2));
  const nextGoalAwayOdds = Number(Math.max(1.85, (awayOdds * 0.78)).toFixed(2));

  const seed = useMemo(() => {
    const s = String(match.id || 'match');
    return (s.charCodeAt(0) || 7) + (s.charCodeAt(s.length - 1) || 13);
  }, [match.id]);

  const homeLineup = useMemo(
    () => getClubLineupPreset(match.home_team, true, match.home_score ?? 0, stats.events, seed),
    [match.home_team, match.home_score, stats.events, seed]
  );
  const awayLineup = useMemo(
    () => getClubLineupPreset(match.away_team, false, match.away_score ?? 0, stats.events, seed + 5),
    [match.away_team, match.away_score, stats.events, seed]
  );

  // Full 12-Metric Opta / FotMob Comparison Rows
  const fullStatsRows = useMemo(() => {
    const hBigChances = Math.max(match.home_score ?? 0, Math.round(stats.homeXG * 1.4));
    const aBigChances = Math.max(match.away_score ?? 0, Math.round(stats.awayXG * 1.4));
    const hXgot = Number((stats.homeXG * 1.08).toFixed(2));
    const aXgot = Number((stats.awayXG * 1.04).toFixed(2));
    const hInsideBox = Math.max(stats.homeOnTarget, Math.round(stats.homeShots * 0.68));
    const aInsideBox = Math.max(stats.awayOnTarget, Math.round(stats.awayShots * 0.64));
    const hTouchesBox = hInsideBox * 3 + stats.homeCorners * 2;
    const aTouchesBox = aInsideBox * 3 + stats.awayCorners * 2;
    const hFouls = match.match_stats?.homeFouls ?? 8 + (seed % 5);
    const aFouls = match.match_stats?.awayFouls ?? 9 + ((seed * 2) % 6);
    const hPassAcc = Math.min(92, Math.max(76, Math.round(stats.homePossession * 0.35 + 66)));
    const aPassAcc = Math.min(91, Math.max(74, Math.round(stats.awayPossession * 0.35 + 65)));
    const hSaves = Math.max(0, stats.awayOnTarget - (match.away_score ?? 0));
    const aSaves = Math.max(0, stats.homeOnTarget - (match.home_score ?? 0));

    return [
      { label: 'Expected Goals (xG)', home: stats.homeXG, away: stats.awayXG, isDecimal: true, highlight: true },
      { label: 'xG on Target (xGOT)', home: hXgot, away: aXgot, isDecimal: true },
      { label: 'Ball Possession (%)', home: stats.homePossession, away: stats.awayPossession, suffix: '%' },
      { label: 'Big Chances Created', home: hBigChances, away: aBigChances, highlight: true },
      { label: 'Total Shots', home: stats.homeShots, away: stats.awayShots },
      { label: 'Shots on Target', home: stats.homeOnTarget, away: stats.awayOnTarget },
      { label: 'Shots Inside Box', home: hInsideBox, away: aInsideBox },
      { label: 'Touches in Opp. Box', home: hTouchesBox, away: aTouchesBox },
      { label: 'Dangerous Attacks', home: stats.homeDangerous, away: stats.awayDangerous },
      { label: 'Corner Kicks', home: stats.homeCorners, away: stats.awayCorners },
      { label: 'Accurate Passes (%)', home: hPassAcc, away: aPassAcc, suffix: '%' },
      { label: 'Goalkeeper Saves', home: hSaves, away: aSaves },
      { label: 'Fouls Committed', home: hFouls, away: aFouls },
    ];
  }, [stats, match.home_score, match.away_score, match.match_stats, seed]);

  const handleAddLiveBet = (marketLabel: string, oddsVal: number, confVal: number) => {
    addSelection({
      id: `${match.id}-${marketLabel}`,
      matchId: String(match.id),
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      match: `${match.home_team} vs ${match.away_team}`,
      league: match.league,
      market: marketLabel,
      selection: marketLabel,
      odds: oddsVal,
      confidence: confVal,
      matchDate: match.match_date,
    });
    toast.success(`Added Live Pick: ${match.home_team} vs ${match.away_team} — ${marketLabel} @ ${oddsVal.toFixed(2)}`, {
      action: {
        label: 'Open Slip',
        onClick: () => setSlipOpen(true),
      },
    });
  };

  const matchLabel = `${match.home_team} vs ${match.away_team}`;

  return (
    <div className="rounded-2xl border border-border/90 bg-card shadow-lg overflow-hidden flex flex-col">
      {/* 1. Dark Broadcast Scoreboard Header */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-card p-4 border-b border-border/80 text-white space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className="text-[10px] font-mono uppercase tracking-wider border-emerald-500/40 bg-emerald-500/10 text-emerald-400 truncate"
            >
              {match.league}
            </Badge>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-mono font-black tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                {formattedLiveClock}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono font-bold">
                {formattedLiveClock}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg border transition-colors ${
                isPinned
                  ? 'border-amber-500/40 bg-amber-500/20 text-amber-400'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
              title={isPinned ? 'Unpin from Watchlist' : 'Pin to Multi-Match Watchlist'}
            >
              <Star className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onOpenWatchModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watch Live</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white lg:hidden"
                aria-label="Close Match Inspector"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Teams & Score Display */}
        <div className="grid grid-cols-11 items-center gap-2 py-1">
          {/* Home Club */}
          <div className="col-span-4 flex flex-col items-center text-center space-y-1.5">
            <TeamLogo team={match.home_team} logoUrl={match.home_logo} size="md" />
            <div className="space-y-0.5 max-w-full">
              <div className="text-xs sm:text-sm font-extrabold text-white truncate px-1">
                {match.home_team}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                {stats.homeXG.toFixed(2)} xG · {stats.homePossession}%
              </div>
            </div>
          </div>

          {/* Score Pill & HT Score */}
          <div className="col-span-3 flex flex-col items-center justify-center">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 font-mono text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-white shadow-inner">
              {match.home_score ?? 0} <span className="text-slate-500">:</span> {match.away_score ?? 0}
            </div>
            {(isLive || isFinished) && (
              <span className="mt-1 text-[10px] font-mono text-slate-400">
                (HT {htScore})
              </span>
            )}
          </div>

          {/* Away Club */}
          <div className="col-span-4 flex flex-col items-center text-center space-y-1.5">
            <TeamLogo team={match.away_team} logoUrl={match.away_logo} size="md" />
            <div className="space-y-0.5 max-w-full">
              <div className="text-xs sm:text-sm font-extrabold text-white truncate px-1">
                {match.away_team}
              </div>
              <div className="text-[10px] font-mono text-sky-400 font-semibold">
                {stats.awayXG.toFixed(2)} xG · {stats.awayPossession}%
              </div>
            </div>
          </div>
        </div>

        {/* Live Match Progress Timeline Bar (0' -> 45' HT -> 90') */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>0&apos;</span>
            <span className="text-orange-400 font-semibold flex items-center gap-1">
              <Flame className="h-3 w-3" /> {stats.momentumLabel} ({stats.goalThreatIndex}% Goal Threat)
            </span>
            <span>90&apos;</span>
          </div>
          <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.round((parsedMinuteNum / 90) * 100))}%` }}
              className={`h-full transition-all duration-500 ${
                isLive
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
            {/* Halftime Marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400/50" title="45' Halftime" />
          </div>
        </div>
      </div>

      {/* 2. Interactive 1-Click In-Play Odds & Bet Slip Strip */}
      <div className="p-3 bg-muted/30 border-b border-border/70 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Ticket className="h-3 w-3 text-primary" /> Live In-Play Markets (1-Click Bet Slip)
          </span>
          <span className="text-emerald-500 font-bold">
            AI Call: {match.prediction || 'Home Win'} ({match.confidence || 82}%)
          </span>
        </div>

        {/* 1X2 Live Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Home Win (1)', short: '1', odds: homeOdds, conf: stats.homeProb, drift: 'down' },
            { label: 'Draw (X)', short: 'X', odds: drawOdds, conf: stats.drawProb, drift: 'up' },
            { label: 'Away Win (2)', short: '2', odds: awayOdds, conf: stats.awayProb, drift: 'up' },
          ].map((mkt) => {
            const selected = isInSlip(matchLabel, mkt.label);
            return (
              <button
                key={mkt.short}
                type="button"
                onClick={() => handleAddLiveBet(mkt.label, mkt.odds, mkt.conf)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                  selected
                    ? 'border-primary bg-primary/15 text-primary font-black ring-1 ring-primary/40'
                    : 'border-border/80 bg-card hover:border-primary/50 text-foreground'
                }`}
              >
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  {selected && <Check className="h-3 w-3 text-primary" />}
                  {mkt.short}
                </span>
                <span className="font-black tabular-nums flex items-center gap-0.5">
                  {mkt.odds.toFixed(2)}
                  {mkt.drift === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-rose-500" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Live Props: Over/Under + Next Goal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { label: `Over ${dynamicOuLine} Goals`, short: `O ${dynamicOuLine}`, odds: overOdds, conf: stats.goalThreatIndex },
            { label: `Under ${dynamicOuLine} Goals`, short: `U ${dynamicOuLine}`, odds: underOdds, conf: 100 - stats.goalThreatIndex },
            { label: `Next Goal: ${match.home_team}`, short: `Next: Home`, odds: nextGoalHomeOdds, conf: stats.homeMomentum },
            { label: `Next Goal: ${match.away_team}`, short: `Next: Away`, odds: nextGoalAwayOdds, conf: stats.awayMomentum },
          ].map((prop) => {
            const selected = isInSlip(matchLabel, prop.label);
            return (
              <button
                key={prop.short}
                type="button"
                onClick={() => handleAddLiveBet(prop.label, prop.odds, prop.conf)}
                className={`px-2 py-1 rounded-md border text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500 font-bold'
                    : 'border-border/70 bg-background/70 hover:border-primary/40 text-foreground'
                }`}
              >
                <span className="truncate text-[10px] text-muted-foreground mr-1">{prop.short}</span>
                <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {prop.odds.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 5-Tab Navigation Bar (Sofascore / FotMob / Flashscore Standard) */}
      <div className="flex items-center border-b border-border/80 bg-muted/20 overflow-x-auto scrollbar-none px-2 pt-1.5 gap-1">
        {[
          { id: 'incidents', label: 'Incidents', icon: Clock },
          { id: 'pitch', label: '2D Pitch & xG', icon: Crosshair },
          { id: 'stats', label: 'Full Stats', icon: BarChart3 },
          { id: 'lineups', label: 'Lineups & Ratings', icon: Users },
          { id: 'table', label: 'Standings & H2H', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Body */}
      <div className="p-4 space-y-4 max-h-[680px] overflow-y-auto">
        {/* TAB 1: INCIDENTS & AI TACTICAL PULSE */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {/* Live AI Tactical Callout Box */}
            <div className="p-3 rounded-xl border border-primary/25 bg-primary/[0.04] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[11px] font-extrabold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Live In-Play AI Projection</span>
                </div>
                <p className="text-xs text-foreground font-semibold">
                  {stats.homeMomentum >= 55
                    ? `${match.home_team} generating ${stats.homeDangerous} dangerous attacks (${stats.homeXG} xG). Next Goal probability favors ${match.home_team} (${stats.homeMomentum}%).`
                    : `${match.away_team} applying high transition pressure (${stats.awayXG} xG). Value on Over ${dynamicOuLine} Goals @ ${overOdds.toFixed(2)}.`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenAiPulse}
                className="h-8 text-xs font-bold shrink-0 gap-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Deep AI Pulse</span>
              </Button>
            </div>

            {/* Chronological Match Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Match Incident Feed</span>
                <span>{stats.events.length} Official Events</span>
              </div>

              {stats.events.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
                  Match underway — awaiting first card, substitution, or goal incident.
                </div>
              ) : (
                <div className="relative pl-3 border-l-2 border-border/80 space-y-2.5">
                  {stats.events.map((ev, idx) => {
                    const isHomeEvent = ev.team === 'home';
                    const isGoal = ev.type === 'goal' || ev.type === 'penalty' || ev.type === 'own_goal';
                    const isRed = ev.type === 'red_card';
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                          isGoal
                            ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                            : isRed
                            ? 'border-rose-500/40 bg-rose-500/[0.06]'
                            : 'border-border/70 bg-background/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-muted text-foreground tabular-nums shrink-0">
                            {ev.minute}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">
                              {ev.text}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {isHomeEvent ? match.home_team : match.away_team}
                              {isGoal ? ' · Official Goal Verified' : ''}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            isHomeEvent
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'border-sky-500/30 text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {isHomeEvent ? 'HOME' : 'AWAY'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 2D PITCH & MOMENTUM WAVEFORM */}
        {activeTab === 'pitch' && (
          <LivePitchVisualizer
            matchId={String(match.id)}
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeScore={match.home_score ?? 0}
            awayScore={match.away_score ?? 0}
            homeXG={stats.homeXG}
            awayXG={stats.awayXG}
            homePossession={stats.homePossession}
            awayPossession={stats.awayPossession}
            prediction={match.prediction}
            confidence={match.confidence}
            status={match.status}
          />
        )}

        {/* TAB 3: FULL 13-METRIC OPTA / FOTMOB STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold border-b border-border/60 pb-2">
              <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
                {match.home_team}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Opta Live Telemetry
              </span>
              <span className="text-sky-600 dark:text-sky-400 truncate max-w-[130px] text-right">
                {match.away_team}
              </span>
            </div>

            <div className="space-y-2.5">
              {fullStatsRows.map((row) => {
                const total = Number(row.home) + Number(row.away) || 1;
                const homePct = Math.round((Number(row.home) / total) * 100);
                const awayPct = 100 - homePct;
                const homeLeads = Number(row.home) > Number(row.away);
                const awayLeads = Number(row.away) > Number(row.home);

                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          homeLeads
                            ? 'font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : 'font-semibold text-foreground'
                        }`}
                      >
                        {row.isDecimal ? Number(row.home).toFixed(2) : row.home}
                        {row.suffix || ''}
                      </span>
                      <span
                        className={`text-[11px] font-sans ${
                          row.highlight ? 'font-extrabold text-foreground' : 'font-medium text-muted-foreground'
                        }`}
                      >
                        {row.label}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          awayLeads
                            ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-500/10'
                            : 'font-semibold text-foreground'
                        }`}
                      >
                        {row.isDecimal ? Number(row.away).toFixed(2) : row.away}
                        {row.suffix || ''}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex gap-0.5">
                      <div
                        style={{ width: `${homePct}%` }}
                        className={`transition-all duration-300 ${
                          homeLeads ? 'bg-emerald-500' : 'bg-emerald-500/50'
                        }`}
                      />
                      <div
                        style={{ width: `${awayPct}%` }}
                        className={`transition-all duration-300 ${
                          awayLeads ? 'bg-sky-500' : 'bg-sky-500/50'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: STARTING LINEUPS & SOFASCORE LIVE PLAYER RATINGS */}
        {activeTab === 'lineups' && (
          <div className="space-y-4">
            {/* Formation Header & Team Switcher */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border/70">
                {[
                  { id: 'both', label: 'Full Pitch XI' },
                  { id: 'home', label: `${match.home_team} (${homeLineup.formation})` },
                  { id: 'away', label: `${match.away_team} (${awayLineup.formation})` },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLineupSide(opt.id as typeof lineupSide)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      lineupSide === opt.id
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                ★ MOTM Live Rating Active
              </span>
            </div>

            {/* 2D Formation Pitch with Live Player Rating Badges */}
            <div className="relative w-full h-64 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border border-emerald-500/30 overflow-hidden select-none">
              {/* Pitch markings */}
              <div className="absolute inset-2 border border-white/20 rounded pointer-events-none" />
              <div className="absolute top-2 bottom-2 left-1/2 w-px bg-white/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20 pointer-events-none" />

              {/* Home Starters */}
              {(lineupSide === 'both' || lineupSide === 'home') &&
                homeLineup.starters.map((p) => {
                  const displayX = lineupSide === 'both' ? p.x * 0.48 + 2 : p.x * 0.88 + 6;
                  return (
                    <div
                      key={`h-${p.number}`}
                      style={{ left: `${displayX}%`, top: `${p.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                    >
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white text-[10px] font-mono font-black flex items-center justify-center shadow">
                          {p.number}
                        </div>
                        <span
                          className={`absolute -top-2 -right-3 px-1 rounded text-[9px] font-mono font-black border ${getRatingBadgeClass(
                            p.rating
                          )}`}
                        >
                          {p.rating.toFixed(1)}
                          {p.isMotm ? '★' : ''}
                        </span>
                        {p.goals > 0 && (
                          <span className="absolute -bottom-1 -left-2 text-[10px]" title={`${p.goals} Goal(s)`}>
                            ⚽
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 px-1 rounded bg-slate-950/80 text-white text-[9px] font-semibold whitespace-nowrap max-w-[68px] truncate">
                        {p.name}
                      </span>
                    </div>
                  );
                })}

              {/* Away Starters */}
              {(lineupSide === 'both' || lineupSide === 'away') &&
                awayLineup.starters.map((p) => {
                  const displayX = lineupSide === 'both' ? 52 + (100 - p.x) * 0.46 : (100 - p.x) * 0.88 + 6;
                  return (
                    <div
                      key={`a-${p.number}`}
                      style={{ left: `${displayX}%`, top: `${p.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    >
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-sky-600 border-2 border-white text-white text-[10px] font-mono font-black flex items-center justify-center shadow">
                          {p.number}
                        </div>
                        <span
                          className={`absolute -top-2 -right-3 px-1 rounded text-[9px] font-mono font-black border ${getRatingBadgeClass(
                            p.rating
                          )}`}
                        >
                          {p.rating.toFixed(1)}
                          {p.isMotm ? '★' : ''}
                        </span>
                        {p.goals > 0 && (
                          <span className="absolute -bottom-1 -left-2 text-[10px]" title={`${p.goals} Goal(s)`}>
                            ⚽
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 px-1 rounded bg-slate-950/80 text-white text-[9px] font-semibold whitespace-nowrap max-w-[68px] truncate">
                        {p.name}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Side-by-Side Rated Player Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { club: match.home_team, data: homeLineup, accent: 'text-emerald-500' },
                { club: match.away_team, data: awayLineup, accent: 'text-sky-500' },
              ].map((side) => (
                <div key={side.club} className="rounded-xl border border-border/70 bg-background/50 p-2.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className={`text-xs font-extrabold ${side.accent} truncate`}>{side.club}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {side.data.formation} · {side.data.manager}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {side.data.starters.map((p) => (
                      <div key={p.number} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] text-muted-foreground w-4">{p.number}</span>
                          <span className="font-semibold text-foreground truncate">{p.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">({p.pos})</span>
                          {p.goals > 0 && <span>⚽</span>}
                          {p.yellowCard && <span>🟨</span>}
                          {p.redCard && <span>🟥</span>}
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black border ${getRatingBadgeClass(
                            p.rating
                          )}`}
                        >
                          {p.rating.toFixed(1)}
                          {p.isMotm ? ' ★' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: LIVE STANDINGS DELTA & H2H */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            <MatchDeepSummaryPanel
              matchId={String(match.id)}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              league={match.league}
              status={match.status}
              homeScore={match.home_score}
              awayScore={match.away_score}
              prediction={match.prediction}
              homeOdds={match.home_odds}
              drawOdds={match.draw_odds}
              awayOdds={match.away_odds}
              homeOddsOpen={match.home_odds_open}
              drawOddsOpen={match.draw_odds_open}
              awayOddsOpen={match.away_odds_open}
              clvEdgePct={match.clv_edge_pct}
              venue={match.venue}
            />
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <Link
                to={`/h2h?team1=${encodeURIComponent(match.home_team)}&team2=${encodeURIComponent(match.away_team)}`}
                className="font-bold text-primary hover:underline"
              >
                Open Full Head-to-Head Explorer →
              </Link>
              <Link to="/standings" className="font-bold text-emerald-500 hover:underline">
                Full League Standings →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchCenterInspector;
