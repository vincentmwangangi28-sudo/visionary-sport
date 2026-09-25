import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const PRIMARY_ADMIN_EMAIL = 'vincentmwangangi28@gmail.com';
export const PRIMARY_ADMIN_NAME = 'Vincent Mwangangi';
const AUTHORIZED_ADMIN_LABEL = 'Authorized Administrator';

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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
        setRoleSource('Supabase user_roles (Admin)');
      } else {
        setIsAdmin(false);
        setRoleSource('Unauthorized');
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

  return {
    isAdmin,
    isPrimaryAdmin: false,
    designatedAdminName: AUTHORIZED_ADMIN_LABEL,
    designatedAdminEmail: user?.email ?? '',
    checking: authLoading || checking,
    roleSource,
    grantAdminSession: () => {
      // Admin access must be granted through Supabase user_roles.
    },
    revokeAdminSession: checkAdminStatus,
    refetch: checkAdminStatus,
  };
}
