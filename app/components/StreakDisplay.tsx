"use client";

import { motion } from "framer-motion";

interface StreakDisplayProps {
    streakDays: number;
    weeklyProgress: boolean[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakDisplay({ streakDays, weeklyProgress }: StreakDisplayProps) {
    return (
        <motion.div
            className="rounded-2xl p-4 bg-gray-3/30 border border-gray-5/40"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
        >
            {/* Header — all on one line */}
            <div className="flex items-center gap-2 mb-4">
                <motion.span
                    className="text-xl"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    🔥
                </motion.span>
                <p className="text-sm font-bold text-gray-12">
                    {streakDays} day streak
                </p>
                <span className="text-[10px] text-gray-7 font-medium">
                    · Complete a task every 24h
                </span>
                {streakDays >= 7 && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/12 text-orange-400 border border-orange-500/15 uppercase tracking-wider">
                        On fire
                    </span>
                )}
            </div>

            {/* Weekly dots */}
            <div className="flex items-center justify-between gap-1">
                {DAY_LABELS.map((day, i) => {
                    const isDone = weeklyProgress[i];
                    const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

                    return (
                        <div key={`${day}-${i}`} className="flex flex-col items-center gap-1.5 flex-1">
                            <span className={`text-[9px] font-semibold ${isToday ? "text-gray-12" : "text-gray-7"
                                }`}>
                                {day}
                            </span>
                            <motion.div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone
                                        ? "bg-[#E80000] text-white"
                                        : isToday
                                            ? "border-[1.5px] border-[#E80000]/40 bg-[#E80000]/8 text-gray-10"
                                            : "bg-gray-4/60 text-gray-6 border border-gray-5/40"
                                    }`}
                                initial={isDone ? { scale: 0.6, opacity: 0 } : {}}
                                animate={isDone ? { scale: 1, opacity: 1 } : isToday ? { scale: [1, 1.04, 1] } : {}}
                                transition={
                                    isDone
                                        ? { type: "spring", stiffness: 400, damping: 18, delay: i * 0.04 }
                                        : isToday
                                            ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                                            : {}
                                }
                            >
                                {isDone && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
