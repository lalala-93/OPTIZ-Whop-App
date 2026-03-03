"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Footprints, HeartPulse, Plus, Salad } from "lucide-react";

interface PillarsScreenProps {
  userId: string;
}

interface DietItem {
  id: string;
  name: string;
  targetQty: number;
  consumedQty: number;
  checked: boolean;
}

interface PillarsState {
  baselineSteps: number;
  stepGoal: number;
  stepsDone: number;
  dietItems: DietItem[];
}

const DEFAULT_DIET_ITEMS: DietItem[] = [
  { id: "protein-1", name: "Proteines maigres", targetQty: 2, consumedQty: 0, checked: false },
  { id: "carbs-1", name: "Glucides complexes", targetQty: 2, consumedQty: 0, checked: false },
  { id: "fats-1", name: "Lipides de qualite", targetQty: 2, consumedQty: 0, checked: false },
  { id: "veggies-1", name: "Legumes", targetQty: 3, consumedQty: 0, checked: false },
  { id: "water-1", name: "Verres d'eau", targetQty: 8, consumedQty: 0, checked: false },
];

function getStorageKey(userId: string) {
  return `optiz-pillars-v1-${userId}`;
}

function maybeNotify(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body });
}

export function PillarsScreen({ userId }: PillarsScreenProps) {
  const [state, setState] = useState<PillarsState>({
    baselineSteps: 6000,
    stepGoal: 8000,
    stepsDone: 0,
    dietItems: DEFAULT_DIET_ITEMS,
  });

  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodQty, setCustomFoodQty] = useState(1);

  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(30);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PillarsState;
      setState(parsed);
    } catch (error) {
      console.error("Failed to parse pillars state", error);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  }, [state, userId]);

  useEffect(() => {
    if (!breathingActive) return;

    const timer = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBreathingActive(false);
          maybeNotify("OPTIZ", "Reset cortisol termine. Systeme nerveux calme.");
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingActive]);

  const stepsProgress = Math.min(100, Math.round((state.stepsDone / Math.max(1, state.stepGoal)) * 100));

  const dietProgress = useMemo(() => {
    const totalTargets = state.dietItems.reduce((sum, item) => sum + item.targetQty, 0);
    const totalConsumed = state.dietItems.reduce((sum, item) => sum + Math.min(item.consumedQty, item.targetQty), 0);
    return totalTargets > 0 ? Math.min(100, Math.round((totalConsumed / totalTargets) * 100)) : 0;
  }, [state.dietItems]);

  const breathingPhase = useMemo(() => {
    const elapsed = 30 - breathingSeconds;
    const cycle = elapsed % 12;
    if (cycle < 4) return "Inspire 4s";
    if (cycle < 8) return "Apnee 4s";
    return "Expire 4s";
  }, [breathingSeconds]);

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Piliers progression</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Steps, nutrition, cortisol: actions simples, rappels utiles, progression visible.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-5/35 bg-gray-2/78 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-12 inline-flex items-center gap-1.5"><Footprints size={14} /> Pillier depense</h3>
            <p className="text-[11px] text-gray-8 mt-1">Fixe un objectif au-dessus de ta base, puis complete-le chaque jour.</p>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission();
              }
              const remaining = Math.max(0, state.stepGoal - state.stepsDone);
              maybeNotify("OPTIZ Steps", `Il te reste ${remaining} pas aujourd'hui.`);
            }}
            className="h-8 px-2.5 rounded-lg border border-gray-5/35 bg-gray-3/35 text-[11px] text-gray-10 inline-flex items-center gap-1"
          >
            <Bell size={12} /> Rappel
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <label className="text-[11px] text-gray-8">Base
            <input
              type="number"
              value={state.baselineSteps}
              onChange={(event) => {
                const nextBase = Math.max(0, Number(event.target.value || "0"));
                setState((prev) => ({
                  ...prev,
                  baselineSteps: nextBase,
                  stepGoal: Math.max(prev.stepGoal, nextBase + 500),
                }));
              }}
              className="mt-1 w-full h-9 rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            />
          </label>

          <label className="text-[11px] text-gray-8">Goal
            <input
              type="number"
              value={state.stepGoal}
              onChange={(event) => {
                const value = Math.max(0, Number(event.target.value || "0"));
                setState((prev) => ({ ...prev, stepGoal: Math.max(value, prev.baselineSteps + 500) }));
              }}
              className="mt-1 w-full h-9 rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            />
          </label>

          <label className="text-[11px] text-gray-8">Faits
            <input
              type="number"
              value={state.stepsDone}
              onChange={(event) => setState((prev) => ({ ...prev, stepsDone: Math.max(0, Number(event.target.value || "0")) }))}
              className="mt-1 w-full h-9 rounded-lg bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            />
          </label>
        </div>

        <div className="h-2 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${stepsProgress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-gray-8">{state.stepsDone} / {state.stepGoal} pas · {stepsProgress}%</p>
      </section>

      <section className="rounded-2xl border border-gray-5/35 bg-gray-2/78 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-12 inline-flex items-center gap-1.5"><Salad size={14} /> Pillier diet</h3>
            <p className="text-[11px] text-gray-8 mt-1">Coche ce que tu as mange et suis tes quantites cible.</p>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission();
              }
              const remainingItems = state.dietItems.filter((item) => item.consumedQty < item.targetQty).length;
              maybeNotify("OPTIZ Diet", `${remainingItems} elements restent a completer aujourd'hui.`);
            }}
            className="h-8 px-2.5 rounded-lg border border-gray-5/35 bg-gray-3/35 text-[11px] text-gray-10 inline-flex items-center gap-1"
          >
            <Bell size={12} /> Rappel
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {state.dietItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-5/28 bg-gray-3/22 p-2.5">
              <div className="grid grid-cols-[1fr_4rem_4rem_2.4rem] gap-2 items-center">
                <span className="text-[12px] text-gray-12 truncate">{item.name}</span>
                <span className="text-[11px] text-gray-8 text-center">{item.targetQty}</span>
                <input
                  type="number"
                  min={0}
                  value={item.consumedQty}
                  onChange={(event) => {
                    const value = Math.max(0, Number(event.target.value || "0"));
                    setState((prev) => ({
                      ...prev,
                      dietItems: prev.dietItems.map((row) =>
                        row.id === item.id ? { ...row, consumedQty: value, checked: value >= row.targetQty } : row,
                      ),
                    }));
                  }}
                  className="h-8 rounded-md bg-gray-2 border border-gray-5/30 px-2 text-xs text-gray-12 text-center"
                />
                <button
                  onClick={() => {
                    setState((prev) => ({
                      ...prev,
                      dietItems: prev.dietItems.map((row) =>
                        row.id === item.id
                          ? { ...row, checked: !row.checked, consumedQty: !row.checked ? row.targetQty : 0 }
                          : row,
                      ),
                    }));
                  }}
                  className={`w-8 h-8 rounded-md border text-[10px] font-bold ${item.checked ? "border-[#E80000]/35 bg-[#E80000]/15 text-[#FF6D6D]" : "border-gray-5/35 bg-gray-2 text-gray-8"}`}
                >
                  OK
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_5rem_2.4rem] gap-2 mb-3">
          <input
            value={customFoodName}
            onChange={(event) => setCustomFoodName(event.target.value)}
            className="h-9 rounded-md bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12"
            placeholder="Aliment custom"
          />
          <input
            type="number"
            min={1}
            value={customFoodQty}
            onChange={(event) => setCustomFoodQty(Math.max(1, Number(event.target.value || "1")))}
            className="h-9 rounded-md bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-gray-12 text-center"
          />
          <button
            onClick={() => {
              if (!customFoodName.trim()) return;
              const item: DietItem = {
                id: `custom-${Date.now()}`,
                name: customFoodName.trim(),
                targetQty: customFoodQty,
                consumedQty: 0,
                checked: false,
              };
              setState((prev) => ({ ...prev, dietItems: [...prev.dietItems, item] }));
              setCustomFoodName("");
              setCustomFoodQty(1);
            }}
            className="h-9 rounded-md border border-gray-5/35 bg-gray-3/30 text-gray-10 flex items-center justify-center"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="h-2 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${dietProgress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-gray-8">Progress nutrition: {dietProgress}%</p>
      </section>

      <section className="rounded-2xl border border-gray-5/35 bg-gray-2/78 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-12 inline-flex items-center gap-1.5"><HeartPulse size={14} /> Cortisol reset</h3>
            <p className="text-[11px] text-gray-8 mt-1">10 respirations profondes: 4s inspire, 4s apnee, 4s expire.</p>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission();
              }
              maybeNotify("OPTIZ Recovery", "Prends 30 secondes pour reset ton systeme nerveux.");
            }}
            className="h-8 px-2.5 rounded-lg border border-gray-5/35 bg-gray-3/35 text-[11px] text-gray-10 inline-flex items-center gap-1"
          >
            <Bell size={12} /> Rappel
          </button>
        </div>

        <div className="rounded-xl border border-gray-5/28 bg-gray-3/18 p-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-7 font-semibold">{breathingActive ? breathingPhase : "Pret"}</p>
          <p className="text-4xl font-semibold text-gray-12 tabular-nums mt-1">{breathingSeconds}</p>
          <button
            onClick={() => {
              setBreathingSeconds(30);
              setBreathingActive(true);
            }}
            className="mt-3 h-10 px-4 rounded-lg optiz-gradient-bg text-white text-sm font-semibold"
          >
            Lancer 30s reset
          </button>
        </div>
      </section>
    </div>
  );
}
