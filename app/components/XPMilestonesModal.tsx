"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RANK_TIERS, getXpForLevel, getRankForLevel } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useRef, useEffect } from "react";

interface XPMilestonesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
    totalXp: number;
}

export function XPMilestonesModal({ isOpen, onClose, currentLevel, totalXp }: XPMilestonesModalProps) {
    const currentRef = useRef<HTMLDivElement>(null);

    const maxShow = Math.min(Math.max(currentLevel + 12, 20), 50);
    const levels = Array.from({ length: maxShow }, (_, i) => {
        const lvl = i + 1;
        const rank = getRankForLevel(lvl);
        const xpNeeded = getXpForLevel(lvl);
        return {
            level: lvl,
            rank,
            xpNeeded,
            isCurrent: lvl === currentLevel,
            isReached: lvl <= currentLevel,
        };
    });

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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pt-4 pb-3 border-b border-gray-4/60 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-12">Rank Milestones</h2>
                                    <p className="text-[11px] text-gray-8 mt-0.5">
                                        Level {currentLevel} · {totalXp.toLocaleString()} XP total
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Level list */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <div className="relative ml-4">
                                {/* Background track line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-5/40 rounded-full" />

                                {/* Progress line */}
                                <motion.div
                                    className="absolute left-0 top-0 w-[2px] rounded-full"
                                    style={{ background: "linear-gradient(to bottom, #E80000, #FF2D2D)" }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min((currentLevel / maxShow) * 100, 100)}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                                />

                                {/* Level rows */}
                                <div className="space-y-1">
                                    {levels.map((item, i) => {
                                        const prevRank = i > 0 ? getRankForLevel(item.level - 1) : null;
                                        const tierChanged = !prevRank || prevRank.tier.name !== item.rank.tier.name;

                                        return (
                                            <div key={item.level}>
                                                {/* Tier header */}
                                                {tierChanged && (
                                                    <div className="flex items-center gap-2 pl-6 pt-3 pb-1">
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-widest"
                                                            style={{ color: item.rank.tier.color }}
                                                        >
                                                            {item.rank.tier.name}
                                                        </span>
                                                        <div className="flex-1 h-px" style={{ background: `${item.rank.tier.color}20` }} />
                                                    </div>
                                                )}

                                                <div
                                                    ref={item.isCurrent ? currentRef : undefined}
                                                    className={`relative flex items-center gap-3 py-2.5 pl-6 pr-3 rounded-xl transition-all ${item.isCurrent
                                                            ? "bg-[#E80000]/6 border border-[#E80000]/15"
                                                            : ""
                                                        }`}
                                                >
                                                    {/* Checkpoint dot — centered on the line */}
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                                                    >
                                                        <div className={`rounded-full ${item.isCurrent
                                                                ? "w-3 h-3 bg-[#E80000] ring-[3px] ring-[#E80000]/25"
                                                                : item.isReached
                                                                    ? "w-2.5 h-2.5 bg-[#E80000]"
                                                                    : "w-2 h-2 bg-gray-6 border border-gray-5"
                                                            }`} />
                                                    </div>

                                                    {/* Mini rank badge */}
                                                    <div className={`shrink-0 ${item.isReached ? "" : "opacity-30 grayscale"}`}>
                                                        <RankBadge
                                                            colors={item.rank.tier.gradient}
                                                            glowColor={item.rank.tier.glowColor}
                                                            tierName={item.rank.tier.name}
                                                            size={28}
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-sm font-bold ${item.isCurrent ? "text-gray-12" : item.isReached ? "text-gray-11" : "text-gray-8"
                                                                }`}>
                                                                Lvl {item.level}
                                                            </span>
                                                            {item.isCurrent && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#E80000]/12 text-[#FF2D2D] uppercase tracking-wider">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-medium" style={{
                                                            color: item.isReached ? item.rank.tier.color : "var(--gray-7)"
                                                        }}>
                                                            {item.rank.fullName}
                                                        </p>
                                                    </div>

                                                    {/* XP */}
                                                    <span className={`text-[11px] tabular-nums font-medium ${item.isReached ? "text-gray-10" : "text-gray-7"
                                                        }`}>
                                                        {item.xpNeeded}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
