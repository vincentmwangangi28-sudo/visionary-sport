export interface SystemConfig {
  vipGateEnforced: boolean;
  geminiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3.8-flash';
  autoPublishPredictions: boolean;
  telegramAutoBroadcast: boolean;
  spinWheelMultiplier: 1 | 2 | 3;
  signupBonusCoins: number;
  minBankerConfidence: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowGuestPredictionsView: boolean;
  maxDailyFreePicks: number;
  updatedAt: string;
  updatedBy: string;
}

const STORAGE_KEY = 'predictpro_system_config_v1';
const CONFIG_CHANGE_EVENT = 'predictpro:system-config-updated';

const DEFAULT_CONFIG: SystemConfig = {
  vipGateEnforced: true,
  geminiModel: 'gemini-2.5-flash',
  autoPublishPredictions: true,
  telegramAutoBroadcast: true,
  spinWheelMultiplier: 1,
  signupBonusCoins: 50,
  minBankerConfidence: 85,
  maintenanceMode: false,
  maintenanceMessage: 'PredictPro is undergoing scheduled database maintenance. Predictions will resume momentarily.',
  allowGuestPredictionsView: true,
  maxDailyFreePicks: 5,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Vincent Mwangangi (Root Admin)',
};

export function getSystemConfig(): SystemConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSystemConfig(updates: Partial<SystemConfig>, updatedBy = 'Vincent Mwangangi'): SystemConfig {
  const current = getSystemConfig();
  const next: SystemConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT, { detail: next }));
    } catch {
      // safe fallback
    }
  }

  return next;
}

export function resetSystemConfig(): SystemConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT, { detail: DEFAULT_CONFIG }));
    } catch {
      // safe fallback
    }
  }
  return DEFAULT_CONFIG;
}

export function subscribeSystemConfig(callback: (config: SystemConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<SystemConfig>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getSystemConfig());
    }
  };

  window.addEventListener(CONFIG_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
