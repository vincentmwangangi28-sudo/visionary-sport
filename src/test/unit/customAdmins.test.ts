import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAdminsFromSupabase,
  addAdminToSupabase,
  removeAdminFromSupabase,
  isUserAuthorizedAdminSync,
  isUserAuthorizedAdminAsync,
  checkAdminsTableStatus,
  getLocalAdminsCache,
  ROOT_ADMIN_RECORD,
  SUPABASE_ADMINS_TABLE_SQL,
} from '@/services/customAdminsService';
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_NAME } from '@/hooks/useAdmin';

describe('Sole Administrator Policy & Route Protection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('guarantees Vincent Mwangangi as the only administrator in the system', () => {
    const cached = getLocalAdminsCache();
    expect(cached.length).toBe(1);

    const soleAdmin = cached[0];
    expect(soleAdmin.email.toLowerCase()).toBe(PRIMARY_ADMIN_EMAIL.toLowerCase());
    expect(soleAdmin.full_name).toBe(PRIMARY_ADMIN_NAME);
    expect(soleAdmin.role).toBe('super_admin');
  });

  it('verifies that ONLY Vincent Mwangangi passes the access check', async () => {
    // 1. Root admin Vincent Mwangangi is authorized
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL)).toBe(true);
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL.toUpperCase())).toBe(true);
    expect(isUserAuthorizedAdminSync({ email: PRIMARY_ADMIN_EMAIL })).toBe(true);
    expect(await isUserAuthorizedAdminAsync(PRIMARY_ADMIN_EMAIL)).toBe(true);

    // 2. Any other user is strictly unauthorized
    expect(isUserAuthorizedAdminSync('random_visitor@test.com')).toBe(false);
    expect(isUserAuthorizedAdminSync({ email: 'random_visitor@test.com' })).toBe(false);
    expect(isUserAuthorizedAdminSync('brian.omondi@predictpro.ke')).toBe(false);
    expect(isUserAuthorizedAdminSync(null)).toBe(false);
    expect(isUserAuthorizedAdminSync(undefined)).toBe(false);
    expect(isUserAuthorizedAdminSync('')).toBe(false);
    expect(await isUserAuthorizedAdminAsync('attacker@example.com')).toBe(false);
  });

  it('enforces single administrator rule when attempting to add another admin', async () => {
    const candidateEmail = 'new.admin@predictpro.ke';

    // Adding another user must be rejected with single administrator policy notice
    await expect(
      addAdminToSupabase({
        email: candidateEmail,
        full_name: 'Secondary Admin',
      })
    ).rejects.toThrow('Single Administrator Policy Active');

    // Candidate remains unauthorized
    expect(isUserAuthorizedAdminSync(candidateEmail)).toBe(false);
  });

  it('confirms Vincent Mwangangi can be safely verified and upserted', async () => {
    const result = await addAdminToSupabase({
      email: PRIMARY_ADMIN_EMAIL,
      full_name: PRIMARY_ADMIN_NAME,
      role: 'super_admin',
    });

    expect(result.success).toBe(true);
    expect(result.admin.email).toBe(PRIMARY_ADMIN_EMAIL.toLowerCase());
  });

  it('strictly protects Vincent Mwangangi from being removed as the sole administrator', async () => {
    await expect(
      removeAdminFromSupabase(PRIMARY_ADMIN_EMAIL)
    ).rejects.toThrow('Action Prohibited: Vincent Mwangangi');

    await expect(
      removeAdminFromSupabase(PRIMARY_ADMIN_EMAIL.toUpperCase())
    ).rejects.toThrow('Action Prohibited: Vincent Mwangangi');

    // Confirm Vincent is still authorized
    expect(isUserAuthorizedAdminSync(PRIMARY_ADMIN_EMAIL)).toBe(true);
  });

  it('validates email requirement when checking admin operations', async () => {
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

  it('generates the complete SQL schema script for the sole administrator table', () => {
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('CREATE TABLE IF NOT EXISTS public.admins');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('ENABLE ROW LEVEL SECURITY');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('vincentmwangangi28@gmail.com');
    expect(SUPABASE_ADMINS_TABLE_SQL).toContain('super_admin');
  });

  it('fetches admins and returns array containing solely Vincent Mwangangi', async () => {
    const { admins } = await fetchAdminsFromSupabase();
    expect(Array.isArray(admins)).toBe(true);
    expect(admins.length).toBe(1);

    expect(admins[0].email.toLowerCase()).toBe(PRIMARY_ADMIN_EMAIL.toLowerCase());
    expect(admins[0].full_name).toBe(PRIMARY_ADMIN_NAME);
  });

  it('checks status of sole admin table safely without throwing', async () => {
    const status = await checkAdminsTableStatus();
    expect(status).toBeDefined();
    expect(typeof status.isTableReady).toBe('boolean');
    expect(status.adminCount).toBe(1);
  });
});
