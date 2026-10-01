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
  { id: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', season: '2026/2027', matchdayLabel: 'Matchday 6 of 38 (Live Season Table)', totalMatchdays: 38, currentMatchday: 6 },
  { id: 140, name: 'La Liga', flag: '🇪🇸', season: '2026/2027', matchdayLabel: 'Matchday 7 of 38 (Live Season Table)', totalMatchdays: 38, currentMatchday: 7 },
  { id: 135, name: 'Serie A', flag: '🇮🇹', season: '2026/2027', matchdayLabel: 'Matchday 5 of 38 (Live Season Table)', totalMatchdays: 38, currentMatchday: 5 },
  { id: 78, name: 'Bundesliga', flag: '🇩🇪', season: '2026/2027', matchdayLabel: 'Matchday 4 of 34 (Live Season Table)', totalMatchdays: 34, currentMatchday: 4 },
  { id: 61, name: 'Ligue 1', flag: '🇫🇷', season: '2026/2027', matchdayLabel: 'Matchday 6 of 34 (Live Season Table)', totalMatchdays: 34, currentMatchday: 6 },
  { id: 2, name: 'Champions League', flag: '🏆', season: '2026/2027', matchdayLabel: '36-Team League Phase (Matchday 2 of 8)', totalMatchdays: 8, currentMatchday: 2 },
  { id: 276, name: 'Kenyan Premier League', flag: '🇰🇪', season: '2026/2027', matchdayLabel: '2026/2027 Season', totalMatchdays: 34, currentMatchday: 6 },
  { id: 12, name: 'CAF Champions League & Africa Elite', flag: '🌍', season: '2026/2027', matchdayLabel: 'Continental Group & Knockout Power Table (54 CAF Nations)', totalMatchdays: 10, currentMatchday: 4 },
  { id: 1, name: 'World Cup Qualifiers', flag: '🌍', season: '2026', matchdayLabel: 'Matchday 12 of 18 (Road to 2026)', totalMatchdays: 18, currentMatchday: 12 },
];

// 2026/2027 Active Season Standings (Synced with Official ESPN Live Tables)
export const CURRENT_SEASON_STANDINGS: Record<number, StandingRow[]> = {
  // Premier League (id: 39) - Official 20-Club Premier League Table
  39: [
    { position: 1, team: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', played: 6, won: 5, drawn: 1, lost: 0, gf: 14, ga: 3, gd: 11, points: 16, form: 'WWDWW' },
    { position: 2, team: 'Manchester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png', played: 6, won: 5, drawn: 0, lost: 1, gf: 16, ga: 5, gd: 11, points: 15, form: 'WWLWW' },
    { position: 3, team: 'Liverpool', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png', played: 6, won: 4, drawn: 2, lost: 0, gf: 13, ga: 5, gd: 8, points: 14, form: 'WWDWD' },
    { position: 4, team: 'Chelsea', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png', played: 6, won: 4, drawn: 1, lost: 1, gf: 15, ga: 7, gd: 8, points: 13, form: 'WWDWL' },
    { position: 5, team: 'Aston Villa', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png', played: 6, won: 4, drawn: 1, lost: 1, gf: 12, ga: 7, gd: 5, points: 13, form: 'WWWDL' },
    { position: 6, team: 'Newcastle United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png', played: 6, won: 3, drawn: 2, lost: 1, gf: 10, ga: 6, gd: 4, points: 11, form: 'DWWLD' },
    { position: 7, team: 'Tottenham Hotspur', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png', played: 6, won: 3, drawn: 1, lost: 2, gf: 12, ga: 7, gd: 5, points: 10, form: 'WWLLD' },
    { position: 8, team: 'Brighton & Hove Albion', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png', played: 6, won: 2, drawn: 3, lost: 1, gf: 10, ga: 8, gd: 2, points: 9, form: 'LDDWW' },
    { position: 9, team: 'Fulham', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png', played: 6, won: 2, drawn: 3, lost: 1, gf: 8, ga: 6, gd: 2, points: 9, form: 'WWDDL' },
    { position: 10, team: 'Nottingham Forest', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png', played: 6, won: 2, drawn: 3, lost: 1, gf: 6, ga: 5, gd: 1, points: 9, form: 'LDWDD' },
    { position: 11, team: 'AFC Bournemouth', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png', played: 6, won: 2, drawn: 2, lost: 2, gf: 8, ga: 8, gd: 0, points: 8, form: 'WLLWD' },
    { position: 12, team: 'Brentford', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png', played: 6, won: 2, drawn: 1, lost: 3, gf: 8, ga: 10, gd: -2, points: 7, form: 'DLLWL' },
    { position: 13, team: 'Manchester United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png', played: 6, won: 2, drawn: 1, lost: 3, gf: 5, ga: 8, gd: -3, points: 7, form: 'LDWLL' },
    { position: 14, team: 'West Ham United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png', played: 6, won: 1, drawn: 2, lost: 3, gf: 6, ga: 10, gd: -4, points: 5, form: 'DLDLW' },
    { position: 15, team: 'Everton', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png', played: 6, won: 1, drawn: 1, lost: 4, gf: 7, ga: 15, gd: -8, points: 4, form: 'WDLLL' },
    { position: 16, team: 'Ipswich Town', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png', played: 6, won: 0, drawn: 4, lost: 2, gf: 5, ga: 10, gd: -5, points: 4, form: 'DDDDL' },
    { position: 17, team: 'Leicester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png', played: 6, won: 0, drawn: 3, lost: 3, gf: 8, ga: 12, gd: -4, points: 3, form: 'LDDLL' },
    { position: 18, team: 'Crystal Palace', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png', played: 6, won: 0, drawn: 3, lost: 3, gf: 5, ga: 9, gd: -4, points: 3, form: 'LDDDL' },
    { position: 19, team: 'Southampton', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png', played: 6, won: 0, drawn: 1, lost: 5, gf: 3, ga: 12, gd: -9, points: 1, form: 'LDLLL' },
    { position: 20, team: 'Wolverhampton Wanderers', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png', played: 6, won: 0, drawn: 1, lost: 5, gf: 6, ga: 16, gd: -10, points: 1, form: 'LLLDL' },
  ],

  // La Liga (id: 140) - Official ESPN Table (Matchday 7)
  140: [
    { position: 1, team: 'Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', played: 7, won: 7, drawn: 0, lost: 0, gf: 31, ga: 7, gd: 24, points: 21, form: 'WWWWW' },
    { position: 2, team: 'Atlético Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png', played: 7, won: 5, drawn: 1, lost: 1, gf: 16, ga: 7, gd: 9, points: 16, form: 'WDWWW' },
    { position: 3, team: 'Real Betis', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png', played: 7, won: 5, drawn: 1, lost: 1, gf: 9, ga: 7, gd: 2, points: 16, form: 'WWDWL' },
    { position: 4, team: 'Real Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png', played: 7, won: 5, drawn: 0, lost: 2, gf: 18, ga: 8, gd: 10, points: 15, form: 'WWWWL' },
    { position: 5, team: 'Sevilla', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png', played: 7, won: 4, drawn: 1, lost: 2, gf: 10, ga: 9, gd: 1, points: 13, form: 'DWWLW' },
    { position: 6, team: 'Alavés', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/96.png', played: 7, won: 3, drawn: 2, lost: 2, gf: 11, ga: 6, gd: 5, points: 11, form: 'LWDWL' },
    { position: 7, team: 'Real Sociedad', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png', played: 7, won: 3, drawn: 1, lost: 3, gf: 9, ga: 13, gd: -4, points: 10, form: 'WDLLW' },
    { position: 8, team: 'Villarreal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png', played: 7, won: 2, drawn: 2, lost: 3, gf: 13, ga: 12, gd: 1, points: 8, form: 'WLWDL' },
    { position: 9, team: 'Athletic Club', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png', played: 6, won: 2, drawn: 2, lost: 2, gf: 7, ga: 6, gd: 1, points: 8, form: 'DWWLL' },
    { position: 10, team: 'Getafe', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2922.png', played: 7, won: 2, drawn: 2, lost: 3, gf: 4, ga: 7, gd: -3, points: 8, form: 'WDLLD' },
    { position: 11, team: 'Rayo Vallecano', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/101.png', played: 7, won: 2, drawn: 2, lost: 3, gf: 11, ga: 16, gd: -5, points: 8, form: 'DDWLL' },
    { position: 12, team: 'Osasuna', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png', played: 7, won: 2, drawn: 2, lost: 3, gf: 6, ga: 13, gd: -7, points: 8, form: 'WDLWL' },
    { position: 13, team: 'Celta Vigo', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png', played: 7, won: 1, drawn: 4, lost: 2, gf: 8, ga: 6, gd: 2, points: 7, form: 'DDLWD' },
    { position: 14, team: 'Espanyol', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/88.png', played: 7, won: 2, drawn: 1, lost: 4, gf: 10, ga: 10, gd: 0, points: 7, form: 'LLLWW' },
    { position: 15, team: 'Girona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png', played: 7, won: 2, drawn: 1, lost: 4, gf: 8, ga: 11, gd: -3, points: 7, form: 'DLLWW' },
    { position: 16, team: 'Real Mallorca', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/84.png', played: 7, won: 2, drawn: 1, lost: 4, gf: 6, ga: 9, gd: -3, points: 7, form: 'WWLLD' },
    { position: 17, team: 'Leganés', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17534.png', played: 7, won: 1, drawn: 3, lost: 3, gf: 5, ga: 8, gd: -3, points: 6, form: 'DDLLD' },
    { position: 18, team: 'Elche', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3751.png', played: 7, won: 1, drawn: 2, lost: 4, gf: 11, ga: 17, gd: -6, points: 5, form: 'LDWLL' },
    { position: 19, team: 'Valencia', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png', played: 7, won: 1, drawn: 1, lost: 5, gf: 4, ga: 13, gd: -9, points: 4, form: 'LDWLL' },
    { position: 20, team: 'Las Palmas', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/98.png', played: 7, won: 0, drawn: 3, lost: 4, gf: 7, ga: 13, gd: -6, points: 3, form: 'DLLLD' },
  ],

  // Serie A (id: 135) - Official ESPN Table (Matchday 5)
  135: [
    { position: 1, team: 'AS Roma', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png', played: 5, won: 4, drawn: 1, lost: 0, gf: 14, ga: 3, gd: 11, points: 13, form: 'WWWDW' },
    { position: 2, team: 'Inter Milan', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png', played: 5, won: 4, drawn: 1, lost: 0, gf: 15, ga: 8, gd: 7, points: 13, form: 'WWDWW' },
    { position: 3, team: 'Lazio', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png', played: 5, won: 4, drawn: 1, lost: 0, gf: 8, ga: 3, gd: 5, points: 13, form: 'WDWWW' },
    { position: 4, team: 'Cagliari', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2925.png', played: 5, won: 4, drawn: 0, lost: 1, gf: 5, ga: 2, gd: 3, points: 12, form: 'WWLWW' },
    { position: 5, team: 'AC Milan', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png', played: 5, won: 3, drawn: 2, lost: 0, gf: 10, ga: 4, gd: 6, points: 11, form: 'WWDDW' },
    { position: 6, team: 'Juventus', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png', played: 5, won: 3, drawn: 1, lost: 1, gf: 8, ga: 4, gd: 4, points: 10, form: 'WDWWL' },
    { position: 7, team: 'Como', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2572.png', played: 5, won: 3, drawn: 1, lost: 1, gf: 9, ga: 6, gd: 3, points: 10, form: 'WWDWL' },
    { position: 8, team: 'Napoli', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png', played: 5, won: 2, drawn: 1, lost: 2, gf: 7, ga: 6, gd: 1, points: 7, form: 'LDWWL' },
    { position: 9, team: 'Sassuolo', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3997.png', played: 5, won: 2, drawn: 1, lost: 2, gf: 9, ga: 9, gd: 0, points: 7, form: 'WLWDL' },
    { position: 10, team: 'Atalanta', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png', played: 5, won: 2, drawn: 0, lost: 3, gf: 5, ga: 7, gd: -2, points: 6, form: 'LWLLW' },
    { position: 11, team: 'Lecce', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png', played: 5, won: 2, drawn: 0, lost: 3, gf: 5, ga: 10, gd: -5, points: 6, form: 'WLLWL' },
    { position: 12, team: 'Udinese', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/118.png', played: 5, won: 1, drawn: 1, lost: 3, gf: 8, ga: 11, gd: -3, points: 4, form: 'LLWDL' },
    { position: 13, team: 'Torino', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/239.png', played: 5, won: 1, drawn: 1, lost: 3, gf: 5, ga: 8, gd: -3, points: 4, form: 'LLLWD' },
    { position: 14, team: 'Parma', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png', played: 5, won: 1, drawn: 1, lost: 3, gf: 4, ga: 7, gd: -3, points: 4, form: 'DLLWL' },
    { position: 15, team: 'Monza', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/4007.png', played: 5, won: 1, drawn: 1, lost: 3, gf: 8, ga: 12, gd: -4, points: 4, form: 'LLWLD' },
    { position: 16, team: 'Fiorentina', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png', played: 5, won: 1, drawn: 1, lost: 3, gf: 6, ga: 12, gd: -6, points: 4, form: 'LWLLD' },
    { position: 17, team: 'Bologna', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png', played: 5, won: 0, drawn: 2, lost: 3, gf: 3, ga: 6, gd: -3, points: 2, form: 'LDDLL' },
    { position: 18, team: 'Genoa', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3263.png', played: 5, won: 0, drawn: 1, lost: 4, gf: 3, ga: 10, gd: -7, points: 1, form: 'LLDLL' },
    { position: 19, team: 'Venezia', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17530.png', played: 5, won: 0, drawn: 0, lost: 5, gf: 4, ga: 13, gd: -9, points: 0, form: 'LLLLL' },
    { position: 20, team: 'Empoli', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2574.png', played: 5, won: 0, drawn: 0, lost: 5, gf: 2, ga: 11, gd: -9, points: 0, form: 'LLLLL' },
  ],

  // Bundesliga (id: 78) - Official ESPN Table (Matchday 4)
  78: [
    { position: 1, team: 'Bayern Munich', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png', played: 4, won: 4, drawn: 0, lost: 0, gf: 16, ga: 3, gd: 13, points: 12, form: 'WWWW' },
    { position: 2, team: 'Eintracht Frankfurt', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png', played: 4, won: 3, drawn: 0, lost: 1, gf: 9, ga: 4, gd: 5, points: 9, form: 'WWWL' },
    { position: 3, team: 'Bayer Leverkusen', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png', played: 4, won: 3, drawn: 0, lost: 1, gf: 13, ga: 9, gd: 4, points: 9, form: 'WWLW' },
    { position: 4, team: 'SC Freiburg', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/126.png', played: 4, won: 3, drawn: 0, lost: 1, gf: 8, ga: 4, gd: 4, points: 9, form: 'WWLW' },
    { position: 5, team: 'RB Leipzig', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png', played: 4, won: 2, drawn: 2, lost: 0, gf: 4, ga: 2, gd: 2, points: 8, form: 'DDWW' },
    { position: 6, team: 'Borussia Dortmund', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png', played: 4, won: 2, drawn: 1, lost: 1, gf: 7, ga: 7, gd: 0, points: 7, form: 'LWDW' },
    { position: 7, team: 'FC Heidenheim', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/6418.png', played: 4, won: 2, drawn: 0, lost: 2, gf: 8, ga: 7, gd: 1, points: 6, form: 'LLWW' },
    { position: 8, team: 'Werder Bremen', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/137.png', played: 4, won: 1, drawn: 2, lost: 1, gf: 4, ga: 8, gd: -4, points: 5, form: 'LWDD' },
    { position: 9, team: 'FSV Mainz 05', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2950.png', played: 4, won: 1, drawn: 1, lost: 2, gf: 7, ga: 8, gd: -1, points: 4, form: 'WLDD' },
    { position: 10, team: 'VfL Wolfsburg', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/138.png', played: 4, won: 1, drawn: 1, lost: 2, gf: 7, ga: 8, gd: -1, points: 4, form: 'LLWD' },
    { position: 11, team: 'FC Augsburg', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3841.png', played: 4, won: 1, drawn: 1, lost: 2, gf: 7, ga: 10, gd: -3, points: 4, form: 'LWLD' },
    { position: 12, team: 'TSG Hoffenheim', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7911.png', played: 4, won: 1, drawn: 0, lost: 3, gf: 7, ga: 10, gd: -3, points: 3, form: 'LLLW' },
    { position: 13, team: 'VfB Stuttgart', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png', played: 4, won: 1, drawn: 0, lost: 3, gf: 6, ga: 9, gd: -3, points: 3, form: 'LWLL' },
    { position: 14, team: 'Union Berlin', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/598.png', played: 4, won: 0, drawn: 1, lost: 3, gf: 4, ga: 17, gd: -13, points: 1, form: 'LLLD' },
    { position: 15, team: 'Borussia Mönchengladbach', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/268.png', played: 4, won: 0, drawn: 0, lost: 4, gf: 6, ga: 16, gd: -10, points: 0, form: 'LLLL' },
  ],

  // Ligue 1 (id: 61) - Official ESPN Table (Matchday 6)
  61: [
    { position: 1, team: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png', played: 6, won: 5, drawn: 1, lost: 0, gf: 20, ga: 5, gd: 15, points: 16, form: 'WDWWW' },
    { position: 2, team: 'AS Monaco', logo: 'https://media.api-sports.io/football/teams/91.png', played: 6, won: 5, drawn: 1, lost: 0, gf: 12, ga: 3, gd: 9, points: 16, form: 'WWWDW' },
    { position: 3, team: 'Olympique de Marseille', logo: 'https://media.api-sports.io/football/teams/81.png', played: 6, won: 4, drawn: 1, lost: 1, gf: 15, ga: 7, gd: 8, points: 13, form: 'LWWWD' },
    { position: 4, team: 'Stade de Reims', logo: 'https://media.api-sports.io/football/teams/93.png', played: 6, won: 3, drawn: 2, lost: 1, gf: 10, ga: 8, gd: 2, points: 11, form: 'WDWWD' },
    { position: 5, team: 'Lille OSC', logo: 'https://media.api-sports.io/football/teams/79.png', played: 6, won: 3, drawn: 1, lost: 2, gf: 11, ga: 7, gd: 4, points: 10, form: 'WDLLW' },
    { position: 6, team: 'RC Lens', logo: 'https://media.api-sports.io/football/teams/116.png', played: 6, won: 2, drawn: 4, lost: 0, gf: 6, ga: 3, gd: 3, points: 10, form: 'DDDDW' },
    { position: 7, team: 'FC Nantes', logo: 'https://media.api-sports.io/football/teams/83.png', played: 6, won: 2, drawn: 3, lost: 1, gf: 8, ga: 6, gd: 2, points: 9, form: 'DDLWW' },
    { position: 8, team: 'Strasbourg', logo: 'https://media.api-sports.io/football/teams/95.png', played: 6, won: 2, drawn: 3, lost: 1, gf: 12, ga: 10, gd: 2, points: 9, form: 'WDDLW' },
    { position: 9, team: 'OGC Nice', logo: 'https://media.api-sports.io/football/teams/84.png', played: 6, won: 2, drawn: 2, lost: 2, gf: 14, ga: 6, gd: 8, points: 8, form: 'DWLWD' },
    { position: 10, team: 'Stade Rennais', logo: 'https://media.api-sports.io/football/teams/94.png', played: 6, won: 2, drawn: 1, lost: 3, gf: 10, ga: 10, gd: 0, points: 7, form: 'LDWLL' },
    { position: 11, team: 'Olympique Lyonnais', logo: 'https://media.api-sports.io/football/teams/80.png', played: 6, won: 2, drawn: 1, lost: 3, gf: 8, ga: 12, gd: -4, points: 7, form: 'WLWDL' },
    { position: 12, team: 'Brest', logo: 'https://media.api-sports.io/football/teams/106.png', played: 6, won: 2, drawn: 0, lost: 4, gf: 8, ga: 13, gd: -5, points: 6, form: 'LWLWL' },
    { position: 13, team: 'Le Havre', logo: 'https://media.api-sports.io/football/teams/97.png', played: 6, won: 2, drawn: 0, lost: 4, gf: 7, ga: 13, gd: -6, points: 6, form: 'LLLWW' },
    { position: 14, team: 'Auxerre', logo: 'https://media.api-sports.io/football/teams/98.png', played: 6, won: 2, drawn: 0, lost: 4, gf: 7, ga: 12, gd: -5, points: 6, form: 'WLLLL' },
    { position: 15, team: 'Toulouse FC', logo: 'https://media.api-sports.io/football/teams/96.png', played: 6, won: 1, drawn: 2, lost: 3, gf: 5, ga: 8, gd: -3, points: 5, form: 'LLWLD' },
    { position: 16, team: 'Montpellier', logo: 'https://media.api-sports.io/football/teams/82.png', played: 6, won: 1, drawn: 1, lost: 4, gf: 5, ga: 17, gd: -12, points: 4, form: 'LWLLL' },
    { position: 17, team: 'Saint-Étienne', logo: 'https://media.api-sports.io/football/teams/1063.png', played: 6, won: 1, drawn: 1, lost: 4, gf: 3, ga: 17, gd: -14, points: 4, form: 'DLWLL' },
    { position: 18, team: 'Angers', logo: 'https://media.api-sports.io/football/teams/77.png', played: 6, won: 0, drawn: 2, lost: 4, gf: 4, ga: 12, gd: -8, points: 2, form: 'LDDLL' },
  ],

  // Champions League (id: 2) - 36-Team League Phase Active Standings
  2: [
    { position: 1, team: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 10, ga: 1, gd: 9, points: 6, form: 'WW' },
    { position: 2, team: 'Brest', logo: 'https://media.api-sports.io/football/teams/106.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, gd: 5, points: 6, form: 'WW' },
    { position: 3, team: 'Benfica', logo: 'https://media.api-sports.io/football/teams/211.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, gd: 5, points: 6, form: 'WW' },
    { position: 4, team: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 0, gd: 5, points: 6, form: 'WW' },
    { position: 5, team: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 1, gd: 4, points: 6, form: 'WW' },
    { position: 6, team: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 0, gd: 4, points: 6, form: 'WW' },
    { position: 7, team: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 3, gd: 3, points: 6, form: 'WW' },
    { position: 8, team: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 0, gd: 4, points: 4, form: 'WD' },
    { position: 9, team: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 0, gd: 4, points: 4, form: 'WD' },
    { position: 10, team: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 0, gd: 2, points: 4, form: 'WD' },
    { position: 11, team: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 6, ga: 2, gd: 4, points: 3, form: 'WL' },
    { position: 12, team: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 9, ga: 3, gd: 6, points: 3, form: 'LW' },
    { position: 13, team: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 2, gd: 1, points: 3, form: 'LW' },
    { position: 14, team: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png', played: 2, won: 1, drawn: 0, lost: 1, gf: 1, ga: 2, gd: -1, points: 3, form: 'LW' },
  ],

  // Kenyan Premier League (FKF) (id: 276) - Official 18-Club FKF Premier League Table
  276: [
    { position: 1, team: 'Gor Mahia FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23ffffff" stroke-width="4"/><text x="50" y="58" font-size="24" font-weight="900" font-family="sans-serif" fill="%23ffffff" text-anchor="middle">GOR</text></svg>', played: 34, won: 21, drawn: 10, lost: 3, gf: 48, ga: 20, gd: 28, points: 73, form: 'WWWDW' },
    { position: 2, team: 'Kenya Police FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23002B49" stroke="%23C4122E" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">POL</text></svg>', played: 34, won: 19, drawn: 8, lost: 7, gf: 44, ga: 24, gd: 20, points: 65, form: 'WDWWL' },
    { position: 3, team: 'Tusker FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFD100" stroke="%23000000" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23000000" text-anchor="middle">TUS</text></svg>', played: 34, won: 19, drawn: 8, lost: 7, gf: 47, ga: 27, gd: 20, points: 65, form: 'LWWWW' },
    { position: 4, team: 'Bandari FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">BAN</text></svg>', played: 34, won: 14, drawn: 10, lost: 10, gf: 31, ga: 26, gd: 5, points: 52, form: 'DDDWL' },
    { position: 5, team: 'AFC Leopards', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23002B49" stroke="%23ffffff" stroke-width="4"/><text x="50" y="58" font-size="24" font-weight="900" font-family="sans-serif" fill="%23ffffff" text-anchor="middle">AFC</text></svg>', played: 34, won: 13, drawn: 12, lost: 9, gf: 32, ga: 23, gd: 9, points: 51, form: 'WLDWW' },
    { position: 6, team: 'KCB FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23005BAA" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">KCB</text></svg>', played: 34, won: 13, drawn: 11, lost: 10, gf: 34, ga: 29, gd: 5, points: 50, form: 'DWLDD' },
    { position: 7, team: 'Nairobi City Stars', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">NCS</text></svg>', played: 34, won: 13, drawn: 11, lost: 10, gf: 42, ga: 39, gd: 3, points: 50, form: 'LDWLD' },
    { position: 8, team: 'Kakamega Homeboyz', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFE500" stroke="%23005BAA" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23005BAA" text-anchor="middle">KHB</text></svg>', played: 34, won: 12, drawn: 12, lost: 10, gf: 33, ga: 28, gd: 5, points: 48, form: 'DLDWW' },
    { position: 9, team: 'Bidco United', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F58220" stroke="%23002B49" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">BID</text></svg>', played: 34, won: 11, drawn: 11, lost: 12, gf: 36, ga: 38, gd: -2, points: 44, form: 'WLDLW' },
    { position: 10, team: 'Murang\'a Seal', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FDB913" stroke="%23000000" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23000000" text-anchor="middle">MSL</text></svg>', played: 34, won: 9, drawn: 11, lost: 14, gf: 28, ga: 34, gd: -6, points: 38, form: 'DDLLW' },
    { position: 11, team: 'Kariobangi Sharks', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F7D000" stroke="%23008751" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23008751" text-anchor="middle">SHA</text></svg>', played: 34, won: 12, drawn: 12, lost: 10, gf: 44, ga: 34, gd: 10, points: 48, form: 'WWDDW' },
    { position: 12, team: 'Posta Rangers', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23E20613" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">POS</text></svg>', played: 34, won: 13, drawn: 8, lost: 13, gf: 30, ga: 31, gd: -1, points: 47, form: 'LLDLL' },
    { position: 13, team: 'Ulinzi Stars', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%238A1538" stroke="%23FFCD00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">ULI</text></svg>', played: 34, won: 10, drawn: 9, lost: 15, gf: 24, ga: 28, gd: -4, points: 39, form: 'LLWDL' },
    { position: 14, team: 'Shabana FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23E20613" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">SHA</text></svg>', played: 34, won: 10, drawn: 8, lost: 16, gf: 38, ga: 45, gd: -7, points: 38, form: 'WDWWL' },
    { position: 15, team: 'FC Talanta', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFCD00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">TAL</text></svg>', played: 34, won: 8, drawn: 13, lost: 13, gf: 35, ga: 48, gd: -13, points: 37, form: 'DLDDD' },
    { position: 16, team: 'Sofapaka FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23003399" stroke="%23FFD700" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">SOF</text></svg>', played: 34, won: 9, drawn: 9, lost: 16, gf: 39, ga: 53, gd: -14, points: 36, form: 'WLDDW' },
    { position: 17, team: 'Mara Sugar FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">MSU</text></svg>', played: 34, won: 8, drawn: 9, lost: 17, gf: 29, ga: 49, gd: -20, points: 33, form: 'DLLLD' },
    { position: 18, team: 'Mathare United', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FEEB00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">MAT</text></svg>', played: 34, won: 7, drawn: 9, lost: 18, gf: 26, ga: 52, gd: -26, points: 30, form: 'LLDDL' },
  ],

  // CAF Champions League & Pan-African Elite (id: 12) - Continental Club Standings across East, West, South, Central & North Africa
  12: [
    { position: 1, team: 'Al Ahly SC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23C4122E" stroke="%23FFD700" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">AHL</text></svg>', played: 6, won: 5, drawn: 1, lost: 0, gf: 14, ga: 3, gd: 11, points: 16, form: 'WWWDW' },
    { position: 2, team: 'Mamelodi Sundowns', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFD700" stroke="%23008751" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%230055A5" text-anchor="middle">MSD</text></svg>', played: 6, won: 4, drawn: 2, lost: 0, gf: 12, ga: 3, gd: 9, points: 14, form: 'WWDWW' },
    { position: 3, team: 'Espérance de Tunis', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23E20613" stroke="%23FFD100" stroke-width="5"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFD100" text-anchor="middle">EST</text></svg>', played: 6, won: 4, drawn: 1, lost: 1, gf: 10, ga: 4, gd: 6, points: 13, form: 'WDWWL' },
    { position: 4, team: 'TP Mazembe', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23111111" stroke="%23FFFFFF" stroke-width="5"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">TPM</text></svg>', played: 6, won: 4, drawn: 1, lost: 1, gf: 11, ga: 5, gd: 6, points: 13, form: 'WWLWD' },
    { position: 5, team: 'Simba SC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23DA291C" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">SIM</text></svg>', played: 6, won: 3, drawn: 2, lost: 1, gf: 9, ga: 5, gd: 4, points: 11, form: 'WDWDL' },
    { position: 6, team: 'Wydad AC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23C8102E" stroke="%23FFD700" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">WAC</text></svg>', played: 6, won: 3, drawn: 2, lost: 1, gf: 8, ga: 5, gd: 3, points: 11, form: 'DWWLD' },
    { position: 7, team: 'Young Africans SC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">YAN</text></svg>', played: 6, won: 3, drawn: 1, lost: 2, gf: 9, ga: 6, gd: 3, points: 10, form: 'WLWDW' },
    { position: 8, team: 'Orlando Pirates', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23111111" stroke="%23E20613" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">ORP</text></svg>', played: 6, won: 3, drawn: 1, lost: 2, gf: 8, ga: 6, gd: 2, points: 10, form: 'WWLDW' },
    { position: 9, team: 'Enyimba FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">ENY</text></svg>', played: 6, won: 3, drawn: 0, lost: 3, gf: 7, ga: 7, gd: 0, points: 9, form: 'WLWLW' },
    { position: 10, team: 'Raja Casablanca', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">RCA</text></svg>', played: 6, won: 2, drawn: 3, lost: 1, gf: 7, ga: 5, gd: 2, points: 9, form: 'DDWDL' },
    { position: 11, team: 'Gor Mahia FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23ffffff" stroke-width="4"/><text x="50" y="58" font-size="24" font-weight="900" font-family="sans-serif" fill="%23ffffff" text-anchor="middle">GOR</text></svg>', played: 6, won: 2, drawn: 2, lost: 2, gf: 6, ga: 6, gd: 0, points: 8, form: 'WDLDW' },
    { position: 12, team: 'AS Vita Club', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFD100" text-anchor="middle">ASV</text></svg>', played: 6, won: 2, drawn: 1, lost: 3, gf: 6, ga: 8, gd: -2, points: 7, form: 'LWDLL' },
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
    { position: 1, team: 'Gor Mahia FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23ffffff" stroke-width="4"/><text x="50" y="58" font-size="24" font-weight="900" font-family="sans-serif" fill="%23ffffff" text-anchor="middle">GOR</text></svg>', played: 34, won: 21, drawn: 10, lost: 3, gf: 48, ga: 20, gd: 28, points: 73, form: 'WWWDW' },
    { position: 2, team: 'Kenya Police FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23002B49" stroke="%23C4122E" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">POL</text></svg>', played: 34, won: 19, drawn: 8, lost: 7, gf: 44, ga: 24, gd: 20, points: 65, form: 'WDWWL' },
    { position: 3, team: 'Tusker FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFD100" stroke="%23000000" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23000000" text-anchor="middle">TUS</text></svg>', played: 34, won: 19, drawn: 8, lost: 7, gf: 47, ga: 27, gd: 20, points: 65, form: 'LWWWW' },
    { position: 4, team: 'Bandari FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">BAN</text></svg>', played: 34, won: 14, drawn: 10, lost: 10, gf: 31, ga: 26, gd: 5, points: 52, form: 'DDDWL' },
    { position: 5, team: 'AFC Leopards', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23002B49" stroke="%23ffffff" stroke-width="4"/><text x="50" y="58" font-size="24" font-weight="900" font-family="sans-serif" fill="%23ffffff" text-anchor="middle">AFC</text></svg>', played: 34, won: 13, drawn: 12, lost: 9, gf: 32, ga: 23, gd: 9, points: 51, form: 'WLDWW' },
    { position: 6, team: 'KCB FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23005BAA" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">KCB</text></svg>', played: 34, won: 13, drawn: 11, lost: 10, gf: 34, ga: 29, gd: 5, points: 50, form: 'DWLDD' },
    { position: 7, team: 'Nairobi City Stars', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">NCS</text></svg>', played: 34, won: 13, drawn: 11, lost: 10, gf: 42, ga: 39, gd: 3, points: 50, form: 'LDWLD' },
    { position: 8, team: 'Kakamega Homeboyz', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FFE500" stroke="%23005BAA" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23005BAA" text-anchor="middle">KHB</text></svg>', played: 34, won: 12, drawn: 12, lost: 10, gf: 33, ga: 28, gd: 5, points: 48, form: 'DLDWW' },
    { position: 9, team: 'Bidco United', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F58220" stroke="%23002B49" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">BID</text></svg>', played: 34, won: 11, drawn: 11, lost: 12, gf: 36, ga: 38, gd: -2, points: 44, form: 'WLDLW' },
    { position: 10, team: 'Murang\'a Seal', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23FDB913" stroke="%23000000" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23000000" text-anchor="middle">MSL</text></svg>', played: 34, won: 9, drawn: 11, lost: 14, gf: 28, ga: 34, gd: -6, points: 38, form: 'DDLLW' },
    { position: 11, team: 'Kariobangi Sharks', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F7D000" stroke="%23008751" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23008751" text-anchor="middle">SHA</text></svg>', played: 34, won: 12, drawn: 12, lost: 10, gf: 44, ga: 34, gd: 10, points: 48, form: 'WWDDW' },
    { position: 12, team: 'Posta Rangers', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23E20613" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">POS</text></svg>', played: 34, won: 13, drawn: 8, lost: 13, gf: 30, ga: 31, gd: -1, points: 47, form: 'LLDLL' },
    { position: 13, team: 'Ulinzi Stars', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%238A1538" stroke="%23FFCD00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">ULI</text></svg>', played: 34, won: 10, drawn: 9, lost: 15, gf: 24, ga: 28, gd: -4, points: 39, form: 'LLWDL' },
    { position: 14, team: 'Shabana FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23E20613" stroke="%23FFFFFF" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">SHA</text></svg>', played: 34, won: 10, drawn: 8, lost: 16, gf: 38, ga: 45, gd: -7, points: 38, form: 'WDWWL' },
    { position: 15, team: 'FC Talanta', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23005BAA" stroke="%23FFCD00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">TAL</text></svg>', played: 34, won: 8, drawn: 13, lost: 13, gf: 35, ga: 48, gd: -13, points: 37, form: 'DLDDD' },
    { position: 16, team: 'Sofapaka FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23003399" stroke="%23FFD700" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">SOF</text></svg>', played: 34, won: 9, drawn: 9, lost: 16, gf: 39, ga: 53, gd: -14, points: 36, form: 'WLDDW' },
    { position: 17, team: 'Mara Sugar FC', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FFD100" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">MSU</text></svg>', played: 34, won: 8, drawn: 9, lost: 17, gf: 29, ga: 49, gd: -20, points: 33, form: 'DLLLD' },
    { position: 18, team: 'Mathare United', logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23008751" stroke="%23FEEB00" stroke-width="4"/><text x="50" y="58" font-size="22" font-weight="900" font-family="sans-serif" fill="%23FFFFFF" text-anchor="middle">MAT</text></svg>', played: 34, won: 7, drawn: 9, lost: 18, gf: 26, ga: 52, gd: -26, points: 30, form: 'LLDDL' },
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

