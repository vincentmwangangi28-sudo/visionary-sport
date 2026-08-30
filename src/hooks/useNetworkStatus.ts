import { useState, useEffect, useCallback } from 'react';
import { 
  prewarmOfflineCaches, 
  checkOfflineCachesReady, 
  getLastSyncTime 
} from '@/services/offlineSyncService';
import { toast } from 'sonner';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  hasCachedData: boolean;
  lastSyncedAt: string | null;
  syncOfflineData: () => Promise<void>;
  isSyncing: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasCachedData, setHasCachedData] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(getLastSyncTime());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Check cached data status
  useEffect(() => {
    checkOfflineCachesReady().then(setHasCachedData);
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Please connect to the internet.');
      return;
    }

    setIsSyncing(true);
    try {
      await prewarmOfflineCaches();
      setHasCachedData(true);
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      toast.success('Offline match data & team logos cached successfully!', {
        description: 'You can now view match predictions and badges even without internet.',
      });
    } catch (err) {
      toast.error('Failed to cache offline data. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing latest match predictions...', {
        duration: 3000,
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are offline. Offline cache activated for matches & logos.', {
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  return {
    isOnline,
    isOffline: !isOnline,
    hasCachedData,
    lastSyncedAt,
    syncOfflineData,
    isSyncing,
  };
}
