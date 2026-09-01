export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number; // 1 USD = X Currency Units
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
  regionId: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateToUSD: 1.0,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'north_america',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateToUSD: 0.92,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'europe',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rateToUSD: 0.79,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'uk',
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    flag: '🇰🇪',
    rateToUSD: 132.5,
    decimals: 0,
    symbolPosition: 'prefix',
    regionId: 'east_africa',
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    flag: '🇳🇬',
    rateToUSD: 1540.0,
    decimals: 0,
    symbolPosition: 'prefix',
    regionId: 'west_africa',
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flag: '🇿🇦',
    rateToUSD: 18.25,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'southern_africa',
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    flag: '🇬🇭',
    rateToUSD: 15.6,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'west_africa',
  },
  {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    flag: '🇺🇬',
    rateToUSD: 3720.0,
    decimals: 0,
    symbolPosition: 'prefix',
    regionId: 'east_africa',
  },
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    flag: '🇹🇿',
    rateToUSD: 2600.0,
    decimals: 0,
    symbolPosition: 'prefix',
    regionId: 'east_africa',
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    rateToUSD: 5.45,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'south_america',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    rateToUSD: 1.37,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'north_america',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    rateToUSD: 1.52,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'asia_pacific',
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    rateToUSD: 83.5,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'asia_pacific',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    flag: '🇦🇪',
    rateToUSD: 3.67,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'mena',
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    flag: '🇸🇦',
    rateToUSD: 3.75,
    decimals: 2,
    symbolPosition: 'prefix',
    regionId: 'mena',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateToUSD: 155.0,
    decimals: 0,
    symbolPosition: 'prefix',
    regionId: 'asia_pacific',
  },
];

export type SupportedCurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'KES'
  | 'NGN'
  | 'ZAR'
  | 'GHS'
  | 'UGX'
  | 'TZS'
  | 'BRL'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'AED'
  | 'SAR'
  | 'JPY';

/**
 * Get currency configuration by code
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || SUPPORTED_CURRENCIES[0]; // fallback to USD
}

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (fromCode.toUpperCase() === toCode.toUpperCase()) return amount;

  const fromConfig = getCurrencyConfig(fromCode);
  const toConfig = getCurrencyConfig(toCode);

  // Convert from source currency to USD, then from USD to target currency
  const inUSD = amount / fromConfig.rateToUSD;
  const inTarget = inUSD * toConfig.rateToUSD;

  return inTarget;
}

/**
 * Format a numeric amount in a specified currency
 */
export function formatCurrencyAmount(
  amount: number | string,
  currencyCode: string = 'USD',
  options: {
    compact?: boolean;
    includeCode?: boolean;
    customDecimals?: number;
  } = {}
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  const config = getCurrencyConfig(currencyCode);
  const decimals = options.customDecimals !== undefined ? options.customDecimals : config.decimals;

  let formattedNum: string;

  if (options.compact && Math.abs(num) >= 1000) {
    if (Math.abs(num) >= 1000000) {
      formattedNum = (num / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(num) >= 1000) {
      formattedNum = (num / 1000).toFixed(1) + 'K';
    } else {
      formattedNum = num.toFixed(decimals);
    }
  } else {
    formattedNum = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const symbol = config.symbol;
  let result = config.symbolPosition === 'prefix'
    ? `${symbol} ${formattedNum}`
    : `${formattedNum} ${symbol}`;

  if (options.includeCode) {
    result += ` (${config.code})`;
  }

  return result.trim();
}

/**
 * Infer optimal default currency from user region/timezone
 */
export function inferDefaultCurrency(regionId?: string, timezone?: string): SupportedCurrencyCode {
  if (regionId) {
    switch (regionId) {
      case 'east_africa':
        return 'KES';
      case 'west_africa':
        return 'NGN';
      case 'southern_africa':
        return 'ZAR';
      case 'uk':
        return 'GBP';
      case 'europe':
        return 'EUR';
      case 'south_america':
        return 'BRL';
      case 'north_america':
        return 'USD';
      case 'mena':
        return 'AED';
      case 'asia_pacific':
        return 'AUD';
      default:
        break;
    }
  }

  if (timezone) {
    const tz = timezone.toLowerCase();
    if (tz.includes('nairobi') || tz.includes('kampala') || tz.includes('dar_es_salaam')) return 'KES';
    if (tz.includes('lagos') || tz.includes('accra')) return 'NGN';
    if (tz.includes('johannesburg')) return 'ZAR';
    if (tz.includes('london')) return 'GBP';
    if (tz.includes('paris') || tz.includes('berlin') || tz.includes('madrid') || tz.includes('rome')) return 'EUR';
    if (tz.includes('sao_paulo')) return 'BRL';
    if (tz.includes('dubai') || tz.includes('riyadh')) return 'AED';
    if (tz.includes('kolkata')) return 'INR';
    if (tz.includes('tokyo')) return 'JPY';
  }

  return 'USD';
}

/**
 * Regional Responsible Gambling Helplines & Resources
 */
export interface ResponsibleGamblingResource {
  region: string;
  helpline: string;
  website: string;
  authority: string;
}

export function getResponsibleGamblingResource(currencyCode: string): ResponsibleGamblingResource {
  switch (currencyCode.toUpperCase()) {
    case 'KES':
    case 'UGX':
    case 'TZS':
      return {
        region: 'East Africa',
        helpline: 'Kenya Helpline: 0800 723 253 / BCLB Helpline',
        website: 'https://bclb.go.ke',
        authority: 'Betting Control and Licensing Board',
      };
    case 'NGN':
    case 'GHS':
      return {
        region: 'West Africa',
        helpline: 'National Gambling Helpline: 0800 111 2222',
        website: 'https://nlrc-gov.ng',
        authority: 'National Lottery Regulatory Commission',
      };
    case 'ZAR':
      return {
        region: 'South Africa',
        helpline: 'Toll-Free Counseling: 0800 006 008',
        website: 'https://responsiblegambling.org.za',
        authority: 'South African Responsible Gambling Foundation',
      };
    case 'GBP':
      return {
        region: 'United Kingdom',
        helpline: 'National Gambling Helpline (GamCare): 0808 8020 133',
        website: 'https://www.gamcare.org.uk',
        authority: 'UK Gambling Commission & GamCare',
      };
    case 'EUR':
      return {
        region: 'Europe',
        helpline: 'Gambling Therapy Worldwide Support',
        website: 'https://www.gamblingtherapy.org',
        authority: 'European Gaming and Betting Association (EGBA)',
      };
    case 'BRL':
      return {
        region: 'Brazil',
        helpline: 'Jogadores Anônimos do Brasil: (11) 3229-1905',
        website: 'https://jogadoresanonimos.com.br',
        authority: 'Secretaria de Prêmios e Apostas (SPA)',
      };
    case 'USD':
    case 'CAD':
    default:
      return {
        region: 'International & North America',
        helpline: 'National Problem Gambling Helpline: 1-800-522-4700',
        website: 'https://www.ncpgambling.org',
        authority: 'National Council on Problem Gambling',
      };
  }
}
