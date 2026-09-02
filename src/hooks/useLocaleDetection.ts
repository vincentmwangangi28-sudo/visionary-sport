import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  detectFullLocaleProfile,
  formatLocalizedDate,
  formatLocalizedTime,
  LocaleProfile,
  DetectedDateFormat,
  DetectedTimeFormat,
} from '@/services/localeDetectionService';
import { SupportedLanguage } from '@/services/i18n';

const FIRST_LOAD_STORAGE_KEY = 'predictpro_locale_auto_adjusted_v1';

export interface UseLocaleDetectionReturn {
  // Detected properties
  profile: LocaleProfile;
  detectedLanguage: SupportedLanguage;
  rawLocale: string;
  isLanguageSupported: boolean;
  isRTL: boolean;
  detectedTimezone: string;
  detectedTimezoneOffset: string;
  detectedDateFormat: DetectedDateFormat;
  detectedTimeFormat: DetectedTimeFormat;

  // Lifecycle & status flags
  isFirstLoad: boolean;
  hasAutoAdjusted: boolean;

  // Active user selections from preferences
  activeLanguage: SupportedLanguage;
  activeTimezone: string;
  activeDateFormat: DetectedDateFormat;
  activeTimeFormat: DetectedTimeFormat;

  // Actions
  applyDetectedSettings: () => void;
  redetect: () => LocaleProfile;

  // Formatting helpers
  formatDate: (
    dateInput: string | Date | number,
    formatOverride?: DetectedDateFormat
  ) => string;
  formatTime: (
    dateInput: string | Date | number,
    formatOverride?: DetectedTimeFormat
  ) => string;
  formatDateTime: (
    dateInput: string | Date | number,
    options?: { dateFormat?: DetectedDateFormat; timeFormat?: DetectedTimeFormat }
  ) => string;
}

/**
 * Hook that detects the user's navigator language, timezone, and system date/time formatting,
 * and automatically adjusts app language and date formatting preferences on first load.
 */
export function useLocaleDetection(): UseLocaleDetectionReturn {
  const { preferences, updatePreferences, setLanguage, setTimezone } = useUserPreferences();

  // Current detected profile from browser / system
  const [profile, setProfile] = useState<LocaleProfile>(() => detectFullLocaleProfile());
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(false);
  const [hasAutoAdjusted, setHasAutoAdjusted] = useState<boolean>(false);

  // Redetect fresh from navigator
  const redetect = useCallback((): LocaleProfile => {
    const freshProfile = detectFullLocaleProfile();
    setProfile(freshProfile);
    return freshProfile;
  }, []);

  // First-load auto detection and adjustment
  useEffect(() => {
    try {
      const alreadyAdjusted = localStorage.getItem(FIRST_LOAD_STORAGE_KEY);

      if (!alreadyAdjusted) {
        setIsFirstLoad(true);
        const freshProfile = detectFullLocaleProfile();
        setProfile(freshProfile);

        // Adjust language if supported
        const updates: Record<string, any> = {};

        if (freshProfile.isLanguageSupported && freshProfile.supportedLanguage !== preferences.language) {
          updates.language = freshProfile.supportedLanguage;
        }

        // Adjust timezone if default or auto
        if (preferences.timezone === 'auto' || !preferences.timezone) {
          updates.timezone = 'auto'; // 'auto' engine resolves to freshProfile.timezone
        }

        // Adjust date and time formats
        if (!preferences.dateFormat || preferences.dateFormat === 'auto') {
          updates.dateFormat = freshProfile.dateFormat;
        }

        if (!preferences.timeFormat || preferences.timeFormat === 'auto') {
          updates.timeFormat = freshProfile.timeFormat;
        }

        if (Object.keys(updates).length > 0) {
          updatePreferences(updates);
        }

        // Mark as auto-adjusted
        localStorage.setItem(
          FIRST_LOAD_STORAGE_KEY,
          JSON.stringify({
            adjustedAt: new Date().toISOString(),
            language: freshProfile.supportedLanguage,
            timezone: freshProfile.timezone,
            dateFormat: freshProfile.dateFormat,
            timeFormat: freshProfile.timeFormat,
            rawLocale: freshProfile.rawLocale,
          })
        );

        setHasAutoAdjusted(true);
      } else {
        setHasAutoAdjusted(true);
      }
    } catch (e) {
      console.warn('Auto-adjusting locale failed on first load:', e);
    }
  }, [
    preferences.dateFormat,
    preferences.language,
    preferences.timeFormat,
    preferences.timezone,
    updatePreferences,
  ]);

  // Force apply detected system settings into user preferences
  const applyDetectedSettings = useCallback(() => {
    const freshProfile = detectFullLocaleProfile();
    setProfile(freshProfile);

    setLanguage(freshProfile.supportedLanguage);
    setTimezone('auto');
    updatePreferences({
      dateFormat: freshProfile.dateFormat,
      timeFormat: freshProfile.timeFormat,
    });

    localStorage.setItem(
      FIRST_LOAD_STORAGE_KEY,
      JSON.stringify({
        adjustedAt: new Date().toISOString(),
        manualOverride: true,
        language: freshProfile.supportedLanguage,
        timezone: freshProfile.timezone,
        dateFormat: freshProfile.dateFormat,
        timeFormat: freshProfile.timeFormat,
        rawLocale: freshProfile.rawLocale,
      })
    );

    setHasAutoAdjusted(true);
  }, [setLanguage, setTimezone, updatePreferences]);

  // Active formats (respecting preferences or falling back to detected)
  const activeLanguage = preferences.language || profile.supportedLanguage;
  const activeTimezone = preferences.timezone || 'auto';
  const activeDateFormat: DetectedDateFormat =
    preferences.dateFormat && preferences.dateFormat !== 'auto'
      ? (preferences.dateFormat as DetectedDateFormat)
      : profile.dateFormat;
  const activeTimeFormat: DetectedTimeFormat =
    preferences.timeFormat && preferences.timeFormat !== 'auto'
      ? (preferences.timeFormat as DetectedTimeFormat)
      : profile.timeFormat;

  // Format date helper
  const formatDate = useCallback(
    (dateInput: string | Date | number, formatOverride?: DetectedDateFormat): string => {
      const fmt = formatOverride || activeDateFormat;
      return formatLocalizedDate(dateInput, fmt, activeTimezone, profile.rawLocale);
    },
    [activeDateFormat, activeTimezone, profile.rawLocale]
  );

  // Format time helper
  const formatTime = useCallback(
    (dateInput: string | Date | number, formatOverride?: DetectedTimeFormat): string => {
      const fmt = formatOverride || activeTimeFormat;
      return formatLocalizedTime(dateInput, fmt, activeTimezone, profile.rawLocale);
    },
    [activeTimeFormat, activeTimezone, profile.rawLocale]
  );

  // Format date & time combined
  const formatDateTime = useCallback(
    (
      dateInput: string | Date | number,
      options?: { dateFormat?: DetectedDateFormat; timeFormat?: DetectedTimeFormat }
    ): string => {
      const datePart = formatDate(dateInput, options?.dateFormat);
      const timePart = formatTime(dateInput, options?.timeFormat);
      return `${datePart} · ${timePart}`;
    },
    [formatDate, formatTime]
  );

  return useMemo(
    () => ({
      profile,
      detectedLanguage: profile.supportedLanguage,
      rawLocale: profile.rawLocale,
      isLanguageSupported: profile.isLanguageSupported,
      isRTL: profile.isRTL,
      detectedTimezone: profile.timezone,
      detectedTimezoneOffset: profile.timezoneOffset,
      detectedDateFormat: profile.dateFormat,
      detectedTimeFormat: profile.timeFormat,

      isFirstLoad,
      hasAutoAdjusted,

      activeLanguage,
      activeTimezone,
      activeDateFormat,
      activeTimeFormat,

      applyDetectedSettings,
      redetect,

      formatDate,
      formatTime,
      formatDateTime,
    }),
    [
      profile,
      isFirstLoad,
      hasAutoAdjusted,
      activeLanguage,
      activeTimezone,
      activeDateFormat,
      activeTimeFormat,
      applyDetectedSettings,
      redetect,
      formatDate,
      formatTime,
      formatDateTime,
    ]
  );
}
