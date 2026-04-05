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

interface BreathState { inhale: number; hold: number; exhale: number; cycles: number; }
type PhaseKey = "inhale" | "hold" | "exhale";
interface PhaseSegment { key: PhaseKey; seconds: number; }

interface Preset extends BreathState {
  id: string;
  titleKey: string;
}

const PRESETS: Preset[] = [
  { id: "reset-quick", titleKey: "breathworkPresetQuick", inhale: 4, hold: 2, exhale: 4, cycles: 3 },
  { id: "focus", titleKey: "breathworkPresetFocus", inhale: 4, hold: 4, exhale: 4, cycles: 8 },
  { id: "calm", titleKey: "breathworkPresetCalm", inhale: 4, hold: 4, exhale: 6, cycles: 10 },
  { id: "deep", titleKey: "breathworkPresetDeep", inhale: 5, hold: 5, exhale: 7, cycles: 8 },
  { id: "sleep", titleKey: "breathworkPresetSleep", inhale: 4, hold: 7, exhale: 8, cycles: 6 },
];

const DEFAULT_PRESET_ID = "focus";
const TICK_MS = 200; // Reasonable tick — not too fast, not too slow

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

/* ═══════════════════════════════════════════
   BreathingOrb — CSS transitions, no springs
   Animations are driven by CSS `transition` on
   the phase duration, so the browser handles
   interpolation on the GPU, not JS.
   ═══════════════════════════════════════════ */
function BreathingOrb({
  phase,
  phaseDuration,
  idle,
  countdown,
  phaseLabel,
}: {
  phase: PhaseKey;
  phaseDuration: number;
  idle: boolean;
  countdown: number;
  phaseLabel: string;
}) {
  // Target scale per phase
  const scale = idle ? 1 : phase === "inhale" ? 1.15 : phase === "hold" ? 1.15 : 0.8;
  const glowOpacity = idle ? 0.15 : phase === "inhale" ? 0.5 : phase === "hold" ? 0.45 : 0.15;

  // CSS transition duration matches the breathing phase
  const dur = idle ? "0.6s" : `${phaseDuration}s`;
  // Hold phase: no transition needed (stays at same scale)
  const transitionStyle = phase === "hold" && !idle
    ? { transition: "none" }
    : { transition: `transform ${dur} cubic-bezier(0.4, 0, 0.2, 1), opacity ${dur} ease` };

  const ORB_SIZE = 200;
  const RING_R = 92;

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: ORB_SIZE, height: ORB_SIZE }}>
      {/* Background ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`}
        width={ORB_SIZE} height={ORB_SIZE}
      >
        <circle
          cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={RING_R}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"
        />
      </svg>

      {/* Ambient glow — CSS transition, GPU-composited */}
      <div
        className="absolute rounded-full pointer-events-none will-change-transform"
        style={{
          width: 120, height: 120,
          background: "radial-gradient(circle, rgba(232,0,0,0.5) 0%, rgba(232,0,0,0.15) 40%, transparent 70%)",
          transform: `scale(${scale})`,
          opacity: glowOpacity,
          filter: "blur(25px)",
          ...transitionStyle,
        }}
      />

      {/* Inner orb */}
      <div
        className="absolute rounded-full border border-white/[0.04] will-change-transform"
        style={{
          width: 100, height: 100,
          background: "radial-gradient(circle at 45% 40%, rgba(255,255,255,0.04) 0%, rgba(232,0,0,0.05) 60%, rgba(232,0,0,0.02) 100%)",
          transform: `scale(${scale * 0.92})`,
          ...transitionStyle,
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center">
        <span
          className="text-[44px] font-extralight text-white tabular-nums select-none leading-none will-change-transform"
          style={{
            transform: `scale(${idle ? 1 : scale * 0.88})`,
            ...transitionStyle,
          }}
        >
          {countdown}
        </span>
        {!idle && (
          <span className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mt-1.5">
            {phaseLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════ */
export function BreathworkScreen({ userId, initialSessionsToday }: BreathworkScreenProps) {
  const { t } = useI18n();

  const [activePreset, setActivePreset] = useState<Preset["id"]>(() => {
    if (typeof window === "undefined") return DEFAULT_PRESET_ID;
    const stored = localStorage.getItem(`optiz-breathwork-preset-${userId}`) as Preset["id"] | null;
    if (stored && PRESETS.some((p) => p.id === stored)) return stored;
    return DEFAULT_PRESET_ID;
  });

  const config = useMemo<BreathState>(() => {
    const p = PRESETS.find((item) => item.id === activePreset) ?? PRESETS[0];
    return { inhale: p.inhale, hold: p.hold, exhale: p.exhale, cycles: p.cycles };
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
    const segs: PhaseSegment[] = [{ key: "inhale", seconds: config.inhale }];
    if (config.hold > 0) segs.push({ key: "hold", seconds: config.hold });
    segs.push({ key: "exhale", seconds: config.exhale });
    return segs;
  }, [config.exhale, config.hold, config.inhale]);

  const cycleSeconds = useMemo(() => phaseSegments.reduce((s, p) => s + p.seconds, 0), [phaseSegments]);
  const totalSeconds = Math.max(1, cycleSeconds * Math.max(1, config.cycles));
  const totalMs = totalSeconds * 1000;
  const elapsedSecFloat = Math.min(totalSeconds, elapsedMs / 1000);
  const currentInCycle = elapsedSecFloat % Math.max(1, cycleSeconds);

  const phaseData = useMemo(() => {
    let cursor = 0;
    for (const seg of phaseSegments) {
      const next = cursor + seg.seconds;
      if (currentInCycle < next) {
        return { key: seg.key, remaining: Math.max(0, Math.ceil(seg.seconds - (currentInCycle - cursor))), duration: seg.seconds };
      }
      cursor = next;
    }
    const last = phaseSegments[phaseSegments.length - 1];
    return { key: last.key, remaining: 0, duration: last.seconds };
  }, [currentInCycle, phaseSegments]);

  const phaseLabel = phaseData.key === "inhale" ? t("breathworkInhale") : phaseData.key === "hold" ? t("breathworkHold") : t("breathworkExhale");
  const nextPhaseLabel = (() => {
    const idx = phaseSegments.findIndex((p) => p.key === phaseData.key);
    const next = phaseSegments[(idx + 1) % phaseSegments.length];
    return next.key === "inhale" ? t("breathworkInhale") : next.key === "hold" ? t("breathworkHold") : t("breathworkExhale");
  })();
  const cycleNumber = Math.min(config.cycles, Math.floor(elapsedSecFloat / Math.max(1, cycleSeconds)) + 1);

  const finishSession = useCallback(() => {
    setRunning(false);
    if (soundOn) playWorkoutCompleteSound();
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title: t("breathworkComplete"), subtitle: t("breathworkSessionValidated"), xp: 25 });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2200);
    void completeBreathworkSession(userId, {
      presetId: activePreset, inhale: config.inhale, holdSec: config.hold, exhale: config.exhale, cycles: config.cycles,
    }).catch((err) => console.error("[OPTIZ] Failed to save breathwork session", err));
    setSessionsToday((prev) => prev + 1);
  }, [activePreset, config.cycles, config.exhale, config.hold, config.inhale, soundOn, t, userId]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + TICK_MS;
        if (next >= totalMs) { finishSession(); return totalMs; }
        return next;
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
    setActivePreset(presetId); setRunning(false); setElapsedMs(0); lastPhaseRef.current = "inhale";
  };
  const toggleSound = () => { const n = !soundOn; setSoundOnState(n); setSoundEnabled(n); };
  const resetSession = () => { setRunning(false); setElapsedMs(0); lastPhaseRef.current = "inhale"; };
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
    <div className="pb-8 relative">
      <XPToast toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Wind size={16} className="text-gray-7" />
          <h2 className="text-lg font-semibold text-gray-12">{t("breathworkTitle")}</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasStarted && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-3/40 border border-gray-5/20">
              <Timer size={11} className="text-gray-7" />
              <span className="text-[12px] font-semibold text-gray-11 tabular-nums">{formatClock(remainingTotal)}</span>
            </div>
          )}
          {sessionsToday > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#E80000]/6 border border-[#E80000]/12">
              <Zap size={10} className="text-[#FF6666]" />
              <span className="text-[10px] font-bold text-[#FF6666] tabular-nums">{sessionsToday}</span>
            </div>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 mb-5">
        {PRESETS.map((preset) => {
          const secs = (preset.inhale + preset.hold + preset.exhale) * preset.cycles;
          const sel = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border transition-colors duration-150 active:scale-[0.96]",
                sel
                  ? "bg-[#E80000]/6 border-[#E80000]/20"
                  : "bg-gray-3/20 border-gray-5/15"
              )}
            >
              <span className={cn("text-[12px] font-semibold", sel ? "text-[#FF6666]" : "text-gray-11")}>
                {t(preset.titleKey as Parameters<typeof t>[0])}
              </span>
              <span className={cn("text-[10px]", sel ? "text-[#FF6666]/60" : "text-gray-7")}>
                {formatDuration(secs)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        {/* Progress bar */}
        {hasStarted && (
          <div className="h-[2px] bg-gray-5/10">
            <div
              className="h-full bg-gradient-to-r from-[#E80000] to-[#FF4D4D]"
              style={{ width: `${overallProgress}%`, transition: "width 200ms linear" }}
            />
          </div>
        )}

        <div className="px-5 pt-5 pb-6">
          {/* Phase label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isFinished ? "done" : phaseData.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center mb-1"
            >
              <p className="text-xl font-medium text-gray-12">
                {isFinished ? t("breathworkFinished") : phaseLabel}
              </p>
            </motion.div>
          </AnimatePresence>

          {hasStarted && !isFinished && (
            <p className="text-[10px] text-gray-7 text-center mb-4">
              {t("breathworkCycle")} {cycleNumber}/{config.cycles} · {nextPhaseLabel}
            </p>
          )}
          {!hasStarted && <div className="h-4" />}

          {/* Orb — all CSS transitions, no JS animation loop */}
          <BreathingOrb
            phase={phaseData.key}
            phaseDuration={phaseData.duration}
            idle={isIdle}
            countdown={isFinished ? 0 : phaseData.remaining}
            phaseLabel={phaseLabel}
          />

          {/* Cycle dots */}
          <div className="flex items-center justify-center gap-1 mt-5 mb-6">
            {Array.from({ length: config.cycles }).map((_, i) => {
              const done = i < cycleNumber - 1;
              const active = i === cycleNumber - 1 && hasStarted;
              return (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    done ? "w-1 bg-[#E80000]"
                      : active ? "w-3 bg-[#FF4D4D]"
                      : "w-1 bg-white/[0.06]"
                  )}
                />
              );
            })}
          </div>

          {/* Controls */}
          {!hasStarted ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleMainAction}
                className="h-12 px-10 rounded-full optiz-gradient-bg text-white text-[14px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#E80000]/15 active:scale-[0.94] transition-transform"
              >
                <Play size={16} fill="white" /> {t("breathworkStart")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={resetSession}
                className="w-10 h-10 rounded-full border border-gray-5/20 bg-gray-3/20 text-gray-8 inline-flex items-center justify-center active:scale-[0.88] transition-transform"
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={handleMainAction}
                className="w-14 h-14 rounded-full optiz-gradient-bg text-white inline-flex items-center justify-center shadow-lg shadow-[#E80000]/20 active:scale-[0.88] transition-transform"
              >
                {running ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  "w-10 h-10 rounded-full border inline-flex items-center justify-center active:scale-[0.88] transition-transform",
                  soundOn ? "border-gray-5/20 bg-gray-3/20 text-gray-8" : "border-[#E80000]/15 bg-[#E80000]/4 text-[#FF6666]/50"
                )}
              >
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
