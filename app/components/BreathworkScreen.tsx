"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Pause, Play, Plus, RotateCcw, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
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
  id: "reset-quick" | "focus" | "calm";
  titleKey: "breathworkPresetQuick" | "breathworkPresetFocus" | "breathworkPresetCalm";
  subtitle: string;
}

const PRESETS: Preset[] = [
  { id: "reset-quick", titleKey: "breathworkPresetQuick", subtitle: "4-4-4 · 3", inhale: 4, hold: 4, exhale: 4, cycles: 3 },
  { id: "focus", titleKey: "breathworkPresetFocus", subtitle: "4-2-6 · 10", inhale: 4, hold: 2, exhale: 6, cycles: 10 },
  { id: "calm", titleKey: "breathworkPresetCalm", subtitle: "4-4-6 · 15", inhale: 4, hold: 4, exhale: 6, cycles: 15 },
];

const DEFAULT_CONFIG = PRESETS[1];

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function BreathRing({
  phaseProgress,
  totalProgress,
  seconds,
  scale,
  secondsLabel,
}: {
  phaseProgress: number;
  totalProgress: number;
  seconds: number;
  scale: number;
  secondsLabel: string;
}) {
  const size = 266;
  const radius = 102;
  const circumference = 2 * Math.PI * radius;
  const phaseOffset = circumference * (1 - Math.max(0, Math.min(1, phaseProgress)));
  const totalOffset = circumference * (1 - Math.max(0, Math.min(1, totalProgress)));

  return (
    <motion.div
      className="relative mx-auto w-[266px] h-[266px]"
      animate={{ scale }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{ opacity: [0.2, 0.35, 0.2], scale: [0.95, 1.03, 0.95] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(232,0,0,0.20) 0%, rgba(232,0,0,0.08) 30%, rgba(232,0,0,0) 70%)",
          filter: "blur(18px)",
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 relative z-10">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(232,0,0,0.26)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: totalOffset }}
          transition={{ duration: 0.2 }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 14}
          fill="none"
          stroke="#E80000"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (radius - 14)}
          animate={{ strokeDashoffset: phaseOffset }}
          transition={{ duration: 0.2 }}
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <p className="text-[64px] leading-none font-semibold text-gray-12 tabular-nums">{seconds}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-7 mt-1">{secondsLabel}</p>
      </div>
    </motion.div>
  );
}

export function BreathworkScreen({ userId, initialSessionsToday }: BreathworkScreenProps) {
  const { t } = useI18n();

  const [config, setConfig] = useState<BreathState>(() => {
    if (typeof window === "undefined") return DEFAULT_CONFIG;
    const raw = localStorage.getItem(`optiz-breathwork-config-${userId}`);
    if (!raw) return DEFAULT_CONFIG;
    try {
      return JSON.parse(raw) as BreathState;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    const matched = PRESETS.find(
      (p) =>
        p.inhale === DEFAULT_CONFIG.inhale &&
        p.hold === DEFAULT_CONFIG.hold &&
        p.exhale === DEFAULT_CONFIG.exhale &&
        p.cycles === DEFAULT_CONFIG.cycles,
    );
    return matched?.id ?? "custom";
  });

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [toast, setToast] = useState<XPToastData | null>(null);
  const [sessionsToday, setSessionsToday] = useState(initialSessionsToday);

  const lastPhaseRef = useRef<PhaseKey>("inhale");

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`optiz-breathwork-config-${userId}`, JSON.stringify(config));
  }, [config, userId]);

  const phaseSegments = useMemo<PhaseSegment[]>(() => {
    const segments: PhaseSegment[] = [{ key: "inhale", seconds: config.inhale }];
    if (config.hold > 0) segments.push({ key: "hold", seconds: config.hold });
    segments.push({ key: "exhale", seconds: config.exhale });
    return segments;
  }, [config.inhale, config.hold, config.exhale]);

  const cycleSeconds = useMemo(
    () => phaseSegments.reduce((sum, phase) => sum + phase.seconds, 0),
    [phaseSegments],
  );
  const totalSeconds = Math.max(1, cycleSeconds * Math.max(1, config.cycles));
  const currentInCycle = elapsed % Math.max(1, cycleSeconds);

  const phaseData = (() => {
    let cursor = 0;
    for (const segment of phaseSegments) {
      const nextCursor = cursor + segment.seconds;
      if (currentInCycle < nextCursor) {
        return {
          key: segment.key,
          elapsed: currentInCycle - cursor,
          remaining: Math.max(1, segment.seconds - (currentInCycle - cursor)),
          duration: segment.seconds,
        };
      }
      cursor = nextCursor;
    }
    const last = phaseSegments[phaseSegments.length - 1];
    return { key: last.key, elapsed: last.seconds, remaining: 1, duration: last.seconds };
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

  const cycleNumber = Math.min(config.cycles, Math.floor(elapsed / Math.max(1, cycleSeconds)) + 1);
  const phaseProgress = Math.min(1, phaseData.elapsed / Math.max(1, phaseData.duration));
  const totalProgress = Math.min(1, elapsed / totalSeconds);

  const scale = useMemo(() => {
    if (!running) return 1;
    if (phaseData.key === "inhale") return 1.05;
    if (phaseData.key === "hold") return 1.01;
    return 0.97;
  }, [phaseData.key, running]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(timer);
          setRunning(false);

          if (soundOn) playWorkoutCompleteSound();

          const id = `${Date.now()}-${Math.random()}`;
          setToast({ id, title: t("breathworkComplete"), subtitle: t("breathworkSessionValidated"), xp: 25 });
          setTimeout(() => setToast((prevToast) => (prevToast?.id === id ? null : prevToast)), 2200);

          completeBreathworkSession(userId, {
            presetId: activePreset === "custom" ? undefined : activePreset,
            inhale: config.inhale,
            holdSec: config.hold,
            exhale: config.exhale,
            cycles: config.cycles,
          }).catch((err) => console.error("[OPTIZ] Failed to save breathwork session", err));

          setSessionsToday((prevCount) => prevCount + 1);

          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, totalSeconds, soundOn, userId, config, activePreset, t]);

  useEffect(() => {
    if (!running || !soundOn) return;
    if (phaseData.key !== lastPhaseRef.current) {
      playPhaseChangeSound();
      lastPhaseRef.current = phaseData.key;
    }
  }, [phaseData.key, running, soundOn]);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setConfig({ inhale: preset.inhale, hold: preset.hold, exhale: preset.exhale, cycles: preset.cycles });
    setRunning(false);
    setElapsed(0);
    lastPhaseRef.current = "inhale";
  };

  const updateConfig = (key: keyof BreathState, delta: number) => {
    setActivePreset("custom");
    setRunning(false);
    setElapsed(0);
    lastPhaseRef.current = "inhale";
    setConfig((prev) => {
      if (key === "hold") {
        return { ...prev, hold: clampInt(prev.hold + delta, 0, 12) };
      }
      if (key === "cycles") {
        return { ...prev, cycles: clampInt(prev.cycles + delta, 1, 40) };
      }
      return { ...prev, [key]: clampInt(prev[key] + delta, 1, 12) };
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  const resetSession = () => {
    setRunning(false);
    setElapsed(0);
    lastPhaseRef.current = "inhale";
  };

  const handleMainAction = () => {
    if (running) {
      setRunning(false);
      return;
    }

    if (elapsed >= totalSeconds) {
      setElapsed(0);
      lastPhaseRef.current = "inhale";
    }

    if (elapsed === 0 && soundOn) {
      playStartSound();
    }

    setRunning(true);
  };

  const mainActionLabel =
    running ? t("breathworkPause") : elapsed > 0 && elapsed < totalSeconds ? t("breathworkResume") : t("breathworkStart");

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("breathworkTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("breathworkSubtitle")}</p>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-2.5">
            <p className="text-[10px] text-gray-7 uppercase tracking-[0.12em]">{t("breathworkProtocolLabel")}</p>
            <p className="text-[13px] mt-1 text-gray-12 font-semibold tabular-nums">
              {config.inhale}-{config.hold}-{config.exhale}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-2.5">
            <p className="text-[10px] text-gray-7 uppercase tracking-[0.12em]">{t("breathworkDurationLabel")}</p>
            <p className="text-[13px] mt-1 text-gray-12 font-semibold tabular-nums">{formatDuration(totalSeconds)}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-2.5">
            <p className="text-[10px] text-gray-7 uppercase tracking-[0.12em]">{t("breathworkCyclesLabel")}</p>
            <p className="text-[13px] mt-1 text-gray-12 font-semibold tabular-nums">{config.cycles}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-2.5">
            <p className="text-[10px] text-gray-7 uppercase tracking-[0.12em]">{t("breathworkSessionsToday")}</p>
            <p className="text-[13px] mt-1 text-gray-12 font-semibold tabular-nums">{sessionsToday}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                activePreset === preset.id ? "border-[#E80000]/35 bg-[#E80000]/12" : "border-gray-5/30 bg-gray-3/20"
              }`}
            >
              <p className="text-[13px] font-semibold text-gray-12">{t(preset.titleKey)}</p>
              <p className="text-[11px] text-gray-8 mt-0.5">{preset.subtitle}</p>
            </button>
          ))}
          <div className="rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-2">
            <p className="text-[13px] font-semibold text-gray-12">{t("breathworkPresetCustom")}</p>
            <p className="text-[11px] text-gray-8 mt-0.5">{config.inhale}-{config.hold}-{config.exhale} · {config.cycles}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-gray-5/30 bg-gray-3/16 p-3">
          <p className="text-[12px] font-semibold text-gray-11 inline-flex items-center gap-1.5 mb-2">
            <SlidersHorizontal size={14} /> {t("breathworkAdjustLabel")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { key: "inhale", label: t("breathworkInhale"), value: config.inhale },
              { key: "hold", label: t("breathworkHold"), value: config.hold },
              { key: "exhale", label: t("breathworkExhale"), value: config.exhale },
              { key: "cycles", label: t("breathworkCyclesLabel"), value: config.cycles },
            ] as const).map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-5/30 bg-gray-2/70 px-2 py-2">
                <p className="text-[10px] text-gray-7 uppercase tracking-[0.08em]">{item.label}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateConfig(item.key, -1)}
                    className="w-7 h-7 rounded-lg border border-gray-5/40 bg-gray-3/35 text-gray-10 flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-[13px] text-gray-12 font-semibold tabular-nums">
                    {item.value}
                    {item.key === "cycles" ? "" : t("breathworkSecondsShort")}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateConfig(item.key, 1)}
                    className="w-7 h-7 rounded-lg border border-gray-5/40 bg-gray-3/35 text-gray-10 flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="mb-3 text-center">
          <p className="text-[11px] text-gray-7 uppercase tracking-[0.14em]">{t("breathworkCurrentPhase")}</p>
          <p className="text-[20px] text-[#FF6666] font-semibold mt-1">{elapsed >= totalSeconds ? t("breathworkFinished") : phaseLabel}</p>
          <p className="text-[12px] text-gray-8 mt-0.5">
            {t("breathworkCycle")} {cycleNumber}/{config.cycles} · {t("breathworkNextPhase")} {nextPhaseLabel}
          </p>
        </div>

        <BreathRing
          phaseProgress={phaseProgress}
          totalProgress={totalProgress}
          seconds={elapsed >= totalSeconds ? 0 : phaseData.remaining}
          scale={scale}
          secondsLabel={t("breathworkSecondsLabel")}
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

        <div className="mt-4 flex items-center justify-center gap-2.5">
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

        <p className="mt-3 text-center text-[11px] text-gray-8">{t("breathworkReady")}</p>
      </section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">{t("breathworkTip")}</p>
      </section>
    </div>
  );
}
