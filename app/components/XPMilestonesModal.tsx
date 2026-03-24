"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RANK_TIERS, getXpForLevel, getRankForLevel, getRankNameKey, formatNumber } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useI18n } from "./i18n";

interface XPMilestonesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
    totalXp: number;
}

export function XPMilestonesModal({ isOpen, onClose, currentLevel, totalXp }: XPMilestonesModalProps) {
    const { t } = useI18n();
    const currentRef = useRef<HTMLDivElement>(null);

    // Always show 20 levels + any beyond if user is past 20
    const maxShow = Math.max(20, currentLevel + 3);

    const levels = useMemo(() => {
        return Array.from({ length: maxShow }, (_, i) => {
            const lvl = i + 1;
            const rank = getRankForLevel(lvl);
            const xpNeeded = getXpForLevel(lvl);
            const previousTier = i === 0 ? "" : getRankForLevel(lvl - 1).tier.name;
            const isTierStart = rank.tier.name !== previousTier;
            return {
                level: lvl, rank, xpNeeded, isTierStart,
                isCurrent: lvl === currentLevel,
                isReached: lvl <= currentLevel,
            };
        });
    }, [maxShow, currentLevel]);

    // Overall progress across the 20-level roadmap
    const overallProgress = Math.min((currentLevel / 20) * 100, 100);
    const currentRank = getRankForLevel(currentLevel);

    useEffect(() => {
        if (isOpen && currentRef.current) {
            setTimeout(() => {
                currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 400);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-gray-2 border-gray-5/40 text-gray-12 max-w-md p-0 gap-0 max-h-[85vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-7 h-7 rounded-full bg-gray-4/80 border border-gray-5/50 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-gray-5 transition-all z-10"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
                {/* Header with current rank badge and overall progress */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-4/40 shrink-0">
                    <DialogHeader className="flex-row items-center gap-3 space-y-0 mb-3">
                        <RankBadge
                            colors={currentRank.tier.gradient}
                            glowColor={currentRank.tier.glowColor}
                            tierName={currentRank.tier.name}
                            size={40}
                        />
                        <div className="flex-1">
                            <DialogTitle className="text-base font-bold text-gray-12">
                                {t("milestonesHeaderTitle")}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-gray-8 mt-0.5">
                                {t("milestonesSummary", { level: currentLevel, rank: t(getRankNameKey(currentRank.tier.name) as Parameters<typeof t>[0]), xp: formatNumber(totalXp) })}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Overall progress bar */}
                    <div className="relative">
                        <Progress
                            value={overallProgress}
                            className="h-2 bg-gray-4/50"
                            style={{
                                ["--progress-background" as string]: `linear-gradient(to right, ${currentRank.tier.gradient[0]}, ${currentRank.tier.gradient[1]})`,
                            }}
                        />
                        <div className="flex justify-between mt-1.5">
                            {RANK_TIERS.slice(0, 4).map((tier) => (
                                <span
                                    key={tier.name}
                                    className="text-[8px] font-bold uppercase tracking-wider"
                                    style={{ color: currentLevel >= tier.minLevel ? tier.color : "var(--gray-6)" }}
                                >
                                    {t(getRankNameKey(tier.name) as Parameters<typeof t>[0])}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Level list — native scroll */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
                    <div className="space-y-0.5">
                        {levels.map((item) => (
                            <div key={item.level}>
                                {/* Tier separator */}
                                {item.isTierStart && (
                                    <div className="flex items-center gap-3 pt-5 pb-2 px-1">
                                        <RankBadge
                                            colors={item.rank.tier.gradient}
                                            glowColor={item.rank.tier.glowColor}
                                            tierName={item.rank.tier.name}
                                            size={22}
                                            static
                                        />
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-widest"
                                            style={{ color: item.rank.tier.color }}
                                        >
                                            {t(getRankNameKey(item.rank.tier.name) as Parameters<typeof t>[0])}
                                        </span>
                                        <Separator className="flex-1" style={{ background: `${item.rank.tier.color}20` }} />
                                        <span className="text-[8px] text-gray-6 font-medium">
                                            LVL {item.rank.tier.minLevel}–{Math.min(item.rank.tier.maxLevel, 20)}
                                        </span>
                                    </div>
                                )}

                                <div
                                    ref={item.isCurrent ? currentRef : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                                        item.isCurrent && "bg-gray-3/80 border border-gray-5/60 shadow-sm"
                                    )}
                                >
                                    {/* Check / Lock indicator */}
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {item.isReached ? (
                                            <div className="w-4 h-4 rounded-full bg-[#E80000] flex items-center justify-center">
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                        ) : item.isCurrent ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-[#E80000]" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-6 opacity-40" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[13px] font-bold",
                                                item.isCurrent ? "text-gray-12" : item.isReached ? "text-gray-11" : "text-gray-7"
                                            )}>
                                                {t("milestonesLevelLabel", { level: item.level })}
                                            </span>
                                            {item.isCurrent && (
                                                <Badge className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#E80000]/15 text-[#FF4444] border-[#E80000]/30 hover:bg-[#E80000]/15 uppercase tracking-wider animate-pulse">
                                                    {t("milestonesCurrentTag")}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* XP */}
                                    <div className="text-right shrink-0">
                                        <span className={cn(
                                            "text-[11px] tabular-nums font-semibold",
                                            item.isReached ? "text-gray-10" : "text-gray-6"
                                        )}>
                                            {formatNumber(item.xpNeeded)}
                                        </span>
                                        <span className="text-[8px] text-[#E80000] font-bold ml-0.5">XP</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer note */}
                    <div className="text-center mt-4 mb-2">
                        <p className="text-[10px] text-gray-6">
                            {t("milestonesBeyond20")}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
