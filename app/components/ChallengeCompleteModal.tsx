"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ChallengeCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    challengeTitle: string;
    challengeEmoji: string;
    totalXpEarned: number;
    tasksCompleted: number;
}

export function ChallengeCompleteModal({
    isOpen,
    onClose,
    challengeTitle,
    challengeEmoji,
    totalXpEarned,
    tasksCompleted,
}: ChallengeCompleteModalProps) {

    const handleShare = async () => {
        const text = `✅ J'ai terminé le programme "${challengeTitle}" sur OPTIZ !\n🔥 ${tasksCompleted} séances terminées · ⚡ ${totalXpEarned} XP gagnés\n\n#OPTIZ #FitnessChallenge`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `OPTIZ : ${challengeTitle} terminé !`,
                    text,
                });
            } catch {
                // User cancelled or share failed
                await navigator.clipboard?.writeText(text);
            }
        } else {
            await navigator.clipboard?.writeText(text);
        }
    };

    const handleDownload = () => {
        // Simple text copy as fallback
        const text = `✅ ${challengeTitle} terminé !\n⚡ ${totalXpEarned} XP · ${tasksCompleted} séances`;
        navigator.clipboard?.writeText(text);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
                        className="relative w-[85%] max-w-sm bg-gray-2 border border-gray-4 rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top gradient accent */}
                        <div className="h-1.5 w-full optiz-gradient-bg" />

                        <div className="p-6 text-center">
                            {/* Trophy */}
                            <motion.div
                                className="w-14 h-14 rounded-full bg-[#E80000] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(232,0,0,0.3)]"
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="text-xl font-black text-gray-12 mb-1"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                Programme terminé !
                            </motion.h2>

                            <motion.p
                                className="text-sm text-gray-9 mb-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.45 }}
                            >
                                Tu as terminé <span className="font-bold text-gray-12">{challengeTitle}</span>
                            </motion.p>

                            {/* Stats card */}
                            <motion.div
                                className="bg-gray-3/40 rounded-2xl p-4 mb-5 border border-gray-5/30"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-gray-12">{tasksCompleted}</p>
                                        <p className="text-[9px] text-gray-7 font-medium uppercase tracking-wider mt-0.5">Séances</p>
                                    </div>
                                    <div className="w-px h-10 bg-gray-5/30" />
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-[#E80000]">+{totalXpEarned}</p>
                                        <p className="text-[9px] text-gray-7 font-medium uppercase tracking-wider mt-0.5">XP gagnés</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Challenge illustration */}
                            <motion.div
                                className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-5 border border-gray-5/30"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.55 }}
                            >
                                <Image
                                    src="/Challenge1.jpeg"
                                    alt={challengeTitle}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>

                            {/* Actions */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <button
                                    onClick={handleShare}
                                    className="w-full py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Partager
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-3 border border-gray-5/40 text-gray-12 hover:bg-gray-4 transition-all active:scale-[0.98]"
                                >
                                    Fermer
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
