"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { playStartSound, playWorkoutCompleteSound } from "./sounds";

interface BreathworkScreenProps {
  userId: string;
}

interface BreathState {
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

const DEFAULT_STATE: BreathState = {
  inhale: 4,
  hold: 4,
  exhale: 4,
  cycles: 10,
};

function storageKey(userId: string) {
  return `optiz-breathwork-v1-${userId}`;
}

function CircularTimer({ progress, secondsLeft }: { progress: number; secondsLeft: number }) {
  const size = 232;
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto w-[232px] h-[232px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E80000"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transition={{ duration: 0.25, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-5xl font-semibold text-gray-12 tabular-nums">{secondsLeft}</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-7 mt-1">sec</p>
      </div>
    </div>
  );
}

export function BreathworkScreen({ userId }: BreathworkScreenProps) {
  const [config, setConfig] = useState<BreathState>(DEFAULT_STATE);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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

  const phaseSecondsLeft = useMemo(() => {
    if (phase === "Inspire") return Math.max(1, config.inhale - currentInCycle);
    if (phase === "Bloque") return Math.max(1, config.inhale + config.hold - currentInCycle);
    return Math.max(1, cycleSeconds - currentInCycle);
  }, [phase, config.inhale, config.hold, currentInCycle, cycleSeconds]);

  const cycleIndex = Math.min(config.cycles, Math.floor(elapsed / cycleSeconds) + 1);
  const progress = Math.min(1, elapsed / totalSeconds);
  const done = elapsed >= totalSeconds;

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Breathwork</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Protocole court pour baisser la charge mentale et améliorer la recuperation.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <label className="text-[11px] text-gray-8">Inspire
            <input
              type="number"
              min={2}
              max={8}
              value={config.inhale}
              disabled={running}
              onChange={(event) => setConfig((prev) => ({ ...prev, inhale: Math.max(2, Number(event.target.value || "2")) }))}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12 disabled:opacity-60"
            />
          </label>

          <label className="text-[11px] text-gray-8">Bloque
            <input
              type="number"
              min={0}
              max={8}
              value={config.hold}
              disabled={running}
              onChange={(event) => setConfig((prev) => ({ ...prev, hold: Math.max(0, Number(event.target.value || "0")) }))}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12 disabled:opacity-60"
            />
          </label>

          <label className="text-[11px] text-gray-8">Expire
            <input
              type="number"
              min={2}
              max={10}
              value={config.exhale}
              disabled={running}
              onChange={(event) => setConfig((prev) => ({ ...prev, exhale: Math.max(2, Number(event.target.value || "2")) }))}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12 disabled:opacity-60"
            />
          </label>

          <label className="text-[11px] text-gray-8">Cycles
            <input
              type="number"
              min={3}
              max={20}
              value={config.cycles}
              disabled={running}
              onChange={(event) => setConfig((prev) => ({ ...prev, cycles: Math.max(3, Number(event.target.value || "3")) }))}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12 disabled:opacity-60"
            />
          </label>
        </div>

        <CircularTimer progress={progress} secondsLeft={done ? 0 : phaseSecondsLeft} />

        <div className="mt-3 text-center">
          <p className="text-sm text-[#FF6666] font-semibold">{phase}</p>
          <p className="text-xs text-gray-8">Cycle {cycleIndex}/{config.cycles}</p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setElapsed(0);
              setRunning(true);
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

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">
          Format conseille: 4-4-4 sur 10 cycles. Si tu es tres stresse, ralentis la transition et prolonge lexpiration.
        </p>
      </section>
    </div>
  );
}
