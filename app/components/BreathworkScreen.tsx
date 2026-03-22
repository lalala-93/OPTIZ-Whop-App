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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/* ── BreathingOrb — Pure CSS / Framer Motion ── */
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
  // Smooth ease for breathing phases
  const breathTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };
  // Slow gentle pulse for hold phase
  const holdTransition = { duration: 3, repeat: Infinity, ease: "easeInOut" as const };

  const getAnimation = (
    idleScale: number,
    idleOpacity: number,
    holdScaleRange: [number, number, number],
    holdOpacity: number,
    activeScale: number,
    inhaleOpacity: number,
    exhaleOpacity: number,
  ) => {
    if (idle) return { scale: idleScale, opacity: idleOpacity };
    if (phase === "hold") return { scale: holdScaleRange, opacity: holdOpacity };
    return { scale: activeScale, opacity: phase === "inhale" ? inhaleOpacity : exhaleOpacity };
  };

  const getTransition = () => {
    if (idle) return { duration: 0 };
    if (phase === "hold") return holdTransition;
    return breathTransition;
  };

  const transition = getTransition();

  return (
    <div className="relative mx-auto w-[220px] h-[220px] flex items-center justify-center">
      {/* Single combined glow orb — replaces 3 stacked blurs */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 160,
          height: 160,
          background: "radial-gradient(circle, #E80000 0%, rgba(232,0,0,0.5) 40%, rgba(232,0,0,0.08) 80%, transparent 100%)",
          filter: "blur(20px)",
        }}
        animate={getAnimation(
          1, 0.3,
          [orbScale - 0.01, orbScale + 0.04, orbScale - 0.01], 0.7,
          orbScale, 0.75, 0.4,
        )}
        transition={transition}
      />

      {/* Center countdown */}
      <motion.div
        className="relative z-10"
        animate={
          idle
            ? { scale: 1 }
            : phase === "hold"
              ? { scale: [orbScale * 0.91, orbScale * 0.93, orbScale * 0.91] }
              : { scale: Math.max(0.7, orbScale * 0.92) }
        }
        transition={idle ? { duration: 0 } : phase === "hold" ? holdTransition : breathTransition}
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

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1">{t("breathworkTitle")}</h2>
          <p className="text-sm text-gray-8 leading-relaxed">{t("breathworkSubtitle")}</p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 rounded-full px-3.5 py-1.5 bg-gray-3/50 border-0 text-[14px] font-semibold text-gray-12 tabular-nums"
        >
          {formatClock(remainingTotal)}
        </Badge>
      </div>

      {/* Main card */}
      <Card className="rounded-3xl border-gray-5/35 bg-gray-2/82 shadow-[0_0_40px_-10px_rgba(232,0,0,0.12)] backdrop-blur-sm">
        <CardContent className="p-5 pt-5">
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
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {Array.from({ length: config.cycles }).map((_, i) => {
              const completed = i < cycleNumber - 1;
              const current = i === cycleNumber - 1 && hasStarted;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    completed
                      ? "bg-[#E80000] scale-100"
                      : current
                        ? "bg-[#E80000] shadow-[0_0_6px_rgba(232,0,0,0.6)] scale-110"
                        : "bg-white/10 scale-100"
                  )}
                />
              );
            })}
          </div>

          {/* Controls */}
          {!hasStarted ? (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleMainAction}
                className="h-14 px-10 rounded-full optiz-gradient-bg text-white text-[15px] font-semibold gap-2 hover:opacity-90 shadow-lg shadow-[#E80000]/20"
              >
                <Play size={16} /> {t("breathworkStart")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={resetSession}
                className="w-11 h-11 rounded-full border-gray-5/35 bg-transparent text-gray-10 hover:bg-gray-3/50 hover:text-gray-12 transition-colors"
                aria-label={t("reset")}
              >
                <RotateCcw size={15} />
              </Button>

              <Button
                size="lg"
                onClick={handleMainAction}
                className="w-14 h-14 rounded-full optiz-gradient-bg text-white hover:opacity-90 shadow-lg shadow-[#E80000]/25 p-0"
              >
                {running ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSound}
                className="w-11 h-11 rounded-full border-gray-5/35 bg-transparent text-gray-10 hover:bg-gray-3/50 hover:text-gray-12 transition-colors"
                aria-label={t("sound")}
              >
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const presetSeconds = (preset.inhale + preset.hold + preset.exhale) * preset.cycles;
          const selected = activePreset === preset.id;
          return (
            <Badge
              key={preset.id}
              variant={selected ? "default" : "outline"}
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-all select-none",
                selected
                  ? "bg-[#E80000]/15 text-[#FF6666] border border-[#E80000]/35 hover:bg-[#E80000]/25 shadow-sm shadow-[#E80000]/10"
                  : "bg-gray-3/30 text-gray-10 border border-gray-5/25 hover:bg-gray-3/50 hover:text-gray-12"
              )}
            >
              {t(preset.titleKey)} · {formatDuration(presetSeconds)}
            </Badge>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Badge
          variant="secondary"
          className="rounded-full px-3 py-1 bg-gray-3/30 border-0 text-[11px] text-gray-8"
        >
          {t("breathworkSessionsToday")}: {sessionsToday}
        </Badge>
      </div>
    </div>
  );
}
