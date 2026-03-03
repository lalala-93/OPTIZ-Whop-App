"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface BreathworkScreenProps {
  userId: string;
  onAwardXp: (xp: number) => Promise<void>;
}

interface BreathState {
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

interface Preset extends BreathState {
  id: string;
  title: string;
  subtitle: string;
}

interface BreathRewardsState {
  date: string;
  sessionsDone: number;
}

const PRESETS: Preset[] = [
  { id: "reset-quick", title: "Reset rapide", subtitle: "4-4-4 · 3 cycles", inhale: 4, hold: 4, exhale: 4, cycles: 3 },
  { id: "focus", title: "Focus 2 min", subtitle: "4-2-6 · 10 cycles", inhale: 4, hold: 2, exhale: 6, cycles: 10 },
  { id: "calm", title: "Calme 3 min", subtitle: "4-4-6 · 15 cycles", inhale: 4, hold: 4, exhale: 6, cycles: 15 },
];

const DEFAULT_CONFIG = PRESETS[1];

function storageKey(userId: string) {
  return `optiz-breathwork-v3-${userId}`;
}

function rewardsKey(userId: string) {
  return `optiz-breathwork-rewards-v1-${userId}`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BreathRing({
  phaseProgress,
  totalProgress,
  seconds,
  scale,
}: {
  phaseProgress: number;
  totalProgress: number;
  seconds: number;
  scale: number;
}) {
  const size = 256;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const phaseOffset = circumference * (1 - Math.max(0, Math.min(1, phaseProgress)));
  const totalOffset = circumference * (1 - Math.max(0, Math.min(1, totalProgress)));

  return (
    <motion.div className="relative mx-auto w-[256px] h-[256px]" animate={{ scale }} transition={{ duration: 0.5, ease: "easeInOut" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="14" />
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
          transition={{ duration: 0.2 }}
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
          animate={{ strokeDashoffset: phaseOffset }}
          transition={{ duration: 0.2 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[60px] leading-none font-semibold text-gray-12 tabular-nums">{seconds}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-7 mt-1">sec</p>
      </div>
    </motion.div>
  );
}

export function BreathworkScreen({ userId, onAwardXp }: BreathworkScreenProps) {
  const [config, setConfig] = useState<BreathState>(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState(DEFAULT_CONFIG.id);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [toast, setToast] = useState<XPToastData | null>(null);

  const [rewards, setRewards] = useState<BreathRewardsState>({ date: todayKey(), sessionsDone: 0 });

  const lastPhaseRef = useRef("Inspire");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawState = localStorage.getItem(storageKey(userId));
    if (rawState) {
      try {
        setConfig(JSON.parse(rawState) as BreathState);
      } catch (error) {
        console.error("Failed to parse breathwork state", error);
      }
    }

    const rawRewards = localStorage.getItem(rewardsKey(userId));
    if (rawRewards) {
      try {
        const parsed = JSON.parse(rawRewards) as BreathRewardsState;
        if (parsed.date === todayKey()) {
          setRewards(parsed);
        }
      } catch (error) {
        console.error("Failed to parse breathwork rewards", error);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(config));
  }, [config, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(rewardsKey(userId), JSON.stringify(rewards));
  }, [rewards, userId]);

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
          if (soundOn) playWorkoutCompleteSound();

          const id = `${Date.now()}-${Math.random()}`;
          setToast({ id, title: "Breathwork termine", subtitle: "Session validee", xp: 25 });
          setTimeout(() => setToast((prevToast) => (prevToast?.id === id ? null : prevToast)), 2200);
          void onAwardXp(25).catch((error) => {
            console.error("Failed to award breathwork XP", error);
          });

          const today = todayKey();
          setRewards((prevRewards) => {
            if (prevRewards.date !== today) {
              return { date: today, sessionsDone: 1 };
            }
            return { ...prevRewards, sessionsDone: prevRewards.sessionsDone + 1 };
          });

          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, totalSeconds, onAwardXp, soundOn]);

  const currentInCycle = elapsed % cycleSeconds;

  const phase = useMemo(() => {
    if (currentInCycle < config.inhale) return "Inspire";
    if (currentInCycle < config.inhale + config.hold) return "Bloque";
    return "Expire";
  }, [currentInCycle, config]);

  useEffect(() => {
    if (!running || !soundOn) return;
    if (phase !== lastPhaseRef.current) {
      playPhaseChangeSound();
      lastPhaseRef.current = phase;
    }
  }, [phase, running, soundOn]);

  const phaseDuration = useMemo(() => {
    if (phase === "Inspire") return config.inhale;
    if (phase === "Bloque") return Math.max(1, config.hold);
    return config.exhale;
  }, [phase, config]);

  const phaseElapsed = useMemo(() => {
    if (phase === "Inspire") return currentInCycle;
    if (phase === "Bloque") return currentInCycle - config.inhale;
    return currentInCycle - config.inhale - config.hold;
  }, [phase, currentInCycle, config]);

  const phaseSecondsLeft = Math.max(1, phaseDuration - phaseElapsed);
  const totalProgress = Math.min(1, elapsed / totalSeconds);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));
  const cycleNumber = Math.min(config.cycles, Math.floor(elapsed / cycleSeconds) + 1);

  const scale = useMemo(() => {
    if (!running) return 1;
    if (phase === "Inspire") return 1.06;
    if (phase === "Bloque") return 1.03;
    return 0.96;
  }, [phase, running]);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setConfig({ inhale: preset.inhale, hold: preset.hold, exhale: preset.exhale, cycles: preset.cycles });
    setRunning(false);
    setElapsed(0);
    lastPhaseRef.current = "Inspire";
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Breathwork</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Respiration guidee, simple et efficace: suis le rythme, reste regulier, et reduis ton stress en quelques minutes.
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
                activePreset === preset.id ? "border-[#E80000]/35 bg-[#E80000]/12" : "border-gray-5/30 bg-gray-3/20"
              }`}
            >
              <p className="text-[13px] font-semibold text-gray-12">{preset.title}</p>
              <p className="text-[11px] text-gray-8 mt-0.5">{preset.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-end mb-2">
          <button
            onClick={toggleSound}
            className="w-9 h-9 rounded-full border border-gray-5/35 bg-gray-3/28 text-gray-9 flex items-center justify-center"
            aria-label="Sound"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        <BreathRing phaseProgress={phaseProgress} totalProgress={totalProgress} seconds={elapsed >= totalSeconds ? 0 : phaseSecondsLeft} scale={scale} />

        <div className="mt-3 text-center">
          <p className="text-[17px] font-semibold text-[#FF6666]">{phase}</p>
          <p className="text-[12px] text-gray-8">Cycle {cycleNumber}/{config.cycles}</p>
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
              if (soundOn) playStartSound();
            }}
            className="h-11 px-5 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Play size={14} /> Lancer
          </button>

          <button
            type="button"
            onClick={() => setRunning((prev) => !prev)}
            className="h-11 px-5 rounded-xl border border-gray-5/35 bg-gray-3/35 text-sm text-gray-11 font-semibold inline-flex items-center gap-1.5"
          >
            <Pause size={14} /> {running ? "Pause" : "Reprendre"}
          </button>

          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setElapsed(0);
              lastPhaseRef.current = "Inspire";
            }}
            className="h-11 px-5 rounded-xl border border-gray-5/35 bg-gray-3/35 text-sm text-gray-11 font-semibold inline-flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">
          Regle simple: inspire par le nez, garde la cage thoracique stable, expire lentement. Si tu te sens tendu, diminue les cycles mais garde la regularite.
        </p>
      </section>
    </div>
  );
}
