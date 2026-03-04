"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RANK_TIERS, getXpForLevel, getRankForLevel, formatNumber } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useRef, useEffect, useMemo } from "react";

interface XPMilestonesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
    totalXp: number;
}

export function XPMilestonesModal({ isOpen, onClose, currentLevel, totalXp }: XPMilestonesModalProps) {
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Header with current rank badge and overall progress */}
                        <div className="px-5 pt-4 pb-4 border-b border-gray-4/40 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <RankBadge
                                        colors={currentRank.tier.gradient}
                                        glowColor={currentRank.tier.glowColor}
                                        tierName={currentRank.tier.name}
                                        size={40}
                                    />
                                    <div>
                                        <h2 className="text-base font-bold text-gray-12">Progression</h2>
                                        <p className="text-[11px] text-gray-8 mt-0.5">
                                            Level {currentLevel} · {currentRank.fullName} · {formatNumber(totalXp)} XP
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:text-gray-12 transition-all"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Overall progress bar */}
                            <div className="relative">
                                <div className="h-2 w-full bg-gray-4/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(to right, ${currentRank.tier.gradient[0]}, ${currentRank.tier.gradient[1]})` }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${overallProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    {RANK_TIERS.slice(0, 4).map((tier) => (
                                        <span
                                            key={tier.name}
                                            className="text-[8px] font-bold uppercase tracking-wider"
                                            style={{ color: currentLevel >= tier.minLevel ? tier.color : "var(--gray-6)" }}
                                        >
                                            {tier.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Level list */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
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
                                                />
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-widest"
                                                    style={{ color: item.rank.tier.color }}
                                                >
                                                    {item.rank.tier.name}
                                                </span>
                                                <div className="flex-1 h-px" style={{ background: `${item.rank.tier.color}20` }} />
                                                <span className="text-[8px] text-gray-6 font-medium">
                                                    LVL {item.rank.tier.minLevel}–{Math.min(item.rank.tier.maxLevel, 20)}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            ref={item.isCurrent ? currentRef : undefined}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${item.isCurrent
                                                ? "bg-gray-3/80 border border-gray-5/60 shadow-sm"
                                                : ""
                                                }`}
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
                                                    <motion.div
                                                        className="w-4 h-4 rounded-full border-2 border-[#E80000]"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-6 opacity-40" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[13px] font-bold ${item.isCurrent ? "text-gray-12" : item.isReached ? "text-gray-11" : "text-gray-7"
                                                        }`}>
                                                        Level {item.level}
                                                    </span>
                                                    {item.isCurrent && (
                                                        <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#E80000]/15 text-[#FF4444] uppercase tracking-wider animate-pulse">
                                                            Ici
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* XP */}
                                            <div className="text-right shrink-0">
                                                <span className={`text-[11px] tabular-nums font-semibold ${item.isReached ? "text-gray-10" : "text-gray-6"
                                                    }`}>
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
                                    L&apos;XP n&apos;est jamais capée — continue à grind au-delà du level 20 !
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
