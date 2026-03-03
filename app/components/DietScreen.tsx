"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Droplets, Flame, Plus, UtensilsCrossed } from "lucide-react";
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

function MacroProgress({ label, current, goal }: { label: string; current: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-gray-5/30 bg-gray-3/22 p-3">
      <div className="flex items-end justify-between">
        <p className="text-[12px] font-semibold text-gray-11">{label}</p>
        <p className="text-[11px] text-gray-8 tabular-nums">{current} / {goal} g</p>
      </div>
      <div className="h-1.5 rounded-full bg-gray-4/50 overflow-hidden mt-2">
        <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} />
      </div>
    </div>
  );
}

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

  const [rewards, setRewards] = useState<DietRewardsState>({
    mealRewards: initialData?.mealRewardsCount ?? 0,
    proteinGoalHit: initialData?.proteinGoalHit ?? false,
    caloriesOnTarget: initialData?.caloriesOnTarget ?? false,
    hydrationGoalHit: initialData?.hydrationGoalHit ?? false,
  });

  const [toast, setToast] = useState<XPToastData | null>(null);

  // Debounced server persist for goals/water
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
  const caloriesProgress = state.calorieGoal > 0 ? Math.min(1, totals.calories / state.calorieGoal) : 0;
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

  // Check nutrition rewards
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

    // Optimistic local update
    setState((prev) => ({ ...prev, meals: [meal, ...prev.meals] }));
    setMealName("");

    // Persist to server
    try {
      const serverMeal = await serverAddNutritionMeal(userId, today, {
        mealType: meal.mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });

      // Replace temp ID with server ID
      if (serverMeal) {
        setState((prev) => ({
          ...prev,
          meals: prev.meals.map((m) => (m.id === meal.id ? { ...m, id: serverMeal.id } : m)),
        }));
      }
    } catch (err) {
      console.error("[OPTIZ] Failed to add meal", err);
    }

    // Meal XP reward (max 4 per day)
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

      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("dietTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          {t("dietSubtitle")}
        </p>
      </div>

      <motion.section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-3">
          <div className="relative w-[108px] h-[108px] shrink-0">
            <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
              <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
              <motion.circle
                cx="54"
                cy="54"
                r="44"
                fill="none"
                stroke="#E80000"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                animate={{ strokeDashoffset: (2 * Math.PI * 44) * (1 - caloriesProgress) }}
                transition={{ duration: 0.42 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[28px] leading-none font-semibold text-gray-12 tabular-nums">{totals.calories}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-gray-7 mt-1">kcal</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
              <Flame size={15} /> {t("dietCaloriesToday")}
            </p>
            <p className="text-[12px] text-gray-8 mt-1">{t("dietGoalLabel")} {state.calorieGoal} · {t("dietRemainingLabel")} {caloriesRemaining}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] text-gray-7">
                {t("dietCalorieGoalInput")}
                <input
                  type="number"
                  min={1200}
                  value={state.calorieGoal}
                  onChange={(event) => updateGoals({ calorieGoal: Math.max(1200, Number(event.target.value || "1200")) })}
                  className="mt-1 h-9 w-full rounded-lg bg-gray-3/40 border border-gray-5/35 px-2 text-sm text-gray-12"
                />
              </label>

              <div className="rounded-lg border border-gray-5/30 bg-gray-3/22 p-2">
                <p className="text-[10px] text-gray-7">{t("dietMacroGoals")}</p>
                <p className="text-[11px] text-gray-10 mt-1">P {state.proteinGoal}g · C {state.carbsGoal}g · F {state.fatsGoal}g</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-2.5">
        <MacroProgress label={t("dietProtein")} current={totals.protein} goal={state.proteinGoal} />
        <MacroProgress label={t("dietCarbs")} current={totals.carbs} goal={state.carbsGoal} />
        <MacroProgress label={t("dietFats")} current={totals.fats} goal={state.fatsGoal} />
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Droplets size={16} className="text-[#68A4FF]" /> {t("dietHydration")}
          </p>
          <p className="text-[12px] text-gray-8 tabular-nums">{state.waterInL.toFixed(2)} / {state.waterGoalL.toFixed(2)} L</p>
        </div>

        <div className="h-12 rounded-xl border border-gray-5/35 bg-gray-3/20 overflow-hidden relative">
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

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              className="h-9 rounded-lg border border-gray-5/35 bg-gray-3/30 text-[12px] text-gray-11 font-semibold"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <label className="text-[10px] text-gray-7">
            {t("dietWaterGoalInput")}
            <input
              type="number"
              min={1}
              step={0.1}
              value={state.waterGoalL}
              onChange={(event) =>
                updateGoals({ waterGoalL: Math.max(1, Number(event.target.value || "1")) })
              }
              className="mt-1 h-9 w-full rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <UtensilsCrossed size={15} /> {t("dietMeals")}
          </h3>
          <p className="text-[11px] text-gray-8">{t("dietQuickAdd")}</p>
        </div>

        <div className="space-y-2.5 mb-3">
          {MEAL_TYPES.map((type) => {
            const meals = mealsByType[type.id] || [];
            const kcal = meals.reduce((sum, meal) => sum + meal.calories, 0);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveMealType(type.id)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  activeMealType === type.id
                    ? "border-[#E80000]/40 bg-[#E80000]/10"
                    : "border-gray-5/30 bg-gray-3/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-12">{t(type.labelKey as keyof typeof t)}</p>
                      <p className="text-[11px] text-gray-8 tabular-nums">{meals.length} {t("dietMealCount")} · {kcal} kcal</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-3">
          <p className="text-[12px] text-gray-11 font-semibold inline-flex items-center gap-1.5 mb-2">
            <Apple size={14} /> {t("dietAddMeal")} - {t(MEAL_TYPES.find((m) => m.id === activeMealType)?.labelKey as keyof typeof t)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              value={mealName}
              onChange={(event) => setMealName(event.target.value)}
              placeholder={t("dietMealNamePlaceholder")}
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
            <input
              type="number"
              min={0}
              value={mealCalories}
              onChange={(event) => setMealCalories(Math.max(0, Number(event.target.value || "0")))}
              placeholder="kcal"
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <input
              type="number"
              min={0}
              value={mealProtein}
              onChange={(event) => setMealProtein(Math.max(0, Number(event.target.value || "0")))}
              placeholder={t("dietProtein")}
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
            <input
              type="number"
              min={0}
              value={mealCarbs}
              onChange={(event) => setMealCarbs(Math.max(0, Number(event.target.value || "0")))}
              placeholder={t("dietCarbs")}
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
            <input
              type="number"
              min={0}
              value={mealFats}
              onChange={(event) => setMealFats(Math.max(0, Number(event.target.value || "0")))}
              placeholder={t("dietFats")}
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </div>

          <button
            type="button"
            onClick={addMeal}
            className="w-full h-10 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> {t("dietValidateMeal")}
          </button>
        </div>

        <div className="mt-3 space-y-2 max-h-[210px] overflow-y-auto pr-1">
          {state.meals.slice(0, 8).map((meal) => (
            <div key={meal.id} className="rounded-xl border border-gray-5/25 bg-gray-3/18 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-gray-12 truncate">{meal.name}</p>
                <p className="text-[11px] text-gray-8 tabular-nums">{meal.calories} kcal</p>
              </div>
              <p className="text-[10px] text-gray-8 mt-0.5 tabular-nums">
                P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
              </p>
            </div>
          ))}

          {state.meals.length === 0 ? (
            <p className="text-[12px] text-gray-8 py-2">{t("dietNoMeals")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
