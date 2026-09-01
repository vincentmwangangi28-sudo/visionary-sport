/**
 * Comprehensive football team logo lookup dictionary & CDN service.
 * Provides high-resolution official badges, smart alias matching,
 * and deterministic color/initials fallback for any football team worldwide.
 */

export interface TeamLogoInfo {
  name: string;
  logo: string;
  shortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Canonical database of club & national team crests with reliable CDN URLs (ESPN / API-Football / Wikimedia)
export const CANONICAL_TEAM_LOGOS: Record<string, TeamLogoInfo> = {
  // === PREMIER LEAGUE ===
  'arsenal': {
    name: 'Arsenal',
    shortName: 'ARS',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    primaryColor: '#EF0107',
    secondaryColor: '#FFFFFF',
  },
  'chelsea': {
    name: 'Chelsea',
    shortName: 'CHE',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
    primaryColor: '#034694',
    secondaryColor: '#EE242C',
  },
  'liverpool': {
    name: 'Liverpool',
    shortName: 'LIV',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
  },
  'manchester city': {
    name: 'Manchester City',
    shortName: 'MCI',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
  },
  'manchester united': {
    name: 'Manchester United',
    shortName: 'MUN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
    primaryColor: '#DA291C',
    secondaryColor: '#FBE122',
  },
  'tottenham hotspur': {
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
    primaryColor: '#132257',
    secondaryColor: '#FFFFFF',
  },
  'newcastle united': {
    name: 'Newcastle United',
    shortName: 'NEW',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
    primaryColor: '#241F20',
    secondaryColor: '#41B6E6',
  },
  'aston villa': {
    name: 'Aston Villa',
    shortName: 'AVL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
    primaryColor: '#670E36',
    secondaryColor: '#95BFE5',
  },
  'brighton': {
    name: 'Brighton & Hove Albion',
    shortName: 'BHA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
    primaryColor: '#0057B8',
    secondaryColor: '#FFCD00',
  },
  'west ham united': {
    name: 'West Ham United',
    shortName: 'WHU',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
    primaryColor: '#7A263A',
    secondaryColor: '#1BB1E7',
  },
  'everton': {
    name: 'Everton',
    shortName: 'EVE',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
    primaryColor: '#003399',
    secondaryColor: '#FFFFFF',
  },
  'crystal palace': {
    name: 'Crystal Palace',
    shortName: 'CRY',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
    primaryColor: '#1B458F',
    secondaryColor: '#C4122E',
  },
  'brentford': {
    name: 'Brentford',
    shortName: 'BRE',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png',
    primaryColor: '#E30613',
    secondaryColor: '#FEEB00',
  },
  'fulham': {
    name: 'Fulham',
    shortName: 'FUL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
    primaryColor: '#CC0000',
    secondaryColor: '#000000',
  },
  'nottingham forest': {
    name: 'Nottingham Forest',
    shortName: 'NFO',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
    primaryColor: '#DD0000',
    secondaryColor: '#FFFFFF',
  },
  'wolverhampton wanderers': {
    name: 'Wolverhampton Wanderers',
    shortName: 'WOL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    primaryColor: '#FDB913',
    secondaryColor: '#231F20',
  },
  'bournemouth': {
    name: 'AFC Bournemouth',
    shortName: 'BOU',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
    primaryColor: '#DA291C',
    secondaryColor: '#000000',
  },
  'leicester city': {
    name: 'Leicester City',
    shortName: 'LEI',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png',
    primaryColor: '#003090',
    secondaryColor: '#FDBE11',
  },
  'southampton': {
    name: 'Southampton',
    shortName: 'SOU',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png',
    primaryColor: '#D71920',
    secondaryColor: '#130C0E',
  },
  'ipswich town': {
    name: 'Ipswich Town',
    shortName: 'IPS',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png',
    primaryColor: '#0047AB',
    secondaryColor: '#FFFFFF',
  },
  'leeds united': {
    name: 'Leeds United',
    shortName: 'LEE',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/357.png',
    primaryColor: '#FFCD00',
    secondaryColor: '#1D428A',
  },
  'sunderland': {
    name: 'Sunderland',
    shortName: 'SUN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
    primaryColor: '#EB172B',
    secondaryColor: '#231F20',
  },

  // === LA LIGA ===
  'real madrid': {
    name: 'Real Madrid',
    shortName: 'RMA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    primaryColor: '#FEBE10',
    secondaryColor: '#00529F',
  },
  'barcelona': {
    name: 'Barcelona',
    shortName: 'FCB',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    primaryColor: '#004D98',
    secondaryColor: '#A50044',
  },
  'atletico madrid': {
    name: 'Atlético Madrid',
    shortName: 'ATM',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
    primaryColor: '#CB3524',
    secondaryColor: '#272E61',
  },
  'real sociedad': {
    name: 'Real Sociedad',
    shortName: 'RSO',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',
    primaryColor: '#0067B1',
    secondaryColor: '#FFFFFF',
  },
  'athletic bilbao': {
    name: 'Athletic Bilbao',
    shortName: 'ATH',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
    primaryColor: '#EE2523',
    secondaryColor: '#000000',
  },
  'real betis': {
    name: 'Real Betis',
    shortName: 'BET',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
    primaryColor: '#00954C',
    secondaryColor: '#FFFFFF',
  },
  'villarreal': {
    name: 'Villarreal',
    shortName: 'VIL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',
    primaryColor: '#FFE600',
    secondaryColor: '#00519E',
  },
  'sevilla': {
    name: 'Sevilla',
    shortName: 'SEV',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
    primaryColor: '#D40F1E',
    secondaryColor: '#FFFFFF',
  },
  'valencia': {
    name: 'Valencia',
    shortName: 'VAL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
    primaryColor: '#FF7300',
    secondaryColor: '#000000',
  },
  'girona': {
    name: 'Girona',
    shortName: 'GIR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png',
    primaryColor: '#CD1317',
    secondaryColor: '#FFFFFF',
  },
  'celta vigo': {
    name: 'Celta Vigo',
    shortName: 'CEL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',
    primaryColor: '#8AC3EE',
    secondaryColor: '#E20613',
  },
  'mallorca': {
    name: 'Mallorca',
    shortName: 'MLL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/84.png',
    primaryColor: '#E20613',
    secondaryColor: '#000000',
  },
  'osasuna': {
    name: 'Osasuna',
    shortName: 'OSA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png',
    primaryColor: '#D91A21',
    secondaryColor: '#0B1E38',
  },
  'rayo vallecano': {
    name: 'Rayo Vallecano',
    shortName: 'RAY',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/101.png',
    primaryColor: '#E20613',
    secondaryColor: '#FFFFFF',
  },
  'getafe': {
    name: 'Getafe',
    shortName: 'GET',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2922.png',
    primaryColor: '#005BAA',
    secondaryColor: '#FFFFFF',
  },

  // === SERIE A ===
  'inter milan': {
    name: 'Inter Milan',
    shortName: 'INT',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    primaryColor: '#010E80',
    secondaryColor: '#000000',
  },
  'ac milan': {
    name: 'AC Milan',
    shortName: 'MIL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
    primaryColor: '#FB090B',
    secondaryColor: '#000000',
  },
  'juventus': {
    name: 'Juventus',
    shortName: 'JUV',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
  },
  'napoli': {
    name: 'Napoli',
    shortName: 'NAP',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
    primaryColor: '#12A0D7',
    secondaryColor: '#FFFFFF',
  },
  'as roma': {
    name: 'AS Roma',
    shortName: 'ASR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    primaryColor: '#8E1F2F',
    secondaryColor: '#F0BC42',
  },
  'lazio': {
    name: 'Lazio',
    shortName: 'LAZ',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
    primaryColor: '#87D8F7',
    secondaryColor: '#FFFFFF',
  },
  'atalanta': {
    name: 'Atalanta',
    shortName: 'ATA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    primaryColor: '#1E71B8',
    secondaryColor: '#000000',
  },
  'fiorentina': {
    name: 'Fiorentina',
    shortName: 'FIO',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
    primaryColor: '#4F2382',
    secondaryColor: '#FFFFFF',
  },
  'bologna': {
    name: 'Bologna',
    shortName: 'BOC',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',
    primaryColor: '#1B2838',
    secondaryColor: '#9E1B32',
  },
  'torino': {
    name: 'Torino',
    shortName: 'TOR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/239.png',
    primaryColor: '#8A1538',
    secondaryColor: '#FFFFFF',
  },
  'monza': {
    name: 'Monza',
    shortName: 'MON',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2753.png',
    primaryColor: '#E30613',
    secondaryColor: '#FFFFFF',
  },
  'genoa': {
    name: 'Genoa',
    shortName: 'GEN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png',
    primaryColor: '#A81C26',
    secondaryColor: '#002B49',
  },

  // === BUNDESLIGA ===
  'bayern munich': {
    name: 'Bayern Munich',
    shortName: 'BAY',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
  },
  'borussia dortmund': {
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
    primaryColor: '#FDE100',
    secondaryColor: '#000000',
  },
  'bayer leverkusen': {
    name: 'Bayer Leverkusen',
    shortName: 'B04',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    primaryColor: '#E32221',
    secondaryColor: '#000000',
  },
  'rb leipzig': {
    name: 'RB Leipzig',
    shortName: 'RBL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
    primaryColor: '#DB0032',
    secondaryColor: '#0C2340',
  },
  'eintracht frankfurt': {
    name: 'Eintracht Frankfurt',
    shortName: 'SGE',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    primaryColor: '#E1000F',
    secondaryColor: '#000000',
  },
  'vfb stuttgart': {
    name: 'VfB Stuttgart',
    shortName: 'VFB',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png',
    primaryColor: '#E32219',
    secondaryColor: '#FFFFFF',
  },
  'borussia monchengladbach': {
    name: 'Borussia Mönchengladbach',
    shortName: 'BMG',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/130.png',
    primaryColor: '#00A650',
    secondaryColor: '#000000',
  },
  'wolfsburg': {
    name: 'VfL Wolfsburg',
    shortName: 'WOB',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/138.png',
    primaryColor: '#65B32E',
    secondaryColor: '#FFFFFF',
  },
  'sc freiburg': {
    name: 'SC Freiburg',
    shortName: 'SCF',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/126.png',
    primaryColor: '#000000',
    secondaryColor: '#E20613',
  },
  'werder bremen': {
    name: 'Werder Bremen',
    shortName: 'SVW',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/137.png',
    primaryColor: '#1D9053',
    secondaryColor: '#FFFFFF',
  },

  // === LIGUE 1 ===
  'paris saint-germain': {
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
    primaryColor: '#004170',
    secondaryColor: '#DA291C',
  },
  'marseille': {
    name: 'Olympique de Marseille',
    shortName: 'OM',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
    primaryColor: '#2FAEE0',
    secondaryColor: '#FFFFFF',
  },
  'lyon': {
    name: 'Olympique Lyonnais',
    shortName: 'OL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',
    primaryColor: '#1A3370',
    secondaryColor: '#DA291C',
  },
  'monaco': {
    name: 'AS Monaco',
    shortName: 'ASM',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
    primaryColor: '#E20613',
    secondaryColor: '#F5A800',
  },
  'lille': {
    name: 'Lille OSC',
    shortName: 'LOSC',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/165.png',
    primaryColor: '#E01E13',
    secondaryColor: '#11224D',
  },
  'rennes': {
    name: 'Stade Rennais',
    shortName: 'SRFC',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/178.png',
    primaryColor: '#E20613',
    secondaryColor: '#000000',
  },
  'nice': {
    name: 'OGC Nice',
    shortName: 'OGCN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/177.png',
    primaryColor: '#DA291C',
    secondaryColor: '#000000',
  },
  'lens': {
    name: 'RC Lens',
    shortName: 'RCL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/170.png',
    primaryColor: '#E30613',
    secondaryColor: '#FFE700',
  },

  // === EUROPEAN GIANTS ===
  'sporting cp': {
    name: 'Sporting CP',
    shortName: 'SCP',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2258.png',
    primaryColor: '#008057',
    secondaryColor: '#FFD100',
  },
  'benfica': {
    name: 'SL Benfica',
    shortName: 'SLB',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2256.png',
    primaryColor: '#E30613',
    secondaryColor: '#FFFFFF',
  },
  'porto': {
    name: 'FC Porto',
    shortName: 'FCP',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2257.png',
    primaryColor: '#0038A8',
    secondaryColor: '#FFFFFF',
  },
  'ajax': {
    name: 'AFC Ajax',
    shortName: 'AJX',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
    primaryColor: '#D2122E',
    secondaryColor: '#FFFFFF',
  },
  'psv eindhoven': {
    name: 'PSV Eindhoven',
    shortName: 'PSV',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
    primaryColor: '#ED1C24',
    secondaryColor: '#FFFFFF',
  },
  'feyenoord': {
    name: 'Feyenoord',
    shortName: 'FEY',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/142.png',
    primaryColor: '#ED1C24',
    secondaryColor: '#000000',
  },
  'celtic': {
    name: 'Celtic',
    shortName: 'CEL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/301.png',
    primaryColor: '#008542',
    secondaryColor: '#FFFFFF',
  },
  'rangers': {
    name: 'Rangers',
    shortName: 'RAN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/306.png',
    primaryColor: '#0047AB',
    secondaryColor: '#D71920',
  },
  'galatasaray': {
    name: 'Galatasaray',
    shortName: 'GAL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/440.png',
    primaryColor: '#A90432',
    secondaryColor: '#FDB912',
  },
  'fenerbahce': {
    name: 'Fenerbahçe',
    shortName: 'FEN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/438.png',
    primaryColor: '#002D72',
    secondaryColor: '#FFED00',
  },

  // === KENYAN PREMIER LEAGUE (FKF) & EAST AFRICAN GIANTS ===
  'gor mahia': {
    name: 'Gor Mahia FC',
    shortName: 'GOR',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Gor_Mahia_F.C._logo.svg/300px-Gor_Mahia_F.C._logo.svg.png',
    primaryColor: '#008751',
    secondaryColor: '#FFFFFF',
  },
  'afc leopards': {
    name: 'AFC Leopards',
    shortName: 'AFC',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/AFC_Leopards_logo.png/250px-AFC_Leopards_logo.png',
    primaryColor: '#002B49',
    secondaryColor: '#FFFFFF',
  },
  'tusker': {
    name: 'Tusker FC',
    shortName: 'TUS',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Tusker_FC_logo.png/250px-Tusker_FC_logo.png',
    primaryColor: '#FFD100',
    secondaryColor: '#000000',
  },
  'kenya police': {
    name: 'Kenya Police FC',
    shortName: 'POL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/25/Kenya_Police_FC_logo.png',
    primaryColor: '#002B49',
    secondaryColor: '#C4122E',
  },
  'bandari': {
    name: 'Bandari FC',
    shortName: 'BAN',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Bandari_FC_%28Kenya%29_logo.png/250px-Bandari_FC_%28Kenya%29_logo.png',
    primaryColor: '#005BAA',
    secondaryColor: '#FFD100',
  },
  'kcb': {
    name: 'KCB FC',
    shortName: 'KCB',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/91/KCB_Bank_Kenya_Limited_logo.png',
    primaryColor: '#008751',
    secondaryColor: '#005BAA',
  },
  'shabana': {
    name: 'Shabana FC',
    shortName: 'SHA',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/30/Shabana_FC_logo.png',
    primaryColor: '#E20613',
    secondaryColor: '#FFFFFF',
  },
  'ulinzi stars': {
    name: 'Ulinzi Stars',
    shortName: 'ULI',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Ulinzi_Stars_FC_logo.png/250px-Ulinzi_Stars_FC_logo.png',
    primaryColor: '#8A1538',
    secondaryColor: '#FFCD00',
  },
  'kakamega homeboyz': {
    name: 'Kakamega Homeboyz',
    shortName: 'KHB',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Kakamega_Homeboyz_F.C._logo.png',
    primaryColor: '#FFE500',
    secondaryColor: '#005BAA',
  },
  'nairobi city stars': {
    name: 'Nairobi City Stars',
    shortName: 'NCS',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Nairobi_City_Stars_FC.png/250px-Nairobi_City_Stars_FC.png',
    primaryColor: '#005BAA',
    secondaryColor: '#FFFFFF',
  },
  'bidco united': {
    name: 'Bidco United',
    shortName: 'BID',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Bidco_United_FC_logo.png/250px-Bidco_United_FC_logo.png',
    primaryColor: '#F58220',
    secondaryColor: '#002B49',
  },
  'kariobangi sharks': {
    name: 'Kariobangi Sharks',
    shortName: 'SHA',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Kariobangi_Sharks_FC_logo.png/250px-Kariobangi_Sharks_FC_logo.png',
    primaryColor: '#F7D000',
    secondaryColor: '#008751',
  },
  'muranga seal': {
    name: "Murang'a Seal",
    shortName: 'MSL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Murang%27a_Seal_FC_logo.png/250px-Murang%27a_Seal_FC_logo.png',
    primaryColor: '#FDB913',
    secondaryColor: '#000000',
  },
  'posta rangers': {
    name: 'Posta Rangers',
    shortName: 'POS',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Posta_Rangers_FC_logo.png/250px-Posta_Rangers_FC_logo.png',
    primaryColor: '#E20613',
    secondaryColor: '#FFD100',
  },
  'fc talanta': {
    name: 'FC Talanta',
    shortName: 'TAL',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/FC_Talanta_logo.png/250px-FC_Talanta_logo.png',
    primaryColor: '#005BAA',
    secondaryColor: '#FFCD00',
  },
  'sofapaka': {
    name: 'Sofapaka FC',
    shortName: 'SOF',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Sofapaka_FC_logo.png/250px-Sofapaka_FC_logo.png',
    primaryColor: '#003399',
    secondaryColor: '#FFD700',
  },
  'mara sugar': {
    name: 'Mara Sugar FC',
    shortName: 'MSU',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Mara_Sugar_FC_logo.png/250px-Mara_Sugar_FC_logo.png',
    primaryColor: '#008751',
    secondaryColor: '#FFD100',
  },
  'mathare united': {
    name: 'Mathare United',
    shortName: 'MAT',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Mathare_United_logo.png/250px-Mathare_United_logo.png',
    primaryColor: '#008751',
    secondaryColor: '#FEEB00',
  },

  // === AFRICAN CONTINENTAL GIANTS (CAF / AFCON) ===
  'al ahly': {
    name: 'Al Ahly SC',
    shortName: 'AHL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3932.png',
    primaryColor: '#C4122E',
    secondaryColor: '#FFFFFF',
  },
  'zamalek': {
    name: 'Zamalek SC',
    shortName: 'ZAM',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3933.png',
    primaryColor: '#FFFFFF',
    secondaryColor: '#C4122E',
  },
  'mamelodi sundowns': {
    name: 'Mamelodi Sundowns',
    shortName: 'MSD',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7754.png',
    primaryColor: '#FFD700',
    secondaryColor: '#0055A5',
  },
  'simba': {
    name: 'Simba SC',
    shortName: 'SIM',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Simba_SC_logo.svg/300px-Simba_SC_logo.svg.png',
    primaryColor: '#DA291C',
    secondaryColor: '#FFFFFF',
  },
  'young africans': {
    name: 'Young Africans SC (Yanga)',
    shortName: 'YAN',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Young_Africans_S.C._logo.svg/300px-Young_Africans_S.C._logo.svg.png',
    primaryColor: '#008751',
    secondaryColor: '#FFD100',
  },

  // === NATIONAL TEAMS (WORLD CUP & AFCON) ===
  'england': {
    name: 'England',
    shortName: 'ENG',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/448.png',
    primaryColor: '#FFFFFF',
    secondaryColor: '#C8102E',
  },
  'france': {
    name: 'France',
    shortName: 'FRA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/478.png',
    primaryColor: '#002654',
    secondaryColor: '#ED2939',
  },
  'brazil': {
    name: 'Brazil',
    shortName: 'BRA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/205.png',
    primaryColor: '#FEDF00',
    secondaryColor: '#009739',
  },
  'argentina': {
    name: 'Argentina',
    shortName: 'ARG',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/202.png',
    primaryColor: '#74ACDF',
    secondaryColor: '#FFFFFF',
  },
  'germany': {
    name: 'Germany',
    shortName: 'GER',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/481.png',
    primaryColor: '#000000',
    secondaryColor: '#DD0000',
  },
  'spain': {
    name: 'Spain',
    shortName: 'ESP',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png',
    primaryColor: '#AA151B',
    secondaryColor: '#F1BF00',
  },
  'portugal': {
    name: 'Portugal',
    shortName: 'POR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/531.png',
    primaryColor: '#DA291C',
    secondaryColor: '#006600',
  },
  'netherlands': {
    name: 'Netherlands',
    shortName: 'NED',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/449.png',
    primaryColor: '#F36C21',
    secondaryColor: '#FFFFFF',
  },
  'morocco': {
    name: 'Morocco',
    shortName: 'MAR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/463.png',
    primaryColor: '#C1272D',
    secondaryColor: '#006233',
  },
  'senegal': {
    name: 'Senegal',
    shortName: 'SEN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/654.png',
    primaryColor: '#00853F',
    secondaryColor: '#FDEF42',
  },
  'nigeria': {
    name: 'Nigeria',
    shortName: 'NGA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/657.png',
    primaryColor: '#008751',
    secondaryColor: '#FFFFFF',
  },
  'egypt': {
    name: 'Egypt',
    shortName: 'EGY',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/658.png',
    primaryColor: '#C8102E',
    secondaryColor: '#000000',
  },
  'kenya': {
    name: 'Kenya (Harambee Stars)',
    shortName: 'KEN',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/665.png',
    primaryColor: '#C4122E',
    secondaryColor: '#008751',
  },
  'ghana': {
    name: 'Ghana',
    shortName: 'GHA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/660.png',
    primaryColor: '#EF3340',
    secondaryColor: '#FFD100',
  },
  'ivory coast': {
    name: 'Ivory Coast',
    shortName: 'CIV',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/656.png',
    primaryColor: '#FF8200',
    secondaryColor: '#009A44',
  },
  'cameroon': {
    name: 'Cameroon',
    shortName: 'CMR',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/659.png',
    primaryColor: '#007A3D',
    secondaryColor: '#CE1126',
  },
  'inter miami': {
    name: 'Inter Miami CF',
    shortName: 'MIA',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/18267.png',
    primaryColor: '#F7B5CD',
    secondaryColor: '#231F20',
  },
  'al hilal': {
    name: 'Al Hilal',
    shortName: 'HIL',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7339.png',
    primaryColor: '#00539F',
    secondaryColor: '#FFFFFF',
  },
  'al nassr': {
    name: 'Al Nassr',
    shortName: 'NAS',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7340.png',
    primaryColor: '#FEDF00',
    secondaryColor: '#0038A8',
  }
};

/**
 * Common team alias normalization map
 */
const ALIASES: Record<string, string> = {
  'man city': 'manchester city',
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'mancity': 'manchester city',
  'manutd': 'manchester united',
  'spurs': 'tottenham hotspur',
  'tottenham': 'tottenham hotspur',
  'wolves': 'wolverhampton wanderers',
  'nottm forest': 'nottingham forest',
  'forest': 'nottingham forest',
  'brighton & hove albion': 'brighton',
  'brighton and hove albion': 'brighton',
  'west ham': 'west ham united',
  'newcastle': 'newcastle united',
  'leeds': 'leeds united',
  'barca': 'barcelona',
  'fc barcelona': 'barcelona',
  'real madrid cf': 'real madrid',
  'atleti': 'atletico madrid',
  'athletic club': 'athletic bilbao',
  'inter': 'inter milan',
  'milan': 'ac milan',
  'juve': 'juventus',
  'roma': 'as roma',
  'bayern': 'bayern munich',
  'fc bayern': 'bayern munich',
  'dortmund': 'borussia dortmund',
  'bvb': 'borussia dortmund',
  'leverkusen': 'bayer leverkusen',
  'bayer 04': 'bayer leverkusen',
  'leipzig': 'rb leipzig',
  'frankfurt': 'eintracht frankfurt',
  'stuttgart': 'vfb stuttgart',
  'm gladbach': 'borussia monchengladbach',
  'psg': 'paris saint-germain',
  'paris sg': 'paris saint-germain',
  'olympique marseille': 'marseille',
  'olympique lyon': 'lyon',
  'sporting': 'sporting cp',
  'sporting lisbon': 'sporting cp',
  'harambee stars': 'kenya',
  'gor': 'gor mahia',
  'kogalo': 'gor mahia',
  'k\'ogalo': 'gor mahia',
  'gor mahia fc': 'gor mahia',
  'ingwe': 'afc leopards',
  'leopards': 'afc leopards',
  'afc leopards sc': 'afc leopards',
  'tusker fc': 'tusker',
  'brewers': 'tusker',
  'police': 'kenya police',
  'police fc': 'kenya police',
  'kenya police fc': 'kenya police',
  'bandari fc': 'bandari',
  'dockers': 'bandari',
  'kcb fc': 'kcb',
  'bankers': 'kcb',
  'shabana fc': 'shabana',
  'tore bobe': 'shabana',
  'ulinzi': 'ulinzi stars',
  'ulinzi stars fc': 'ulinzi stars',
  'homeboyz': 'kakamega homeboyz',
  'city stars': 'nairobi city stars',
  'simba wa nairobi': 'nairobi city stars',
  'sharks': 'kariobangi sharks',
  'kariobangi': 'kariobangi sharks',
  'muranga': 'muranga seal',
  'muranga seal fc': 'muranga seal',
  'posta': 'posta rangers',
  'posta rangers fc': 'posta rangers',
  'talanta': 'fc talanta',
  'talanta fc': 'fc talanta',
  'sofapaka fc': 'sofapaka',
  'batoto ba mungu': 'sofapaka',
  'mara sugar fc': 'mara sugar',
  'mathare': 'mathare united',
  'mathare united fc': 'mathare united',
  'slum boys': 'mathare united',
  'sundowns': 'mamelodi sundowns',
  'yanga': 'young africans',
};

/**
 * Normalize string for matching (strip accents, punctuation, FC/CF prefixes)
 */
function cleanTeamName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|fk|cd|ud|rb|ac|as|ca|fa|sv|vfb|vfl|ssc)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns deterministic initials & background colors for a team
 */
export function getTeamInitialsAndColor(teamName: string): { initials: string; bgColor: string; textColor: string } {
  if (!teamName) return { initials: 'FC', bgColor: '#334155', textColor: '#ffffff' };

  const cleaned = cleanTeamName(teamName);
  const words = cleaned.split(' ').filter(Boolean);

  let initials = 'FC';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 3).toUpperCase();
  }

  // Pre-mapped colors for known archetypes
  if (/arsenal|liverpool|bayern|brentford|roma|sevilla|bologna|atletico|shabana/i.test(cleaned)) {
    return { initials, bgColor: '#DC2626', textColor: '#ffffff' }; // Red
  }
  if (/chelsea|everton|ipswich|getafe|porto|celtic|inter/i.test(cleaned)) {
    return { initials, bgColor: '#1D4ED8', textColor: '#ffffff' }; // Blue
  }
  if (/city|napoli|lazio|celta/i.test(cleaned)) {
    return { initials, bgColor: '#0284C7', textColor: '#ffffff' }; // Sky
  }
  if (/dortmund|villarreal|watford|tusker|al nassr/i.test(cleaned)) {
    return { initials, bgColor: '#EAB308', textColor: '#09090b' }; // Gold
  }
  if (/betis|bremen|gor|yanga|palmeiras|wolfsburg/i.test(cleaned)) {
    return { initials, bgColor: '#16A34A', textColor: '#ffffff' }; // Green
  }
  if (/juventus|newcastle|fulham|monchengladbach/i.test(cleaned)) {
    return { initials, bgColor: '#18181B', textColor: '#ffffff' }; // Dark/Black
  }
  if (/fiorentina|valladolid|real madrid/i.test(cleaned)) {
    return { initials, bgColor: '#7C3AED', textColor: '#ffffff' }; // Purple / Royal
  }

  // Consistent hash color fallback
  const colors = [
    '#2563EB', '#DC2626', '#16A34A', '#D97706', 
    '#7C3AED', '#0D9488', '#E11D48', '#4F46E5', '#475569'
  ];
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;

  return {
    initials,
    bgColor: colors[colorIndex],
    textColor: '#ffffff',
  };
}

/**
 * Look up the official high-resolution logo for a football team name.
 * If external API passed a valid custom logo URL, respects that first.
 */
export function getTeamLogoUrl(teamName: string, customLogo?: string | null): string | null {
  if (customLogo && customLogo.startsWith('http')) {
    return customLogo;
  }

  if (!teamName) return null;

  const rawKey = teamName.toLowerCase().trim();
  if (CANONICAL_TEAM_LOGOS[rawKey]) {
    return CANONICAL_TEAM_LOGOS[rawKey].logo;
  }

  if (ALIASES[rawKey] && CANONICAL_TEAM_LOGOS[ALIASES[rawKey]]) {
    return CANONICAL_TEAM_LOGOS[ALIASES[rawKey]].logo;
  }

  const cleaned = cleanTeamName(teamName);
  if (CANONICAL_TEAM_LOGOS[cleaned]) {
    return CANONICAL_TEAM_LOGOS[cleaned].logo;
  }

  if (ALIASES[cleaned] && CANONICAL_TEAM_LOGOS[ALIASES[cleaned]]) {
    return CANONICAL_TEAM_LOGOS[ALIASES[cleaned]].logo;
  }

  // Fuzzy match against canonical registry
  for (const [key, info] of Object.entries(CANONICAL_TEAM_LOGOS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return info.logo;
    }
  }

  return null;
}
