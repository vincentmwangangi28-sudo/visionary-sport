import { useEffect, useState } from 'react';

export type SupabaseConnectionStatus = 'checking' | 'connected' | 'fallback';

export function useSupabaseWalkthrough() {
  const [status, setStatus] = useState<SupabaseConnectionStatus>('connected');
  const [errorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus('connected');
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    isFallback: status === 'fallback',
    errorMessage,
  };
}
