"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Footprints, Target, Zap } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import { upsertDailySteps } from "@/lib/actions";

interface StepsScreenProps {
  userId: string;
  onAwardXpEvent: (source: string, referenceId: string, xpAmount: number) => Promise<void>;
  initialData: {
    baseline: number;
    goal: number;
    done: number;
    milestonesAwarded: number[];
    goalHit: boolean;
  } | null;
}

interface StepsState {
  baseline: number;
  goal: number;
  done: number;
}

function clampInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ── StepProgressRing ── */
function StepProgressRing({
  progress,
  done,
  goal,
  stepsUnit,
}: {
  progress: number;
  done: number;
  goal: number;
  stepsUnit: string;
}) {
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, progress) / 100);

  return (
    <div className="relative mx-auto w-[180px] h-[180px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E80000" />
            <stop offset="100%" stopColor="#FF2D2D" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#stepGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Footprints size={20} className="text-gray-8 mb-1" />
        <p className="text-[36px] font-bold text-gray-12 tabular-nums leading-none">{done.toLocaleString()}</p>
        <p className="text-[13px] text-gray-8 mt-1">/ {goal.toLocaleString()} {stepsUnit}</p>
      </div>
    </div>
  );
}

/* ── Stepper Row ── */
function StepperRow({
  label,
  value,
  step,
  min,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-gray-10">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-8 rounded-lg border border-gray-5/35 bg-gray-3/30 text-[12px] font-semibold text-gray-11 inline-flex items-center justify-center"
        >
          -{step >= 1000 ? `${step / 1000}k` : step}
        </button>
        <span className="text-[15px] font-bold text-gray-12 tabular-nums w-[60px] text-center">
          {value.toLocaleString()}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-9 h-8 rounded-lg border border-gray-5/35 bg-gray-3/30 text-[12px] font-semibold text-gray-11 inline-flex items-center justify-center"
        >
          +{step >= 1000 ? `${step / 1000}k` : step}
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function StepsScreen({ userId, onAwardXpEvent, initialData }: StepsScreenProps) {
  const { t } = useI18n();

  const [state, setState] = useState<StepsState>(() => ({
    baseline: initialData?.baseline ?? 6000,
    goal: initialData?.goal ?? 8000,
    done: initialData?.done ?? 0,
  }));
  const [toast, setToast] = useState<XPToastData | null>(null);
  const [deltaBubble, setDeltaBubble] = useState(0);
  const [milestonesAwarded, setMilestonesAwarded] = useState<number[]>(initialData?.milestonesAwarded ?? []);
  const [goalHit, setGoalHit] = useState(initialData?.goalHit ?? false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistToServer = (next: StepsState, milestones: number[], goal: boolean) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertDailySteps(userId, getTodayISO(), {
        baseline: next.baseline,
        goal: next.goal,
        done: next.done,
        milestonesAwarded: milestones,
        goalHit: goal,
      }).catch((err) => console.error("[OPTIZ] Steps persist error:", err));
    }, 800);
  };

  const progress = useMemo(() => {
    if (state.goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((state.done / state.goal) * 100)));
  }, [state.done, state.goal]);

  const remaining = Math.max(0, state.goal - state.done);

  const showReward = (title: string, subtitle: string, xp: number, source: string, refId: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title, subtitle, xp });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2200);
    void onAwardXpEvent(source, refId, xp).catch((error) => {
      console.error("Failed to award steps XP", error);
    });
  };

  useEffect(() => {
    const today = getTodayISO();
    const thresholds = [
      { pct: 25, xp: 8 },
      { pct: 50, xp: 12 },
      { pct: 75, xp: 16 },
    ];

    let updated = false;
    let newMilestones = [...milestonesAwarded];
    let newGoalHit = goalHit;

    thresholds.forEach((item) => {
      if (progress >= item.pct && !newMilestones.includes(item.pct)) {
        newMilestones = [...newMilestones, item.pct];
        updated = true;
        showReward(
          t("stepsMilestoneTitle"),
          t("stepsMilestoneSubtitle", { pct: String(item.pct) }),
          item.xp,
          "steps_milestone",
          `steps-${item.pct}-${today}`,
        );
      }
    });

    if (!newGoalHit && progress >= 100) {
      newGoalHit = true;
      updated = true;
      showReward(
        t("stepsGoalTitle"),
        t("stepsGoalSubtitle"),
        30,
        "steps_goal",
        `steps-goal-${today}`,
      );
    }

    if (updated) {
      setMilestonesAwarded(newMilestones);
      setGoalHit(newGoalHit);
      persistToServer(state, newMilestones, newGoalHit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const updateState = (next: StepsState) => {
    setState(next);
    persistToServer(next, milestonesAwarded, goalHit);
  };

  const shiftDone = (delta: number) => {
    const next = { ...state, done: clampInt(state.done + delta) };
    updateState(next);
    setDeltaBubble(delta);
    setTimeout(() => setDeltaBubble(0), 320);
  };

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      {/* Header */}
      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("stepsTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("stepsSubtitle")}</p>
      </div>

      {/* Progress Hero Card */}
      <motion.section
        className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <AnimatePresence>
            {deltaBubble !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: -6, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="absolute left-1/2 -translate-x-1/2 top-2 z-10 text-[14px] font-semibold text-[#FF6D6D]"
              >
                {deltaBubble > 0 ? `+${deltaBubble}` : deltaBubble}
              </motion.div>
            )}
          </AnimatePresence>

          <StepProgressRing
            progress={progress}
            done={state.done}
            goal={state.goal}
            stepsUnit={t("stepsUnit")}
          />
        </div>

        {/* Stats below ring */}
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("stepsRemaining")}</p>
            <p className="text-[18px] font-semibold text-gray-12 tabular-nums">{remaining.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">Progress</p>
            <p className="text-[18px] font-semibold text-[#FF6A6A] tabular-nums">{progress}%</p>
          </div>
        </div>
      </motion.section>

      {/* Step Adjustment Card */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[100, 500, 1000].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => shiftDone(delta)}
              className="h-12 rounded-xl border border-[#E80000]/35 bg-[#E80000]/10 text-[15px] font-semibold text-[#FF6D6D] active:scale-95 transition-transform"
            >
              +{delta}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[-100, -10, 10, 50].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => shiftDone(delta)}
              className="h-9 rounded-xl border border-gray-5/35 bg-gray-3/30 text-[13px] font-medium text-gray-11 active:scale-95 transition-transform"
            >
              {delta > 0 ? `+${delta}` : String(delta)}
            </button>
          ))}
        </div>
      </section>

      {/* Goal Settings — always visible, compact steppers */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4 space-y-3">
        <h3 className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
          <Target size={15} /> {t("stepsDailyGoal")}
        </h3>

        <StepperRow
          label={t("stepsGoal")}
          value={state.goal}
          step={500}
          min={500}
          onChange={(next) => updateState({ ...state, goal: Math.max(next, state.baseline + 500) })}
        />

        <StepperRow
          label={t("stepsBase")}
          value={state.baseline}
          step={500}
          min={0}
          onChange={(next) => updateState({ ...state, baseline: next, goal: Math.max(state.goal, next + 500) })}
        />
      </section>

      {/* Coach tip */}
      <section className="rounded-3xl border border-[#E80000]/15 bg-gradient-to-r from-[#E80000]/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E80000]/12 border border-[#E80000]/20 flex items-center justify-center shrink-0">
            <Zap size={14} className="text-[#FF6666]" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-11 mb-0.5">Coach</p>
            <p className="text-[12px] text-gray-9 leading-relaxed">{t("stepsCoachTip")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
