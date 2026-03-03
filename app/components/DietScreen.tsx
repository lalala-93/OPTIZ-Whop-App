"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Droplets, Flame } from "lucide-react";

interface DietScreenProps {
  userId: string;
}

interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: string;
}

interface MealType {
  id: string;
  name: string;
  items: MealEntry[];
}

interface DietState {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterGoal: number;
  waterIn: number;
  streakDays: boolean[];
  mealTypes: MealType[];
}

const DEFAULT_STATE: DietState = {
  calorieGoal: 2500,
  proteinGoal: 160,
  carbsGoal: 260,
  fatsGoal: 80,
  waterGoal: 8,
  waterIn: 0,
  streakDays: [false, true, true, false, false, false, false],
  mealTypes: [
    { id: "breakfast", name: "Breakfast", items: [] },
    { id: "lunch", name: "Lunch", items: [] },
    { id: "snacks", name: "Snacks", items: [] },
    { id: "dinner", name: "Dinner", items: [] },
  ],
};

function storageKey(userId: string) {
  return `optiz-diet-v2-${userId}`;
}

function NutritionRing({ progress, center, label }: { progress: number; center: string; label: string }) {
  const radius = 44;
  const size = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E80000"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[24px] font-semibold text-gray-12 tabular-nums leading-none">{center}</p>
        <p className="text-[10px] uppercase tracking-[0.1em] text-gray-7 mt-1">{label}</p>
      </div>
    </div>
  );
}

function MacroCard({
  label,
  intake,
  goal,
}: {
  label: string;
  intake: number;
  goal: number;
}) {
  const progress = goal > 0 ? Math.min(100, Math.round((intake / goal) * 100)) : 0;

  return (
    <div className="rounded-xl border border-gray-5/25 bg-gray-3/18 p-3">
      <p className="text-[12px] text-gray-11 font-semibold">{label}</p>
      <p className="text-[18px] text-gray-12 font-semibold tabular-nums mt-0.5">{intake}g</p>
      <p className="text-[10px] text-gray-7 mt-0.5">Goal {goal}g</p>
      <div className="h-1.5 rounded-full bg-gray-4/50 overflow-hidden mt-2">
        <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function DietScreen({ userId }: DietScreenProps) {
  const [state, setState] = useState<DietState>(DEFAULT_STATE);
  const [activeMealType, setActiveMealType] = useState<string>("breakfast");
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState(350);
  const [mealProtein, setMealProtein] = useState(25);
  const [mealCarbs, setMealCarbs] = useState(30);
  const [mealFats, setMealFats] = useState(10);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as DietState;
      setState(parsed);
    } catch (error) {
      console.error("Failed to parse diet state", error);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  }, [state, userId]);

  const totals = useMemo(() => {
    const entries = state.mealTypes.flatMap((mealType) => mealType.items);

    return entries.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fats += item.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [state.mealTypes]);

  const recentMeals = useMemo(() => {
    return state.mealTypes
      .flatMap((mealType) => mealType.items.map((item) => ({ ...item, mealType: mealType.name })))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 4);
  }, [state.mealTypes]);

  const caloriesRemaining = Math.max(0, state.calorieGoal - totals.calories);
  const caloriesProgress = state.calorieGoal > 0 ? totals.calories / state.calorieGoal : 0;
  const streakCount = state.streakDays.filter(Boolean).length;

  const addMeal = () => {
    if (!mealName.trim()) return;

    const nextMeal: MealEntry = {
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      calories: Math.max(0, mealCalories),
      protein: Math.max(0, mealProtein),
      carbs: Math.max(0, mealCarbs),
      fats: Math.max(0, mealFats),
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.map((mealType) =>
        mealType.id === activeMealType
          ? { ...mealType, items: [nextMeal, ...mealType.items] }
          : mealType,
      ),
    }));

    setMealName("");
  };

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Diet</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Suivi nutrition simple et actionnable: calories, macros, eau, repas et adherence hebdomadaire.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
        <div className="flex items-start justify-between gap-4">
          <NutritionRing progress={caloriesProgress} center={String(totals.calories)} label="kcal" />

          <div className="flex-1">
            <p className="text-[13px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
              <Flame size={14} /> Calories
            </p>
            <p className="text-[12px] text-gray-8 mt-1">Goal {state.calorieGoal} · Remaining {caloriesRemaining}</p>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <label className="text-[10px] text-gray-7">Goal kcal
                <input
                  type="number"
                  min={1200}
                  value={state.calorieGoal}
                  onChange={(event) => setState((prev) => ({ ...prev, calorieGoal: Math.max(1200, Number(event.target.value || "1200")) }))}
                  className="mt-1 w-full h-9 rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
                />
              </label>

              <div className="rounded-lg border border-gray-5/30 bg-gray-3/20 p-2">
                <p className="text-[10px] text-gray-7">Streak</p>
                <p className="text-[20px] text-gray-12 font-semibold tabular-nums leading-none mt-1">{streakCount}/7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-gray-8">Weekly consistency</p>
          <div className="flex items-center gap-1.5">
            {state.streakDays.map((done, idx) => (
              <button
                key={`diet-streak-${idx}`}
                type="button"
                onClick={() => setState((prev) => ({
                  ...prev,
                  streakDays: prev.streakDays.map((value, i) => (i === idx ? !value : value)),
                }))}
                className={`w-4 h-6 rounded-full ${done ? "bg-[#E80000]" : "bg-gray-5/50"}`}
                aria-label={`Day ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <MacroCard label="Protein" intake={totals.protein} goal={state.proteinGoal} />
        <MacroCard label="Carbs" intake={totals.carbs} goal={state.carbsGoal} />
        <MacroCard label="Fats" intake={totals.fats} goal={state.fatsGoal} />
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[13px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
            <Droplets size={14} /> Water
          </p>
          <p className="text-[12px] text-gray-8">{state.waterIn}/{state.waterGoal} glasses</p>
        </div>

        <div className="h-10 rounded-xl border border-gray-5/30 bg-gray-3/20 overflow-hidden relative">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#4B0E0E] via-[#8D1313] to-[#E80000]"
            animate={{ height: `${Math.min(100, Math.round((state.waterIn / Math.max(1, state.waterGoal)) * 100))}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, waterIn: Math.max(0, prev.waterIn - 1) }))}
              className="w-7 h-7 rounded-full border border-gray-5/45 bg-gray-2/75 text-gray-12"
            >
              -
            </button>
            <span className="text-gray-12 font-semibold tabular-nums">{state.waterIn}</span>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, waterIn: Math.min(prev.waterGoal, prev.waterIn + 1) }))}
              className="w-7 h-7 rounded-full border border-gray-5/45 bg-gray-2/75 text-gray-12"
            >
              +
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-12">Meal types</h3>
          <span className="text-[11px] text-gray-8">Tap + to add meal</span>
        </div>

        <div className="space-y-2.5">
          {state.mealTypes.map((mealType) => {
            const kcal = mealType.items.reduce((sum, item) => sum + item.calories, 0);
            return (
              <div key={mealType.id} className="rounded-xl border border-gray-5/25 bg-gray-3/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[14px] text-gray-12 font-semibold">{mealType.name}</p>
                    <p className="text-[11px] text-gray-8">Total calories: {kcal}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMealType(mealType.id)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                      activeMealType === mealType.id
                        ? "border-[#E80000]/40 bg-[#E80000]/14 text-[#FF6D6D]"
                        : "border-gray-5/35 bg-gray-2 text-gray-8"
                    }`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">Add meal</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <select
            value={activeMealType}
            onChange={(event) => setActiveMealType(event.target.value)}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
          >
            {state.mealTypes.map((mealType) => (
              <option key={mealType.id} value={mealType.id}>{mealType.name}</option>
            ))}
          </select>

          <input
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
            placeholder="Meal name"
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <input
            type="number"
            min={0}
            value={mealCalories}
            onChange={(event) => setMealCalories(Math.max(0, Number(event.target.value || "0")))}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            aria-label="Calories"
          />
          <input
            type="number"
            min={0}
            value={mealProtein}
            onChange={(event) => setMealProtein(Math.max(0, Number(event.target.value || "0")))}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            aria-label="Protein"
          />
          <input
            type="number"
            min={0}
            value={mealCarbs}
            onChange={(event) => setMealCarbs(Math.max(0, Number(event.target.value || "0")))}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            aria-label="Carbs"
          />
          <input
            type="number"
            min={0}
            value={mealFats}
            onChange={(event) => setMealFats(Math.max(0, Number(event.target.value || "0")))}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            aria-label="Fats"
          />
        </div>

        <button
          type="button"
          onClick={addMeal}
          className="w-full h-11 rounded-xl optiz-gradient-bg text-white text-sm font-semibold"
        >
          Add Meal
        </button>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-3/18 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">Recent meals</h3>
        {recentMeals.length === 0 ? (
          <p className="text-[12px] text-gray-8">No meals logged today.</p>
        ) : (
          <div className="space-y-2">
            {recentMeals.map((meal) => (
              <div key={meal.id} className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] text-gray-12 font-semibold truncate">{meal.name}</p>
                  <p className="text-[12px] text-[#FF6666] font-semibold">{meal.calories} kcal</p>
                </div>
                <p className="text-[10px] text-gray-7 mt-1">P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
