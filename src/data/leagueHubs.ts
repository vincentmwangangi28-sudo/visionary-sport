export interface LeagueHubItem {
  to: string;
  name: string;
  flag: string;
  shortName: string;
}

export const LEAGUE_HUBS: LeagueHubItem[] = [
  { to: '/premier-league-predictions', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', shortName: 'EPL' },
  { to: '/champions-league-predictions', name: 'Champions League', flag: '🏆', shortName: 'UCL' },
  { to: '/la-liga-predictions', name: 'La Liga', flag: '🇪🇸', shortName: 'La Liga' },
  { to: '/bundesliga-predictions', name: 'Bundesliga', flag: '🇩🇪', shortName: 'Bundesliga' },
  { to: '/serie-a-predictions', name: 'Serie A', flag: '🇮🇹', shortName: 'Serie A' },
  { to: '/kpl-predictions', name: 'Kenya Premier League', flag: '🇰🇪', shortName: 'KPL' },
  { to: '/jackpot-predictions', name: 'Mega Jackpots', flag: '🎰', shortName: 'Jackpots' },
  { to: '/us-soccer-predictions', name: 'US Soccer & MLS', flag: '🇺🇸', shortName: 'MLS' },
  { to: '/world-cup-predictions', name: 'FIFA World Cup', flag: '🌍', shortName: 'World Cup' },
  { to: '/afcon-predictions', name: 'AFCON', flag: '🌍', shortName: 'AFCON' },
];
