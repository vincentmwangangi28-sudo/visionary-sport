import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hapticService, HapticIntensity } from '@/services/hapticService';

describe('HapticService and UI Tactile Feedback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    hapticService.setEnabled(true);
    hapticService.setIntensityPreference('medium');
  });

  afterEach(() => {
    hapticService.setEnabled(true);
    hapticService.setIntensityPreference('medium');
  });

  it('initializes with enabled state and persists preference in localStorage', () => {
    expect(hapticService.isEnabled()).toBe(true);

    hapticService.setEnabled(false);
    expect(hapticService.isEnabled()).toBe(false);
    expect(localStorage.getItem('predictpro_haptics_enabled')).toBe('false');

    hapticService.setEnabled(true);
    expect(hapticService.isEnabled()).toBe(true);
    expect(localStorage.getItem('predictpro_haptics_enabled')).toBe('true');
  });

  it('manages and persists user intensity preference', () => {
    expect(hapticService.getIntensityPreference()).toBe('medium');

    hapticService.setIntensityPreference('soft');
    expect(hapticService.getIntensityPreference()).toBe('soft');
    expect(localStorage.getItem('predictpro_haptics_intensity')).toBe('soft');

    hapticService.setIntensityPreference('strong');
    expect(hapticService.getIntensityPreference()).toBe('strong');
    expect(localStorage.getItem('predictpro_haptics_intensity')).toBe('strong');

    hapticService.setIntensityPreference('medium');
    expect(hapticService.getIntensityPreference()).toBe('medium');
    expect(localStorage.getItem('predictpro_haptics_intensity')).toBe('medium');
  });

  it('safely handles isSupported and isMobile detection', () => {
    const supported = hapticService.isSupported();
    expect(typeof supported).toBe('boolean');

    const mobile = hapticService.isMobile();
    expect(typeof mobile).toBe('boolean');
  });

  it('triggers all defined haptic patterns without errors', () => {
    const patterns = [
      'selection',
      'light',
      'medium',
      'heavy',
      'strong',
      'soft',
      'rigid',
      'menuTap',
      'betConfirmation',
      'success',
      'warning',
      'error',
      'boost',
      'remove',
      'clear',
    ] as const;

    for (const pattern of patterns) {
      expect(() => hapticService.trigger(pattern)).not.toThrow();
    }
  });

  it('executes impact methods with all intensity levels', () => {
    const intensities: HapticIntensity[] = ['light', 'medium', 'heavy', 'strong', 'soft', 'rigid'];
    for (const level of intensities) {
      expect(() => hapticService.impact(level)).not.toThrow();
    }
  });

  it('executes semantic alias methods properly including menuTap and betConfirmation', () => {
    expect(() => hapticService.selection()).not.toThrow();
    expect(() => hapticService.light()).not.toThrow();
    expect(() => hapticService.menuTap()).not.toThrow();
    expect(() => hapticService.medium()).not.toThrow();
    expect(() => hapticService.heavy()).not.toThrow();
    expect(() => hapticService.strong()).not.toThrow();
    expect(() => hapticService.betConfirmation()).not.toThrow();
    expect(() => hapticService.soft()).not.toThrow();
    expect(() => hapticService.rigid()).not.toThrow();
    expect(() => hapticService.success()).not.toThrow();
    expect(() => hapticService.warning()).not.toThrow();
    expect(() => hapticService.error()).not.toThrow();
    expect(() => hapticService.boost()).not.toThrow();
    expect(() => hapticService.remove()).not.toThrow();
    expect(() => hapticService.clear()).not.toThrow();
  });

  it('respects the enabled flag and returns false when muted', () => {
    hapticService.setEnabled(false);
    const result = hapticService.trigger('selection');
    expect(result).toBe(false);
  });

  it('calls navigator.vibrate with light impact for menu taps and strong impact for bet confirmations', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', {
      ...navigator,
      vibrate: vibrateMock,
    });

    // Test menu tap (light 10ms at 1.0x medium preference)
    hapticService.menuTap();
    expect(vibrateMock).toHaveBeenLastCalledWith(10);

    // Test light impact helper
    hapticService.light();
    expect(vibrateMock).toHaveBeenLastCalledWith(10);

    // Test bet confirmation (strong dual pulse [38, 25, 48] at 1.0x)
    hapticService.betConfirmation();
    expect(vibrateMock).toHaveBeenLastCalledWith([38, 25, 48]);

    // Test heavy / strong impact
    hapticService.heavy();
    expect(vibrateMock).toHaveBeenLastCalledWith([38, 25, 48]);

    // Test medium impact (22ms)
    hapticService.medium();
    expect(vibrateMock).toHaveBeenLastCalledWith(22);

    // Test soft impact (8ms)
    hapticService.soft();
    expect(vibrateMock).toHaveBeenLastCalledWith(8);

    // Test rigid impact (14ms)
    hapticService.rigid();
    expect(vibrateMock).toHaveBeenLastCalledWith(14);
  });

  it('scales vibration durations based on user intensity preference', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', {
      ...navigator,
      vibrate: vibrateMock,
    });

    // 1. Soft preference (0.7x scale)
    hapticService.setIntensityPreference('soft');
    hapticService.menuTap(); // 10ms * 0.7 = 7ms
    expect(vibrateMock).toHaveBeenLastCalledWith(7);

    hapticService.medium(); // 22ms * 0.7 = 15ms
    expect(vibrateMock).toHaveBeenLastCalledWith(15);

    hapticService.betConfirmation(); // [38, 25, 48] -> 38*0.7=27, 25 unscaled pause, 48*0.7=34
    expect(vibrateMock).toHaveBeenLastCalledWith([27, 25, 34]);

    // 2. Strong preference (1.35x scale)
    hapticService.setIntensityPreference('strong');
    hapticService.menuTap(); // 10ms * 1.35 = 14ms
    expect(vibrateMock).toHaveBeenLastCalledWith(14);

    hapticService.betConfirmation(); // 38*1.35=51, pause 25, 48*1.35=65
    expect(vibrateMock).toHaveBeenLastCalledWith([51, 25, 65]);
  });

  it('interfaces with Telegram Mini App HapticFeedback when available', () => {
    const impactMock = vi.fn();
    const selectionMock = vi.fn();
    const notifMock = vi.fn();

    vi.stubGlobal('Telegram', {
      WebApp: {
        HapticFeedback: {
          impactOccurred: impactMock,
          selectionChanged: selectionMock,
          notificationOccurred: notifMock,
        },
      },
    });

    hapticService.menuTap();
    expect(impactMock).toHaveBeenCalledWith('light');

    hapticService.betConfirmation();
    expect(impactMock).toHaveBeenCalledWith('heavy');

    hapticService.medium();
    expect(impactMock).toHaveBeenCalledWith('medium');

    hapticService.selection();
    expect(selectionMock).toHaveBeenCalled();

    hapticService.success();
    expect(notifMock).toHaveBeenCalledWith('success');
  });
});
