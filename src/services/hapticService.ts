/**
 * PredictPro Mobile Haptic Feedback Service
 * Provides tactile response using the HTML5 Vibration API (navigator.vibrate),
 * Telegram Mini App HapticFeedback API, and an audio-tactile psychoacoustic impulse
 * fallback for iOS Safari / WebKit devices where navigator.vibrate is disabled by Apple.
 *
 * Supports varying intensity levels (e.g. light impact for menu taps, strong impact
 * for betting confirmations) and user-configurable global intensity scaling.
 */

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'strong' | 'soft' | 'rigid';

export type HapticPreferenceLevel = 'soft' | 'medium' | 'strong';

export type HapticPattern =
  | 'selection'        // Crisp, light tap (18ms) when tapping odds / selecting card
  | 'light'            // Subtle, light impact for menu taps, navigation, and dropdowns (10ms)
  | 'medium'           // Balanced impact for cards, toggle switches, and filters (22ms)
  | 'heavy'            // Deep, substantial impact for betting confirmations and commitments (45ms)
  | 'strong'           // Semantic alias for heavy impact
  | 'soft'             // Gentle subtle vibration (8ms)
  | 'rigid'            // Sharp, firm mechanical tap (14ms)
  | 'menuTap'          // Dedicated semantic light impact for navigation & menu taps
  | 'betConfirmation'  // Dedicated semantic strong impact for betting confirmations & bet slip commitments
  | 'success'          // Double confirmation pulse (25ms, 40ms pause, 35ms)
  | 'warning'          // Double warning buzz (35ms, 50ms pause, 35ms)
  | 'error'            // Triple alert buzz (50ms, 60ms pause, 50ms, 60ms pause, 50ms)
  | 'boost'            // Celebratory multi-pulse (30ms, 40ms pause, 45ms, 40ms pause, 60ms)
  | 'remove'           // Quick damp pulse (20ms)
  | 'clear';           // Soft double tap (18ms, 30ms pause, 18ms)

class HapticService {
  private enabled = true;
  private intensityPreference: HapticPreferenceLevel = 'medium';
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadPreference();
  }

  private loadPreference() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('predictpro_haptics_enabled');
        this.enabled = stored !== 'false';

        const storedIntensity = localStorage.getItem('predictpro_haptics_intensity') as HapticPreferenceLevel;
        if (storedIntensity === 'soft' || storedIntensity === 'medium' || storedIntensity === 'strong') {
          this.intensityPreference = storedIntensity;
        }
      }
    } catch {
      this.enabled = true;
      this.intensityPreference = 'medium';
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

  public setIntensityPreference(level: HapticPreferenceLevel) {
    this.intensityPreference = level;
    try {
      localStorage.setItem('predictpro_haptics_intensity', level);
    } catch {}
  }

  public getIntensityPreference(): HapticPreferenceLevel {
    return this.intensityPreference;
  }

  /**
   * Multiplier based on the user's preferred intensity level
   */
  private getIntensityScale(): number {
    switch (this.intensityPreference) {
      case 'soft':
        return 0.7;
      case 'strong':
        return 1.35;
      case 'medium':
      default:
        return 1.0;
    }
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
   * Uses Web Audio API to create a low-frequency damped impulse (60-140Hz)
   * that provides tactile audio confirmation without disturbing the user.
   */
  private playAudioTactileFallback(frequency = 80, durationMs = 18, baseGain = 0.06) {
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

      const scale = this.getIntensityScale();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      const effectiveGain = Math.min(0.2, baseGain * scale);
      const effectiveDuration = (durationMs * scale) / 1000;

      // Fast exponential decay to simulate physical click
      gain.gain.setValueAtTime(effectiveGain, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + effectiveDuration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + effectiveDuration);
    } catch {
      // Safe to ignore if audio context permission is awaiting first interaction
    }
  }

  /**
   * Scale vibration duration or patterns by current intensity scale
   */
  private scalePattern(pattern: number | number[]): number | number[] {
    const scale = this.getIntensityScale();
    if (typeof pattern === 'number') {
      return Math.max(5, Math.round(pattern * scale));
    }
    return pattern.map((val, idx) => {
      // Scale pulse lengths, keep pause lengths natural
      if (idx % 2 === 0) {
        return Math.max(5, Math.round(val * scale));
      }
      return val;
    });
  }

  /**
   * Trigger haptic feedback for a specific betting action or intensity level
   */
  public trigger(pattern: HapticPattern = 'selection'): boolean {
    if (!this.enabled) return false;

    // 1. Telegram WebApp HapticFeedback (for users opening in Telegram Mini App)
    const telegramHaptics = (window as any)?.Telegram?.WebApp?.HapticFeedback;
    if (telegramHaptics) {
      try {
        switch (pattern) {
          case 'light':
          case 'menuTap':
            telegramHaptics.impactOccurred?.('light');
            break;
          case 'soft':
            telegramHaptics.impactOccurred?.('soft');
            break;
          case 'rigid':
            telegramHaptics.impactOccurred?.('rigid');
            break;
          case 'medium':
            telegramHaptics.impactOccurred?.('medium');
            break;
          case 'heavy':
          case 'strong':
          case 'betConfirmation':
            telegramHaptics.impactOccurred?.('heavy');
            break;
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
        let basePattern: number | number[];
        switch (pattern) {
          // --- Light / Menu Interactions ---
          case 'light':
          case 'menuTap':
            // Crisp, brief 10ms tap for responsive, unobtrusive menu taps
            basePattern = 10;
            break;

          case 'soft':
            basePattern = 8;
            break;

          case 'rigid':
            basePattern = 14;
            break;

          // --- Medium / Card & Odds Selections ---
          case 'medium':
            basePattern = 22;
            break;

          case 'selection':
            basePattern = 18;
            break;

          // --- Strong / Betting Confirmations ---
          case 'heavy':
          case 'strong':
          case 'betConfirmation':
            // Solid, deep double pulse confirmation for high-stakes betting actions
            basePattern = [38, 25, 48];
            break;

          // --- Semantic App States ---
          case 'success':
            basePattern = [25, 40, 35];
            break;
          case 'warning':
            basePattern = [35, 50, 35];
            break;
          case 'error':
            basePattern = [50, 60, 50, 60, 50];
            break;
          case 'boost':
            basePattern = [30, 40, 45, 40, 60];
            break;
          case 'remove':
            basePattern = 20;
            break;
          case 'clear':
            basePattern = [18, 30, 18];
            break;
          default:
            basePattern = 18;
        }

        const scaled = this.scalePattern(basePattern);
        const success = navigator.vibrate(scaled);
        if (success) return true;
      } catch {
        // Fall back to audio-tactile pulse
      }
    }

    // 3. Audio-Tactile psychoacoustic fallback for iOS Safari and touch environments
    if (this.isMobile()) {
      switch (pattern) {
        // --- Light / Menu Taps ---
        case 'light':
        case 'menuTap':
          // Subtle, high-frequency short click (unobtrusive tactile tick)
          this.playAudioTactileFallback(145, 10, 0.035);
          break;

        case 'soft':
          this.playAudioTactileFallback(110, 8, 0.025);
          break;

        case 'rigid':
          this.playAudioTactileFallback(160, 12, 0.05);
          break;

        // --- Medium / Odds & Card Taps ---
        case 'medium':
          this.playAudioTactileFallback(95, 18, 0.055);
          break;

        case 'selection':
          this.playAudioTactileFallback(85, 15, 0.05);
          break;

        // --- Strong / Betting Confirmations ---
        case 'heavy':
        case 'strong':
        case 'betConfirmation':
          // Deep resonant thud (65Hz) followed by secondary tactile reinforcement
          this.playAudioTactileFallback(65, 35, 0.12);
          setTimeout(() => this.playAudioTactileFallback(90, 25, 0.08), 45);
          break;

        // --- Semantic App States ---
        case 'success':
          this.playAudioTactileFallback(110, 20, 0.06);
          setTimeout(() => this.playAudioTactileFallback(130, 25, 0.08), 50);
          break;
        case 'warning':
          this.playAudioTactileFallback(60, 30, 0.07);
          break;
        case 'error':
          this.playAudioTactileFallback(50, 40, 0.09);
          break;
        case 'boost':
          this.playAudioTactileFallback(120, 25, 0.08);
          setTimeout(() => this.playAudioTactileFallback(160, 35, 0.1), 60);
          break;
        case 'remove':
        case 'clear':
          this.playAudioTactileFallback(70, 16, 0.05);
          break;
        default:
          this.playAudioTactileFallback(80, 15, 0.05);
      }
    }

    return false;
  }

  // --- Intensity & Impact Helpers ---

  /**
   * Direct impact trigger with specific intensity
   */
  public impact(intensity: HapticIntensity = 'light'): boolean {
    return this.trigger(intensity);
  }

  /**
   * Light impact for menu taps, drawer buttons, navigation links, and small controls
   */
  public light(): boolean {
    return this.trigger('light');
  }

  /**
   * Dedicated alias for menu and navigation button taps
   */
  public menuTap(): boolean {
    return this.trigger('menuTap');
  }

  /**
   * Medium impact for card taps, filter adjustments, and toggles
   */
  public medium(): boolean {
    return this.trigger('medium');
  }

  /**
   * Heavy impact for important actions
   */
  public heavy(): boolean {
    return this.trigger('heavy');
  }

  /**
   * Strong impact for confirmations
   */
  public strong(): boolean {
    return this.trigger('strong');
  }

  /**
   * Dedicated strong impact for betting confirmations and bet slip commitments
   */
  public betConfirmation(): boolean {
    return this.trigger('betConfirmation');
  }

  /**
   * Soft subtle pulse for gentle cues
   */
  public soft(): boolean {
    return this.trigger('soft');
  }

  /**
   * Rigid crisp mechanical tap
   */
  public rigid(): boolean {
    return this.trigger('rigid');
  }

  // --- Semantic Aliases ---

  public selection(): boolean {
    return this.trigger('selection');
  }

  public success(): boolean {
    return this.trigger('success');
  }

  public warning(): boolean {
    return this.trigger('warning');
  }

  public error(): boolean {
    return this.trigger('error');
  }

  public boost(): boolean {
    return this.trigger('boost');
  }

  public remove(): boolean {
    return this.trigger('remove');
  }

  public clear(): boolean {
    return this.trigger('clear');
  }
}

export const hapticService = new HapticService();
