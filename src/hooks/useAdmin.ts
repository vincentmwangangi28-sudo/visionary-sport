import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';
export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';

/**
 * Validates whether the provided user object or email matches Vincent Mwangangi,
 * the sole authorized administrator of PredictPro.
 */
export function isPrimaryAdmin(
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

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [roleSource, setRoleSource] = useState('');

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setRoleSource('Not authenticated');
      setChecking(false);
      return;
    }

    setChecking(true);

    try {
      const isVincent = isPrimaryAdmin(user);

      if (isVincent) {
        setIsAdmin(true);
        setRoleSource('Sole Designated Administrator (Vincent Mwangangi)');

        // Ensure database user_roles reflects admin role for Vincent Mwangangi
        supabase
          .from('user_roles')
          .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' })
          .catch(() => {});
      } else {
        // Enforce strict policy: Vincent Mwangangi is the ONLY admin
        setIsAdmin(false);
        setRoleSource('Unauthorized (Access restricted exclusively to Vincent Mwangangi)');
      }
    } catch {
      setIsAdmin(false);
      setRoleSource('Authorization check failed');
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) checkAdminStatus();
  }, [user, authLoading, checkAdminStatus]);

  const isVincent = isPrimaryAdmin(user);

  return {
    isAdmin: isVincent,
    isPrimaryAdmin: isVincent,
    designatedAdminName: PRIMARY_ADMIN_NAME,
    designatedAdminEmail: PRIMARY_ADMIN_EMAIL,
    checking: authLoading || checking,
    roleSource,
    grantAdminSession: () => {},
    revokeAdminSession: checkAdminStatus,
    refetch: checkAdminStatus,
  };
}
