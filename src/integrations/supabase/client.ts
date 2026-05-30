import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string;

// Graceful fallback so app never shows blank white screen
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_KEY || 'placeholder-key';

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: { headers: { 'x-app-version': '2.0.0' } },
  realtime: { params: { eventsPerSecond: 10 } },
});

export const rpc = <T = unknown>(fn: string, params?: Record<string, unknown>) =>
  supabase.rpc(fn, params).returns<T>();
