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
  playTone(500, 0.08, 0.25, now);
  playTone(700, 0.08, 0.25, now + 0.09);
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
  playTone(400, 0.12, 0.25, now);
  playTone(500, 0.12, 0.25, now + 0.13);
  playTone(600, 0.12, 0.25, now + 0.26);
  playTone(800, 0.22, 0.3, now + 0.39);
}
