export interface LeagueHubItem {
  to: string;
  name: string;
  flag: string;
  shortName: string;
}

export const LEAGUE_HUBS: LeagueHubItem[] = [
  { to: '/premier-league-predictions', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', shortName: 'EPL' },
  { to: '/champions-league-predictions', name: 'Champions League', flag: '🏆', shortName: 'UCL' },
  { to: '/europa-league-predictions', name: 'Europa League', flag: '🏆', shortName: 'UEL' },
  { to: '/conference-league-predictions', name: 'Conference League', flag: '🏆', shortName: 'UECL' },
  { to: '/la-liga-predictions', name: 'La Liga', flag: '🇪🇸', shortName: 'La Liga' },
  { to: '/bundesliga-predictions', name: 'Bundesliga', flag: '🇩🇪', shortName: 'Bundesliga' },
  { to: '/serie-a-predictions', name: 'Serie A', flag: '🇮🇹', shortName: 'Serie A' },
  { to: '/ligue-1-predictions', name: 'French Ligue 1', flag: '🇫🇷', shortName: 'Ligue 1' },
  { to: '/championship-predictions', name: 'EFL Championship', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', shortName: 'Championship' },
  { to: '/eredivisie-predictions', name: 'Dutch Eredivisie', flag: '🇳🇱', shortName: 'Eredivisie' },
  { to: '/primeira-liga-predictions', name: 'Primeira Liga', flag: '🇵🇹', shortName: 'Portugal' },
  { to: '/copa-libertadores-predictions', name: 'Copa Libertadores', flag: '🏆', shortName: 'Libertadores' },
  { to: '/brazilian-serie-a-predictions', name: 'Brasileirão Série A', flag: '🇧🇷', shortName: 'Brazil Serie A' },
  { to: '/argentina-primera-predictions', name: 'Argentina Primera', flag: '🇦🇷', shortName: 'Argentina' },
  { to: '/saudi-pro-league-predictions', name: 'Saudi Pro League', flag: '🇸🇦', shortName: 'Saudi SPL' },
  { to: '/turkish-super-lig-predictions', name: 'Turkish Süper Lig', flag: '🇹🇷', shortName: 'Süper Lig' },
  { to: '/belgian-pro-league-predictions', name: 'Belgian Pro League', flag: '🇧🇪', shortName: 'Belgium' },
  { to: '/scottish-premiership-predictions', name: 'Scottish Premiership', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', shortName: 'Scotland SPFL' },
  { to: '/greek-super-league-predictions', name: 'Greek Super League', flag: '🇬🇷', shortName: 'Greece' },
  { to: '/liga-mx-predictions', name: 'Mexican Liga MX', flag: '🇲🇽', shortName: 'Liga MX' },
  { to: '/mls-predictions', name: 'Major League Soccer', flag: '🇺🇸', shortName: 'MLS Hub' },
  { to: '/south-africa-psl-predictions', name: 'South Africa PSL', flag: '🇿🇦', shortName: 'SA PSL' },
  { to: '/fa-cup-predictions', name: 'FA Cup & EFL Cup', flag: '🏆', shortName: 'FA Cup' },
  { to: '/kpl-predictions', name: 'Kenya Premier League', flag: '🇰🇪', shortName: 'KPL' },
  { to: '/jackpot-predictions', name: 'Mega Jackpots (17)', flag: '🎰', shortName: 'Mega Jackpot' },
  { to: '/midweek-jackpot-predictions', name: 'Midweek Jackpot (13)', flag: '🎰', shortName: 'Midweek JP' },
  { to: '/us-soccer-predictions', name: 'US Soccer & Concacaf', flag: '🇺🇸', shortName: 'US Soccer' },
  { to: '/world-cup-predictions', name: 'FIFA World Cup', flag: '🌍', shortName: 'World Cup' },
  { to: '/afcon-predictions', name: 'AFCON', flag: '🌍', shortName: 'AFCON' },
];


