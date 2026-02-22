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
            className="optiz-surface rounded-2xl p-4 sm:p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            {/* Streak header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <motion.span
                        className="text-2xl"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🔥
                    </motion.span>
                    <div>
                        <p className="text-sm font-bold text-gray-12">
                            {streakDays} day streak
                        </p>
                        <p className="text-[11px] text-gray-9">
                            Complete a task every 24h
                        </p>
                    </div>
                </div>
                {streakDays >= 7 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        On fire!
                    </span>
                )}
            </div>

            {/* Weekly dots */}
            <div className="flex items-center justify-between gap-1">
                {DAY_LABELS.map((day, i) => {
                    const isDone = weeklyProgress[i];
                    const isToday = i === new Date().getDay() - 1 || (i === 6 && new Date().getDay() === 0);

                    return (
                        <div key={`${day}-${i}`} className="flex flex-col items-center gap-1.5 flex-1">
                            <span className={`text-[10px] font-semibold tracking-wide ${isToday ? "text-gray-12" : "text-gray-8"
                                }`}>
                                {day}
                            </span>
                            <motion.div
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isDone
                                        ? "bg-[#E80000] text-white shadow-[0_0_10px_rgba(232,0,0,0.3)]"
                                        : isToday
                                            ? "border-2 border-[#E80000]/50 bg-[#E80000]/10 text-gray-11"
                                            : "bg-gray-3 text-gray-7 border border-gray-5"
                                    }`}
                                initial={isDone ? { scale: 0 } : {}}
                                animate={isDone ? { scale: 1 } : {}}
                                transition={{ type: "spring", stiffness: 350, damping: 20, delay: i * 0.05 }}
                            >
                                {isDone ? "✓" : ""}
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
