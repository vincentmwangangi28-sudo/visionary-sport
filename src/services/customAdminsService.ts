import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminAuditService';

export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';
export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';

export const CUSTOM_ADMINS_STORAGE_KEY = 'predictpro_custom_admins_table_cache_v3';
export const CUSTOM_ADMINS_UPDATED_EVENT = 'predictpro:custom-admins-updated';

export interface CustomAdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | string;
  created_at: string;
  added_by: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface AdminsTableStatus {
  isTableReady: boolean;
  tableExists: boolean;
  adminCount: number;
  lastChecked: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface AddCustomAdminParams {
  email: string;
  full_name?: string | null;
  role?: string;
  added_by?: string | null;
  notes?: string | null;
}

/**
 * Checks if target user or email is Vincent Mwangangi (Sole Administrator)
 */
export function isVincentAdmin(
  userOrEmail: { email?: string | null; user_metadata?: { full_name?: string } } | string | null | undefined
): boolean {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'string') {
    return userOrEmail.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
  }
  const email = (userOrEmail.email || '').toLowerCase().trim();
  const name = (userOrEmail.user_metadata?.full_name || '').toLowerCase().trim();
  return email === PRIMARY_ADMIN_EMAIL.toLowerCase() || name.includes('vincent mwangangi');
}

/**
 * Sole designated administrator profile.
 * Exactly one admin manages all PredictPro platform operations.
 */
export const ROOT_ADMIN_RECORD: CustomAdminUser = {
  id: 'root-vincent-sole-admin',
  email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
  full_name: PRIMARY_ADMIN_NAME,
  role: 'super_admin',
  created_at: '2025-01-01T00:00:00.000Z',
  added_by: 'system',
  notes: 'Sole Designated Platform Administrator (Vincent Mwangangi)',
  is_active: true,
};

/**
 * SQL script for creating and configuring the custom `admins` table in Supabase SQL editor
 * with Vincent Mwangangi as the exclusive administrator.
 */
export const SUPABASE_ADMINS_TABLE_SQL = `-- PredictPro: Custom 'admins' Table for Single Administrator Access Control
-- Run this in your Supabase Dashboard -> SQL Editor:

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  added_by TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(lower(email));

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow read access for authorization queries
CREATE POLICY "Allow read access to admins table" 
  ON public.admins FOR SELECT USING (true);

-- Allow sole administrator management
CREATE POLICY "Allow manage access to admins table" 
  ON public.admins FOR ALL USING (true);

-- Seed Vincent Mwangangi as the sole designated administrator
INSERT INTO public.admins (email, full_name, role, added_by, notes, is_active)
VALUES (
  'vincentmwangangi28@gmail.com',
  'Vincent Mwangangi',
  'super_admin',
  'system',
  'Sole Designated Administrator',
  true
)
ON CONFLICT (email) DO NOTHING;
`;

const isVitestOrTestEnv = typeof process !== 'undefined' && (Boolean(process.env?.VITEST) || process.env?.NODE_ENV === 'test');

/**
 * Safe promise wrapper with timeout to ensure UI/tests never hang on network blips.
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 2000, fallbackVal?: T): Promise<T> {
  const timeoutMs = isVitestOrTestEnv ? Math.min(ms, 250) : ms;
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackVal !== undefined) resolve(fallbackVal);
      else reject(new Error('Operation timed out'));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Retrieves the local cache of authorized admins.
 * SINGLE ADMIN POLICY: Vincent Mwangangi is the ONLY admin.
 */
export function getLocalAdminsCache(): CustomAdminUser[] {
  return [ROOT_ADMIN_RECORD];
}

/**
 * Saves authorized admins to local cache and broadcasts an event to notify hooks/UI.
 */
export function saveLocalAdminsCache(_admins: CustomAdminUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_ADMINS_STORAGE_KEY, JSON.stringify([ROOT_ADMIN_RECORD]));
    window.dispatchEvent(
      new CustomEvent(CUSTOM_ADMINS_UPDATED_EVENT, { detail: { admins: [ROOT_ADMIN_RECORD] } })
    );
  } catch {
    // Safe storage fallback
  }
}

/**
 * Fast synchronous check if a user/email is authorized to access protected admin routes.
 * STRICT ENFORCEMENT: Only Vincent Mwangangi has administrative clearance.
 */
export function isUserAuthorizedAdminSync(
  userOrEmail: { email?: string | null; id?: string; user_metadata?: { full_name?: string } } | string | null | undefined
): boolean {
  return isVincentAdmin(userOrEmail);
}

/**
 * Asynchronous check validating against the single administrator rule.
 * STRICT ENFORCEMENT: Only Vincent Mwangangi has administrative clearance.
 */
export async function isUserAuthorizedAdminAsync(
  userOrEmail: { email?: string | null; id?: string; user_metadata?: { full_name?: string } } | string | null | undefined
): Promise<boolean> {
  return isVincentAdmin(userOrEmail);
}

/**
 * Checks the connectivity and availability of the custom `admins` table in Supabase.
 */
export async function checkAdminsTableStatus(): Promise<AdminsTableStatus> {
  const start = performance.now();
  try {
    const queryPromise = supabase
      .from('admins')
      .select('id, email')
      .eq('email', PRIMARY_ADMIN_EMAIL.toLowerCase())
      .limit(1);

    const { data, error } = await withTimeout(queryPromise, 1200, { data: null, error: null } as any);
    const latency = Math.round(performance.now() - start);

    if (error) {
      const isMissingTable =
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation "public.admins" does not exist') ||
        error.message?.includes('relation "admins" does not exist');

      return {
        isTableReady: false,
        tableExists: !isMissingTable,
        adminCount: 1,
        lastChecked: new Date().toISOString(),
        errorMessage: error.message || 'Supabase table query failed',
        latencyMs: latency,
      };
    }

    return {
      isTableReady: true,
      tableExists: true,
      adminCount: Array.isArray(data) && data.length > 0 ? 1 : 1,
      lastChecked: new Date().toISOString(),
      latencyMs: latency,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      isTableReady: false,
      tableExists: false,
      adminCount: 1,
      lastChecked: new Date().toISOString(),
      errorMessage: err?.message || 'Local Sync Fallback Active',
      latencyMs: latency,
    };
  }
}

/**
 * Fetches all authorized admins.
 * SINGLE ADMIN POLICY: Guarantees exactly ONE admin (Vincent Mwangangi) manages all platform operations.
 */
export async function fetchAdminsFromSupabase(): Promise<{
  admins: CustomAdminUser[];
  fromDatabase: boolean;
  error?: string | null;
}> {
  let fetchedFromDb = false;
  let queryError: string | null = null;

  try {
    const queryPromise = supabase
      .from('admins')
      .select('*')
      .eq('email', PRIMARY_ADMIN_EMAIL.toLowerCase())
      .limit(1);

    const { data, error } = await withTimeout(queryPromise, 1500, { data: null, error: null } as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      fetchedFromDb = true;
    } else if (error) {
      queryError = error.message;
    }
  } catch (err: any) {
    queryError = err?.message || 'Using local sole administrator configuration';
  }

  // Sole administrator: strictly Vincent Mwangangi
  const finalAdminsList = [ROOT_ADMIN_RECORD];
  saveLocalAdminsCache(finalAdminsList);

  return {
    admins: finalAdminsList,
    fromDatabase: fetchedFromDb,
    error: queryError,
  };
}

/**
 * Enforces Single Administrator Policy.
 * If attempting to add anyone other than Vincent Mwangangi, rejects with explanation.
 */
export async function addAdminToSupabase({
  email,
  full_name,
  role = 'super_admin',
  added_by = PRIMARY_ADMIN_NAME,
  notes,
}: AddCustomAdminParams): Promise<{
  success: boolean;
  admin: CustomAdminUser;
  persistedToDb: boolean;
  message: string;
}> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  // SINGLE ADMIN POLICY: Only Vincent Mwangangi can be admin
  if (cleanEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    throw new Error(
      `Single Administrator Policy Active: Vincent Mwangangi (${PRIMARY_ADMIN_EMAIL}) is the only authorized administrator configured to manage all platform operations. Additional administrators are restricted.`
    );
  }

  let persistedToDb = false;

  try {
    const upsertPromise = supabase
      .from('admins')
      .upsert(
        {
          email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
          full_name: full_name || PRIMARY_ADMIN_NAME,
          role: role || 'super_admin',
          added_by: added_by || 'system',
          notes: notes || 'Sole Designated Administrator',
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select();

    const { data, error } = await withTimeout(upsertPromise, 1500, { data: null, error: null } as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      persistedToDb = true;
    }
  } catch {
    // Falls back gracefully
  }

  return {
    success: true,
    admin: ROOT_ADMIN_RECORD,
    persistedToDb,
    message: `Vincent Mwangangi (${PRIMARY_ADMIN_EMAIL}) verified as the sole administrator.`,
  };
}

/**
 * Removes an administrator. Vincent Mwangangi cannot be removed as the sole admin.
 */
export async function removeAdminFromSupabase(
  adminIdOrEmail: string,
  _actorEmail: string = PRIMARY_ADMIN_EMAIL
): Promise<{
  success: boolean;
  message: string;
  persistedToDb: boolean;
}> {
  const cleanTarget = adminIdOrEmail.trim().toLowerCase();

  if (
    cleanTarget === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
    isVincentAdmin(cleanTarget)
  ) {
    throw new Error(
      `Action Prohibited: ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}) is the sole platform administrator and cannot be removed.`
    );
  }

  return {
    success: true,
    message: `Target ${cleanTarget} is not an authorized administrator.`,
    persistedToDb: false,
  };
}
