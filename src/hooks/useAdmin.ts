import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  isUserAuthorizedAdminSync,
  isUserAuthorizedAdminAsync,
  CUSTOM_ADMINS_UPDATED_EVENT,
} from '@/services/customAdminsService';

export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';
export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';

/**
 * Validates whether the provided user object or email matches Vincent Mwangangi,
 * the designated root administrator of PredictPro.
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
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!user) return false;
    return isPrimaryAdmin(user) || isUserAuthorizedAdminSync(user);
  });
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
        setRoleSource('Root Designated Administrator (Vincent Mwangangi)');

        // Ensure database reflects admin record for Vincent Mwangangi
        try {
          await supabase
            .from('admins')
            .upsert(
              {
                email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
                full_name: PRIMARY_ADMIN_NAME,
                role: 'super_admin',
                added_by: 'system',
                notes: 'Root Primary Designated Administrator',
                is_active: true,
              },
              { onConflict: 'email' }
            );
        } catch {
          // Safe fallback
        }
      } else {
        // Single Administrator Architecture: Vincent Mwangangi is the ONLY admin
        setIsAdmin(false);
        setRoleSource('Unauthorized (Access restricted exclusively to Vincent Mwangangi)');
      }
    } catch {
      // Fallback to local synchronous check
      const fallback = isPrimaryAdmin(user) || isUserAuthorizedAdminSync(user);
      setIsAdmin(fallback);
      setRoleSource(fallback ? 'Authorized Administrator (Cached)' : 'Authorization check failed');
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, checkAdminStatus]);

  // Listen to custom admins table updates
  useEffect(() => {
    const handleAdminsUpdate = () => {
      checkAdminStatus();
    };

    window.addEventListener(CUSTOM_ADMINS_UPDATED_EVENT, handleAdminsUpdate);
    return () => {
      window.removeEventListener(CUSTOM_ADMINS_UPDATED_EVENT, handleAdminsUpdate);
    };
  }, [checkAdminStatus]);

  const isVincent = isPrimaryAdmin(user);

  return {
    isAdmin: !!isAdmin,
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
