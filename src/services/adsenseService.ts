/**
 * Google AdSense Configuration & Validation Service
 * PredictPro Production Ad Engine
 */

export interface AdSenseConfig {
  publisherId: string;
  enabled: boolean;
  testMode: boolean;
  slots: {
    horizontal: string;
    rectangle: string;
    feed: string;
    sticky: string;
  };
}

const STORAGE_KEY = 'predictpro_adsense_config_v1';
const ADSENSE_CHANGE_EVENT = 'predictpro:adsense-config-changed';

export const DEFAULT_ADSENSE_PUB_ID = 'ca-pub-1375386376692976';

export const DEFAULT_ADSENSE_CONFIG: AdSenseConfig = {
  publisherId: DEFAULT_ADSENSE_PUB_ID,
  enabled: true,
  testMode: false,
  slots: {
    horizontal: '9842105432', // Default responsive horizontal banner slot
    rectangle: '8743209123',  // In-content / sidebar medium rectangle
    feed: '6543210987',       // In-feed responsive card
    sticky: '5432109876',     // Sticky bottom / anchor banner
  },
};

export function getAdSenseConfig(): AdSenseConfig {
  if (typeof window === 'undefined') return DEFAULT_ADSENSE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ADSENSE_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADSENSE_CONFIG,
      ...parsed,
      slots: { ...DEFAULT_ADSENSE_CONFIG.slots, ...(parsed.slots || {}) },
    };
  } catch {
    return DEFAULT_ADSENSE_CONFIG;
  }
}

export function saveAdSenseConfig(updates: Partial<AdSenseConfig>): AdSenseConfig {
  const current = getAdSenseConfig();
  const next: AdSenseConfig = {
    ...current,
    ...updates,
    slots: {
      ...current.slots,
      ...(updates.slots || {}),
    },
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(ADSENSE_CHANGE_EVENT, { detail: next }));
    } catch {
      // ignore
    }
  }

  return next;
}

export function subscribeAdSenseConfig(callback: (config: AdSenseConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<AdSenseConfig>;
    callback(custom.detail || getAdSenseConfig());
  };

  window.addEventListener(ADSENSE_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(ADSENSE_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Validates Google ads.txt crawler compliance and format.
 */
export async function verifyAdsTxtStatus(): Promise<{
  valid: boolean;
  status: number;
  expectedPubId: string;
  foundEntry?: string;
  error?: string;
}> {
  const config = getAdSenseConfig();
  const cleanPubId = config.publisherId.replace(/^ca-/, '');
  try {
    const res = await fetch('/ads.txt', { cache: 'no-store' });
    if (!res.ok) {
      return {
        valid: false,
        status: res.status,
        expectedPubId: cleanPubId,
        error: `HTTP ${res.status}: ads.txt could not be fetched.`,
      };
    }

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    
    // Check if google.com entry exists with pub ID
    const matchingLine = lines.find(l => {
      const lower = l.toLowerCase();
      return lower.includes('google.com') && lower.includes(cleanPubId.toLowerCase());
    });

    if (matchingLine) {
      return {
        valid: true,
        status: 200,
        expectedPubId: cleanPubId,
        foundEntry: matchingLine,
      };
    }

    return {
      valid: false,
      status: 200,
      expectedPubId: cleanPubId,
      error: `ads.txt loaded, but did not match publisher ID "${cleanPubId}". Current contents:\n${text}`,
    };
  } catch (err: any) {
    return {
      valid: false,
      status: 0,
      expectedPubId: cleanPubId,
      error: err?.message || 'Network error fetching /ads.txt',
    };
  }
}
