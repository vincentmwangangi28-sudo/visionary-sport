import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TRANSLATIONS, SUPPORTED_LANGUAGES } from '@/services/i18n';
import { SupportedOddsFormat, formatOddsValue } from '@/services/oddsConverter';
import { formatKickoffDateTime, getDeviceTimezone, getRelativeKickoffLabel } from '@/services/timezoneService';
import {
  detectNavigatorLanguage,
  detectDateFormat,
  detectTimeFormat,
  DetectedDateFormat,
  DetectedTimeFormat,
} from '@/services/localeDetectionService';

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type OddsFormat = SupportedOddsFormat;

export interface UserPreferences {
  riskProfile: RiskProfile;
  favoriteLeagues: string[];
  preferredMarkets: string[];
  oddsFormat: OddsFormat;
  language: SupportedLanguage;
  timezone: string; // 'auto' or IANA identifier like 'Africa/Nairobi'
  dateFormat: 'auto' | DetectedDateFormat;
  timeFormat: 'auto' | DetectedTimeFormat;
  dataSaverMode: boolean;
  defaultBookmaker: string;
  defaultCurrency: 'KES' | 'USD' | 'EUR' | 'GBP' | 'NGN';
  dailyDigestEnabled: boolean;
  kickoffAlertsEnabled: boolean;
}

const getDefaultPreferencesWithAutoLocale = (): UserPreferences => {
  const detectedLang = detectNavigatorLanguage();
  const detectedDate = detectDateFormat(detectedLang.rawLocale);
  const detectedTime = detectTimeFormat(detectedLang.rawLocale);

  return {
    riskProfile: 'balanced',
    favoriteLeagues: ['Premier League', 'Champions League', 'La Liga', 'KPL'],
    preferredMarkets: ['1X2', 'Over/Under 2.5', 'BTTS'],
    oddsFormat: 'decimal',
    language: detectedLang.isSupported ? detectedLang.supportedLanguage : 'en',
    timezone: 'auto',
    dateFormat: detectedDate.format,
    timeFormat: detectedTime.format,
    dataSaverMode: false,
    defaultBookmaker: 'sportybet',
    defaultCurrency: 'KES',
    dailyDigestEnabled: true,
    kickoffAlertsEnabled: true,
  };
};

const DEFAULT_PREFERENCES: UserPreferences = getDefaultPreferencesWithAutoLocale();

const STORAGE_KEY = 'predictpro_user_preferences_v2';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  setRiskProfile: (profile: RiskProfile) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setTimezone: (tz: string) => void;
  setOddsFormat: (format: OddsFormat) => void;
  setDateFormat: (format: 'auto' | DetectedDateFormat) => void;
  setTimeFormat: (format: 'auto' | DetectedTimeFormat) => void;
  toggleDataSaver: () => void;
  setDataSaver: (enabled: boolean) => void;
  toggleFavoriteLeague: (league: string) => void;
  togglePreferredMarket: (market: string) => void;
  resetPreferences: () => void;
  formatOdds: (decimalOdds: number | undefined | null) => string;
  formatKickoff: (
    dateInput: string | Date | number,
    options?: {
      includeDate?: boolean;
      includeWeekday?: boolean;
      includeTimezone?: boolean;
      locale?: string;
      dateFormat?: 'auto' | DetectedDateFormat;
      timeFormat?: 'auto' | DetectedTimeFormat;
    }
  ) => string;
  getKickoffRelative: (dateInput: string | Date | number) => { label: string; status: 'live' | 'upcoming' | 'finished' | 'today'; urgency: 'high' | 'medium' | 'low' };
  t: (key: string, defaultText?: string) => string;
  currentLanguageMeta: typeof SUPPORTED_LANGUAGES[0];
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('predictpro_user_preferences_v1');
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load user preferences from localStorage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      
      // Update HTML direction for RTL languages like Arabic
      const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === preferences.language);
      if (langMeta) {
        document.documentElement.dir = langMeta.direction;
        document.documentElement.lang = langMeta.code;
      }
    } catch (e) {
      console.warn('Failed to save user preferences:', e);
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const setRiskProfile = (profile: RiskProfile) => {
    updatePreferences({ riskProfile: profile });
  };

  const setLanguage = (lang: SupportedLanguage) => {
    updatePreferences({ language: lang });
  };

  const setTimezone = (tz: string) => {
    updatePreferences({ timezone: tz });
  };

  const setOddsFormat = (format: OddsFormat) => {
    updatePreferences({ oddsFormat: format });
  };

  const toggleDataSaver = () => {
    updatePreferences({ dataSaverMode: !preferences.dataSaverMode });
  };

  const setDataSaver = (enabled: boolean) => {
    updatePreferences({ dataSaverMode: enabled });
  };

  const setDateFormat = (format: 'auto' | DetectedDateFormat) => {
    updatePreferences({ dateFormat: format });
  };

  const setTimeFormat = (format: 'auto' | DetectedTimeFormat) => {
    updatePreferences({ timeFormat: format });
  };

  const toggleFavoriteLeague = (league: string) => {
    setPreferences((prev) => {
      const exists = prev.favoriteLeagues.includes(league);
      const next = exists
        ? prev.favoriteLeagues.filter((l) => l !== league)
        : [...prev.favoriteLeagues, league];
      return { ...prev, favoriteLeagues: next };
    });
  };

  const togglePreferredMarket = (market: string) => {
    setPreferences((prev) => {
      const exists = prev.preferredMarkets.includes(market);
      const next = exists
        ? prev.preferredMarkets.filter((m) => m !== market)
        : [...prev.preferredMarkets, market];
      return { ...prev, preferredMarkets: next };
    });
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const formatOdds = (decimalOdds: number | undefined | null): string => {
    return formatOddsValue(decimalOdds, preferences.oddsFormat);
  };

  const formatKickoff = (
    dateInput: string | Date | number,
    options?: {
      includeDate?: boolean;
      includeWeekday?: boolean;
      includeTimezone?: boolean;
      locale?: string;
      dateFormat?: 'auto' | DetectedDateFormat;
      timeFormat?: 'auto' | DetectedTimeFormat;
    }
  ): string => {
    return formatKickoffDateTime(dateInput, preferences.timezone, {
      locale: options?.locale || preferences.language,
      dateFormat: options?.dateFormat || preferences.dateFormat,
      timeFormat: options?.timeFormat || preferences.timeFormat,
      ...options,
    });
  };

  const getKickoffRelative = (dateInput: string | Date | number) => {
    return getRelativeKickoffLabel(dateInput);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[preferences.language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || defaultText || key;
  };

  const currentLanguageMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === preferences.language) || SUPPORTED_LANGUAGES[0];

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        setRiskProfile,
        setLanguage,
        setTimezone,
        setOddsFormat,
        setDateFormat,
        setTimeFormat,
        toggleDataSaver,
        setDataSaver,
        toggleFavoriteLeague,
        togglePreferredMarket,
        resetPreferences,
        formatOdds,
        formatKickoff,
        getKickoffRelative,
        t,
        currentLanguageMeta,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

