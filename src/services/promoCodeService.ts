import { supabase } from '@/integrations/supabase/client';

export interface PromoCode {
  id: string;
  code: string; // Auto uppercase (e.g., "VINCENT100")
  coinsReward: number; // e.g. 100 coins
  description: string;
  targetTier: 'all' | 'free' | 'vip';
  maxUses: number; // 0 means unlimited
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

const STORAGE_PROMOS_KEY = 'predictpro_promo_codes_v1';
const STORAGE_REDEMPTIONS_KEY = 'predictpro_promo_redemptions_v1';

export const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-vincent100',
    code: 'VINCENT100',
    coinsReward: 100,
    description: 'Administrator welcome bonus from Vincent Mwangangi.',
    targetTier: 'all',
    maxUses: 500,
    usedCount: 42,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Vincent Mwangangi',
  },
  {
    id: 'promo-banker50',
    code: 'BANKER50',
    coinsReward: 50,
    description: 'Weekend AI Banker prediction test voucher.',
    targetTier: 'all',
    maxUses: 1000,
    usedCount: 189,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Vincent Mwangangi',
  },
  {
    id: 'promo-vipreward',
    code: 'VIPBOOST',
    coinsReward: 250,
    description: 'Exclusive coin grant for VIP tier members.',
    targetTier: 'vip',
    maxUses: 200,
    usedCount: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Vincent Mwangangi',
  },
];

export function getPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return INITIAL_PROMO_CODES;
  try {
    const raw = localStorage.getItem(STORAGE_PROMOS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROMOS_KEY, JSON.stringify(INITIAL_PROMO_CODES));
      return INITIAL_PROMO_CODES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROMO_CODES;
  }
}

export function savePromoCodes(codes: PromoCode[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PROMOS_KEY, JSON.stringify(codes));
    window.dispatchEvent(new CustomEvent('promo-codes-updated', { detail: codes }));
  } catch {
    // Local storage safe error
  }
}

export function addPromoCode(code: Omit<PromoCode, 'id' | 'createdAt' | 'usedCount'>): PromoCode {
  const all = getPromoCodes();
  const newPromo: PromoCode = {
    ...code,
    id: `promo-${Date.now()}`,
    code: code.code.toUpperCase().trim(),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newPromo, ...all];
  savePromoCodes(updated);
  return newPromo;
}

export function togglePromoCodeActive(id: string): void {
  const all = getPromoCodes();
  const updated = all.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p);
  savePromoCodes(updated);
}

export function deletePromoCode(id: string): void {
  const all = getPromoCodes();
  const updated = all.filter((p) => p.id !== id);
  savePromoCodes(updated);
}

// User Redemptions tracking: [userId_promoCode]
function hasUserRedeemed(userId: string, code: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = `${userId.toLowerCase().trim()}_${code.toUpperCase().trim()}`;
    const raw = localStorage.getItem(STORAGE_REDEMPTIONS_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    return set.includes(key);
  } catch {
    return false;
  }
}

function markUserRedeemed(userId: string, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${userId.toLowerCase().trim()}_${code.toUpperCase().trim()}`;
    const raw = localStorage.getItem(STORAGE_REDEMPTIONS_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(key)) {
      set.push(key);
      localStorage.setItem(STORAGE_REDEMPTIONS_KEY, JSON.stringify(set));
    }
  } catch {
    // Safe error
  }
}

export interface RedeemResult {
  success: boolean;
  message: string;
  coinsAdded: number;
  promo?: PromoCode;
}

export async function redeemPromoCode(
  rawCode: string, 
  userId: string, 
  userTier: 'free' | 'pro' | 'vip' = 'free'
): Promise<RedeemResult> {
  const cleanCode = (rawCode || '').toUpperCase().trim();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid promo code.', coinsAdded: 0 };
  }

  const allPromos = getPromoCodes();
  const target = allPromos.find((p) => p.code === cleanCode);

  if (!target) {
    return { success: false, message: `Promo code "${cleanCode}" is invalid or does not exist.`, coinsAdded: 0 };
  }

  if (!target.isActive) {
    return { success: false, message: `Promo code "${cleanCode}" is no longer active.`, coinsAdded: 0 };
  }

  if (target.expiresAt) {
    const expiry = new Date(target.expiresAt).getTime();
    if (!isNaN(expiry) && Date.now() > expiry) {
      return { success: false, message: `Promo code "${cleanCode}" has expired.`, coinsAdded: 0 };
    }
  }

  if (target.maxUses > 0 && target.usedCount >= target.maxUses) {
    return { success: false, message: `Promo code "${cleanCode}" has reached its maximum redemption limit.`, coinsAdded: 0 };
  }

  if (target.targetTier === 'vip' && userTier !== 'vip') {
    return { success: false, message: `This promo code is exclusive to VIP members.`, coinsAdded: 0 };
  }

  if (hasUserRedeemed(userId, cleanCode)) {
    return { success: false, message: `You have already claimed promo code "${cleanCode}".`, coinsAdded: 0 };
  }

  // 1. Credit coins in Supabase profiles (non-blocking, skipped in test env)
  const isTest =
    (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST))) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');

  if (!isTest) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .maybeSingle();

      const currentCoins = profile?.coins ?? 50;
      const newTotal = currentCoins + target.coinsReward;

      await supabase
        .from('profiles')
        .update({ coins: newTotal })
        .eq('id', userId);
    } catch {
      // Non-blocking if offline
    }
  }

  // 2. Mark redemption and update promo count
  markUserRedeemed(userId, cleanCode);

  const updatedPromos = allPromos.map((p) => 
    p.id === target.id ? { ...p, usedCount: p.usedCount + 1 } : p
  );
  savePromoCodes(updatedPromos);

  // 3. Dispatch coins update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coins-updated', { detail: { coinsAdded: target.coinsReward } }));
  }

  return {
    success: true,
    message: `Success! Added +${target.coinsReward} coins to your account.`,
    coinsAdded: target.coinsReward,
    promo: target,
  };
}
