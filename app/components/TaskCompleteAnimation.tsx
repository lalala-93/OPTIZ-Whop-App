"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useI18n } from "./i18n";

interface TaskCompleteAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
    xpEarned: number;
}

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * 360,
    delay: i * 0.04,
    distance: 50 + Math.random() * 30,
    size: 3 + Math.random() * 3,
}));

export function TaskCompleteAnimation({
    isVisible,
    onComplete,
    xpEarned,
}: TaskCompleteAnimationProps) {
    const { t } = useI18n();

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                >
                    {/* Backdrop — no blur for perf */}
                    <motion.div
                        className="absolute inset-0 bg-black/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Expanding ring */}
                        <motion.div
                            className="absolute w-16 h-16 rounded-full border-2 border-[#E80000]"
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />

                        {/* Particles */}
                        {PARTICLES.map((p) => {
                            const rad = (p.angle * Math.PI) / 180;
                            return (
                                <motion.div
                                    key={p.id}
                                    className="absolute rounded-full"
                                    style={{
                                        width: p.size,
                                        height: p.size,
                                        background: p.id % 3 === 0 ? "#E80000" : p.id % 3 === 1 ? "#FF2D2D" : "#FFD700",
                                    }}
                                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        x: Math.cos(rad) * p.distance,
                                        y: Math.sin(rad) * p.distance,
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 0.7,
                                        delay: 0.15 + p.delay,
                                        ease: "easeOut",
                                    }}
                                />
                            );
                        })}

                        {/* Checkmark circle */}
                        <motion.div
                            className="w-20 h-20 rounded-full bg-[#E80000] flex items-center justify-center"
                            initial={{ scale: 0.2, opacity: 0 }}
                            animate={{
                                scale: [0.2, 1.15, 1],
                                opacity: 1,
                            }}
                            transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                            }}
                        >
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <motion.polyline
                                    points="20 6 9 17 4 12"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
                                />
                            </svg>
                        </motion.div>

                        {/* Text */}
                        <motion.div
                            className="mt-5 text-center"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <h2 className="text-xl font-black text-gray-12 tracking-wide uppercase">
                                {t("sessionCompleteTitle")}
                            </h2>
                            <motion.p
                                className="text-2xl font-black mt-1.5 tabular-nums"
                                style={{ color: "#E80000" }}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 350 }}
                            >
                                +{xpEarned} XP
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
