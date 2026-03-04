"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakDays: number;
    weeklyProgress: boolean[];
}

export function StreakModal({ isOpen, onClose, streakDays, weeklyProgress }: StreakModalProps) {
    const { t } = useI18n();
    const dayLabels = [
        t("dayShortMon"),
        t("dayShortTue"),
        t("dayShortWed"),
        t("dayShortThu"),
        t("dayShortFri"),
        t("dayShortSat"),
        t("dayShortSun"),
    ];
    const day = new Date().getDay();
    const todayIndex = day === 0 ? 6 : day - 1;

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
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        <motion.button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all z-10"
                            whileTap={{ scale: 0.85 }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </motion.button>

                        <div className="p-6 pt-8">
                            {/* Giant animated flame — custom SVG, not emoji */}
                            <div className="flex flex-col items-center mb-5">
                                <motion.div
                                    className="mb-2"
                                    animate={{
                                        scale: [1, 1.12, 1.05, 1.15, 1],
                                        rotate: [0, -3, 2, -2, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        filter: "drop-shadow(0 0 20px rgba(255, 100, 0, 0.5)) drop-shadow(0 0 40px rgba(255, 60, 0, 0.25))",
                                    }}
                                >
                                    <AnimatedFireIcon size={64} />
                                </motion.div>

                                <motion.h2
                                    className="text-4xl font-black text-gray-12 tabular-nums"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, type: "spring" }}
                                >
                                    {streakDays} {streakDays === 1 ? t("day") : t("days")}
                                </motion.h2>
                                <p className="text-sm text-gray-9 mt-1 font-medium">{t("currentStreak")}</p>
                            </div>

                            {/* Weekly progress */}
                            <div className="bg-gray-3 rounded-2xl p-4 border border-gray-5 mb-5">
                                <p className="text-xs font-bold text-gray-10 uppercase tracking-wider mb-3">{t("thisWeek")}</p>
                                <div className="flex items-center justify-between gap-1">
                                    {dayLabels.map((day, i) => {
                                        const isDone = weeklyProgress[i];
                                        const isToday = i === todayIndex;
                                        return (
                                            <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                                                <span className={`text-[10px] font-semibold ${isToday ? "text-gray-12" : "text-gray-8"}`}>
                                                    {day}
                                                </span>
                                                <motion.div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDone
                                                        ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.35)]"
                                                        : isToday
                                                            ? "border-2 border-[#E80000]/50 bg-[#E80000]/10 text-gray-11"
                                                            : "bg-gray-4 text-gray-7 border border-gray-5"
                                                        }`}
                                                    initial={isDone ? { scale: 0 } : {}}
                                                    animate={isDone ? { scale: 1 } : {}}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: i * 0.05 }}
                                                >
                                                    {isDone ? "✓" : ""}
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* How it works */}
                            <div className="space-y-3 mb-5">
                                <h3 className="text-sm font-bold text-gray-12">{t("howStreaksWork")}</h3>
                                {[
                                    { icon: "check", text: t("streakRule1") },
                                    { icon: "reset", text: t("streakRule2") },
                                    { icon: "badge", text: t("streakRule3") },
                                ].map((item) => (
                                    <div key={item.text} className="flex items-start gap-2.5">
                                        <span className="mt-0.5 shrink-0 w-4 h-4 text-gray-9">
                                            {item.icon === "check" ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : item.icon === "reset" ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 2v6h6" />
                                                    <path d="M3 8a9 9 0 1 0 2.6-4.3" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8 21h8" />
                                                    <path d="M12 17v4" />
                                                    <path d="M7 4h10l-1 7a4 4 0 0 1-8 0L7 4z" />
                                                </svg>
                                            )}
                                        </span>
                                        <p className="text-xs text-gray-10 leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-gray-4 border border-gray-5 text-gray-12 hover:bg-gray-5 transition-all"
                                whileTap={{ scale: 0.97 }}
                            >
                                {t("gotIt")}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
