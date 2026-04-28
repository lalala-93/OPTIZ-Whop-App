"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Check, ChevronRight, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
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

const SWIPE_THRESHOLD = 64; // px → trigger validate
const SWIPE_MAX = 110;

/**
 * SetRow — ligne d'une série dans le set tracker.
 *
 * Interactions :
 * - Pending/Active : drag horizontal vers la droite pour valider la série.
 *   Un fond rouge apparaît progressivement, un checkmark devient visible
 *   à mi-drag, validation au-delà de 64 px.
 * - Done : la ligne se collapse en résumé compact (poids × reps) avec un
 *   sélecteur RPE en chips (6-10) et un bouton undo.
 *
 * RPE caché tant que la série n'est pas validée → moins de friction pré-set.
 * Default RPE = 8 appliqué à la validation si pas encore renseigné.
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
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const checkOpacity = useTransform(x, [28, SWIPE_THRESHOLD], [0, 1]);
  const checkScale = useTransform(x, [28, SWIPE_THRESHOLD], [0.6, 1.05]);
  const hintOpacity = useTransform(x, [0, 30], [1, 0]);
  const triggered = useRef(false);

  // Reset triggered flag whenever drag re-starts (i.e. row becomes active again).
  useEffect(() => {
    if (isActive) {
      triggered.current = false;
      x.set(0);
    }
  }, [isActive, x]);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD && !triggered.current) {
      triggered.current = true;
      // Default RPE if not set yet
      if (!row.rpe) onUpdate({ rpe: "8" });
      onValidate();
    }
    x.set(0);
  };

  const bumpLoad = (delta: number) => {
    const cur = parseFloat(row.load) || 0;
    const next = Math.max(0, cur + delta);
    onUpdate({ load: next === 0 ? "" : String(next) });
  };
  const bumpReps = (delta: number) => {
    const cur = parseFloat(row.reps) || targetReps;
    onUpdate({ reps: String(Math.max(0, cur + delta)) });
  };

  // ── Done state : résumé compact + RPE chips ─────────────────────────────
  if (row.done) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "px-3 py-2.5",
          !isFirst && "border-t border-white/[0.04]",
        )}
      >
        <div className="flex items-center gap-3">
          {/* N° avec checkmark */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-[#FF1414] to-[#C40000] text-white flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <Check size={18} strokeWidth={3} />
            </div>
            {isPr && (
              <Sparkles
                size={10}
                className="text-[#FFD700] absolute -top-0.5 -right-0.5"
              />
            )}
          </div>

          {/* Résumé */}
          <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
            <span className="text-[9.5px] uppercase tracking-[0.16em] text-gray-7 font-semibold shrink-0">
              Série {idx + 1}
            </span>
            <span className="text-[15px] font-semibold text-gray-12 tabular-nums">
              {row.load && parseFloat(row.load) > 0 ? `${row.load} kg` : "—"}
              <span className="text-gray-7 mx-1">×</span>
              {row.reps || targetReps}
            </span>
          </div>

          {/* Undo */}
          <button
            type="button"
            onClick={onUndo}
            aria-label="Annuler la validation"
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-gray-7 hover:text-gray-11 hover:bg-white/[0.04] active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* RPE chips — slide in après validation */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-1.5 pt-2 pl-[3.5rem]">
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-7 font-semibold mr-1">
              RPE
            </span>
            {[6, 7, 8, 9, 10].map((v) => {
              const selected = row.rpe === String(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdate({ rpe: String(v) })}
                  className={cn(
                    "h-6 px-2 rounded-md text-[11px] font-semibold tabular-nums border transition-colors",
                    selected
                      ? "bg-[#E80000]/[0.12] border-[#E80000]/40 text-[#FF6D6D]"
                      : "bg-white/[0.02] border-white/[0.05] text-gray-8 hover:bg-white/[0.05] hover:text-gray-11",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Pending / Active state : 3 cols + swipe-to-validate ─────────────────
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        !isFirst && "border-t border-white/[0.04]",
      )}
    >
      {/* Fond drag — gradient rouge qui se révèle */}
      <motion.div
        aria-hidden
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-[#E80000]/0 via-[#E80000]/30 to-[#E80000]/55 pointer-events-none"
      />
      <motion.div
        aria-hidden
        style={{ opacity: checkOpacity, scale: checkScale }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#E80000] flex items-center justify-center text-white pointer-events-none shadow-[0_2px_10px_-2px_rgba(232,0,0,0.6)]"
      >
        <Check size={18} strokeWidth={3} />
      </motion.div>

      {/* Hint chevron (pending only) */}
      {isActive && (
        <motion.div
          aria-hidden
          style={{ opacity: hintOpacity }}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9.5px] uppercase tracking-[0.18em] text-[#FF6D6D]/70 font-semibold pointer-events-none"
        >
          Glisser
          <ChevronRight size={12} />
        </motion.div>
      )}

      <motion.div
        drag={isActive ? "x" : false}
        dragConstraints={{ left: 0, right: SWIPE_MAX }}
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2 px-3 py-2.5 bg-[var(--gray-1)]",
          isActive && "cursor-grab active:cursor-grabbing",
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
      </motion.div>
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
        onPointerDown={(e) => e.stopPropagation()}
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
        onPointerDown={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full border-0 bg-transparent text-center text-[16px] font-semibold text-gray-12 placeholder:text-gray-6 tabular-nums tracking-tight p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onPlus}
        className="shrink-0 h-full w-9 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
        aria-label={`+1 ${unit}`}
      >
        <Plus size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}
