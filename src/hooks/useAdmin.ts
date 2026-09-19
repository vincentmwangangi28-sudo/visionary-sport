import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';
export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';

const ADMIN_OVERRIDE_KEY = 'predictpro_admin_override';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [roleSource, setRoleSource] = useState<string>('');

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsPrimaryAdmin(false);
      setChecking(false);
      // Clean up any stale local overrides when logged out
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_OVERRIDE_KEY);
      }
      return;
    }

    setChecking(true);

    const userEmail = (user.email || '').toLowerCase().trim();
    const metaFullName = (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.user_name ||
      ''
    ).toLowerCase().trim();

    // 1. Verify Designated Primary Admin: Vincent Mwangangi
    const isVincentEmail = userEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
    const isVincentName = metaFullName === 'vincent mwangangi' || metaFullName.includes('vincent mwangangi');

    if (isVincentEmail || isVincentName) {
      setIsAdmin(true);
      setIsPrimaryAdmin(true);
      setRoleSource('Designated Primary Admin (Vincent Mwangangi)');
      setChecking(false);

      // Secure local session indicator for Vincent
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_OVERRIDE_KEY, 'true');
      }

      // Persist / ensure admin role in database table
      try {
        await supabase
          .from('user_roles')
          .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' });
      } catch {
        // Non-blocking if table constraints differ
      }
      return;
    }

    // 2. Check user metadata for explicit admin role
    if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
      setIsAdmin(true);
      setIsPrimaryAdmin(false);
      setRoleSource('User Metadata Role');
      setChecking(false);
      return;
    }

    // 3. Query user_roles table in Supabase for authorized system administrators
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
        setIsPrimaryAdmin(false);
        setRoleSource('Database user_roles (Admin)');
        setChecking(false);
        return;
      }
    } catch {
      // Database check fallback
    }

    // 4. Check locally synchronized role assignments
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('predictpro_assigned_admin_roles_v1');
        if (raw) {
          const roles = JSON.parse(raw);
          const userRec = roles[user.id] || (user.email ? roles[user.email.toLowerCase()] : null);
          if (userRec?.role === 'admin') {
            setIsAdmin(true);
            setIsPrimaryAdmin(false);
            setRoleSource('Admin Role Assignment (Active)');
            setChecking(false);
            return;
          }
        }
      } catch {
        // safe fallback
      }
    }

    // 5. Default: User is NOT authorized.
    // Strictly remove any spoofed local storage overrides to prevent unauthorized access.
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_OVERRIDE_KEY);
    }

    setIsAdmin(false);
    setIsPrimaryAdmin(false);
    setRoleSource('Unauthorized (Standard User)');
    setChecking(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }

    const handleRoleUpdate = () => {
      checkAdminStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('predictpro:admin-roles-updated', handleRoleUpdate);
      return () => {
        window.removeEventListener('predictpro:admin-roles-updated', handleRoleUpdate);
      };
    }
  }, [user, authLoading, checkAdminStatus]);

  // Only Vincent Mwangangi or authorized admin can initiate local session refresh
  const grantAdminSession = () => {
    if (user && (user.email?.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase())) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_OVERRIDE_KEY, 'true');
        setIsAdmin(true);
        setIsPrimaryAdmin(true);
        setRoleSource('Designated Primary Admin (Vincent Mwangangi)');
      }
    }
  };

  const revokeAdminSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_OVERRIDE_KEY);
      checkAdminStatus();
    }
  };

  return {
    isAdmin,
    isPrimaryAdmin,
    designatedAdminName: PRIMARY_ADMIN_NAME,
    designatedAdminEmail: PRIMARY_ADMIN_EMAIL,
    checking: authLoading || checking,
    roleSource,
    grantAdminSession,
    revokeAdminSession,
    refetch: checkAdminStatus,
  };
}
