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
  x: number; // 0 to 100 (pitch length, home shoots right 50->100, away shoots left 50->0)
  y: number; // 0 to 100 (pitch width)
  xg: number;
  outcome: 'GOAL' | 'SAVED' | 'BLOCKED' | 'OFF_TARGET';
  situation: 'Open Play' | 'Set Piece' | 'Counter Attack' | 'Penalty' | 'Header';
}

export interface FormationPlayerNode {
  number: number;
  name: string;
  role: string;
  x: number; // 5 to 95 along pitch
  y: number; // 10 to 90 across pitch
  rating: number; // 6.0 to 9.8
  xgChain: number;
  hasGoal?: boolean;
  hasAssist?: boolean;
  hasYellow?: boolean;
  isMvp?: boolean;
}

export interface FiveAxisRadarMetrics {
  attackingOutput: number; // 0-100
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
  justiceDelta: number; // positive means team deserves higher rank (underperforming xG = VALUE BUY)
  homePoints: number;
  awayPoints: number;
  firstHalfPoints: number;
  last5Form: Array<'W' | 'D' | 'L'>;
  regressionSignal: 'STRONG BUY (UNLUCKY)' | 'FAIR VALUE' | 'FADE ALERT (OVERPERFORMING)';
  nextFixtureMarket: string;
  nextFixtureOdds: number;
}

export const MATCH_PITCH_TELEMETRY_PACKAGES: MatchPitchTelemetryPackage[] = [
  {
    id: 'tel-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    scoreline: '2 - 1',
    minuteLabel: 'LIVE 78’',
    homeFormation: '4-3-3 High Press',
    awayFormation: '4-2-3-1 Transition',
    homeXg: 2.46,
    awayXg: 1.08,
    momentumWave: Array.from({ length: 78 }, (_, idx) => {
      const min = idx + 1;
      const raw =
        Math.sin(min * 0.19) * 52 +
        Math.cos(min * 0.08) * 28 +
        (min > 52 && min < 70 ? 35 : 0) -
        (min > 28 && min < 40 ? 38 : 0);
      const val = Math.max(-95, Math.min(95, Math.round(raw)));
      if (min === 19) {
        return { minute: min, value: 88, event: 'HOME_GOAL', eventLabel: '19’ Bukayo Saka (1-0)' };
      }
      if (min === 37) {
        return { minute: min, value: -82, event: 'AWAY_GOAL', eventLabel: '37’ Cole Palmer (1-1)' };
      }
      if (min === 64) {
        return { minute: min, value: 94, event: 'HOME_GOAL', eventLabel: '64’ Kai Havertz (2-1)' };
      }
      if (min === 55) {
        return { minute: min, value: 76, event: 'XG_SURGE', eventLabel: '55’ Arsenal Triple Box Entry' };
      }
      return { minute: min, value: val };
    }),
    shotMap: [
      { id: 's1', team: 'HOME', player: 'Bukayo Saka', minute: 19, x: 89, y: 38, xg: 0.44, outcome: 'GOAL', situation: 'Open Play' },
      { id: 's2', team: 'HOME', player: 'Kai Havertz', minute: 64, x: 92, y: 51, xg: 0.58, outcome: 'GOAL', situation: 'Header' },
      { id: 's3', team: 'HOME', player: 'Martin Ødegaard', minute: 54, x: 81, y: 56, xg: 0.26, outcome: 'SAVED', situation: 'Open Play' },
      { id: 's4', team: 'HOME', player: 'Declan Rice', minute: 29, x: 76, y: 48, xg: 0.14, outcome: 'BLOCKED', situation: 'Set Piece' },
      { id: 's5', team: 'HOME', player: 'Gabriel Magalhães', minute: 71, x: 91, y: 46, xg: 0.38, outcome: 'SAVED', situation: 'Set Piece' },
      { id: 's6', team: 'AWAY', player: 'Cole Palmer', minute: 37, x: 14, y: 54, xg: 0.39, outcome: 'GOAL', situation: 'Counter Attack' },
      { id: 's7', team: 'AWAY', player: 'Nicolas Jackson', minute: 49, x: 12, y: 44, xg: 0.34, outcome: 'SAVED', situation: 'Open Play' },
      { id: 's8', team: 'AWAY', player: 'Enzo Fernández', minute: 68, x: 22, y: 50, xg: 0.11, outcome: 'OFF_TARGET', situation: 'Open Play' },
    ],
    homeLineup: [
      { number: 22, name: 'Raya', role: 'GK', x: 7, y: 50, rating: 7.2, xgChain: 0.12 },
      { number: 4, name: 'White', role: 'RB', x: 21, y: 82, rating: 7.4, xgChain: 0.41 },
      { number: 2, name: 'Saliba', role: 'CB', x: 18, y: 62, rating: 7.9, xgChain: 0.28 },
      { number: 6, name: 'Gabriel', role: 'CB', x: 18, y: 38, rating: 7.8, xgChain: 0.45 },
      { number: 12, name: 'Timber', role: 'LB', x: 21, y: 18, rating: 7.3, xgChain: 0.34 },
      { number: 41, name: 'Rice', role: 'CDM', x: 32, y: 50, rating: 8.1, xgChain: 0.68, hasAssist: true },
      { number: 8, name: 'Ødegaard', role: 'CM', x: 37, y: 70, rating: 8.4, xgChain: 1.12, hasAssist: true },
      { number: 23, name: 'Merino', role: 'CM', x: 36, y: 30, rating: 7.1, xgChain: 0.49 },
      { number: 7, name: 'Saka', role: 'RW', x: 45, y: 80, rating: 8.9, xgChain: 1.44, hasGoal: true, isMvp: true },
      { number: 29, name: 'Havertz', role: 'ST', x: 47, y: 50, rating: 8.5, xgChain: 1.18, hasGoal: true },
      { number: 11, name: 'Martinelli', role: 'LW', x: 45, y: 20, rating: 7.5, xgChain: 0.64 },
    ],
    awayLineup: [
      { number: 1, name: 'Sánchez', role: 'GK', x: 93, y: 50, rating: 6.8, xgChain: 0.05 },
      { number: 27, name: 'Gusto', role: 'RB', x: 79, y: 18, rating: 6.7, xgChain: 0.22 },
      { number: 29, name: 'Fofana', role: 'CB', x: 82, y: 38, rating: 6.6, xgChain: 0.14, hasYellow: true },
      { number: 6, name: 'Colwill', role: 'CB', x: 82, y: 62, rating: 6.9, xgChain: 0.19 },
      { number: 3, name: 'Cucurella', role: 'LB', x: 79, y: 82, rating: 6.5, xgChain: 0.21, hasYellow: true },
      { number: 25, name: 'Caicedo', role: 'CDM', x: 67, y: 40, rating: 7.1, xgChain: 0.38 },
      { number: 8, name: 'Enzo', role: 'CDM', x: 67, y: 60, rating: 6.9, xgChain: 0.42 },
      { number: 11, name: 'Madueke', role: 'RW', x: 58, y: 22, rating: 6.8, xgChain: 0.35 },
      { number: 20, name: 'Palmer', role: 'CAM', x: 60, y: 50, rating: 8.2, xgChain: 0.89, hasGoal: true },
      { number: 7, name: 'Neto', role: 'LW', x: 58, y: 78, rating: 7.0, xgChain: 0.44, hasAssist: true },
      { number: 15, name: 'Jackson', role: 'ST', x: 53, y: 50, rating: 6.7, xgChain: 0.48 },
    ],
    homeRadar: {
      attackingOutput: 91,
      chanceCreation: 88,
      pressingIntensity: 92,
      setPieceThreat: 95,
      defensiveSolidity: 89,
    },
    awayRadar: {
      attackingOutput: 82,
      chanceCreation: 84,
      pressingIntensity: 78,
      setPieceThreat: 71,
      defensiveSolidity: 72,
    },
    goalIntervals: [
      { window: '1-15’', homeScoringProbPct: 24, awayScoringProbPct: 14, combinedGoalProbPct: 35 },
      { window: '16-30’', homeScoringProbPct: 29, awayScoringProbPct: 19, combinedGoalProbPct: 43 },
      { window: '31-45’', homeScoringProbPct: 31, awayScoringProbPct: 22, combinedGoalProbPct: 47 },
      { window: '46-60’', homeScoringProbPct: 34, awayScoringProbPct: 21, combinedGoalProbPct: 49 },
      { window: '61-75’', homeScoringProbPct: 38, awayScoringProbPct: 25, combinedGoalProbPct: 55 },
      { window: '76-90+’', homeScoringProbPct: 44, awayScoringProbPct: 29, combinedGoalProbPct: 62 },
    ],
    htFtMatrix: [
      { code: '1/1', label: 'Arsenal HT / Arsenal FT', probPct: 36.4, fairOdds: 2.75 },
      { code: 'X/1', label: 'Draw HT / Arsenal FT (Value)', probPct: 21.8, fairOdds: 4.59 },
      { code: 'X/X', label: 'Draw HT / Draw FT', probPct: 12.4, fairOdds: 8.06 },
      { code: '2/2', label: 'Chelsea HT / Chelsea FT', probPct: 10.2, fairOdds: 9.80 },
      { code: '1/X', label: 'Arsenal HT / Draw FT', probPct: 6.8, fairOdds: 14.7 },
      { code: 'X/2', label: 'Draw HT / Chelsea FT', probPct: 6.1, fairOdds: 16.4 },
      { code: '2/1', label: 'Chelsea HT / Arsenal FT (Comeback)', probPct: 3.4, fairOdds: 29.4 },
      { code: '2/X', label: 'Chelsea HT / Draw FT', probPct: 1.9, fairOdds: 52.6 },
      { code: '1/2', label: 'Arsenal HT / Chelsea FT', probPct: 1.0, fairOdds: 100.0 },
    ],
  },
  {
    id: 'tel-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    scoreline: '2 - 2',
    minuteLabel: 'LIVE 81’',
    homeFormation: '4-3-1-2 Diamond',
    awayFormation: '4-3-3 High Line',
    homeXg: 2.34,
    awayXg: 2.19,
    momentumWave: Array.from({ length: 81 }, (_, idx) => {
      const min = idx + 1;
      const raw = Math.cos(min * 0.21) * 58 + (min > 70 ? 42 : 0);
      const val = Math.max(-95, Math.min(95, Math.round(raw)));
      if (min === 14) return { minute: min, value: -85, event: 'AWAY_GOAL', eventLabel: '14’ Lamine Yamal (0-1)' };
      if (min === 33) return { minute: min, value: 89, event: 'HOME_GOAL', eventLabel: '33’ Kylian Mbappé (1-1)' };
      if (min === 58) return { minute: min, value: -88, event: 'AWAY_GOAL', eventLabel: '58’ Robert Lewandowski (1-2)' };
      if (min === 76) return { minute: min, value: 95, event: 'HOME_GOAL', eventLabel: '76’ Jude Bellingham (2-2)' };
      return { minute: min, value: val };
    }),
    shotMap: [
      { id: 'r1', team: 'HOME', player: 'Kylian Mbappé', minute: 33, x: 88, y: 44, xg: 0.49, outcome: 'GOAL', situation: 'Counter Attack' },
      { id: 'r2', team: 'HOME', player: 'Jude Bellingham', minute: 76, x: 91, y: 52, xg: 0.54, outcome: 'GOAL', situation: 'Open Play' },
      { id: 'r3', team: 'HOME', player: 'Vinícius Júnior', minute: 62, x: 85, y: 34, xg: 0.31, outcome: 'SAVED', situation: 'Open Play' },
      { id: 'r4', team: 'AWAY', player: 'Lamine Yamal', minute: 14, x: 15, y: 66, xg: 0.32, outcome: 'GOAL', situation: 'Open Play' },
      { id: 'r5', team: 'AWAY', player: 'Robert Lewandowski', minute: 58, x: 10, y: 49, xg: 0.62, outcome: 'GOAL', situation: 'Open Play' },
      { id: 'r6', team: 'AWAY', player: 'Raphinha', minute: 44, x: 17, y: 38, xg: 0.28, outcome: 'SAVED', situation: 'Counter Attack' },
    ],
    homeLineup: [
      { number: 1, name: 'Courtois', role: 'GK', x: 7, y: 50, rating: 7.4, xgChain: 0.1 },
      { number: 2, name: 'Carvajal', role: 'RB', x: 20, y: 82, rating: 7.1, xgChain: 0.38 },
      { number: 3, name: 'Militão', role: 'CB', x: 18, y: 60, rating: 7.0, xgChain: 0.22 },
      { number: 22, name: 'Rüdiger', role: 'CB', x: 18, y: 40, rating: 7.2, xgChain: 0.25 },
      { number: 23, name: 'Mendy', role: 'LB', x: 20, y: 18, rating: 6.9, xgChain: 0.29 },
      { number: 14, name: 'Tchouaméni', role: 'CDM', x: 31, y: 50, rating: 7.3, xgChain: 0.45 },
      { number: 8, name: 'Valverde', role: 'CM', x: 35, y: 72, rating: 7.9, xgChain: 0.84, hasAssist: true },
      { number: 6, name: 'Camavinga', role: 'CM', x: 35, y: 28, rating: 7.4, xgChain: 0.52 },
      { number: 5, name: 'Bellingham', role: 'CAM', x: 42, y: 50, rating: 8.8, xgChain: 1.32, hasGoal: true, isMvp: true },
      { number: 9, name: 'Mbappé', role: 'ST', x: 47, y: 64, rating: 8.6, xgChain: 1.41, hasGoal: true },
      { number: 7, name: 'Vinícius', role: 'ST', x: 47, y: 36, rating: 8.1, xgChain: 1.18, hasAssist: true },
    ],
    awayLineup: [
      { number: 13, name: 'Peña', role: 'GK', x: 93, y: 50, rating: 6.9, xgChain: 0.08 },
      { number: 23, name: 'Koundé', role: 'RB', x: 79, y: 20, rating: 7.2, xgChain: 0.34 },
      { number: 2, name: 'Cubarsí', role: 'CB', x: 82, y: 40, rating: 7.1, xgChain: 0.29 },
      { number: 5, name: 'Iñigo', role: 'CB', x: 82, y: 60, rating: 6.9, xgChain: 0.24 },
      { number: 3, name: 'Balde', role: 'LB', x: 79, y: 80, rating: 7.3, xgChain: 0.48 },
      { number: 17, name: 'Casadó', role: 'CDM', x: 68, y: 50, rating: 7.2, xgChain: 0.44 },
      { number: 8, name: 'Pedri', role: 'CM', x: 64, y: 32, rating: 8.1, xgChain: 0.96, hasAssist: true },
      { number: 20, name: 'Olmo', role: 'CM', x: 64, y: 68, rating: 7.5, xgChain: 0.62 },
      { number: 19, name: 'Yamal', role: 'RW', x: 56, y: 20, rating: 8.5, xgChain: 1.22, hasGoal: true },
      { number: 9, name: 'Lewandowski', role: 'ST', x: 53, y: 50, rating: 8.3, xgChain: 1.14, hasGoal: true },
      { number: 11, name: 'Raphinha', role: 'LW', x: 56, y: 80, rating: 7.9, xgChain: 0.92, hasAssist: true },
    ],
    homeRadar: {
      attackingOutput: 94,
      chanceCreation: 90,
      pressingIntensity: 85,
      setPieceThreat: 86,
      defensiveSolidity: 81,
    },
    awayRadar: {
      attackingOutput: 93,
      chanceCreation: 92,
      pressingIntensity: 91,
      setPieceThreat: 79,
      defensiveSolidity: 77,
    },
    goalIntervals: [
      { window: '1-15’', homeScoringProbPct: 26, awayScoringProbPct: 24, combinedGoalProbPct: 44 },
      { window: '16-30’', homeScoringProbPct: 31, awayScoringProbPct: 28, combinedGoalProbPct: 50 },
      { window: '31-45’', homeScoringProbPct: 35, awayScoringProbPct: 30, combinedGoalProbPct: 55 },
      { window: '46-60’', homeScoringProbPct: 37, awayScoringProbPct: 33, combinedGoalProbPct: 58 },
      { window: '61-75’', homeScoringProbPct: 41, awayScoringProbPct: 36, combinedGoalProbPct: 63 },
      { window: '76-90+’', homeScoringProbPct: 49, awayScoringProbPct: 41, combinedGoalProbPct: 71 },
    ],
    htFtMatrix: [
      { code: '1/1', label: 'Real Madrid HT / Real Madrid FT', probPct: 28.5, fairOdds: 3.51 },
      { code: 'X/1', label: 'Draw HT / Real Madrid FT (Late Surge)', probPct: 19.4, fairOdds: 5.15 },
      { code: '2/2', label: 'Barcelona HT / Barcelona FT', probPct: 18.2, fairOdds: 5.49 },
      { code: 'X/X', label: 'Draw HT / Draw FT', probPct: 11.8, fairOdds: 8.47 },
      { code: 'X/2', label: 'Draw HT / Barcelona FT', probPct: 8.4, fairOdds: 11.9 },
      { code: '2/1', label: 'Barcelona HT / Real Madrid FT (Remontada)', probPct: 5.6, fairOdds: 17.8 },
      { code: '1/X', label: 'Real Madrid HT / Draw FT', probPct: 4.1, fairOdds: 24.4 },
      { code: '2/X', label: 'Barcelona HT / Draw FT', probPct: 2.6, fairOdds: 38.5 },
      { code: '1/2', label: 'Real Madrid HT / Barcelona FT', probPct: 1.4, fairOdds: 71.4 },
    ],
  },
];

export const XPTS_JUSTICE_STANDINGS: XptsTeamStandingRow[] = [
  {
    club: 'Arsenal',
    league: 'Premier League',
    played: 28,
    wins: 20,
    draws: 5,
    losses: 3,
    goalsFor: 64,
    goalsAgainst: 22,
    actualPoints: 65,
    actualRank: 1,
    xGF: 66.8,
    xGA: 21.4,
    xGD: 45.4,
    xPTS: 67.2,
    justiceRank: 1,
    justiceDelta: 0,
    homePoints: 36,
    awayPoints: 29,
    firstHalfPoints: 58,
    last5Form: ['W', 'W', 'W', 'D', 'W'],
    regressionSignal: 'FAIR VALUE',
    nextFixtureMarket: 'Arsenal -1.0 AH',
    nextFixtureOdds: 1.78,
  },
  {
    club: 'Liverpool',
    league: 'Premier League',
    played: 28,
    wins: 19,
    draws: 6,
    losses: 3,
    goalsFor: 62,
    goalsAgainst: 25,
    actualPoints: 63,
    actualRank: 2,
    xGF: 68.1,
    xGA: 24.9,
    xGD: 43.2,
    xPTS: 65.8,
    justiceRank: 2,
    justiceDelta: 0,
    homePoints: 35,
    awayPoints: 28,
    firstHalfPoints: 54,
    last5Form: ['W', 'D', 'W', 'W', 'W'],
    regressionSignal: 'STRONG BUY (UNLUCKY)',
    nextFixtureMarket: 'Liverpool & Over 2.5',
    nextFixtureOdds: 1.84,
  },
  {
    club: 'Manchester City',
    league: 'Premier League',
    played: 28,
    wins: 18,
    draws: 6,
    losses: 4,
    goalsFor: 61,
    goalsAgainst: 28,
    actualPoints: 60,
    actualRank: 3,
    xGF: 65.4,
    xGA: 25.1,
    xGD: 40.3,
    xPTS: 64.1,
    justiceRank: 3,
    justiceDelta: 0,
    homePoints: 34,
    awayPoints: 26,
    firstHalfPoints: 55,
    last5Form: ['W', 'W', 'L', 'W', 'D'],
    regressionSignal: 'STRONG BUY (UNLUCKY)',
    nextFixtureMarket: 'Man City Win & BTTS',
    nextFixtureOdds: 2.65,
  },
  {
    club: 'Newcastle United',
    league: 'Premier League',
    played: 28,
    wins: 14,
    draws: 6,
    losses: 8,
    goalsFor: 51,
    goalsAgainst: 36,
    actualPoints: 48,
    actualRank: 6,
    xGF: 57.9,
    xGA: 31.2,
    xGD: 26.7,
    xPTS: 55.4,
    justiceRank: 4,
    justiceDelta: 2,
    homePoints: 31,
    awayPoints: 17,
    firstHalfPoints: 49,
    last5Form: ['W', 'L', 'W', 'D', 'W'],
    regressionSignal: 'STRONG BUY (UNLUCKY)',
    nextFixtureMarket: 'Newcastle DNB (1)',
    nextFixtureOdds: 1.72,
  },
  {
    club: 'Chelsea',
    league: 'Premier League',
    played: 28,
    wins: 14,
    draws: 7,
    losses: 7,
    goalsFor: 53,
    goalsAgainst: 37,
    actualPoints: 49,
    actualRank: 5,
    xGF: 54.6,
    xGA: 35.8,
    xGD: 18.8,
    xPTS: 50.8,
    justiceRank: 5,
    justiceDelta: 0,
    homePoints: 28,
    awayPoints: 21,
    firstHalfPoints: 46,
    last5Form: ['D', 'W', 'W', 'L', 'D'],
    regressionSignal: 'FAIR VALUE',
    nextFixtureMarket: 'Over 2.5 Match Goals',
    nextFixtureOdds: 1.66,
  },
  {
    club: 'Aston Villa',
    league: 'Premier League',
    played: 28,
    wins: 16,
    draws: 5,
    losses: 7,
    goalsFor: 49,
    goalsAgainst: 38,
    actualPoints: 53,
    actualRank: 4,
    xGF: 43.2,
    xGA: 41.5,
    xGD: 1.7,
    xPTS: 44.6,
    justiceRank: 7,
    justiceDelta: -3,
    homePoints: 30,
    awayPoints: 23,
    firstHalfPoints: 44,
    last5Form: ['W', 'L', 'W', 'W', 'L'],
    regressionSignal: 'FADE ALERT (OVERPERFORMING)',
    nextFixtureMarket: 'Opponent Double Chance (X2)',
    nextFixtureOdds: 1.92,
  },
  {
    club: 'Brentford',
    league: 'Premier League',
    played: 28,
    wins: 10,
    draws: 6,
    losses: 12,
    goalsFor: 42,
    goalsAgainst: 46,
    actualPoints: 36,
    actualRank: 11,
    xGF: 48.9,
    xGA: 39.4,
    xGD: 9.5,
    xPTS: 45.2,
    justiceRank: 6,
    justiceDelta: 5,
    homePoints: 24,
    awayPoints: 12,
    firstHalfPoints: 42,
    last5Form: ['D', 'L', 'W', 'D', 'W'],
    regressionSignal: 'STRONG BUY (UNLUCKY)',
    nextFixtureMarket: 'Brentford +0.5 Asian Handicap',
    nextFixtureOdds: 1.85,
  },
];
