let soundEffectsEnabled = true;
let hapticsEnabled = true;
let audioContext: AudioContext | null = null;

type Tone = {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

export function setSoundEffectsEnabled(enabled: boolean) {
  soundEffectsEnabled = enabled;
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const AudioContextConstructor =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  return audioContext;
}

function playTones(tones: Tone[]) {
  if (!soundEffectsEnabled) return;

  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;

    tones.forEach((tone) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + tone.start;
      const end = start + tone.duration;

      oscillator.type = tone.type ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
    });
  } catch {
    return;
  }
}

export function playRateSound() {
  playTones([
    { frequency: 760, start: 0, duration: 0.09, gain: 0.035, type: "triangle" },
    { frequency: 1080, start: 0.07, duration: 0.12, gain: 0.026, type: "sine" },
  ]);
}

export function playActivitySound() {
  playTones([
    { frequency: 620, start: 0, duration: 0.12, gain: 0.026, type: "sine" },
    { frequency: 860, start: 0.13, duration: 0.18, gain: 0.022, type: "triangle" },
  ]);
}

export function playPostCreatedSound() {
  playTones([
    { frequency: 520, start: 0, duration: 0.1, gain: 0.026, type: "triangle" },
    { frequency: 780, start: 0.08, duration: 0.13, gain: 0.03, type: "triangle" },
    { frequency: 1160, start: 0.18, duration: 0.16, gain: 0.022, type: "sine" },
  ]);
}

export function playFollowSound() {
  playTones([
    { frequency: 680, start: 0, duration: 0.08, gain: 0.025, type: "square" },
    { frequency: 920, start: 0.08, duration: 0.1, gain: 0.018, type: "sine" },
  ]);
}

export function playErrorSound() {
  playTones([
    { frequency: 180, start: 0, duration: 0.14, gain: 0.025, type: "sine" },
    { frequency: 140, start: 0.1, duration: 0.16, gain: 0.018, type: "triangle" },
  ]);
}

export function triggerHaptic(pattern: number | number[] = 12) {
  if (!hapticsEnabled || typeof navigator === "undefined" || !navigator.vibrate) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    return;
  }
}
