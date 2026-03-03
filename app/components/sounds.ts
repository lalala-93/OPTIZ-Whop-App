let audioContext: AudioContext | null = null;

const STORAGE_KEY = "optiz-sound-enabled";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioContext) {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioContext = new Ctx();
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    return audioContext;
  } catch (error) {
    console.error("AudioContext unavailable", error);
    return null;
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

function playTone(
  frequency: number,
  duration: number,
  volume: number,
  startTime?: number,
  type: OscillatorType = "sine",
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  const t = startTime ?? ctx.currentTime;
  const attack = Math.min(0.012, duration * 0.25);
  const releaseStart = t + Math.max(duration * 0.55, attack);
  const end = t + duration;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);

  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t + attack);
  gainNode.gain.setValueAtTime(Math.max(0.0001, volume * 0.88), releaseStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(t);
  osc.stop(end + 0.01);
}

function playIfEnabled(cb: () => void): void {
  if (!isSoundEnabled()) return;
  try {
    cb();
  } catch (error) {
    console.error("Failed to play sound", error);
  }
}

export function playTickSound(): void {
  playIfEnabled(() => {
    playTone(860, 0.035, 0.04, undefined, "sine");
  });
}

export function playBeepSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(520, 0.08, 0.08, now, "triangle");
    playTone(620, 0.08, 0.07, now + 0.075, "triangle");
  });
}

export function playStartSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(460, 0.09, 0.07, now, "triangle");
    playTone(620, 0.11, 0.08, now + 0.1, "triangle");
  });
}

export function playCompleteSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(360, 0.07, 0.06, now, "sine");
    playTone(520, 0.08, 0.07, now + 0.085, "sine");
    playTone(700, 0.11, 0.08, now + 0.18, "triangle");
  });
}

export function playRoundStartSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(420, 0.08, 0.06, now, "triangle");
    playTone(560, 0.09, 0.07, now + 0.09, "triangle");
    playTone(740, 0.1, 0.08, now + 0.2, "triangle");
  });
}

export function playPhaseChangeSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(500, 0.06, 0.05, now, "sine");
    playTone(680, 0.08, 0.06, now + 0.07, "triangle");
  });
}

export function playWorkoutCompleteSound(): void {
  playIfEnabled(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(340, 0.08, 0.06, now, "sine");
    playTone(480, 0.09, 0.07, now + 0.09, "triangle");
    playTone(620, 0.1, 0.08, now + 0.2, "triangle");
    playTone(820, 0.14, 0.1, now + 0.32, "triangle");
  });
}

export function playFinishSound(): void {
  playWorkoutCompleteSound();
}
