// Lightweight OAuth diagnostics: structured console logs + persisted ring buffer
// so failures can be inspected after the provider redirect round-trips.

export type OAuthLogLevel = 'info' | 'warn' | 'error';

export interface OAuthLogEntry {
  ts: string;
  level: OAuthLogLevel;
  provider?: string;
  stage: string; // e.g. "start", "redirect", "callback", "error"
  message: string;
  context?: Record<string, unknown>;
}

const STORAGE_KEY = 'oauth_debug_log';
const MAX_ENTRIES = 25;

function safeRead(): OAuthLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(entries: OAuthLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function logOAuth(entry: Omit<OAuthLogEntry, 'ts'>) {
  const full: OAuthLogEntry = { ts: new Date().toISOString(), ...entry };
  const tag = `[OAuth:${full.provider ?? 'unknown'}:${full.stage}]`;
  const fn = full.level === 'error' ? console.error : full.level === 'warn' ? console.warn : console.info;
  fn(tag, full.message, full.context ?? '');
  safeWrite([...safeRead(), full]);
}

export function getOAuthLog(): OAuthLogEntry[] {
  return safeRead();
}

export function clearOAuthLog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Translate provider/backend error strings into human-friendly copy.
export function friendlyOAuthError(raw: string | undefined | null): {
  title: string;
  message: string;
  hint?: string;
} {
  const text = (raw ?? '').toLowerCase();

  if (!text) {
    return {
      title: 'Sign-in failed',
      message: 'We could not complete sign-in. Please try again.',
    };
  }
  if (text.includes('redirect_uri_mismatch')) {
    return {
      title: 'Redirect URL not allowed',
      message:
        "Your Google OAuth client doesn't have this app's callback URL registered.",
      hint: 'Switch to managed Google login or add the callback URL in Google Cloud Console.',
    };
  }
  if (text.includes('access_denied') || text.includes('cancelled') || text.includes('canceled')) {
    return {
      title: 'Sign-in cancelled',
      message: 'You closed the provider window or denied permission.',
      hint: 'Try again and approve the requested permissions.',
    };
  }
  if (text.includes('invalid_client')) {
    return {
      title: 'OAuth client misconfigured',
      message: 'The Client ID or Secret in your auth settings is invalid or expired.',
      hint: 'Update the credentials or switch to managed login.',
    };
  }
  if (text.includes('network') || text.includes('failed to fetch')) {
    return {
      title: 'Network problem',
      message: 'We could not reach the auth provider.',
      hint: 'Check your connection and try again.',
    };
  }
  if (text.includes('popup')) {
    return {
      title: 'Popup blocked',
      message: 'Your browser blocked the sign-in window.',
      hint: 'Allow popups for this site and try again.',
    };
  }
  return {
    title: 'Sign-in failed',
    message: raw || 'Unknown error from auth provider.',
  };
}
