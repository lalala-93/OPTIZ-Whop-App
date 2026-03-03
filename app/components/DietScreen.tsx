"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Droplets, Flame, Plus, UtensilsCrossed } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";

interface DietScreenProps {
  userId: string;
  onAwardXp: (xp: number) => Promise<void>;
}

interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealTypeId: string;
  createdAt: string;
}

interface MealType {
  id: string;
  label: string;
}

interface DietState {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterGoalL: number;
  waterInL: number;
  streakDays: boolean[];
  meals: MealEntry[];
}

interface DietRewardsState {
  date: string;
  mealRewards: number;
  proteinGoalHit: boolean;
  caloriesOnTarget: boolean;
  hydrationGoalHit: boolean;
}

const MEAL_TYPES: MealType[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Dinner" },
];

const DEFAULT_STATE: DietState = {
  calorieGoal: 2500,
  proteinGoal: 160,
  carbsGoal: 260,
  fatsGoal: 80,
  waterGoalL: 2.8,
  waterInL: 0.5,
  streakDays: [true, true, false, false, false, false, false],
  meals: [],
};

function storageKey(userId: string) {
  return `optiz-diet-v3-${userId}`;
}

function rewardKey(userId: string) {
  return `optiz-diet-rewards-v1-${userId}`;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export function DietScreen({ userId, onAwardXp }: DietScreenProps) {
  const [state, setState] = useState<DietState>(DEFAULT_STATE);
  const [activeMealType, setActiveMealType] = useState<string>(MEAL_TYPES[0].id);

  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState(450);
  const [mealProtein, setMealProtein] = useState(30);
  const [mealCarbs, setMealCarbs] = useState(35);
  const [mealFats, setMealFats] = useState(15);

  const [rewards, setRewards] = useState<DietRewardsState>({
    date: getTodayKey(),
    mealRewards: 0,
    proteinGoalHit: false,
    caloriesOnTarget: false,
    hydrationGoalHit: false,
  });

  const [toast, setToast] = useState<XPToastData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawState = localStorage.getItem(storageKey(userId));
    if (rawState) {
      try {
        setState(JSON.parse(rawState) as DietState);
      } catch (error) {
        console.error("Failed to parse diet state", error);
      }
    }

    const rawRewards = localStorage.getItem(rewardKey(userId));
    if (rawRewards) {
      try {
        const parsed = JSON.parse(rawRewards) as DietRewardsState;
        if (parsed.date === getTodayKey()) {
          setRewards(parsed);
        }
      } catch (error) {
        console.error("Failed to parse diet rewards", error);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  }, [state, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(rewardKey(userId), JSON.stringify(rewards));
  }, [rewards, userId]);

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
      if (!map[meal.mealTypeId]) map[meal.mealTypeId] = [];
      map[meal.mealTypeId].push(meal);
    });

    return map;
  }, [state.meals]);

  const streakCount = state.streakDays.filter(Boolean).length;

  const showReward = (title: string, subtitle: string, xp: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title, subtitle, xp });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2200);

    void onAwardXp(xp).catch((error) => {
      console.error("Failed to award diet XP", error);
    });
  };

  useEffect(() => {
    const today = getTodayKey();

    if (rewards.date !== today) {
      setRewards({
        date: today,
        mealRewards: 0,
        proteinGoalHit: false,
        caloriesOnTarget: false,
        hydrationGoalHit: false,
      });
      return;
    }

    if (!rewards.proteinGoalHit && totals.protein >= state.proteinGoal) {
      setRewards((prev) => ({ ...prev, proteinGoalHit: true }));
      showReward("Objectif proteines valide", "Apport proteique atteint", 20);
    }

    const inCalorieZone = totals.calories >= state.calorieGoal * 0.95 && totals.calories <= state.calorieGoal * 1.05;
    if (!rewards.caloriesOnTarget && inCalorieZone) {
      setRewards((prev) => ({ ...prev, caloriesOnTarget: true }));
      showReward("Calories dans la cible", "Apport quotidien bien calibre", 20);
    }

    if (!rewards.hydrationGoalHit && state.waterInL >= state.waterGoalL) {
      setRewards((prev) => ({ ...prev, hydrationGoalHit: true }));
      showReward("Hydratation validee", "Objectif hydratation atteint", 15);
    }
  }, [
    rewards,
    totals.protein,
    totals.calories,
    state.proteinGoal,
    state.calorieGoal,
    state.waterInL,
    state.waterGoalL,
  ]);

  const addMeal = () => {
    if (!mealName.trim()) return;

    const meal: MealEntry = {
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      calories: Math.max(0, mealCalories),
      protein: Math.max(0, mealProtein),
      carbs: Math.max(0, mealCarbs),
      fats: Math.max(0, mealFats),
      mealTypeId: activeMealType,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({ ...prev, meals: [meal, ...prev.meals].slice(0, 300) }));
    setMealName("");

    if (rewards.date !== getTodayKey()) {
      setRewards({
        date: getTodayKey(),
        mealRewards: 1,
        proteinGoalHit: false,
        caloriesOnTarget: false,
        hydrationGoalHit: false,
      });
      showReward("Repas ajoute", "Repas ajoute dans ton suivi", 8);
      return;
    }

    if (rewards.mealRewards < 4) {
      setRewards((prev) => ({ ...prev, mealRewards: prev.mealRewards + 1 }));
      showReward("Repas ajoute", "Repas ajoute dans ton suivi", 8);
    }
  };

  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      <div>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Nutrition</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Plan clair de coach: vise tes calories, valide tes macros, hydrate-toi en litres, et garde une execution reguliere.
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
              <Flame size={15} /> Calories du jour
            </p>
            <p className="text-[12px] text-gray-8 mt-1">Objectif {state.calorieGoal} · Restant {caloriesRemaining}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] text-gray-7">
                Objectif kcal
                <input
                  type="number"
                  min={1200}
                  value={state.calorieGoal}
                  onChange={(event) => setState((prev) => ({ ...prev, calorieGoal: Math.max(1200, Number(event.target.value || "1200")) }))}
                  className="mt-1 h-9 w-full rounded-lg bg-gray-3/40 border border-gray-5/35 px-2 text-sm text-gray-12"
                />
              </label>

              <div className="rounded-lg border border-gray-5/30 bg-gray-3/22 p-2">
                <p className="text-[10px] text-gray-7">Serie nutrition</p>
                <p className="text-[21px] leading-none font-semibold text-gray-12 tabular-nums mt-1">{streakCount}/7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-gray-8">Regularite semaine</p>
          <div className="flex items-center gap-1.5">
            {state.streakDays.map((done, idx) => (
              <button
                key={`diet-streak-${idx}`}
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    streakDays: prev.streakDays.map((value, i) => (i === idx ? !value : value)),
                  }))
                }
                className={`w-5 h-5 rounded-full border ${done ? "border-[#E80000]/45 bg-[#E80000]/18" : "border-gray-5/45 bg-gray-4/45"}`}
                aria-label={`Day ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-2.5">
        <MacroProgress label="Protein" current={totals.protein} goal={state.proteinGoal} />
        <MacroProgress label="Carbs" current={totals.carbs} goal={state.carbsGoal} />
        <MacroProgress label="Fats" current={totals.fats} goal={state.fatsGoal} />
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Droplets size={16} className="text-[#68A4FF]" /> Hydratation
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
                setState((prev) => ({
                  ...prev,
                  waterInL: roundToQuarter(Math.max(0, Math.min(prev.waterGoalL * 1.4, prev.waterInL + action.delta))),
                }))
              }
              className="h-9 rounded-lg border border-gray-5/35 bg-gray-3/30 text-[12px] text-gray-11 font-semibold"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <label className="text-[10px] text-gray-7">
            Objectif eau (L)
            <input
              type="number"
              min={1}
              step={0.1}
              value={state.waterGoalL}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  waterGoalL: Math.max(1, Number(event.target.value || "1")),
                }))
              }
              className="mt-1 h-9 w-full rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <UtensilsCrossed size={15} /> Repas
          </h3>
          <p className="text-[11px] text-gray-8">Ajout simple et rapide</p>
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
                  <p className="text-[13px] font-semibold text-gray-12">{type.label}</p>
                      <p className="text-[11px] text-gray-8 tabular-nums">{meals.length} repas · {kcal} kcal</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-gray-5/30 bg-gray-3/20 p-3">
          <p className="text-[12px] text-gray-11 font-semibold inline-flex items-center gap-1.5 mb-2">
            <Apple size={14} /> Ajouter un repas - {MEAL_TYPES.find((m) => m.id === activeMealType)?.label}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              value={mealName}
              onChange={(event) => setMealName(event.target.value)}
              placeholder="Nom du repas"
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
              placeholder="Protein"
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
            <input
              type="number"
              min={0}
              value={mealCarbs}
              onChange={(event) => setMealCarbs(Math.max(0, Number(event.target.value || "0")))}
              placeholder="Carbs"
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
            <input
              type="number"
              min={0}
              value={mealFats}
              onChange={(event) => setMealFats(Math.max(0, Number(event.target.value || "0")))}
              placeholder="Fats"
              className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </div>

          <button
            type="button"
            onClick={addMeal}
            className="w-full h-10 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Valider le repas
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
            <p className="text-[12px] text-gray-8 py-2">Aucun repas logge pour le moment.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
