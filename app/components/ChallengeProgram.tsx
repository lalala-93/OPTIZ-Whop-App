"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { ChallengeTask, Exercise } from "./rankSystem";
import { useI18n } from "./i18n";

interface ChallengeProgramProps {
    challengeTitle: string;
    challengeEmoji: string;
    tasks: ChallengeTask[];
    onCompleteTask: (taskId: string) => void;
    onBack: () => void;
    completingTaskId: string | null;
}

/** Hevy-inspired exercise detail sheet */
function ExerciseDetailSheet({
    task,
    isOpen,
    onClose,
    onComplete,
    isCompleting,
}: {
    task: ChallengeTask;
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    isCompleting: boolean;
}) {
    if (!isOpen) return null;

    const exercises = task.exercises || [];
    const accentColor = task.color || "#E80000";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pt-4 pb-3 border-b border-gray-4/40 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ background: `${accentColor}15`, border: `1.5px solid ${accentColor}30` }}
                                    >
                                        {task.emoji}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-12 leading-tight">{task.name.replace(/^[🟥🟦🟩🟪]\s*/, "")}</h2>
                                        <p className="text-[10px] text-gray-8 mt-0.5">{exercises.length} exercices · +{task.xpReward} XP</p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:text-gray-12 transition-all"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Exercise List */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <div className="space-y-3">
                                {exercises.map((exercise, i) => (
                                    <ExerciseCard key={i} exercise={exercise} index={i} accentColor={accentColor} />
                                ))}
                            </div>
                        </div>

                        {/* Footer: Complete Button */}
                        <div className="px-5 py-4 border-t border-gray-4/40 shrink-0">
                            {task.completed ? (
                                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-3/50 border border-gray-5/30">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="text-sm font-bold text-green-400">Séance complétée !</span>
                                </div>
                            ) : (
                                <motion.button
                                    onClick={onComplete}
                                    disabled={isCompleting}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                                    style={{ background: accentColor }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isCompleting ? (
                                        <motion.div
                                            className="w-5 h-5 mx-auto rounded-full border-2 border-white/50 border-t-white"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                        />
                                    ) : (
                                        `Marquer comme fait · +${task.xpReward} XP`
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/** Single exercise card — Hevy-inspired minimal design */
function ExerciseCard({ exercise, index, accentColor }: { exercise: Exercise; index: number; accentColor: string }) {
    return (
        <motion.div
            className="bg-gray-3/30 border border-gray-5/30 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.04 }}
        >
            <div className="p-3.5">
                {/* Exercise name + sets */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-gray-12 leading-snug">{exercise.name}</h4>
                        <p className="text-[10px] text-gray-7 mt-0.5">{exercise.muscles}</p>
                    </div>
                    <div
                        className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                        style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}20` }}
                    >
                        {exercise.sets}
                    </div>
                </div>

                {/* YouTube Link */}
                <a
                    href={exercise.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] font-medium text-gray-9 hover:text-gray-12 transition-colors group"
                >
                    <div className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </div>
                    <span className="group-hover:underline">Voir la démo</span>
                </a>
            </div>
        </motion.div>
    );
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
    const [selectedTask, setSelectedTask] = useState<ChallengeTask | null>(null);

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

            {/* Header with Challenge Image */}
            <motion.div
                className="rounded-2xl overflow-hidden mb-5 border border-gray-5/30"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative h-36 w-full">
                    <Image src="/Challenge1.jpeg" alt={challengeTitle} fill className="object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--gray-2)] via-[var(--gray-2)]/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-lg font-bold text-white">{challengeTitle}</h2>
                        <p className="text-[10px] text-white/60 font-medium">Programme Haltères / Dips / Tractions · 4 séances</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-3/30">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-8">{t("progress")}</span>
                        <span className="text-gray-11 font-bold tabular-nums">{completed}/{total} séances</span>
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

            {/* Session Cards — Hevy-inspired */}
            <h3 className="text-[10px] font-bold text-gray-7 mb-3 uppercase tracking-widest">Séances</h3>

            <motion.div
                className="space-y-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                {tasks.map((task, i) => {
                    const isCompleting = completingTaskId === task.id;
                    const exercises = task.exercises || [];
                    const accentColor = task.color || "#E80000";

                    return (
                        <motion.div
                            key={task.id}
                            className={`rounded-2xl overflow-hidden transition-all cursor-pointer ${task.completed
                                ? "opacity-50"
                                : "hover:scale-[1.01]"
                                }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            onClick={() => setSelectedTask(task)}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="bg-gray-3/30 border border-gray-5/30 rounded-2xl overflow-hidden">
                                {/* Accent Bar + Header */}
                                <div className="flex items-stretch">
                                    <div className="w-1.5 shrink-0" style={{ background: accentColor }} />
                                    <div className="flex-1 p-3.5">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2.5">
                                                {task.completed ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                        style={{ background: `${accentColor}15`, border: `1.5px solid ${accentColor}30` }}
                                                    >
                                                        {task.emoji}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-[13px] font-bold text-gray-12 leading-tight">
                                                        {task.name.replace(/^[🟥🟦🟩🟪]\s*/, "")}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-7 mt-0.5">
                                                        {exercises.length} exercices
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                                    style={{
                                                        background: task.completed ? "var(--gray-3)" : `${accentColor}10`,
                                                        color: task.completed ? "var(--gray-6)" : accentColor,
                                                        border: `1px solid ${task.completed ? "var(--gray-4)" : `${accentColor}20`}`,
                                                    }}
                                                >
                                                    +{task.xpReward} XP
                                                </span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-6">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Exercise preview — show first 3 */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {exercises.slice(0, 3).map((ex, j) => (
                                                <span key={j} className="text-[9px] text-gray-8 bg-gray-4/40 px-2 py-0.5 rounded-md font-medium">
                                                    {ex.name.split("(")[0].trim()}
                                                </span>
                                            ))}
                                            {exercises.length > 3 && (
                                                <span className="text-[9px] text-gray-6 bg-gray-4/30 px-2 py-0.5 rounded-md font-medium">
                                                    +{exercises.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
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

            {/* Exercise Detail Sheet */}
            {selectedTask && (
                <ExerciseDetailSheet
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onComplete={() => {
                        onCompleteTask(selectedTask.id);
                        setSelectedTask(null);
                    }}
                    isCompleting={completingTaskId === selectedTask.id}
                />
            )}
        </div>
    );
}
