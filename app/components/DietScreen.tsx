"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface DietScreenProps {
  userId: string;
}

interface DietItem {
  id: string;
  name: string;
  target: number;
  done: number;
}

const DEFAULT_ITEMS: DietItem[] = [
  { id: "protein", name: "Portions proteines", target: 4, done: 0 },
  { id: "carbs", name: "Portions glucides", target: 3, done: 0 },
  { id: "fats", name: "Portions lipides", target: 2, done: 0 },
  { id: "veggies", name: "Portions legumes", target: 4, done: 0 },
  { id: "water", name: "Verres d'eau", target: 8, done: 0 },
];

function storageKey(userId: string) {
  return `optiz-diet-v1-${userId}`;
}

export function DietScreen({ userId }: DietScreenProps) {
  const [items, setItems] = useState<DietItem[]>(DEFAULT_ITEMS);
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as DietItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to parse diet state", error);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const progress = useMemo(() => {
    const totalTarget = items.reduce((sum, item) => sum + item.target, 0);
    const totalDone = items.reduce((sum, item) => sum + Math.min(item.done, item.target), 0);
    if (totalTarget <= 0) return 0;
    return Math.min(100, Math.round((totalDone / totalTarget) * 100));
  }, [items]);

  const addCustomItem = () => {
    if (!customName.trim()) return;
    const next: DietItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      target: Math.max(1, customTarget),
      done: 0,
    };
    setItems((prev) => [...prev, next]);
    setCustomName("");
    setCustomTarget(1);
  };

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Diet</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Cible des quantites claires, coche au fur et a mesure, et garde un suivi propre de ton adherence.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-12">Daily plan</h3>
          <span className="text-xs text-[#FF6666] font-semibold">{progress}%</span>
        </div>

        <div className="h-2 rounded-full bg-gray-4/45 overflow-hidden mb-3">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-5/28 bg-gray-3/18 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_4.2rem_4.2rem_2.6rem] gap-2 items-center">
                <p className="text-[13px] text-gray-12 truncate font-medium">{item.name}</p>
                <input
                  type="number"
                  min={1}
                  value={item.target}
                  onChange={(event) => {
                    const nextTarget = Math.max(1, Number(event.target.value || "1"));
                    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, target: nextTarget } : row)));
                  }}
                  className="h-9 rounded-lg bg-gray-2 border border-gray-5/30 text-xs text-center text-gray-12"
                  aria-label="Target"
                />
                <input
                  type="number"
                  min={0}
                  value={item.done}
                  onChange={(event) => {
                    const nextDone = Math.max(0, Number(event.target.value || "0"));
                    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, done: nextDone } : row)));
                  }}
                  className="h-9 rounded-lg bg-gray-2 border border-gray-5/30 text-xs text-center text-gray-12"
                  aria-label="Done"
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
                  className="w-9 h-9 rounded-lg border border-gray-5/30 bg-gray-2 text-gray-8 flex items-center justify-center"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-[10px] text-gray-7 mt-1.5">{Math.min(item.done, item.target)} / {item.target} valide</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/35 bg-gray-2/75 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">Ajouter un aliment</h3>
        <div className="grid grid-cols-[minmax(0,1fr)_5.2rem_2.8rem] gap-2">
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Ex: Yaourt grec"
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
          />
          <input
            type="number"
            min={1}
            value={customTarget}
            onChange={(event) => setCustomTarget(Math.max(1, Number(event.target.value || "1")))}
            className="h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-2 text-sm text-center text-gray-12"
          />
          <button
            type="button"
            onClick={addCustomItem}
            className="h-10 rounded-xl border border-[#E80000]/35 bg-[#E80000]/12 text-[#FF6666] flex items-center justify-center"
            aria-label="Add"
          >
            <Plus size={15} />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">
          Systeme pro: tu suis adherence a un plan simple, puis tu ajustes progressivement les quantites selon ton evolution (poids, energie, recuperation).
        </p>
      </section>
    </div>
  );
}
