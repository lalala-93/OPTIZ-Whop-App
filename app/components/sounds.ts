let audioContext: AudioContext | null = null;

const STORAGE_KEY = "optiz-sound-enabled";

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

function playTone(
  frequency: number,
  duration: number,
  gain: number,
  startTime?: number,
  type: OscillatorType = "sine",
): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  vol.gain.value = gain;

  osc.connect(vol);
  vol.connect(ctx.destination);

  const t = startTime ?? ctx.currentTime;
  osc.start(t);
  vol.gain.setValueAtTime(gain, t + duration * 0.8);
  vol.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.stop(t + duration);
}

export function playTickSound(): void {
  if (!isSoundEnabled()) return;
  playTone(800, 0.03, 0.1);
}

export function playBeepSound(): void {
  if (!isSoundEnabled()) return;
  playTone(600, 0.1, 0.2);
}

export function playStartSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(480, 0.07, 0.2, now, "triangle");
  playTone(640, 0.07, 0.22, now + 0.08, "triangle");
}

export function playCompleteSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(400, 0.12, 0.2, now);
  playTone(600, 0.12, 0.2, now + 0.13);
  playTone(800, 0.18, 0.2, now + 0.26);
}

export function playFinishSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(420, 0.1, 0.2, now, "triangle");
  playTone(560, 0.1, 0.22, now + 0.11, "triangle");
  playTone(720, 0.14, 0.25, now + 0.22, "triangle");
  playTone(920, 0.18, 0.28, now + 0.36, "triangle");
}

export function playRoundStartSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(520, 0.08, 0.21, now, "square");
  playTone(700, 0.08, 0.21, now + 0.09, "square");
  playTone(860, 0.08, 0.23, now + 0.18, "square");
}

export function playWorkoutCompleteSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(360, 0.1, 0.2, now, "sine");
  playTone(520, 0.1, 0.22, now + 0.11, "sine");
  playTone(740, 0.12, 0.24, now + 0.23, "sine");
  playTone(980, 0.2, 0.3, now + 0.36, "triangle");
}
