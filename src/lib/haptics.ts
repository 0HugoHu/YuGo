let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/** Play a short click sound as tactile feedback */
function playClick(style: "light" | "medium" | "heavy") {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Resume if suspended (iOS requires user gesture)
  if (ctx.state === "suspended") ctx.resume();

  const config = {
    light:  { freq: 1800, dur: 0.015, vol: 0.08 },
    medium: { freq: 1200, dur: 0.025, vol: 0.12 },
    heavy:  { freq: 600,  dur: 0.04,  vol: 0.18 },
  }[style];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = config.freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(config.vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.dur);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + config.dur + 0.01);
}

/**
 * Trigger haptic/audio feedback.
 * - Android Chrome: uses navigator.vibrate()
 * - All platforms: plays a short click sound as audio feedback
 */
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  if (typeof window === "undefined") return;

  // Native vibration (Android)
  if (navigator.vibrate) {
    const durations = { light: 10, medium: 20, heavy: 40 };
    try { navigator.vibrate(durations[style]); } catch { /* noop */ }
  }

  // Audio click (works everywhere including iOS)
  playClick(style);
}
