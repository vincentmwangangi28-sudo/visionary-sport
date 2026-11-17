/**
 * Flashscore-Style Web Audio API Notification Engine
 *
 * Synthesizes distinct, zero-dependency acoustic alerts using the browser's
 * native Web Audio API for fixtures tracked in the active Bet Slip:
 * - 'goal': Classic Flashscore ascending 4-note stadium chime + warm brass triad
 * - 'red_card': Referee double-whistle trill + urgent minor-second dismissal stinger
 * - 'var_check': Broadcast VAR review electronic 3-pulse telemetry tone
 */

export type FlashscoreAlertType = 'goal' | 'red_card' | 'var_check';

export interface BetSlipAudioEventRecord {
  id: string;
  type: FlashscoreAlertType;
  match: string;
  homeTeam: string;
  awayTeam: string;
  detail: string;
  minute: string;
  timestamp: string;
}

const AUDIO_PREF_KEY = 'predictpro_goal_horn_audio_enabled_v1';
const AUDIO_VOLUME_KEY = 'predictpro_flashscore_audio_volume_v1';

let sharedAudioCtx: AudioContext | null = null;

export function isGoalHornAudioEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(AUDIO_PREF_KEY);
    // Enabled by default for active bet slip tracking unless explicitly muted
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setGoalHornAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_PREF_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
}

export function getFlashscoreAudioVolume(): number {
  if (typeof window === 'undefined') return 0.8;
  try {
    const raw = localStorage.getItem(AUDIO_VOLUME_KEY);
    if (!raw) return 0.8;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0.1, parsed)) : 0.8;
  } catch {
    return 0.8;
  }
}

export function setFlashscoreAudioVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.min(1, Math.max(0.1, volume));
    localStorage.setItem(AUDIO_VOLUME_KEY, String(clamped));
  } catch {
    // ignore
  }
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * 1. GOAL ALERT (Flashscore-style 4-note ascending stadium bell chime + warm chord)
 * Notes: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
 */
export function playFlashscoreGoalAlert(volumeOverride?: number): boolean {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  const vol = volumeOverride ?? getFlashscoreAudioVolume();

  try {
    const now = ctx.currentTime;

    // Crisp Flashscore 4-note ascending chime arpeggio
    const chimeNotes = [
      { freq: 523.25, start: 0.0, duration: 0.16 },   // C5
      { freq: 659.25, start: 0.11, duration: 0.16 },  // E5
      { freq: 783.99, start: 0.22, duration: 0.18 },  // G5
      { freq: 1046.5, start: 0.34, duration: 0.55 },  // C6 (sustained bell peak)
    ];

    chimeNotes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.16 * vol, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });

    // Warm underlying stadium brass chord (F4, A4, C5)
    const chordFreqs = [349.23, 440.0, 523.25];
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.34);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.85);

      gain.gain.setValueAtTime(0.001, now + 0.34);
      gain.gain.linearRampToValueAtTime((0.09 * vol) / chordFreqs.length, now + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.92);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.34);
      osc.stop(now + 0.95);
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * 2. RED CARD ALERT (Sharp referee whistle pea-trill + descending dismissal stinger)
 */
export function playFlashscoreRedCardAlert(volumeOverride?: number): boolean {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  const vol = volumeOverride ?? getFlashscoreAudioVolume();

  try {
    const now = ctx.currentTime;

    // Two sharp referee whistle blasts with high-frequency pea modulation
    [0.0, 0.20].forEach((offset, idx) => {
      const duration = idx === 1 ? 0.28 : 0.14;
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const mainGain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(2840, now + offset);
      carrier.frequency.linearRampToValueAtTime(2980, now + offset + duration);

      // Whistle pea trill at 42 Hz
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(42, now + offset);
      modGain.gain.setValueAtTime(95, now + offset);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      mainGain.gain.setValueAtTime(0.001, now + offset);
      mainGain.gain.linearRampToValueAtTime(0.11 * vol, now + offset + 0.015);
      mainGain.gain.exponentialRampToValueAtTime(0.0008, now + offset + duration);

      carrier.connect(mainGain);
      mainGain.connect(ctx.destination);

      carrier.start(now + offset);
      modulator.start(now + offset);
      carrier.stop(now + offset + duration + 0.02);
      modulator.stop(now + offset + duration + 0.02);
    });

    // Low cautionary descending two-tone stinger (F#4 -> D#4) at +0.50s
    const stingerNotes = [
      { freq: 369.99, start: 0.50, duration: 0.16 },
      { freq: 311.13, start: 0.67, duration: 0.28 },
    ];
    stingerNotes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.09 * vol, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * 3. VAR CHECK ALERT (Electronic broadcast 3-pulse telemetry sonar tone)
 * Signals an active Video Assistant Referee (VAR) goal/penalty/red-card check
 */
export function playFlashscoreVarCheckAlert(volumeOverride?: number): boolean {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  const vol = volumeOverride ?? getFlashscoreAudioVolume();

  try {
    const now = ctx.currentTime;

    // 3-pulse electronic broadcast VAR sonar (A5 -> E5 -> A5)
    const pulses = [
      { freq: 880.0, start: 0.0, duration: 0.11 },
      { freq: 659.25, start: 0.14, duration: 0.11 },
      { freq: 880.0, start: 0.28, duration: 0.22 },
    ];

    pulses.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.13 * vol, now + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Unified dispatcher for Flashscore-style Bet Slip audio alerts.
 */
export function triggerFlashscoreSlipAlert(
  type: FlashscoreAlertType,
  options?: { forcePlay?: boolean; volume?: number }
): boolean {
  if (!options?.forcePlay && !isGoalHornAudioEnabled()) {
    return false;
  }

  switch (type) {
    case 'goal':
      return playFlashscoreGoalAlert(options?.volume);
    case 'red_card':
      return playFlashscoreRedCardAlert(options?.volume);
    case 'var_check':
      return playFlashscoreVarCheckAlert(options?.volume);
    default:
      return false;
  }
}

// Backwards-compatible aliases used across other pages
export function playStadiumGoalHorn(): void {
  playFlashscoreGoalAlert();
}

export function playXgSteamPing(): void {
  playFlashscoreVarCheckAlert();
}

export function playRefereeWhistleAlert(): void {
  playFlashscoreRedCardAlert();
}
