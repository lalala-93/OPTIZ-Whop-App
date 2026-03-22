"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Wind, Timer, Zap } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  icon: "focus" | "calm" | "quick";
}

const PRESETS: Preset[] = [
  { id: "focus", titleKey: "breathworkPresetFocus", inhale: 4, hold: 4, exhale: 4, cycles: 8, icon: "focus" },
  { id: "calm", titleKey: "breathworkPresetCalm", inhale: 4, hold: 4, exhale: 6, cycles: 10, icon: "calm" },
  { id: "reset-quick", titleKey: "breathworkPresetQuick", inhale: 4, hold: 2, exhale: 4, cycles: 5, icon: "quick" },
];

const DEFAULT_PRESET_ID: Preset["id"] = "focus";
const TICK_MS = 120;

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* ── BreathingOrb ── */
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
  const breathTransition = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const };
  const holdTransition = { duration: 3, repeat: Infinity, ease: "easeInOut" as const };

  const getGlowAnimation = () => {
    if (idle) return { scale: 1, opacity: 0.2 };
    if (phase === "hold") return { scale: [orbScale - 0.01, orbScale + 0.04, orbScale - 0.01], opacity: 0.6 };
    return { scale: orbScale, opacity: phase === "inhale" ? 0.7 : 0.3 };
  };

  const getTransition = () => {
    if (idle) return { duration: 0.8, ease: "easeOut" as const };
    if (phase === "hold") return holdTransition;
    return breathTransition;
  };

  const phaseColor = phase === "inhale" ? "#E80000" : phase === "hold" ? "#FF4D4D" : "#E80000";

  return (
    <div className="relative mx-auto w-[240px] h-[240px] flex items-center justify-center">
      {/* Outer ring — subtle phase indicator */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 240 240">
        <circle
          cx="120" cy="120" r="110"
          fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth="2"
        />
        {!idle && (
          <motion.circle
            cx="120" cy="120" r="110"
            fill="none" stroke={phaseColor}
            strokeWidth="2" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 110}
            animate={{
              strokeDashoffset: idle ? 2 * Math.PI * 110 : 2 * Math.PI * 110 * (1 - (phase === "hold" ? 1 : orbScale - 0.55)),
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Core glow orb */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle, ${phaseColor} 0%, rgba(232,0,0,0.4) 35%, rgba(232,0,0,0.06) 70%, transparent 100%)`,
          filter: "blur(18px)",
        }}
        animate={getGlowAnimation()}
        transition={getTransition()}
      />

      {/* Inner solid circle */}
      <motion.div
        className="absolute rounded-full border border-white/[0.06]"
        style={{
          width: 100,
          height: 100,
          background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.06) 0%, rgba(232,0,0,0.08) 50%, rgba(232,0,0,0.03) 100%)`,
        }}
        animate={{
          scale: idle ? 1 : phase === "hold"
            ? [orbScale * 0.92, orbScale * 0.95, orbScale * 0.92]
            : Math.max(0.75, orbScale * 0.92),
        }}
        transition={idle ? { duration: 0.8 } : phase === "hold" ? holdTransition : breathTransition}
      />

      {/* Center countdown */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{
          scale: idle ? 1 : phase === "hold"
            ? [orbScale * 0.91, orbScale * 0.93, orbScale * 0.91]
            : Math.max(0.7, orbScale * 0.92),
        }}
        transition={idle ? { duration: 0.8 } : phase === "hold" ? holdTransition : breathTransition}
      >
        <span className="text-[48px] font-extralight text-white tabular-nums select-none leading-none">
          {seconds}
        </span>
      </motion.div>
    </div>
  );
}

/* ── Phase progress arc ── */
function PhaseProgressArc({ progress, phase }: { progress: number; phase: PhaseKey }) {
  const size = 6;
  const segments = 3;
  const phaseIndex = phase === "inhale" ? 0 : phase === "hold" ? 1 : 2;

  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] rounded-full transition-all duration-500",
            i < phaseIndex ? "bg-[#E80000] w-6" :
            i === phaseIndex ? "bg-[#FF4D4D] w-10" :
            "bg-white/[0.08] w-6"
          )}
          style={i === phaseIndex ? { width: `${Math.max(16, progress * 40)}px` } : undefined}
        />
      ))}
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
    return { inhale: preset.inhale, hold: preset.hold, exhale: preset.exhale, cycles: preset.cycles };
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
    if (phaseData.key === "inhale") return 0.85 + 0.30 * phaseProgress;
    if (phaseData.key === "hold") return 1.15;
    return 1.15 - 0.30 * phaseProgress;
  }, [elapsedMs, elapsedSecFloat, phaseData.key, phaseProgress, running, totalSeconds]);

  const finishSession = useCallback(() => {
    setRunning(false);
    if (soundOn) playWorkoutCompleteSound();
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title: t("breathworkComplete"), subtitle: t("breathworkSessionValidated"), xp: 25 });
    setTimeout(() => setToast((prevToast) => (prevToast?.id === id ? null : prevToast)), 2200);
    void completeBreathworkSession(userId, {
      presetId: activePreset, inhale: config.inhale, holdSec: config.hold, exhale: config.exhale, cycles: config.cycles,
    }).catch((err) => console.error("[OPTIZ] Failed to save breathwork session", err));
    setSessionsToday((prevCount) => prevCount + 1);
  }, [activePreset, config.cycles, config.exhale, config.hold, config.inhale, soundOn, t, userId]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsedMs((prevMs) => {
        const nextMs = prevMs + TICK_MS;
        if (nextMs >= totalMs) { finishSession(); return totalMs; }
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
    if (running) { setRunning(false); return; }
    if (elapsedMs >= totalMs) { setElapsedMs(0); lastPhaseRef.current = "inhale"; }
    if (elapsedMs === 0 && soundOn) playStartSound();
    setRunning(true);
  };

  const remainingTotal = Math.max(0, totalSeconds - elapsedSecFloat);
  const isFinished = elapsedMs >= totalMs;
  const isIdle = !running && elapsedMs === 0;
  const hasStarted = running || elapsedMs > 0;
  const overallProgress = Math.min(100, (elapsedSecFloat / totalSeconds) * 100);

  return (
    <div className="pb-8 space-y-5 relative">
      <XPToast toast={toast} />

      {/* Header — compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wind size={18} className="text-gray-7" />
          <h2 className="text-lg font-semibold text-gray-12">{t("breathworkTitle")}</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-3/50 border border-gray-5/30"
            >
              <Timer size={12} className="text-gray-7" />
              <span className="text-[13px] font-semibold text-gray-12 tabular-nums">{formatClock(remainingTotal)}</span>
            </motion.div>
          )}
          {sessionsToday > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E80000]/8 border border-[#E80000]/15">
              <Zap size={11} className="text-[#FF6666]" />
              <span className="text-[11px] font-bold text-[#FF6666] tabular-nums">{sessionsToday}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset selector — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {PRESETS.map((preset) => {
          const presetSeconds = (preset.inhale + preset.hold + preset.exhale) * preset.cycles;
          const selected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "flex-shrink-0 flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border transition-all duration-200",
                selected
                  ? "bg-[#E80000]/8 border-[#E80000]/25 shadow-sm shadow-[#E80000]/5"
                  : "bg-gray-2/80 border-gray-5/25 hover:bg-gray-3/50 hover:border-gray-5/40"
              )}
            >
              <span className={cn(
                "text-[13px] font-semibold",
                selected ? "text-[#FF6666]" : "text-gray-11"
              )}>
                {t(preset.titleKey)}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={selected ? "text-[#FF6666]/70" : "text-gray-7"}>
                  {preset.inhale}-{preset.hold}-{preset.exhale}s
                </span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                  selected ? "bg-[#E80000]/12 text-[#FF6666]/80" : "bg-gray-4/40 text-gray-8"
                )}>
                  {formatDuration(presetSeconds)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main breathwork card */}
      <div className="rounded-3xl border border-gray-5/25 bg-gray-2/60 overflow-hidden">
        {/* Overall progress bar — thin line at top */}
        {hasStarted && (
          <div className="h-[2px] bg-gray-5/15">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E80000] to-[#FF4D4D]"
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
        )}

        <div className="px-5 pt-6 pb-5">
          {/* Phase label */}
          <div className="text-center mb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={isFinished ? "finished" : phaseData.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[22px] font-semibold text-gray-12 tracking-tight">
                  {isFinished ? t("breathworkFinished") : phaseLabel}
                </p>
              </motion.div>
            </AnimatePresence>

            {!isFinished && hasStarted && (
              <motion.p
                className="text-[11px] text-gray-7 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {t("breathworkCycle")} {cycleNumber}/{config.cycles} · {t("breathworkNextPhase")} {nextPhaseLabel}
              </motion.p>
            )}
          </div>

          {/* Phase progress bars */}
          {hasStarted && !isFinished && (
            <div className="mb-2">
              <PhaseProgressArc progress={phaseProgress} phase={phaseData.key} />
            </div>
          )}

          {/* BreathingOrb */}
          <div className="my-4">
            <BreathingOrb
              seconds={isFinished ? 0 : phaseData.remaining}
              orbScale={orbScale}
              phase={phaseData.key}
              idle={isIdle}
            />
          </div>

          {/* Cycle dots */}
          <div className="flex items-center justify-center gap-[6px] mb-6">
            {Array.from({ length: config.cycles }).map((_, i) => {
              const completed = i < cycleNumber - 1;
              const current = i === cycleNumber - 1 && hasStarted;
              return (
                <motion.div
                  key={i}
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    completed
                      ? "bg-[#E80000]"
                      : current
                        ? "bg-[#FF4D4D]"
                        : "bg-white/[0.06]"
                  )}
                  animate={{
                    width: current ? 12 : 5,
                    height: 5,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </div>

          {/* Controls */}
          {!hasStarted ? (
            <div className="flex justify-center">
              <motion.button
                type="button"
                onClick={handleMainAction}
                className="h-14 px-12 rounded-full optiz-gradient-bg text-white text-[15px] font-semibold inline-flex items-center gap-2.5 shadow-lg shadow-[#E80000]/20"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
              >
                <Play size={18} fill="white" /> {t("breathworkStart")}
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5">
              <motion.button
                type="button"
                onClick={resetSession}
                className="w-11 h-11 rounded-full border border-gray-5/30 bg-gray-3/30 text-gray-9 inline-flex items-center justify-center hover:bg-gray-3/60 hover:text-gray-12 transition-colors"
                whileTap={{ scale: 0.9 }}
                aria-label={t("reset")}
              >
                <RotateCcw size={15} />
              </motion.button>

              <motion.button
                type="button"
                onClick={handleMainAction}
                className="w-16 h-16 rounded-full optiz-gradient-bg text-white inline-flex items-center justify-center shadow-xl shadow-[#E80000]/25"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
              >
                {running ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
              </motion.button>

              <motion.button
                type="button"
                onClick={toggleSound}
                className={cn(
                  "w-11 h-11 rounded-full border inline-flex items-center justify-center transition-colors",
                  soundOn
                    ? "border-gray-5/30 bg-gray-3/30 text-gray-9 hover:bg-gray-3/60 hover:text-gray-12"
                    : "border-[#E80000]/20 bg-[#E80000]/5 text-[#FF6666]/60"
                )}
                whileTap={{ scale: 0.9 }}
                aria-label={t("sound")}
              >
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
