import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // backward compat

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure auth flow
  },
  global: {
    headers: { 'x-app-version': '1.0.0' },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit realtime events
    },
  },
});

// Typed helper for RPC calls
export const rpc = <T = unknown>(
  fn: string,
  params?: Record<string, unknown>
) => supabase.rpc(fn, params).returns<T>();
