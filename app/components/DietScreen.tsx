"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Apple, ChevronDown, Droplets, Flame, Plus, UtensilsCrossed, Zap } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import {
  upsertDailyNutrition,
  addNutritionMeal as serverAddNutritionMeal,
} from "@/lib/actions";

interface DietScreenProps {
  userId: string;
  onAwardXpEvent: (source: string, referenceId: string, xpAmount: number) => Promise<void>;
  initialData: {
    id: string;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
    waterGoalL: number;
    waterInL: number;
    proteinGoalHit: boolean;
    caloriesOnTarget: boolean;
    hydrationGoalHit: boolean;
    mealRewardsCount: number;
    meals: {
      id: string;
      mealType: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      createdAt: string;
    }[];
  } | null;
}

interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: string;
  createdAt: string;
}

interface DietState {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterGoalL: number;
  waterInL: number;
  meals: MealEntry[];
}

interface DietRewardsState {
  mealRewards: number;
  proteinGoalHit: boolean;
  caloriesOnTarget: boolean;
  hydrationGoalHit: boolean;
}

interface MealType {
  id: string;
  labelKey: string;
}

const MEAL_TYPES: MealType[] = [
  { id: "breakfast", labelKey: "dietBreakfast" },
  { id: "lunch", labelKey: "dietLunch" },
  { id: "snack", labelKey: "dietSnack" },
  { id: "dinner", labelKey: "dietDinner" },
];

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}

/* ── CalorieRing — SVG circular progress ── */
function CalorieRing({ eaten, goal }: { eaten: number; goal: number }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(1, eaten / goal) : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto w-[160px] h-[160px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E80000" />
            <stop offset="100%" stopColor="#FF4D4D" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calorieGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Flame size={16} className="text-gray-8 mb-0.5" />
        <p className="text-[32px] font-bold text-gray-12 tabular-nums leading-none">{eaten}</p>
        <p className="text-[11px] text-gray-8 mt-0.5">/ {goal} kcal</p>
      </div>
    </div>
  );
}

/* ── MacroBar — compact inline progress ── */
function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-5 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-gray-10">{label}</span>
          <span className="text-[11px] text-gray-8 tabular-nums">{current}/{goal}g</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-4/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function DietScreen({ userId, onAwardXpEvent, initialData }: DietScreenProps) {
  const { t } = useI18n();

  const [state, setState] = useState<DietState>(() => ({
    calorieGoal: initialData?.calorieGoal ?? 2500,
    proteinGoal: initialData?.proteinGoal ?? 160,
    carbsGoal: initialData?.carbsGoal ?? 260,
    fatsGoal: initialData?.fatsGoal ?? 80,
    waterGoalL: initialData?.waterGoalL ?? 2.8,
    waterInL: initialData?.waterInL ?? 0,
    meals: (initialData?.meals ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      mealType: m.mealType,
      createdAt: m.createdAt,
    })),
  }));

  const [activeMealType, setActiveMealType] = useState<string>(MEAL_TYPES[0].id);
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState(450);
  const [mealProtein, setMealProtein] = useState(30);
  const [mealCarbs, setMealCarbs] = useState(35);
  const [mealFats, setMealFats] = useState(15);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const [rewards, setRewards] = useState<DietRewardsState>({
    mealRewards: initialData?.mealRewardsCount ?? 0,
    proteinGoalHit: initialData?.proteinGoalHit ?? false,
    caloriesOnTarget: initialData?.caloriesOnTarget ?? false,
    hydrationGoalHit: initialData?.hydrationGoalHit ?? false,
  });

  const [toast, setToast] = useState<XPToastData | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistGoals = (nextState: DietState, nextRewards: DietRewardsState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertDailyNutrition(userId, getTodayISO(), {
        calorieGoal: nextState.calorieGoal,
        proteinGoal: nextState.proteinGoal,
        carbsGoal: nextState.carbsGoal,
        fatsGoal: nextState.fatsGoal,
        waterGoalL: nextState.waterGoalL,
        waterInL: nextState.waterInL,
        proteinGoalHit: nextRewards.proteinGoalHit,
        caloriesOnTarget: nextRewards.caloriesOnTarget,
        hydrationGoalHit: nextRewards.hydrationGoalHit,
        mealRewardsCount: nextRewards.mealRewards,
      }).catch((err) => console.error("[OPTIZ] Nutrition persist error:", err));
    }, 800);
  };

  const totals = useMemo(() => {
    return state.meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [state.meals]);

  const caloriesRemaining = Math.max(0, state.calorieGoal - totals.calories);
  const hydrationProgress = state.waterGoalL > 0 ? Math.min(1, state.waterInL / state.waterGoalL) : 0;

  const mealsByType = useMemo(() => {
    const map: Record<string, MealEntry[]> = {};
    MEAL_TYPES.forEach((type) => {
      map[type.id] = [];
    });
    state.meals.forEach((meal) => {
      if (!map[meal.mealType]) map[meal.mealType] = [];
      map[meal.mealType].push(meal);
    });
    return map;
  }, [state.meals]);

  const showReward = (title: string, subtitle: string, xp: number, source: string, refId: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title, subtitle, xp });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2200);
    void onAwardXpEvent(source, refId, xp).catch((error) => {
      console.error("Failed to award diet XP", error);
    });
  };

  useEffect(() => {
    const today = getTodayISO();
    let updated = false;
    let next = { ...rewards };

    if (!next.proteinGoalHit && totals.protein >= state.proteinGoal) {
      next = { ...next, proteinGoalHit: true };
      updated = true;
      showReward(t("dietProteinGoalTitle"), t("dietProteinGoalSubtitle"), 20, "protein_goal", `protein-goal-${today}`);
    }

    const inCalorieZone = totals.calories >= state.calorieGoal * 0.95 && totals.calories <= state.calorieGoal * 1.05;
    if (!next.caloriesOnTarget && inCalorieZone) {
      next = { ...next, caloriesOnTarget: true };
      updated = true;
      showReward(t("dietCaloriesOnTargetTitle"), t("dietCaloriesOnTargetSubtitle"), 20, "calories_on_target", `calories-target-${today}`);
    }

    if (!next.hydrationGoalHit && state.waterInL >= state.waterGoalL) {
      next = { ...next, hydrationGoalHit: true };
      updated = true;
      showReward(t("dietHydrationGoalTitle"), t("dietHydrationGoalSubtitle"), 15, "hydration_goal", `hydration-goal-${today}`);
    }

    if (updated) {
      setRewards(next);
      persistGoals(state, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.protein, totals.calories, state.proteinGoal, state.calorieGoal, state.waterInL, state.waterGoalL]);

  const updateGoals = (patch: Partial<DietState>) => {
    const next = { ...state, ...patch };
    setState(next);
    persistGoals(next, rewards);
  };

  const addMeal = async () => {
    if (!mealName.trim()) return;

    const today = getTodayISO();
    const meal: MealEntry = {
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      calories: Math.max(0, mealCalories),
      protein: Math.max(0, mealProtein),
      carbs: Math.max(0, mealCarbs),
      fats: Math.max(0, mealFats),
      mealType: activeMealType,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({ ...prev, meals: [meal, ...prev.meals] }));
    setMealName("");

    try {
      const serverMeal = await serverAddNutritionMeal(userId, today, {
        mealType: meal.mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });

      if (serverMeal) {
        setState((prev) => ({
          ...prev,
          meals: prev.meals.map((m) => (m.id === meal.id ? { ...m, id: serverMeal.id } : m)),
        }));
      }
    } catch (err) {
      console.error("[OPTIZ] Failed to add meal", err);
    }

    if (rewards.mealRewards < 4) {
      const nextRewards = { ...rewards, mealRewards: rewards.mealRewards + 1 };
      setRewards(nextRewards);
      showReward(t("dietMealAdded"), t("dietMealAddedSubtitle"), 8, "meal_added", `meal-${rewards.mealRewards + 1}-${today}`);
      persistGoals(state, nextRewards);
    }
  };

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      {/* Header */}
      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("dietTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("dietSubtitle")}</p>
      </div>

      {/* ── Calorie Dashboard Hero ── */}
      <motion.section
        className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CalorieRing eaten={totals.calories} goal={state.calorieGoal} />

        {/* Stats row */}
        <div className="mt-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietGoalLabel")}</p>
            <p className="text-[17px] font-semibold text-gray-12 tabular-nums">{state.calorieGoal}</p>
          </div>
          <div className="w-px h-8 bg-gray-5/20" />
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietCaloriesToday")}</p>
            <p className="text-[17px] font-semibold text-[#FF6A6A] tabular-nums">{totals.calories}</p>
          </div>
          <div className="w-px h-8 bg-gray-5/20" />
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietRemainingLabel")}</p>
            <p className="text-[17px] font-semibold text-gray-12 tabular-nums">{caloriesRemaining}</p>
          </div>
        </div>

        {/* Inline macro bars */}
        <div className="mt-5 space-y-2.5">
          <MacroBar label={t("dietProtein")} current={totals.protein} goal={state.proteinGoal} color="#FF6B6B" />
          <MacroBar label={t("dietCarbs")} current={totals.carbs} goal={state.carbsGoal} color="#FFB347" />
          <MacroBar label={t("dietFats")} current={totals.fats} goal={state.fatsGoal} color="#4FC3F7" />
        </div>
      </motion.section>

      {/* ── Hydration ── */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Droplets size={15} className="text-[#4FC3F7]" /> {t("dietHydration")}
          </p>
          <p className="text-[12px] text-gray-8 tabular-nums">
            {state.waterInL.toFixed(2)} / {state.waterGoalL.toFixed(2)} L
          </p>
        </div>

        {/* Water progress bar */}
        <div className="h-10 rounded-xl bg-gray-3/25 overflow-hidden relative border border-gray-5/20">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#165DFF] via-[#3D8BFF] to-[#72B2FF]"
            animate={{ width: `${Math.round(hydrationProgress * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-semibold text-white drop-shadow-sm tabular-nums">
              {Math.round(hydrationProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Quick water buttons */}
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {[
            { label: "-0.25L", delta: -0.25 },
            { label: "+0.25L", delta: 0.25 },
            { label: "+0.5L", delta: 0.5 },
            { label: "+1L", delta: 1 },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() =>
                updateGoals({
                  waterInL: roundToQuarter(Math.max(0, Math.min(state.waterGoalL * 1.4, state.waterInL + action.delta))),
                })
              }
              className={`h-9 rounded-xl border text-[12px] font-semibold active:scale-95 transition-transform ${
                action.delta > 0
                  ? "border-[#165DFF]/30 bg-[#165DFF]/8 text-[#72B2FF]"
                  : "border-gray-5/35 bg-gray-3/30 text-gray-11"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Meals ── */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <UtensilsCrossed size={15} /> {t("dietMeals")}
          </h3>
          <p className="text-[11px] text-gray-8">{t("dietQuickAdd")}</p>
        </div>

        {/* Horizontal meal type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3">
          {MEAL_TYPES.map((type) => {
            const meals = mealsByType[type.id] || [];
            const kcal = meals.reduce((sum, m) => sum + m.calories, 0);
            const active = activeMealType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveMealType(type.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-[#E80000]/15 text-[#FF6666] border border-[#E80000]/35"
                    : "bg-gray-3/30 text-gray-10 border border-gray-5/25"
                }`}
              >
                {t(type.labelKey as keyof typeof t)}{meals.length > 0 ? ` · ${kcal}` : ""}
              </button>
            );
          })}
        </div>

        {/* Add meal form */}
        <div className="rounded-xl border border-gray-5/30 bg-gray-3/15 p-3 mb-3">
          <p className="text-[12px] text-gray-11 font-semibold inline-flex items-center gap-1.5 mb-2.5">
            <Apple size={13} /> {t("dietAddMeal")} — {t(MEAL_TYPES.find((m) => m.id === activeMealType)?.labelKey as keyof typeof t)}
          </p>

          {/* Name */}
          <input
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
            placeholder={t("dietMealNamePlaceholder")}
            className="h-10 w-full rounded-xl bg-gray-2/80 border border-gray-5/30 px-3 text-sm text-gray-12 mb-2"
          />

          {/* Calories — prominent */}
          <input
            type="number"
            min={0}
            value={mealCalories}
            onChange={(event) => setMealCalories(Math.max(0, Number(event.target.value || "0")))}
            placeholder="kcal"
            className="h-11 w-full rounded-xl bg-gray-2/80 border border-gray-5/30 px-3 text-[16px] font-semibold text-gray-12 text-center tabular-nums mb-2"
          />

          {/* Macros — compact row with colored labels */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <span className="text-[10px] font-medium text-[#FF6B6B] mb-1 block">P (g)</span>
              <input
                type="number"
                min={0}
                value={mealProtein}
                onChange={(event) => setMealProtein(Math.max(0, Number(event.target.value || "0")))}
                className="h-9 w-full rounded-lg bg-gray-2/80 border border-gray-5/30 px-2.5 text-sm text-gray-12 text-center tabular-nums"
              />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#FFB347] mb-1 block">C (g)</span>
              <input
                type="number"
                min={0}
                value={mealCarbs}
                onChange={(event) => setMealCarbs(Math.max(0, Number(event.target.value || "0")))}
                className="h-9 w-full rounded-lg bg-gray-2/80 border border-gray-5/30 px-2.5 text-sm text-gray-12 text-center tabular-nums"
              />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#4FC3F7] mb-1 block">F (g)</span>
              <input
                type="number"
                min={0}
                value={mealFats}
                onChange={(event) => setMealFats(Math.max(0, Number(event.target.value || "0")))}
                className="h-9 w-full rounded-lg bg-gray-2/80 border border-gray-5/30 px-2.5 text-sm text-gray-12 text-center tabular-nums"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addMeal}
            className="w-full h-10 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <Plus size={14} /> {t("dietValidateMeal")}
          </button>
        </div>

        {/* Logged meals */}
        <div className="space-y-0 max-h-[240px] overflow-y-auto">
          {state.meals.slice(0, 10).map((meal, index) => (
            <div
              key={meal.id}
              className={`flex items-center justify-between py-2.5 px-1 ${
                index < Math.min(state.meals.length, 10) - 1 ? "border-b border-gray-5/15" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-12 truncate">{meal.name}</p>
                <p className="text-[10px] text-gray-8 tabular-nums mt-0.5">
                  <span className="text-[#FF6B6B]">P{meal.protein}</span>
                  {" · "}
                  <span className="text-[#FFB347]">C{meal.carbs}</span>
                  {" · "}
                  <span className="text-[#4FC3F7]">F{meal.fats}</span>
                </p>
              </div>
              <span className="text-[13px] font-semibold text-gray-11 tabular-nums shrink-0 ml-3">{meal.calories} kcal</span>
            </div>
          ))}

          {state.meals.length === 0 && (
            <p className="text-[12px] text-gray-8 py-3 text-center">{t("dietNoMeals")}</p>
          )}
        </div>
      </section>

      {/* ── Goals Settings — collapsible ── */}
      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 overflow-hidden">
        <button
          type="button"
          onClick={() => setSettingsExpanded(!settingsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Zap size={14} /> {t("dietGoalLabel")}
          </span>
          <motion.div
            animate={{ rotate: settingsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-gray-8" />
          </motion.div>
        </button>

        <AnimatePresence>
          {settingsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-1">
                {/* Calorie goal */}
                <div className="flex items-center justify-between py-2.5 border-b border-gray-5/20">
                  <span className="text-[13px] text-gray-10">{t("dietCalorieGoalInput")}</span>
                  <input
                    type="number"
                    min={1200}
                    value={state.calorieGoal}
                    onChange={(event) => updateGoals({ calorieGoal: Math.max(1200, Number(event.target.value || "1200")) })}
                    className="w-20 text-right text-[14px] font-semibold text-gray-12 bg-transparent outline-none tabular-nums"
                  />
                </div>

                {/* Macro goals */}
                <div className="flex items-center justify-between py-2.5 border-b border-gray-5/20">
                  <span className="text-[13px] text-[#FF6B6B]">{t("dietProtein")} (g)</span>
                  <input
                    type="number"
                    min={0}
                    value={state.proteinGoal}
                    onChange={(event) => updateGoals({ proteinGoal: Math.max(0, Number(event.target.value || "0")) })}
                    className="w-16 text-right text-[14px] font-semibold text-gray-12 bg-transparent outline-none tabular-nums"
                  />
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-5/20">
                  <span className="text-[13px] text-[#FFB347]">{t("dietCarbs")} (g)</span>
                  <input
                    type="number"
                    min={0}
                    value={state.carbsGoal}
                    onChange={(event) => updateGoals({ carbsGoal: Math.max(0, Number(event.target.value || "0")) })}
                    className="w-16 text-right text-[14px] font-semibold text-gray-12 bg-transparent outline-none tabular-nums"
                  />
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-5/20">
                  <span className="text-[13px] text-[#4FC3F7]">{t("dietFats")} (g)</span>
                  <input
                    type="number"
                    min={0}
                    value={state.fatsGoal}
                    onChange={(event) => updateGoals({ fatsGoal: Math.max(0, Number(event.target.value || "0")) })}
                    className="w-16 text-right text-[14px] font-semibold text-gray-12 bg-transparent outline-none tabular-nums"
                  />
                </div>

                {/* Water goal */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-[#4FC3F7]">{t("dietWaterGoalInput")}</span>
                  <input
                    type="number"
                    min={1}
                    step={0.1}
                    value={state.waterGoalL}
                    onChange={(event) => updateGoals({ waterGoalL: Math.max(1, Number(event.target.value || "1")) })}
                    className="w-16 text-right text-[14px] font-semibold text-gray-12 bg-transparent outline-none tabular-nums"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
