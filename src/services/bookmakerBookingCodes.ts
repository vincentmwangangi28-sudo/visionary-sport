export interface RegionalBookmaker {
  id: string;
  name: string;
  region: 'Africa' | 'UK & Europe' | 'Americas' | 'Global';
  flag: string;
  codePrefix: string;
  websiteUrl: string;
  deepLinkPattern?: string;
}

export const REGIONAL_BOOKMAKERS: RegionalBookmaker[] = [
  // Africa
  { id: 'sportybet', name: 'SportyBet', region: 'Africa', flag: '🌍', codePrefix: 'sb-', websiteUrl: 'https://www.sportybet.com' },
  { id: 'betika', name: 'Betika', region: 'Africa', flag: '🇰🇪', codePrefix: 'btk-', websiteUrl: 'https://www.betika.com' },
  { id: 'bet9ja', name: 'Bet9ja', region: 'Africa', flag: '🇳🇬', codePrefix: 'b9j-', websiteUrl: 'https://www.bet9ja.com' },
  { id: 'mozzart', name: 'MozzartBet', region: 'Africa', flag: '🌍', codePrefix: 'mzt-', websiteUrl: 'https://www.mozzartbet.co.ke' },
  { id: 'odibets', name: 'OdiBets', region: 'Africa', flag: '🇰🇪', codePrefix: 'odi-', websiteUrl: 'https://www.odibets.com' },
  { id: 'hollywoodbets', name: 'Hollywoodbets', region: 'Africa', flag: '🇿🇦', codePrefix: 'hwb-', websiteUrl: 'https://www.hollywoodbets.net' },

  // UK & Europe
  { id: 'bet365', name: 'Bet365', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'b365-', websiteUrl: 'https://www.bet365.com' },
  { id: 'skybet', name: 'SkyBet', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'sky-', websiteUrl: 'https://www.skybet.com' },
  { id: 'unibet', name: 'Unibet', region: 'UK & Europe', flag: '🇪🇺', codePrefix: 'uni-', websiteUrl: 'https://www.unibet.com' },
  { id: 'betfair', name: 'Betfair', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'bf-', websiteUrl: 'https://www.betfair.com' },
  { id: 'williamhill', name: 'William Hill', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'wh-', websiteUrl: 'https://www.williamhill.com' },

  // Americas
  { id: 'draftkings', name: 'DraftKings', region: 'Americas', flag: '🇺🇸', codePrefix: 'dk-', websiteUrl: 'https://sportsbook.draftkings.com' },
  { id: 'fanduel', name: 'FanDuel', region: 'Americas', flag: '🇺🇸', codePrefix: 'fd-', websiteUrl: 'https://sportsbook.fanduel.com' },
  { id: 'betmgm', name: 'BetMGM', region: 'Americas', flag: '🇺🇸', codePrefix: 'mgm-', websiteUrl: 'https://sports.betmgm.com' },
  { id: 'betano', name: 'Betano', region: 'Americas', flag: '🇧🇷', codePrefix: 'btn-', websiteUrl: 'https://www.betano.com' },

  // Global
  { id: '1xbet', name: '1xBet', region: 'Global', flag: '🌐', codePrefix: '1x-', websiteUrl: 'https://1xbet.com' },
  { id: '22bet', name: '22Bet', region: 'Global', flag: '🌐', codePrefix: '22b-', websiteUrl: 'https://22bet.com' },
  { id: 'stake', name: 'Stake.com', region: 'Global', flag: '⚡', codePrefix: 'stk-', websiteUrl: 'https://stake.com' },
  { id: 'dafabet', name: 'Dafabet', region: 'Global', flag: '🌏', codePrefix: 'daf-', websiteUrl: 'https://www.dafabet.com' },
];

export function generateRegionalBookingCode(bookmakerId: string, selectionsCount: number = 3): string {
  const bookmaker = REGIONAL_BOOKMAKERS.find((b) => b.id === bookmakerId) || REGIONAL_BOOKMAKERS[0];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${bookmaker.codePrefix.toUpperCase()}${selectionsCount}X-${rand}`;
}
