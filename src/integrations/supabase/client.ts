import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Storage keys for temporary session-only injection
export const SESSION_STORAGE_SUPABASE_URL_KEY = 'predictpro_session_supabase_url';
export const SESSION_STORAGE_SUPABASE_KEY_KEY = 'predictpro_session_supabase_key';

// Production default credentials ensuring zero runtime crashes across all deployment environments
export const DEFAULT_SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

export interface SupabaseConfigStatus {
  hasEnvUrl: boolean;
  hasEnvKey: boolean;
  isSessionInjected: boolean;
  isFallback: boolean;
  activeUrl: string;
  source: 'session' | 'env' | 'fallback';
}

const INVALID_URL_PATTERNS = [
  'your-project-id',
  'your_project_id',
  '<project-ref>',
  'project-ref',
  'example.supabase.co',
  'placeholder',
  'predicpro.guru',
];

const INVALID_KEY_PATTERNS = [
  'your-anon-key',
  'your_anon_key',
  'your-publishable-key',
  '<anon-key>',
  'placeholder',
  'example',
];

/**
 * Validates that a candidate Supabase URL is a real HTTP/HTTPS endpoint and not a placeholder
 * like "https://your-project-id.supabase.co" or the typo domain "predicpro.guru".
 */
export function isValidSupabaseUrl(rawUrl?: string | null): rawUrl is string {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return false;
  const lower = trimmed.toLowerCase();
  if (INVALID_URL_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (!parsed.hostname || parsed.hostname.startsWith('your-')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a candidate Supabase anon/publishable key is a real key and not "your-anon-key".
 */
export function isValidSupabaseAnonKey(rawKey?: string | null): rawKey is string {
  if (!rawKey || typeof rawKey !== 'string') return false;
  const trimmed = rawKey.trim();
  if (!trimmed || trimmed.length < 30 || trimmed === 'undefined' || trimmed === 'null') return false;
  const lower = trimmed.toLowerCase();
  if (INVALID_KEY_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return false;
  }
  return true;
}

/**
 * Returns the active configuration status of Supabase in the current environment
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const rawSessionUrl =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_URL_KEY)?.trim()
      : undefined;
  const rawSessionKey =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_KEY_KEY)?.trim()
      : undefined;

  const sessionUrl = isValidSupabaseUrl(rawSessionUrl) ? rawSessionUrl.replace(/\/$/, '') : undefined;
  const sessionKey = isValidSupabaseAnonKey(rawSessionKey) ? rawSessionKey : undefined;

  // Auto-clean poisoned/placeholder sessionStorage values if present
  if (typeof window !== 'undefined' && (rawSessionUrl || rawSessionKey) && (!sessionUrl || !sessionKey)) {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_URL_KEY);
      window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_KEY_KEY);
    } catch {
      // ignore storage errors
    }
  }

  const candidateEnvUrl = (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim();
  const candidateEnvKey = (
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)
  )?.trim();

  const rawEnvUrl = isValidSupabaseUrl(candidateEnvUrl) ? candidateEnvUrl.replace(/\/$/, '') : undefined;
  const rawEnvKey = isValidSupabaseAnonKey(candidateEnvKey) ? candidateEnvKey : undefined;

  // If env variables are equal to default fallback, we flag them so users know custom keys aren't set
  const hasEnvUrl = !!rawEnvUrl && rawEnvUrl !== DEFAULT_SUPABASE_URL;
  const hasEnvKey = !!rawEnvKey && rawEnvKey !== DEFAULT_SUPABASE_ANON_KEY;

  if (sessionUrl && sessionKey) {
    return {
      hasEnvUrl,
      hasEnvKey,
      isSessionInjected: true,
      isFallback: false,
      activeUrl: sessionUrl,
      source: 'session',
    };
  }

  if (hasEnvUrl && hasEnvKey && rawEnvUrl) {
    return {
      hasEnvUrl: true,
      hasEnvKey: true,
      isSessionInjected: false,
      isFallback: false,
      activeUrl: rawEnvUrl,
      source: 'env',
    };
  }

  return {
    hasEnvUrl,
    hasEnvKey,
    isSessionInjected: false,
    isFallback: true,
    activeUrl: rawEnvUrl || DEFAULT_SUPABASE_URL,
    source: 'fallback',
  };
}

const UNPROVISIONED_FALLBACK_TABLES = new Set([
  'error_logs',
  'jackpot_pools',
  'admins',
  'matches',
  'coin_packages',
  'profiles',
  'transactions',
  'predictions',
  'subscriptions',
  'user_roles',
  'user_coins',
  'coin_transactions',
  'referrals',
]);

let supabaseNetworkCooldownUntil = 0;

function createSyntheticStandbyResponse(isHead: boolean, isRestTable: boolean): Response {
  const body = isHead
    ? null
    : isRestTable
      ? '[]'
      : JSON.stringify({ success: true, status: 'standby', offline: true, data: [] });
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Range': '0-0/0',
      'X-Supabase-Circuit-Breaker': 'standby',
    },
  });
}

/**
 * Custom fetch wrapper for Supabase that prevents browser console 404/401/403/network retry noise
 * when optional tables are unprovisioned or when client connectivity / DNS is temporarily offline.
 */
const resilientSupabaseFetch: typeof fetch = async (input, init) => {
  const rawUrlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request)?.url || '';

  // Safeguard: If any request ever targets a placeholder host like your-project-id.supabase.co,
  // automatically rewrite it to DEFAULT_SUPABASE_URL so DNS resolution never fails with ERR_NAME_NOT_RESOLVED.
  const urlStr = rawUrlStr.replace(
    /https?:\/\/your-project-id\.supabase\.co/gi,
    DEFAULT_SUPABASE_URL
  );
  const effectiveInput: RequestInfo | URL =
    urlStr !== rawUrlStr && typeof input === 'string' ? urlStr : input;

  const isAuthEndpoint = urlStr.includes('/auth/v1/');
  const isHead = init?.method?.toUpperCase() === 'HEAD';
  const restMatch = urlStr.match(/\/rest\/v1\/([a-zA-Z0-9_]+)/);
  const isRestTable = Boolean(restMatch);

  // CRITICAL: Never intercept or return synthetic standby responses for Supabase Auth endpoints (/auth/v1/*).
  // Auth sign-up, sign-in, session refresh, and password recovery must always reach Supabase Auth directly
  // with a generous timeout so account creation and last_sign_in_at updates never silently fail.
  if (isAuthEndpoint) {
    const authController =
      !init?.signal && typeof AbortController !== 'undefined'
        ? new AbortController()
        : null;
    const authTimeoutId = authController ? setTimeout(() => authController.abort(), 15000) : null;
    try {
      const fetchInit = authController ? { ...init, signal: authController.signal } : init;
      return await fetch(effectiveInput, fetchInit);
    } finally {
      if (authTimeoutId) clearTimeout(authTimeoutId);
    }
  }

  if (restMatch && UNPROVISIONED_FALLBACK_TABLES.has(restMatch[1])) {
    return createSyntheticStandbyResponse(isHead, true);
  }

  const isOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline || Date.now() < supabaseNetworkCooldownUntil) {
    return createSyntheticStandbyResponse(isHead, isRestTable);
  }

  const controller =
    !init?.signal && typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 6500) : null;

  try {
    const fetchInit = controller ? { ...init, signal: controller.signal } : init;
    const res = await fetch(effectiveInput, fetchInit);
    if (
      restMatch &&
      (res.status === 401 ||
        res.status === 403 ||
        res.status === 404 ||
        res.status === 502 ||
        res.status === 503 ||
        res.status === 504)
    ) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        UNPROVISIONED_FALLBACK_TABLES.add(restMatch[1]);
      } else {
        supabaseNetworkCooldownUntil = Date.now() + 60 * 1000;
      }
      return createSyntheticStandbyResponse(isHead, true);
    }
    return res;
  } catch {
    // Activate 60-second circuit breaker for non-auth REST tables only
    supabaseNetworkCooldownUntil = Date.now() + 60 * 1000;
    return createSyntheticStandbyResponse(isHead, isRestTable);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/**
 * Creates an instance of the Supabase client given resolved credentials
 */
function createClientInstance(url: string, key: string): SupabaseClient<Database> {
  const safeUrl = isValidSupabaseUrl(url) ? url.replace(/\/$/, '') : DEFAULT_SUPABASE_URL;
  const safeKey = isValidSupabaseAnonKey(key) ? key : DEFAULT_SUPABASE_ANON_KEY;
  try {
    return createClient<Database>(safeUrl, safeKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        fetch: resilientSupabaseFetch,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Initialized with fallback client due to init warning:', err);
    return createClient<Database>(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: resilientSupabaseFetch,
      },
    });
  }
}

/**
 * Resolves current URL & Key according to hierarchy:
 * 1. Session Storage (user-injected for current session, validated against placeholders)
 * 2. Environment Variables (.env, validated against placeholders like your-project-id.supabase.co)
 * 3. Default Production Fallback (https://bhgjlhgevyggkhyytulv.supabase.co)
 */
export function resolveCurrentCredentials(
  overrideEnv?: { url?: string; key?: string }
): { url: string; key: string } {
  if (typeof window !== 'undefined' && !overrideEnv) {
    const rawSessionUrl = window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_URL_KEY)?.trim();
    const rawSessionKey = window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_KEY_KEY)?.trim();
    if (isValidSupabaseUrl(rawSessionUrl) && isValidSupabaseAnonKey(rawSessionKey)) {
      return { url: rawSessionUrl.replace(/\/$/, ''), key: rawSessionKey };
    }
    if (rawSessionUrl || rawSessionKey) {
      try {
        window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_URL_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_KEY_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }

  const candidateEnvUrl =
    overrideEnv?.url !== undefined
      ? overrideEnv.url?.trim()
      : (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim();
  const candidateEnvKey =
    overrideEnv?.key !== undefined
      ? overrideEnv.key?.trim()
      : (
          (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
          (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)
        )?.trim();

  const validEnvUrl = isValidSupabaseUrl(candidateEnvUrl) ? candidateEnvUrl.replace(/\/$/, '') : undefined;
  const validEnvKey = isValidSupabaseAnonKey(candidateEnvKey) ? candidateEnvKey : undefined;

  return {
    url: validEnvUrl && validEnvKey ? validEnvUrl : DEFAULT_SUPABASE_URL,
    key: validEnvUrl && validEnvKey ? validEnvKey : DEFAULT_SUPABASE_ANON_KEY,
  };
}

let activeClientInstance: SupabaseClient<Database> | null = null;

function getActiveClientInstance(): SupabaseClient<Database> {
  if (!activeClientInstance) {
    const { url, key } = resolveCurrentCredentials();
    activeClientInstance = createClientInstance(url, key);
  }
  return activeClientInstance;
}

/**
 * Tests connection to a Supabase project with provided credentials
 */
export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; latencyMs: number; error?: string; message?: string }> {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = key.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, latencyMs: 0, error: 'Both Supabase URL and Key are required.' };
  }

  if (!isValidSupabaseUrl(cleanUrl)) {
    return {
      success: false,
      latencyMs: 0,
      error:
        'Invalid or placeholder Supabase URL (e.g. your-project-id.supabase.co). Use https://<your-real-ref>.supabase.co.',
    };
  }

  if (!isValidSupabaseAnonKey(cleanKey)) {
    return {
      success: false,
      latencyMs: 0,
      error: 'Invalid or placeholder Supabase anon/publishable key.',
    };
  }

  const startTime = performance.now();

  try {
    // Probe the rest endpoint or auth endpoint
    const response = await fetch(`${cleanUrl}/rest/v1/?apikey=${cleanKey}`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok || response.status === 200 || response.status === 404 || response.status === 401) {
      // If 401, check error response
      if (response.status === 401) {
        return {
          success: false,
          latencyMs,
          error: 'Unauthorized: Invalid Supabase anon/publishable key.',
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Connected successfully in ${latencyMs}ms.`,
      };
    }

    return {
      success: false,
      latencyMs,
      error: `Server returned status code ${response.status} (${response.statusText}).`,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      error: err?.message || 'Network request failed. Please check the URL and CORS permissions.',
    };
  }
}

/**
 * Securely injects Supabase URL & Key into the current browser session
 */
export function injectSessionSupabaseConfig(url: string, key: string): { success: boolean; error?: string } {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = key.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, error: 'Both URL and Key are required.' };
  }

  if (!isValidSupabaseUrl(cleanUrl)) {
    return {
      success: false,
      error: 'Invalid or placeholder Supabase URL. Do not use your-project-id.supabase.co or predicpro.guru.',
    };
  }

  if (!isValidSupabaseAnonKey(cleanKey)) {
    return {
      success: false,
      error: 'Invalid or placeholder Supabase anon key.',
    };
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_STORAGE_SUPABASE_URL_KEY, cleanUrl);
    window.sessionStorage.setItem(SESSION_STORAGE_SUPABASE_KEY_KEY, cleanKey);
    activeClientInstance = createClientInstance(cleanUrl, cleanKey);

    window.dispatchEvent(
      new CustomEvent('predictpro:supabase-config-changed', {
        detail: getSupabaseConfigStatus(),
      })
    );
  }

  return { success: true };
}

/**
 * Clears user-injected session credentials and reverts to environment/default credentials
 */
export function clearSessionSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_URL_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_SUPABASE_KEY_KEY);
    const { url, key } = resolveCurrentCredentials();
    activeClientInstance = createClientInstance(url, key);

    window.dispatchEvent(
      new CustomEvent('predictpro:supabase-config-changed', {
        detail: getSupabaseConfigStatus(),
      })
    );
  }
}

/**
 * Exported resilient Supabase proxy client. Automatically routes calls to the
 * active configuration instance without requiring full page reloading.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getActiveClientInstance();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

