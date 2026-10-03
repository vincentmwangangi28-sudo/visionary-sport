import { useState, useCallback } from 'react';
import {
  hapticService,
  HapticPattern,
  HapticIntensity,
  HapticPreferenceLevel,
} from '@/services/hapticService';

export function useHaptics() {
  const [isEnabled, setIsEnabledState] = useState(() => hapticService.isEnabled());
  const [intensity, setIntensityState] = useState<HapticPreferenceLevel>(() =>
    hapticService.getIntensityPreference()
  );
  const [isSupported] = useState(() => hapticService.isSupported());
  const [isMobile] = useState(() => hapticService.isMobile());

  const setEnabled = useCallback((enabled: boolean) => {
    hapticService.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const setIntensity = useCallback((level: HapticPreferenceLevel) => {
    hapticService.setIntensityPreference(level);
    setIntensityState(level);
  }, []);

  const triggerHaptic = useCallback((pattern: HapticPattern = 'selection') => {
    return hapticService.trigger(pattern);
  }, []);

  const impact = useCallback((level: HapticIntensity = 'light') => {
    return hapticService.impact(level);
  }, []);

  return {
    isEnabled,
    intensity,
    isSupported,
    isMobile,
    setEnabled,
    setIntensity,
    triggerHaptic,
    impact,
    haptic: {
      selection: () => hapticService.selection(),
      light: () => hapticService.light(),
      medium: () => hapticService.medium(),
      heavy: () => hapticService.heavy(),
      strong: () => hapticService.strong(),
      soft: () => hapticService.soft(),
      rigid: () => hapticService.rigid(),
      menuTap: () => hapticService.menuTap(),
      betConfirmation: () => hapticService.betConfirmation(),
      success: () => hapticService.success(),
      warning: () => hapticService.warning(),
      error: () => hapticService.error(),
      boost: () => hapticService.boost(),
      remove: () => hapticService.remove(),
      clear: () => hapticService.clear(),
    },
  };
}
