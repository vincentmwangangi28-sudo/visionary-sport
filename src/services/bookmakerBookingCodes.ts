export interface RegionalBookmaker {
  id: string;
  name: string;
  region: 'Africa' | 'UK & Europe' | 'Americas' | 'Global';
  flag: string;
  codePrefix: string;
  websiteUrl: string;
  countryCodes?: string[];
  deepLinkPattern?: string;
}

export const REGIONAL_BOOKMAKERS: RegionalBookmaker[] = [
  // Africa
  { id: 'sportpesa', name: 'SportPesa', region: 'Africa', flag: '🇰🇪', codePrefix: 'sp-', countryCodes: ['ke', 'ea', 'tz'], websiteUrl: 'https://www.sportpesa.co.ke' },
  { id: 'betika', name: 'Betika', region: 'Africa', flag: '🇰🇪', codePrefix: 'btk-', countryCodes: ['ke', 'ea'], websiteUrl: 'https://www.betika.com' },
  { id: 'sportybet', name: 'SportyBet', region: 'Africa', flag: '🌍', codePrefix: 'sb-', countryCodes: ['ke', 'ng', 'gh'], websiteUrl: 'https://www.sportybet.com' },
  { id: 'bet9ja', name: 'Bet9ja', region: 'Africa', flag: '🇳🇬', codePrefix: 'b9j-', countryCodes: ['ng', 'wa'], websiteUrl: 'https://www.bet9ja.com' },
  { id: 'mozzart', name: 'MozzartBet', region: 'Africa', flag: '🌍', codePrefix: 'mzt-', countryCodes: ['ke', 'ea'], websiteUrl: 'https://www.mozzartbet.co.ke' },
  { id: 'odibets', name: 'OdiBets', region: 'Africa', flag: '🇰🇪', codePrefix: 'odi-', countryCodes: ['ke', 'ea'], websiteUrl: 'https://www.odibets.com' },
  { id: 'hollywoodbets', name: 'Hollywoodbets', region: 'Africa', flag: '🇿🇦', codePrefix: 'hwb-', countryCodes: ['za'], websiteUrl: 'https://www.hollywoodbets.net' },
  { id: 'betway', name: 'Betway', region: 'Africa', flag: '🌍', codePrefix: 'bw-', countryCodes: ['ke', 'ng', 'za', 'gh', 'uk'], websiteUrl: 'https://www.betway.co.ke' },

  // UK & Europe
  { id: 'bet365', name: 'Bet365', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'b365-', countryCodes: ['uk', 'eu', 'global'], websiteUrl: 'https://www.bet365.com' },
  { id: 'skybet', name: 'SkyBet', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'sky-', countryCodes: ['uk'], websiteUrl: 'https://www.skybet.com' },
  { id: 'unibet', name: 'Unibet', region: 'UK & Europe', flag: '🇪🇺', codePrefix: 'uni-', countryCodes: ['eu', 'uk'], websiteUrl: 'https://www.unibet.com' },
  { id: 'betfair', name: 'Betfair', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'bf-', countryCodes: ['uk', 'eu'], websiteUrl: 'https://www.betfair.com' },
  { id: 'williamhill', name: 'William Hill', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'wh-', countryCodes: ['uk'], websiteUrl: 'https://www.williamhill.com' },

  // Americas
  { id: 'draftkings', name: 'DraftKings', region: 'Americas', flag: '🇺🇸', codePrefix: 'dk-', countryCodes: ['us'], websiteUrl: 'https://sportsbook.draftkings.com' },
  { id: 'fanduel', name: 'FanDuel', region: 'Americas', flag: '🇺🇸', codePrefix: 'fd-', countryCodes: ['us'], websiteUrl: 'https://sportsbook.fanduel.com' },
  { id: 'betmgm', name: 'BetMGM', region: 'Americas', flag: '🇺🇸', codePrefix: 'mgm-', countryCodes: ['us'], websiteUrl: 'https://sports.betmgm.com' },
  { id: 'betano', name: 'Betano', region: 'Americas', flag: '🇧🇷', codePrefix: 'btn-', countryCodes: ['br'], websiteUrl: 'https://www.betano.com' },

  // Global & Pro
  { id: 'pinnacle', name: 'Pinnacle', region: 'Global', flag: '⚡', codePrefix: 'pin-', countryCodes: ['global', 'uk', 'eu'], websiteUrl: 'https://www.pinnacle.com' },
  { id: '1xbet', name: '1xBet', region: 'Global', flag: '🌐', codePrefix: '1x-', countryCodes: ['global', 'ke', 'ng', 'ea', 'br'], websiteUrl: 'https://1xbet.com' },
  { id: '22bet', name: '22Bet', region: 'Global', flag: '🌐', codePrefix: '22b-', countryCodes: ['global', 'ea'], websiteUrl: 'https://22bet.com' },
  { id: 'stake', name: 'Stake.com', region: 'Global', flag: '⚡', codePrefix: 'stk-', countryCodes: ['global'], websiteUrl: 'https://stake.com' },
  { id: 'dafabet', name: 'Dafabet', region: 'Global', flag: '🌏', codePrefix: 'daf-', countryCodes: ['global', 'ke'], websiteUrl: 'https://www.dafabet.com' },
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
