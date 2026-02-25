"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakEarnedAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export function StreakEarnedAnimation({ isVisible, onComplete }: StreakEarnedAnimationProps) {
    const { t } = useI18n();

    // Reliable timer-based dismiss — not dependent on Framer Motion lifecycle
    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(onComplete, 2800);
        return () => clearTimeout(timer);
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Radial glow backdrop */}
                    <motion.div
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 60%)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.5, times: [0, 0.2, 0.7, 1] }}
                    />

                    {/* Center card */}
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: [0.3, 1.1, 1], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.5, times: [0, 0.25, 0.65, 1], ease: "easeOut" }}
                    >
                        {/* Fire burst */}
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            style={{ filter: "drop-shadow(0 0 30px rgba(255,107,0,0.6))" }}
                        >
                            <AnimatedFireIcon size={56} />
                        </motion.div>

                        {/* Ring burst particles */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{ background: i % 2 === 0 ? "#FF6B00" : "#FFD700" }}
                                initial={{
                                    x: 0, y: 0, opacity: 1, scale: 0,
                                }}
                                animate={{
                                    x: Math.cos((i / 8) * Math.PI * 2) * 70,
                                    y: Math.sin((i / 8) * Math.PI * 2) * 70,
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                }}
                                transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
                            />
                        ))}

                        {/* Text */}
                        <motion.p
                            className="text-sm font-bold text-orange-400 whitespace-nowrap"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
                            transition={{ duration: 2.5, times: [0, 0.3, 0.7, 1] }}
                            style={{ textShadow: "0 0 20px rgba(255,107,0,0.4)" }}
                        >
                            {t("streakEarned")}
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
