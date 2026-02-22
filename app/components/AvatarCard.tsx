"use client";

import { motion } from "framer-motion";

interface AvatarCardProps {
    id: string;
    emoji: string;
    name: string;
    level: number;
    currentXp: number;
    goalXp: number;
    streak: number;
    onComplete: (id: string) => void;
    isCompleting?: boolean;
}

export function AvatarCard({
    id,
    emoji,
    name,
    level,
    currentXp,
    goalXp,
    streak,
    onComplete,
    isCompleting = false,
}: AvatarCardProps) {
    const progressPercent = Math.min((currentXp / goalXp) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="bg-[--color-optiz-card] hover:bg-[--color-optiz-card-hover] transition-colors rounded-3xl p-5 border border-[--color-optiz-border] flex flex-col gap-4 relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black flexItems-center justify-center text-3xl shadow-inner border border-white/5 flex items-center">
                        {emoji}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-white">{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                                LVL {level}
                            </span>
                            {streak > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                    🔥 {streak}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-xs font-medium text-[--color-optiz-muted]">
                    <span>Progress to Lvl {level + 1}</span>
                    <span>
                        {currentXp} <span className="text-white/30">/</span> {goalXp} XP
                    </span>
                </div>
                <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[--color-optiz-red] to-[--color-optiz-orange]"
                    />
                </div>
            </div>

            <button
                onClick={() => onComplete(id)}
                disabled={isCompleting}
                className="mt-2 w-full active:scale-[0.98] transition-all bg-[--color-optiz-red] hover:bg-red-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {isCompleting ? (
                    <span className="animate-pulse">Tracking...</span>
                ) : (
                    <>
                        Complete Workout
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </>
                )}
            </button>
        </motion.div>
    );
}
