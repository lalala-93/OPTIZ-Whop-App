"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Droplets, Flame, Minus, Plus, Trash2, Zap } from "lucide-react";
import { XPToast, type XPToastData } from "./XPToast";
import { useI18n } from "./i18n";
import {
  upsertDailyNutrition,
  getMealTemplates,
  createMealTemplate,
  deleteMealTemplate,
  checkMealToday,
  uncheckMealToday,
  getDailyChecks,
  getWeeklyNutritionData,
} from "@/lib/actions";

/* ── Types ── */

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

interface MealTemplate {
  id: string;
  name: string;
  slot: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sortOrder: number;
}

interface GoalsState {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterGoalL: number;
  waterInL: number;
}

interface RewardsState {
  mealRewards: number;
  proteinGoalHit: boolean;
  caloriesOnTarget: boolean;
  hydrationGoalHit: boolean;
}

/* ── Food database ── */

interface FoodItem {
  id: string;
  emoji: string;
  name: { en: string; fr: string };
  category: "protein" | "carb" | "fat";
  defaultQty: number;
  unit: string;
  step: number;
  cal: number;
  p: number;
  c: number;
  f: number;
}

type FoodCategory = "all" | "protein" | "carb" | "fat";

const FOOD_DB: FoodItem[] = [
  { id: "ground-beef", emoji: "\u{1F969}", name: { en: "Ground beef 15%", fr: "Viande hach\u00e9e 15%" }, category: "protein", defaultQty: 150, unit: "g", step: 50, cal: 327, p: 29, c: 0, f: 23 },
  { id: "chicken", emoji: "\u{1F357}", name: { en: "Chicken breast", fr: "Poulet" }, category: "protein", defaultQty: 150, unit: "g", step: 50, cal: 247, p: 47, c: 0, f: 5 },
  { id: "fatty-fish", emoji: "\u{1F41F}", name: { en: "Fatty fish", fr: "Poisson gras" }, category: "protein", defaultQty: 150, unit: "g", step: 50, cal: 312, p: 30, c: 0, f: 20 },
  { id: "eggs", emoji: "\u{1F95A}", name: { en: "Eggs", fr: "\u0152ufs" }, category: "protein", defaultQty: 3, unit: "pcs", step: 1, cal: 234, p: 19, c: 2, f: 17 },
  { id: "kefir", emoji: "\u{1F95B}", name: { en: "Kefir", fr: "K\u00e9fir" }, category: "protein", defaultQty: 200, unit: "ml", step: 50, cal: 126, p: 7, c: 9, f: 7 },
  { id: "skyr", emoji: "\u{1F963}", name: { en: "Skyr", fr: "Skyr" }, category: "protein", defaultQty: 150, unit: "g", step: 50, cal: 95, p: 17, c: 6, f: 0 },
  { id: "rice", emoji: "\u{1F35A}", name: { en: "Rice (raw)", fr: "Riz cru" }, category: "carb", defaultQty: 80, unit: "g", step: 10, cal: 292, p: 6, c: 64, f: 0 },
  { id: "potato", emoji: "\u{1F954}", name: { en: "Potatoes", fr: "Pommes de terre" }, category: "carb", defaultQty: 200, unit: "g", step: 50, cal: 154, p: 4, c: 34, f: 0 },
  { id: "sweet-potato", emoji: "\u{1F360}", name: { en: "Sweet potato", fr: "Patates douces" }, category: "carb", defaultQty: 200, unit: "g", step: 50, cal: 172, p: 3, c: 40, f: 0 },
  { id: "sourdough", emoji: "\u{1F35E}", name: { en: "Sourdough bread", fr: "Pain au levain" }, category: "carb", defaultQty: 60, unit: "g", step: 10, cal: 155, p: 5, c: 30, f: 1 },
  { id: "honey", emoji: "\u{1F36F}", name: { en: "Honey", fr: "Miel" }, category: "carb", defaultQty: 15, unit: "g", step: 5, cal: 46, p: 0, c: 12, f: 0 },
  { id: "banana", emoji: "\u{1F34C}", name: { en: "Banana", fr: "Banane" }, category: "carb", defaultQty: 120, unit: "g", step: 30, cal: 107, p: 1, c: 28, f: 0 },
  { id: "apple", emoji: "\u{1F34E}", name: { en: "Apple", fr: "Pomme" }, category: "carb", defaultQty: 150, unit: "g", step: 50, cal: 78, p: 1, c: 21, f: 0 },
  { id: "blueberries", emoji: "\u{1FAD0}", name: { en: "Blueberries", fr: "Myrtilles" }, category: "carb", defaultQty: 100, unit: "g", step: 25, cal: 57, p: 1, c: 14, f: 0 },
  { id: "kiwi", emoji: "\u{1F95D}", name: { en: "Kiwi", fr: "Kiwi" }, category: "carb", defaultQty: 80, unit: "g", step: 20, cal: 49, p: 1, c: 12, f: 0 },
  { id: "orange", emoji: "\u{1F34A}", name: { en: "Orange", fr: "Orange" }, category: "carb", defaultQty: 150, unit: "g", step: 50, cal: 71, p: 1, c: 18, f: 0 },
  { id: "raw-cheese", emoji: "\u{1F9C0}", name: { en: "Raw milk cheese", fr: "Fromage lait cru" }, category: "fat", defaultQty: 30, unit: "g", step: 10, cal: 121, p: 8, c: 0, f: 10 },
  { id: "raw-cream", emoji: "\u{1FAD9}", name: { en: "Raw cream", fr: "Cr\u00e8me crue" }, category: "fat", defaultQty: 20, unit: "ml", step: 10, cal: 69, p: 0, c: 1, f: 7 },
  { id: "avocado", emoji: "\u{1F951}", name: { en: "Avocado", fr: "Avocat" }, category: "fat", defaultQty: 80, unit: "g", step: 20, cal: 128, p: 2, c: 7, f: 12 },
];

const SLOTS = ["matin", "midi", "soir"] as const;
type Slot = (typeof SLOTS)[number];
const SLOT_KEYS: Record<Slot, string> = { matin: "dietMatin", midi: "dietMidi", soir: "dietSoir" };
const SLOT_EMOJIS: Record<Slot, string> = { matin: "\u2600\uFE0F", midi: "\u{1F31E}", soir: "\u{1F319}" };

/* ── Helpers ── */

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function roundToQuarter(v: number) {
  return Math.round(v * 4) / 4;
}

function scaledMacros(food: FoodItem, qty: number) {
  const r = qty / food.defaultQty;
  return { cal: Math.round(food.cal * r), p: Math.round(food.p * r), c: Math.round(food.c * r), f: Math.round(food.f * r) };
}

function macroLabels(locale: string) {
  return locale === "fr" ? { p: "P", c: "G", f: "L" } : { p: "P", c: "C", f: "F" };
}

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── CalorieRing ── */
function CalorieRing({ eaten, goal }: { eaten: number; goal: number }) {
  const size = 160;
  const sw = 12;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const progress = goal > 0 ? Math.min(1, eaten / goal) : 0;

  return (
    <div className="relative mx-auto w-[160px] h-[160px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E80000" />
            <stop offset="100%" stopColor="#FF4D4D" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#calGrad)" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
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

/* ── MacroBar ── */
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
          <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} />
        </div>
      </div>
    </div>
  );
}

/* ── FoodRow ── */
function FoodRow({ food, qty, onQtyChange, onAdd, locale }: {
  food: FoodItem; qty: number; onQtyChange: (q: number) => void; onAdd: () => void; locale: string;
}) {
  const m = scaledMacros(food, qty);
  const ml = macroLabels(locale);
  const name = locale === "fr" ? food.name.fr : food.name.en;
  return (
    <div className="py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-lg shrink-0 w-7 text-center">{food.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-gray-12 truncate pr-2">{name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-semibold text-gray-11 tabular-nums">{m.cal} <span className="text-[10px] font-normal text-gray-8">kcal</span></span>
              <button type="button" onClick={onAdd} className="w-7 h-7 rounded-lg bg-[#E80000]/12 flex items-center justify-center active:scale-90 transition-transform">
                <Plus size={12} className="text-[#FF6D6D]" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <button type="button" onClick={() => onQtyChange(Math.max(food.step, qty - food.step))} className="w-5 h-5 rounded bg-white/[0.04] text-[10px] font-bold text-gray-10 flex items-center justify-center">-</button>
            <span className="text-[11px] text-gray-9 tabular-nums min-w-[36px] text-center">{qty} {food.unit}</span>
            <button type="button" onClick={() => onQtyChange(qty + food.step)} className="w-5 h-5 rounded bg-white/[0.04] text-[10px] font-bold text-gray-10 flex items-center justify-center">+</button>
            <span className="text-[10px] text-gray-8 tabular-nums ml-1">
              <span className="text-[#FF6B6B]">{ml.p}{m.p}</span>{" \u00b7 "}
              <span className="text-[#FFB347]">{ml.c}{m.c}</span>{" \u00b7 "}
              <span className="text-[#4FC3F7]">{ml.f}{m.f}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── GoalStepper ── */
function GoalStepper({ label, value, onChange, step, min, color, unit }: {
  label: string; value: number; onChange: (v: number) => void; step: number; min: number; color: string; unit: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[13px] text-gray-11">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center active:scale-90 transition-transform">
          <Minus size={12} className="text-gray-9" />
        </button>
        <span className="text-[14px] font-semibold text-gray-12 tabular-nums min-w-[52px] text-center">{value}{unit}</span>
        <button type="button" onClick={() => onChange(value + step)}
          className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center active:scale-90 transition-transform">
          <Plus size={12} className="text-gray-9" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════ */
/* ── Main component                   ── */
/* ══════════════════════════════════════ */
export function DietScreen({ userId, onAwardXpEvent, initialData }: DietScreenProps) {
  const { t, locale } = useI18n();
  const ml = macroLabels(locale);

  /* ── State ── */
  const [goals, setGoals] = useState<GoalsState>(() => ({
    calorieGoal: initialData?.calorieGoal ?? 2500,
    proteinGoal: initialData?.proteinGoal ?? 160,
    carbsGoal: initialData?.carbsGoal ?? 260,
    fatsGoal: initialData?.fatsGoal ?? 80,
    waterGoalL: initialData?.waterGoalL ?? 2.8,
    waterInL: initialData?.waterInL ?? 0,
  }));
  const [rewards, setRewards] = useState<RewardsState>({
    mealRewards: initialData?.mealRewardsCount ?? 0,
    proteinGoalHit: initialData?.proteinGoalHit ?? false,
    caloriesOnTarget: initialData?.caloriesOnTarget ?? false,
    hydrationGoalHit: initialData?.hydrationGoalHit ?? false,
  });
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<XPToastData | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [weeklyData, setWeeklyData] = useState<{ checks: { templateId: string; date: string }[]; waterLogs: { date: string; waterInL: number }[] }>({ checks: [], waterLogs: [] });

  // Add panel
  const [addingSlot, setAddingSlot] = useState<Slot | null>(null);
  const [activeCategory, setActiveCategory] = useState<FoodCategory>("all");
  const [foodQtys, setFoodQtys] = useState<Record<string, number>>({});
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState(200);
  const [customP, setCustomP] = useState(10);
  const [customC, setCustomC] = useState(20);
  const [customF, setCustomF] = useState(5);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Data loading ── */
  useEffect(() => {
    (async () => {
      try {
        const [tpls, checks] = await Promise.all([getMealTemplates(userId), getDailyChecks(userId, getTodayISO())]);
        setTemplates(tpls);
        setCheckedIds(new Set(checks));
      } catch (e) {
        console.error("[OPTIZ] Failed to load meal data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Load weekly data when switching tab
  useEffect(() => {
    if (viewMode !== "weekly") return;
    const dates = getWeekDates();
    getWeeklyNutritionData(userId, dates[0], dates[6]).then(setWeeklyData).catch(console.error);
  }, [viewMode, userId]);

  /* ── Persist goals ── */
  const persistGoals = useCallback((g: GoalsState, r: RewardsState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertDailyNutrition(userId, getTodayISO(), {
        calorieGoal: g.calorieGoal, proteinGoal: g.proteinGoal, carbsGoal: g.carbsGoal, fatsGoal: g.fatsGoal,
        waterGoalL: g.waterGoalL, waterInL: g.waterInL,
        proteinGoalHit: r.proteinGoalHit, caloriesOnTarget: r.caloriesOnTarget,
        hydrationGoalHit: r.hydrationGoalHit, mealRewardsCount: r.mealRewards,
      }).catch((e) => console.error("[OPTIZ] Nutrition persist error:", e));
    }, 800);
  }, [userId]);

  /* ── Computed ── */
  const checkedTotals = useMemo(() => {
    return templates
      .filter((t) => checkedIds.has(t.id))
      .reduce((a, t) => ({ calories: a.calories + t.calories, protein: a.protein + t.protein, carbs: a.carbs + t.carbs, fats: a.fats + t.fats }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [templates, checkedIds]);

  const caloriesRemaining = Math.max(0, goals.calorieGoal - checkedTotals.calories);
  const hydrationPct = goals.waterGoalL > 0 ? Math.min(1, goals.waterInL / goals.waterGoalL) : 0;

  /* ── Rewards ── */
  const showReward = useCallback((title: string, subtitle: string, xp: number, source: string, refId: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, title, subtitle, xp });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2200);
    void onAwardXpEvent(source, refId, xp).catch(console.error);
  }, [onAwardXpEvent]);

  useEffect(() => {
    const today = getTodayISO();
    let updated = false;
    let next = { ...rewards };
    if (!next.proteinGoalHit && checkedTotals.protein >= goals.proteinGoal) {
      next = { ...next, proteinGoalHit: true }; updated = true;
      showReward(t("dietProteinGoalTitle"), t("dietProteinGoalSubtitle"), 20, "protein_goal", `protein-goal-${today}`);
    }
    const inZone = checkedTotals.calories >= goals.calorieGoal * 0.95 && checkedTotals.calories <= goals.calorieGoal * 1.05;
    if (!next.caloriesOnTarget && inZone) {
      next = { ...next, caloriesOnTarget: true }; updated = true;
      showReward(t("dietCaloriesOnTargetTitle"), t("dietCaloriesOnTargetSubtitle"), 20, "calories_on_target", `calories-target-${today}`);
    }
    if (!next.hydrationGoalHit && goals.waterInL >= goals.waterGoalL) {
      next = { ...next, hydrationGoalHit: true }; updated = true;
      showReward(t("dietHydrationGoalTitle"), t("dietHydrationGoalSubtitle"), 15, "hydration_goal", `hydration-goal-${today}`);
    }
    if (updated) { setRewards(next); persistGoals(goals, next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedTotals.protein, checkedTotals.calories, goals.proteinGoal, goals.calorieGoal, goals.waterInL, goals.waterGoalL]);

  /* ── Handlers ── */
  const updateGoals = (patch: Partial<GoalsState>) => {
    const next = { ...goals, ...patch };
    setGoals(next);
    persistGoals(next, rewards);
  };

  const handleCheck = async (templateId: string) => {
    const today = getTodayISO();
    const wasChecked = checkedIds.has(templateId);
    setCheckedIds((prev) => {
      const s = new Set(prev);
      if (wasChecked) s.delete(templateId); else s.add(templateId);
      return s;
    });
    try {
      if (wasChecked) {
        await uncheckMealToday(userId, templateId, today);
      } else {
        await checkMealToday(userId, templateId, today);
        if (rewards.mealRewards < 4) {
          const nr = { ...rewards, mealRewards: rewards.mealRewards + 1 };
          setRewards(nr);
          showReward(t("dietMealAdded"), t("dietMealAddedSubtitle"), 8, "meal_added", `meal-${nr.mealRewards}-${today}`);
          persistGoals(goals, nr);
        }
      }
    } catch (e) { console.error("[OPTIZ] check error", e); }
  };

  const handleAddFood = async (food: FoodItem, slot: Slot) => {
    const qty = foodQtys[food.id] ?? food.defaultQty;
    const mc = scaledMacros(food, qty);
    const name = `${food.emoji} ${locale === "fr" ? food.name.fr : food.name.en} \u00b7 ${qty} ${food.unit}`;
    const tmpId = `tmp-${Date.now()}`;
    setTemplates((p) => [...p, { id: tmpId, name, slot, calories: mc.cal, protein: mc.p, carbs: mc.c, fats: mc.f, sortOrder: 0 }]);
    const created = await createMealTemplate(userId, { name, slot, calories: mc.cal, protein: mc.p, carbs: mc.c, fats: mc.f });
    if (created) setTemplates((p) => p.map((t) => (t.id === tmpId ? created : t)));
  };

  const handleAddCustom = async (slot: Slot) => {
    if (!customName.trim()) return;
    const tmpId = `tmp-${Date.now()}`;
    const cal = Math.max(0, customCal), p = Math.max(0, customP), c = Math.max(0, customC), f = Math.max(0, customF);
    setTemplates((prev) => [...prev, { id: tmpId, name: customName.trim(), slot, calories: cal, protein: p, carbs: c, fats: f, sortOrder: 0 }]);
    const created = await createMealTemplate(userId, { name: customName.trim(), slot, calories: cal, protein: p, carbs: c, fats: f });
    if (created) setTemplates((prev) => prev.map((t) => (t.id === tmpId ? created : t)));
    setCustomName(""); setShowCustom(false);
  };

  const handleDelete = async (id: string) => {
    setTemplates((p) => p.filter((t) => t.id !== id));
    setCheckedIds((p) => { const s = new Set(p); s.delete(id); return s; });
    await deleteMealTemplate(userId, id).catch(console.error);
  };

  const filteredFoods = activeCategory === "all" ? FOOD_DB : FOOD_DB.filter((f) => f.category === activeCategory);
  const categories: { id: FoodCategory; label: string }[] = [
    { id: "all", label: t("dietAll") }, { id: "protein", label: t("dietProtein") },
    { id: "carb", label: t("dietCarbs") }, { id: "fat", label: t("dietFats") },
  ];

  /* ── Weekly computation ── */
  const weekDates = useMemo(() => getWeekDates(), []);
  const dayLabels = locale === "fr" ? DAY_LABELS_FR : DAY_LABELS_EN;
  const todayISO = getTodayISO();
  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  const weeklyBars = useMemo(() => {
    return weekDates.map((date) => {
      if (date === todayISO) {
        return { date, cal: checkedTotals.calories };
      }
      const dayCks = weeklyData.checks.filter((c) => c.date === date);
      const cal = dayCks.reduce((s, c) => s + (templateMap.get(c.templateId)?.calories ?? 0), 0);
      return { date, cal };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, todayISO, checkedTotals.calories, weeklyData.checks, templateMap]);

  const maxWeeklyCal = Math.max(goals.calorieGoal, ...weeklyBars.map((b) => b.cal), 1);

  /* ── Staggered animation helpers ── */
  const stagger = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.06 * i, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } });

  /* ── Render ── */
  return (
    <div className="pb-8 space-y-4 relative">
      <XPToast toast={toast} />

      {/* Header */}
      <motion.div {...stagger(0)}>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("dietTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("dietSubtitle")}</p>
      </motion.div>

      {/* Daily / Weekly toggle */}
      <motion.div {...stagger(1)} className="flex gap-2">
        {(["daily", "weekly"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
              viewMode === mode ? "bg-[#E80000]/15 text-[#FF6666] border border-[#E80000]/35" : "bg-white/[0.03] text-gray-10 border border-white/[0.06]"
            }`}
          >
            {t(mode === "daily" ? "dietDaily" : "dietWeekly")}
          </button>
        ))}
      </motion.div>

      {/* Calorie Dashboard */}
      <motion.section {...stagger(2)} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <CalorieRing eaten={checkedTotals.calories} goal={goals.calorieGoal} />
        <div className="mt-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietGoalLabel")}</p>
            <p className="text-[17px] font-semibold text-gray-12 tabular-nums">{goals.calorieGoal}</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietCaloriesToday")}</p>
            <p className="text-[17px] font-semibold text-[#FF6A6A] tabular-nums">{checkedTotals.calories}</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-[11px] text-gray-7 uppercase tracking-wider">{t("dietRemainingLabel")}</p>
            <p className="text-[17px] font-semibold text-gray-12 tabular-nums">{caloriesRemaining}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          <MacroBar label={t("dietProtein")} current={checkedTotals.protein} goal={goals.proteinGoal} color="#FF6B6B" />
          <MacroBar label={t("dietCarbs")} current={checkedTotals.carbs} goal={goals.carbsGoal} color="#FFB347" />
          <MacroBar label={t("dietFats")} current={checkedTotals.fats} goal={goals.fatsGoal} color="#4FC3F7" />
        </div>
      </motion.section>

      {/* ══ DAILY VIEW ══ */}
      {viewMode === "daily" ? (
        <>
          {SLOTS.map((slot, slotIdx) => {
            const slotTemplates = templates.filter((t) => t.slot === slot);
            const slotCal = slotTemplates.filter((t) => checkedIds.has(t.id)).reduce((s, t) => s + t.calories, 0);
            const isAddingThis = addingSlot === slot;
            return (
              <motion.section key={slot} {...stagger(3 + slotIdx)} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                {/* Slot header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{SLOT_EMOJIS[slot]}</span>
                    <h3 className="text-[15px] font-semibold text-gray-12">{t(SLOT_KEYS[slot] as Parameters<typeof t>[0])}</h3>
                    {slotCal > 0 && (
                      <span className="text-[11px] font-medium text-gray-8 tabular-nums bg-white/[0.04] rounded-full px-2 py-0.5">{slotCal} kcal</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingSlot(isAddingThis ? null : slot)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
                      isAddingThis ? "bg-[#E80000]/15" : "bg-white/[0.04]"
                    }`}
                  >
                    <motion.div animate={{ rotate: isAddingThis ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}>
                      {isAddingThis ? <ChevronUp size={15} className="text-[#FF6D6D]" /> : <Plus size={15} className="text-gray-10" />}
                    </motion.div>
                  </button>
                </div>

                {/* Meals checklist */}
                <div className="px-4 pb-3">
                  {loading ? (
                    <p className="text-[12px] text-gray-8 py-3 text-center">...</p>
                  ) : slotTemplates.length === 0 && !isAddingThis ? (
                    <p className="text-[12px] text-gray-7 py-3 text-center italic">{t("dietNoMeals")}</p>
                  ) : (
                    <div className="space-y-0.5">
                      {slotTemplates.map((tpl) => {
                        const isChecked = checkedIds.has(tpl.id);
                        return (
                          <motion.div
                            key={tpl.id}
                            layout
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl transition-colors ${
                              isChecked ? "bg-[#E80000]/[0.05]" : "bg-white/[0.02] hover:bg-white/[0.04]"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleCheck(tpl.id)}
                              className={`w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                isChecked ? "bg-[#E80000] border-[#E80000] shadow-[0_0_8px_rgba(232,0,0,0.3)]" : "border-white/[0.12] bg-transparent"
                              }`}
                            >
                              {isChecked && <Check size={13} className="text-white" strokeWidth={3} />}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-medium truncate transition-colors ${isChecked ? "text-gray-9 line-through" : "text-gray-12"}`}>{tpl.name}</p>
                              <p className="text-[10px] text-gray-7 tabular-nums mt-0.5">
                                <span className="text-[#FF6B6B]">{ml.p}{tpl.protein}</span>{" \u00b7 "}
                                <span className="text-[#FFB347]">{ml.c}{tpl.carbs}</span>{" \u00b7 "}
                                <span className="text-[#4FC3F7]">{ml.f}{tpl.fats}</span>
                              </p>
                            </div>

                            {/* Kcal */}
                            <span className={`text-[12px] font-semibold tabular-nums shrink-0 transition-colors ${isChecked ? "text-[#FF6B6B]" : "text-gray-11"}`}>
                              {tpl.calories} <span className="text-[10px] font-normal text-gray-8">kcal</span>
                            </span>

                            {/* Delete */}
                            <button type="button" onClick={() => handleDelete(tpl.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-7 hover:text-[#FF6666] hover:bg-[#FF0000]/[0.06] transition-colors shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add panel */}
                <AnimatePresence>
                  {isAddingThis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
                        <p className="text-[12px] font-semibold text-gray-10 mb-2 uppercase tracking-wider">{t("dietCreateMeal")}</p>

                        {/* Category pills */}
                        <div className="flex gap-1.5 mb-3 flex-wrap">
                          {categories.map((cat) => (
                            <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                activeCategory === cat.id ? "bg-[#E80000]/12 text-[#FF6666]" : "bg-white/[0.04] text-gray-10"
                              }`}
                            >{cat.label}</button>
                          ))}
                        </div>

                        {/* Food list */}
                        <div className="max-h-[260px] overflow-y-auto -mx-1 px-1 scrollbar-none">
                          {filteredFoods.map((food) => (
                            <FoodRow
                              key={food.id}
                              food={food}
                              qty={foodQtys[food.id] ?? food.defaultQty}
                              onQtyChange={(q) => setFoodQtys((p) => ({ ...p, [food.id]: q }))}
                              onAdd={() => handleAddFood(food, slot)}
                              locale={locale}
                            />
                          ))}
                        </div>

                        {/* Custom toggle */}
                        <button type="button" onClick={() => setShowCustom(!showCustom)}
                          className="w-full mt-3 h-9 rounded-xl border border-dashed border-white/[0.08] text-[11px] font-medium text-gray-10 flex items-center justify-center gap-1 active:scale-[0.98] transition-transform hover:bg-white/[0.02]"
                        >
                          <Plus size={11} /> {t("dietCustom")}
                        </button>

                        <AnimatePresence>
                          {showCustom && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="pt-3 space-y-2">
                                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={t("dietMealNamePlaceholder")} className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 text-sm text-gray-12 placeholder:text-gray-7 outline-none focus:border-[#E80000]/30 transition-colors" />
                                <input type="number" min={0} value={customCal} onChange={(e) => setCustomCal(Math.max(0, Number(e.target.value || "0")))} placeholder="kcal" className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 text-[14px] font-semibold text-gray-12 text-center tabular-nums outline-none focus:border-[#E80000]/30 transition-colors" />
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <span className="text-[10px] font-medium text-[#FF6B6B] mb-1 block">{ml.p} (g)</span>
                                    <input type="number" min={0} value={customP} onChange={(e) => setCustomP(Math.max(0, Number(e.target.value || "0")))} className="h-9 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 text-sm text-gray-12 text-center tabular-nums outline-none" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-[#FFB347] mb-1 block">{ml.c} (g)</span>
                                    <input type="number" min={0} value={customC} onChange={(e) => setCustomC(Math.max(0, Number(e.target.value || "0")))} className="h-9 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 text-sm text-gray-12 text-center tabular-nums outline-none" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-[#4FC3F7] mb-1 block">{ml.f} (g)</span>
                                    <input type="number" min={0} value={customF} onChange={(e) => setCustomF(Math.max(0, Number(e.target.value || "0")))} className="h-9 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 text-sm text-gray-12 text-center tabular-nums outline-none" />
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleAddCustom(slot)} className="w-full h-10 rounded-xl optiz-gradient-bg text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-[0_2px_12px_rgba(232,0,0,0.25)]">
                                  <Plus size={13} /> {t("dietValidateMeal")}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </>
      ) : (
        /* ══ WEEKLY VIEW — Bar Chart ══ */
        <motion.section {...stagger(3)} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-[14px] font-semibold text-gray-12 mb-5">{t("dietWeekly")}</h3>

          {/* Bar chart area */}
          <div className="relative h-[180px] mb-2">
            {/* Goal reference line */}
            {(() => {
              const goalPct = Math.min(100, (goals.calorieGoal / maxWeeklyCal) * 100);
              return (
                <div className="absolute left-0 right-0 flex items-center" style={{ bottom: `${goalPct}%` }}>
                  <div className="flex-1 border-t border-dashed border-[#E80000]/25" />
                  <span className="text-[9px] text-[#FF6666]/60 tabular-nums ml-1 shrink-0">{goals.calorieGoal}</span>
                </div>
              );
            })()}

            {/* Bars */}
            <div className="flex items-end justify-between gap-2 h-full">
              {weeklyBars.map((bar, i) => {
                const pct = maxWeeklyCal > 0 ? Math.max(2, (bar.cal / maxWeeklyCal) * 100) : 2;
                const isToday = bar.date === todayISO;
                const isFuture = bar.date > todayISO;
                const hasCal = bar.cal > 0;
                const aboveGoal = bar.cal > goals.calorieGoal;
                return (
                  <div key={bar.date} className="flex-1 flex flex-col items-center h-full justify-end">
                    {hasCal && !isFuture && (
                      <span className="text-[10px] font-medium tabular-nums mb-1 text-gray-9">{bar.cal}</span>
                    )}
                    <motion.div
                      className={`w-full rounded-lg min-h-[4px] ${
                        isFuture
                          ? "bg-white/[0.03]"
                          : isToday
                          ? aboveGoal
                            ? "bg-gradient-to-t from-[#FF4D4D] to-[#FF8C8C]"
                            : "bg-gradient-to-t from-[#E80000] to-[#FF4D4D]"
                          : hasCal
                          ? "bg-gradient-to-t from-white/[0.08] to-white/[0.15]"
                          : "bg-white/[0.03]"
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: isFuture ? 4 : `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] as const }}
                    />
                    <span className={`text-[11px] font-medium mt-2 ${isToday ? "text-[#FF6666]" : "text-gray-8"}`}>
                      {dayLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-[#E80000] to-[#FF4D4D]" />
              <span className="text-[10px] text-gray-8">{t("dietCaloriesToday")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t border-dashed border-[#E80000]/40" />
              <span className="text-[10px] text-gray-8">{t("dietGoalLabel")} {goals.calorieGoal} kcal</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Hydration ── */}
      <motion.section {...stagger(6)} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Droplets size={15} className="text-[#4FC3F7]" /> {t("dietHydration")}
          </p>
          <p className="text-[12px] text-gray-8 tabular-nums">{goals.waterInL.toFixed(2)} / {goals.waterGoalL.toFixed(2)} L</p>
        </div>
        <div className="h-10 rounded-xl bg-white/[0.03] overflow-hidden relative border border-white/[0.06]">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#165DFF] via-[#3D8BFF] to-[#72B2FF]"
            animate={{ width: `${Math.round(hydrationPct * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-semibold text-white drop-shadow-sm tabular-nums">{Math.round(hydrationPct * 100)}%</span>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {[{ label: "-0.25L", delta: -0.25 }, { label: "+0.25L", delta: 0.25 }, { label: "+0.5L", delta: 0.5 }, { label: "+1L", delta: 1 }].map((a) => (
            <button key={a.label} type="button"
              onClick={() => updateGoals({ waterInL: roundToQuarter(Math.max(0, Math.min(goals.waterGoalL * 1.4, goals.waterInL + a.delta))) })}
              className={`h-9 rounded-xl text-[12px] font-semibold active:scale-95 transition-transform ${
                a.delta > 0 ? "bg-[#165DFF]/10 text-[#72B2FF]" : "bg-white/[0.04] text-gray-11"
              }`}
            >{a.label}</button>
          ))}
        </div>
      </motion.section>

      {/* ── Goals Settings ── */}
      <motion.section {...stagger(7)} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <button type="button" onClick={() => setSettingsExpanded(!settingsExpanded)} className="w-full flex items-center justify-between px-4 py-3.5">
          <span className="text-[14px] font-semibold text-gray-12 inline-flex items-center gap-1.5"><Zap size={14} className="text-[#FFB347]" /> {t("dietGoalLabel")}</span>
          <motion.div animate={{ rotate: settingsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-gray-8" />
          </motion.div>
        </button>
        <AnimatePresence>
          {settingsExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="px-4 pb-4">
                <GoalStepper label={t("dietCalorieGoalInput")} value={goals.calorieGoal} onChange={(v) => updateGoals({ calorieGoal: v })} step={100} min={1200} color="#FF6B6B" unit="" />
                <div className="border-t border-white/[0.04]" />
                <GoalStepper label={t("dietProtein")} value={goals.proteinGoal} onChange={(v) => updateGoals({ proteinGoal: v })} step={10} min={0} color="#FF6B6B" unit="g" />
                <div className="border-t border-white/[0.04]" />
                <GoalStepper label={t("dietCarbs")} value={goals.carbsGoal} onChange={(v) => updateGoals({ carbsGoal: v })} step={10} min={0} color="#FFB347" unit="g" />
                <div className="border-t border-white/[0.04]" />
                <GoalStepper label={t("dietFats")} value={goals.fatsGoal} onChange={(v) => updateGoals({ fatsGoal: v })} step={5} min={0} color="#4FC3F7" unit="g" />
                <div className="border-t border-white/[0.04]" />
                <GoalStepper label={t("dietWaterGoalInput")} value={goals.waterGoalL} onChange={(v) => updateGoals({ waterGoalL: v })} step={0.5} min={1} color="#4FC3F7" unit="L" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
