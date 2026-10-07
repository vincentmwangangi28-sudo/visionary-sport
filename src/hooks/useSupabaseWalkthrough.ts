import { useState, useCallback, useEffect } from 'react';
import {
  getSupabaseConfigStatus,
  injectSessionSupabaseConfig,
  clearSessionSupabaseConfig,
  SupabaseConfigStatus,
  supabase,
} from '@/integrations/supabase/client';

export function useSupabaseWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SupabaseConfigStatus>(() => getSupabaseConfigStatus());
  const [isDismissed, setIsDismissed] = useState(false);

  const refreshStatus = useCallback(() => {
    setStatus(getSupabaseConfigStatus());
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const openWalkthrough = useCallback(() => setIsOpen(true), []);
  const closeWalkthrough = useCallback(() => setIsOpen(false), []);

  const inject = useCallback((url: string, key: string) => {
    const res = injectSessionSupabaseConfig(url, key);
    refreshStatus();
    return res;
  }, [refreshStatus]);

  const reset = useCallback(() => {
    clearSessionSupabaseConfig();
    refreshStatus();
  }, [refreshStatus]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.from('predictions').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully connected to Supabase database.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection test failed' };
    }
  }, []);

  const dismissNotice = useCallback(() => setIsDismissed(true), []);

  return {
    isOpen,
    status,
    openWalkthrough,
    closeWalkthrough,
    inject,
    reset,
    testConnection,
    shouldShowFallbackNotice: !isDismissed && status.isFallback,
    dismissNotice,
    // Backwards-compatible fields
    isConnected: !status.isFallback,
    isFallback: status.isFallback,
    errorMessage: null,
  };
}

