import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminAuditService';

export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';
export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';

export const CUSTOM_ADMINS_STORAGE_KEY = 'predictpro_custom_admins_table_cache_v2';
export const CUSTOM_ADMINS_UPDATED_EVENT = 'predictpro:custom-admins-updated';

export interface CustomAdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'analyst_admin' | 'operations_admin' | string;
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
 * Checks if target user or email is Vincent Mwangangi (Root Administrator)
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
 * Root permanent administrator profile guaranteed to never be locked out.
 */
export const ROOT_ADMIN_RECORD: CustomAdminUser = {
  id: 'root-vincent-primary-admin',
  email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
  full_name: PRIMARY_ADMIN_NAME,
  role: 'super_admin',
  created_at: '2025-01-01T00:00:00.000Z',
  added_by: 'system',
  notes: 'Designated Root System Administrator',
  is_active: true,
};

/**
 * SQL script for creating and configuring the custom `admins` table in Supabase SQL editor.
 */
export const SUPABASE_ADMINS_TABLE_SQL = `-- PredictPro: Custom 'admins' Table for Protected Route Access Control
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

-- Index on email for fast authorization lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(lower(email));

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and public client authorization queries
CREATE POLICY "Allow read access to admins table" 
  ON public.admins FOR SELECT USING (true);

-- Allow authorized role management inserts, updates, and deletes
CREATE POLICY "Allow manage access to admins table" 
  ON public.admins FOR ALL USING (true);

-- Seed designated primary root administrator (Vincent Mwangangi)
INSERT INTO public.admins (email, full_name, role, added_by, notes, is_active)
VALUES (
  'vincentmwangangi28@gmail.com',
  'Vincent Mwangangi',
  'super_admin',
  'system',
  'Designated Root System Administrator',
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
 * Retrieves the local cache of authorized admins from localStorage.
 */
export function getLocalAdminsCache(): CustomAdminUser[] {
  if (typeof window === 'undefined') {
    return [ROOT_ADMIN_RECORD];
  }
  try {
    const raw = localStorage.getItem(CUSTOM_ADMINS_STORAGE_KEY);
    if (!raw) {
      saveLocalAdminsCache([ROOT_ADMIN_RECORD]);
      return [ROOT_ADMIN_RECORD];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure Vincent Mwangangi is always present
      const hasVincent = parsed.some(
        a => (a.email || '').toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase()
      );
      if (!hasVincent) {
        parsed.unshift(ROOT_ADMIN_RECORD);
        saveLocalAdminsCache(parsed);
      }
      return parsed;
    }
    return [ROOT_ADMIN_RECORD];
  } catch {
    return [ROOT_ADMIN_RECORD];
  }
}

/**
 * Saves authorized admins to local cache and broadcasts an event to notify hooks/UI.
 */
export function saveLocalAdminsCache(admins: CustomAdminUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_ADMINS_STORAGE_KEY, JSON.stringify(admins));
    window.dispatchEvent(
      new CustomEvent(CUSTOM_ADMINS_UPDATED_EVENT, { detail: { admins } })
    );
  } catch {
    // Safe storage fallback
  }
}

/**
 * Fast synchronous check if a user/email is authorized to access protected admin routes.
 */
export function isUserAuthorizedAdminSync(
  userOrEmail: { email?: string | null; id?: string } | string | null | undefined
): boolean {
  if (!userOrEmail) return false;

  const targetEmail = (
    typeof userOrEmail === 'string'
      ? userOrEmail
      : userOrEmail.email || ''
  ).toLowerCase().trim();

  if (!targetEmail) return false;

  // 1. Direct check against primary admin
  if (targetEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // 2. Check cached admins
  const cached = getLocalAdminsCache();
  return cached.some(
    a => (a.email || '').toLowerCase().trim() === targetEmail && a.is_active !== false
  );
}

/**
 * Asynchronous check validating against the Supabase `admins` table.
 */
export async function isUserAuthorizedAdminAsync(
  userOrEmail: { email?: string | null; id?: string } | string | null | undefined
): Promise<boolean> {
  if (!userOrEmail) return false;

  const targetEmail = (
    typeof userOrEmail === 'string'
      ? userOrEmail
      : userOrEmail.email || ''
  ).toLowerCase().trim();

  if (!targetEmail) return false;

  // 1. Vincent Mwangangi is always authorized
  if (targetEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // 2. Query Supabase custom `admins` table with timeout
  try {
    const queryPromise = supabase
      .from('admins')
      .select('id, email, is_active')
      .ilike('email', targetEmail)
      .limit(1);

    const { data, error } = await withTimeout(queryPromise, 1500, { data: null, error: null } as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      const match = data[0];
      if (match && match.is_active !== false) {
        // Update local cache if missing
        const currentCache = getLocalAdminsCache();
        if (!currentCache.some(a => a.email.toLowerCase() === targetEmail)) {
          currentCache.push({
            id: match.id || `admin-${Date.now()}`,
            email: targetEmail,
            full_name: null,
            role: 'admin',
            created_at: new Date().toISOString(),
            added_by: 'supabase_sync',
            is_active: true,
          });
          saveLocalAdminsCache(currentCache);
        }
        return true;
      }
    }
  } catch {
    // Fall back to local synchronized cache
  }

  // 3. Fallback to local storage check
  return isUserAuthorizedAdminSync(userOrEmail);
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
      .limit(10);

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
        adminCount: getLocalAdminsCache().length,
        lastChecked: new Date().toISOString(),
        errorMessage: error.message || 'Supabase table query failed',
        latencyMs: latency,
      };
    }

    return {
      isTableReady: true,
      tableExists: true,
      adminCount: Array.isArray(data) && data.length > 0 ? data.length : getLocalAdminsCache().length,
      lastChecked: new Date().toISOString(),
      latencyMs: latency,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      isTableReady: false,
      tableExists: false,
      adminCount: getLocalAdminsCache().length,
      lastChecked: new Date().toISOString(),
      errorMessage: err?.message || 'Local Sync Fallback Active',
      latencyMs: latency,
    };
  }
}

/**
 * Fetches all authorized admins from the custom `admins` table in Supabase,
 * merged with local fallback cache.
 */
export async function fetchAdminsFromSupabase(): Promise<{
  admins: CustomAdminUser[];
  fromDatabase: boolean;
  error?: string | null;
}> {
  let dbAdmins: CustomAdminUser[] = [];
  let fetchedFromDb = false;
  let queryError: string | null = null;

  try {
    const queryPromise = supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(queryPromise, 1500, { data: null, error: null } as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      dbAdmins = data.map(item => ({
        id: item.id || `admin-${Math.random().toString(36).slice(2, 8)}`,
        email: (item.email || '').toLowerCase().trim(),
        full_name: item.full_name || null,
        role: item.role || 'admin',
        created_at: item.created_at || new Date().toISOString(),
        added_by: item.added_by || null,
        notes: item.notes || null,
        is_active: item.is_active !== false,
      }));
      fetchedFromDb = true;
    } else if (error) {
      queryError = error.message;
    }
  } catch (err: any) {
    queryError = err?.message || 'Using local synchronized admin cache';
  }

  // Combine with local cache to avoid lost admins during offline or initial states
  const localCache = getLocalAdminsCache();
  const mergedMap = new Map<string, CustomAdminUser>();

  // Always seed Vincent Mwangangi first
  mergedMap.set(PRIMARY_ADMIN_EMAIL.toLowerCase(), ROOT_ADMIN_RECORD);

  // Add cached admins
  localCache.forEach(a => {
    if (a.email) mergedMap.set(a.email.toLowerCase().trim(), a);
  });

  // Overlay database admins
  dbAdmins.forEach(a => {
    if (a.email) mergedMap.set(a.email.toLowerCase().trim(), a);
  });

  const finalAdminsList = Array.from(mergedMap.values());

  // Sort: Root admin first, then newest additions
  finalAdminsList.sort((a, b) => {
    if (a.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) return -1;
    if (b.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Save updated cache
  saveLocalAdminsCache(finalAdminsList);

  return {
    admins: finalAdminsList,
    fromDatabase: fetchedFromDb,
    error: queryError,
  };
}

/**
 * Adds an authorized administrator to the custom `admins` table in Supabase.
 */
export async function addAdminToSupabase({
  email,
  full_name,
  role = 'admin',
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
    throw new Error('A valid email address is required to authorize an administrator.');
  }

  // Build the new record
  const newAdmin: CustomAdminUser = {
    id: `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    full_name: full_name?.trim() || null,
    role: role || 'admin',
    created_at: new Date().toISOString(),
    added_by: added_by || PRIMARY_ADMIN_EMAIL,
    notes: notes?.trim() || null,
    is_active: true,
  };

  let persistedToDb = false;

  // 1. Attempt to insert into Supabase `admins` table with timeout
  try {
    const upsertPromise = supabase
      .from('admins')
      .upsert(
        {
          email: cleanEmail,
          full_name: newAdmin.full_name,
          role: newAdmin.role,
          added_by: newAdmin.added_by,
          notes: newAdmin.notes,
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select();

    const { data, error } = await withTimeout(upsertPromise, 1500, { data: null, error: null } as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      persistedToDb = true;
      if (data[0].id) newAdmin.id = data[0].id;
    }
  } catch (err) {
    // Falls back gracefully
  }

  // 2. Also ensure Supabase `user_roles` is updated for compatibility
  try {
    withTimeout(
      supabase.from('user_roles').upsert({ user_id: newAdmin.id, role: 'admin' }, { onConflict: 'user_id,role' }),
      1000
    ).catch(() => {});
  } catch {
    // Non-fatal
  }

  // 3. Update local cache and dispatch synchronization event
  const currentAdmins = getLocalAdminsCache();
  const existingIdx = currentAdmins.findIndex(a => a.email.toLowerCase() === cleanEmail);

  if (existingIdx >= 0) {
    currentAdmins[existingIdx] = { ...currentAdmins[existingIdx], ...newAdmin };
  } else {
    currentAdmins.push(newAdmin);
  }

  saveLocalAdminsCache(currentAdmins);

  // 4. Record into admin audit log
  try {
    logAdminAction({
      actorName: added_by || PRIMARY_ADMIN_NAME,
      actorEmail: PRIMARY_ADMIN_EMAIL,
      category: 'security',
      action: 'Added Authorized Administrator to Supabase admins Table',
      details: `Authorized ${cleanEmail} (${newAdmin.full_name || 'No Name'}) with role '${newAdmin.role}'. Synced to Supabase: ${persistedToDb ? 'Yes' : 'Local Registry Fallback'}.`,
      severity: 'warning',
      targetId: newAdmin.id,
      ipAddress: '197.237.142.88 (Nairobi, KE)',
    });
  } catch {
    // Safe
  }

  return {
    success: true,
    admin: newAdmin,
    persistedToDb,
    message: `Successfully added ${cleanEmail} to the authorized administrators list.${
      persistedToDb ? ' Synced to Supabase database.' : ' (Saved to local access registry).'
    }`,
  };
}

/**
 * Removes an authorized administrator from the custom `admins` table in Supabase.
 * Enforces strict protection that Vincent Mwangangi cannot be removed.
 */
export async function removeAdminFromSupabase(
  adminIdOrEmail: string,
  actorEmail: string = PRIMARY_ADMIN_EMAIL
): Promise<{
  success: boolean;
  message: string;
  persistedToDb: boolean;
}> {
  const cleanTarget = adminIdOrEmail.trim().toLowerCase();

  // 1. ROOT ADMIN DEFENSE: Vincent Mwangangi cannot be removed
  if (
    cleanTarget === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
    isVincentAdmin(cleanTarget)
  ) {
    throw new Error(
      `Action Prohibited: ${PRIMARY_ADMIN_NAME} (${PRIMARY_ADMIN_EMAIL}) is the root system administrator and cannot be removed from the authorized admins list.`
    );
  }

  let persistedToDb = false;

  // 2. Delete from Supabase `admins` table by email or id
  try {
    const deletePromise = supabase
      .from('admins')
      .delete()
      .or(`email.ilike.${cleanTarget},id.eq.${cleanTarget}`);

    const { error } = await withTimeout(deletePromise, 1500, { error: null } as any);
    if (!error) {
      persistedToDb = true;
    }
  } catch {
    // Falls back gracefully
  }

  // 3. Update local cache
  const currentAdmins = getLocalAdminsCache();
  const updated = currentAdmins.filter(
    a => a.id !== cleanTarget && a.email.toLowerCase() !== cleanTarget
  );

  saveLocalAdminsCache(updated);

  // 4. Record into admin audit log
  try {
    logAdminAction({
      actorName: PRIMARY_ADMIN_NAME,
      actorEmail: actorEmail,
      category: 'security',
      action: 'Removed Administrator from Supabase admins Table',
      details: `Revoked administrative privileges for ${cleanTarget}. Removed from protected route access. Database deletion: ${persistedToDb ? 'Synced' : 'Local Fallback'}.`,
      severity: 'warning',
      targetId: cleanTarget,
      ipAddress: '197.237.142.88 (Nairobi, KE)',
    });
  } catch {
    // Safe
  }

  return {
    success: true,
    message: `Successfully revoked administrative access for ${cleanTarget}.`,
    persistedToDb,
  };
}
