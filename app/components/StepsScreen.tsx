"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Footprints, Target, Zap } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import { upsertDailySteps, getDailySteps, getStepsHistory } from "@/lib/actions";

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
  const [historyView, setHistoryView] = useState<"daily" | "weekly">("daily");
  const [historyData, setHistoryData] = useState<{ log_date: string; done: number; goal: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ state: StepsState; milestones: number[]; goalHit: boolean } | null>(null);

  const flushNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    upsertDailySteps(userId, getTodayISO(), {
      baseline: p.state.baseline,
      goal: p.state.goal,
      done: p.state.done,
      milestonesAwarded: p.milestones,
      goalHit: p.goalHit,
    }).catch((err) => console.error("[OPTIZ] Steps persist error:", err));
  }, [userId]);

  const persistToServer = (next: StepsState, milestones: number[], goal: boolean) => {
    pendingRef.current = { state: next, milestones, goalHit: goal };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushNow, 800);
  };

  // Fetch fresh data on mount (fixes stale SSR initialData after tab switches)
  useEffect(() => {
    let cancelled = false;
    getDailySteps(userId, getTodayISO()).then((row) => {
      if (cancelled || !row) return;
      setState({
        baseline: row.baseline ?? 6000,
        goal: row.goal ?? 8000,
        done: row.done ?? 0,
      });
      setMilestonesAwarded((row.milestones_awarded as number[]) ?? []);
      setGoalHit(row.goal_hit ?? false);
    }).catch((err) => console.error("[OPTIZ] Steps fetch error:", err));
    return () => { cancelled = true; flushNow(); };
  }, [userId, flushNow]);

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

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    const days = historyView === "daily" ? 7 : 28;
    getStepsHistory(userId, days).then((data) => {
      if (cancelled) return;
      setHistoryData(data.map((d) => ({ log_date: d.log_date, done: d.done ?? 0, goal: d.goal ?? 0 })));
      setLoadingHistory(false);
    }).catch(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [userId, historyView]);

  const weeklyAggregated = useMemo(() => {
    if (historyView !== "weekly" || historyData.length === 0) return [];
    const weeks: { label: string; done: number; goal: number }[] = [];
    for (let i = 0; i < historyData.length; i += 7) {
      const chunk = historyData.slice(i, i + 7);
      const totalDone = chunk.reduce((s, d) => s + (d.done || 0), 0);
      const avgGoal = Math.round(chunk.reduce((s, d) => s + (d.goal || 0), 0) / chunk.length);
      const startDate = new Date(chunk[0].log_date);
      const label = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
      weeks.push({ label, done: totalDone, goal: avgGoal * chunk.length });
    }
    return weeks;
  }, [historyView, historyData]);

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

      {/* History */}
      <motion.section
        className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <BarChart3 size={15} /> {t("stepsHistory")}
          </h3>
          <div className="flex items-center bg-gray-4/30 rounded-lg p-0.5">
            {(["daily", "weekly"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setHistoryView(view)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  historyView === view ? "bg-[#E80000]/15 text-[#FF6D6D]" : "text-gray-8"
                }`}
              >
                {view === "daily" ? t("stepsDaily") : t("stepsWeeklyView")}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-6 border-t-[#E80000] rounded-full animate-spin" />
          </div>
        ) : (() => {
          const items = historyView === "daily"
            ? historyData.map((d) => ({
                label: new Date(d.log_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
                done: d.done || 0,
                goal: d.goal || 0,
              }))
            : weeklyAggregated;

          if (items.length === 0) {
            return (
              <div className="h-[180px] flex items-center justify-center text-[13px] text-gray-7">
                {t("stepsNoData")}
              </div>
            );
          }

          const maxVal = Math.max(...items.map((d) => Math.max(d.done, d.goal)), 1);

          return (
            <div className="relative h-[180px]">
              <div className="flex items-end gap-2 h-full">
                {items.map((item, i) => {
                  const barH = Math.max(4, (item.done / maxVal) * 160);
                  const goalH = (item.goal / maxVal) * 160;
                  const hit = item.done >= item.goal && item.goal > 0;
                  return (
                    <div key={`${item.label}-${i}`} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <span className="text-[9px] font-medium text-gray-8 tabular-nums">
                        {item.done > 0 ? (item.done >= 1000 ? `${(item.done / 1000).toFixed(1)}k` : item.done) : ""}
                      </span>
                      <div className="relative w-full flex justify-center">
                        <motion.div
                          className="rounded-md w-full max-w-[32px]"
                          style={{
                            background: hit
                              ? "linear-gradient(to top, #E80000, #FF2D2D)"
                              : "linear-gradient(to top, rgba(232,0,0,0.3), rgba(255,45,45,0.15))",
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: barH }}
                          transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 14 }}
                        />
                        {item.goal > 0 && (
                          <div
                            className="absolute left-0 right-0 border-t border-dashed border-gray-6/50"
                            style={{ bottom: goalH }}
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-gray-7">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-7">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#E80000]" />
            <span>{t("stepsTitle")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0 border-t border-dashed border-gray-6" />
            <span>{t("stepsGoal")}</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
