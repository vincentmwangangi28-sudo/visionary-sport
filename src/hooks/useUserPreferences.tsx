import React, { createContext, useContext, useState, useEffect } from 'react';

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type OddsFormat = 'decimal' | 'fractional' | 'american';

export interface UserPreferences {
  riskProfile: RiskProfile;
  favoriteLeagues: string[];
  preferredMarkets: string[];
  oddsFormat: OddsFormat;
  defaultCurrency: 'KES' | 'USD' | 'EUR' | 'GBP' | 'NGN';
  dailyDigestEnabled: boolean;
  kickoffAlertsEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  riskProfile: 'balanced',
  favoriteLeagues: ['Premier League', 'Champions League', 'La Liga'],
  preferredMarkets: ['1X2', 'Over/Under 2.5', 'BTTS'],
  oddsFormat: 'decimal',
  defaultCurrency: 'KES',
  dailyDigestEnabled: true,
  kickoffAlertsEnabled: true,
};

const STORAGE_KEY = 'predictpro_user_preferences_v1';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  setRiskProfile: (profile: RiskProfile) => void;
  toggleFavoriteLeague: (league: string) => void;
  togglePreferredMarket: (market: string) => void;
  resetPreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        setRiskProfile,
        toggleFavoriteLeague,
        togglePreferredMarket,
        resetPreferences,
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
