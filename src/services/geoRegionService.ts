/**
 * Geographic Region Detection & League Prioritization Service
 * 
 * Accurately detects user's location via timezone, locale headers, and coordinates/IP heuristics.
 * Intelligently prioritizes domestic, regional, and global football competitions across
 * LiveScores, PredictionsDashboard, BetSlip, and Match Analytics.
 */

export type GeographicRegionId =
  | 'east_africa'
  | 'west_africa'
  | 'southern_africa'
  | 'north_africa_middle_east'
  | 'uk_ireland'
  | 'western_europe'
  | 'north_america'
  | 'latin_america'
  | 'asia_pacific'
  | 'global';

export interface RegionalLeagueMeta {
  id: string; // League name or identifier
  apiFootballId?: number;
  name: string;
  shortName?: string;
  flag: string;
  country: string;
  tier: 'domestic_tier1' | 'regional_hero' | 'global_elite' | 'tier2';
  badgeLabel?: string;
  isDomestic?: boolean;
}

export interface RegionDefinition {
  id: GeographicRegionId;
  name: string;
  shortLabel: string;
  flag: string;
  description: string;
  countries: string[];
  primaryCountry: string;
  timezones: string[];
  defaultCurrency: string;
  regionalBookmakers: string[];
  topLeagues: RegionalLeagueMeta[];
  popularLeaguesList: string[];
}

export const GEOGRAPHIC_REGIONS: Record<GeographicRegionId, RegionDefinition> = {
  east_africa: {
    id: 'east_africa',
    name: 'East Africa',
    shortLabel: 'East Africa',
    flag: '🇰🇪',
    description: 'Prioritizing Kenyan Premier League (FKF), AFCON, Premier League, and Champions League',
    countries: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Burundi', 'South Sudan'],
    primaryCountry: 'Kenya',
    timezones: [
      'Africa/Nairobi',
      'Africa/Dar_es_Salaam',
      'Africa/Kampala',
      'Africa/Kigali',
      'Africa/Addis_Ababa',
      'Africa/Bujumbura',
      'Africa/Juba',
    ],
    defaultCurrency: 'KES',
    regionalBookmakers: ['SportyBet', 'Betika', 'Mozzart', '1xBet', 'Betway'],
    topLeagues: [
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '276', apiFootballId: 276, name: 'FKF Premier League', shortName: 'KPL', flag: '🇰🇪', country: 'Kenya', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Tier 1' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '6', apiFootballId: 6, name: 'AFCON', flag: '🌍', country: 'Africa', tier: 'regional_hero', badgeLabel: 'Continental Hero' },
      { id: '20', apiFootballId: 20, name: 'AFCON Qualifier', flag: '🌍', country: 'Africa', tier: 'regional_hero', badgeLabel: 'Continental Hero' },
      { id: '12', apiFootballId: 12, name: 'CAF Champions League', flag: '🏆', country: 'Africa', tier: 'regional_hero' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '61', apiFootballId: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Premier League',
      'FKF Premier League',
      'KPL',
      'Champions League',
      'La Liga',
      'AFCON Qualifier',
      'AFCON',
      'CAF Champions League',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'FA Cup',
    ],
  },

  west_africa: {
    id: 'west_africa',
    name: 'West Africa',
    shortLabel: 'West Africa',
    flag: '🇳🇬',
    description: 'Prioritizing NPFL, Ghana Premier League, Premier League, La Liga, and AFCON',
    countries: ['Nigeria', 'Ghana', 'Ivory Coast', 'Senegal', 'Cameroon', 'Mali', 'Benin', 'Togo'],
    primaryCountry: 'Nigeria',
    timezones: [
      'Africa/Lagos',
      'Africa/Accra',
      'Africa/Abidjan',
      'Africa/Dakar',
      'Africa/Douala',
      'Africa/Bamako',
      'Africa/Porto-Novo',
    ],
    defaultCurrency: 'NGN',
    regionalBookmakers: ['Bet9ja', 'SportyBet', '1xBet', 'BetKing', 'BangBet', 'Betway'],
    topLeagues: [
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '383', apiFootballId: 383, name: 'Nigeria NPFL', shortName: 'NPFL', flag: '🇳🇬', country: 'Nigeria', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Tier 1' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '6', apiFootballId: 6, name: 'AFCON', flag: '🌍', country: 'Africa', tier: 'regional_hero', badgeLabel: 'Continental Hero' },
      { id: '20', apiFootballId: 20, name: 'AFCON Qualifier', flag: '🌍', country: 'Africa', tier: 'regional_hero' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '61', apiFootballId: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '12', apiFootballId: 12, name: 'CAF Champions League', flag: '🏆', country: 'Africa', tier: 'regional_hero' },
    ],
    popularLeaguesList: [
      'Premier League',
      'Nigeria NPFL',
      'NPFL',
      'Champions League',
      'La Liga',
      'AFCON',
      'AFCON Qualifier',
      'Serie A',
      'Ligue 1',
      'Bundesliga',
      'FA Cup',
    ],
  },

  southern_africa: {
    id: 'southern_africa',
    name: 'Southern Africa',
    shortLabel: 'Southern Africa',
    flag: '🇿🇦',
    description: 'Prioritizing South Africa PSL (Premiership), Premier League, and Champions League',
    countries: ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mozambique', 'Lesotho'],
    primaryCountry: 'South Africa',
    timezones: [
      'Africa/Johannesburg',
      'Africa/Harare',
      'Africa/Lusaka',
      'Africa/Gaborone',
      'Africa/Windhoek',
      'Africa/Maputo',
    ],
    defaultCurrency: 'ZAR',
    regionalBookmakers: ['Betway', 'Hollywoodbets', 'Supabets', '1xBet', 'Sportingbet'],
    topLeagues: [
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '288', apiFootballId: 288, name: 'South Africa PSL', shortName: 'PSL', flag: '🇿🇦', country: 'South Africa', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Tier 1' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '6', apiFootballId: 6, name: 'AFCON', flag: '🌍', country: 'Africa', tier: 'regional_hero' },
      { id: '12', apiFootballId: 12, name: 'CAF Champions League', flag: '🏆', country: 'Africa', tier: 'regional_hero' },
    ],
    popularLeaguesList: [
      'Premier League',
      'South Africa PSL',
      'PSL',
      'Champions League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'AFCON',
      'CAF Champions League',
    ],
  },

  north_africa_middle_east: {
    id: 'north_africa_middle_east',
    name: 'Middle East & North Africa (MENA)',
    shortLabel: 'MENA / Gulf',
    flag: '🇸🇦',
    description: 'Prioritizing Saudi Pro League, Egyptian Premier League, Botola Pro, UCL, and La Liga',
    countries: ['Saudi Arabia', 'UAE', 'Egypt', 'Morocco', 'Qatar', 'Algeria', 'Tunisia', 'Kuwait', 'Oman'],
    primaryCountry: 'Saudi Arabia',
    timezones: [
      'Asia/Riyadh',
      'Asia/Dubai',
      'Africa/Cairo',
      'Africa/Casablanca',
      'Asia/Qatar',
      'Africa/Algiers',
      'Africa/Tunis',
      'Asia/Kuwait',
    ],
    defaultCurrency: 'USD',
    regionalBookmakers: ['1xBet', 'Bet365', 'Melbet', 'Stake', 'Betwinner'],
    topLeagues: [
      { id: '307', apiFootballId: 307, name: 'Saudi Pro League', shortName: 'RSL', flag: '🇸🇦', country: 'Saudi Arabia', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Regional Hero' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '233', apiFootballId: 233, name: 'Egyptian Premier League', flag: '🇪🇬', country: 'Egypt', tier: 'domestic_tier1', badgeLabel: 'Domestic Top' },
      { id: '17', apiFootballId: 17, name: 'AFC Champions League', flag: '🏆', country: 'Asia', tier: 'regional_hero' },
      { id: '200', apiFootballId: 200, name: 'Botola Pro (Morocco)', flag: '🇲🇦', country: 'Morocco', tier: 'domestic_tier1' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '61', apiFootballId: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Saudi Pro League',
      'Champions League',
      'Premier League',
      'La Liga',
      'Egyptian Premier League',
      'AFC Champions League',
      'Serie A',
      'Ligue 1',
      'Bundesliga',
    ],
  },

  uk_ireland: {
    id: 'uk_ireland',
    name: 'United Kingdom & Ireland',
    shortLabel: 'UK & Ireland',
    flag: '🇬🇧',
    description: 'Prioritizing Premier League, Championship, FA Cup, and Scottish Premiership',
    countries: ['United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'],
    primaryCountry: 'United Kingdom',
    timezones: ['Europe/London', 'Europe/Belfast', 'Europe/Dublin'],
    defaultCurrency: 'GBP',
    regionalBookmakers: ['Bet365', 'SkyBet', 'PaddyPower', 'WilliamHill', 'Betfair'],
    topLeagues: [
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Hero' },
      { id: '40', apiFootballId: 40, name: 'Championship', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '45', apiFootballId: 45, name: 'FA Cup', flag: '🏆', country: 'England', tier: 'domestic_tier1', isDomestic: true },
      { id: '179', apiFootballId: 179, name: 'Scottish Premiership', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', country: 'Scotland', tier: 'domestic_tier1' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '3', apiFootballId: 3, name: 'Europa League', flag: '🏆', country: 'Europe', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Premier League',
      'Championship',
      'Champions League',
      'FA Cup',
      'Scottish Premiership',
      'La Liga',
      'Europa League',
      'Bundesliga',
      'Serie A',
    ],
  },

  western_europe: {
    id: 'western_europe',
    name: 'Continental Europe',
    shortLabel: 'Western Europe',
    flag: '🇪🇺',
    description: 'Prioritizing Champions League, La Liga, Bundesliga, Serie A, and Ligue 1',
    countries: ['Spain', 'Germany', 'Italy', 'France', 'Portugal', 'Netherlands', 'Belgium', 'Austria', 'Switzerland'],
    primaryCountry: 'Spain',
    timezones: [
      'Europe/Madrid',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Paris',
      'Europe/Amsterdam',
      'Europe/Lisbon',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Zurich',
    ],
    defaultCurrency: 'EUR',
    regionalBookmakers: ['Bet365', 'Bwin', 'Unibet', 'Betano', '1xBet', 'Tipico'],
    topLeagues: [
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Top Continental' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite', badgeLabel: 'Top 5 European' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite', badgeLabel: 'Top 5 European' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite', badgeLabel: 'Top 5 European' },
      { id: '61', apiFootballId: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France', tier: 'global_elite', badgeLabel: 'Top 5 European' },
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite' },
      { id: '88', apiFootballId: 88, name: 'Eredivisie', flag: '🇳🇱', country: 'Netherlands', tier: 'regional_hero' },
      { id: '94', apiFootballId: 94, name: 'Primeira Liga', flag: '🇵🇹', country: 'Portugal', tier: 'regional_hero' },
      { id: '3', apiFootballId: 3, name: 'Europa League', flag: '🏆', country: 'Europe', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Champions League',
      'La Liga',
      'Bundesliga',
      'Serie A',
      'Ligue 1',
      'Premier League',
      'Eredivisie',
      'Primeira Liga',
      'Europa League',
    ],
  },

  north_america: {
    id: 'north_america',
    name: 'North America',
    shortLabel: 'North America',
    flag: '🇺🇸',
    description: 'Prioritizing Major League Soccer (MLS), Liga MX, Premier League, and Champions League',
    countries: ['United States', 'Canada', 'Mexico'],
    primaryCountry: 'United States',
    timezones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
    ],
    defaultCurrency: 'USD',
    regionalBookmakers: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'Bet365'],
    topLeagues: [
      { id: '253', apiFootballId: 253, name: 'MLS', shortName: 'MLS', flag: '🇺🇸', country: 'USA', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Hero' },
      { id: '262', apiFootballId: 262, name: 'Liga MX', flag: '🇲🇽', country: 'Mexico', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Regional Hero' },
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '1', apiFootballId: 1, name: 'World Cup', flag: '🌍', country: 'World', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'MLS',
      'Liga MX',
      'Premier League',
      'Champions League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'World Cup',
    ],
  },

  latin_america: {
    id: 'latin_america',
    name: 'Latin America',
    shortLabel: 'Latin America',
    flag: '🇧🇷',
    description: 'Prioritizing Copa Libertadores, Brasileirão Série A, Argentine Primera, and La Liga',
    countries: ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Uruguay', 'Ecuador'],
    primaryCountry: 'Brazil',
    timezones: [
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'America/Bogota',
      'America/Santiago',
      'America/Lima',
      'America/Montevideo',
      'America/Guayaquil',
    ],
    defaultCurrency: 'USD',
    regionalBookmakers: ['Bet365', 'Betano', '1xBet', 'Sportingbet', 'Stake'],
    topLeagues: [
      { id: '13', apiFootballId: 13, name: 'Copa Libertadores', flag: '🏆', country: 'South America', tier: 'regional_hero', badgeLabel: 'Continental Hero' },
      { id: '71', apiFootballId: 71, name: 'Brazilian Serie A', shortName: 'Brasileirão', flag: '🇧🇷', country: 'Brazil', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Hero' },
      { id: '128', apiFootballId: 128, name: 'Argentine Primera', flag: '🇦🇷', country: 'Argentina', tier: 'domestic_tier1', isDomestic: true, badgeLabel: 'Domestic Top' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite' },
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite' },
      { id: '11', apiFootballId: 11, name: 'Copa Sudamericana', flag: '🏆', country: 'South America', tier: 'regional_hero' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Copa Libertadores',
      'Brazilian Serie A',
      'Argentine Primera',
      'La Liga',
      'Champions League',
      'Premier League',
      'Copa Sudamericana',
      'Serie A',
    ],
  },

  asia_pacific: {
    id: 'asia_pacific',
    name: 'Asia-Pacific',
    shortLabel: 'Asia-Pacific',
    flag: '🌏',
    description: 'Prioritizing AFC Champions League, J1 League, ISL, Premier League, and La Liga',
    countries: ['India', 'Australia', 'Japan', 'South Korea', 'Indonesia', 'Singapore', 'Malaysia', 'Vietnam'],
    primaryCountry: 'India',
    timezones: [
      'Asia/Kolkata',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Jakarta',
      'Asia/Singapore',
      'Asia/Kuala_Lumpur',
      'Asia/Ho_Chi_Minh',
      'Australia/Sydney',
      'Australia/Melbourne',
    ],
    defaultCurrency: 'USD',
    regionalBookmakers: ['1xBet', 'Bet365', 'Stake', 'Parimatch', 'Dafabet'],
    topLeagues: [
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Elite' },
      { id: '17', apiFootballId: 17, name: 'AFC Champions League', flag: '🏆', country: 'Asia', tier: 'regional_hero', badgeLabel: 'Continental Hero' },
      { id: '98', apiFootballId: 98, name: 'J1 League', flag: '🇯🇵', country: 'Japan', tier: 'domestic_tier1', isDomestic: true },
      { id: '323', apiFootballId: 323, name: 'Indian Super League', shortName: 'ISL', flag: '🇮🇳', country: 'India', tier: 'domestic_tier1', isDomestic: true },
      { id: '188', apiFootballId: 188, name: 'A-League', flag: '🇦🇺', country: 'Australia', tier: 'domestic_tier1', isDomestic: true },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Premier League',
      'Champions League',
      'AFC Champions League',
      'J1 League',
      'Indian Super League',
      'A-League',
      'La Liga',
      'Serie A',
      'Bundesliga',
    ],
  },

  global: {
    id: 'global',
    name: 'Global Standard',
    shortLabel: 'Worldwide',
    flag: '🌐',
    description: 'Balanced worldwide view covering UEFA Champions League, Premier League, La Liga, Serie A, and Bundesliga',
    countries: ['International'],
    primaryCountry: 'International',
    timezones: ['UTC'],
    defaultCurrency: 'USD',
    regionalBookmakers: ['Bet365', '1xBet', 'SportyBet', 'DraftKings', 'Stake'],
    topLeagues: [
      { id: '2', apiFootballId: 2, name: 'Champions League', flag: '🏆', country: 'Europe', tier: 'global_elite', badgeLabel: 'Top Tier' },
      { id: '39', apiFootballId: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', tier: 'global_elite', badgeLabel: 'Top Followed' },
      { id: '140', apiFootballId: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain', tier: 'global_elite' },
      { id: '135', apiFootballId: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy', tier: 'global_elite' },
      { id: '78', apiFootballId: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', tier: 'global_elite' },
      { id: '61', apiFootballId: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France', tier: 'global_elite' },
      { id: '3', apiFootballId: 3, name: 'Europa League', flag: '🏆', country: 'Europe', tier: 'global_elite' },
      { id: '13', apiFootballId: 13, name: 'Copa Libertadores', flag: '🏆', country: 'South America', tier: 'regional_hero' },
      { id: '253', apiFootballId: 253, name: 'MLS', flag: '🇺🇸', country: 'USA', tier: 'domestic_tier1' },
      { id: '1', apiFootballId: 1, name: 'World Cup', flag: '🌍', country: 'World', tier: 'global_elite' },
    ],
    popularLeaguesList: [
      'Champions League',
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'Europa League',
      'Copa Libertadores',
      'MLS',
      'World Cup',
    ],
  },
};

const REGION_OVERRIDE_KEY = 'predictpro_geo_region_override';

/**
 * Detects the user's geographic region using multiple signals:
 * 1. User manual override from storage
 * 2. IANA Timezone matching
 * 3. Browser locale / language code
 */
export function detectUserGeographicRegion(): {
  regionId: GeographicRegionId;
  region: RegionDefinition;
  isAutoDetected: boolean;
  detectedTimezone: string;
  matchedBy: 'override' | 'timezone' | 'locale' | 'fallback';
} {
  let detectedTz = 'UTC';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
  } catch {}

  // 1. Check manual override
  if (typeof window !== 'undefined') {
    try {
      const override = localStorage.getItem(REGION_OVERRIDE_KEY) as GeographicRegionId | null;
      if (override && GEOGRAPHIC_REGIONS[override]) {
        return {
          regionId: override,
          region: GEOGRAPHIC_REGIONS[override],
          isAutoDetected: false,
          detectedTimezone: detectedTz,
          matchedBy: 'override',
        };
      }
    } catch {}
  }

  // 2. Match by Timezone
  if (detectedTz && detectedTz !== 'UTC') {
    for (const region of Object.values(GEOGRAPHIC_REGIONS)) {
      if (region.timezones.some((tz) => tz.toLowerCase() === detectedTz.toLowerCase())) {
        return {
          regionId: region.id,
          region,
          isAutoDetected: true,
          detectedTimezone: detectedTz,
          matchedBy: 'timezone',
        };
      }
    }

    // Heuristic prefix matching
    if (detectedTz.startsWith('Africa/')) {
      if (['Nairobi', 'Dar_es_Salaam', 'Kampala', 'Kigali', 'Addis_Ababa', 'Mogadishu', 'Asmara'].some(c => detectedTz.includes(c))) {
        return { regionId: 'east_africa', region: GEOGRAPHIC_REGIONS.east_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      if (['Lagos', 'Accra', 'Abidjan', 'Dakar', 'Douala', 'Bamako', 'Niamey', 'Conakry', 'Freetown', 'Monrovia'].some(c => detectedTz.includes(c))) {
        return { regionId: 'west_africa', region: GEOGRAPHIC_REGIONS.west_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      if (['Johannesburg', 'Harare', 'Lusaka', 'Gaborone', 'Windhoek', 'Maputo', 'Maseru', 'Mbabane'].some(c => detectedTz.includes(c))) {
        return { regionId: 'southern_africa', region: GEOGRAPHIC_REGIONS.southern_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      if (['Cairo', 'Casablanca', 'Algiers', 'Tunis', 'Tripoli'].some(c => detectedTz.includes(c))) {
        return { regionId: 'north_africa_middle_east', region: GEOGRAPHIC_REGIONS.north_africa_middle_east, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      return { regionId: 'east_africa', region: GEOGRAPHIC_REGIONS.east_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
    }

    if (detectedTz.startsWith('America/')) {
      if (['New_York', 'Chicago', 'Denver', 'Los_Angeles', 'Toronto', 'Vancouver', 'Phoenix', 'Detroit', 'Montreal', 'Mexico_City', 'Monterrey'].some(c => detectedTz.includes(c))) {
        return { regionId: 'north_america', region: GEOGRAPHIC_REGIONS.north_america, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      return { regionId: 'latin_america', region: GEOGRAPHIC_REGIONS.latin_america, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
    }

    if (detectedTz.startsWith('Europe/')) {
      if (['London', 'Belfast', 'Dublin'].some(c => detectedTz.includes(c))) {
        return { regionId: 'uk_ireland', region: GEOGRAPHIC_REGIONS.uk_ireland, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      return { regionId: 'western_europe', region: GEOGRAPHIC_REGIONS.western_europe, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
    }

    if (detectedTz.startsWith('Asia/')) {
      if (['Riyadh', 'Dubai', 'Qatar', 'Kuwait', 'Bahrain', 'Muscat', 'Amman', 'Beirut', 'Baghdad'].some(c => detectedTz.includes(c))) {
        return { regionId: 'north_africa_middle_east', region: GEOGRAPHIC_REGIONS.north_africa_middle_east, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
      }
      return { regionId: 'asia_pacific', region: GEOGRAPHIC_REGIONS.asia_pacific, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
    }

    if (detectedTz.startsWith('Australia/') || detectedTz.startsWith('Pacific/')) {
      return { regionId: 'asia_pacific', region: GEOGRAPHIC_REGIONS.asia_pacific, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'timezone' };
    }
  }

  // 3. Match by browser locale / language
  if (typeof navigator !== 'undefined' && navigator.languages) {
    const langs = Array.from(navigator.languages);
    for (const lang of langs) {
      const lower = lang.toLowerCase();
      if (lower.includes('-ke') || lower.includes('-tz') || lower.includes('-ug') || lower.includes('-rw') || lower.startsWith('sw')) {
        return { regionId: 'east_africa', region: GEOGRAPHIC_REGIONS.east_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.includes('-ng') || lower.includes('-gh') || lower.includes('-ci') || lower.includes('-sn')) {
        return { regionId: 'west_africa', region: GEOGRAPHIC_REGIONS.west_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.includes('-za') || lower.includes('-zw') || lower.includes('-zm')) {
        return { regionId: 'southern_africa', region: GEOGRAPHIC_REGIONS.southern_africa, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.includes('-gb') || lower.includes('-ie')) {
        return { regionId: 'uk_ireland', region: GEOGRAPHIC_REGIONS.uk_ireland, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.includes('-us') || lower.includes('-ca')) {
        return { regionId: 'north_america', region: GEOGRAPHIC_REGIONS.north_america, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.includes('-br') || lower.includes('-ar') || lower.includes('-co') || lower.includes('-cl')) {
        return { regionId: 'latin_america', region: GEOGRAPHIC_REGIONS.latin_america, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
      if (lower.startsWith('ar-') || lower.includes('-sa') || lower.includes('-ae') || lower.includes('-eg')) {
        return { regionId: 'north_africa_middle_east', region: GEOGRAPHIC_REGIONS.north_africa_middle_east, isAutoDetected: true, detectedTimezone: detectedTz, matchedBy: 'locale' };
      }
    }
  }

  // 4. Default to East Africa / Kenya (Platform Heritage)
  return {
    regionId: 'east_africa',
    region: GEOGRAPHIC_REGIONS.east_africa,
    isAutoDetected: true,
    detectedTimezone: detectedTz,
    matchedBy: 'fallback',
  };
}

/**
 * Saves a manual geographic region override
 */
export function setGeographicRegionOverride(regionId: GeographicRegionId | 'auto') {
  if (typeof window === 'undefined') return;
  try {
    if (regionId === 'auto') {
      localStorage.removeItem(REGION_OVERRIDE_KEY);
    } else {
      localStorage.setItem(REGION_OVERRIDE_KEY, regionId);
    }
    window.dispatchEvent(new CustomEvent('predictpro_geo_region_changed', { detail: { regionId } }));
  } catch (e) {
    console.warn('Failed to save geo region override:', e);
  }
}

/**
 * Returns prioritized leagues list for UI filters and category tabs
 */
export function getPrioritizedLeaguesForRegion(
  regionId: GeographicRegionId,
  favoriteLeagues: string[] = []
): Array<{ id: string; name: string; flag: string; badge?: string; isFavorite?: boolean; isDomestic?: boolean }> {
  const reg = GEOGRAPHIC_REGIONS[regionId] || GEOGRAPHIC_REGIONS.global;
  const result: Array<{ id: string; name: string; flag: string; badge?: string; isFavorite?: boolean; isDomestic?: boolean }> = [];
  const addedNames = new Set<string>();

  // 1. User's explicit favorites first
  for (const fav of favoriteLeagues) {
    if (!fav || addedNames.has(fav.toLowerCase())) continue;
    const knownMeta = reg.topLeagues.find((l) => l.name.toLowerCase() === fav.toLowerCase());
    result.push({
      id: knownMeta?.id || fav,
      name: fav,
      flag: knownMeta?.flag || '⭐',
      badge: 'Favorite',
      isFavorite: true,
      isDomestic: knownMeta?.isDomestic,
    });
    addedNames.add(fav.toLowerCase());
  }

  // 2. Region's top curated leagues
  for (const lg of reg.topLeagues) {
    if (addedNames.has(lg.name.toLowerCase())) continue;
    result.push({
      id: lg.id,
      name: lg.name,
      flag: lg.flag,
      badge: lg.badgeLabel,
      isDomestic: lg.isDomestic,
    });
    addedNames.add(lg.name.toLowerCase());
  }

  // 3. Fallback international competitions
  const globalFallbacks = [
    { id: '39', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: '2', name: 'Champions League', flag: '🏆' },
    { id: '140', name: 'La Liga', flag: '🇪🇸' },
    { id: '135', name: 'Serie A', flag: '🇮🇹' },
    { id: '78', name: 'Bundesliga', flag: '🇩🇪' },
    { id: '61', name: 'Ligue 1', flag: '🇫🇷' },
    { id: '253', name: 'MLS', flag: '🇺🇸' },
  ];

  for (const fallback of globalFallbacks) {
    if (!addedNames.has(fallback.name.toLowerCase())) {
      result.push(fallback);
      addedNames.add(fallback.name.toLowerCase());
    }
  }

  return result;
}

/**
 * Calculates a relevance score for sorting predictions or live matches based on geographic region
 */
export function getLeagueRelevanceScore(
  leagueName: string,
  regionId: GeographicRegionId,
  favoriteLeagues: string[] = []
): { score: number; badgeLabel?: string; isDomestic?: boolean } {
  if (!leagueName) return { score: 0 };
  const lowerName = leagueName.toLowerCase();

  // 1. Explicit user favorite: highest priority
  if (favoriteLeagues.some((f) => f.toLowerCase() === lowerName || lowerName.includes(f.toLowerCase()))) {
    return { score: 1000, badgeLabel: '⭐ Favorite', isDomestic: false };
  }

  const region = GEOGRAPHIC_REGIONS[regionId] || GEOGRAPHIC_REGIONS.global;

  // 2. Region's top curated leagues
  const matchedMeta = region.topLeagues.find(
    (l) => l.name.toLowerCase() === lowerName || lowerName.includes(l.name.toLowerCase()) || (l.shortName && lowerName.includes(l.shortName.toLowerCase()))
  );

  if (matchedMeta) {
    if (matchedMeta.tier === 'domestic_tier1') {
      return { score: 800, badgeLabel: matchedMeta.badgeLabel || `${region.flag} Local League`, isDomestic: true };
    }
    if (matchedMeta.tier === 'regional_hero') {
      return { score: 650, badgeLabel: matchedMeta.badgeLabel || 'Regional Hero', isDomestic: false };
    }
    if (matchedMeta.tier === 'global_elite') {
      return { score: 500, badgeLabel: matchedMeta.badgeLabel || 'Top Elite', isDomestic: false };
    }
  }

  // 3. Broad regional string matching (e.g. Kenya, AFCON, CAF, Nigeria, PSL, MLS, Libertadores)
  if (regionId === 'east_africa') {
    if (lowerName.includes('kenya') || lowerName.includes('kpl') || lowerName.includes('fkf')) {
      return { score: 750, badgeLabel: '🇰🇪 Domestic League', isDomestic: true };
    }
    if (lowerName.includes('afcon') || lowerName.includes('caf') || lowerName.includes('cecafa')) {
      return { score: 600, badgeLabel: '🌍 African Football', isDomestic: false };
    }
  } else if (regionId === 'west_africa') {
    if (lowerName.includes('nigeria') || lowerName.includes('npfl') || lowerName.includes('ghana')) {
      return { score: 750, badgeLabel: '🇳🇬 Domestic League', isDomestic: true };
    }
    if (lowerName.includes('afcon') || lowerName.includes('caf')) {
      return { score: 600, badgeLabel: '🌍 African Football', isDomestic: false };
    }
  } else if (regionId === 'north_america') {
    if (lowerName.includes('mls') || lowerName.includes('major league soccer') || lowerName.includes('liga mx')) {
      return { score: 750, badgeLabel: '🇺🇸 North America', isDomestic: true };
    }
  } else if (regionId === 'latin_america') {
    if (lowerName.includes('libertadores') || lowerName.includes('brasil') || lowerName.includes('argentin')) {
      return { score: 750, badgeLabel: '🏆 CONMEBOL', isDomestic: true };
    }
  }

  // 4. Global Premier Leagues
  if (lowerName.includes('premier league') || lowerName.includes('champions league') || lowerName.includes('la liga')) {
    return { score: 400, badgeLabel: 'Top Tier' };
  }
  if (lowerName.includes('serie a') || lowerName.includes('bundesliga') || lowerName.includes('ligue 1')) {
    return { score: 300 };
  }

  return { score: 100 };
}

/**
 * Prioritizes and sorts match predictions based on geographic region & user favorites
 */
export function sortPredictionsByRegion<T extends { league: string; match_date?: string | Date; confidence?: number; confidence_score?: number }>(
  items: T[],
  regionId: GeographicRegionId,
  favoriteLeagues: string[] = []
): T[] {
  return [...items].sort((a, b) => {
    const relA = getLeagueRelevanceScore(a.league, regionId, favoriteLeagues).score;
    const relB = getLeagueRelevanceScore(b.league, regionId, favoriteLeagues).score;

    if (relA !== relB) {
      return relB - relA; // higher score first
    }

    // Tie-break by confidence score
    const confA = a.confidence_score ?? a.confidence ?? 60;
    const confB = b.confidence_score ?? b.confidence ?? 60;
    if (confA !== confB) {
      return confB - confA;
    }

    // Tie-break by match date (earliest first)
    const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
    const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
    return dateA - dateB;
  });
}

/**
 * Prioritizes and sorts live match fixtures based on in-play state + geographic relevance
 */
export function sortLiveFixturesByRegion<T extends { league: string; status: string; minute?: number | string; match_date?: string | Date }>(
  items: T[],
  regionId: GeographicRegionId,
  favoriteLeagues: string[] = []
): T[] {
  return [...items].sort((a, b) => {
    // 1. In-play matches always float to the top
    const isLiveA = a.status === 'live' || a.status === 'halftime' ? 1 : 0;
    const isLiveB = b.status === 'live' || b.status === 'halftime' ? 1 : 0;
    if (isLiveA !== isLiveB) {
      return isLiveB - isLiveA;
    }

    // 2. Regional relevance within each category
    const relA = getLeagueRelevanceScore(a.league, regionId, favoriteLeagues).score;
    const relB = getLeagueRelevanceScore(b.league, regionId, favoriteLeagues).score;
    if (relA !== relB) {
      return relB - relA;
    }

    // 3. Upcoming matches sorted by kickoff time
    const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
    const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
    return dateA - dateB;
  });
}
