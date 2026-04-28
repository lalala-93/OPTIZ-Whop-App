"use client";

import { motion } from "framer-motion";
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
  defaultLoad?: number;
  onUpdate: (patch: Partial<DraftSet>) => void;
  onValidate: () => void;
  onUndo: () => void;
}

/**
 * SetRow — ligne d'une série dans le set tracker.
 *
 * Trois états visuels distincts pour clarifier la hiérarchie :
 *
 * - **queued** (`!done && !isActive`) : ligne future, dim, read-only.
 *   Affiche les valeurs cible (perSetReps / defaultLoad) sans steppers ni
 *   bouton actif. Aucune interaction — visuellement "en attente".
 *
 * - **active** (`!done && isActive`) : ligne en cours. Steppers complets,
 *   accent rouge, fond légèrement teinté, bouton check primary gradient.
 *   C'est le point focal de la screen.
 *
 * - **done** (`row.done`) : ligne validée. Valeurs affichées en gris calme,
 *   tap sur le badge OU le check à droite pour annuler. Sparkles si PR.
 *
 * Toutes les variantes partagent la même grille 4 colonnes et la même
 * hauteur cellulaire (h-11) pour un rythme visuel parfait avec le header.
 */

const GRID_CLS =
  "grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-x-2 px-3 py-2.5";

export function SetRow({
  row,
  idx,
  isPr,
  isActive,
  isFirst,
  targetReps,
  defaultLoad,
  onUpdate,
  onValidate,
  onUndo,
}: Props) {
  // ── DONE ──────────────────────────────────────────────────────────────
  if (row.done) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          GRID_CLS,
          isPr && "bg-[#FFD700]/[0.025]",
          !isFirst && "border-t border-white/[0.04]",
        )}
      >
        <NumberCell variant="done" idx={idx} isPr={isPr} onClick={onUndo} />
        <DisplayCell value={row.load && parseFloat(row.load) > 0 ? row.load : "—"} variant="done" />
        <DisplayCell value={row.reps || String(targetReps)} variant="done" />
        <ActionCell variant="done-undo" onClick={onUndo} />
      </motion.div>
    );
  }

  // ── QUEUED (pending non-active) ───────────────────────────────────────
  if (!isActive) {
    const previewLoad = row.load || (defaultLoad ? String(defaultLoad) : "—");
    const previewReps = row.reps || String(targetReps > 0 ? targetReps : 5);
    return (
      <div
        className={cn(
          GRID_CLS,
          "opacity-50",
          !isFirst && "border-t border-white/[0.04]",
        )}
      >
        <NumberCell variant="queued" idx={idx} isPr={false} />
        <DisplayCell value={previewLoad} variant="queued" />
        <DisplayCell value={previewReps} variant="queued" />
        <ActionCell variant="queued" />
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────
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

  return (
    <motion.div
      layout
      initial={false}
      className={cn(
        GRID_CLS,
        // Fond rouge subtil pour ancrer visuellement la ligne active.
        "bg-[#E80000]/[0.045]",
        !isFirst && "border-t border-white/[0.04]",
      )}
    >
      <NumberCell variant="active" idx={idx} isPr={isPr} />

      <Stepper
        value={row.load}
        placeholder={defaultLoad ? String(defaultLoad) : "0"}
        inputMode="decimal"
        unit="kg"
        onMinus={() => bumpLoad(-1)}
        onPlus={() => bumpLoad(1)}
        onChange={(v) => onUpdate({ load: v })}
      />

      <Stepper
        value={row.reps}
        placeholder={String(targetReps > 0 ? targetReps : 5)}
        inputMode="numeric"
        unit="rep"
        onMinus={() => bumpReps(-1)}
        onPlus={() => bumpReps(1)}
        onChange={(v) => onUpdate({ reps: v })}
      />

      <button
        type="button"
        onClick={handleValidate}
        aria-label="Valider la série"
        className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E80000] text-white hover:bg-[#FF1414] active:scale-[0.96] transition-colors duration-150"
      >
        <Check size={18} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function NumberCell({
  variant,
  idx,
  isPr,
  onClick,
}: {
  variant: "active" | "queued" | "done";
  idx: number;
  isPr: boolean;
  onClick?: () => void;
}) {
  const baseCls =
    "relative inline-flex items-center justify-center w-11 h-11 rounded-xl text-[16px] font-semibold tabular-nums tracking-tight transition-all";

  if (variant === "active") {
    return (
      <div className="relative flex items-center justify-center">
        <span className={cn(baseCls, "bg-[#E80000] text-white")}>
          {idx + 1}
        </span>
        {isPr && (
          <Sparkles
            size={11}
            className="text-[#FFD700] absolute -top-0.5 -right-0.5 pointer-events-none"
          />
        )}
      </div>
    );
  }

  if (variant === "queued") {
    return (
      <div className="flex items-center justify-center">
        <span className={cn(baseCls, "bg-white/[0.025] text-gray-7")}>
          {idx + 1}
        </span>
      </div>
    );
  }

  // done — bouton undo
  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label="Annuler la validation"
        className={cn(
          baseCls,
          "group bg-white/[0.04] border border-white/[0.06] text-gray-9",
          "hover:bg-white/[0.07] hover:text-gray-11 active:scale-[0.94]",
        )}
      >
        <Check size={16} strokeWidth={2.5} className="group-hover:hidden" />
        <RotateCcw
          size={14}
          strokeWidth={2.25}
          className="hidden group-hover:block"
        />
      </button>
      {isPr && (
        <Sparkles
          size={11}
          className="text-[#FFD700] absolute -top-0.5 -right-0.5 pointer-events-none"
        />
      )}
    </div>
  );
}

function DisplayCell({
  value,
  variant,
}: {
  value: string;
  variant: "done" | "queued";
}) {
  return (
    <div
      className={cn(
        "h-11 flex items-center justify-center rounded-xl border tabular-nums tracking-tight",
        variant === "done"
          ? "bg-white/[0.015] border-white/[0.04] text-[15px] font-semibold text-gray-10"
          : "bg-transparent border-white/[0.03] text-[15px] font-medium text-gray-7",
      )}
    >
      {value}
    </div>
  );
}

function ActionCell({
  variant,
  onClick,
}: {
  variant: "done-undo" | "queued";
  onClick?: () => void;
}) {
  if (variant === "queued") {
    return (
      <div className="w-11 h-11 rounded-xl border border-dashed border-white/[0.06] flex items-center justify-center">
        <Check size={14} strokeWidth={2} className="text-gray-6" />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Annuler la validation"
      className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-9 hover:bg-white/[0.07] hover:text-gray-11 active:scale-[0.94] transition-all flex items-center justify-center"
    >
      <Check size={16} strokeWidth={2.5} />
    </button>
  );
}

// ── Stepper réutilisable ────────────────────────────────────────────────

function Stepper({
  value,
  placeholder,
  inputMode,
  unit,
  onMinus,
  onPlus,
  onChange,
}: {
  value: string;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center h-11 rounded-xl border bg-white/[0.02] border-white/[0.08] focus-within:border-white/[0.14] overflow-hidden transition-colors">
      <button
        type="button"
        onClick={onMinus}
        className="shrink-0 h-full w-9 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
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
        className="shrink-0 h-full w-9 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
        aria-label={`+1 ${unit}`}
      >
        <Plus size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}
