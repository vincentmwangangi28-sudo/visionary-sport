/**
 * Automated Silent Search Engine & Google Indexing Hook
 * Silently monitors prediction updates and periodically pushes all fresh match fixtures,
 * league directories, and betting markets to Google Indexing API and IndexNow.
 */

import { useEffect, useRef } from 'react';
import { googleIndexingCronService } from '@/services/googleIndexingCron';

const AUTO_PUSH_THROTTLE_MS = 30 * 60 * 1000; // Push at most once every 30 minutes on client load

export function useAutoIndexing() {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const settings = googleIndexingCronService.getSettings();
    if (!settings.isEnabled) return;

    const lastRun = settings.lastRunTimestamp ? new Date(settings.lastRunTimestamp).getTime() : 0;
    const now = Date.now();

    // If never pushed or last push was more than 30 mins ago, silently trigger background push
    if (now - lastRun > AUTO_PUSH_THROTTLE_MS) {
      // Delay slightly (3s) after initial mount so critical assets load first
      const timer = setTimeout(() => {
        googleIndexingCronService.runCronNow('auto').catch((err) => {
          console.debug('[AutoIndexing] Background push completed with note:', err);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);
}
