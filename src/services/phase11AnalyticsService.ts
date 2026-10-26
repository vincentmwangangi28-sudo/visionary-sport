import { broadcastAdminSync } from './adminOverrideSyncService';

export type InPlayAlertType =
  | 'LATE_GOAL_75_PLUS'
  | 'HALF_TIME_SPIKE'
  | 'FAVORITE_TRAILING_PRESSURE'
  | 'CORNER_SIEGE';

export interface InPlayMomentumSignal {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  minute: number;
  homeScore: number;
  awayScore: number;
  liveXgHome: number;
  liveXgAway: number;
  last15MinShots: number;
  last15MinCorners: number;
  attackingTiltPct: number;
  alertType: InPlayAlertType;
  recommendedMarket: string;
  nextGoalModelProbPct: number;
  fairNextGoalOdds: number;
  bookieInPlayOdds: number;
  inPlayEdgePct: number;
  tacticalSummary: string;
}

export type BetSettlementStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface TrackedBetEntry {
  id: string;
  createdAt: string;
  fixture: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  stake: number;
  bookmaker: string;
  status: BetSettlementStatus;
  settledScore?: string;
  clvEdgePct: number;
  notes?: string;
}

export interface GroupFixtureItem {
  id: string;
  groupName: string;
  homeTeam: string;
  awayTeam: string;
  homeXg: number;
  awayXg: number;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface GroupStandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface TournamentPreset {
  id: 'afcon' | 'worldcup' | 'ucl';
  name: string;
  subtitle: string;
  groups: Array<{
    groupName: string;
    teams: Array<{ name: string; elo: number; attackXg: number; defenseXg: number }>;
  }>;
}

const IN_PLAY_STORAGE_KEY = 'predictpro_inplay_momentum_signals_v1';
const BET_TRACKER_STORAGE_KEY = 'predictpro_personal_bet_tracker_v1';

export const DEFAULT_IN_PLAY_SIGNALS: InPlayMomentumSignal[] = [
  {
    id: 'ip-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    minute: 76,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 2.34,
    liveXgAway: 1.12,
    last15MinShots: 7,
    last15MinCorners: 4,
    attackingTiltPct: 78,
    alertType: 'LATE_GOAL_75_PLUS',
    recommendedMarket: 'Over 2.5 Match Goals (In-Play)',
    nextGoalModelProbPct: 79.4,
    fairNextGoalOdds: 1.26,
    bookieInPlayOdds: 1.54,
    inPlayEdgePct: 18.2,
    tacticalSummary:
      'Arsenal have generated 0.94 xG and 7 shots inside the box in the last 15 minutes. High probability of a 76’–90+’ winner.',
  },
  {
    id: 'ip-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    minute: 68,
    homeScore: 0,
    awayScore: 1,
    liveXgHome: 1.96,
    liveXgAway: 1.28,
    last15MinShots: 6,
    last15MinCorners: 5,
    attackingTiltPct: 74,
    alertType: 'FAVORITE_TRAILING_PRESSURE',
    recommendedMarket: 'Real Madrid Next Goal (Team Goal 2)',
    nextGoalModelProbPct: 74.8,
    fairNextGoalOdds: 1.34,
    bookieInPlayOdds: 1.62,
    inPlayEdgePct: 17.3,
    tacticalSummary:
      'Home favorite trailing 0-1 despite 1.96 accumulated xG and 5 corners in 15 minutes. Bernabéu late-surge profile active.',
  },
  {
    id: 'ip-bay-bvb',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    minute: 34,
    homeScore: 0,
    awayScore: 0,
    liveXgHome: 1.42,
    liveXgAway: 0.78,
    last15MinShots: 8,
    last15MinCorners: 3,
    attackingTiltPct: 71,
    alertType: 'HALF_TIME_SPIKE',
    recommendedMarket: '1st Half Over 0.5 Goals',
    nextGoalModelProbPct: 76.2,
    fairNextGoalOdds: 1.31,
    bookieInPlayOdds: 1.58,
    inPlayEdgePct: 17.1,
    tacticalSummary:
      '2.20 combined first-half xG in 34 minutes with 0-0 on the scoreboard. Extreme positive variance setup before halftime.',
  },
  {
    id: 'ip-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    minute: 79,
    homeScore: 1,
    awayScore: 0,
    liveXgHome: 1.88,
    liveXgAway: 0.91,
    last15MinShots: 5,
    last15MinCorners: 4,
    attackingTiltPct: 69,
    alertType: 'LATE_GOAL_75_PLUS',
    recommendedMarket: 'Over 1.5 Total Match Goals',
    nextGoalModelProbPct: 73.5,
    fairNextGoalOdds: 1.36,
    bookieInPlayOdds: 1.65,
    inPlayEdgePct: 17.6,
    tacticalSummary:
      'AFC Leopards pushing a high defensive line in the final 12 minutes, leaving open counter-attacking channels.',
  },
  {
    id: 'ip-ahl-sun',
    homeTeam: 'Al Ahly',
    awayTeam: 'Mamelodi Sundowns',
    league: 'CAF Champions League',
    minute: 62,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 1.55,
    liveXgAway: 1.39,
    last15MinShots: 6,
    last15MinCorners: 6,
    attackingTiltPct: 66,
    alertType: 'CORNER_SIEGE',
    recommendedMarket: 'Over 10.5 Total Match Corners',
    nextGoalModelProbPct: 77.0,
    fairNextGoalOdds: 1.30,
    bookieInPlayOdds: 1.55,
    inPlayEdgePct: 16.1,
    tacticalSummary:
      '6 corners won in the last 15 minutes alone as both fullbacks overlap continuously in end-to-end transition.',
  },
];

export const DEFAULT_TRACKED_BETS: TrackedBetEntry[] = [
  {
    id: 'bet-101',
    createdAt: '2026-10-24',
    fixture: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    market: 'Over 2.5 Goals',
    odds: 1.78,
    stake: 50,
    bookmaker: 'SportyBet',
    status: 'WON',
    settledScore: '2 - 1',
    clvEdgePct: 8.7,
    notes: 'Locked opening line at 1.78; closed 1.63 on Pinnacle.',
  },
  {
    id: 'bet-102',
    createdAt: '2026-10-24',
    fixture: 'Bayern Munich vs Borussia Dortmund',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    market: 'Home Win (1)',
    odds: 1.66,
    stake: 60,
    bookmaker: '1xBet',
    status: 'WON',
    settledScore: '3 - 1',
    clvEdgePct: 7.4,
    notes: 'Poisson projected 2.45 home xG.',
  },
  {
    id: 'bet-103',
    createdAt: '2026-10-25',
    fixture: 'Gor Mahia vs AFC Leopards',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    market: 'Home Win (1)',
    odds: 1.82,
    stake: 40,
    bookmaker: 'Betika',
    status: 'WON',
    settledScore: '2 - 0',
    clvEdgePct: 9.1,
    notes: 'Mashemeji Derby banker.',
  },
  {
    id: 'bet-104',
    createdAt: '2026-10-25',
    fixture: 'Inter Milan vs Juventus',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    league: 'Serie A',
    market: 'Both Teams to Score (Yes)',
    odds: 1.92,
    stake: 35,
    bookmaker: 'Bet9ja',
    status: 'LOST',
    settledScore: '1 - 0',
    clvEdgePct: 4.2,
    notes: 'Juventus missed 1.18 xG in second half.',
  },
  {
    id: 'bet-105',
    createdAt: '2026-10-26',
    fixture: 'Real Madrid vs Barcelona',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    market: 'Over 2.5 Goals',
    odds: 1.72,
    stake: 55,
    bookmaker: 'SportyBet',
    status: 'PENDING',
    clvEdgePct: 8.5,
    notes: 'Combined 3.64 model xG.',
  },
];

export const TOURNAMENT_PRESETS: TournamentPreset[] = [
  {
    id: 'afcon',
    name: 'CAF Africa Cup of Nations (AFCON)',
    subtitle: 'Group Stage + Round of 16 to Final Simulator',
    groups: [
      {
        groupName: 'Group A',
        teams: [
          { name: 'Morocco', elo: 1865, attackXg: 1.95, defenseXg: 0.68 },
          { name: 'Mali', elo: 1715, attackXg: 1.38, defenseXg: 0.94 },
          { name: 'Zambia', elo: 1620, attackXg: 1.12, defenseXg: 1.25 },
          { name: 'Tanzania', elo: 1545, attackXg: 0.88, defenseXg: 1.42 },
        ],
      },
      {
        groupName: 'Group B',
        teams: [
          { name: 'Egypt', elo: 1810, attackXg: 1.76, defenseXg: 0.78 },
          { name: 'South Africa', elo: 1735, attackXg: 1.42, defenseXg: 0.92 },
          { name: 'Angola', elo: 1665, attackXg: 1.18, defenseXg: 1.12 },
          { name: 'Zimbabwe', elo: 1560, attackXg: 0.92, defenseXg: 1.35 },
        ],
      },
      {
        groupName: 'Group C',
        teams: [
          { name: 'Nigeria', elo: 1825, attackXg: 1.84, defenseXg: 0.82 },
          { name: 'Tunisia', elo: 1720, attackXg: 1.32, defenseXg: 0.88 },
          { name: 'Uganda', elo: 1610, attackXg: 1.05, defenseXg: 1.22 },
          { name: 'Kenya', elo: 1595, attackXg: 1.02, defenseXg: 1.24 },
        ],
      },
      {
        groupName: 'Group D',
        teams: [
          { name: 'Senegal', elo: 1845, attackXg: 1.88, defenseXg: 0.74 },
          { name: 'Ivory Coast', elo: 1805, attackXg: 1.72, defenseXg: 0.86 },
          { name: 'DR Congo', elo: 1705, attackXg: 1.34, defenseXg: 1.04 },
          { name: 'Mozambique', elo: 1575, attackXg: 0.96, defenseXg: 1.38 },
        ],
      },
    ],
  },
  {
    id: 'worldcup',
    name: 'FIFA World Cup Championship',
    subtitle: 'Global Group Tables & Knockout Path Simulator',
    groups: [
      {
        groupName: 'Group A',
        teams: [
          { name: 'Spain', elo: 2045, attackXg: 2.18, defenseXg: 0.72 },
          { name: 'Colombia', elo: 1935, attackXg: 1.64, defenseXg: 0.92 },
          { name: 'Morocco', elo: 1865, attackXg: 1.45, defenseXg: 0.88 },
          { name: 'USA', elo: 1790, attackXg: 1.22, defenseXg: 1.18 },
        ],
      },
      {
        groupName: 'Group B',
        teams: [
          { name: 'Argentina', elo: 2060, attackXg: 2.22, defenseXg: 0.68 },
          { name: 'Germany', elo: 1965, attackXg: 1.88, defenseXg: 0.96 },
          { name: 'Japan', elo: 1850, attackXg: 1.52, defenseXg: 1.08 },
          { name: 'Nigeria', elo: 1825, attackXg: 1.36, defenseXg: 1.15 },
        ],
      },
      {
        groupName: 'Group C',
        teams: [
          { name: 'France', elo: 2035, attackXg: 2.12, defenseXg: 0.76 },
          { name: 'Brazil', elo: 1990, attackXg: 1.94, defenseXg: 0.88 },
          { name: 'Senegal', elo: 1845, attackXg: 1.42, defenseXg: 1.04 },
          { name: 'South Korea', elo: 1785, attackXg: 1.18, defenseXg: 1.28 },
        ],
      },
      {
        groupName: 'Group D',
        teams: [
          { name: 'England', elo: 2015, attackXg: 2.04, defenseXg: 0.78 },
          { name: 'Portugal', elo: 1975, attackXg: 1.92, defenseXg: 0.90 },
          { name: 'Netherlands', elo: 1925, attackXg: 1.68, defenseXg: 1.02 },
          { name: 'Egypt', elo: 1810, attackXg: 1.24, defenseXg: 1.26 },
        ],
      },
    ],
  },
  {
    id: 'ucl',
    name: 'UEFA Champions League Elite Phase',
    subtitle: 'European Club Group & Knockout Progression Lab',
    groups: [
      {
        groupName: 'Section A',
        teams: [
          { name: 'Real Madrid', elo: 2050, attackXg: 2.25, defenseXg: 0.88 },
          { name: 'Arsenal', elo: 2020, attackXg: 2.08, defenseXg: 0.72 },
          { name: 'Sporting CP', elo: 1875, attackXg: 1.62, defenseXg: 1.12 },
          { name: 'Celtic', elo: 1760, attackXg: 1.18, defenseXg: 1.48 },
        ],
      },
      {
        groupName: 'Section B',
        teams: [
          { name: 'Manchester City', elo: 2055, attackXg: 2.34, defenseXg: 0.82 },
          { name: 'Inter Milan', elo: 1995, attackXg: 1.92, defenseXg: 0.76 },
          { name: 'Borussia Dortmund', elo: 1895, attackXg: 1.74, defenseXg: 1.22 },
          { name: 'AS Monaco', elo: 1810, attackXg: 1.38, defenseXg: 1.36 },
        ],
      },
      {
        groupName: 'Section C',
        teams: [
          { name: 'Liverpool', elo: 2040, attackXg: 2.28, defenseXg: 0.79 },
          { name: 'Barcelona', elo: 2010, attackXg: 2.18, defenseXg: 0.95 },
          { name: 'AC Milan', elo: 1880, attackXg: 1.54, defenseXg: 1.18 },
          { name: 'PSV Eindhoven', elo: 1820, attackXg: 1.42, defenseXg: 1.34 },
        ],
      },
      {
        groupName: 'Section D',
        teams: [
          { name: 'Bayern Munich', elo: 2030, attackXg: 2.32, defenseXg: 0.92 },
          { name: 'Paris Saint-Germain', elo: 1970, attackXg: 1.96, defenseXg: 0.98 },
          { name: 'Atletico Madrid', elo: 1920, attackXg: 1.58, defenseXg: 0.86 },
          { name: 'Aston Villa', elo: 1865, attackXg: 1.48, defenseXg: 1.16 },
        ],
      },
    ],
  },
];

export function getInPlayMomentumSignals(): InPlayMomentumSignal[] {
  if (typeof window === 'undefined') return DEFAULT_IN_PLAY_SIGNALS;
  try {
    const raw = localStorage.getItem(IN_PLAY_STORAGE_KEY);
    if (!raw) return DEFAULT_IN_PLAY_SIGNALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_IN_PLAY_SIGNALS;
  } catch {
    return DEFAULT_IN_PLAY_SIGNALS;
  }
}

export function saveInPlayMomentumSignals(signals: InPlayMomentumSignal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(IN_PLAY_STORAGE_KEY, JSON.stringify(signals));
    broadcastAdminSync();
  } catch {
    // ignore storage errors
  }
}

export function simulateRemainingInPlayEdge(params: {
  minute: number;
  last15MinShots: number;
  last15MinCorners: number;
  attackingTiltPct: number;
  bookieNextGoalOdds: number;
}) {
  const remainingMinutes = Math.max(4, 94 - params.minute);
  const intensityFactor =
    (params.last15MinShots * 0.11 + params.last15MinCorners * 0.055) *
    (params.attackingTiltPct / 60);
  const projectedRemainingXg = Number(
    Math.max(0.22, Math.min(2.35, (remainingMinutes / 18) * intensityFactor)).toFixed(2)
  );
  // Poisson probability of >= 1 goal in remaining minutes: 1 - e^(-lambda)
  const nextGoalProb = Math.min(0.92, Math.max(0.18, 1 - Math.exp(-projectedRemainingXg * 1.15)));
  const nextGoalProbPct = Number((nextGoalProb * 100).toFixed(1));
  const fairOdds = Number((1 / nextGoalProb).toFixed(2));
  const edgePct = Number((((params.bookieNextGoalOdds - fairOdds) / fairOdds) * 100).toFixed(1));

  return {
    remainingMinutes,
    projectedRemainingXg,
    nextGoalProbPct,
    fairOdds,
    edgePct,
  };
}

export function getTrackedBets(): TrackedBetEntry[] {
  if (typeof window === 'undefined') return DEFAULT_TRACKED_BETS;
  try {
    const raw = localStorage.getItem(BET_TRACKER_STORAGE_KEY);
    if (!raw) return DEFAULT_TRACKED_BETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TRACKED_BETS;
  } catch {
    return DEFAULT_TRACKED_BETS;
  }
}

export function saveTrackedBets(entries: TrackedBetEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BET_TRACKER_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('predictpro-bet-tracker-updated'));
  } catch {
    // ignore storage errors
  }
}

export function addTrackedBetEntry(
  entry: Omit<TrackedBetEntry, 'id' | 'createdAt'>
): TrackedBetEntry {
  const current = getTrackedBets();
  const created: TrackedBetEntry = {
    ...entry,
    id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveTrackedBets([created, ...current]);
  return created;
}

export function gradeBetAgainstScore(
  market: string,
  homeGoals: number,
  awayGoals: number
): BetSettlementStatus {
  const m = market.toLowerCase();
  const total = homeGoals + awayGoals;

  if (m.includes('over 2.5')) return total >= 3 ? 'WON' : 'LOST';
  if (m.includes('under 2.5')) return total <= 2 ? 'WON' : 'LOST';
  if (m.includes('over 1.5')) return total >= 2 ? 'WON' : 'LOST';
  if (m.includes('btts') || m.includes('both teams')) {
    if (m.includes('no')) return homeGoals === 0 || awayGoals === 0 ? 'WON' : 'LOST';
    return homeGoals > 0 && awayGoals > 0 ? 'WON' : 'LOST';
  }
  if (m.includes('1x') || m.includes('home or draw')) {
    return homeGoals >= awayGoals ? 'WON' : 'LOST';
  }
  if (m.includes('x2') || m.includes('away or draw')) {
    return awayGoals >= homeGoals ? 'WON' : 'LOST';
  }
  if (m.includes('draw') && !m.includes('no bet')) {
    return homeGoals === awayGoals ? 'WON' : 'LOST';
  }
  if (m.includes('away') || m.includes('(2)')) {
    return awayGoals > homeGoals ? 'WON' : 'LOST';
  }
  // Default Home Win (1)
  return homeGoals > awayGoals ? 'WON' : 'LOST';
}

export function buildGroupFixtures(preset: TournamentPreset): GroupFixtureItem[] {
  const fixtures: GroupFixtureItem[] = [];
  for (const grp of preset.groups) {
    const t = grp.teams;
    const pairs: Array<[number, number]> = [
      [0, 1],
      [2, 3],
      [0, 2],
      [1, 3],
      [0, 3],
      [1, 2],
    ];
    pairs.forEach(([i, j], idx) => {
      const home = t[i];
      const away = t[j];
      const homeXg = Number(((home.attackXg * away.defenseXg) / 1.05).toFixed(2));
      const awayXg = Number(((away.attackXg * home.defenseXg) / 1.12).toFixed(2));
      const homeGoals = Math.max(0, Math.round(homeXg));
      const awayGoals = Math.max(0, Math.round(awayXg - 0.1));
      fixtures.push({
        id: `${preset.id}-${grp.groupName}-${idx}`,
        groupName: grp.groupName,
        homeTeam: home.name,
        awayTeam: away.name,
        homeXg,
        awayXg,
        homeGoals,
        awayGoals,
      });
    });
  }
  return fixtures;
}

export function calculateGroupStandings(
  teamNames: string[],
  fixtures: GroupFixtureItem[]
): GroupStandingRow[] {
  const map = new Map<string, GroupStandingRow>();
  for (const name of teamNames) {
    map.set(name, {
      team: name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    });
  }

  for (const f of fixtures) {
    if (f.homeGoals === null || f.awayGoals === null) continue;
    const h = map.get(f.homeTeam);
    const a = map.get(f.awayTeam);
    if (!h || !a) continue;

    h.played += 1;
    a.played += 1;
    h.gf += f.homeGoals;
    h.ga += f.awayGoals;
    h.gd = h.gf - h.ga;

    a.gf += f.awayGoals;
    a.ga += f.homeGoals;
    a.gd = a.gf - a.ga;

    if (f.homeGoals > f.awayGoals) {
      h.won += 1;
      h.pts += 3;
      a.lost += 1;
    } else if (f.homeGoals < f.awayGoals) {
      a.won += 1;
      a.pts += 3;
      h.lost += 1;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.pts += 1;
      a.pts += 1;
    }
  }

  return Array.from(map.values()).sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    return y.gf - x.gf;
  });
}
