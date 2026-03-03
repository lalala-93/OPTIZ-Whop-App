"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Footprints } from "lucide-react";

interface StepsScreenProps {
  userId: string;
}

interface StepsState {
  baseline: number;
  goal: number;
  done: number;
}

function storageKey(userId: string) {
  return `optiz-steps-v1-${userId}`;
}

export function StepsScreen({ userId }: StepsScreenProps) {
  const [state, setState] = useState<StepsState>({ baseline: 6000, goal: 8000, done: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as StepsState;
      setState(parsed);
    } catch (error) {
      console.error("Failed to parse steps state", error);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  }, [state, userId]);

  const progress = useMemo(() => {
    if (state.goal <= 0) return 0;
    return Math.min(100, Math.round((state.done / state.goal) * 100));
  }, [state.done, state.goal]);

  const remaining = Math.max(0, state.goal - state.done);

  return (
    <div className="pb-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Steps</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Progression simple et mesurable: fixe un objectif superieur a ta base, puis valide chaque jour.
        </p>
      </div>

      <motion.section
        className="rounded-3xl border border-gray-5/35 bg-gray-2/80 p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Footprints size={14} /> Daily target
          </h3>
          <span className="text-xs text-[#FF6666] font-semibold">{progress}%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
          <label className="text-[11px] text-gray-8">
            Base
            <input
              type="number"
              value={state.baseline}
              min={0}
              onChange={(event) => {
                const base = Math.max(0, Number(event.target.value || "0"));
                setState((prev) => ({
                  ...prev,
                  baseline: base,
                  goal: Math.max(prev.goal, base + 500),
                }));
              }}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </label>

          <label className="text-[11px] text-gray-8">
            Goal
            <input
              type="number"
              value={state.goal}
              min={0}
              onChange={(event) => {
                const nextGoal = Math.max(0, Number(event.target.value || "0"));
                setState((prev) => ({ ...prev, goal: Math.max(nextGoal, prev.baseline + 500) }));
              }}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </label>

          <label className="text-[11px] text-gray-8">
            Done
            <input
              type="number"
              value={state.done}
              min={0}
              onChange={(event) => {
                const nextDone = Math.max(0, Number(event.target.value || "0"));
                setState((prev) => ({ ...prev, done: nextDone }));
              }}
              className="mt-1 w-full h-10 rounded-xl bg-gray-3/35 border border-gray-5/35 px-3 text-sm text-gray-12"
            />
          </label>
        </div>

        <div className="h-2 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-8">{state.done} / {state.goal} pas</span>
          <span className="text-gray-9">{remaining} restants</span>
        </div>
      </motion.section>

      <section className="rounded-3xl border border-gray-5/30 bg-gray-3/18 p-4">
        <p className="text-[12px] text-gray-9 leading-relaxed">
          Regle simple: augmente ton objectif progressivement (+500 a +1500 pas au-dessus de ta base) pour soutenir la depense energetique sans fatiguer ta recuperation.
        </p>
      </section>
    </div>
  );
}
