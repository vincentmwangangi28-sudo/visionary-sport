import { useCallback } from 'react';

/**
 * PredictPro is 100% free — there are no daily view limits or paywalls.
 */
export const useFreeTierLimit = () => {
  const recordView = useCallback(() => true, []);

  return {
    viewsToday: 0,
    limitReached: false,
    remainingViews: Infinity,
    dailyLimit: Infinity,
    recordView,
    isPremium: true,
  };
};
