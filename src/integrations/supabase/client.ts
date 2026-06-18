import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// CORRECT Supabase project: bhgjlhgevyggkhyytulv
// All data, edge functions and migrations are here
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
  || 'https://bhgjlhgevyggkhyytulv.supabase.co';

const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ'
) as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
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
