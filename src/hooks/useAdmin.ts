import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      // The database is the only source of truth for administrator privileges.
      // Never trust localStorage, user-editable metadata, email/name allowlists,
      // or client-side role writes for authorization.
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
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, checkAdminStatus]);

  return {
    isAdmin,
    isPrimaryAdmin: false,
    designatedAdminName: undefined,
    designatedAdminEmail: undefined,
    checking: authLoading || checking,
    roleSource,
    grantAdminSession: () => {
      // Intentionally disabled: admin access must be granted server-side.
    },
    revokeAdminSession: checkAdminStatus,
    refetch: checkAdminStatus,
  };
}
