/**
 * PredictPro Mobile Haptic Feedback Service
 * Provides tactile response using the HTML5 Vibration API (navigator.vibrate),
 * Telegram Mini App HapticFeedback API, and an audio-tactile psychoacoustic click
 * fallback for iOS Safari / WebKit devices where navigator.vibrate is disabled by Apple.
 */

export type HapticPattern =
  | 'selection'  // Crisp, light tap (18ms) when tapping odds / adding item to bet slip
  | 'success'    // Double confirmation pulse (25ms, 40ms pause, 35ms) when loading multiple picks / smart slip
  | 'warning'    // Double warning buzz (35ms, 50ms pause, 35ms) for duplicate item or replaced market
  | 'error'      // Triple alert buzz (50ms, 60ms pause, 50ms, 60ms pause, 50ms) for max 15 selections limit
  | 'boost'      // Celebratory multi-pulse (30ms, 40ms pause, 45ms, 40ms pause, 60ms) for accumulator boost milestone
  | 'remove'     // Quick damp pulse (20ms) when removing a leg
  | 'clear';     // Soft double tap (18ms, 30ms pause, 18ms) when clearing the slip

class HapticService {
  private enabled = true;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadPreference();
  }

  private loadPreference() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('predictpro_haptics_enabled');
        this.enabled = stored !== 'false';
      }
    } catch {
      this.enabled = true;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('predictpro_haptics_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if the device natively supports the Vibration API or Telegram Haptics
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      (typeof navigator !== 'undefined' && 'vibrate' in navigator) ||
      !!(window as any).Telegram?.WebApp?.HapticFeedback
    );
  }

  /**
   * Detect if device is mobile or has touch interaction
   */
  public isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && (
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      ))
    );
  }

  /**
   * Psychoacoustic tactile thump fallback for iOS Safari / WebKit devices
   * Uses Web Audio API to create a low-frequency damped impulse (80-120Hz)
   * that provides tactile audio confirmation without disturbing the user.
   */
  private playAudioTactileFallback(frequency = 80, durationMs = 18) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      // Fast exponential decay to simulate physical click
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + (durationMs / 1000));

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + (durationMs / 1000));
    } catch {
      // Safe to ignore if audio context permission is awaiting first interaction
    }
  }

  /**
   * Trigger haptic feedback for a specific betting action
   */
  public trigger(pattern: HapticPattern = 'selection'): boolean {
    if (!this.enabled) return false;

    // 1. Telegram WebApp HapticFeedback (for users opening in Telegram Mini App)
    const telegramHaptics = (window as any)?.Telegram?.WebApp?.HapticFeedback;
    if (telegramHaptics) {
      try {
        switch (pattern) {
          case 'selection':
            telegramHaptics.selectionChanged?.();
            break;
          case 'success':
            telegramHaptics.notificationOccurred?.('success');
            break;
          case 'warning':
            telegramHaptics.notificationOccurred?.('warning');
            break;
          case 'error':
            telegramHaptics.notificationOccurred?.('error');
            break;
          case 'boost':
            telegramHaptics.impactOccurred?.('heavy');
            break;
          case 'remove':
          case 'clear':
            telegramHaptics.impactOccurred?.('medium');
            break;
          default:
            telegramHaptics.impactOccurred?.('light');
        }
        return true;
      } catch {}
    }

    // 2. Native HTML5 Vibration API (Android Chrome, Firefox, Opera, Edge, PWAs)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        let vibrationPattern: number | number[];
        switch (pattern) {
          case 'selection':
            // Crisp, quick single tap (18ms)
            vibrationPattern = 18;
            break;
          case 'success':
            // Double confirmation pulse
            vibrationPattern = [25, 40, 35];
            break;
          case 'warning':
            // Double warning buzz
            vibrationPattern = [35, 50, 35];
            break;
          case 'error':
            // Triple alert buzz
            vibrationPattern = [50, 60, 50, 60, 50];
            break;
          case 'boost':
            // Ascending celebratory pulse
            vibrationPattern = [30, 40, 45, 40, 60];
            break;
          case 'remove':
            vibrationPattern = 20;
            break;
          case 'clear':
            vibrationPattern = [18, 30, 18];
            break;
          default:
            vibrationPattern = 18;
        }

        const success = navigator.vibrate(vibrationPattern);
        if (success) return true;
      } catch {
        // Fall back to audio-tactile pulse
      }
    }

    // 3. Audio-Tactile psychoacoustic fallback for iOS Safari and desktop simulators
    if (this.isMobile()) {
      switch (pattern) {
        case 'selection':
          this.playAudioTactileFallback(85, 15);
          break;
        case 'success':
          this.playAudioTactileFallback(110, 20);
          setTimeout(() => this.playAudioTactileFallback(130, 25), 50);
          break;
        case 'warning':
          this.playAudioTactileFallback(60, 30);
          break;
        case 'error':
          this.playAudioTactileFallback(50, 40);
          break;
        case 'boost':
          this.playAudioTactileFallback(120, 25);
          setTimeout(() => this.playAudioTactileFallback(160, 35), 60);
          break;
        case 'remove':
        case 'clear':
          this.playAudioTactileFallback(70, 16);
          break;
        default:
          this.playAudioTactileFallback(80, 15);
      }
    }

    return false;
  }

  // Convenient semantic aliases
  public selection() {
    return this.trigger('selection');
  }

  public success() {
    return this.trigger('success');
  }

  public warning() {
    return this.trigger('warning');
  }

  public error() {
    return this.trigger('error');
  }

  public boost() {
    return this.trigger('boost');
  }

  public remove() {
    return this.trigger('remove');
  }

  public clear() {
    return this.trigger('clear');
  }
}

export const hapticService = new HapticService();
