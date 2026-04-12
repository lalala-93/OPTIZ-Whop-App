"use client";

import Image from "next/image";
import { Dumbbell, Footprints, Flame, Wind, Gift, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const XP_SOURCES = [
  { icon: Dumbbell, label: "Séance d'entraînement", xp: "100", color: "#E80000" },
  { icon: Footprints, label: "Objectif de pas atteint", xp: "15", color: "#FF6D6D" },
  { icon: Flame, label: "Streak quotidien", xp: "10", color: "#FF8C00" },
  { icon: Wind, label: "Session de respiration", xp: "25", color: "#FF6D6D" },
];

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border-white/[0.06] text-gray-12 max-w-md p-0 gap-0 rounded-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-gray-9 hover:text-gray-12 hover:bg-white/[0.1] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          <Image
            src="/Logo-optiz.png"
            alt="OPTIZ"
            width={48}
            height={48}
            className="object-contain mx-auto"
            style={{ borderRadius: 0 }}
            priority
          />
          <DialogTitle className="text-[20px] font-black text-white mt-4 tracking-tight">
            Ta progression, gamifiée.
          </DialogTitle>
          <p className="text-[12px] text-white/40 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
            Entraîne-toi, reste régulier, grimpe dans le classement.
          </p>
        </div>

        {/* XP Sources */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3 px-1">
            Sources d&apos;XP
          </p>
          <div className="grid grid-cols-2 gap-2">
            {XP_SOURCES.map((src) => (
              <div
                key={src.label}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <src.icon size={16} className="text-white/50" />
                  <span className="text-[14px] font-black text-[#FF6D6D] tabular-nums">
                    +{src.xp}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-white/70 leading-tight">
                  {src.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3 px-1">
            Comment ça marche
          </p>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center gap-3 mb-3">
              {["Recrue", "Soldat", "Vétéran", "Prestige"].map((rank, i) => (
                <div key={rank} className="flex-1 text-center">
                  <div className={`text-[10px] font-bold ${i === 0 ? "text-[#FF6D6D]" : "text-white/25"}`}>
                    {rank}
                  </div>
                  <div className={`h-1 rounded-full mt-1.5 ${i === 0 ? "bg-[#E80000]" : "bg-white/[0.06]"}`} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Accumule de l&apos;XP pour monter de niveau. 20 niveaux répartis en 4 rangs.
              Ton classement se met à jour en temps réel.
            </p>
          </div>
        </div>

        {/* Weekly Contest */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-[#E80000]/8 border border-[#E80000]/15 p-4 flex items-start gap-3">
            <Gift size={20} className="text-[#FF6D6D] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-white mb-1">
                Concours hebdomadaire
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Le <span className="text-[#FF6D6D] font-semibold">Top 1</span> de chaque semaine remporte une commande offerte sur{" "}
                <span className="text-white/80 font-semibold">Optiz Store</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-1">
          <p className="text-[10px] text-white/20 text-center leading-relaxed">
            Pas de triche, pas de raccourci. Chaque XP est mérité.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
