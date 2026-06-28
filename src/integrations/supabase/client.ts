import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Project: bhgjlhgevyggkhyytulv — ALL data, functions, migrations live here
const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: { headers: { 'x-app-version': '2.0.0' } },
});
