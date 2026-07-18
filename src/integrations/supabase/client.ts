import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// PredictPro Supabase Project: bhgjlhgevyggkhyytulv
export const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_b8PmUWXn1tx_EHerqAHYSw_TDTX46-a';

// Main client — used everywhere in the frontend
// Uses publishable key for new SDK, anon JWT for REST Authorization header
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  },
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } },
});
