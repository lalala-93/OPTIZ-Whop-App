"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

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

function BreathOrb({
  phaseProgress,
  totalProgress,
  seconds,
  orbScale,
  phase,
}: {
  phaseProgress: number;
  totalProgress: number;
  seconds: number;
  orbScale: number;
  phase: PhaseKey;
}) {
  const size = 300;
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const phaseOffset = circumference * (1 - clamp01(phaseProgress));
  const totalOffset = circumference * (1 - clamp01(totalProgress));

  return (
    <motion.div
      className="relative mx-auto w-[300px] h-[300px]"
      animate={{
        scale: phase === "hold" ? 1.02 : 1,
      }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          opacity: phase === "inhale" ? 0.36 : phase === "hold" ? 0.42 : 0.24,
          scale: orbScale + 0.08,
        }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, rgba(232,0,0,0.35) 0%, rgba(232,0,0,0.12) 45%, rgba(232,0,0,0) 72%)",
          filter: "blur(20px)",
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 relative z-10">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="16" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(232,0,0,0.30)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: totalOffset }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 14}
          fill="none"
          stroke="#E80000"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (radius - 14)}
          animate={{ strokeDashoffset: phaseOffset }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
      </svg>

      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center"
        animate={{ scale: orbScale }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <div className="relative w-[184px] h-[184px] rounded-full border border-[#E80000]/35 bg-[#15090A]">
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: phase === "hold" ? 0.42 : 0.34 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle, rgba(232,0,0,0.45) 0%, rgba(232,0,0,0.20) 48%, rgba(232,0,0,0.02) 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[64px] leading-none font-semibold text-gray-12 tabular-nums">{seconds}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-7 mt-1">sec</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  const totalProgress = Math.min(1, elapsedSecFloat / totalSeconds);

  const orbScale = useMemo(() => {
    if (elapsedSecFloat >= totalSeconds) return 0.9;
    if (!running && elapsedMs === 0) return 0.95;

    if (phaseData.key === "inhale") {
      return 0.9 + 0.22 * phaseProgress;
    }
    if (phaseData.key === "hold") {
      return 1.12;
    }
    return 1.12 - 0.24 * phaseProgress;
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

  const mainActionLabel =
    running
      ? t("breathworkPause")
      : elapsedMs > 0 && elapsedMs < totalMs
        ? t("breathworkResume")
        : t("breathworkStart");

  const remainingTotal = Math.max(0, totalSeconds - elapsedSecFloat);
  const isFinished = elapsedMs >= totalMs;

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1">{t("breathworkTitle")}</h2>
          <p className="text-sm text-gray-8 leading-relaxed">{t("breathworkSubtitle")}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-gray-5/35 bg-gray-2/82 px-3 py-2 text-right min-w-[82px]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-gray-7">{t("breathworkDurationLabel")}</p>
          <p className="text-[16px] font-semibold text-gray-12 tabular-nums mt-0.5">{formatClock(remainingTotal)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4 sm:p-5">
        <div className="mb-2 text-center">
          <p className="text-[11px] text-gray-7 uppercase tracking-[0.14em]">{t("breathworkCurrentPhase")}</p>
          <p className="text-[24px] text-[#FF6666] font-semibold mt-1">
            {isFinished ? t("breathworkFinished") : phaseLabel}
          </p>
          <p className="text-[12px] text-gray-8 mt-0.5">
            {t("breathworkCycle")} {cycleNumber}/{config.cycles}
            {!isFinished ? ` · ${t("breathworkNextPhase")} ${nextPhaseLabel}` : ""}
          </p>
        </div>

        <BreathOrb
          phaseProgress={phaseProgress}
          totalProgress={totalProgress}
          seconds={isFinished ? 0 : phaseData.remaining}
          orbScale={orbScale}
          phase={phaseData.key}
        />

        <div className={`mt-3 grid ${phaseSegments.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-2 text-[11px]`}>
          {phaseSegments.map((phase) => {
            const active = phase.key === phaseData.key && running;
            const label =
              phase.key === "inhale"
                ? t("breathworkInhale")
                : phase.key === "hold"
                  ? t("breathworkHold")
                  : t("breathworkExhale");
            return (
              <div
                key={phase.key}
                className={`rounded-xl border p-2 text-center ${
                  active ? "border-[#E80000]/35 bg-[#E80000]/12 text-[#FF6666]" : "border-gray-5/30 bg-gray-3/20 text-gray-10"
                }`}
              >
                {label} {phase.seconds}{t("breathworkSecondsShort")}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={resetSession}
            className="w-11 h-11 rounded-xl border border-gray-5/35 bg-gray-3/35 text-gray-10 inline-flex items-center justify-center"
            aria-label={t("reset")}
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={handleMainAction}
            className="h-11 px-6 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center gap-1.5 min-w-[148px] justify-center"
          >
            {running ? <Pause size={14} /> : <Play size={14} />} {mainActionLabel}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="w-11 h-11 rounded-xl border border-gray-5/35 bg-gray-3/35 text-gray-10 inline-flex items-center justify-center"
            aria-label={t("sound")}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const presetSeconds = (preset.inhale + preset.hold + preset.exhale) * preset.cycles;
            const selected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected ? "border-[#E80000]/45 bg-[#E80000]/12" : "border-gray-5/30 bg-gray-3/16 hover:bg-gray-3/28"
                }`}
              >
                <p className="text-[14px] font-semibold text-gray-12">{t(preset.titleKey)}</p>
                <p className="text-[11px] text-gray-8 mt-0.5">
                  {preset.inhale}-{preset.hold}-{preset.exhale} · {formatDuration(presetSeconds)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-5/25 bg-gray-3/16 px-3 py-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-gray-7">{t("breathworkSessionsToday")}</span>
          <span className="text-[14px] font-semibold text-gray-12 tabular-nums">{sessionsToday}</span>
        </div>
      </section>
    </div>
  );
}
