"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RANK_TIERS, getXpForLevel, getRankForLevel, formatNumber } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useRef, useEffect, useMemo } from "react";
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

    const maxShow = Math.min(Math.max(currentLevel + 12, 20), 50);

    const levels = useMemo(() => {
        let lastTier = "";
        return Array.from({ length: maxShow }, (_, i) => {
            const lvl = i + 1;
            const rank = getRankForLevel(lvl);
            const xpNeeded = getXpForLevel(lvl);
            const isTierStart = rank.tier.name !== lastTier;
            lastTier = rank.tier.name;
            return {
                level: lvl, rank, xpNeeded, isTierStart,
                isCurrent: lvl === currentLevel,
                isReached: lvl <= currentLevel,
            };
        });
    }, [maxShow, currentLevel]);

    useEffect(() => {
        if (isOpen && currentRef.current) {
            setTimeout(() => {
                currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 350);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pt-4 pb-3 border-b border-gray-4/40 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-gray-12">{t("rankMilestones")}</h2>
                                    <p className="text-[11px] text-gray-8 mt-0.5">
                                        {t("level")} {currentLevel} · {t("xpTotal", { n: formatNumber(totalXp) })}
                                    </p>
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
                        </div>

                        {/* Level list — clean, no vertical track */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="space-y-1">
                                {levels.map((item) => (
                                    <div key={item.level}>
                                        {/* Tier separator */}
                                        {item.isTierStart && (
                                            <div className="flex items-center gap-2.5 pt-4 pb-1.5 px-1">
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-widest"
                                                    style={{ color: item.rank.tier.color }}
                                                >
                                                    {item.rank.tier.name}
                                                </span>
                                                <div className="flex-1 h-px" style={{ background: `${item.rank.tier.color}12` }} />
                                            </div>
                                        )}

                                        <div
                                            ref={item.isCurrent ? currentRef : undefined}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${item.isCurrent
                                                    ? "bg-gray-3/60 border border-gray-5/50"
                                                    : ""
                                                }`}
                                        >
                                            {/* Badge */}
                                            <div className={`shrink-0 ${item.isReached ? "" : "opacity-20 grayscale"}`}>
                                                <RankBadge
                                                    colors={item.rank.tier.gradient}
                                                    glowColor={item.rank.tier.glowColor}
                                                    tierName={item.rank.tier.name}
                                                    size={28}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[13px] font-bold ${item.isCurrent ? "text-gray-12" : item.isReached ? "text-gray-11" : "text-gray-7"
                                                        }`}>
                                                        {t("lvl")} {item.level}
                                                    </span>
                                                    {item.isCurrent && (
                                                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#E80000]/12 text-[#FF4444] uppercase tracking-wider">
                                                            {t("youAreHere")}
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
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
