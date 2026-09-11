import { CURRENT_SEASON_STANDINGS, LEAGUES, StandingRow } from '@/data/standingsData';
import { CANONICAL_TEAM_LOGOS } from '@/services/teamLogos';
import { Prediction } from '@/types/prediction';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';

export interface PinnedTeamStats {
  name: string;
  league: string;
  logo: string;
  shortName: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  winRate: number;
  cleanSheetRate: number;
  goalsPerGame: string;
  concededPerGame: string;
  form: string[];
  streak: string;
  nextMatch?: {
    opponent: string;
    opponentLogo: string;
    isHome: boolean;
    date: string;
    prediction: string;
    confidence: number;
    odds?: { home: number; draw: number; away: number };
    competition: string;
  };
}

export interface PinnedLeagueOverview {
  name: string;
  flag: string;
  season: string;
  matchdayLabel: string;
  totalMatchdays: number;
  currentMatchday: number;
  topTeams: Array<{ position: number; team: string; logo?: string; points: number; gd: number; form?: string }>;
  upcomingMatchesCount: number;
  nextMatch?: {
    home: string;
    homeLogo: string;
    away: string;
    awayLogo: string;
    date: string;
    prediction: string;
    confidence: number;
  };
}

export interface ClubCatalogItem {
  name: string;
  league: string;
  shortName: string;
  country: string;
  logo: string;
}

export const POPULAR_LEAGUES_CATALOG = [
  { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', id: 39 },
  { name: 'Champions League', flag: '🏆', country: 'Europe', id: 2 },
  { name: 'La Liga', flag: '🇪🇸', country: 'Spain', id: 140 },
  { name: 'Serie A', flag: '🇮🇹', country: 'Italy', id: 135 },
  { name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', id: 78 },
  { name: 'Ligue 1', flag: '🇫🇷', country: 'France', id: 61 },
  { name: 'KPL', flag: '🇰🇪', country: 'Kenya', id: 276, aliases: ['Kenyan Premier League', 'FKF Premier League'] },
  { name: 'AFCON Qualifier', flag: '🌍', country: 'Africa', id: 1001, aliases: ['AFCON'] },
  { name: 'World Cup', flag: '🌐', country: 'International', id: 1, aliases: ['World Cup Qualifiers'] },
  { name: 'MLS', flag: '🇺🇸', country: 'USA', id: 253 },
];

export const POPULAR_CLUBS_CATALOG: ClubCatalogItem[] = [
  // Premier League
  { name: 'Arsenal', league: 'Premier League', shortName: 'ARS', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  { name: 'Manchester City', league: 'Premier League', shortName: 'MCI', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' },
  { name: 'Liverpool', league: 'Premier League', shortName: 'LIV', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
  { name: 'Chelsea', league: 'Premier League', shortName: 'CHE', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
  { name: 'Manchester United', league: 'Premier League', shortName: 'MUN', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
  { name: 'Tottenham Hotspur', league: 'Premier League', shortName: 'TOT', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' },
  { name: 'Aston Villa', league: 'Premier League', shortName: 'AVL', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png' },
  { name: 'Newcastle United', league: 'Premier League', shortName: 'NEW', country: 'England', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png' },

  // La Liga
  { name: 'Real Madrid', league: 'La Liga', shortName: 'RMA', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png' },
  { name: 'Barcelona', league: 'La Liga', shortName: 'BAR', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png' },
  { name: 'Atlético Madrid', league: 'La Liga', shortName: 'ATM', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png' },
  { name: 'Athletic Club', league: 'La Liga', shortName: 'ATH', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png' },
  { name: 'Real Sociedad', league: 'La Liga', shortName: 'RSO', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png' },
  { name: 'Sevilla', league: 'La Liga', shortName: 'SEV', country: 'Spain', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png' },

  // Serie A
  { name: 'Internazionale', league: 'Serie A', shortName: 'INT', country: 'Italy', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png' },
  { name: 'Juventus', league: 'Serie A', shortName: 'JUV', country: 'Italy', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png' },
  { name: 'AC Milan', league: 'Serie A', shortName: 'MIL', country: 'Italy', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png' },
  { name: 'Napoli', league: 'Serie A', shortName: 'NAP', country: 'Italy', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png' },
  { name: 'Atalanta', league: 'Serie A', shortName: 'ATA', country: 'Italy', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png' },

  // Bundesliga
  { name: 'Bayern Munich', league: 'Bundesliga', shortName: 'BAY', country: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png' },
  { name: 'Bayer Leverkusen', league: 'Bundesliga', shortName: 'B04', country: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png' },
  { name: 'Borussia Dortmund', league: 'Bundesliga', shortName: 'BVB', country: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png' },
  { name: 'RB Leipzig', league: 'Bundesliga', shortName: 'RBL', country: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png' },
  { name: 'VfB Stuttgart', league: 'Bundesliga', shortName: 'VFB', country: 'Germany', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png' },

  // Ligue 1
  { name: 'Paris Saint-Germain', league: 'Ligue 1', shortName: 'PSG', country: 'France', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png' },
  { name: 'AS Monaco', league: 'Ligue 1', shortName: 'MON', country: 'France', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png' },
  { name: 'Marseille', league: 'Ligue 1', shortName: 'OM', country: 'France', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png' },
  { name: 'Lille', league: 'Ligue 1', shortName: 'LOSC', country: 'France', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png' },

  // Kenyan Premier League (KPL)
  { name: 'Gor Mahia', league: 'KPL', shortName: 'GOR', country: 'Kenya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/14467.png' },
  { name: 'AFC Leopards', league: 'KPL', shortName: 'AFC', country: 'Kenya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/14465.png' },
  { name: 'Tusker FC', league: 'KPL', shortName: 'TUS', country: 'Kenya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/14470.png' },
  { name: 'Bandari FC', league: 'KPL', shortName: 'BAN', country: 'Kenya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/14466.png' },

  // MLS & International
  { name: 'Inter Miami CF', league: 'MLS', shortName: 'MIA', country: 'USA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/19004.png' },
  { name: 'Brazil', league: 'World Cup', shortName: 'BRA', country: 'Brazil', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/205.png' },
  { name: 'Argentina', league: 'World Cup', shortName: 'ARG', country: 'Argentina', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/202.png' },
  { name: 'Senegal', league: 'AFCON Qualifier', shortName: 'SEN', country: 'Senegal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/654.png' },
  { name: 'Morocco', league: 'AFCON Qualifier', shortName: 'MAR', country: 'Morocco', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/651.png' },
];

export function getTeamLogo(teamName: string): string {
  const norm = teamName.toLowerCase().trim();
  if (CANONICAL_TEAM_LOGOS[norm]?.logo) {
    return CANONICAL_TEAM_LOGOS[norm].logo;
  }
  const club = POPULAR_CLUBS_CATALOG.find(c => c.name.toLowerCase() === norm);
  if (club?.logo) return club.logo;

  // Search in standings
  for (const list of Object.values(CURRENT_SEASON_STANDINGS)) {
    const found = list.find(s => s.team.toLowerCase() === norm);
    if (found?.logo) return found.logo;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=0284c7&color=fff&size=128&bold=true`;
}

export function calculateTeamStats(teamName: string, predictionsList: Prediction[] = DEFAULT_PREDICTIONS): PinnedTeamStats {
  const norm = teamName.toLowerCase().trim();
  let row: StandingRow | undefined;
  let leagueName = 'Football';

  // Find standing row
  for (const [leagueId, rows] of Object.entries(CURRENT_SEASON_STANDINGS)) {
    const found = rows.find(r => r.team.toLowerCase().includes(norm) || norm.includes(r.team.toLowerCase()));
    if (found) {
      row = found;
      const lg = LEAGUES.find(l => l.id === Number(leagueId));
      if (lg) leagueName = lg.name;
      break;
    }
  }

  // Fallback row if team is not in European 5 top tables (e.g. Gor Mahia or Argentina)
  if (!row) {
    const catalogItem = POPULAR_CLUBS_CATALOG.find(c => c.name.toLowerCase().includes(norm) || norm.includes(c.name.toLowerCase()));
    leagueName = catalogItem?.league || 'Football';
    row = {
      position: 1,
      team: catalogItem?.name || teamName,
      logo: catalogItem?.logo || getTeamLogo(teamName),
      played: 5,
      won: 4,
      drawn: 1,
      lost: 0,
      gf: 11,
      ga: 3,
      gd: 8,
      points: 13,
      form: 'WWWDW',
    };
  }

  const played = row.played > 0 ? row.played : 1;
  const winRate = Math.round((row.won / played) * 100);
  const cleanSheetRate = Math.round(Math.max(15, Math.min(85, (1 - (row.ga / (played * 2))) * 100)));
  const goalsPerGame = (row.gf / played).toFixed(1);
  const concededPerGame = (row.ga / played).toFixed(1);

  // Parse form chars
  const formChars = (row.form || 'WWWDW').split('').slice(-5);
  const streak = formChars[formChars.length - 1] === 'W'
    ? `${formChars.filter(c => c === 'W').length}W Streak`
    : formChars.includes('L')
    ? 'Mixed Form'
    : 'Unbeaten Run';

  // Find next upcoming match involving this team (sorted chronologically, strictly upcoming)
  const nowMs = Date.now() - 105 * 60 * 1000;
  const upcomingMatch = predictionsList
    .filter(p => {
      const matchTime = new Date(p.match_date).getTime();
      return !isNaN(matchTime) && matchTime >= nowMs;
    })
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .find(p => {
      const h = p.home_team.toLowerCase();
      const a = p.away_team.toLowerCase();
      return h.includes(norm) || a.includes(norm);
    });

  let nextMatch: PinnedTeamStats['nextMatch'] | undefined;
  if (upcomingMatch) {
    const isHome = upcomingMatch.home_team.toLowerCase().includes(norm);
    const opponent = isHome ? upcomingMatch.away_team : upcomingMatch.home_team;
    nextMatch = {
      opponent,
      opponentLogo: getTeamLogo(opponent),
      isHome,
      date: upcomingMatch.match_date,
      prediction: upcomingMatch.predicted_outcome || upcomingMatch.prediction || 'Match Winner',
      confidence: upcomingMatch.confidence_score ?? upcomingMatch.confidence ?? 75,
      competition: upcomingMatch.league,
      odds: upcomingMatch.home_odds ? {
        home: upcomingMatch.home_odds,
        draw: upcomingMatch.draw_odds || 3.4,
        away: upcomingMatch.away_odds || 3.8,
      } : undefined,
    };
  }

  return {
    name: row.team,
    league: leagueName,
    logo: row.logo || getTeamLogo(row.team),
    shortName: CANONICAL_TEAM_LOGOS[norm]?.shortName || row.team.slice(0, 3).toUpperCase(),
    position: row.position,
    points: row.points,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    gf: row.gf,
    ga: row.ga,
    gd: row.gd,
    winRate,
    cleanSheetRate,
    goalsPerGame,
    concededPerGame,
    form: formChars,
    streak,
    nextMatch,
  };
}

export function calculateLeagueOverview(leagueName: string, predictionsList: Prediction[] = DEFAULT_PREDICTIONS): PinnedLeagueOverview {
  const norm = leagueName.toLowerCase().trim();
  const lgConfig = LEAGUES.find(l =>
    l.name.toLowerCase().includes(norm) || norm.includes(l.name.toLowerCase())
  ) || LEAGUES[0];

  const standings = CURRENT_SEASON_STANDINGS[lgConfig.id] || CURRENT_SEASON_STANDINGS[39] || [];
  const topTeams = standings.slice(0, 4).map(s => ({
    position: s.position,
    team: s.team,
    logo: s.logo || getTeamLogo(s.team),
    points: s.points,
    gd: s.gd,
    form: s.form,
  }));

  const nowMs = Date.now() - 105 * 60 * 1000;
  const leagueMatches = predictionsList
    .filter(p => {
      const matchTime = new Date(p.match_date).getTime();
      const isUpcoming = !isNaN(matchTime) && matchTime >= nowMs;
      const isMatch = p.league.toLowerCase().includes(norm) || norm.includes(p.league.toLowerCase());
      return isUpcoming && isMatch;
    })
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  const upcomingMatchesCount = leagueMatches.length;
  const nextMatchItem = leagueMatches[0];

  return {
    name: lgConfig.name,
    flag: lgConfig.flag,
    season: lgConfig.season,
    matchdayLabel: lgConfig.matchdayLabel,
    totalMatchdays: lgConfig.totalMatchdays,
    currentMatchday: lgConfig.currentMatchday,
    topTeams,
    upcomingMatchesCount,
    nextMatch: nextMatchItem ? {
      home: nextMatchItem.home_team,
      homeLogo: getTeamLogo(nextMatchItem.home_team),
      away: nextMatchItem.away_team,
      awayLogo: getTeamLogo(nextMatchItem.away_team),
      date: nextMatchItem.match_date,
      prediction: nextMatchItem.predicted_outcome || nextMatchItem.prediction || 'Match Winner',
      confidence: nextMatchItem.confidence_score ?? nextMatchItem.confidence ?? 75,
    } : undefined,
  };
}
