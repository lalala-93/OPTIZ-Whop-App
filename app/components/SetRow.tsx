"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DraftSet {
  load: string;
  reps: string;
  rpe: string;
  done: boolean;
}

interface Props {
  row: DraftSet;
  idx: number;
  isPr: boolean;
  isActive: boolean;
  isFirst: boolean;
  targetReps: number;
  onUpdate: (patch: Partial<DraftSet>) => void;
  onValidate: () => void;
  onUndo: () => void;
}

/**
 * SetRow — ligne d'une série dans le set tracker.
 *
 * Layout :
 *  [N°] [Poids stepper] [Reps stepper] [Check button]
 *
 * Done state : ligne se collapse en résumé compact (poids × reps), bouton undo
 * et chips RPE (6-10) qui apparaissent en slide-down. RPE caché tant que la
 * série n'est pas validée → moins de friction pré-set, default = 8 appliqué
 * automatiquement à la validation.
 */
export function SetRow({
  row,
  idx,
  isPr,
  isActive,
  isFirst,
  targetReps,
  onUpdate,
  onValidate,
  onUndo,
}: Props) {
  const bumpLoad = (delta: number) => {
    const cur = parseFloat(row.load) || 0;
    const next = Math.max(0, cur + delta);
    onUpdate({ load: next === 0 ? "" : String(next) });
  };
  const bumpReps = (delta: number) => {
    const cur = parseFloat(row.reps) || targetReps;
    onUpdate({ reps: String(Math.max(0, cur + delta)) });
  };

  const handleValidate = () => {
    if (!row.rpe) onUpdate({ rpe: "8" });
    onValidate();
  };

  // ── Done state : ligne unique, grise, calme. RPE = pill discrète à droite.
  if (row.done) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5",
          !isFirst && "border-t border-white/[0.04]",
        )}
      >
        {/* N° avec checkmark — gris neutre, plus le focus rouge. */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-9 flex items-center justify-center">
            <Check size={14} strokeWidth={2.5} />
          </div>
          {isPr && (
            <Sparkles
              size={10}
              className="text-[#FFD700] absolute -top-0.5 -right-0.5"
            />
          )}
        </div>

        {/* Résumé série — texte calme, gris. */}
        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-gray-7 font-semibold shrink-0">
            Série {idx + 1}
          </span>
          <span className="text-[14px] font-semibold text-gray-10 tabular-nums">
            {row.load && parseFloat(row.load) > 0 ? `${row.load} kg` : "—"}
            <span className="text-gray-7 mx-1">×</span>
            {row.reps || targetReps}
          </span>
        </div>

        {/* RPE pill cyclable — un seul tap pour changer 6→7→8→9→10→6 */}
        <button
          type="button"
          onClick={() => {
            const cur = parseInt(row.rpe || "8", 10);
            const next = cur >= 10 ? 6 : cur + 1;
            onUpdate({ rpe: String(next) });
          }}
          className="shrink-0 h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.07] text-[10.5px] font-semibold tabular-nums text-gray-9 hover:text-gray-11 hover:bg-white/[0.05] transition-colors"
          aria-label={`RPE ${row.rpe || 8} — appuyer pour modifier`}
        >
          RPE <span className="text-gray-11 ml-0.5">{row.rpe || 8}</span>
        </button>

        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          aria-label="Annuler la validation"
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-gray-7 hover:text-gray-11 hover:bg-white/[0.04] active:scale-95 transition-all"
        >
          <RotateCcw size={12} />
        </button>
      </motion.div>
    );
  }

  // ── Pending / Active state : 4 cols avec bouton Check explicite ─────────
  return (
    <div
      className={cn(
        "grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-x-2 px-3 py-2.5",
        !isFirst && "border-t border-white/[0.04]",
      )}
    >
      {/* N° */}
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            "inline-flex items-center justify-center w-11 h-11 rounded-xl text-[16px] font-semibold tabular-nums tracking-tight transition-colors",
            isActive
              ? "bg-[#E80000] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              : "bg-white/[0.04] text-gray-9",
          )}
        >
          {idx + 1}
        </span>
        {isPr && (
          <Sparkles
            size={10}
            className="text-[#FFD700] absolute -top-0.5 -right-0.5"
          />
        )}
      </div>

      {/* Poids stepper */}
      <Stepper
        value={row.load}
        placeholder="0"
        inputMode="decimal"
        isActive={isActive}
        unit="kg"
        onMinus={() => bumpLoad(-1)}
        onPlus={() => bumpLoad(1)}
        onChange={(v) => onUpdate({ load: v })}
      />

      {/* Reps stepper */}
      <Stepper
        value={row.reps}
        placeholder={String(targetReps > 0 ? targetReps : 5)}
        inputMode="numeric"
        isActive={isActive}
        unit="rep"
        onMinus={() => bumpReps(-1)}
        onPlus={() => bumpReps(1)}
        onChange={(v) => onUpdate({ reps: v })}
      />

      {/* Check button — gros, visible, primary */}
      <button
        type="button"
        onClick={handleValidate}
        aria-label="Valider la série"
        className={cn(
          "relative w-11 h-11 rounded-xl flex items-center justify-center mx-auto transition-all duration-150 active:scale-[0.92]",
          isActive
            ? "bg-gradient-to-b from-[#FF1414] to-[#C40000] text-white shadow-[0_4px_12px_-3px_rgba(232,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_5px_14px_-3px_rgba(232,0,0,0.65)]"
            : "border-[1.5px] border-white/[0.1] bg-white/[0.02] text-gray-7 hover:border-white/20 hover:bg-white/[0.04] hover:text-gray-9",
        )}
      >
        <AnimatePresence initial={false} mode="wait">
          {isActive ? (
            <motion.span
              key="active"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Check size={18} strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span
              key="pending"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Check size={16} strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

// ── Stepper réutilisable ────────────────────────────────────────────────────

function Stepper({
  value,
  placeholder,
  inputMode,
  isActive,
  unit,
  onMinus,
  onPlus,
  onChange,
}: {
  value: string;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  isActive: boolean;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-11 rounded-xl border overflow-hidden transition-colors",
        isActive
          ? "bg-white/[0.03] border-[#E80000]/40 focus-within:border-[#E80000]/65"
          : "bg-white/[0.03] border-white/[0.06] focus-within:border-white/[0.15]",
      )}
    >
      <button
        type="button"
        onClick={onMinus}
        className="shrink-0 h-full w-9 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
        aria-label={`−1 ${unit}`}
      >
        <Minus size={14} strokeWidth={2.25} />
      </button>
      <Input
        type="number"
        value={value}
        inputMode={inputMode}
        step="1"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full border-0 bg-transparent text-center text-[16px] font-semibold text-gray-12 placeholder:text-gray-6 tabular-nums tracking-tight p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="button"
        onClick={onPlus}
        className="shrink-0 h-full w-9 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
        aria-label={`+1 ${unit}`}
      >
        <Plus size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}
