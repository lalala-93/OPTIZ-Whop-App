"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface SuccessAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
    xpEarned: number;
}

export function SuccessAnimation({ isVisible, onComplete, xpEarned }: SuccessAnimationProps) {
    useEffect(() => {
        if (isVisible) {
            // In a real scenario we'd use a nice sound effect here.
            // const audio = new Audio('/success-chime.mp3');
            // audio.play().catch(e => console.log(e));

            const timer = setTimeout(() => {
                onComplete();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{
                            scale: [0.5, 1.2, 1],
                            opacity: 1,
                            y: 0
                        }}
                        exit={{ scale: 0.8, opacity: 0, y: -50 }}
                        transition={{
                            duration: 0.6,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                        }}
                        className="relative z-10 flex flex-col items-center"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-[--color-optiz-red] to-[--color-optiz-orange] rounded-full flex items-center justify-center text-6xl shadow-[0_0_80px_rgba(240,80,48,0.5)] border-4 border border-white/20">
                            🔥
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 text-center"
                        >
                            <h2 className="text-3xl font-black text-white italic tracking-wider uppercase">
                                Great Job!
                            </h2>
                            <p className="text-2xl font-bold optiz-gradient-text mt-2">
                                +{xpEarned} XP
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
