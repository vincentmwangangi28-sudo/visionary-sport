export interface TimezoneOption {
  value: string;
  iana: string;
  label: string;
  offset: string;
  region: string;
  flag: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { value: 'auto', iana: 'auto', label: 'Local Device Time (Auto)', offset: 'Auto', region: 'Device', flag: '📍' },
  { value: 'UTC', iana: 'UTC', label: 'UTC (Universal Coordinated)', offset: 'UTC+0', region: 'Global', flag: '🌐' },
  { value: 'Africa/Nairobi', iana: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: 'UTC+3', region: 'East Africa', flag: '🇰🇪' },
  { value: 'Africa/Lagos', iana: 'Africa/Lagos', label: 'Lagos (WAT)', offset: 'UTC+1', region: 'West Africa', flag: '🇳🇬' },
  { value: 'Africa/Johannesburg', iana: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: 'UTC+2', region: 'Southern Africa', flag: '🇿🇦' },
  { value: 'Africa/Cairo', iana: 'Africa/Cairo', label: 'Cairo (EET)', offset: 'UTC+3', region: 'North Africa', flag: '🇪🇬' },
  { value: 'Europe/London', iana: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+1', region: 'UK', flag: '🇬🇧' },
  { value: 'Europe/Paris', iana: 'Europe/Paris', label: 'Paris / Madrid / Berlin (CET)', offset: 'UTC+2', region: 'Europe', flag: '🇪🇺' },
  { value: 'America/New_York', iana: 'America/New_York', label: 'New York (EDT / EST)', offset: 'UTC-4', region: 'US East', flag: '🇺🇸' },
  { value: 'America/Chicago', iana: 'America/Chicago', label: 'Chicago (CDT / CST)', offset: 'UTC-5', region: 'US Central', flag: '🇺🇸' },
  { value: 'America/Los_Angeles', iana: 'America/Los_Angeles', label: 'Los Angeles (PDT / PST)', offset: 'UTC-7', region: 'US West', flag: '🇺🇸' },
  { value: 'America/Sao_Paulo', iana: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: 'UTC-3', region: 'South America', flag: '🇧🇷' },
  { value: 'America/Mexico_City', iana: 'America/Mexico_City', label: 'Mexico City (CST)', offset: 'UTC-6', region: 'Mexico', flag: '🇲🇽' },
  { value: 'Asia/Dubai', iana: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4', region: 'Middle East', flag: '🇦🇪' },
  { value: 'Asia/Riyadh', iana: 'Asia/Riyadh', label: 'Riyadh (AST)', offset: 'UTC+3', region: 'Saudi Arabia', flag: '🇸🇦' },
  { value: 'Asia/Kolkata', iana: 'Asia/Kolkata', label: 'Kolkata / Mumbai (IST)', offset: 'UTC+5:30', region: 'India', flag: '🇮🇳' },
  { value: 'Asia/Singapore', iana: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8', region: 'Asia-Pacific', flag: '🇸🇬' },
  { value: 'Asia/Tokyo', iana: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9', region: 'Japan', flag: '🇯🇵' },
  { value: 'Australia/Sydney', iana: 'Australia/Sydney', label: 'Sydney (AEST)', offset: 'UTC+10', region: 'Australia', flag: '🇦🇺' },
];

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getActiveTimezone(tzSetting: string): string {
  if (!tzSetting || tzSetting === 'auto') {
    return getDeviceTimezone();
  }
  return tzSetting;
}

export function formatKickoffDateTime(
  dateInput: string | Date | number,
  tzSetting: string = 'auto',
  options?: {
    includeDate?: boolean;
    includeWeekday?: boolean;
    includeTimezone?: boolean;
    locale?: string;
    dateFormat?: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat?: 'auto' | '12h' | '24h';
  }
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--:--';

    const targetTz = getActiveTimezone(tzSetting);
    const resolvedLocale = options?.locale === 'sw' ? 'sw-KE' :
      options?.locale === 'fr' ? 'fr-FR' :
      options?.locale === 'es' ? 'es-ES' :
      options?.locale === 'pt' ? 'pt-BR' :
      options?.locale === 'ar' ? 'ar-SA' :
      options?.locale === 'en' ? 'en-GB' :
      options?.locale || 'en-GB';

    const isHour12 = options?.timeFormat === '12h';

    const timeFormatter = new Intl.DateTimeFormat(resolvedLocale, {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: isHour12,
    });

    const timeStr = timeFormatter.format(d);

    if (!options?.includeDate && !options?.includeWeekday && !options?.includeTimezone) {
      return timeStr;
    }

    const parts: string[] = [];

    if (options.includeWeekday) {
      const weekdayFormatter = new Intl.DateTimeFormat(resolvedLocale, {
        timeZone: targetTz,
        weekday: 'short',
      });
      parts.push(weekdayFormatter.format(d));
    }

    if (options.includeDate) {
      if (options.dateFormat === 'YYYY-MM-DD') {
        const p = new Intl.DateTimeFormat('en-US', { timeZone: targetTz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
        const y = p.find((x) => x.type === 'year')?.value;
        const m = p.find((x) => x.type === 'month')?.value;
        const day = p.find((x) => x.type === 'day')?.value;
        parts.push(`${y}-${m}-${day}`);
      } else if (options.dateFormat === 'MM/DD/YYYY') {
        const p = new Intl.DateTimeFormat('en-US', { timeZone: targetTz, month: '2-digit', day: '2-digit' }).formatToParts(d);
        const m = p.find((x) => x.type === 'month')?.value;
        const day = p.find((x) => x.type === 'day')?.value;
        parts.push(`${m}/${day}`);
      } else if (options.dateFormat === 'DD/MM/YYYY') {
        const p = new Intl.DateTimeFormat('en-GB', { timeZone: targetTz, month: '2-digit', day: '2-digit' }).formatToParts(d);
        const m = p.find((x) => x.type === 'month')?.value;
        const day = p.find((x) => x.type === 'day')?.value;
        parts.push(`${day}/${m}`);
      } else {
        const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
          timeZone: targetTz,
          month: 'short',
          day: 'numeric',
        });
        parts.push(dateFormatter.format(d));
      }
    }

    parts.push(timeStr);

    if (options.includeTimezone) {
      const tzShort = getTimezoneShortLabel(targetTz, d);
      parts.push(`(${tzShort})`);
    }

    return parts.join(' · ');
  } catch {
    return '--:--';
  }
}

export function getTimezoneShortLabel(tz: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz.split('/').pop()?.replace('_', ' ') || 'Local';
  } catch {
    return 'Local';
  }
}

export function getRelativeKickoffLabel(dateInput: string | Date | number): {
  label: string;
  status: 'live' | 'upcoming' | 'finished' | 'today';
  urgency: 'high' | 'medium' | 'low';
} {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    const now = Date.now();
    const matchTime = d.getTime();
    if (isNaN(matchTime)) {
      return { label: 'Scheduled', status: 'upcoming', urgency: 'low' };
    }

    const diffMinutes = Math.round((matchTime - now) / 60000);

    if (diffMinutes < -110) {
      return { label: 'FT', status: 'finished', urgency: 'low' };
    } else if (diffMinutes <= 0 && diffMinutes >= -110) {
      const elapsed = Math.abs(diffMinutes);
      return { label: `${elapsed}' LIVE`, status: 'live', urgency: 'high' };
    } else if (diffMinutes <= 60) {
      return { label: `Starts in ${diffMinutes}m`, status: 'upcoming', urgency: 'high' };
    } else if (diffMinutes <= 180) {
      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return { label: `Starts in ${hrs}h ${mins}m`, status: 'upcoming', urgency: 'medium' };
    } else if (diffMinutes < 1440) {
      const hrs = Math.round(diffMinutes / 60);
      return { label: `Today in ${hrs}h`, status: 'today', urgency: 'low' };
    } else {
      const days = Math.round(diffMinutes / 1440);
      return { label: `In ${days} days`, status: 'upcoming', urgency: 'low' };
    }
  } catch {
    return { label: 'Scheduled', status: 'upcoming', urgency: 'low' };
  }
}
