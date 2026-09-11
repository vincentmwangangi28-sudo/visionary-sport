import { useState, useEffect, useCallback } from 'react';
import { hapticService, HapticPattern } from '@/services/hapticService';

export function useHaptics() {
  const [isEnabled, setIsEnabledState] = useState(() => hapticService.isEnabled());
  const [isSupported] = useState(() => hapticService.isSupported());
  const [isMobile] = useState(() => hapticService.isMobile());

  const setEnabled = useCallback((enabled: boolean) => {
    hapticService.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const triggerHaptic = useCallback((pattern: HapticPattern = 'selection') => {
    return hapticService.trigger(pattern);
  }, []);

  return {
    isEnabled,
    isSupported,
    isMobile,
    setEnabled,
    triggerHaptic,
    haptic: {
      selection: () => hapticService.selection(),
      success: () => hapticService.success(),
      warning: () => hapticService.warning(),
      error: () => hapticService.error(),
      boost: () => hapticService.boost(),
      remove: () => hapticService.remove(),
      clear: () => hapticService.clear(),
    },
  };
}
