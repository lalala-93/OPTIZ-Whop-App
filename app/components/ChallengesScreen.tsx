"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 320, damping: 28 },
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <h2 className="text-xl font-bold text-gray-12 mb-1">Challenges</h2>
                <p className="text-sm text-gray-8 mb-5">
                    Join a challenge, crush tasks, earn XP.
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
                            className={`rounded-2xl overflow-hidden transition-all ${isJoined
                                    ? "bg-gray-3/40 border border-gray-5/60"
                                    : "bg-gray-3/25 border border-gray-5/35 hover:border-gray-5/60"
                                }`}
                            variants={itemVariants}
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ y: -1 }}
                        >
                            <div className="flex items-center gap-3.5 p-3.5">
                                {/* Challenge image — proper clipping */}
                                <motion.div
                                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-4"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <Image
                                        src="/Challenge1.jpeg"
                                        alt={challenge.title}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-[13px] font-bold text-gray-12 truncate">
                                            {challenge.title}
                                        </h3>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${challenge.difficulty === "Hard"
                                                ? "bg-orange-500/12 text-orange-400 border border-orange-500/15"
                                                : challenge.difficulty === "Extreme"
                                                    ? "bg-red-500/12 text-red-400 border border-red-500/15"
                                                    : challenge.difficulty === "Medium"
                                                        ? "bg-yellow-500/12 text-yellow-400 border border-yellow-500/15"
                                                        : "bg-green-500/12 text-green-400 border border-green-500/15"
                                            }`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-gray-7 font-medium">
                                        <span>{challenge.participantCount.toLocaleString()} joined</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-0.5">
                                            <span className="text-[#E80000] font-bold">{challenge.totalXp}</span>
                                            <span className="text-[#E80000] text-[8px] font-extrabold">XP</span>
                                        </span>
                                    </div>

                                    {isJoined && (
                                        <div className="mt-2">
                                            <div className="h-1 w-full bg-gray-4/60 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full optiz-gradient-bg"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(completedTasks / challenge.tasks.length) * 100}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-gray-6 mt-1 tabular-nums">
                                                {completedTasks}/{challenge.tasks.length} done
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    {isJoined ? (
                                        <motion.button
                                            onClick={() => onGoToProgram(challenge.id)}
                                            className="px-3.5 py-2 rounded-xl font-semibold text-[11px] bg-gray-4/60 border border-gray-5/40 text-gray-12 hover:bg-gray-4 transition-all"
                                            whileTap={{ scale: 0.92 }}
                                        >
                                            Open →
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            onClick={() => onOpenChallenge(challenge)}
                                            className="px-3.5 py-2 rounded-xl font-bold text-[11px] optiz-gradient-bg text-white transition-all"
                                            whileTap={{ scale: 0.92 }}
                                            whileHover={{ scale: 1.03 }}
                                        >
                                            Join →
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="rounded-2xl p-5 border border-dashed border-gray-5/30 bg-gray-3/15">
                    <p className="text-sm text-gray-7 font-medium">More challenges coming soon</p>
                </div>
            </motion.div>
        </div>
    );
}
