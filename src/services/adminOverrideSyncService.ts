import type { Prediction } from '@/types/prediction';
import {
  DEFAULT_BOOKING_CODES,
  DEFAULT_JACKPOT_POOL,
  type CuratedBookingCode,
  type JackpotOverrideItem,
} from '@/components/admin/AdminJackpotAndCodesManagerTab';

export interface EditorialOverride {
  matchId: string;
  customPick?: string;
  customConfidence?: number;
  isMotd?: boolean;
  insiderNote?: string;
  updatedAt?: string;
}

export interface AffiliatePartnerConfig {
  bookmakerId: string;
  name: string;
  region: string;
  countryCodes: string[];
  affiliateUrl: string;
  promoCode: string;
  bonusOffer: string;
  cpaRateUsd: number;
  clicks: number;
  active: boolean;
}

export interface CommunitySharedSlip {
  id: string;
  author: string;
  authorWinRate: number;
  title: string;
  bookmaker: string;
  bookingCode: string;
  totalOdds: number;
  legsCount: number;
  legsSummary: string[];
  upvotes: number;
  createdAt: string;
}

export const ADMIN_SYNC_EVENT = 'predictpro-admin-sync';

export const DEFAULT_AFFILIATE_PARTNERS: AffiliatePartnerConfig[] = [
  {
    bookmakerId: 'sportybet',
    name: 'SportyBet',
    region: 'Nigeria / Kenya / Ghana / Tanzania / Uganda',
    countryCodes: ['NG', 'KE', 'GH', 'TZ', 'UG'],
    affiliateUrl: 'https://www.sportybet.com/?btag=predictpro_vip_2026',
    promoCode: 'PREDICTPRO',
    bonusOffer: '150% First Deposit Bonus + 15% Acca Boost',
    cpaRateUsd: 35,
    clicks: 1420,
    active: true,
  },
  {
    bookmakerId: '1xbet',
    name: '1xBet',
    region: 'Global / Africa / Europe / Asia',
    countryCodes: ['GLOBAL', 'KE', 'NG', 'ZA', 'GH', 'CM', 'SN'],
    affiliateUrl: 'https://1xbet.com/?tag=d_predictpro_2026',
    promoCode: 'PRO2026',
    bonusOffer: '200% Welcome Bonus up to $130 / KES 20,000',
    cpaRateUsd: 45,
    clicks: 1890,
    active: true,
  },
  {
    bookmakerId: 'betika',
    name: 'Betika',
    region: 'Kenya / Tanzania / Ghana / DRC',
    countryCodes: ['KE', 'TZ', 'GH', 'CD'],
    affiliateUrl: 'https://www.betika.com/?ref=predictpro_ke',
    promoCode: 'SABABISHA26',
    bonusOffer: 'KES 100M Grand Jackpot + Free Bet Deposit Match',
    cpaRateUsd: 28,
    clicks: 1185,
    active: true,
  },
  {
    bookmakerId: 'sportpesa',
    name: 'SportPesa',
    region: 'Kenya / Tanzania / South Africa',
    countryCodes: ['KE', 'TZ', 'ZA'],
    affiliateUrl: 'https://www.ke.sportpesa.com/?partner=predictpro',
    promoCode: 'MEGA17',
    bonusOffer: 'KES 384M+ 17-Game Mega Jackpot Entry & Multi-Bet Boost',
    cpaRateUsd: 32,
    clicks: 1340,
    active: true,
  },
  {
    bookmakerId: 'bet9ja',
    name: 'Bet9ja',
    region: 'Nigeria',
    countryCodes: ['NG'],
    affiliateUrl: 'https://sports.bet9ja.com/?promocode=PREDICTPRO9JA',
    promoCode: 'PREDICTPRO9JA',
    bonusOffer: '170% Multiple Boost + 1 Game Cut Cashback',
    cpaRateUsd: 38,
    clicks: 960,
    active: true,
  },
  {
    bookmakerId: 'betway',
    name: 'Betway',
    region: 'South Africa / Ghana / UK / Global',
    countryCodes: ['ZA', 'GH', 'GB', 'NG', 'ZM'],
    affiliateUrl: 'https://www.betway.co.za/?btag=predictpro_za',
    promoCode: 'PROWAY',
    bonusOffer: 'R1,000 Extra Bet Welcome Offer + Win Boost',
    cpaRateUsd: 42,
    clicks: 875,
    active: true,
  },
  {
    bookmakerId: 'mozzartbet',
    name: 'MozzartBet',
    region: 'Kenya / Nigeria / Ghana',
    countryCodes: ['KE', 'NG', 'GH'],
    affiliateUrl: 'https://www.mozzartbet.co.ke/?aff=predictpro',
    promoCode: 'SUPER200M',
    bonusOffer: 'KES 200M Super Grand Jackpot + Happy Monday Bonus',
    cpaRateUsd: 30,
    clicks: 610,
    active: true,
  },
];

export const DEFAULT_COMMUNITY_SLIPS: CommunitySharedSlip[] = [
  {
    id: 'comm-slip-1',
    author: 'Vincent M. (Lead Quant)',
    authorWinRate: 86,
    title: 'Weekend 2.14x High-Stability Poisson Double',
    bookmaker: 'SportyBet',
    bookingCode: 'BC8942X',
    totalOdds: 2.14,
    legsCount: 2,
    legsSummary: ['Arsenal vs Chelsea — Arsenal 1X & Over 1.5', 'Atalanta vs Fiorentina — Home Win (1)'],
    upvotes: 142,
    createdAt: '28 mins ago',
  },
  {
    id: 'comm-slip-2',
    author: 'NairobiSharp_xG',
    authorWinRate: 81,
    title: 'CAF & EPL 5.42x Value Accumulator',
    bookmaker: 'Bet9ja',
    bookingCode: 'B9J551092',
    totalOdds: 5.42,
    legsCount: 4,
    legsSummary: [
      'Gor Mahia vs AFC Leopards — Gor Mahia Win (1)',
      'Mamelodi Sundowns vs Orlando Pirates — Sundowns 1X',
      'Newcastle vs Tottenham — BTTS & Over 2.5 Goals',
      'Real Sociedad vs Villarreal — Over 1.5 Goals',
    ],
    upvotes: 98,
    createdAt: '1 hour ago',
  },
  {
    id: 'comm-slip-3',
    author: 'LagosStatistical',
    authorWinRate: 79,
    title: '1xBet 11.20x European xG Surge Parlay',
    bookmaker: '1xBet',
    bookingCode: 'PRD26X',
    totalOdds: 11.20,
    legsCount: 5,
    legsSummary: [
      'Arsenal vs Chelsea — Home Win (1)',
      'Brighton vs Aston Villa — BTTS Yes',
      'Eintracht Frankfurt vs Stuttgart — Over 2.5 Goals',
      'Sporting CP vs Braga — Home Win (1)',
      'Feyenoord vs AZ Alkmaar — Feyenoord 1X',
    ],
    upvotes: 76,
    createdAt: '2 hours ago',
  },
];

export function broadcastAdminSync(topic: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_SYNC_EVENT, { detail: { topic, timestamp: Date.now() } }));
  }
}

export function getAdminEditorialOverrides(): Record<string, EditorialOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('predictpro_admin_editorial_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function applyAdminEditorialOverridesToPredictions(predictions: Prediction[]): Prediction[] {
  const overrides = getAdminEditorialOverrides();
  const keys = Object.keys(overrides);
  if (keys.length === 0) return predictions;

  const updated = predictions.map((pred) => {
    const ov = overrides[pred.id] || overrides[pred.match_id || ''];
    if (!ov) return pred;

    const nextPick = ov.customPick || pred.prediction || pred.predicted_result;
    const nextConf = ov.customConfidence ?? pred.confidence ?? pred.confidence_score;
    const baseReasoning = pred.reasoning || pred.analysis || '';
    const nextReasoning = ov.insiderNote
      ? `[Admin Tactical Note: ${ov.insiderNote}] ${baseReasoning}`
      : baseReasoning;

    return {
      ...pred,
      prediction: nextPick,
      predicted_outcome: nextPick,
      predicted_result: nextPick,
      confidence: nextConf,
      confidence_score: nextConf,
      reasoning: nextReasoning,
      analysis: nextReasoning,
      is_motd: Boolean(ov.isMotd),
      insider_note: ov.insiderNote,
    } as Prediction & { is_motd?: boolean; insider_note?: string };
  });

  // Sort pinned Match of the Day (MOTD) to index 0 while preserving order of others
  return [...updated].sort((a, b) => {
    const aMotd = (a as Prediction & { is_motd?: boolean }).is_motd ? 1 : 0;
    const bMotd = (b as Prediction & { is_motd?: boolean }).is_motd ? 1 : 0;
    return bMotd - aMotd;
  });
}

export function getAdminBookingCodes(): CuratedBookingCode[] {
  if (typeof window === 'undefined') return DEFAULT_BOOKING_CODES;
  try {
    const raw = localStorage.getItem('predictpro_admin_booking_codes');
    return raw ? JSON.parse(raw) : DEFAULT_BOOKING_CODES;
  } catch {
    return DEFAULT_BOOKING_CODES;
  }
}

export const getVerifiedBookingCodes = getAdminBookingCodes;

export function getAdminJackpotOverrides(): JackpotOverrideItem[] {
  if (typeof window === 'undefined') return DEFAULT_JACKPOT_POOL;
  try {
    const raw = localStorage.getItem('predictpro_admin_jackpot_pool');
    return raw ? JSON.parse(raw) : DEFAULT_JACKPOT_POOL;
  } catch {
    return DEFAULT_JACKPOT_POOL;
  }
}

export function getJackpotAdminConfig(): {
  prizePoolLabel: string;
  bankerLocks: Record<string, string>;
} {
  const pool = getAdminJackpotOverrides();
  const bankerLocks: Record<string, string> = {};
  pool.forEach((item) => {
    if (item.isBankerLock) {
      bankerLocks[String(item.gameNo)] = item.singlePick;
    }
  });
  return {
    prizePoolLabel: 'KES 384,000,000 / $2.9M+',
    bankerLocks,
  };
}

export function getAffiliatePartners(): AffiliatePartnerConfig[] {
  if (typeof window === 'undefined') return DEFAULT_AFFILIATE_PARTNERS;
  try {
    const raw = localStorage.getItem('predictpro_admin_affiliate_partners');
    return raw ? JSON.parse(raw) : DEFAULT_AFFILIATE_PARTNERS;
  } catch {
    return DEFAULT_AFFILIATE_PARTNERS;
  }
}

export function getAffiliatePartnerLinks(): Array<
  AffiliatePartnerConfig & { bookmaker: string }
> {
  return getAffiliatePartners().map((p) => ({
    ...p,
    bookmaker: p.name,
  }));
}

export function saveAffiliatePartners(partners: AffiliatePartnerConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('predictpro_admin_affiliate_partners', JSON.stringify(partners));
    broadcastAdminSync('affiliate_partners');
  } catch {
    // ignore storage errors
  }
}

export function recordAffiliatePartnerClick(bookmakerId: string): AffiliatePartnerConfig | undefined {
  const list = getAffiliatePartners();
  const normalized = bookmakerId.toLowerCase().replace(/[^a-z0-9]/g, '');
  let matched: AffiliatePartnerConfig | undefined;

  const updated = list.map((item) => {
    if (
      item.bookmakerId.toLowerCase() === normalized ||
      item.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    ) {
      matched = { ...item, clicks: (item.clicks || 0) + 1 };
      return matched;
    }
    return item;
  });

  if (matched) {
    saveAffiliatePartners(updated);
  }
  return matched || list[0];
}

export function getCommunitySharedSlips(): CommunitySharedSlip[] {
  if (typeof window === 'undefined') return DEFAULT_COMMUNITY_SLIPS;
  try {
    const raw = localStorage.getItem('predictpro_community_shared_slips');
    return raw ? JSON.parse(raw) : DEFAULT_COMMUNITY_SLIPS;
  } catch {
    return DEFAULT_COMMUNITY_SLIPS;
  }
}

export function upvoteCommunitySlip(slipId: string): CommunitySharedSlip[] {
  const current = getCommunitySharedSlips();
  const next = current.map((s) => (s.id === slipId ? { ...s, upvotes: s.upvotes + 1 } : s));
  try {
    localStorage.setItem('predictpro_community_shared_slips', JSON.stringify(next));
    broadcastAdminSync('community_slips');
  } catch {
    // ignore
  }
  return next;
}

export function publishCommunitySlip(input: {
  author: string;
  title: string;
  bookmaker: string;
  bookingCode: string;
  totalOdds: number;
  legsCount: number;
  legsSummary: string[];
}): CommunitySharedSlip[] {
  const current = getCommunitySharedSlips();
  const created: CommunitySharedSlip = {
    id: `comm-slip-${Date.now()}`,
    author: input.author.trim() || 'Verified Community Analyst',
    authorWinRate: 80,
    title: input.title.trim() || `${input.bookmaker} ${input.totalOdds.toFixed(2)}x Accumulator`,
    bookmaker: input.bookmaker,
    bookingCode: input.bookingCode.trim().toUpperCase(),
    totalOdds: input.totalOdds,
    legsCount: input.legsCount,
    legsSummary: input.legsSummary,
    upvotes: 1,
    createdAt: 'Just now',
  };
  const next = [created, ...current];
  try {
    localStorage.setItem('predictpro_community_shared_slips', JSON.stringify(next));
    broadcastAdminSync('community_slips');
  } catch {
    // ignore
  }
  return next;
}
