import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/services/i18n';
import { getDeviceTimezone } from '@/services/timezoneService';

export type DetectedDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type DetectedTimeFormat = '12h' | '24h';

export interface LocaleProfile {
  rawLocale: string;
  primaryLanguage: string;
  supportedLanguage: SupportedLanguage;
  isLanguageSupported: boolean;
  isRTL: boolean;
  timezone: string;
  timezoneOffset: string;
  dateFormat: DetectedDateFormat;
  timeFormat: DetectedTimeFormat;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  sampleFormattedDate: string;
  sampleFormattedTime: string;
}

const SUPPORTED_CODES: SupportedLanguage[] = ['en', 'sw', 'fr', 'es', 'pt', 'ar'];

/**
 * Detect the user's primary language from navigator.languages and navigator.language
 */
export function detectNavigatorLanguage(): {
  supportedLanguage: SupportedLanguage;
  rawLocale: string;
  primaryLanguage: string;
  isSupported: boolean;
  isRTL: boolean;
} {
  try {
    const rawLocales = (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0)
      ? navigator.languages
      : [typeof navigator !== 'undefined' ? navigator.language : 'en'];

    const primaryRaw = rawLocales[0] || 'en';
    const primaryNormalized = primaryRaw.toLowerCase();

    // Check each preferred language in order
    for (const loc of rawLocales) {
      if (!loc) continue;
      const lower = loc.toLowerCase();
      const code = lower.split('-')[0].split('_')[0];

      if (code === 'sw') return { supportedLanguage: 'sw', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: false };
      if (code === 'fr') return { supportedLanguage: 'fr', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: false };
      if (code === 'es') return { supportedLanguage: 'es', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: false };
      if (code === 'pt') return { supportedLanguage: 'pt', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: false };
      if (code === 'ar') return { supportedLanguage: 'ar', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: true };
      if (code === 'en') return { supportedLanguage: 'en', rawLocale: primaryRaw, primaryLanguage: code, isSupported: true, isRTL: false };
    }

    // Default fallback
    const fallbackCode = primaryNormalized.split('-')[0].split('_')[0];
    const isRTL = fallbackCode === 'ar' || fallbackCode === 'fa' || fallbackCode === 'he' || fallbackCode === 'ur';

    return {
      supportedLanguage: 'en',
      rawLocale: primaryRaw,
      primaryLanguage: fallbackCode || 'en',
      isSupported: false,
      isRTL,
    };
  } catch {
    return {
      supportedLanguage: 'en',
      rawLocale: 'en-US',
      primaryLanguage: 'en',
      isSupported: true,
      isRTL: false,
    };
  }
}

/**
 * Detect the system timezone and UTC offset
 */
export function detectSystemTimezone(): {
  timezone: string;
  offset: string;
  label: string;
} {
  const iana = getDeviceTimezone();
  let offset = 'UTC+0';

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (offsetPart && offsetPart.value) {
      offset = offsetPart.value.replace('GMT', 'UTC');
    }
  } catch {
    const mins = -new Date().getTimezoneOffset();
    const sign = mins >= 0 ? '+' : '-';
    const hrs = Math.floor(Math.abs(mins) / 60);
    const remMins = Math.abs(mins) % 60;
    offset = `UTC${sign}${hrs}${remMins ? `:${remMins < 10 ? '0' : ''}${remMins}` : ''}`;
  }

  return {
    timezone: iana,
    offset,
    label: `${iana.split('/').pop()?.replace('_', ' ') || iana} (${offset})`,
  };
}

/**
 * Detect standard date ordering (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD)
 */
export function detectDateFormat(rawLocale?: string): {
  format: DetectedDateFormat;
  sampleFormatted: string;
} {
  try {
    const loc = rawLocale || (typeof navigator !== 'undefined' ? navigator.language : 'en-GB');
    // Test date: December 23, 2026 (Month 12, Day 23, Year 2026)
    const testDate = new Date(2026, 11, 23);
    const formatter = new Intl.DateTimeFormat(loc, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const parts = formatter.formatToParts(testDate);
    const firstPart = parts.find((p) => p.type === 'day' || p.type === 'month' || p.type === 'year');

    let format: DetectedDateFormat = 'DD/MM/YYYY';
    if (firstPart?.type === 'month') {
      format = 'MM/DD/YYYY';
    } else if (firstPart?.type === 'year') {
      format = 'YYYY-MM-DD';
    } else {
      format = 'DD/MM/YYYY';
    }

    const sampleFormatted = formatter.format(testDate);
    return { format, sampleFormatted };
  } catch {
    return { format: 'DD/MM/YYYY', sampleFormatted: '23/12/2026' };
  }
}

/**
 * Detect 12h vs 24h preference from system/browser locale
 */
export function detectTimeFormat(rawLocale?: string): {
  format: DetectedTimeFormat;
  sampleFormatted: string;
} {
  try {
    const loc = rawLocale || (typeof navigator !== 'undefined' ? navigator.language : 'en-GB');
    const testDate = new Date(2026, 11, 23, 15, 30, 0); // 3:30 PM / 15:30
    
    // Check hourCycle in resolvedOptions if available
    const resolved = Intl.DateTimeFormat(loc).resolvedOptions();
    if (resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12') {
      return { format: '12h', sampleFormatted: '3:30 PM' };
    }
    if (resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24') {
      return { format: '24h', sampleFormatted: '15:30' };
    }

    // Fallback: format hour
    const formatter = new Intl.DateTimeFormat(loc, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const formatted = formatter.format(testDate);
    const is12 = /AM|PM|am|pm/i.test(formatted) || formatted.startsWith('3:');

    return {
      format: is12 ? '12h' : '24h',
      sampleFormatted: formatted,
    };
  } catch {
    return { format: '24h', sampleFormatted: '15:30' };
  }
}

/**
 * Detect first day of week (0 = Sunday, 1 = Monday)
 */
export function detectFirstDayOfWeek(rawLocale?: string): number {
  try {
    const loc = rawLocale || (typeof navigator !== 'undefined' ? navigator.language : 'en-GB');
    // US, Canada, Latin America, Japan, etc. start on Sunday
    const lower = loc.toLowerCase();
    if (lower.includes('us') || lower.includes('ca') || lower.includes('jp') || lower.includes('mx') || lower.includes('br')) {
      return 0;
    }
    return 1; // Default to Monday for most of Europe, Africa, international standard ISO 8601
  } catch {
    return 1;
  }
}

/**
 * Get comprehensive locale profile
 */
export function detectFullLocaleProfile(): LocaleProfile {
  const lang = detectNavigatorLanguage();
  const tz = detectSystemTimezone();
  const dateFmt = detectDateFormat(lang.rawLocale);
  const timeFmt = detectTimeFormat(lang.rawLocale);
  const firstDay = detectFirstDayOfWeek(lang.rawLocale);

  return {
    rawLocale: lang.rawLocale,
    primaryLanguage: lang.primaryLanguage,
    supportedLanguage: lang.supportedLanguage,
    isLanguageSupported: lang.isSupported,
    isRTL: lang.isRTL,
    timezone: tz.timezone,
    timezoneOffset: tz.offset,
    dateFormat: dateFmt.format,
    timeFormat: timeFmt.format,
    firstDayOfWeek: firstDay,
    sampleFormattedDate: dateFmt.sampleFormatted,
    sampleFormattedTime: timeFmt.sampleFormatted,
  };
}

/**
 * Format date input according to specified date format and timezone
 */
export function formatLocalizedDate(
  dateInput: string | Date | number,
  format: DetectedDateFormat = 'DD/MM/YYYY',
  timezone: string = 'auto',
  locale: string = 'en-US'
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--';

    const targetTz = timezone === 'auto' ? getDeviceTimezone() : timezone;

    if (format === 'YYYY-MM-DD') {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      return `${y}-${m}-${day}`;
    }

    if (format === 'MM/DD/YYYY') {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      return `${m}/${day}/${y}`;
    }

    // Default DD/MM/YYYY
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: targetTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    return `${day}/${m}/${y}`;
  } catch {
    return '--';
  }
}

/**
 * Format time input according to specified 12h/24h format and timezone
 */
export function formatLocalizedTime(
  dateInput: string | Date | number,
  format: DetectedTimeFormat = '24h',
  timezone: string = 'auto',
  locale: string = 'en-US'
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--:--';

    const targetTz = timezone === 'auto' ? getDeviceTimezone() : timezone;

    return new Intl.DateTimeFormat(locale, {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
    }).format(d);
  } catch {
    return '--:--';
  }
}
