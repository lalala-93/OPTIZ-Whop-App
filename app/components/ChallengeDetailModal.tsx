"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { formatNumber, type Challenge } from "./rankSystem";
import { useI18n } from "./i18n";

interface ChallengeDetailModalProps {
    challenge: Challenge | null;
    isOpen: boolean;
    onClose: () => void;
    onJoin: (challengeId: string) => void;
    onGoToProgram?: (challengeId: string) => void;
}

export function ChallengeDetailModal({ challenge, isOpen, onClose, onJoin, onGoToProgram }: ChallengeDetailModalProps) {
    const { t } = useI18n();
    if (!challenge) return null;

    const handleJoin = () => {
        onJoin(challenge.id);
        onClose();
        // Redirect to program after joining
        if (onGoToProgram) {
            setTimeout(() => onGoToProgram(challenge.id), 150);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        {/* Illustration — taller for full visibility */}
                        <div className="relative w-full aspect-[4/3] overflow-hidden">
                            <Image
                                src="/Challenge1.jpeg"
                                alt={challenge.title}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 768px) 100vw, 500px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--gray-2)] via-transparent to-transparent" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 -mt-8 relative">
                            <h2 className="text-xl font-bold text-gray-12 mb-1">{challenge.title}</h2>
                            <p className="text-sm text-gray-9 mb-4 leading-relaxed">{challenge.description}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {[
                                    { icon: "👥", label: t("members"), value: formatNumber(challenge.participantCount) },
                                    { icon: "⚡", label: t("xpLabel"), value: String(challenge.totalXp) },
                                    { icon: "📋", label: t("tasks"), value: String(challenge.tasks.length) },
                                ].map((s) => (
                                    <div key={s.label} className="bg-gray-3/40 rounded-xl p-3 text-center border border-gray-5/30">
                                        <p className="text-xs mb-0.5">{s.icon}</p>
                                        <p className="text-sm font-bold text-gray-12">{s.value}</p>
                                        <p className="text-[9px] text-gray-7 font-medium">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Difficulty */}
                            <div className="flex items-center gap-2 mb-5">
                                <span className="text-[10px] font-bold text-gray-8 uppercase tracking-wider">{t("difficulty")}</span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${challenge.difficulty === "Hard"
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

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-3 border border-gray-5 text-gray-12 hover:bg-gray-4 transition-all active:scale-[0.98]"
                                >
                                    {t("closeCta")}
                                </button>
                                <button
                                    onClick={handleJoin}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98]"
                                >
                                    {t("joinChallenge")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
