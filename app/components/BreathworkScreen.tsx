"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playPhaseChangeSound, playStartSound, playWorkoutCompleteSound } from "./sounds";

interface BreathworkScreenProps {
  userId: string;
}

interface BreathState {
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

interface Preset extends BreathState {
  id: string;
  label: string;
  subtitle: string;
}

const PRESETS: Preset[] = [
  { id: "reset", label: "Reset 30s", subtitle: "4-4-4 x 3", inhale: 4, hold: 4, exhale: 4, cycles: 3 },
  { id: "focus", label: "Focus 2min", subtitle: "4-2-6 x 12", inhale: 4, hold: 2, exhale: 6, cycles: 12 },
  { id: "calm", label: "Calm 3min", subtitle: "4-4-6 x 15", inhale: 4, hold: 4, exhale: 6, cycles: 15 },
];

const DEFAULT_STATE: BreathState = PRESETS[1];

function storageKey(userId: string) {
  return `optiz-breathwork-v2-${userId}`;
}

function CircularTimer({
  phaseProgress,
  totalProgress,
  secondsLeft,
  scale,
}: {
  phaseProgress: number;
  totalProgress: number;
  secondsLeft: number;
  scale: number;
}) {
  const size = 248;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const phaseOffset = circumference * (1 - Math.max(0, Math.min(1, phaseProgress)));
  const totalOffset = circumference * (1 - Math.max(0, Math.min(1, totalProgress)));

  return (
    <motion.div className="relative mx-auto w-[248px] h-[248px]" animate={{ scale }} transition={{ duration: 0.45, ease: "easeInOut" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(232,0,0,0.35)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={totalOffset}
          transition={{ duration: 0.25, ease: "linear" }}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 12}
          fill="none"
          stroke="#E80000"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (radius - 12)}
          strokeDashoffset={(2 * Math.PI * (radius - 12)) * (1 - Math.max(0, Math.min(1, phaseProgress)))}
          transition={{ duration: 0.2, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-6xl font-semibold text-gray-12 tabular-nums leading-none">{secondsLeft}</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-7 mt-1">sec</p>
      </div>
    </motion.div>
  );
}

export function BreathworkScreen({ userId }: BreathworkScreenProps) {
  const [config, setConfig] = useState<BreathState>(DEFAULT_STATE);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [presetId, setPresetId] = useState(PRESETS[1].id);
  const lastPhaseRef = useRef<string>("Inspire");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as BreathState;
      setConfig(parsed);
    } catch (error) {
      console.error("Failed to parse breathwork state", error);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(config));
  }, [config, userId]);

  const cycleSeconds = Math.max(1, config.inhale + config.hold + config.exhale);
  const totalSeconds = Math.max(1, cycleSeconds * Math.max(1, config.cycles));

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(timer);
          setRunning(false);
          playWorkoutCompleteSound();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, totalSeconds]);

  const currentInCycle = elapsed % cycleSeconds;

  const phase = useMemo(() => {
    if (currentInCycle < config.inhale) return "Inspire";
    if (currentInCycle < config.inhale + config.hold) return "Bloque";
    return "Expire";
  }, [currentInCycle, config.inhale, config.hold]);

  useEffect(() => {
    if (!running) return;
    if (phase !== lastPhaseRef.current) {
      playPhaseChangeSound();
      lastPhaseRef.current = phase;
    }
  }, [phase, running]);

  const phaseDuration = useMemo(() => {
    if (phase === "Inspire") return config.inhale;
    if (phase === "Bloque") return Math.max(1, config.hold);
    return config.exhale;
  }, [phase, config.inhale, config.hold, config.exhale]);

  const phaseElapsed = useMemo(() => {
    if (phase === "Inspire") return currentInCycle;
    if (phase === "Bloque") return currentInCycle - config.inhale;
    return currentInCycle - config.inhale - config.hold;
  }, [phase, currentInCycle, config.inhale, config.hold]);

  const phaseSecondsLeft = Math.max(1, phaseDuration - phaseElapsed);
  const cycleIndex = Math.min(config.cycles, Math.floor(elapsed / cycleSeconds) + 1);
  const totalProgress = Math.min(1, elapsed / totalSeconds);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));

  const breathScale = useMemo(() => {
    if (phase === "Inspire") return 1.04;
    if (phase === "Bloque") return 1.02;
    return 0.97;
  }, [phase]);

  const applyPreset = (preset: Preset) => {
    setPresetId(preset.id);
    setConfig({ inhale: preset.inhale, hold: preset.hold, exhale: preset.exhale, cycles: preset.cycles });
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Breathwork</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Protocoles courts et guides pour recuperation, focus et baisse du stress.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                presetId === preset.id
                  ? "border-[#E80000]/35 bg-[#E80000]/12"
                  : "border-gray-5/30 bg-gray-3/20"
              }`}
            >
              <p className="text-[13px] text-gray-12 font-semibold">{preset.label}</p>
              <p className="text-[11px] text-gray-8 mt-0.5">{preset.subtitle}</p>
            </button>
          ))}
        </div>

        <CircularTimer
          phaseProgress={phaseProgress}
          totalProgress={totalProgress}
          secondsLeft={elapsed >= totalSeconds ? 0 : phaseSecondsLeft}
          scale={running ? breathScale : 1}
        />

        <div className="mt-3 text-center">
          <p className="text-[15px] text-[#FF6666] font-semibold">{phase}</p>
          <p className="text-xs text-gray-8">Cycle {cycleIndex}/{config.cycles}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">Inspire {config.inhale}s</div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">Bloque {config.hold}s</div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">Expire {config.exhale}s</div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setElapsed(0);
              setRunning(true);
              lastPhaseRef.current = "Inspire";
              playStartSound();
            }}
            className="h-11 px-5 rounded-xl optiz-gradient-bg text-white text-sm font-semibold"
          >
            {running ? "Relancer" : "Lancer"}
          </button>

          <button
            type="button"
            onClick={() => setRunning((prev) => !prev)}
            className="h-11 px-5 rounded-xl border border-gray-5/35 bg-gray-3/35 text-sm text-gray-11 font-semibold"
          >
            {running ? "Pause" : "Reprendre"}
          </button>

          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setElapsed(0);
            }}
            className="h-11 px-5 rounded-xl border border-gray-5/35 bg-gray-3/35 text-sm text-gray-11 font-semibold"
          >
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
