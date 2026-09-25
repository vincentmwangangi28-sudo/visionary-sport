import { useState, useEffect, useCallback } from 'react';
import {
  getSupabaseConfigStatus,
  SupabaseConfigStatus,
  injectSessionSupabaseConfig,
  clearSessionSupabaseConfig,
  testSupabaseConnection,
} from '@/integrations/supabase/client';

const DISMISSED_SESSION_KEY = 'predictpro_supabase_walkthrough_dismissed';

declare global {
  interface Window {
    openSupabaseWalkthrough?: () => void;
  }
}

export function useSupabaseWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SupabaseConfigStatus>(() => getSupabaseConfigStatus());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !!window.sessionStorage.getItem(DISMISSED_SESSION_KEY);
  });

  const refreshStatus = useCallback(() => {
    setStatus(getSupabaseConfigStatus());
  }, []);

  useEffect(() => {
    const handleConfigChange = () => {
      refreshStatus();
    };

    window.addEventListener('predictpro:supabase-config-changed', handleConfigChange);

    // Global trigger for developer or admin access
    window.openSupabaseWalkthrough = () => setIsOpen(true);

    // Keyboard shortcut: Ctrl+Alt+S or Alt+S to trigger configuration walkthrough
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('predictpro:supabase-config-changed', handleConfigChange);
      window.removeEventListener('keydown', handleKeyDown);
      delete window.openSupabaseWalkthrough;
    };
  }, [refreshStatus]);

  const dismissNotice = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DISMISSED_SESSION_KEY, 'true');
    }
  }, []);

  const openWalkthrough = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeWalkthrough = useCallback(() => {
    setIsOpen(false);
  }, []);

  const inject = useCallback(
    (url: string, key: string) => {
      const res = injectSessionSupabaseConfig(url, key);
      if (res.success) {
        refreshStatus();
      }
      return res;
    },
    [refreshStatus]
  );

  const reset = useCallback(() => {
    clearSessionSupabaseConfig();
    refreshStatus();
  }, [refreshStatus]);

  return {
    isOpen,
    setIsOpen,
    openWalkthrough,
    closeWalkthrough,
    status,
    refreshStatus,
    isDismissed,
    dismissNotice,
    shouldShowFallbackNotice: status.isFallback && !isDismissed,
    inject,
    reset,
    testConnection: testSupabaseConnection,
  };
}
