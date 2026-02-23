"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Challenge } from "./rankSystem";
import { useI18n } from "./i18n";

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
    const { t } = useI18n();

    return (
        <div className="pb-8">
            {/* Header — natural fade in */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <h2 className="text-xl font-bold text-gray-12 mb-1">{t("challengesTitle")}</h2>
                <p className="text-sm text-gray-8 mb-5">{t("challengesSub")}</p>
            </motion.div>

            <div className="space-y-3">
                {challenges.map((challenge, i) => {
                    const isJoined = challenge.joined;
                    const completedTasks = challenge.tasks.filter(t => t.completed).length;

                    return (
                        <motion.div
                            key={challenge.id}
                            className={`rounded-2xl overflow-hidden transition-all ${isJoined
                                    ? "bg-gray-3/40 border border-gray-5/60"
                                    : "bg-gray-3/25 border border-gray-5/35 hover:border-gray-5/60"
                                }`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                            whileTap={{ scale: 0.985 }}
                        >
                            {/* Hero image with Illustration1 */}
                            <div className="w-full aspect-[2.4/1] overflow-hidden relative">
                                <Image
                                    src="/Illustration1.png"
                                    alt={challenge.title}
                                    fill
                                    className="object-cover object-top"
                                    sizes="(max-width: 768px) 100vw, 500px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-1/90 via-gray-1/20 to-transparent" />

                                {/* Member count */}
                                <motion.div
                                    className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.06 }}
                                >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-10">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span className="text-[10px] font-bold text-white tabular-nums">
                                        {challenge.participantCount.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] text-gray-10 font-medium">{t("members")}</span>
                                </motion.div>

                                {/* Difficulty badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border ${challenge.difficulty === "Hard"
                                            ? "bg-orange-500/20 text-orange-300 border-orange-500/20"
                                            : challenge.difficulty === "Extreme"
                                                ? "bg-red-500/20 text-red-300 border-red-500/20"
                                                : challenge.difficulty === "Medium"
                                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/20"
                                                    : "bg-green-500/20 text-green-300 border-green-500/20"
                                        }`}>
                                        {challenge.difficulty}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-3.5 pt-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[14px] font-bold text-gray-12 truncate">{challenge.title}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-7 font-medium">
                                            <span className="flex items-center gap-0.5">
                                                <span className="text-[#E80000] font-bold">{challenge.totalXp}</span>
                                                <span className="text-[#E80000] text-[8px] font-extrabold">{t("xpLabel")}</span>
                                            </span>
                                            <span>·</span>
                                            <span>{challenge.tasks.length} {t("tasks")}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-3">
                                        {isJoined ? (
                                            <motion.button
                                                onClick={() => onGoToProgram(challenge.id)}
                                                className="px-3.5 py-2 rounded-xl font-semibold text-[11px] bg-gray-4/60 border border-gray-5/40 text-gray-12 hover:bg-gray-4 transition-all"
                                                whileTap={{ scale: 0.92 }}
                                            >
                                                {t("open")}
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={() => onOpenChallenge(challenge)}
                                                className="px-3.5 py-2 rounded-xl font-bold text-[11px] optiz-gradient-bg text-white transition-all"
                                                whileTap={{ scale: 0.92 }}
                                                whileHover={{ scale: 1.03 }}
                                            >
                                                {t("join")}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>

                                {isJoined && (
                                    <div className="mt-2.5">
                                        <div className="h-1 w-full bg-gray-4/60 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full optiz-gradient-bg"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(completedTasks / challenge.tasks.length) * 100}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-6 mt-1 tabular-nums">
                                            {completedTasks}/{challenge.tasks.length} {t("done")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="rounded-2xl p-5 border border-dashed border-gray-5/30 bg-gray-3/15">
                    <p className="text-sm text-gray-7 font-medium">{t("moreComingSoon")}</p>
                </div>
            </motion.div>
        </div>
    );
}
