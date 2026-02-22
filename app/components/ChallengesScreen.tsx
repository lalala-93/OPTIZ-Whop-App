"use client";

import { motion } from "framer-motion";
import type { Challenge } from "./rankSystem";

interface ChallengesScreenProps {
    challenges: Challenge[];
    onOpenChallenge: (challenge: Challenge) => void;
    onGoToProgram: (challengeId: string) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
};

export function ChallengesScreen({
    challenges,
    onOpenChallenge,
    onGoToProgram,
}: ChallengesScreenProps) {
    return (
        <div className="pb-8">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <h2 className="text-xl font-bold text-gray-12 mb-1">Challenges</h2>
                <p className="text-sm text-gray-9 mb-5">
                    Join a challenge, complete tasks, earn XP.
                </p>
            </motion.div>

            <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {challenges.map((challenge) => {
                    const isJoined = challenge.joined;
                    const completedTasks = challenge.tasks.filter(t => t.completed).length;

                    return (
                        <motion.div
                            key={challenge.id}
                            className={`relative rounded-2xl overflow-hidden transition-all ${isJoined
                                ? "bg-gray-3/50 border border-[var(--optiz-border-active)] shadow-[0_0_16px_rgba(232,0,0,0.06)]"
                                : "bg-gray-3/30 border border-gray-5/50 hover:border-gray-5"
                                }`}
                            variants={itemVariants}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                        >
                            <div className="p-3.5 sm:p-4">
                                {/* Single-row compact layout: Icon | Info | Button */}
                                <div className="flex items-center gap-3">
                                    {/* Left: Challenge emoji */}
                                    <div className="w-12 h-12 rounded-xl bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center text-2xl shrink-0">
                                        {challenge.emoji}
                                    </div>

                                    {/* Center: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold text-gray-12 truncate">
                                                {challenge.title}
                                            </h3>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${challenge.difficulty === "Hard"
                                                ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                                : challenge.difficulty === "Extreme"
                                                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                                    : challenge.difficulty === "Medium"
                                                        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                                        : "bg-green-500/15 text-green-400 border border-green-500/20"
                                                }`}>
                                                {challenge.difficulty}
                                            </span>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 text-[10px] text-gray-8 font-medium">
                                            <span className="flex items-center gap-0.5">
                                                👥 {challenge.participantCount.toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                📅 {challenge.durationDays}d
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                ⚡ {challenge.totalXp} XP
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                📋 {challenge.tasks.length} tasks
                                            </span>
                                        </div>

                                        {/* Progress bar for joined challenges */}
                                        {isJoined && (
                                            <div className="mt-2">
                                                <div className="h-1.5 w-full bg-gray-4 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full optiz-gradient-bg"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(completedTasks / challenge.tasks.length) * 100}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-gray-7 mt-1 tabular-nums">
                                                    {completedTasks}/{challenge.tasks.length} completed
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Action button */}
                                    <div className="shrink-0">
                                        {isJoined ? (
                                            <button
                                                onClick={() => onGoToProgram(challenge.id)}
                                                className="px-3.5 py-2 rounded-xl font-semibold text-[11px] bg-gray-4 border border-gray-5 text-gray-12 hover:bg-gray-5 transition-all active:scale-95 flex items-center gap-1"
                                            >
                                                Open
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onOpenChallenge(challenge)}
                                                className="px-3.5 py-2 rounded-xl font-bold text-[11px] optiz-gradient-bg text-white transition-all active:scale-95 shadow-sm flex items-center gap-1"
                                            >
                                                Join
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Coming soon hint */}
            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className="rounded-2xl p-5 border border-dashed border-gray-5/50 bg-gray-3/20">
                    <p className="text-sm text-gray-7 font-medium">More challenges coming soon...</p>
                    <p className="text-xs text-gray-6 mt-1">Stay tuned for new programs and competitions.</p>
                </div>
            </motion.div>
        </div>
    );
}
