import { TeamProfile, DerbyPreset, SimulationResult } from '@/types/h2h';

export const TEAMS_DATABASE: TeamProfile[] = [
  {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    league: 'Premier League',
    country: 'England',
    logoText: 'ARS',
    badgeColor: '#EF0107',
    attackRating: 88,
    defenseRating: 92,
    possessionRating: 87,
    setPieceRating: 95,
    formRating: 86,
    goalsScoredPerGame: 2.15,
    goalsConcededPerGame: 0.78,
    xGPerGame: 2.10,
    xGAPerGame: 0.82,
    cleanSheetPct: 52,
    bttsRatePct: 48,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    starPlayer: { name: 'Bukayo Saka', position: 'RW', goals: 9, assists: 11, rating: 8.4 },
  },
  {
    id: 'man-city',
    name: 'Manchester City',
    shortName: 'MCI',
    league: 'Premier League',
    country: 'England',
    logoText: 'MCI',
    badgeColor: '#6CABDD',
    attackRating: 94,
    defenseRating: 86,
    possessionRating: 96,
    setPieceRating: 88,
    formRating: 89,
    goalsScoredPerGame: 2.45,
    goalsConcededPerGame: 0.95,
    xGPerGame: 2.38,
    xGAPerGame: 0.90,
    cleanSheetPct: 42,
    bttsRatePct: 62,
    recentForm: ['W', 'W', 'W', 'D', 'W'],
    starPlayer: { name: 'Erling Haaland', position: 'ST', goals: 17, assists: 3, rating: 8.7 },
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    league: 'Premier League',
    country: 'England',
    logoText: 'LIV',
    badgeColor: '#C8102E',
    attackRating: 90,
    defenseRating: 89,
    possessionRating: 89,
    setPieceRating: 87,
    formRating: 88,
    goalsScoredPerGame: 2.22,
    goalsConcededPerGame: 0.85,
    xGPerGame: 2.20,
    xGAPerGame: 0.89,
    cleanSheetPct: 50,
    bttsRatePct: 52,
    recentForm: ['W', 'W', 'W', 'W', 'D'],
    starPlayer: { name: 'Mohamed Salah', position: 'RW', goals: 12, assists: 8, rating: 8.5 },
  },
  {
    id: 'tottenham',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    league: 'Premier League',
    country: 'England',
    logoText: 'TOT',
    badgeColor: '#132257',
    attackRating: 86,
    defenseRating: 78,
    possessionRating: 85,
    setPieceRating: 80,
    formRating: 76,
    goalsScoredPerGame: 1.95,
    goalsConcededPerGame: 1.45,
    xGPerGame: 1.90,
    xGAPerGame: 1.48,
    cleanSheetPct: 28,
    bttsRatePct: 72,
    recentForm: ['W', 'L', 'W', 'D', 'W'],
    starPlayer: { name: 'Heung-min Son', position: 'LW', goals: 9, assists: 6, rating: 7.9 },
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    league: 'Premier League',
    country: 'England',
    logoText: 'CHE',
    badgeColor: '#034694',
    attackRating: 87,
    defenseRating: 79,
    possessionRating: 86,
    setPieceRating: 82,
    formRating: 80,
    goalsScoredPerGame: 2.05,
    goalsConcededPerGame: 1.35,
    xGPerGame: 1.98,
    xGAPerGame: 1.32,
    cleanSheetPct: 32,
    bttsRatePct: 65,
    recentForm: ['W', 'W', 'D', 'W', 'L'],
    starPlayer: { name: 'Cole Palmer', position: 'AM', goals: 11, assists: 9, rating: 8.3 },
  },
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    league: 'La Liga',
    country: 'Spain',
    logoText: 'RMA',
    badgeColor: '#FEBE10',
    attackRating: 95,
    defenseRating: 88,
    possessionRating: 91,
    setPieceRating: 89,
    formRating: 91,
    goalsScoredPerGame: 2.35,
    goalsConcededPerGame: 0.82,
    xGPerGame: 2.28,
    xGAPerGame: 0.88,
    cleanSheetPct: 48,
    bttsRatePct: 54,
    recentForm: ['W', 'W', 'W', 'W', 'D'],
    starPlayer: { name: 'Vinicius Jr', position: 'LW', goals: 14, assists: 8, rating: 8.8 },
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'FCB',
    league: 'La Liga',
    country: 'Spain',
    logoText: 'FCB',
    badgeColor: '#004D98',
    attackRating: 93,
    defenseRating: 83,
    possessionRating: 94,
    setPieceRating: 84,
    formRating: 88,
    goalsScoredPerGame: 2.50,
    goalsConcededPerGame: 1.10,
    xGPerGame: 2.42,
    xGAPerGame: 1.05,
    cleanSheetPct: 38,
    bttsRatePct: 68,
    recentForm: ['W', 'W', 'W', 'L', 'W'],
    starPlayer: { name: 'Lamine Yamal', position: 'RW', goals: 8, assists: 12, rating: 8.6 },
  },
  {
    id: 'atletico-madrid',
    name: 'Atletico Madrid',
    shortName: 'ATM',
    league: 'La Liga',
    country: 'Spain',
    logoText: 'ATM',
    badgeColor: '#CB3524',
    attackRating: 84,
    defenseRating: 91,
    possessionRating: 81,
    setPieceRating: 90,
    formRating: 82,
    goalsScoredPerGame: 1.75,
    goalsConcededPerGame: 0.70,
    xGPerGame: 1.70,
    xGAPerGame: 0.75,
    cleanSheetPct: 56,
    bttsRatePct: 38,
    recentForm: ['W', 'D', 'W', 'D', 'W'],
    starPlayer: { name: 'Antoine Griezmann', position: 'CF', goals: 10, assists: 7, rating: 8.1 },
  },
  {
    id: 'bayern-munich',
    name: 'Bayern Munich',
    shortName: 'BAY',
    league: 'Bundesliga',
    country: 'Germany',
    logoText: 'BAY',
    badgeColor: '#DC052D',
    attackRating: 95,
    defenseRating: 84,
    possessionRating: 92,
    setPieceRating: 91,
    formRating: 87,
    goalsScoredPerGame: 2.80,
    goalsConcededPerGame: 1.05,
    xGPerGame: 2.72,
    xGAPerGame: 0.98,
    cleanSheetPct: 40,
    bttsRatePct: 70,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    starPlayer: { name: 'Harry Kane', position: 'ST', goals: 16, assists: 7, rating: 8.9 },
  },
  {
    id: 'bayer-leverkusen',
    name: 'Bayer Leverkusen',
    shortName: 'B04',
    league: 'Bundesliga',
    country: 'Germany',
    logoText: 'B04',
    badgeColor: '#E32221',
    attackRating: 91,
    defenseRating: 87,
    possessionRating: 90,
    setPieceRating: 89,
    formRating: 89,
    goalsScoredPerGame: 2.40,
    goalsConcededPerGame: 1.15,
    xGPerGame: 2.30,
    xGAPerGame: 1.08,
    cleanSheetPct: 44,
    bttsRatePct: 65,
    recentForm: ['W', 'D', 'W', 'W', 'W'],
    starPlayer: { name: 'Florian Wirtz', position: 'AM', goals: 9, assists: 10, rating: 8.6 },
  },
  {
    id: 'borussia-dortmund',
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    league: 'Bundesliga',
    country: 'Germany',
    logoText: 'BVB',
    badgeColor: '#FDE100',
    attackRating: 86,
    defenseRating: 79,
    possessionRating: 85,
    setPieceRating: 81,
    formRating: 78,
    goalsScoredPerGame: 2.00,
    goalsConcededPerGame: 1.38,
    xGPerGame: 1.95,
    xGAPerGame: 1.35,
    cleanSheetPct: 30,
    bttsRatePct: 68,
    recentForm: ['W', 'L', 'W', 'W', 'L'],
    starPlayer: { name: 'Serhou Guirassy', position: 'ST', goals: 8, assists: 3, rating: 7.9 },
  },
  {
    id: 'inter-milan',
    name: 'Inter Milan',
    shortName: 'INT',
    league: 'Serie A',
    country: 'Italy',
    logoText: 'INT',
    badgeColor: '#005CA9',
    attackRating: 89,
    defenseRating: 93,
    possessionRating: 87,
    setPieceRating: 92,
    formRating: 86,
    goalsScoredPerGame: 2.10,
    goalsConcededPerGame: 0.72,
    xGPerGame: 2.05,
    xGAPerGame: 0.75,
    cleanSheetPct: 55,
    bttsRatePct: 42,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    starPlayer: { name: 'Lautaro Martinez', position: 'ST', goals: 11, assists: 4, rating: 8.3 },
  },
  {
    id: 'ac-milan',
    name: 'AC Milan',
    shortName: 'ACM',
    league: 'Serie A',
    country: 'Italy',
    logoText: 'ACM',
    badgeColor: '#FB090B',
    attackRating: 85,
    defenseRating: 82,
    possessionRating: 84,
    setPieceRating: 83,
    formRating: 80,
    goalsScoredPerGame: 1.85,
    goalsConcededPerGame: 1.15,
    xGPerGame: 1.80,
    xGAPerGame: 1.18,
    cleanSheetPct: 35,
    bttsRatePct: 58,
    recentForm: ['W', 'W', 'W', 'L', 'D'],
    starPlayer: { name: 'Christian Pulisic', position: 'RW', goals: 8, assists: 5, rating: 8.0 },
  },
  {
    id: 'gor-mahia',
    name: 'Gor Mahia',
    shortName: 'GOR',
    league: 'FKF Premier League',
    country: 'Kenya',
    logoText: 'GOR',
    badgeColor: '#008000',
    attackRating: 81,
    defenseRating: 90,
    possessionRating: 85,
    setPieceRating: 87,
    formRating: 88,
    goalsScoredPerGame: 1.65,
    goalsConcededPerGame: 0.55,
    xGPerGame: 1.60,
    xGAPerGame: 0.58,
    cleanSheetPct: 62,
    bttsRatePct: 32,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    starPlayer: { name: 'Benson Omala', position: 'ST', goals: 14, assists: 3, rating: 8.2 },
  },
  {
    id: 'afc-leopards',
    name: 'AFC Leopards',
    shortName: 'AFC',
    league: 'FKF Premier League',
    country: 'Kenya',
    logoText: 'AFC',
    badgeColor: '#003399',
    attackRating: 78,
    defenseRating: 84,
    possessionRating: 80,
    setPieceRating: 82,
    formRating: 79,
    goalsScoredPerGame: 1.35,
    goalsConcededPerGame: 0.85,
    xGPerGame: 1.30,
    xGAPerGame: 0.88,
    cleanSheetPct: 45,
    bttsRatePct: 40,
    recentForm: ['W', 'D', 'W', 'L', 'W'],
    starPlayer: { name: 'Victor Omune', position: 'AM', goals: 7, assists: 4, rating: 7.7 },
  },
  {
    id: 'la-galaxy',
    name: 'LA Galaxy',
    shortName: 'LAG',
    league: 'MLS',
    country: 'United States',
    logoText: 'LAG',
    badgeColor: '#00245D',
    attackRating: 86,
    defenseRating: 75,
    possessionRating: 84,
    setPieceRating: 82,
    formRating: 81,
    goalsScoredPerGame: 2.10,
    goalsConcededPerGame: 1.60,
    xGPerGame: 2.05,
    xGAPerGame: 1.55,
    cleanSheetPct: 20,
    bttsRatePct: 75,
    recentForm: ['W', 'L', 'W', 'W', 'L'],
    starPlayer: { name: 'Riqui Puig', position: 'CM', goals: 9, assists: 12, rating: 8.4 },
  },
  {
    id: 'lafc',
    name: 'LAFC',
    shortName: 'LAFC',
    league: 'MLS',
    country: 'United States',
    logoText: 'LAFC',
    badgeColor: '#C39E5C',
    attackRating: 87,
    defenseRating: 80,
    possessionRating: 83,
    setPieceRating: 85,
    formRating: 83,
    goalsScoredPerGame: 2.05,
    goalsConcededPerGame: 1.30,
    xGPerGame: 2.00,
    xGAPerGame: 1.25,
    cleanSheetPct: 35,
    bttsRatePct: 65,
    recentForm: ['W', 'W', 'D', 'W', 'L'],
    starPlayer: { name: 'Denis Bouanga', position: 'LW', goals: 15, assists: 7, rating: 8.5 },
  },
];

export const DERBY_PRESETS: DerbyPreset[] = [
  {
    id: 'north-london-derby',
    name: 'North London Derby',
    tagline: 'Arsenal vs Tottenham Hotspur - Historic High-Octane London Rivalry',
    league: 'Premier League',
    teamAId: 'arsenal',
    teamBId: 'tottenham',
    pastMeetings: [
      { date: '15 Sep 2024', homeTeam: 'Tottenham', awayTeam: 'Arsenal', homeScore: 0, awayScore: 1, competition: 'Premier League' },
      { date: '28 Apr 2024', homeTeam: 'Tottenham', awayTeam: 'Arsenal', homeScore: 2, awayScore: 3, competition: 'Premier League' },
      { date: '24 Sep 2023', homeTeam: 'Arsenal', awayTeam: 'Tottenham', homeScore: 2, awayScore: 2, competition: 'Premier League' },
      { date: '15 Jan 2023', homeTeam: 'Tottenham', awayTeam: 'Arsenal', homeScore: 0, awayScore: 2, competition: 'Premier League' },
      { date: '01 Oct 2022', homeTeam: 'Arsenal', awayTeam: 'Tottenham', homeScore: 3, awayScore: 1, competition: 'Premier League' },
    ],
  },
  {
    id: 'el-clasico',
    name: 'El Clásico',
    tagline: 'Real Madrid vs Barcelona - The Ultimate Football Rivalry',
    league: 'La Liga',
    teamAId: 'real-madrid',
    teamBId: 'barcelona',
    pastMeetings: [
      { date: '26 Oct 2024', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 0, awayScore: 4, competition: 'La Liga' },
      { date: '21 Apr 2024', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 3, awayScore: 2, competition: 'La Liga' },
      { date: '14 Jan 2024', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 4, awayScore: 1, competition: 'Supercopa' },
      { date: '28 Oct 2023', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 2, competition: 'La Liga' },
      { date: '05 Apr 2023', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 0, awayScore: 4, competition: 'Copa del Rey' },
    ],
  },
  {
    id: 'der-klassiker',
    name: 'Der Klassiker',
    tagline: 'Bayern Munich vs Borussia Dortmund - German Football Supremacy',
    league: 'Bundesliga',
    teamAId: 'bayern-munich',
    teamBId: 'borussia-dortmund',
    pastMeetings: [
      { date: '30 Mar 2024', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 0, awayScore: 2, competition: 'Bundesliga' },
      { date: '04 Nov 2023', homeTeam: 'Borussia Dortmund', awayTeam: 'Bayern Munich', homeScore: 0, awayScore: 4, competition: 'Bundesliga' },
      { date: '01 Apr 2023', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 4, awayScore: 2, competition: 'Bundesliga' },
      { date: '08 Oct 2022', homeTeam: 'Borussia Dortmund', awayTeam: 'Bayern Munich', homeScore: 2, awayScore: 2, competition: 'Bundesliga' },
      { date: '23 Apr 2022', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 3, awayScore: 1, competition: 'Bundesliga' },
    ],
  },
  {
    id: 'derby-della-madonnina',
    name: 'Derby della Madonnina',
    tagline: 'Inter Milan vs AC Milan - The San Siro Clash of Titans',
    league: 'Serie A',
    teamAId: 'inter-milan',
    teamBId: 'ac-milan',
    pastMeetings: [
      { date: '22 Sep 2024', homeTeam: 'Inter Milan', awayTeam: 'AC Milan', homeScore: 1, awayScore: 2, competition: 'Serie A' },
      { date: '22 Apr 2024', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', homeScore: 1, awayScore: 2, competition: 'Serie A' },
      { date: '16 Sep 2023', homeTeam: 'Inter Milan', awayTeam: 'AC Milan', homeScore: 5, awayScore: 1, competition: 'Serie A' },
      { date: '16 May 2023', homeTeam: 'Inter Milan', awayTeam: 'AC Milan', homeScore: 1, awayScore: 0, competition: 'Champions League' },
      { date: '10 May 2023', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', homeScore: 0, awayScore: 2, competition: 'Champions League' },
    ],
  },
  {
    id: 'mashemeji-derby',
    name: 'Mashemeji Derby',
    tagline: 'Gor Mahia vs AFC Leopards - East Africa’s Most Fierce Derby',
    league: 'FKF Premier League',
    teamAId: 'gor-mahia',
    teamBId: 'afc-leopards',
    pastMeetings: [
      { date: '21 Apr 2024', homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', homeScore: 1, awayScore: 0, competition: 'FKF Premier League' },
      { date: '07 Oct 2023', homeTeam: 'AFC Leopards', awayTeam: 'Gor Mahia', homeScore: 0, awayScore: 2, competition: 'FKF Premier League' },
      { date: '14 May 2023', homeTeam: 'AFC Leopards', awayTeam: 'Gor Mahia', homeScore: 2, awayScore: 1, competition: 'FKF Premier League' },
      { date: '29 Jan 2023', homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', homeScore: 0, awayScore: 0, competition: 'FKF Premier League' },
      { date: '08 May 2022', homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', homeScore: 1, awayScore: 1, competition: 'FKF Premier League' },
    ],
  },
  {
    id: 'el-trafico',
    name: 'El Tráfico',
    tagline: 'LA Galaxy vs LAFC - Hollywood High-Scoring Derby Drama',
    league: 'MLS',
    teamAId: 'la-galaxy',
    teamBId: 'lafc',
    pastMeetings: [
      { date: '14 Sep 2024', homeTeam: 'LA Galaxy', awayTeam: 'LAFC', homeScore: 4, awayScore: 2, competition: 'MLS' },
      { date: '04 Jul 2024', homeTeam: 'LAFC', awayTeam: 'LA Galaxy', homeScore: 2, awayScore: 1, competition: 'MLS' },
      { date: '06 Apr 2024', homeTeam: 'LAFC', awayTeam: 'LA Galaxy', homeScore: 2, awayScore: 1, competition: 'MLS' },
      { date: '16 Sep 2023', homeTeam: 'LAFC', awayTeam: 'LA Galaxy', homeScore: 4, awayScore: 2, competition: 'MLS' },
      { date: '04 Jul 2023', homeTeam: 'LA Galaxy', awayTeam: 'LAFC', homeScore: 2, awayScore: 1, competition: 'MLS' },
    ],
  },
];

// Poisson distribution calculation helper
function poissonProb(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

export function simulateH2HMatch(teamA: TeamProfile, teamB: TeamProfile): SimulationResult {
  // Home advantage factor: 1.12x for Team A attacking, 0.92x for Team B attacking
  const homeAdvantage = 1.12;

  // Expected goals based on team attack vs opponent defense ratings
  const lambdaA = Math.max(
    0.4,
    (teamA.goalsScoredPerGame * 0.6 + teamA.xGPerGame * 0.4) *
      (100 / Math.max(50, teamB.defenseRating)) *
      homeAdvantage *
      0.9
  );

  const lambdaB = Math.max(
    0.3,
    (teamB.goalsScoredPerGame * 0.6 + teamB.xGPerGame * 0.4) *
      (100 / Math.max(50, teamA.defenseRating)) *
      0.92 *
      0.85
  );

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let btts = 0;

  const scoreProbs: { score: string; prob: number }[] = [];

  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 6; j++) {
      const p = poissonProb(i, lambdaA) * poissonProb(j, lambdaB);
      if (i > j) homeWin += p;
      else if (i === j) draw += p;
      else awayWin += p;

      if (i + j > 2.5) over25 += p;
      if (i > 0 && j > 0) btts += p;

      scoreProbs.push({ score: `${i} - ${j}`, prob: Math.round(p * 1000) / 10 });
    }
  }

  scoreProbs.sort((a, b) => b.prob - a.prob);

  // Normalize 1X2 probabilities to 100%
  const total1X2 = homeWin + draw + awayWin;
  const homeWinProb = Math.round((homeWin / total1X2) * 100);
  const drawProb = Math.round((draw / total1X2) * 100);
  const awayWinProb = Math.max(5, 100 - homeWinProb - drawProb);

  const over25Prob = Math.round(over25 * 100);
  const bttsProb = Math.round(btts * 100);

  // Tactical Verdict & Best Market recommendation
  let recommendedMarket = 'Home Win (1)';
  let recommendedOdds = 1.75;
  let tacticalVerdict = `${teamA.name} holds home pitch advantage and superior midfield territory control.`;

  if (homeWinProb >= 55) {
    recommendedMarket = `${teamA.name} Win (1)`;
    recommendedOdds = Math.round((100 / homeWinProb + 0.15) * 100) / 100;
    tacticalVerdict = `Algorithmic model predicts ${teamA.name} to control high tempo and exploit defensive transitions.`;
  } else if (over25Prob >= 65) {
    recommendedMarket = 'Over 2.5 Match Goals';
    recommendedOdds = 1.68;
    tacticalVerdict = `High cumulative expected goals (${(lambdaA + lambdaB).toFixed(2)}) favor an open game with multiple chances.`;
  } else if (bttsProb >= 62) {
    recommendedMarket = 'Both Teams to Score (BTTS - Yes)';
    recommendedOdds = 1.72;
    tacticalVerdict = `Both teams feature prolific attacking units with vulnerability on defensive set-pieces.`;
  } else if (awayWinProb >= 45) {
    recommendedMarket = `${teamB.name} Win or Draw (X2)`;
    recommendedOdds = 1.65;
    tacticalVerdict = `${teamB.name} defensive resilience minimizes home conversion threat.`;
  } else {
    recommendedMarket = 'Under 3.5 Goals';
    recommendedOdds = 1.45;
    tacticalVerdict = `Tightly contested tactical clash with midfield congestion suppressing high-value scoring chances.`;
  }

  return {
    homeWinProb,
    drawProb,
    awayWinProb,
    over25Prob,
    bttsProb,
    expectedHomeGoals: Math.round(lambdaA * 100) / 100,
    expectedAwayGoals: Math.round(lambdaB * 100) / 100,
    topScores: scoreProbs.slice(0, 4),
    recommendedMarket,
    recommendedOdds,
    tacticalVerdict,
  };
}
