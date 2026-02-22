"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RANK_TIERS, getXpForLevel, getRankForLevel } from "./rankSystem";
import { useRef, useEffect } from "react";

interface XPMilestonesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
    totalXp: number;
}

export function XPMilestonesModal({ isOpen, onClose, currentLevel, totalXp }: XPMilestonesModalProps) {
    const currentRef = useRef<HTMLDivElement>(null);

    // Build level list from 1 to max visible level (current + 10, max 50)
    const maxShow = Math.min(Math.max(currentLevel + 12, 20), 50);
    const levels = Array.from({ length: maxShow }, (_, i) => {
        const lvl = i + 1;
        const rank = getRankForLevel(lvl);
        const xpNeeded = getXpForLevel(lvl);
        // Calculate cumulative XP needed to REACH this level
        let cumulativeXp = 0;
        for (let j = 1; j < lvl; j++) {
            cumulativeXp += getXpForLevel(j);
        }
        return {
            level: lvl,
            rank,
            xpNeeded,
            cumulativeXp,
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
                        <div className="px-6 pt-4 pb-4 border-b border-gray-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-12">Rank Milestones</h2>
                                    <p className="text-xs text-gray-8 mt-0.5">
                                        Level {currentLevel} • {totalXp.toLocaleString()} XP total
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
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="relative">
                                {/* Red progress line */}
                                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-5" />
                                <motion.div
                                    className="absolute left-[19px] top-0 w-0.5 bg-[#E80000] origin-top"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(currentLevel / maxShow) * 100}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                                    style={{ boxShadow: "0 0 8px rgba(232, 0, 0, 0.4)" }}
                                />

                                {/* Level rows */}
                                <div className="space-y-0.5">
                                    {levels.map((item, i) => {
                                        const tierChanged = i === 0 || getRankForLevel(item.level).tier.name !== getRankForLevel(item.level - 1).tier.name;

                                        return (
                                            <div key={item.level}>
                                                {/* Tier separator */}
                                                {tierChanged && (
                                                    <div className="flex items-center gap-2 pl-10 py-2 mt-1">
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-widest"
                                                            style={{ color: item.rank.tier.color }}
                                                        >
                                                            {item.rank.tier.name}
                                                        </span>
                                                        <div className="flex-1 h-px" style={{ background: `${item.rank.tier.color}30` }} />
                                                    </div>
                                                )}

                                                <div
                                                    ref={item.isCurrent ? currentRef : undefined}
                                                    className={`flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all ${item.isCurrent
                                                            ? "bg-[#E80000]/8 border border-[#E80000]/20 shadow-[0_0_16px_rgba(232,0,0,0.08)]"
                                                            : ""
                                                        }`}
                                                >
                                                    {/* Dot */}
                                                    <div className={`w-[10px] h-[10px] rounded-full shrink-0 z-10 ${item.isCurrent
                                                            ? "bg-[#E80000] shadow-[0_0_8px_rgba(232,0,0,0.5)] ring-2 ring-[#E80000]/30"
                                                            : item.isReached
                                                                ? "bg-[#E80000]"
                                                                : "bg-gray-5 border border-gray-6"
                                                        }`} />

                                                    {/* Rank icon mini */}
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.isReached ? "" : "opacity-40 grayscale"
                                                            }`}
                                                        style={{
                                                            background: `linear-gradient(135deg, ${item.rank.tier.gradient[0]}20, ${item.rank.tier.gradient[1]}10)`,
                                                            border: `1px solid ${item.rank.tier.color}30`,
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 100 110" className="w-5 h-5">
                                                            <path
                                                                d="M50 4 L92 22 L86 82 L50 104 L14 82 L8 22 Z"
                                                                fill={item.rank.tier.color}
                                                                opacity={item.isReached ? 0.8 : 0.3}
                                                            />
                                                            <path
                                                                d="M50 38 L53.1 47.5 L63 47.5 L55 53.5 L58 63 L50 57.5 L42 63 L45 53.5 L37 47.5 L46.9 47.5 Z"
                                                                fill="rgba(255,255,255,0.8)"
                                                            />
                                                        </svg>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className={`text-sm font-bold ${item.isCurrent ? "text-gray-12" : item.isReached ? "text-gray-11" : "text-gray-8"
                                                                }`}>
                                                                Level {item.level}
                                                            </span>
                                                            {item.isCurrent && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E80000]/15 text-[#FF2D2D] uppercase tracking-wider">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-medium" style={{ color: item.isReached ? item.rank.tier.color : "var(--gray-7)" }}>
                                                            {item.rank.fullName}
                                                        </p>
                                                    </div>

                                                    {/* XP */}
                                                    <span className={`text-xs tabular-nums font-medium ${item.isReached ? "text-gray-10" : "text-gray-7"
                                                        }`}>
                                                        {item.xpNeeded.toLocaleString()} <span className="text-[10px] opacity-60">XP</span>
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
