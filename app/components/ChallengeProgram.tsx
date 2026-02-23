"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { TaskInfoModal } from "./TaskInfoModal";
import type { ChallengeTask } from "./rankSystem";
import { useI18n } from "./i18n";

interface ChallengeProgramProps {
    challengeTitle: string;
    challengeEmoji: string;
    tasks: ChallengeTask[];
    onCompleteTask: (taskId: string) => void;
    onBack: () => void;
    completingTaskId: string | null;
}

export function ChallengeProgram({
    challengeTitle, challengeEmoji, tasks, onCompleteTask, onBack, completingTaskId,
}: ChallengeProgramProps) {
    const { t } = useI18n();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const progressPercent = total > 0 ? (completed / total) * 100 : 0;
    const totalXpEarned = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xpReward, 0);
    const totalXpPossible = tasks.reduce((sum, t) => sum + t.xpReward, 0);
    const [taskInfoData, setTaskInfoData] = useState<ChallengeTask | null>(null);

    return (
        <div className="pb-8">
            <motion.button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-4"
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                {t("back")}
            </motion.button>

            {/* Header with Illustration1 */}
            <motion.div
                className="rounded-2xl overflow-hidden mb-5 border border-gray-5/30"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative h-36 w-full">
                    <Image src="/Challenge1.jpeg" alt={challengeTitle} fill className="object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--gray-2)] via-[var(--gray-2)]/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-lg font-bold text-white">{challengeTitle}</h2>
                        <p className="text-[10px] text-white/60 font-medium">{t("dailyProgram")}</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-3/30">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-8">{t("progress")}</span>
                        <span className="text-gray-11 font-bold tabular-nums">{completed}/{total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-4/50 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full optiz-gradient-bg"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-8">
                        <span>⚡</span>
                        <span className="font-bold text-gray-11 tabular-nums">{totalXpEarned}</span>
                        <span>/ {totalXpPossible} {t("xpLabel")}</span>
                    </div>
                </div>
            </motion.div>

            {/* Tasks */}
            <h3 className="text-[10px] font-bold text-gray-7 mb-3 uppercase tracking-widest">{t("todaysTasks")}</h3>

            <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                {tasks.map((task, i) => {
                    const isCompleting = completingTaskId === task.id;

                    return (
                        <motion.div
                            key={task.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${task.completed
                                ? "bg-gray-2/60 opacity-50"
                                : "bg-gray-3/25 border border-gray-5/35"
                                }`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.04 }}
                            layout
                        >
                            {task.completed ? (
                                <motion.div
                                    className="w-5.5 h-5.5 rounded-full bg-[#E80000] flex items-center justify-center shrink-0"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => !isCompleting && onCompleteTask(task.id)}
                                    disabled={isCompleting}
                                    className="w-5.5 h-5.5 rounded-full border-[1.5px] border-gray-6 hover:border-gray-8 transition-colors shrink-0 flex items-center justify-center"
                                >
                                    {isCompleting && (
                                        <motion.div
                                            className="w-2.5 h-2.5 rounded-full bg-[#E80000]"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        />
                                    )}
                                </button>
                            )}

                            <span className={`flex-1 text-sm font-medium ${task.completed ? "line-through text-gray-7" : "text-gray-12"
                                }`}>
                                {task.name}
                            </span>

                            <button
                                onClick={() => setTaskInfoData(task)}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-6 hover:text-gray-10 transition-all shrink-0"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-sm">{task.emoji}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${task.completed
                                    ? "bg-gray-3 text-gray-6"
                                    : "bg-[#E80000]/8 text-[#FF2D2D] border border-[#E80000]/10"
                                    }`}>
                                    +{task.xpReward}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {completed === total && total > 0 && (
                <motion.div
                    className="mt-6 text-center py-5 rounded-2xl bg-gray-3/20 border border-gray-5/30"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="text-3xl block mb-2">🎉</span>
                    <h3 className="text-sm font-bold text-gray-12">{t("allDone")}</h3>
                    <p className="text-[11px] text-gray-8 mt-1">
                        {t("xpEarned", { n: totalXpEarned })}
                    </p>
                </motion.div>
            )}

            <TaskInfoModal isOpen={!!taskInfoData} onClose={() => setTaskInfoData(null)} task={taskInfoData} />
        </div>
    );
}
