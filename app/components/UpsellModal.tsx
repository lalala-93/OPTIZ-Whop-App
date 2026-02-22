"use client";

import { motion, AnimatePresence } from "framer-motion";

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export function UpsellModal({ isOpen, onClose, onUpgrade }: UpsellModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-black border border-[--color-optiz-border] rounded-[2rem] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Animated Gradient Header */}
                    <div className="h-32 w-full bg-gradient-to-br from-[--color-optiz-red] to-[--color-optiz-orange] relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl filter drop-shadow-lg">🚀</span>
                        </div>
                    </div>

                    <div className="p-8 text-center relative pointer-events-none">
                        {/* The gradient border effect */}
                        <div className="absolute inset-0 border-2 border-transparent rounded-[2rem] optiz-animated-border opacity-50 pointer-events-none" />

                        <div className="pointer-events-auto">
                            <h2 className="text-3xl font-black text-white italic tracking-wide uppercase mb-2">
                                LevelUp Pro
                            </h2>
                            <p className="text-[--color-optiz-muted] mb-8 font-medium">
                                Unleash your full potential. Track everything, conquer every goal.
                            </p>

                            <div className="space-y-4 mb-8 text-left">
                                <div className="flex items-center gap-4 bg-[--color-optiz-card] p-4 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-[--color-optiz-red]/20 flex items-center justify-center text-xl">♾️</div>
                                    <div>
                                        <h4 className="text-white font-bold">Unlimited Avatars</h4>
                                        <p className="text-xs text-[--color-optiz-muted]">Track more than 2 sports at once</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-[--color-optiz-card] p-4 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-[--color-optiz-orange]/20 flex items-center justify-center text-xl">📊</div>
                                    <div>
                                        <h4 className="text-white font-bold">Advanced Analytics</h4>
                                        <p className="text-xs text-[--color-optiz-muted]">Deep dive into your performance</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-[--color-optiz-card] p-4 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-xl">👑</div>
                                    <div>
                                        <h4 className="text-white font-bold">Pro Badge</h4>
                                        <p className="text-xs text-[--color-optiz-muted]">Stand out on the leaderboard</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onUpgrade}
                                className="w-full py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-[--color-optiz-red] to-[--color-optiz-orange] hover:shadow-[0_0_20px_rgba(240,80,48,0.4)] transition-all transform active:scale-[0.98]"
                            >
                                Unlock Pro - $9.99/mo
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-6 text-sm font-medium text-[--color-optiz-muted] hover:text-white transition-colors"
                            >
                                No thanks, I'll stay limited
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
