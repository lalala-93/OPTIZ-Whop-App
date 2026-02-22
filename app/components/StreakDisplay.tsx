"use client";

import { motion } from "framer-motion";

interface StreakDisplayProps {
    streakDays: number;
    weeklyProgress: boolean[]; // 7 bools [Mon..Sun]
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakDisplay({ streakDays, weeklyProgress }: StreakDisplayProps) {
    return (
        <motion.div
            className="rounded-2xl p-4 sm:p-5 bg-gray-3/40 border border-gray-5/50"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            {/* Streak header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <motion.span
                        className="text-2xl"
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(255, 100, 0, 0.4))" }}
                    >
                        🔥
                    </motion.span>
                    <div>
                        <p className="text-sm font-bold text-gray-12">
                            {streakDays} day streak
                        </p>
                        <p className="text-[11px] text-gray-8">
                            Complete a task every 24h
                        </p>
                    </div>
                </div>
                {streakDays >= 7 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                        On fire!
                    </span>
                )}
            </div>

            {/* Weekly dots — Premium redesign */}
            <div className="flex items-center justify-between gap-1.5">
                {DAY_LABELS.map((day, i) => {
                    const isDone = weeklyProgress[i];
                    const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

                    return (
                        <div key={`${day}-${i}`} className="flex flex-col items-center gap-2 flex-1">
                            <span className={`text-[10px] font-semibold tracking-wide ${isToday ? "text-gray-12" : "text-gray-7"
                                }`}>
                                {day}
                            </span>
                            <motion.div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isDone
                                        ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.35)]"
                                        : isToday
                                            ? "border-2 border-[#E80000]/50 bg-[#E80000]/10 text-gray-11"
                                            : "bg-gray-4 text-gray-7 border border-gray-6"
                                    }`}
                                initial={isDone ? { scale: 0 } : {}}
                                animate={isDone ? { scale: 1 } : isToday ? { scale: [1, 1.05, 1] } : {}}
                                transition={
                                    isDone
                                        ? { type: "spring", stiffness: 400, damping: 18, delay: i * 0.05 }
                                        : isToday
                                            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                            : {}
                                }
                            >
                                {isDone && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
