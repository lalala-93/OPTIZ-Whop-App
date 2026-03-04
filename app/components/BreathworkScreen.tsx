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

interface Preset extends BreathState {
  id: string;
  titleKey: "breathworkPresetQuick" | "breathworkPresetFocus" | "breathworkPresetCalm";
  subtitle: string;
}

const PRESETS: Preset[] = [
  { id: "reset-quick", titleKey: "breathworkPresetQuick", subtitle: "4-4-4 · 3 cycles", inhale: 4, hold: 4, exhale: 4, cycles: 3 },
  { id: "focus", titleKey: "breathworkPresetFocus", subtitle: "4-2-6 · 10 cycles", inhale: 4, hold: 2, exhale: 6, cycles: 10 },
  { id: "calm", titleKey: "breathworkPresetCalm", subtitle: "4-4-6 · 15 cycles", inhale: 4, hold: 4, exhale: 6, cycles: 15 },
];

const DEFAULT_CONFIG = PRESETS[1];

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
  const [activePreset, setActivePreset] = useState(DEFAULT_CONFIG.id);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [toast, setToast] = useState<XPToastData | null>(null);
  const [sessionsToday, setSessionsToday] = useState(initialSessionsToday);

  const lastPhaseRef = useRef("Inspire");

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`optiz-breathwork-config-${userId}`, JSON.stringify(config));
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
          if (soundOn) playWorkoutCompleteSound();

          const id = `${Date.now()}-${Math.random()}`;
          setToast({ id, title: t("breathworkComplete"), subtitle: t("breathworkSessionValidated"), xp: 25 });
          setTimeout(() => setToast((prevToast) => (prevToast?.id === id ? null : prevToast)), 2200);

          // Persist to server
          completeBreathworkSession(userId, {
            presetId: activePreset,
            inhale: config.inhale,
            holdSec: config.hold,
            exhale: config.exhale,
            cycles: config.cycles,
          }).catch((err) => console.error("[OPTIZ] Failed to save breathwork session", err));

          setSessionsToday((prev) => prev + 1);

          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, totalSeconds, soundOn, userId, config, activePreset, t]);

  const currentInCycle = elapsed % cycleSeconds;

  const phase = useMemo(() => {
    if (currentInCycle < config.inhale) return "Inspire";
    if (currentInCycle < config.inhale + config.hold) return "Bloque";
    return "Expire";
  }, [currentInCycle, config]);

  const phaseLabel = useMemo(() => {
    if (phase === "Inspire") return t("breathworkInhale");
    if (phase === "Bloque") return t("breathworkHold");
    return t("breathworkExhale");
  }, [phase, t]);

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
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("breathworkTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          {t("breathworkSubtitle")}
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
              <p className="text-[13px] font-semibold text-gray-12">{t(preset.titleKey)}</p>
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
          <p className="text-[17px] font-semibold text-[#FF6666]">{phaseLabel}</p>
          <p className="text-[12px] text-gray-8">{t("breathworkCycle")} {cycleNumber}/{config.cycles}</p>
          <p className="text-[11px] text-gray-8 mt-1">{t("breathworkSessionsToday")} {sessionsToday}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">{t("breathworkInhale")} {config.inhale}s</div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">{t("breathworkHold")} {config.hold}s</div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-2 text-center text-gray-10">{t("breathworkExhale")} {config.exhale}s</div>
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
            <Play size={14} /> {t("breathworkStart")}
          </button>

          <button
            type="button"
            onClick={() => setRunning((prev) => !prev)}
            className="h-11 px-5 rounded-xl border border-gray-5/35 bg-gray-3/35 text-sm text-gray-11 font-semibold inline-flex items-center gap-1.5"
          >
            <Pause size={14} /> {running ? t("breathworkPause") : t("breathworkResume")}
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
            <RotateCcw size={14} /> {t("reset")}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">
          {t("breathworkTip")}
        </p>
      </section>
    </div>
  );
}
