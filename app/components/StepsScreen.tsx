"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Footprints, Target } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import { upsertDailySteps, getDailySteps, getStepsHistory } from "@/lib/actions";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

/* ── StepProgressBar ── */
function StepProgressBar({
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
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[32px] font-bold text-gray-12 tabular-nums leading-none tracking-tight">
          {done.toLocaleString()}
        </p>
        <p className="text-[13px] text-gray-8 tabular-nums">
          / {goal.toLocaleString()} {stepsUnit}
        </p>
      </div>
      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#E80000]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-gray-7 tabular-nums">{progress}%</p>
        <p className="text-[11px] text-gray-7 tabular-nums">{Math.max(0, goal - done).toLocaleString()} {stepsUnit} left</p>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-8 rounded-lg border-gray-5/35 bg-gray-3/30 text-[12px] font-semibold text-gray-11 px-0"
        >
          -{step >= 1000 ? `${step / 1000}k` : step}
        </Button>
        <span className="text-[15px] font-bold text-gray-12 tabular-nums w-[60px] text-center">
          {value.toLocaleString()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(value + step)}
          className="w-9 h-8 rounded-lg border-gray-5/35 bg-gray-3/30 text-[12px] font-semibold text-gray-11 px-0"
        >
          +{step >= 1000 ? `${step / 1000}k` : step}
        </Button>
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
  const [deltaKey, setDeltaKey] = useState(0);
  const [milestonesAwarded, setMilestonesAwarded] = useState<number[]>(initialData?.milestonesAwarded ?? []);
  const [goalHit, setGoalHit] = useState(initialData?.goalHit ?? false);
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
    getStepsHistory(userId, 7).then((data) => {
      if (cancelled) return;
      setHistoryData(data.map((d) => ({ log_date: d.log_date, done: d.done ?? 0, goal: d.goal ?? 0 })));
      setLoadingHistory(false);
    }).catch(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const updateState = (next: StepsState) => {
    setState(next);
    persistToServer(next, milestonesAwarded, goalHit);
  };

  const shiftDone = (delta: number) => {
    const next = { ...state, done: clampInt(state.done + delta) };
    updateState(next);
    setDeltaBubble(delta);
    setDeltaKey((k) => k + 1);
    setTimeout(() => setDeltaBubble(0), 900);
  };

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-12 mb-1">{t("stepsTitle")}</h2>
        <p className="text-[13px] text-gray-8 leading-relaxed">{t("stepsSubtitle")}</p>
      </div>

      {/* Progress Card */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl border-white/[0.06] bg-white/[0.03] shadow-none">
          <CardContent className="p-5">
            <StepProgressBar
              progress={progress}
              done={state.done}
              goal={state.goal}
              stepsUnit={t("stepsUnit")}
            />
          </CardContent>
        </Card>
      </motion.section>

      {/* Quick Add Card */}
      <Card className="rounded-2xl border-white/[0.06] bg-white/[0.03] shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-11 inline-flex items-center gap-1.5">
              <Footprints size={14} className="text-gray-8" /> {t("stepsTitle")}
            </h3>
            {/* Inline delta feedback */}
            <AnimatePresence mode="wait">
              {deltaBubble !== 0 && (
                <motion.span
                  key={deltaKey}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "text-[13px] font-semibold tabular-nums",
                    deltaBubble > 0 ? "text-emerald-400" : "text-gray-9",
                  )}
                >
                  {deltaBubble > 0 ? "+" : ""}{deltaBubble.toLocaleString()} {t("stepsUnit")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Primary — large step increments */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[100, 500, 1000].map((delta) => (
              <Button
                key={delta}
                onClick={() => shiftDone(delta)}
                variant="outline"
                className="h-12 rounded-xl border-white/[0.08] bg-white/[0.03] text-[15px] font-semibold text-gray-12 hover:bg-white/[0.06] active:scale-[0.97] transition-transform"
              >
                +{delta >= 1000 ? `${delta / 1000}k` : delta}
              </Button>
            ))}
          </div>

          {/* Secondary — fine adjustments */}
          <div className="grid grid-cols-4 gap-1.5">
            {[-100, -10, +10, +50].map((delta) => (
              <Button
                key={delta}
                variant="ghost"
                onClick={() => shiftDone(delta)}
                className={cn(
                  "h-9 rounded-lg text-[12px] font-medium hover:bg-white/[0.04] active:scale-[0.97] transition-transform",
                  delta < 0 ? "text-gray-8" : "text-gray-11",
                )}
              >
                {delta > 0 ? `+${delta}` : String(delta)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Settings */}
      <Card className="rounded-2xl border-white/[0.06] bg-white/[0.03] shadow-none">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-[13px] font-semibold text-gray-11 inline-flex items-center gap-1.5">
            <Target size={14} className="text-gray-8" /> {t("stepsDailyGoal")}
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
        </CardContent>
      </Card>

      {/* Coach tip */}
      <div className="rounded-xl border border-white/[0.04] p-3.5">
        <p className="text-[11px] text-gray-7 leading-relaxed">{t("stepsCoachTip")}</p>
      </div>

      {/* Weekly History — matching nutrition screen design */}
      <div>
        <Card className="rounded-2xl border-white/[0.06] bg-white/[0.03] shadow-none">
          <CardHeader className="p-5 pb-0">
            <h3 className="text-[14px] font-semibold text-gray-12">{t("stepsWeeklyView")}</h3>
          </CardHeader>
          <CardContent className="p-5 pt-5">
            {loadingHistory ? (
              <div className="h-[180px] flex flex-col items-center justify-center gap-3">
                <div className="flex items-end justify-between gap-2 w-full h-[140px]">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={cn(
                        "flex-1 rounded-lg bg-white/[0.04]",
                      )}
                      style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between w-full">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="w-6 h-3 rounded bg-white/[0.04]" />
                  ))}
                </div>
              </div>
            ) : (() => {
              const todayISO = new Date().toISOString().split("T")[0];
              // Build 7 days (Mon-Sun of current week)
              const today = new Date();
              const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
              const monday = new Date(today);
              monday.setDate(today.getDate() - dayOfWeek);

              const dayLabelsShort = [
                t("dayShortMon"), t("dayShortTue"), t("dayShortWed"), t("dayShortThu"),
                t("dayShortFri"), t("dayShortSat"), t("dayShortSun"),
              ];

              const weekBars = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const entry = historyData.find((h) => h.log_date === dateStr);
                return { date: dateStr, done: entry?.done ?? 0, goal: entry?.goal ?? state.goal };
              });

              const maxVal = Math.max(...weekBars.map((b) => Math.max(b.done, b.goal)), 1);
              const goalPct = Math.min(100, (state.goal / maxVal) * 100);

              return (
                <div className="relative h-[180px] mb-2">
                  {/* Goal reference line */}
                  <div className="absolute left-0 right-0 flex items-center" style={{ bottom: `${goalPct}%` }}>
                    <div className="flex-1 border-t border-dashed border-[#E80000]/25" />
                    <span className="text-[9px] text-[#FF6666]/60 tabular-nums ml-1 shrink-0">{state.goal.toLocaleString()}</span>
                  </div>

                  {/* Bars */}
                  <div className="flex items-end justify-between gap-2 h-full">
                    {weekBars.map((bar, i) => {
                      const pct = maxVal > 0 ? Math.max(2, (bar.done / maxVal) * 100) : 2;
                      const isToday = bar.date === todayISO;
                      const isFuture = bar.date > todayISO;
                      const hasDone = bar.done > 0;
                      const aboveGoal = bar.done > bar.goal;
                      return (
                        <div key={bar.date} className="flex-1 flex flex-col items-center h-full justify-end">
                          {hasDone && !isFuture && (
                            <span className="text-[10px] font-medium tabular-nums mb-1 text-gray-9">
                              {bar.done >= 1000 ? `${(bar.done / 1000).toFixed(1)}k` : bar.done}
                            </span>
                          )}
                          <motion.div
                            className={cn(
                              "w-full rounded-lg min-h-[4px]",
                              isFuture
                                ? "bg-white/[0.03]"
                                : isToday
                                ? aboveGoal
                                  ? "bg-gradient-to-t from-[#FF4D4D] to-[#FF8C8C]"
                                  : "bg-gradient-to-t from-[#E80000] to-[#FF4D4D]"
                                : hasDone
                                ? "bg-gradient-to-t from-white/[0.08] to-white/[0.15]"
                                : "bg-white/[0.03]"
                            )}
                            initial={{ height: 0 }}
                            animate={{ height: isFuture ? 4 : `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] as const }}
                          />
                          <span className={cn("text-[11px] font-medium mt-2", isToday ? "text-[#FF6666]" : "text-gray-8")}>
                            {dayLabelsShort[i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Legend */}
            <Separator className="bg-white/[0.04] mb-3" />
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-[#E80000] to-[#FF4D4D]" />
                <span className="text-[10px] text-gray-8">{t("stepsTitle")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 border-t border-dashed border-[#E80000]/40" />
                <span className="text-[10px] text-gray-8">{t("stepsGoal")} {state.goal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
