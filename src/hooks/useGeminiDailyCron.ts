import { useEffect, useRef } from 'react';
import { geminiDailyCronService } from '@/services/geminiDailyCron';
import { sportsNewsService } from '@/services/sportsNewsService';
import { getSavedPredictionsList } from '@/services/predictionStorage';

export function useGeminiDailyCron() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Start in-browser heartbeat timer with real prediction store accessor
    geminiDailyCronService.startBackgroundHeartbeat(() => getSavedPredictionsList());

    // Start automated backend news download & sync pipeline (every 15 min)
    sportsNewsService.startAutomatedSync(15);

    return () => {
      geminiDailyCronService.stopHeartbeat();
      sportsNewsService.stopAutomatedSync();
    };
  }, []);
}

