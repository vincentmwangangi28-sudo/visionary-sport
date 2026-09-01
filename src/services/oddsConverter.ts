export type SupportedOddsFormat =
  | 'decimal'
  | 'fractional'
  | 'american'
  | 'hongkong'
  | 'indonesian'
  | 'malay';

export interface OddsFormatMetadata {
  id: SupportedOddsFormat;
  name: string;
  example: string;
  region: string;
}

export const ODDS_FORMATS: OddsFormatMetadata[] = [
  { id: 'decimal', name: 'Decimal (European / African)', example: '1.85', region: 'Europe, Africa, Australia' },
  { id: 'fractional', name: 'Fractional (UK & Ireland)', example: '17/20', region: 'United Kingdom, Ireland' },
  { id: 'american', name: 'American (Moneyline +/-)', example: '-118', region: 'United States, Canada' },
  { id: 'hongkong', name: 'Hong Kong (HK Odds)', example: '0.85', region: 'Hong Kong, East Asia' },
  { id: 'indonesian', name: 'Indonesian (Indo Odds)', example: '-1.18', region: 'Indonesia, SE Asia' },
  { id: 'malay', name: 'Malay (MY Odds)', example: '+0.85', region: 'Malaysia, Singapore' },
];

/**
 * Converts a decimal odds number into the target format string
 */
export function formatOddsValue(
  decimalOdds: number | undefined | null,
  format: SupportedOddsFormat = 'decimal'
): string {
  if (decimalOdds === undefined || decimalOdds === null || isNaN(decimalOdds) || decimalOdds <= 1.0) {
    return '--';
  }

  const dec = Math.max(1.01, decimalOdds);

  switch (format) {
    case 'fractional': {
      return decimalToFractional(dec);
    }
    case 'american': {
      if (dec >= 2.0) {
        const plus = Math.round((dec - 1) * 100);
        return `+${plus}`;
      } else {
        const minus = Math.round(-100 / (dec - 1));
        return `${minus}`;
      }
    }
    case 'hongkong': {
      const hk = dec - 1;
      return hk.toFixed(2);
    }
    case 'indonesian': {
      if (dec >= 2.0) {
        return `+${(dec - 1).toFixed(2)}`;
      } else {
        const indo = -1 / (dec - 1);
        return indo.toFixed(2);
      }
    }
    case 'malay': {
      if (dec <= 2.0) {
        return `+${(dec - 1).toFixed(2)}`;
      } else {
        const my = -1 / (dec - 1);
        return my.toFixed(2);
      }
    }
    case 'decimal':
    default:
      return dec.toFixed(2);
  }
}

/**
 * Finds closest clean fractional representation (e.g. 1.50 -> 1/2, 2.50 -> 6/4 or 3/2, 1.85 -> 17/20)
 */
function decimalToFractional(decimal: number): string {
  const net = decimal - 1;
  const tolerance = 0.015;

  // Common bookmaker fractional table
  const commonFractions: [number, string][] = [
    [0.10, '1/10'], [0.11, '1/9'], [0.125, '1/8'], [0.14, '1/7'], [0.166, '1/6'],
    [0.20, '1/5'], [0.22, '2/9'], [0.25, '1/4'], [0.285, '2/7'], [0.30, '3/10'],
    [0.333, '1/3'], [0.36, '4/11'], [0.40, '2/5'], [0.44, '4/9'], [0.50, '1/2'],
    [0.533, '8/15'], [0.57, '4/7'], [0.60, '3/5'], [0.666, '4/6'], [0.70, '7/10'],
    [0.727, '8/11'], [0.75, '3/4'], [0.80, '4/5'], [0.833, '5/6'], [0.85, '17/20'],
    [0.90, '9/10'], [0.91, '10/11'], [1.00, '1/1'], [1.05, '21/20'], [1.10, '11/10'],
    [1.15, '23/20'], [1.20, '6/5'], [1.25, '5/4'], [1.30, '13/10'], [1.333, '4/3'],
    [1.375, '11/8'], [1.40, '7/5'], [1.50, '6/4'], [1.60, '8/5'], [1.625, '13/8'],
    [1.666, '5/3'], [1.70, '17/10'], [1.75, '7/4'], [1.80, '9/5'], [1.875, '15/8'],
    [2.00, '2/1'], [2.10, '21/10'], [2.20, '11/5'], [2.25, '9/4'], [2.375, '19/8'],
    [2.50, '5/2'], [2.60, '13/5'], [2.75, '11/4'], [3.00, '3/1'], [3.25, '13/4'],
    [3.50, '7/2'], [3.75, '15/4'], [4.00, '4/1'], [4.50, '9/2'], [5.00, '5/1'],
    [5.50, '11/2'], [6.00, '6/1'], [6.50, '13/2'], [7.00, '7/1'], [8.00, '8/1'],
    [9.00, '9/1'], [10.00, '10/1'], [12.00, '12/1'], [15.00, '15/1'], [20.00, '20/1'],
    [25.00, '25/1'], [50.00, '50/1'], [100.00, '100/1'],
  ];

  for (const [val, frac] of commonFractions) {
    if (Math.abs(net - val) <= tolerance) {
      return frac;
    }
  }

  // Greatest common divisor fallback
  let num = Math.round(net * 100);
  let den = 100;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const div = gcd(num, den);
  num = Math.floor(num / div);
  den = Math.floor(den / div);

  return `${num}/${den}`;
}
