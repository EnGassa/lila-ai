/**
 * Audio feedback utilities for the FaceCapture component
 */

/**
 * Plays a pleasant capture sound effect using Web Audio API
 * Creates a quick sine wave that drops from 880Hz (A5) to 587.33Hz (D5)
 * 
 * @example
 * ```typescript
 * playCaptureSound(); // Plays the sound effect
 * ```
 */
export function playCaptureSound(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch start
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.1); // Drop to D5

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}
