"use client";

import { motion } from "framer-motion";
import type { ChallengeTask } from "./rankSystem";

interface ChallengeProgramProps {
    challengeTitle: string;
    challengeEmoji: string;
    tasks: ChallengeTask[];
    onCompleteTask: (taskId: string) => void;
    onBack: () => void;
    completingTaskId: string | null;
}

export function ChallengeProgram({
    challengeTitle,
    challengeEmoji,
    tasks,
    onCompleteTask,
    onBack,
    completingTaskId,
}: ChallengeProgramProps) {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const progressPercent = total > 0 ? (completed / total) * 100 : 0;
    const totalXpEarned = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xpReward, 0);
    const totalXpPossible = tasks.reduce((sum, t) => sum + t.xpReward, 0);

    return (
        <div className="pb-8">
            {/* Back button */}
            <motion.button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-4 -ml-1"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Challenges
            </motion.button>

            {/* Program header */}
            <motion.div
                className="relative rounded-2xl overflow-hidden mb-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E80000]/10 via-transparent to-[#E80000]/5" />
                <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#E80000]/15 border border-[#E80000]/25 flex items-center justify-center text-2xl">
                            {challengeEmoji}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-12">{challengeTitle}</h2>
                            <p className="text-xs text-gray-9 font-medium">Daily Program</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-9 font-medium">Progress</span>
                            <span className="text-gray-11 font-bold tabular-nums">
                                {completed}/{total} completed
                            </span>
                        </div>
                        <div className="h-2 w-full bg-gray-3 rounded-full overflow-hidden border border-gray-5/50">
                            <motion.div
                                className="h-full rounded-full optiz-gradient-bg"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* XP earned */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-base">⚡</span>
                            <span className="font-bold text-gray-12 tabular-nums">{totalXpEarned}</span>
                            <span className="text-gray-8">/ {totalXpPossible} XP earned</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Task list */}
            <h3 className="text-sm font-bold text-gray-12 mb-3 uppercase tracking-wider">Today&apos;s Tasks</h3>

            <div className="space-y-2.5">
                {tasks.map((task, i) => {
                    const isCompleting = completingTaskId === task.id;

                    return (
                        <motion.div
                            key={task.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${task.completed
                                    ? "bg-gray-2 border border-gray-4"
                                    : "optiz-surface hover:bg-[var(--optiz-surface-hover)]"
                                }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            layout
                        >
                            {/* Completion circle */}
                            {task.completed ? (
                                <motion.div
                                    className="w-6 h-6 rounded-full bg-[#E80000] flex items-center justify-center shrink-0"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => !isCompleting && onCompleteTask(task.id)}
                                    disabled={isCompleting}
                                    className="w-6 h-6 rounded-full border-2 border-gray-6 hover:border-[#E80000]/50 transition-colors shrink-0 flex items-center justify-center"
                                >
                                    {isCompleting && (
                                        <motion.div
                                            className="w-3 h-3 rounded-full bg-[#E80000]"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity }}
                                        />
                                    )}
                                </button>
                            )}

                            {/* Task info */}
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                <span className={`text-sm font-medium ${task.completed ? "line-through text-gray-8" : "text-gray-12"
                                    }`}>
                                    {task.name}
                                </span>
                            </div>

                            {/* Emoji + XP */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-base">{task.emoji}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.completed
                                        ? "bg-gray-3 text-gray-7"
                                        : "bg-[#E80000]/10 text-[#FF2D2D] border border-[#E80000]/15"
                                    }`}>
                                    +{task.xpReward}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* All done state */}
            {completed === total && total > 0 && (
                <motion.div
                    className="mt-6 text-center py-6 rounded-2xl optiz-surface"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.span
                        className="text-4xl block mb-3"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🎉
                    </motion.span>
                    <h3 className="text-base font-bold text-gray-12 mb-1">All Tasks Complete!</h3>
                    <p className="text-xs text-gray-9">
                        You earned <span className="font-bold text-[#E80000]">{totalXpEarned} XP</span> today. Come back tomorrow!
                    </p>
                </motion.div>
            )}
        </div>
    );
}
