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

/**
 * Returns the active configuration status of Supabase in the current environment
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const sessionUrl =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_URL_KEY)?.trim()
      : undefined;
  const sessionKey =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_KEY_KEY)?.trim()
      : undefined;

  const rawEnvUrl = (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim();
  const rawEnvKey = (
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)
  )?.trim();

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

  if (hasEnvUrl && hasEnvKey) {
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

/**
 * Creates an instance of the Supabase client given resolved credentials
 */
function createClientInstance(url: string, key: string): SupabaseClient<Database> {
  try {
    return createClient<Database>(url, key, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  } catch (err) {
    console.warn('[Supabase] Initialized with fallback client due to init warning:', err);
    return createClient<Database>(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

/**
 * Resolves current URL & Key according to hierarchy:
 * 1. Session Storage (user-injected for current session)
 * 2. Environment Variables (.env)
 * 3. Default Fallback
 */
function resolveCurrentCredentials(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const sessionUrl = window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_URL_KEY)?.trim();
    const sessionKey = window.sessionStorage.getItem(SESSION_STORAGE_SUPABASE_KEY_KEY)?.trim();
    if (sessionUrl && sessionKey) {
      return { url: sessionUrl, key: sessionKey };
    }
  }

  const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)
  )?.trim();

  return {
    url: envUrl || DEFAULT_SUPABASE_URL,
    key: envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
}

let activeClientInstance: SupabaseClient<Database> = (() => {
  const { url, key } = resolveCurrentCredentials();
  return createClientInstance(url, key);
})();

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

  // Basic format check
  try {
    const parsed = new URL(cleanUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { success: false, latencyMs: 0, error: 'Invalid URL protocol. Must start with https://' };
    }
  } catch {
    return { success: false, latencyMs: 0, error: 'Malformed Supabase URL format.' };
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

  try {
    new URL(cleanUrl);
  } catch {
    return { success: false, error: 'Invalid Supabase URL.' };
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
    const val = (activeClientInstance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(activeClientInstance);
    }
    return val;
  },
});

