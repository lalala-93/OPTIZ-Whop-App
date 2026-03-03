let audioContext: AudioContext | null = null;

const STORAGE_KEY = "optiz-sound-enabled";

type SoundKey = "tick" | "start" | "complete" | "round" | "phase" | "finish";

const SOUND_FILES: Record<SoundKey, string> = {
  tick: "/sounds/ui-tick.wav",
  start: "/sounds/ui-start.wav",
  complete: "/sounds/ui-complete.wav",
  round: "/sounds/ui-round.wav",
  phase: "/sounds/ui-phase.wav",
  finish: "/sounds/ui-finish.wav",
};

const audioPool = new Map<SoundKey, HTMLAudioElement[]>();

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

function getAudioNode(key: SoundKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  const existing = audioPool.get(key);
  if (existing && existing.length) {
    const node = existing.pop() || null;
    return node;
  }

  try {
    const base = new Audio(SOUND_FILES[key]);
    base.preload = "auto";
    return base;
  } catch (error) {
    console.error("Failed to init audio file", error);
    return null;
  }
}

function releaseAudioNode(key: SoundKey, node: HTMLAudioElement) {
  const list = audioPool.get(key) || [];
  if (list.length < 6) list.push(node);
  audioPool.set(key, list);
}

function playFileSound(key: SoundKey, volume: number): boolean {
  const node = getAudioNode(key);
  if (!node) return false;

  try {
    node.currentTime = 0;
    node.volume = Math.max(0, Math.min(1, volume));

    void node.play().catch((error) => {
      console.error("Audio file play blocked", error);
    });

    const cleanup = () => {
      node.onended = null;
      node.onerror = null;
      releaseAudioNode(key, node);
    };

    node.onended = cleanup;
    node.onerror = cleanup;

    return true;
  } catch (error) {
    console.error("Failed to play audio file", error);
    return false;
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

function playFallbackStart() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(460, 0.09, 0.07, now, "triangle");
  playTone(620, 0.11, 0.08, now + 0.1, "triangle");
}

function playFallbackComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(360, 0.07, 0.06, now, "sine");
  playTone(520, 0.08, 0.07, now + 0.085, "sine");
  playTone(700, 0.11, 0.08, now + 0.18, "triangle");
}

function playFallbackRound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(420, 0.08, 0.06, now, "triangle");
  playTone(560, 0.09, 0.07, now + 0.09, "triangle");
  playTone(740, 0.1, 0.08, now + 0.2, "triangle");
}

function playFallbackFinish() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(340, 0.08, 0.06, now, "sine");
  playTone(480, 0.09, 0.07, now + 0.09, "triangle");
  playTone(620, 0.1, 0.08, now + 0.2, "triangle");
  playTone(820, 0.14, 0.1, now + 0.32, "triangle");
}

export function playTickSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("tick", 0.42);
    if (!ok) playTone(860, 0.035, 0.04, undefined, "sine");
  });
}

export function playBeepSound(): void {
  playTickSound();
}

export function playStartSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("start", 0.52);
    if (!ok) playFallbackStart();
  });
}

export function playCompleteSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("complete", 0.58);
    if (!ok) playFallbackComplete();
  });
}

export function playRoundStartSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("round", 0.58);
    if (!ok) playFallbackRound();
  });
}

export function playPhaseChangeSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("phase", 0.5);
    if (!ok) {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      playTone(500, 0.06, 0.05, now, "sine");
      playTone(680, 0.08, 0.06, now + 0.07, "triangle");
    }
  });
}

export function playWorkoutCompleteSound(): void {
  playIfEnabled(() => {
    const ok = playFileSound("finish", 0.62);
    if (!ok) playFallbackFinish();
  });
}

export function playFinishSound(): void {
  playWorkoutCompleteSound();
}
