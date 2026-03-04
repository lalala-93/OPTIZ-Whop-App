"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Footprints, Target } from "lucide-react";
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

function RunnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#E80000]">
      <circle cx="14" cy="4" r="2" fill="currentColor" />
      <path d="M12 8l-3 3 2 2 2-2 1.5 2 3 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14l-2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

  // Debounced server persist
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

  // Check milestones and goal on progress change
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

      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("stepsTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          {t("stepsSubtitle")}
        </p>
      </div>

      <motion.section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Footprints size={15} /> {t("stepsDailyGoal")}
          </h3>
          <span className="text-[13px] font-semibold text-[#FF6A6A] tabular-nums">{progress}%</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <label className="text-[10px] text-gray-7">
            {t("stepsBase")}
            <input
              type="number"
              value={state.baseline}
              min={0}
              onChange={(event) => {
                const next = clampInt(Number(event.target.value || "0"));
                updateState({ ...state, baseline: next, goal: Math.max(state.goal, next + 500) });
              }}
              className="mt-1 h-10 w-full rounded-lg bg-gray-3/35 border border-gray-5/35 px-2.5 text-sm text-gray-12"
            />
          </label>

          <label className="text-[10px] text-gray-7">
            {t("stepsGoal")}
            <input
              type="number"
              value={state.goal}
              min={0}
              onChange={(event) => {
                const next = clampInt(Number(event.target.value || "0"));
                updateState({ ...state, goal: Math.max(next, state.baseline + 500) });
              }}
              className="mt-1 h-10 w-full rounded-lg bg-gray-3/35 border border-gray-5/35 px-2.5 text-sm text-gray-12"
            />
          </label>

          <label className="text-[10px] text-gray-7">
            {t("stepsDone")}
            <input
              type="number"
              value={state.done}
              min={0}
              onChange={(event) => {
                const next = clampInt(Number(event.target.value || "0"));
                updateState({ ...state, done: next });
              }}
              className="mt-1 h-10 w-full rounded-lg bg-gray-3/35 border border-gray-5/35 px-2.5 text-sm text-gray-12"
            />
          </label>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => updateState({ ...state, goal: state.goal + 500 })}
            className="h-9 px-3 rounded-lg border border-gray-5/35 bg-gray-3/30 text-xs text-gray-11 font-semibold"
          >
            +500 {t("stepsGoal").toLowerCase()}
          </button>
          <button
            type="button"
            onClick={() => updateState({ ...state, goal: state.goal + 1000 })}
            className="h-9 px-3 rounded-lg border border-gray-5/35 bg-gray-3/30 text-xs text-gray-11 font-semibold"
          >
            +1000 {t("stepsGoal").toLowerCase()}
          </button>
        </div>

        <div className="relative rounded-2xl border border-gray-5/30 bg-gray-3/20 px-3 py-4">
          <div className="h-1.5 rounded-full bg-gray-4/60 overflow-hidden">
            <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} transition={{ duration: 0.28 }} />
          </div>

          <motion.div
            className="absolute -top-2"
            animate={{ left: `calc(${progress}% - 9px)` }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          >
            <div className="w-[22px] h-[22px] rounded-full border border-[#E80000]/35 bg-[#130909] flex items-center justify-center">
              <RunnerIcon />
            </div>
          </motion.div>

          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className="text-gray-8 tabular-nums">{state.done} / {state.goal} {t("stepsUnit")}</span>
            <span className="text-gray-9 tabular-nums">{remaining} {t("stepsRemaining")}</span>
          </div>

          <AnimatePresence>
            {deltaBubble !== 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: -6, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="absolute right-3 top-2 text-[12px] font-semibold text-[#FF6D6D]"
              >
                {deltaBubble > 0 ? `+${deltaBubble}` : deltaBubble}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[-10, +10, +100, +1000].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => shiftDone(delta)}
              className={`h-10 rounded-xl border text-sm font-semibold ${
                delta < 0
                  ? "border-gray-5/35 bg-gray-3/30 text-gray-11"
                  : "border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6D6D]"
              }`}
            >
              {delta > 0 ? `+${delta}` : String(delta)}
            </button>
          ))}
        </div>
      </motion.section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed inline-flex items-start gap-1.5">
          <Target size={14} className="mt-0.5 shrink-0" />
          {t("stepsCoachTip")}
        </p>
      </section>
    </div>
  );
}
