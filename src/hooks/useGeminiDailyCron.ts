import { useEffect, useRef } from 'react';
import { geminiDailyCronService } from '@/services/geminiDailyCron';
import { sportsNewsService } from '@/services/sportsNewsService';
import { getSavedPredictionsList } from '@/services/predictionStorage';

export function useGeminiDailyCron() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Defer non-critical background polling and news fetch to idle time
    // so critical initial paint (FCP/LCP) and main-thread responsiveness (TBT) are preserved
    let idleHandle: any = null;
    let timerHandle: any = null;

    const startServices = () => {
      setTimeout(() => {
        geminiDailyCronService.startBackgroundHeartbeat(() => getSavedPredictionsList());
      }, 0);
      setTimeout(() => {
        sportsNewsService.startAutomatedSync(15);
      }, 500);
    };

    timerHandle = setTimeout(startServices, 6000);

    return () => {
      if (idleHandle && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timerHandle) {
        clearTimeout(timerHandle);
      }
      geminiDailyCronService.stopHeartbeat();
      sportsNewsService.stopAutomatedSync();
    };
  }, []);
}

