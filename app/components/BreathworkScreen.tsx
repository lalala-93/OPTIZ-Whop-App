"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  isSoundEnabled,
  playPhaseChangeSound,
  playStartSound,
  playWorkoutCompleteSound,
  setSoundEnabled,
} from "./sounds";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import { completeBreathworkSession } from "@/lib/actions";

interface BreathworkScreenProps {
  userId: string;
  initialSessionsToday: number;
}

interface BreathState {
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

type PhaseKey = "inhale" | "hold" | "exhale";

interface PhaseSegment {
  key: PhaseKey;
  seconds: number;
}

interface Preset extends BreathState {
  id: "focus" | "calm" | "reset-quick";
  titleKey: "breathworkPresetQuick" | "breathworkPresetFocus" | "breathworkPresetCalm";
}

const PRESETS: Preset[] = [
  { id: "focus", titleKey: "breathworkPresetFocus", inhale: 4, hold: 4, exhale: 4, cycles: 8 },
  { id: "calm", titleKey: "breathworkPresetCalm", inhale: 4, hold: 4, exhale: 6, cycles: 10 },
  { id: "reset-quick", titleKey: "breathworkPresetQuick", inhale: 4, hold: 2, exhale: 4, cycles: 5 },
];

const DEFAULT_PRESET_ID: Preset["id"] = "focus";
const TICK_MS = 120;

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* ── BreathingOrb — Pure CSS / Framer Motion (no SVG) ── */
function BreathingOrb({
  seconds,
  orbScale,
  phase,
  idle,
}: {
  seconds: number;
  orbScale: number;
  phase: PhaseKey;
  idle: boolean;
}) {
  const idleTransition = { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
  const phaseTransition = { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative mx-auto w-[220px] h-[220px] flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "rgba(232,0,0,0.12)", filter: "blur(80px)" }}
        animate={
          idle
            ? { scale: [1, 1.04, 1], opacity: 0.5 }
            : { scale: orbScale + 0.1, opacity: phase === "inhale" ? 0.7 : phase === "hold" ? 0.6 : 0.35 }
        }
        transition={idle ? idleTransition : phaseTransition}
      />

      {/* Mid glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 180, height: 180, background: "rgba(255,80,80,0.25)", filter: "blur(50px)" }}
        animate={
          idle
            ? { scale: [1, 1.04, 1], opacity: 0.4 }
            : { scale: orbScale, opacity: phase === "inhale" ? 0.8 : phase === "hold" ? 0.7 : 0.35 }
        }
        transition={idle ? idleTransition : phaseTransition}
      />

      {/* Core orb */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140,
          height: 140,
          background: "radial-gradient(circle, #E80000 0%, rgba(232,0,0,0.6) 50%, rgba(232,0,0,0.1) 100%)",
          filter: "blur(30px)",
        }}
        animate={
          idle
            ? { scale: [1, 1.04, 1], opacity: 0.6 }
            : { scale: orbScale, opacity: phase === "inhale" ? 0.9 : phase === "hold" ? 0.85 : 0.5 }
        }
        transition={idle ? idleTransition : phaseTransition}
      />

      {/* Center countdown */}
      <motion.div
        className="relative z-10"
        animate={idle ? { scale: [1, 1.04, 1] } : { scale: Math.max(0.7, orbScale * 0.92) }}
        transition={idle ? idleTransition : phaseTransition}
      >
        <span className="text-[42px] font-light text-white tabular-nums select-none">{seconds}</span>
      </motion.div>
    </div>
  );
}

/* ── Main component ── */
export function BreathworkScreen({ userId, initialSessionsToday }: BreathworkScreenProps) {
  const { t } = useI18n();

  const [activePreset, setActivePreset] = useState<Preset["id"]>(() => {
    if (typeof window === "undefined") return DEFAULT_PRESET_ID;
    const stored = localStorage.getItem(`optiz-breathwork-preset-${userId}`) as Preset["id"] | null;
    if (stored && PRESETS.some((preset) => preset.id === stored)) {
      return stored;
    }
    return DEFAULT_PRESET_ID;
  });

  const config = useMemo<BreathState>(() => {
    const preset = PRESETS.find((item) => item.id === activePreset) ?? PRESETS[0];
    return {
      inhale: preset.inhale,
      hold: preset.hold,
      exhale: preset.exhale,
      cycles: preset.cycles,
    };
  }, [activePreset]);

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [toast, setToast] = useState<XPToastData | null>(null);
  const [sessionsToday, setSessionsToday] = useState(initialSessionsToday);

  const lastPhaseRef = useRef<PhaseKey>("inhale");

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`optiz-breathwork-preset-${userId}`, activePreset);
  }, [activePreset, userId]);

  const phaseSegments = useMemo<PhaseSegment[]>(() => {
    const segments: PhaseSegment[] = [{ key: "inhale", seconds: config.inhale }];
    if (config.hold > 0) segments.push({ key: "hold", seconds: config.hold });
    segments.push({ key: "exhale", seconds: config.exhale });
    return segments;
  }, [config.exhale, config.hold, config.inhale]);

  const cycleSeconds = useMemo(
    () => phaseSegments.reduce((sum, phase) => sum + phase.seconds, 0),
    [phaseSegments],
  );

  const totalSeconds = Math.max(1, cycleSeconds * Math.max(1, config.cycles));
  const totalMs = totalSeconds * 1000;
  const elapsedSecFloat = Math.min(totalSeconds, elapsedMs / 1000);
  const currentInCycle = elapsedSecFloat % Math.max(1, cycleSeconds);

  const phaseData = (() => {
    let cursor = 0;
    for (const segment of phaseSegments) {
      const nextCursor = cursor + segment.seconds;
      if (currentInCycle < nextCursor) {
        return {
          key: segment.key,
          elapsed: currentInCycle - cursor,
          remaining: Math.max(0, Math.ceil(segment.seconds - (currentInCycle - cursor))),
          duration: segment.seconds,
        };
      }
      cursor = nextCursor;
    }
    const last = phaseSegments[phaseSegments.length - 1];
    return { key: last.key, elapsed: last.seconds, remaining: 0, duration: last.seconds };
  })();

  const phaseLabel = (() => {
    if (phaseData.key === "inhale") return t("breathworkInhale");
    if (phaseData.key === "hold") return t("breathworkHold");
    return t("breathworkExhale");
  })();

  const nextPhaseLabel = (() => {
    const idx = phaseSegments.findIndex((p) => p.key === phaseData.key);
    const next = phaseSegments[(idx + 1) % phaseSegments.length];
    if (next.key === "inhale") return t("breathworkInhale");
    if (next.key === "hold") return t("breathworkHold");
    return t("breathworkExhale");
  })();

  const cycleNumber = Math.min(config.cycles, Math.floor(elapsedSecFloat / Math.max(1, cycleSeconds)) + 1);
  const phaseProgress = Math.min(1, phaseData.elapsed / Math.max(1, phaseData.duration));

  const orbScale = useMemo(() => {
    if (elapsedSecFloat >= totalSeconds) return 0.85;
    if (!running && elapsedMs === 0) return 1;

    if (phaseData.key === "inhale") {
      return 0.85 + 0.30 * phaseProgress;
    }
    if (phaseData.key === "hold") {
      return 1.15;
    }
    return 1.15 - 0.30 * phaseProgress;
  }, [elapsedMs, elapsedSecFloat, phaseData.key, phaseProgress, running, totalSeconds]);

  const finishSession = useCallback(() => {
    setRunning(false);

    if (soundOn) playWorkoutCompleteSound();

    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title: t("breathworkComplete"), subtitle: t("breathworkSessionValidated"), xp: 25 });
    setTimeout(() => setToast((prevToast) => (prevToast?.id === id ? null : prevToast)), 2200);

    void completeBreathworkSession(userId, {
      presetId: activePreset,
      inhale: config.inhale,
      holdSec: config.hold,
      exhale: config.exhale,
      cycles: config.cycles,
    }).catch((err) => console.error("[OPTIZ] Failed to save breathwork session", err));

    setSessionsToday((prevCount) => prevCount + 1);
  }, [activePreset, config.cycles, config.exhale, config.hold, config.inhale, soundOn, t, userId]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setElapsedMs((prevMs) => {
        const nextMs = prevMs + TICK_MS;
        if (nextMs >= totalMs) {
          finishSession();
          return totalMs;
        }
        return nextMs;
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [finishSession, running, totalMs]);

  useEffect(() => {
    if (!running || !soundOn) return;
    if (phaseData.key !== lastPhaseRef.current) {
      playPhaseChangeSound();
      lastPhaseRef.current = phaseData.key;
    }
  }, [phaseData.key, running, soundOn]);

  const applyPreset = (presetId: Preset["id"]) => {
    setActivePreset(presetId);
    setRunning(false);
    setElapsedMs(0);
    lastPhaseRef.current = "inhale";
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  const resetSession = () => {
    setRunning(false);
    setElapsedMs(0);
    lastPhaseRef.current = "inhale";
  };

  const handleMainAction = () => {
    if (running) {
      setRunning(false);
      return;
    }

    if (elapsedMs >= totalMs) {
      setElapsedMs(0);
      lastPhaseRef.current = "inhale";
    }

    if (elapsedMs === 0 && soundOn) {
      playStartSound();
    }

    setRunning(true);
  };

  const remainingTotal = Math.max(0, totalSeconds - elapsedSecFloat);
  const isFinished = elapsedMs >= totalMs;
  const isIdle = !running && elapsedMs === 0;
  const hasStarted = running || elapsedMs > 0;

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      {/* Header: title left + remaining time badge right */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1">{t("breathworkTitle")}</h2>
          <p className="text-sm text-gray-8 leading-relaxed">{t("breathworkSubtitle")}</p>
        </div>
        <div className="shrink-0 rounded-full bg-gray-3/50 px-3.5 py-1.5">
          <p className="text-[14px] font-semibold text-gray-12 tabular-nums">{formatClock(remainingTotal)}</p>
        </div>
      </div>

      {/* Main card */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-5">
        {/* Phase label with AnimatePresence crossfade */}
        <div className="text-center mb-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={isFinished ? "finished" : phaseData.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[28px] font-semibold text-gray-12"
            >
              {isFinished ? t("breathworkFinished") : phaseLabel}
            </motion.p>
          </AnimatePresence>

          {/* Cycle info */}
          <p className="text-[12px] text-gray-8 mt-0.5">
            {t("breathworkCycle")} {cycleNumber}/{config.cycles}
            {!isFinished ? ` · ${t("breathworkNextPhase")} ${nextPhaseLabel}` : ""}
          </p>
        </div>

        {/* BreathingOrb hero */}
        <div className="my-6">
          <BreathingOrb
            seconds={isFinished ? 0 : phaseData.remaining}
            orbScale={orbScale}
            phase={phaseData.key}
            idle={isIdle}
          />
        </div>

        {/* Cycle dots */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {Array.from({ length: config.cycles }).map((_, i) => {
            const completed = i < cycleNumber - 1;
            const current = i === cycleNumber - 1 && hasStarted;
            return (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  completed
                    ? "bg-[#E80000]"
                    : current
                      ? "bg-[#E80000] shadow-[0_0_6px_rgba(232,0,0,0.6)]"
                      : "bg-white/10"
                }`}
              />
            );
          })}
        </div>

        {/* Controls: single Start when idle, 3-button layout otherwise */}
        {!hasStarted ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleMainAction}
              className="h-14 px-10 rounded-full optiz-gradient-bg text-white text-[15px] font-semibold inline-flex items-center gap-2"
            >
              <Play size={16} /> {t("breathworkStart")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetSession}
              className="w-10 h-10 rounded-full border border-gray-5/35 bg-transparent text-gray-10 inline-flex items-center justify-center"
              aria-label={t("reset")}
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={handleMainAction}
              className="w-14 h-14 rounded-full optiz-gradient-bg text-white inline-flex items-center justify-center"
            >
              {running ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="w-10 h-10 rounded-full border border-gray-5/35 bg-transparent text-gray-10 inline-flex items-center justify-center"
              aria-label={t("sound")}
            >
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        )}
      </section>

      {/* Preset pills — inline rounded-full buttons, no card wrapper */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const presetSeconds = (preset.inhale + preset.hold + preset.exhale) * preset.cycles;
          const selected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                selected
                  ? "bg-[#E80000]/15 text-[#FF6666] border border-[#E80000]/35"
                  : "bg-gray-3/30 text-gray-10 border border-gray-5/25 hover:bg-gray-3/50"
              }`}
            >
              {t(preset.titleKey)} · {formatDuration(presetSeconds)}
            </button>
          );
        })}
      </div>

      {/* Sessions counter — single muted line */}
      <p className="text-[11px] text-gray-8 text-center">
        {t("breathworkSessionsToday")}: {sessionsToday}
      </p>
    </div>
  );
}
