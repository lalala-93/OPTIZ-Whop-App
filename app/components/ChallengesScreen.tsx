"use client";

import { motion } from "framer-motion";
import type { Challenge } from "./rankSystem";

interface ChallengesScreenProps {
    challenges: Challenge[];
    onOpenChallenge: (challenge: Challenge) => void;
    onGoToProgram: (challengeId: string) => void;
}

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
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-xl font-bold text-gray-12 mb-1">Challenges</h2>
                <p className="text-sm text-gray-9 mb-5">
                    Join a challenge, complete tasks, earn XP.
                </p>
            </motion.div>

            <div className="space-y-4">
                {challenges.map((challenge, i) => {
                    const isJoined = challenge.joined;

                    return (
                        <motion.div
                            key={challenge.id}
                            className={`relative rounded-2xl overflow-hidden transition-all ${isJoined
                                    ? "optiz-surface border-[var(--optiz-border-active)] shadow-[0_0_20px_rgba(232,0,0,0.08)]"
                                    : "optiz-surface"
                                }`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.1 }}
                            whileHover={{ scale: 1.005 }}
                        >
                            {/* Challenge header gradient bar */}
                            <div className="h-1.5 optiz-gradient-bg" />

                            <div className="p-4 sm:p-5">
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center text-2xl">
                                            {challenge.emoji}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-12">
                                                {challenge.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${challenge.difficulty === "Hard"
                                                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                                        : challenge.difficulty === "Extreme"
                                                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                                            : challenge.difficulty === "Medium"
                                                                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                                                : "bg-green-500/15 text-green-400 border border-green-500/20"
                                                    }`}>
                                                    {challenge.difficulty}
                                                </span>
                                                <span className="text-[11px] text-gray-8">
                                                    {challenge.participantCount.toLocaleString()} participants
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {isJoined && (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E80000]/15 text-[#FF2D2D] border border-[#E80000]/20 uppercase tracking-wider">
                                            Joined
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-9 mb-4 leading-relaxed">
                                    {challenge.description}
                                </p>

                                {/* Stats row */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-8">
                                        <span className="text-base">📋</span>
                                        <span className="font-medium">{challenge.tasks.length} tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-8">
                                        <span className="text-base">⚡</span>
                                        <span className="font-medium">{challenge.totalXp} XP total</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                {isJoined ? (
                                    <button
                                        onClick={() => onGoToProgram(challenge.id)}
                                        className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-3 border border-gray-5 text-gray-12 hover:bg-gray-4 hover:border-gray-6 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        Open Program
                                        <span className="text-sm">→</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onOpenChallenge(challenge)}
                                        className="w-full py-3 rounded-xl font-semibold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(232,0,0,0.15)] flex items-center justify-center gap-2"
                                    >
                                        View Challenge
                                        <span className="text-sm">→</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Coming soon hint */}
            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="optiz-surface rounded-2xl p-5 border-dashed border-gray-5">
                    <p className="text-sm text-gray-8 font-medium">More challenges coming soon...</p>
                    <p className="text-xs text-gray-7 mt-1">Stay tuned for new programs and competitions.</p>
                </div>
            </motion.div>
        </div>
    );
}
