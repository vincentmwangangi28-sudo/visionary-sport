import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAdminsFromSupabase,
  addAdminToSupabase,
  removeAdminFromSupabase,
  isUserAuthorizedAdminSync,
  isUserAuthorizedAdminAsync,
  checkAdminsTableStatus,
  getLocalAdminsCache,
  saveLocalAdminsCache,
  ROOT_ADMIN_RECORD,
  SUPABASE_ADMINS_TABLE_SQL,
  CUSTOM_ADMINS_STORAGE_KEY,
} from '@/services/customAdminsService';
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';

describe('Custom Supabase admins Table Service & Route Protection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('guarantees Vincent Mwangangi as the root administrator in the cache', () => {
    const cached = getLocalAdminsCache();
    expect(cached.length).toBeGreaterThanOrEqual(1);

    const vincent = cached.find(a => a.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());
    expect(vincent).toBeDefined();
    expect(vincent?.full_name).toBe(PRIMARY_ADMIN_NAME);
    expect(vincent?.role).toBe('super_admin');
  });

  it('verifies that only authorized admins can pass the access check', () => {
    // 1. Root admin Vincent Mwangangi is always authorized
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL)).toBe(true);
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL.toUpperCase())).toBe(true);
    expect(isUserAuthorizedAdminSync({ email: PRIMARY_ADMIN_EMAIL })).toBe(true);

    // 2. Unregistered user is not authorized
    expect(isUserAuthorizedAdminSync('random_visitor@test.com')).toBe(false);
    expect(isUserAuthorizedAdminSync({ email: 'random_visitor@test.com' })).toBe(false);
    expect(isUserAuthorizedAdminSync(null)).toBe(false);
    expect(isUserAuthorizedAdminSync(undefined)).toBe(false);
    expect(isUserAuthorizedAdminSync('')).toBe(false);
  });

  it('adds a new administrator and grants them access to protected routes', async () => {
    const candidateEmail = 'new.admin@predictpro.ke';
    const candidateName = 'Grace Achieng';

    // Before adding: unauthorized
    expect(isUserAuthorizedAdminSync(candidateEmail)).toBe(false);

    // Add to custom admins table
    const result = await addAdminToSupabase({
      email: candidateEmail,
      full_name: candidateName,
      role: 'admin',
      added_by: PRIMARY_ADMIN_NAME,
      notes: 'Lead match settler and predictions reviewer',
    });

    expect(result.success).toBe(true);
    expect(result.admin.email).toBe(candidateEmail);
    expect(result.admin.full_name).toBe(candidateName);
    expect(result.admin.role).toBe('admin');

    // After adding: now authorized to access protected routes!
    expect(isUserAuthorizedAdminSync(candidateEmail)).toBe(true);
    expect(isUserAuthorizedAdminSync({ email: candidateEmail })).toBe(true);

    const isAuthAsync = await isUserAuthorizedAdminAsync(candidateEmail);
    expect(isAuthAsync).toBe(true);
  });

  it('removes an administrator and revokes access to protected routes', async () => {
    const targetEmail = 'temp.admin@predictpro.ke';

    // Add first
    await addAdminToSupabase({
      email: targetEmail,
      full_name: 'Temporary Admin',
      role: 'operations_admin',
    });

    expect(isUserAuthorizedAdminSync(targetEmail)).toBe(true);

    // Remove from custom admins table
    const removeResult = await removeAdminFromSupabase(targetEmail);
    expect(removeResult.success).toBe(true);
    expect(removeResult.message).toContain('Successfully revoked');

    // After removal: unauthorized to access protected routes
    expect(isUserAuthorizedAdminSync(targetEmail)).toBe(false);
  });

  it('strictly protects Vincent Mwangangi from being removed as root administrator', async () => {
    // Attempting to remove Vincent Mwangangi must fail and throw error
    await expect(
      removeAdminFromSupabase(PRIMARY_ADMIN_EMAIL)
    ).rejects.toThrow('Action Prohibited: Vincent Mwangangi');

    await expect(
      removeAdminFromSupabase(PRIMARY_ADMIN_EMAIL.toUpperCase())
    ).rejects.toThrow('Action Prohibited: Vincent Mwangangi');

    // Confirm Vincent is still authorized
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL)).toBe(true);
  });

  it('validates email requirement when adding an administrator', async () => {
    await expect(
      addAdminToSupabase({
        email: 'invalid-email-format',
      })
    ).rejects.toThrow('valid email address is required');

    await expect(
      addAdminToSupabase({
        email: '',
      })
    ).rejects.toThrow('valid email address is required');
  });

  it('generates the complete SQL schema script for the custom admins table', () => {
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('CREATE TABLE IF NOT EXISTS public.admins');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('ENABLE ROW LEVEL SECURITY');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('vincentmwangangi28@gmail.com');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('super_admin');
  });

  it('fetches admins and returns array containing authorized administrators', async () => {
    const { admins } = await fetchAdminsFromSupabase();
    expect(Array.isArray(admins)).toBe(true);
    expect(admins.length).toBeGreaterThanOrEqual(1);

    const hasVincent = admins.some(a => a.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());
    expect(hasVincent).toBe(true);
  });

  it('checks status of custom admins table safely without throwing', async () => {
    const status = await checkAdminsTableStatus();
    expect(status).toBeDefined();
    expect(typeof status.isTableReady).toBe('boolean');
    expect(typeof status.adminCount).toBe('number');
  });
});
