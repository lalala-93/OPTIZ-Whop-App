"use client";

import { MessageSquare, MessagesSquare, FileText, X, Zap, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface EngagementRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    chatMessages: number;
    forumPosts: number;
    forumComments: number;
    totalEngagementXp: number;
  };
}

const RULES = [
  {
    icon: MessageSquare,
    title: "Message chat",
    xp: 2,
    cap: 30,
    minChars: 10,
    subtitle: "15 messages max / jour",
  },
  {
    icon: FileText,
    title: "Post forum",
    xp: 10,
    cap: 50,
    minChars: 20,
    subtitle: "5 posts max / jour",
  },
  {
    icon: MessagesSquare,
    title: "Commentaire forum",
    xp: 5,
    cap: 20,
    minChars: 10,
    subtitle: "4 comments max / jour",
  },
];

export function EngagementRulesModal({ isOpen, onClose, stats }: EngagementRulesModalProps) {
  const totalActions =
    (stats?.chatMessages ?? 0) +
    (stats?.forumPosts ?? 0) +
    (stats?.forumComments ?? 0);

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
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#E80000]/12 border border-[#E80000]/20 flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-[#FF6D6D]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-12 leading-tight">
                Gagne de l&apos;XP en étant actif
              </DialogTitle>
              <p className="text-[11px] text-gray-8 mt-0.5">
                Échange avec la communauté pour grimper
              </p>
            </div>
          </div>
        </div>

        {/* User stats */}
        {stats && totalActions > 0 && (
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <p className="text-[10px] text-gray-7 uppercase tracking-wider font-semibold mb-2.5">
              Ton activité
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[18px] font-bold text-gray-12 tabular-nums leading-none">
                  {stats.chatMessages}
                </p>
                <p className="text-[9px] text-gray-7 mt-1">Messages</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[18px] font-bold text-gray-12 tabular-nums leading-none">
                  {stats.forumPosts}
                </p>
                <p className="text-[9px] text-gray-7 mt-1">Posts</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[18px] font-bold text-[#FF6D6D] tabular-nums leading-none">
                  +{stats.totalEngagementXp}
                </p>
                <p className="text-[9px] text-gray-7 mt-1">XP total</p>
              </div>
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-gray-7 uppercase tracking-wider font-semibold mb-3">
            Règles XP
          </p>
          <div className="space-y-2">
            {RULES.map((rule) => (
              <div
                key={rule.title}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <rule.icon size={16} className="text-gray-9" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-12 leading-tight">
                    {rule.title}
                  </p>
                  <p className="text-[10px] text-gray-7 mt-0.5">
                    Min {rule.minChars} caractères · {rule.subtitle}
                  </p>
                </div>
                <div className="flex items-baseline gap-0.5 shrink-0">
                  <span className="text-[14px] font-bold text-[#FF6D6D] tabular-nums">
                    +{rule.xp}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#FF6D6D]">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-cheat note */}
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-start gap-2.5">
            <Shield size={14} className="text-gray-8 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-gray-11 mb-1">
                Protection anti-spam
              </p>
              <p className="text-[10px] text-gray-7 leading-relaxed">
                Les messages trop courts ou au-delà du cap quotidien ne rapportent pas d&apos;XP.
                Max <strong className="text-[#FF6D6D]">100 XP</strong> par jour via la communauté.
              </p>
            </div>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 justify-center">
            <Zap size={12} className="text-[#FF6D6D]" />
            <p className="text-[10px] text-gray-8 text-center">
              L&apos;XP est synchronisée toutes les 10 minutes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
