"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * PhasesStrip — timeline horizontale des phases d'un exercice.
 *
 * Auto-scroll vers la phase active (smooth). Inspirée des trackers de séance
 * type Strong/Hevy mais condensée pour rester lisible mobile.
 *
 * Phases possibles (dérivées du state du WorkoutFunnel) :
 * - "preview"        : avant la première série
 * - { set: idx, status: "pending" | "active" | "done" }
 * - "rest"           : repos en cours (entre 2 séries)
 */

export type StripPhase =
  | { kind: "preview"; active: boolean }
  | { kind: "set"; idx: number; status: "pending" | "active" | "done" }
  | { kind: "rest"; afterSetIdx: number; active: boolean };

interface Props {
  phases: StripPhase[];
  /** Index de la phase actuellement active dans `phases`. */
  activeIndex: number;
  className?: string;
}

export function PhasesStrip({ phases, activeIndex, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll vers la phase active
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(
      `[data-phase-idx="${activeIndex}"]`,
    );
    if (!active) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset =
      activeRect.left -
      containerRect.left -
      containerRect.width / 2 +
      activeRect.width / 2;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto scrollbar-none",
        // Soft fade edges
        "[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]",
        "px-6 py-2",
        className,
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {phases.map((p, i) => {
        const isActive = i === activeIndex;
        return (
          <PhasePill
            key={`${i}-${phaseKey(p)}`}
            phase={p}
            isActive={isActive}
            phaseIdx={i}
          />
        );
      })}
    </div>
  );
}

function phaseKey(p: StripPhase): string {
  if (p.kind === "preview") return "preview";
  if (p.kind === "rest") return `rest-${p.afterSetIdx}`;
  return `set-${p.idx}-${p.status}`;
}

function PhasePill({
  phase,
  isActive,
  phaseIdx,
}: {
  phase: StripPhase;
  isActive: boolean;
  phaseIdx: number;
}) {
  const cfg = pillConfig(phase);

  return (
    <motion.div
      data-phase-idx={phaseIdx}
      initial={false}
      animate={{
        scale: isActive ? 1.04 : 1,
        opacity: cfg.dim ? 0.45 : 1,
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full border whitespace-nowrap transition-colors",
        cfg.bg,
        cfg.border,
        cfg.text,
        isActive && "shadow-[0_2px_10px_-2px_rgba(232,0,0,0.45)]",
      )}
    >
      {cfg.dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            cfg.dot,
            isActive && phase.kind === "set" && phase.status === "active" && "animate-pulse",
            isActive && phase.kind === "rest" && "animate-pulse",
          )}
        />
      )}
      <span className="text-[11px] font-semibold tracking-[0.04em]">
        {cfg.label}
      </span>
    </motion.div>
  );
}

function pillConfig(p: StripPhase): {
  label: string;
  dot: string | null;
  bg: string;
  border: string;
  text: string;
  dim: boolean;
} {
  switch (p.kind) {
    case "preview":
      // Conservé pour compat, mais on ne pousse plus de phase "preview" dans le strip.
      return {
        label: "Démo",
        dot: null,
        bg: "bg-white/[0.02]",
        border: "border-white/[0.06]",
        text: "text-gray-8",
        dim: true,
      };
    case "set": {
      const label = `Série ${p.idx + 1}`;
      if (p.status === "done") {
        // Past sets = simplement gris, pas d'emerald.
        return {
          label,
          dot: "bg-white/25",
          bg: "bg-white/[0.02]",
          border: "border-white/[0.05]",
          text: "text-gray-7",
          dim: true,
        };
      }
      if (p.status === "active") {
        return {
          label,
          dot: "bg-[#FF4D4D]",
          bg: "bg-[#E80000]/[0.1]",
          border: "border-[#E80000]/50",
          text: "text-white",
          dim: false,
        };
      }
      // Pending = neutre, légèrement plus visible que done.
      return {
        label,
        dot: null,
        bg: "bg-white/[0.025]",
        border: "border-white/[0.08]",
        text: "text-gray-9",
        dim: false,
      };
    }
    case "rest":
      return {
        label: "Repos",
        dot: p.active ? "bg-[#FF6D6D]" : null,
        bg: p.active ? "bg-[#E80000]/[0.08]" : "bg-white/[0.02]",
        border: p.active ? "border-[#E80000]/30" : "border-white/[0.05]",
        text: p.active ? "text-[#FF6D6D]" : "text-gray-7",
        dim: !p.active,
      };
  }
}
