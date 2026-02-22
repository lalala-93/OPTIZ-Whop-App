"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Challenge } from "./rankSystem";

interface ChallengeDetailModalProps {
    challenge: Challenge | null;
    isOpen: boolean;
    onClose: () => void;
    onJoin: (challengeId: string) => void;
}

export function ChallengeDetailModal({
    challenge,
    isOpen,
    onClose,
    onJoin,
}: ChallengeDetailModalProps) {
    if (!challenge) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Hero section */}
                        <div className="relative p-6 pb-4">
                            {/* Gradient bg */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#E80000]/8 to-transparent" />

                            <div className="relative text-center">
                                <motion.div
                                    className="w-20 h-20 mx-auto rounded-2xl bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center text-4xl mb-4 shadow-[0_0_30px_rgba(232,0,0,0.1)]"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                                >
                                    {challenge.emoji}
                                </motion.div>

                                <h2 className="text-xl font-bold text-gray-12">{challenge.title}</h2>

                                <div className="flex items-center justify-center gap-3 mt-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${challenge.difficulty === "Hard"
                                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                            : challenge.difficulty === "Extreme"
                                                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                        }`}>
                                        {challenge.difficulty}
                                    </span>
                                    <span className="text-xs text-gray-8">
                                        {challenge.participantCount.toLocaleString()} joined
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="px-6 pb-4">
                            <p className="text-sm text-gray-10 leading-relaxed">
                                {challenge.longDescription}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="px-6 pb-4">
                            <div className="flex gap-3">
                                <div className="flex-1 bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold text-gray-12">{challenge.tasks.length}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Tasks</p>
                                </div>
                                <div className="flex-1 bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold optiz-gradient-text">{challenge.totalXp}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Total XP</p>
                                </div>
                                <div className="flex-1 bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold text-gray-12">30</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Days</p>
                                </div>
                            </div>
                        </div>

                        {/* Tasks preview */}
                        <div className="px-6 pb-4">
                            <h3 className="text-sm font-bold text-gray-12 mb-2.5">Daily Tasks</h3>
                            <div className="space-y-1.5">
                                {challenge.tasks.slice(0, 4).map((task, i) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-3/50 border border-gray-5/50"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base">{task.emoji}</span>
                                            <span className="text-xs text-gray-11 font-medium">{task.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#E80000]">+{task.xpReward} XP</span>
                                    </div>
                                ))}
                                {challenge.tasks.length > 4 && (
                                    <p className="text-center text-xs text-gray-8 py-1">
                                        +{challenge.tasks.length - 4} more tasks
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="px-6 pb-6 pt-2 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-4 hover:bg-gray-5 text-gray-11 transition-all"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={() => {
                                    onJoin(challenge.id);
                                    onClose();
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(232,0,0,0.2)]"
                            >
                                Join Challenge
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
