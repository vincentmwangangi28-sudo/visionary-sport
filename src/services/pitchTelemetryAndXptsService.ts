import type { Prediction, RealMatchEvent, RealMatchStats } from '@/types/prediction';

export interface MomentumMinuteBar {
  minute: number;
  value: number; // -100 (Away dominance) to +100 (Home dominance)
  event?: 'HOME_GOAL' | 'AWAY_GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'XG_SURGE';
  eventLabel?: string;
}

export interface PitchShotEvent {
  id: string;
  team: 'HOME' | 'AWAY';
  player: string;
  minute: number;
  x: number; // 0 to 100
  y: number; // 0 to 100
  xg: number;
  outcome: 'GOAL' | 'SAVED' | 'BLOCKED' | 'OFF_TARGET';
  situation: 'Open Play' | 'Set Piece' | 'Counter Attack' | 'Penalty' | 'Header';
}

export interface FormationPlayerNode {
  number: number;
  name: string;
  role: string;
  x: number;
  y: number;
  rating: number;
  xgChain: number;
  hasGoal?: boolean;
  hasAssist?: boolean;
  hasYellow?: boolean;
  isMvp?: boolean;
}

export interface FiveAxisRadarMetrics {
  attackingOutput: number;
  chanceCreation: number;
  pressingIntensity: number;
  setPieceThreat: number;
  defensiveSolidity: number;
}

export interface MatchPitchTelemetryPackage {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  scoreline: string;
  minuteLabel: string;
  homeFormation: string;
  awayFormation: string;
  homeXg: number;
  awayXg: number;
  momentumWave: MomentumMinuteBar[];
  shotMap: PitchShotEvent[];
  homeLineup: FormationPlayerNode[];
  awayLineup: FormationPlayerNode[];
  homeRadar: FiveAxisRadarMetrics;
  awayRadar: FiveAxisRadarMetrics;
  goalIntervals: Array<{
    window: '1-15’' | '16-30’' | '31-45’' | '46-60’' | '61-75’' | '76-90+’';
    homeScoringProbPct: number;
    awayScoringProbPct: number;
    combinedGoalProbPct: number;
  }>;
  htFtMatrix: Array<{
    code: '1/1' | 'X/1' | '2/1' | '1/X' | 'X/X' | '2/X' | '1/2' | 'X/2' | '2/2';
    label: string;
    probPct: number;
    fairOdds: number;
  }>;
}

export interface XptsTeamStandingRow {
  club: string;
  league: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  actualPoints: number;
  actualRank: number;
  xGF: number;
  xGA: number;
  xGD: number;
  xPTS: number;
  justiceRank: number;
  justiceDelta: number;
  homePoints: number;
  awayPoints: number;
  firstHalfPoints: number;
  last5Form: Array<'W' | 'D' | 'L'>;
  regressionSignal: 'STRONG BUY (UNLUCKY)' | 'FAIR VALUE' | 'FADE ALERT (OVERPERFORMING)';
  nextFixtureMatch?: string;
  nextFixtureOpponent?: string;
  nextFixtureKickoff?: string;
  nextFixtureMarket: string;
  nextFixtureOdds: number;
}

// Emptied: telemetry and xPTS standings are built dynamically from live/upcoming API data
export const MATCH_PITCH_TELEMETRY_PACKAGES: MatchPitchTelemetryPackage[] = [];
export const XPTS_JUSTICE_STANDINGS: XptsTeamStandingRow[] = [];

export interface TelemetrySourceMatch {
  id: string;
  home_team: string;
  away_team: string;
  league?: string;
  competition?: string;
  status?: string;
  minute?: number | string | null;
  home_score?: number | null;
  away_score?: number | null;
  match_date?: string;
  match_stats?: RealMatchStats;
  match_events?: RealMatchEvent[];
  ai_prediction?: {
    predicted_winner?: string;
    confidence?: number;
    home_win_prob?: number;
    draw_prob?: number;
    away_win_prob?: number;
    over_25_prob?: number;
    btts_prob?: number;
    predicted_score?: string;
    odds_home?: number;
    odds_draw?: number;
    odds_away?: number;
  };
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const HOME_FORMATION_SLOTS: Array<{ number: number; role: string; x: number; y: number }> = [
  { number: 1, role: 'GK', x: 7, y: 50 },
  { number: 2, role: 'RB', x: 21, y: 82 },
  { number: 4, role: 'CB', x: 18, y: 62 },
  { number: 5, role: 'CB', x: 18, y: 38 },
  { number: 3, role: 'LB', x: 21, y: 18 },
  { number: 6, role: 'CDM', x: 32, y: 50 },
  { number: 8, role: 'CM', x: 37, y: 70 },
  { number: 10, role: 'CAM', x: 36, y: 30 },
  { number: 7, role: 'RW', x: 45, y: 80 },
  { number: 9, role: 'ST', x: 47, y: 50 },
  { number: 11, role: 'LW', x: 45, y: 20 },
];

const AWAY_FORMATION_SLOTS: Array<{ number: number; role: string; x: number; y: number }> = [
  { number: 1, role: 'GK', x: 93, y: 50 },
  { number: 2, role: 'RB', x: 79, y: 18 },
  { number: 4, role: 'CB', x: 82, y: 38 },
  { number: 5, role: 'CB', x: 82, y: 62 },
  { number: 3, role: 'LB', x: 79, y: 82 },
  { number: 6, role: 'CDM', x: 67, y: 40 },
  { number: 8, role: 'CM', x: 67, y: 60 },
  { number: 7, role: 'RW', x: 58, y: 22 },
  { number: 10, role: 'CAM', x: 60, y: 50 },
  { number: 11, role: 'LW', x: 58, y: 78 },
  { number: 9, role: 'ST', x: 53, y: 50 },
];

export function buildPitchTelemetryFromMatch(m: TelemetrySourceMatch): MatchPitchTelemetryPackage {
  const homeTeam = m.home_team || 'Home Team';
  const awayTeam = m.away_team || 'Away Team';
  const league = m.league || m.competition || 'League Match';
  const seed = hashSeed(`${m.id}-${homeTeam}-${awayTeam}`);

  const isLive = m.status === 'live' || m.status === 'halftime';
  const isFinished = m.status === 'finished';
  const hScore = m.home_score ?? 0;
  const aScore = m.away_score ?? 0;
  const rawMin = parseInt(String(m.minute ?? '').replace(/\D/g, ''), 10) || (m.status === 'halftime' ? 45 : isLive ? 60 : isFinished ? 90 : 0);
  const waveMinutes = isLive ? Math.max(15, Math.min(90, rawMin)) : 90;

  const hProb = (m.ai_prediction?.home_win_prob ?? 44) / 100;
  const aProb = (m.ai_prediction?.away_win_prob ?? 28) / 100;
  const dProb = Math.max(0.14, 1 - hProb - aProb);

  const st = m.match_stats;
  const homeXg = st?.homeShots
    ? Number((st.homeShots * 0.11 + (st.homeOnTarget || 3) * 0.15 + hScore * 0.25).toFixed(2))
    : Number((1.05 + hProb * 1.45 + (seed % 7) * 0.05).toFixed(2));
  const awayXg = st?.awayShots
    ? Number((st.awayShots * 0.11 + (st.awayOnTarget || 2) * 0.15 + aScore * 0.25).toFixed(2))
    : Number((0.85 + aProb * 1.35 + ((seed >> 3) % 7) * 0.05).toFixed(2));

  const realEvents = Array.isArray(m.match_events) ? m.match_events : [];
  const goalEventByMinute = new Map<number, RealMatchEvent>();
  for (const ev of realEvents) {
    const evMin = parseInt(String(ev.minute ?? '').replace(/\D/g, ''), 10);
    if (evMin > 0) goalEventByMinute.set(evMin, ev);
  }

  const momentumWave: MomentumMinuteBar[] = Array.from({ length: waveMinutes }, (_, idx) => {
    const min = idx + 1;
    const ev = goalEventByMinute.get(min);
    if (ev) {
      const isHomeEv =
        (ev.team || '').toLowerCase() === homeTeam.toLowerCase() || ev.team === 'home';
      const isGoal = (ev.type || '').toLowerCase().includes('goal');
      return {
        minute: min,
        value: isHomeEv ? 88 : -88,
        event: isGoal ? (isHomeEv ? 'HOME_GOAL' : 'AWAY_GOAL') : 'XG_SURGE',
        eventLabel: `${min}’ ${ev.player || (isHomeEv ? homeTeam : awayTeam)} (${ev.type})`,
      };
    }
    const bias = (hProb - aProb) * 45;
    const raw =
      Math.sin((min + (seed % 11)) * 0.21) * 48 +
      Math.cos((min + (seed % 7)) * 0.09) * 24 +
      bias;
    return {
      minute: min,
      value: Math.max(-95, Math.min(95, Math.round(raw))),
    };
  });

  const shotMap: PitchShotEvent[] = [];
  const hShotCount = Math.min(6, Math.max(3, st?.homeOnTarget ?? Math.round(homeXg * 2.5)));
  const aShotCount = Math.min(5, Math.max(2, st?.awayOnTarget ?? Math.round(awayXg * 2.5)));
  for (let i = 0; i < hShotCount; i++) {
    const isGoal = i < hScore;
    const evMatch = realEvents.find(
      (e, idx) =>
        idx === i &&
        ((e.team || '').toLowerCase() === homeTeam.toLowerCase() || e.team === 'home')
    );
    shotMap.push({
      id: `${m.id}-hs-${i}`,
      team: 'HOME',
      player: evMatch?.player || `${homeTeam} #${7 + (i % 4)}`,
      minute: parseInt(String(evMatch?.minute ?? (14 + i * 13)), 10) || 18 + i * 12,
      x: 76 + ((seed + i * 7) % 18),
      y: 30 + ((seed + i * 13) % 40),
      xg: Number((isGoal ? 0.38 + (i % 3) * 0.09 : 0.12 + ((seed + i) % 5) * 0.05).toFixed(2)),
      outcome: isGoal ? 'GOAL' : i % 2 === 0 ? 'SAVED' : 'BLOCKED',
      situation: i % 3 === 0 ? 'Set Piece' : 'Open Play',
    });
  }
  for (let i = 0; i < aShotCount; i++) {
    const isGoal = i < aScore;
    const evMatch = realEvents.find(
      (e, idx) =>
        idx === i &&
        ((e.team || '').toLowerCase() === awayTeam.toLowerCase() || e.team === 'away')
    );
    shotMap.push({
      id: `${m.id}-as-${i}`,
      team: 'AWAY',
      player: evMatch?.player || `${awayTeam} #${9 + (i % 3)}`,
      minute: parseInt(String(evMatch?.minute ?? (22 + i * 15)), 10) || 22 + i * 14,
      x: 8 + ((seed + i * 5) % 18),
      y: 30 + ((seed + i * 17) % 40),
      xg: Number((isGoal ? 0.34 + (i % 3) * 0.08 : 0.11 + ((seed + i) % 4) * 0.05).toFixed(2)),
      outcome: isGoal ? 'GOAL' : i % 2 === 0 ? 'SAVED' : 'OFF_TARGET',
      situation: i % 2 === 0 ? 'Counter Attack' : 'Open Play',
    });
  }

  const homeLineup: FormationPlayerNode[] = HOME_FORMATION_SLOTS.map((slot, idx) => {
    const ratingBase = 6.7 + hProb * 1.4 + ((seed + idx) % 7) * 0.15;
    return {
      ...slot,
      name: `${homeTeam.split(' ')[0]} #${slot.number}`,
      rating: Number(Math.min(9.4, ratingBase).toFixed(1)),
      xgChain: Number((0.12 + (idx > 5 ? homeXg * 0.25 : 0.14)).toFixed(2)),
      hasGoal: idx === 9 && hScore > 0,
      hasAssist: idx === 7 && hScore > 0,
      isMvp: idx === 9 && hProb >= aProb,
    };
  });

  const awayLineup: FormationPlayerNode[] = AWAY_FORMATION_SLOTS.map((slot, idx) => {
    const ratingBase = 6.6 + aProb * 1.4 + ((seed + idx * 3) % 7) * 0.15;
    return {
      ...slot,
      name: `${awayTeam.split(' ')[0]} #${slot.number}`,
      rating: Number(Math.min(9.4, ratingBase).toFixed(1)),
      xgChain: Number((0.1 + (idx > 5 ? awayXg * 0.24 : 0.12)).toFixed(2)),
      hasGoal: idx === 10 && aScore > 0,
      hasAssist: idx === 8 && aScore > 0,
      isMvp: idx === 10 && aProb > hProb,
    };
  });

  const homeRadar: FiveAxisRadarMetrics = {
    attackingOutput: Math.min(96, Math.round(62 + homeXg * 14)),
    chanceCreation: Math.min(95, Math.round(60 + homeXg * 13)),
    pressingIntensity: Math.min(94, Math.round(64 + hProb * 32)),
    setPieceThreat: Math.min(94, 66 + (seed % 22)),
    defensiveSolidity: Math.min(94, Math.round(88 - awayXg * 10)),
  };
  const awayRadar: FiveAxisRadarMetrics = {
    attackingOutput: Math.min(96, Math.round(60 + awayXg * 14)),
    chanceCreation: Math.min(95, Math.round(58 + awayXg * 13)),
    pressingIntensity: Math.min(94, Math.round(62 + aProb * 32)),
    setPieceThreat: Math.min(94, 64 + ((seed >> 2) % 22)),
    defensiveSolidity: Math.min(94, Math.round(88 - homeXg * 10)),
  };

  const windows: Array<'1-15’' | '16-30’' | '31-45’' | '46-60’' | '61-75’' | '76-90+’'> = [
    '1-15’',
    '16-30’',
    '31-45’',
    '46-60’',
    '61-75’',
    '76-90+’',
  ];
  const goalIntervals = windows.map((window, idx) => {
    const tempoScale = 0.65 + idx * 0.11;
    const hWindow = Math.min(54, Math.round((homeXg * 12 + 4) * tempoScale));
    const aWindow = Math.min(48, Math.round((awayXg * 12 + 3) * tempoScale));
    const combinedGoalProbPct = Math.min(78, Math.round(100 - ((100 - hWindow) * (100 - aWindow)) / 100));
    return {
      window,
      homeScoringProbPct: hWindow,
      awayScoringProbPct: aWindow,
      combinedGoalProbPct,
    };
  });

  const rawCells: Array<{ code: '1/1' | 'X/1' | '2/1' | '1/X' | 'X/X' | '2/X' | '1/2' | 'X/2' | '2/2'; label: string; raw: number }> = [
    { code: '1/1', label: `${homeTeam} HT / ${homeTeam} FT`, raw: hProb * 0.58 },
    { code: 'X/1', label: `Draw HT / ${homeTeam} FT (Value)`, raw: hProb * 0.34 },
    { code: 'X/X', label: 'Draw HT / Draw FT', raw: dProb * 0.54 },
    { code: '2/2', label: `${awayTeam} HT / ${awayTeam} FT`, raw: aProb * 0.56 },
    { code: 'X/2', label: `Draw HT / ${awayTeam} FT`, raw: aProb * 0.35 },
    { code: '1/X', label: `${homeTeam} HT / Draw FT`, raw: dProb * 0.26 },
    { code: '2/X', label: `${awayTeam} HT / Draw FT`, raw: dProb * 0.2 },
    { code: '2/1', label: `${awayTeam} HT / ${homeTeam} FT`, raw: hProb * 0.08 },
    { code: '1/2', label: `${homeTeam} HT / ${awayTeam} FT`, raw: aProb * 0.09 },
  ];
  const sumRaw = rawCells.reduce((acc, c) => acc + c.raw, 0) || 1;
  const htFtMatrix = rawCells
    .map((c) => {
      const probPct = Number(((c.raw / sumRaw) * 100).toFixed(1));
      return {
        code: c.code,
        label: c.label,
        probPct,
        fairOdds: Number((100 / Math.max(probPct, 1)).toFixed(2)),
      };
    })
    .sort((a, b) => b.probPct - a.probPct);

  const kickoffStr = m.match_date
    ? new Date(m.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'PRE-MATCH';

  return {
    id: String(m.id),
    homeTeam,
    awayTeam,
    league,
    scoreline: isLive || isFinished ? `${hScore} - ${aScore}` : 'vs',
    minuteLabel: m.status === 'halftime' ? 'HT' : isLive ? `LIVE ${rawMin}'` : isFinished ? 'FT' : kickoffStr,
    homeFormation: '4-3-3 Press',
    awayFormation: '4-2-3-1 Block',
    homeXg,
    awayXg,
    momentumWave,
    shotMap,
    homeLineup,
    awayLineup,
    homeRadar,
    awayRadar,
    goalIntervals,
    htFtMatrix,
  };
}
