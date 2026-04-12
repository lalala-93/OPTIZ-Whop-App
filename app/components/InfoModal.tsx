"use client";

import Image from "next/image";
import { Zap, Trophy, Flame, Target, Shield, Gift, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const XP_SOURCES = [
  { icon: Target, label: "Séance complétée", xp: "+50 à 120" },
  { icon: Flame, label: "Streak quotidien", xp: "+10 / jour" },
  { icon: Zap, label: "Pas quotidiens (objectif)", xp: "+15" },
  { icon: Trophy, label: "Nutrition trackée", xp: "+10" },
];

const RULES = [
  "Chaque action te rapporte de l'XP",
  "L'XP détermine ton niveau et ton rang",
  "4 rangs : Recrue → Soldat → Vétéran → Prestige",
  "20 niveaux à débloquer au total",
  "Le classement se reset chaque semaine",
];

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-2 border-white/[0.08] text-gray-12 max-w-md p-0 gap-0">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-gray-9 hover:text-gray-12 hover:bg-white/[0.1] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-5 pt-7 pb-5 border-b border-white/[0.04] text-center">
          <Image
            src="/Logo-optiz.png"
            alt="OPTIZ"
            width={56}
            height={56}
            className="object-contain mx-auto"
            style={{ borderRadius: 0 }}
            priority
          />
          <DialogTitle className="text-lg font-black text-gray-12 mt-3 tracking-tight">
            Comment fonctionne OPTIZ ?
          </DialogTitle>
          <p className="text-[11px] text-gray-8 mt-1 max-w-[260px] mx-auto leading-relaxed">
            Chaque effort compte. Track, progresse et grimpe dans le classement.
          </p>
        </div>

        {/* XP Sources */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <p className="text-[10px] text-gray-7 uppercase tracking-wider font-semibold mb-3">
            Comment gagner de l&apos;XP
          </p>
          <div className="space-y-2">
            {XP_SOURCES.map((src) => (
              <div
                key={src.label}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E80000]/10 border border-[#E80000]/15 flex items-center justify-center shrink-0">
                  <src.icon size={16} className="text-[#FF6D6D]" />
                </div>
                <p className="text-[13px] font-semibold text-gray-12 flex-1">
                  {src.label}
                </p>
                <div className="flex items-baseline gap-0.5 shrink-0">
                  <span className="text-[14px] font-bold text-[#FF6D6D] tabular-nums">
                    {src.xp}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#FF6D6D]">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <p className="text-[10px] text-gray-7 uppercase tracking-wider font-semibold mb-3">
            Règles du jeu
          </p>
          <div className="space-y-2">
            {RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-9">{i + 1}</span>
                </div>
                <p className="text-[12px] text-gray-11 leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Contest */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <div className="rounded-xl bg-[#E80000]/8 border border-[#E80000]/20 p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <Gift size={18} className="text-[#FF6D6D] shrink-0" />
              <p className="text-[13px] font-bold text-gray-12">
                Concours hebdomadaire
              </p>
            </div>
            <p className="text-[11px] text-gray-11 leading-relaxed">
              Chaque semaine, le <strong className="text-[#FF6D6D]">Top 1</strong> du classement gagne une{" "}
              <strong className="text-gray-12">commande offerte</strong> sur la boutique{" "}
              <strong className="text-gray-12">Optiz Store</strong> — nos produits naturels pour ta santé.
            </p>
          </div>
        </div>

        {/* Philosophy */}
        <div className="px-5 py-4 pb-5">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5 flex items-start gap-2.5">
            <Shield size={14} className="text-gray-8 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-gray-11 mb-1">
                Notre philosophie
              </p>
              <p className="text-[10px] text-gray-7 leading-relaxed">
                OPTIZ, c&apos;est la discipline qui fait la différence. Pas de triche, pas de raccourci.
                Chaque XP est mérité. Deviens la meilleure version de toi-même, naturellement.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
