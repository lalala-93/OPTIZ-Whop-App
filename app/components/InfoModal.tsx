"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
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
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
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
                            {/* Logo — bigger, no mask */}
                            <div className="flex flex-col items-center mb-6">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                                >
                                    <Image
                                        src="/Logo-optiz.png"
                                        alt="OPTIZ"
                                        width={80}
                                        height={80}
                                        className="object-contain"
                                        style={{ borderRadius: 0 }}
                                    />
                                </motion.div>
                                <h2 className="text-xl font-black text-gray-12 mt-4 tracking-tight">What is OPTIZ?</h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <p className="text-sm text-gray-11 leading-relaxed text-center">
                                    OPTIZ is a <span className="font-semibold text-gray-12">gamified fitness platform</span> that transforms your daily workouts into an epic progression journey.
                                </p>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { emoji: "⚡", title: "Earn XP", desc: "Complete tasks to gain experience" },
                                        { emoji: "🏆", title: "Rank Up", desc: "Iron to Legend — 10 tiers" },
                                        { emoji: "🔥", title: "Build Streaks", desc: "Stay consistent every day" },
                                        { emoji: "📊", title: "Compete", desc: "Climb the leaderboard" },
                                    ].map((item) => (
                                        <div key={item.title} className="bg-gray-3 rounded-xl p-3 border border-gray-5/60 text-center">
                                            <span className="text-lg block mb-1">{item.emoji}</span>
                                            <p className="text-[11px] font-bold text-gray-12 mb-0.5">{item.title}</p>
                                            <p className="text-[10px] text-gray-8 leading-tight">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-7 text-center italic">
                                    &ldquo;1% better every day.&rdquo; — OPTIZ
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98]"
                            >
                                Let&apos;s Go!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
