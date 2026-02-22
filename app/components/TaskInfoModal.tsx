"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TASK_DESCRIPTIONS } from "./rankSystem";
import type { ChallengeTask } from "./rankSystem";

interface TaskInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: ChallengeTask | null;
}

export function TaskInfoModal({ isOpen, onClose, task }: TaskInfoModalProps) {
    if (!task) return null;

    const desc = TASK_DESCRIPTIONS[task.id];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all z-10"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="p-6 pt-8">
                            {/* Task header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center text-3xl">
                                    {task.emoji}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-12">{task.name}</h2>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xs font-bold text-[#E80000]">+{task.xpReward} XP</span>
                                        <span className="text-[10px] text-gray-7">reward</span>
                                    </div>
                                </div>
                            </div>

                            {desc ? (
                                <div className="space-y-4 mb-6">
                                    {/* Why this task */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-10 uppercase tracking-wider mb-2">💪 Why This Task?</h3>
                                        <p className="text-sm text-gray-11 leading-relaxed">{desc.benefit}</p>
                                    </div>

                                    {/* Tips */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-10 uppercase tracking-wider mb-2">💡 Tips</h3>
                                        <p className="text-sm text-gray-11 leading-relaxed">{desc.tips}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-9 mb-6 leading-relaxed">
                                    Complete this task to earn XP and progress toward your goals.
                                </p>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-gray-4 border border-gray-5 text-gray-12 hover:bg-gray-5 transition-all active:scale-[0.98]"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
