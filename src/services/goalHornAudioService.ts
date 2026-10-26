// Zero-dependency Web Audio API synthesizer for Stadium Goal Horn, xG Surge Sonar, and Referee Whistle

const AUDIO_PREF_KEY = 'predictpro_goal_horn_audio_enabled_v1';

export function isGoalHornAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(AUDIO_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setGoalHornAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_PREF_KEY, String(enabled));
  } catch {
    // ignore
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    return new AudioCtx();
  } catch {
    return null;
  }
}

/**
 * Plays a broadcast-style 2-chord Stadium Goal Horn + Chime using Web Audio API oscillators
 */
export function playStadiumGoalHorn(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Chord frequencies (F4, A4, C5, F5) for uplifting broadcast goal stinger
    const freqs = [349.23, 440.0, 523.25, 698.46];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Slight pitch swell
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07 / freqs.length, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.88);
    });

    // Second celebratory chime pulse at +0.22s
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, now + 0.22);
    chime.frequency.exponentialRampToValueAtTime(1046.5, now + 0.65);

    chimeGain.gain.setValueAtTime(0.001, now + 0.22);
    chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.26);
    chimeGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.9);

    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.22);
    chime.stop(now + 0.92);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1100);
  } catch {
    // ignore audio autoplay restriction
  }
}

/**
 * Plays a crisp tactical xG Steam Alert Sonar Ping
 */
export function playXgSteamPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // ignore
  }
}

/**
 * Plays a referee double-whistle alert
 */
export function playRefereeWhistleAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [0, 0.22].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2750, now + offset);
      osc.frequency.linearRampToValueAtTime(2920, now + offset + (idx === 1 ? 0.32 : 0.14));

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.06, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + (idx === 1 ? 0.36 : 0.16));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + (idx === 1 ? 0.38 : 0.18));
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 750);
  } catch {
    // ignore
  }
}
