export interface StandingRow {
  position: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form?: string;
}

export interface LeagueConfig {
  id: number;
  name: string;
  flag: string;
  season: string;
  matchdayLabel: string;
  totalMatchdays: number;
  currentMatchday: number;
}

export const LEAGUES: LeagueConfig[] = [
  { id: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', season: '2026/2027', matchdayLabel: 'Matchday 2 of 38 (August Kickoff)', totalMatchdays: 38, currentMatchday: 2 },
  { id: 140, name: 'La Liga', flag: '🇪🇸', season: '2026/2027', matchdayLabel: 'Matchday 2 of 38 (August Kickoff)', totalMatchdays: 38, currentMatchday: 2 },
  { id: 135, name: 'Serie A', flag: '🇮🇹', season: '2026/2027', matchdayLabel: 'Matchday 2 of 38 (August Kickoff)', totalMatchdays: 38, currentMatchday: 2 },
  { id: 78, name: 'Bundesliga', flag: '🇩🇪', season: '2026/2027', matchdayLabel: 'Matchday 1 of 34 (August Kickoff)', totalMatchdays: 34, currentMatchday: 1 },
  { id: 61, name: 'Ligue 1', flag: '🇫🇷', season: '2026/2027', matchdayLabel: 'Matchday 2 of 34 (August Kickoff)', totalMatchdays: 34, currentMatchday: 2 },
  { id: 2, name: 'Champions League', flag: '🏆', season: '2026/2027', matchdayLabel: '36-Team League Phase (Starts September)', totalMatchdays: 8, currentMatchday: 0 },
  { id: 276, name: 'Kenyan Premier League', flag: '🇰🇪', season: '2026/2027', matchdayLabel: '2026/2027 Season', totalMatchdays: 34, currentMatchday: 2 },
  { id: 1, name: 'World Cup Qualifiers', flag: '🌍', season: '2026', matchdayLabel: 'Matchday 12 of 18 (Road to 2026)', totalMatchdays: 18, currentMatchday: 12 },
];

// 2026/2027 Active Season Standings (August Kickoff, Matchday 1-2 played)
export const CURRENT_SEASON_STANDINGS: Record<number, StandingRow[]> = {
  // Premier League (id: 39) - Official 20-Club Premier League Table
  39: [
    { position: 1, team: 'Manchester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, gd: 5, points: 6, form: 'WW' },
    { position: 2, team: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 0, gd: 4, points: 6, form: 'WW' },
    { position: 3, team: 'Liverpool', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 0, gd: 4, points: 6, form: 'WW' },
    { position: 4, team: 'Chelsea', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 6, ga: 4, gd: 2, points: 3, form: 'LW' },
    { position: 5, team: 'Aston Villa', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 3, form: 'WL' },
    { position: 6, team: 'Tottenham Hotspur', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 5, ga: 1, gd: 4, points: 4, form: 'DW' },
    { position: 7, team: 'Newcastle United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, points: 4, form: 'WD' },
    { position: 8, team: 'Brighton & Hove Albion', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 1, gd: 4, points: 6, form: 'WW' },
    { position: 9, team: 'Manchester United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, points: 3, form: 'WL' },
    { position: 10, team: 'Fulham', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, points: 3, form: 'LW' },
    { position: 11, team: 'AFC Bournemouth', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 2, ga: 2, gd: 0, points: 2, form: 'DD' },
    { position: 12, team: 'Brentford', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 3, form: 'WL' },
    { position: 13, team: 'Nottingham Forest', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, points: 4, form: 'DW' },
    { position: 14, team: 'West Ham United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 2, gd: 1, points: 3, form: 'LW' },
    { position: 15, team: 'Leicester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 1, form: 'DL' },
    { position: 16, team: 'Crystal Palace', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 4, gd: -3, points: 0, form: 'LL' },
    { position: 17, team: 'Ipswich Town', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 6, gd: -5, points: 0, form: 'LL' },
    { position: 18, team: 'Wolverhampton Wanderers', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 2, ga: 8, gd: -6, points: 0, form: 'LL' },
    { position: 19, team: 'Southampton', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 2, gd: -2, points: 0, form: 'LL' },
    { position: 20, team: 'Everton', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 7, gd: -7, points: 0, form: 'LL' },
  ],

  // La Liga (id: 140) - 2026/27 Matchday 2
  140: [
    { position: 1, team: 'Celta Vigo', logo: 'https://media.api-sports.io/football/teams/538.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 2, gd: 3, points: 6, form: 'WW' },
    { position: 2, team: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 2, gd: 2, points: 6, form: 'WW' },
    { position: 3, team: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, points: 4, form: 'DW' },
    { position: 4, team: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 1, gd: 3, points: 4, form: 'DW' },
    { position: 5, team: 'Villarreal', logo: 'https://media.api-sports.io/football/teams/533.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 6, ga: 5, gd: 1, points: 4, form: 'DW' },
    { position: 6, team: 'Leganés', logo: 'https://media.api-sports.io/football/teams/745.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 3, ga: 2, gd: 1, points: 4, form: 'DW' },
    { position: 7, team: 'Osasuna', logo: 'https://media.api-sports.io/football/teams/727.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, points: 4, form: 'DW' },
    { position: 8, team: 'Rayo Vallecano', logo: 'https://media.api-sports.io/football/teams/728.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, points: 4, form: 'WD' },
    { position: 9, team: 'Real Sociedad', logo: 'https://media.api-sports.io/football/teams/548.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, points: 3, form: 'LW' },
    { position: 10, team: 'Real Valladolid', logo: 'https://media.api-sports.io/football/teams/720.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 3, form: 'WL' },
    { position: 11, team: 'Getafe', logo: 'https://media.api-sports.io/football/teams/546.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 1, ga: 1, gd: 0, points: 2, form: 'DD' },
    { position: 12, team: 'Real Betis', logo: 'https://media.api-sports.io/football/teams/543.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 1, ga: 1, gd: 0, points: 2, form: 'DD' },
    { position: 13, team: 'Athletic Club', logo: 'https://media.api-sports.io/football/teams/531.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 1, form: 'DL' },
    { position: 14, team: 'Las Palmas', logo: 'https://media.api-sports.io/football/teams/534.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 3, ga: 4, gd: -1, points: 1, form: 'DL' },
    { position: 15, team: 'Sevilla', logo: 'https://media.api-sports.io/football/teams/536.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 1, form: 'DL' },
    { position: 16, team: 'Alavés', logo: 'https://media.api-sports.io/football/teams/542.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 2, gd: -1, points: 1, form: 'LD' },
    { position: 17, team: 'Real Mallorca', logo: 'https://media.api-sports.io/football/teams/798.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 2, gd: -1, points: 1, form: 'DL' },
    { position: 18, team: 'Girona', logo: 'https://media.api-sports.io/football/teams/547.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 4, gd: -3, points: 1, form: 'DL' },
    { position: 19, team: 'Espanyol', logo: 'https://media.api-sports.io/football/teams/540.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 2, gd: -2, points: 0, form: 'LL' },
    { position: 20, team: 'Valencia', logo: 'https://media.api-sports.io/football/teams/532.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 2, ga: 5, gd: -3, points: 0, form: 'LL' },
  ],

  // Serie A (id: 135) - 2026/27 Matchday 2
  135: [
    { position: 1, team: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 0, gd: 6, points: 6, form: 'WW' },
    { position: 2, team: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, gd: 2, points: 4, form: 'DW' },
    { position: 3, team: 'Torino', logo: 'https://media.api-sports.io/football/teams/503.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 3, gd: 1, points: 4, form: 'DW' },
    { position: 4, team: 'Genoa', logo: 'https://media.api-sports.io/football/teams/495.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 3, ga: 2, gd: 1, points: 4, form: 'DW' },
    { position: 5, team: 'Parma', logo: 'https://media.api-sports.io/football/teams/511.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 3, ga: 2, gd: 1, points: 4, form: 'DW' },
    { position: 6, team: 'Udinese', logo: 'https://media.api-sports.io/football/teams/494.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 3, ga: 2, gd: 1, points: 4, form: 'DW' },
    { position: 7, team: 'Empoli', logo: 'https://media.api-sports.io/football/teams/512.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, points: 4, form: 'DW' },
    { position: 8, team: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 5, ga: 2, gd: 3, points: 3, form: 'WL' },
    { position: 9, team: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 4, ga: 3, gd: 1, points: 3, form: 'WL' },
    { position: 10, team: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 3, gd: 0, points: 3, form: 'LW' },
    { position: 11, team: 'Verona', logo: 'https://media.api-sports.io/football/teams/504.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 3, gd: 0, points: 3, form: 'WL' },
    { position: 12, team: 'Cagliari', logo: 'https://media.api-sports.io/football/teams/490.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 2, ga: 2, gd: 0, points: 2, form: 'DD' },
    { position: 13, team: 'Fiorentina', logo: 'https://media.api-sports.io/football/teams/502.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 1, ga: 1, gd: 0, points: 2, form: 'DD' },
    { position: 14, team: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 3, ga: 4, gd: -1, points: 1, form: 'DL' },
    { position: 15, team: 'AS Roma', logo: 'https://media.api-sports.io/football/teams/497.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 2, gd: -1, points: 1, form: 'DL' },
    { position: 16, team: 'Monza', logo: 'https://media.api-sports.io/football/teams/1579.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 0, ga: 1, gd: -1, points: 1, form: 'DL' },
    { position: 17, team: 'Bologna', logo: 'https://media.api-sports.io/football/teams/500.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 4, gd: -3, points: 1, form: 'DL' },
    { position: 18, team: 'Como', logo: 'https://media.api-sports.io/football/teams/867.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 4, gd: -3, points: 1, form: 'LD' },
    { position: 19, team: 'Venezia', logo: 'https://media.api-sports.io/football/teams/517.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 3, gd: -2, points: 1, form: 'LD' },
    { position: 20, team: 'Lecce', logo: 'https://media.api-sports.io/football/teams/867.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 6, gd: -6, points: 0, form: 'LL' },
  ],

  // Bundesliga (id: 78) - 2026/27 Matchday 1
  78: [
    { position: 1, team: 'SC Freiburg', logo: 'https://media.api-sports.io/football/teams/160.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, points: 3, form: 'W' },
    { position: 2, team: 'FC Heidenheim', logo: 'https://media.api-sports.io/football/teams/180.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, points: 3, form: 'W' },
    { position: 3, team: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, points: 3, form: 'W' },
    { position: 4, team: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 2, gd: 1, points: 3, form: 'W' },
    { position: 5, team: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 2, gd: 1, points: 3, form: 'W' },
    { position: 6, team: 'TSG Hoffenheim', logo: 'https://media.api-sports.io/football/teams/167.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 2, gd: 1, points: 3, form: 'W' },
    { position: 7, team: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png', played: 1, won: 1, drawn: 0, lost: 0, gf: 1, ga: 0, gd: 1, points: 3, form: 'W' },
    { position: 8, team: 'FC Augsburg', logo: 'https://media.api-sports.io/football/teams/170.png', played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, points: 1, form: 'D' },
    { position: 9, team: 'Werder Bremen', logo: 'https://media.api-sports.io/football/teams/162.png', played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, points: 1, form: 'D' },
    { position: 10, team: 'FSV Mainz 05', logo: 'https://media.api-sports.io/football/teams/164.png', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1, form: 'D' },
    { position: 11, team: 'Union Berlin', logo: 'https://media.api-sports.io/football/teams/182.png', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1, form: 'D' },
    { position: 12, team: 'VfL Wolfsburg', logo: 'https://media.api-sports.io/football/teams/161.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 0, form: 'L' },
    { position: 13, team: 'Borussia Mönchengladbach', logo: 'https://media.api-sports.io/football/teams/163.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 0, form: 'L' },
    { position: 14, team: 'Holstein Kiel', logo: 'https://media.api-sports.io/football/teams/191.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 0, form: 'L' },
    { position: 15, team: 'VfL Bochum', logo: 'https://media.api-sports.io/football/teams/176.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 1, gd: -1, points: 0, form: 'L' },
    { position: 16, team: 'VfB Stuttgart', logo: 'https://media.api-sports.io/football/teams/172.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 0, form: 'L' },
    { position: 17, team: 'Eintracht Frankfurt', logo: 'https://media.api-sports.io/football/teams/169.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, points: 0, form: 'L' },
    { position: 18, team: 'FC St. Pauli', logo: 'https://media.api-sports.io/football/teams/186.png', played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, points: 0, form: 'L' },
  ],

  // Ligue 1 (id: 61) - 2026/27 Matchday 2
  61: [
    { position: 1, team: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 10, ga: 1, gd: 9, points: 6, form: 'WW' },
    { position: 2, team: 'Lille OSC', logo: 'https://media.api-sports.io/football/teams/79.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 0, gd: 4, points: 6, form: 'WW' },
    { position: 3, team: 'AS Monaco', logo: 'https://media.api-sports.io/football/teams/91.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, points: 6, form: 'WW' },
    { position: 4, team: 'RC Lens', logo: 'https://media.api-sports.io/football/teams/116.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, points: 6, form: 'WW' },
    { position: 5, team: 'Olympique de Marseille', logo: 'https://media.api-sports.io/football/teams/81.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 7, ga: 3, gd: 4, points: 4, form: 'WD' },
    { position: 6, team: 'FC Nantes', logo: 'https://media.api-sports.io/football/teams/83.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 0, gd: 2, points: 4, form: 'DW' },
    { position: 7, team: 'Strasbourg', logo: 'https://media.api-sports.io/football/teams/95.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, gd: 2, points: 4, form: 'DW' },
    { position: 8, team: 'Stade Rennais', logo: 'https://media.api-sports.io/football/teams/94.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 4, ga: 3, gd: 1, points: 3, form: 'WL' },
    { position: 9, team: 'Le Havre', logo: 'https://media.api-sports.io/football/teams/97.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 4, gd: -1, points: 3, form: 'LW' },
    { position: 10, team: 'Auxerre', logo: 'https://media.api-sports.io/football/teams/98.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 3, form: 'WL' },
    { position: 11, team: 'Toulouse FC', logo: 'https://media.api-sports.io/football/teams/96.png', played: 2, won: 0, drawn: 2, lost: 0, gf: 1, ga: 1, gd: 0, points: 2, form: 'DD' },
    { position: 12, team: 'OGC Nice', logo: 'https://media.api-sports.io/football/teams/84.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 1, form: 'LD' },
    { position: 13, team: 'Stade de Reims', logo: 'https://media.api-sports.io/football/teams/93.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 4, gd: -2, points: 1, form: 'LD' },
    { position: 14, team: 'Montpellier', logo: 'https://media.api-sports.io/football/teams/82.png', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 7, gd: -6, points: 1, form: 'DL' },
    { position: 15, team: 'Saint-Étienne', logo: 'https://media.api-sports.io/football/teams/1063.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 3, gd: -3, points: 0, form: 'LL' },
    { position: 16, team: 'Angers', logo: 'https://media.api-sports.io/football/teams/77.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 3, gd: -3, points: 0, form: 'LL' },
    { position: 17, team: 'Olympique Lyonnais', logo: 'https://media.api-sports.io/football/teams/80.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 5, gd: -5, points: 0, form: 'LL' },
    { position: 18, team: 'Brest', logo: 'https://media.api-sports.io/football/teams/106.png', played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 7, gd: -6, points: 0, form: 'LL' },
  ],

  // Champions League (id: 2) - 2026/27 36-Team League Phase Seeding
  2: [
    { position: 1, team: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 2, team: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 3, team: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 4, team: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 5, team: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 6, team: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 7, team: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 8, team: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 9, team: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 10, team: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 11, team: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 12, team: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 13, team: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
    { position: 14, team: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: '—' },
  ],

  // Kenyan Premier League (FKF) (id: 276) - Official 18-Club FKF Premier League Table
  276: [
    { position: 1, team: 'Gor Mahia FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Gor_Mahia_F.C._logo.svg/300px-Gor_Mahia_F.C._logo.svg.png', played: 34, won: 21, drawn: 10, lost: 3, gf: 48, ga: 20, gd: 28, points: 73, form: 'WWWDW' },
    { position: 2, team: 'Kenya Police FC', logo: 'https://upload.wikimedia.org/wikipedia/en/2/25/Kenya_Police_FC_logo.png', played: 34, won: 19, drawn: 8, lost: 7, gf: 44, ga: 24, gd: 20, points: 65, form: 'WDWWL' },
    { position: 3, team: 'Tusker FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Tusker_FC_logo.png/250px-Tusker_FC_logo.png', played: 34, won: 19, drawn: 8, lost: 7, gf: 47, ga: 27, gd: 20, points: 65, form: 'LWWWW' },
    { position: 4, team: 'Bandari FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Bandari_FC_%28Kenya%29_logo.png/250px-Bandari_FC_%28Kenya%29_logo.png', played: 34, won: 14, drawn: 10, lost: 10, gf: 31, ga: 26, gd: 5, points: 52, form: 'DDDWL' },
    { position: 5, team: 'AFC Leopards', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/AFC_Leopards_logo.png/250px-AFC_Leopards_logo.png', played: 34, won: 13, drawn: 12, lost: 9, gf: 32, ga: 23, gd: 9, points: 51, form: 'WLDWW' },
    { position: 6, team: 'KCB FC', logo: 'https://upload.wikimedia.org/wikipedia/en/9/91/KCB_Bank_Kenya_Limited_logo.png', played: 34, won: 13, drawn: 11, lost: 10, gf: 34, ga: 29, gd: 5, points: 50, form: 'DWLDD' },
    { position: 7, team: 'Nairobi City Stars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Nairobi_City_Stars_FC.png/250px-Nairobi_City_Stars_FC.png', played: 34, won: 13, drawn: 11, lost: 10, gf: 42, ga: 39, gd: 3, points: 50, form: 'LDWLD' },
    { position: 8, team: 'Kakamega Homeboyz', logo: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Kakamega_Homeboyz_F.C._logo.png', played: 34, won: 12, drawn: 12, lost: 10, gf: 33, ga: 28, gd: 5, points: 48, form: 'DLDWW' },
    { position: 9, team: 'Bidco United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Bidco_United_FC_logo.png/250px-Bidco_United_FC_logo.png', played: 34, won: 11, drawn: 11, lost: 12, gf: 36, ga: 38, gd: -2, points: 44, form: 'WLDLW' },
    { position: 10, team: 'Murang\'a Seal', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Murang%27a_Seal_FC_logo.png/250px-Murang%27a_Seal_FC_logo.png', played: 34, won: 9, drawn: 11, lost: 14, gf: 28, ga: 34, gd: -6, points: 38, form: 'DDLLW' },
    { position: 11, team: 'Kariobangi Sharks', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Kariobangi_Sharks_FC_logo.png/250px-Kariobangi_Sharks_FC_logo.png', played: 34, won: 12, drawn: 12, lost: 10, gf: 44, ga: 34, gd: 10, points: 48, form: 'WWDDW' },
    { position: 12, team: 'Posta Rangers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Posta_Rangers_FC_logo.png/250px-Posta_Rangers_FC_logo.png', played: 34, won: 13, drawn: 8, lost: 13, gf: 30, ga: 31, gd: -1, points: 47, form: 'LLDLL' },
    { position: 13, team: 'Ulinzi Stars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Ulinzi_Stars_FC_logo.png/250px-Ulinzi_Stars_FC_logo.png', played: 34, won: 10, drawn: 9, lost: 15, gf: 24, ga: 28, gd: -4, points: 39, form: 'LLWDL' },
    { position: 14, team: 'Shabana FC', logo: 'https://upload.wikimedia.org/wikipedia/en/3/30/Shabana_FC_logo.png', played: 34, won: 10, drawn: 8, lost: 16, gf: 38, ga: 45, gd: -7, points: 38, form: 'WDWWL' },
    { position: 15, team: 'FC Talanta', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/FC_Talanta_logo.png/250px-FC_Talanta_logo.png', played: 34, won: 8, drawn: 13, lost: 13, gf: 35, ga: 48, gd: -13, points: 37, form: 'DLDDD' },
    { position: 16, team: 'Sofapaka FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Sofapaka_FC_logo.png/250px-Sofapaka_FC_logo.png', played: 34, won: 9, drawn: 9, lost: 16, gf: 39, ga: 53, gd: -14, points: 36, form: 'WLDDW' },
    { position: 17, team: 'Mara Sugar FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Mara_Sugar_FC_logo.png/250px-Mara_Sugar_FC_logo.png', played: 34, won: 8, drawn: 9, lost: 17, gf: 29, ga: 49, gd: -20, points: 33, form: 'DLLLD' },
    { position: 18, team: 'Mathare United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Mathare_United_logo.png/250px-Mathare_United_logo.png', played: 34, won: 7, drawn: 9, lost: 18, gf: 26, ga: 52, gd: -26, points: 30, form: 'LLDDL' },
  ],

  // World Cup Qualifiers (id: 1) - Active 2026 Road to FIFA World Cup
  1: [
    { position: 1, team: 'Argentina', logo: 'https://media.api-sports.io/football/teams/26.png', played: 12, won: 9, drawn: 1, lost: 2, gf: 21, ga: 7, gd: 14, points: 28, form: 'WWLWW' },
    { position: 2, team: 'Uruguay', logo: 'https://media.api-sports.io/football/teams/7.png', played: 12, won: 5, drawn: 5, lost: 2, gf: 17, ga: 9, gd: 8, points: 20, form: 'DDWDD' },
    { position: 3, team: 'Ecuador', logo: 'https://media.api-sports.io/football/teams/2384.png', played: 12, won: 6, drawn: 4, lost: 2, gf: 11, ga: 4, gd: 7, points: 19, form: 'WWDDW' },
    { position: 4, team: 'Colombia', logo: 'https://media.api-sports.io/football/teams/8.png', played: 12, won: 5, drawn: 4, lost: 3, gf: 15, ga: 10, gd: 5, points: 19, form: 'LLWDW' },
    { position: 5, team: 'Brazil', logo: 'https://media.api-sports.io/football/teams/6.png', played: 12, won: 5, drawn: 3, lost: 4, gf: 17, ga: 11, gd: 6, points: 18, form: 'DDWWL' },
    { position: 6, team: 'Paraguay', logo: 'https://media.api-sports.io/football/teams/18.png', played: 12, won: 4, drawn: 5, lost: 3, gf: 8, ga: 7, gd: 1, points: 17, form: 'WWDWD' },
    { position: 7, team: 'Bolivia', logo: 'https://media.api-sports.io/football/teams/27.png', played: 12, won: 4, drawn: 1, lost: 7, gf: 11, ga: 25, gd: -14, points: 13, form: 'WWLLD' },
    { position: 8, team: 'Venezuela', logo: 'https://media.api-sports.io/football/teams/25.png', played: 12, won: 2, drawn: 6, lost: 4, gf: 11, ga: 15, gd: -4, points: 12, form: 'LDDLD' },
    { position: 9, team: 'Chile', logo: 'https://media.api-sports.io/football/teams/22.png', played: 12, won: 2, drawn: 3, lost: 7, gf: 9, ga: 20, gd: -11, points: 9, form: 'LLLLW' },
    { position: 10, team: 'Peru', logo: 'https://media.api-sports.io/football/teams/30.png', played: 12, won: 1, drawn: 4, lost: 7, gf: 3, ga: 15, gd: -12, points: 7, form: 'WLDLL' },
  ]
};

// 2025/2026 Archived Full Season Standings
export const ARCHIVED_SEASON_STANDINGS: Record<number, StandingRow[]> = {
  39: [
    { position: 1, team: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', played: 38, won: 28, drawn: 7, lost: 3, gf: 96, ga: 34, gd: 62, points: 91, form: 'WWWWW' },
    { position: 2, team: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', played: 38, won: 28, drawn: 5, lost: 5, gf: 91, ga: 29, gd: 62, points: 89, form: 'WWWWW' },
    { position: 3, team: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', played: 38, won: 24, drawn: 10, lost: 4, gf: 86, ga: 41, gd: 45, points: 82, form: 'WDWWW' },
    { position: 4, team: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png', played: 38, won: 20, drawn: 8, lost: 10, gf: 76, ga: 61, gd: 15, points: 68, form: 'LDDLD' },
    { position: 5, team: 'Tottenham Hotspur', logo: 'https://media.api-sports.io/football/teams/47.png', played: 38, won: 20, drawn: 6, lost: 12, gf: 74, ga: 61, gd: 13, points: 66, form: 'WLLWL' },
    { position: 6, team: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', played: 38, won: 18, drawn: 9, lost: 11, gf: 77, ga: 63, gd: 14, points: 63, form: 'WWWWW' },
    { position: 7, team: 'Newcastle United', logo: 'https://media.api-sports.io/football/teams/34.png', played: 38, won: 18, drawn: 6, lost: 14, gf: 85, ga: 62, gd: 23, points: 60, form: 'WDWLW' },
    { position: 8, team: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png', played: 38, won: 18, drawn: 6, lost: 14, gf: 57, ga: 58, gd: -1, points: 60, form: 'WWLLD' },
    { position: 9, team: 'West Ham United', logo: 'https://media.api-sports.io/football/teams/48.png', played: 38, won: 14, drawn: 10, lost: 14, gf: 60, ga: 74, gd: -14, points: 52, form: 'LWLLD' },
    { position: 10, team: 'Crystal Palace', logo: 'https://media.api-sports.io/football/teams/52.png', played: 38, won: 13, drawn: 10, lost: 15, gf: 57, ga: 58, gd: -1, points: 49, form: 'WWWDW' },
    { position: 11, team: 'Brighton & Hove Albion', logo: 'https://media.api-sports.io/football/teams/51.png', played: 38, won: 12, drawn: 12, lost: 14, gf: 55, ga: 62, gd: -7, points: 48, form: 'LLDWD' },
    { position: 12, team: 'AFC Bournemouth', logo: 'https://media.api-sports.io/football/teams/35.png', played: 38, won: 13, drawn: 9, lost: 16, gf: 54, ga: 67, gd: -13, points: 48, form: 'LLWWL' },
    { position: 13, team: 'Fulham', logo: 'https://media.api-sports.io/football/teams/36.png', played: 38, won: 13, drawn: 8, lost: 17, gf: 55, ga: 61, gd: -6, points: 47, form: 'WLLDD' },
    { position: 14, team: 'Wolverhampton Wanderers', logo: 'https://media.api-sports.io/football/teams/39.png', played: 38, won: 13, drawn: 7, lost: 18, gf: 50, ga: 65, gd: -15, points: 46, form: 'LLLLW' },
    { position: 15, team: 'Everton', logo: 'https://media.api-sports.io/football/teams/45.png', played: 38, won: 13, drawn: 9, lost: 16, gf: 40, ga: 51, gd: -11, points: 40, form: 'LDWWD' },
    { position: 16, team: 'Brentford', logo: 'https://media.api-sports.io/football/teams/55.png', played: 38, won: 10, drawn: 9, lost: 19, gf: 56, ga: 65, gd: -9, points: 39, form: 'LWWDW' },
    { position: 17, team: 'Nottingham Forest', logo: 'https://media.api-sports.io/football/teams/65.png', played: 38, won: 9, drawn: 9, lost: 20, gf: 49, ga: 67, gd: -18, points: 32, form: 'WLWLL' },
    { position: 18, team: 'Leicester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png', played: 38, won: 9, drawn: 7, lost: 22, gf: 42, ga: 68, gd: -26, points: 34, form: 'LLDLL' },
    { position: 19, team: 'Ipswich Town', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png', played: 38, won: 6, drawn: 8, lost: 24, gf: 35, ga: 74, gd: -39, points: 26, form: 'LLLLD' },
    { position: 20, team: 'Southampton', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png', played: 38, won: 5, drawn: 7, lost: 26, gf: 30, ga: 82, gd: -52, points: 22, form: 'LLLLL' },
  ],
  276: [
    { position: 1, team: 'Gor Mahia FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Gor_Mahia_F.C._logo.svg/300px-Gor_Mahia_F.C._logo.svg.png', played: 34, won: 21, drawn: 10, lost: 3, gf: 48, ga: 20, gd: 28, points: 73, form: 'WWWDW' },
    { position: 2, team: 'Kenya Police FC', logo: 'https://upload.wikimedia.org/wikipedia/en/2/25/Kenya_Police_FC_logo.png', played: 34, won: 19, drawn: 8, lost: 7, gf: 44, ga: 24, gd: 20, points: 65, form: 'WDWWL' },
    { position: 3, team: 'Tusker FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Tusker_FC_logo.png/250px-Tusker_FC_logo.png', played: 34, won: 19, drawn: 8, lost: 7, gf: 47, ga: 27, gd: 20, points: 65, form: 'LWWWW' },
    { position: 4, team: 'Bandari FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Bandari_FC_%28Kenya%29_logo.png/250px-Bandari_FC_%28Kenya%29_logo.png', played: 34, won: 14, drawn: 10, lost: 10, gf: 31, ga: 26, gd: 5, points: 52, form: 'DDDWL' },
    { position: 5, team: 'AFC Leopards', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/AFC_Leopards_logo.png/250px-AFC_Leopards_logo.png', played: 34, won: 13, drawn: 12, lost: 9, gf: 32, ga: 23, gd: 9, points: 51, form: 'WLDWW' },
    { position: 6, team: 'KCB FC', logo: 'https://upload.wikimedia.org/wikipedia/en/9/91/KCB_Bank_Kenya_Limited_logo.png', played: 34, won: 13, drawn: 11, lost: 10, gf: 34, ga: 29, gd: 5, points: 50, form: 'DWLDD' },
    { position: 7, team: 'Nairobi City Stars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Nairobi_City_Stars_FC.png/250px-Nairobi_City_Stars_FC.png', played: 34, won: 13, drawn: 11, lost: 10, gf: 42, ga: 39, gd: 3, points: 50, form: 'LDWLD' },
    { position: 8, team: 'Kakamega Homeboyz', logo: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Kakamega_Homeboyz_F.C._logo.png', played: 34, won: 12, drawn: 12, lost: 10, gf: 33, ga: 28, gd: 5, points: 48, form: 'DLDWW' },
    { position: 9, team: 'Bidco United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Bidco_United_FC_logo.png/250px-Bidco_United_FC_logo.png', played: 34, won: 11, drawn: 11, lost: 12, gf: 36, ga: 38, gd: -2, points: 44, form: 'WLDLW' },
    { position: 10, team: 'Murang\'a Seal', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Murang%27a_Seal_FC_logo.png/250px-Murang%27a_Seal_FC_logo.png', played: 34, won: 9, drawn: 11, lost: 14, gf: 28, ga: 34, gd: -6, points: 38, form: 'DDLLW' },
    { position: 11, team: 'Kariobangi Sharks', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Kariobangi_Sharks_FC_logo.png/250px-Kariobangi_Sharks_FC_logo.png', played: 34, won: 12, drawn: 12, lost: 10, gf: 44, ga: 34, gd: 10, points: 48, form: 'WWDDW' },
    { position: 12, team: 'Posta Rangers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Posta_Rangers_FC_logo.png/250px-Posta_Rangers_FC_logo.png', played: 34, won: 13, drawn: 8, lost: 13, gf: 30, ga: 31, gd: -1, points: 47, form: 'LLDLL' },
    { position: 13, team: 'Ulinzi Stars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Ulinzi_Stars_FC_logo.png/250px-Ulinzi_Stars_FC_logo.png', played: 34, won: 10, drawn: 9, lost: 15, gf: 24, ga: 28, gd: -4, points: 39, form: 'LLWDL' },
    { position: 14, team: 'Shabana FC', logo: 'https://upload.wikimedia.org/wikipedia/en/3/30/Shabana_FC_logo.png', played: 34, won: 10, drawn: 8, lost: 16, gf: 38, ga: 45, gd: -7, points: 38, form: 'WDWWL' },
    { position: 15, team: 'FC Talanta', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/FC_Talanta_logo.png/250px-FC_Talanta_logo.png', played: 34, won: 8, drawn: 13, lost: 13, gf: 35, ga: 48, gd: -13, points: 37, form: 'DLDDD' },
    { position: 16, team: 'Sofapaka FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Sofapaka_FC_logo.png/250px-Sofapaka_FC_logo.png', played: 34, won: 9, drawn: 9, lost: 16, gf: 39, ga: 53, gd: -14, points: 36, form: 'WLDDW' },
    { position: 17, team: 'Mara Sugar FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Mara_Sugar_FC_logo.png/250px-Mara_Sugar_FC_logo.png', played: 34, won: 8, drawn: 9, lost: 17, gf: 29, ga: 49, gd: -20, points: 33, form: 'DLLLD' },
    { position: 18, team: 'Mathare United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Mathare_United_logo.png/250px-Mathare_United_logo.png', played: 34, won: 7, drawn: 9, lost: 18, gf: 26, ga: 52, gd: -26, points: 30, form: 'LLDDL' },
  ],
  140: [
    { position: 1, team: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', played: 38, won: 29, drawn: 8, lost: 1, gf: 87, ga: 26, gd: 61, points: 95, form: 'DWWWW' },
    { position: 2, team: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', played: 38, won: 26, drawn: 7, lost: 5, gf: 79, ga: 44, gd: 35, points: 85, form: 'WWWWL' },
    { position: 3, team: 'Girona', logo: 'https://media.api-sports.io/football/teams/547.png', played: 38, won: 25, drawn: 6, lost: 7, gf: 85, ga: 46, gd: 39, points: 81, form: 'WWLWW' },
    { position: 4, team: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', played: 38, won: 24, drawn: 4, lost: 10, gf: 70, ga: 43, gd: 27, points: 76, form: 'WWLWW' },
    { position: 5, team: 'Athletic Club', logo: 'https://media.api-sports.io/football/teams/531.png', played: 38, won: 19, drawn: 11, lost: 8, gf: 61, ga: 37, gd: 24, points: 68, form: 'WWLDW' },
  ]
};

// Default export alias for backwards compatibility
export const FALLBACK_STANDINGS = CURRENT_SEASON_STANDINGS;

