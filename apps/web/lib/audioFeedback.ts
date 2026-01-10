/**
 * Audio feedback utilities for the FaceCapture component
 */

// Global AudioContext reference
let audioCtx: AudioContext | null = null;

// Helper to get or create the AudioContext
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Plays a modern, polished capture sound effect using Web Audio API
 * Uses a sine wave with a gain envelope and high-pass filter for a clean digital beep.
 * 
 * @example
 * ```typescript
 * playCaptureSound(); // Plays the sound effect
 * ```
 */
export function playCaptureSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (required for some browsers/mobile)
    if (ctx.state === "suspended") {
      ctx.resume().catch((e) => console.warn("Failed to resume audio context:", e));
    }

    const now = ctx.currentTime;

    // Main beep tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now); // clean high-pitched UI beep

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01); // fast attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12); // fast release

    // Soft digital polish filter
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 600;

    // Connect nodes
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Play
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}
