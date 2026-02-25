"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { RankBadge } from "./RankBadge";
import { getRankForLevel } from "./rankSystem";

interface LevelUpAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
    newLevel: number;
}

const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: -150 + Math.random() * 300,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    size: 4 + Math.random() * 6,
    color: ["#E80000", "#FF2D2D", "#FFD700", "#FF6D00", "#FFFFFF"][Math.floor(Math.random() * 5)],
    rotation: Math.random() * 720,
}));

export function LevelUpAnimation({
    isVisible,
    onComplete,
    newLevel,
}: LevelUpAnimationProps) {
    const rankData = getRankForLevel(newLevel);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onComplete, 1800); // Faster auto-dismiss
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
                    className="fixed inset-0 z-[110] flex items-center justify-center cursor-pointer"
                    onClick={onComplete}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Confetti */}
                    {CONFETTI.map((c) => (
                        <motion.div
                            key={c.id}
                            className="absolute rounded-sm"
                            style={{
                                width: c.size,
                                height: c.size,
                                background: c.color,
                                left: "50%",
                                top: "40%",
                            }}
                            initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: [0, -80, 200],
                                x: c.x,
                                rotate: c.rotation,
                                scale: [0, 1, 0.8],
                            }}
                            transition={{
                                duration: c.duration,
                                delay: 0.3 + c.delay,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Glow ring */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 160,
                                height: 160,
                                boxShadow: `0 0 60px ${rankData.tier.glowColor}, 0 0 120px ${rankData.tier.glowColor}`,
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.6, 0.3] }}
                            transition={{ duration: 1, delay: 0.2 }}
                        />

                        {/* Rank badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{
                                scale: [0, 1.2, 1],
                                rotate: [-30, 10, 0],
                            }}
                            transition={{
                                duration: 0.7,
                                delay: 0.2,
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                            }}
                        >
                            <RankBadge
                                colors={rankData.tier.gradient}
                                glowColor={rankData.tier.glowColor}
                                size={100}
                                tierName={rankData.tier.name}
                            />
                        </motion.div>

                        {/* Level up text */}
                        <motion.div
                            className="text-center mt-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.p
                                className="text-xs font-bold uppercase tracking-[0.2em] text-gray-9 mb-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                Level Up!
                            </motion.p>

                            <motion.h2
                                className="text-5xl font-black text-gray-12"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                            >
                                <span style={{ color: rankData.tier.colorLight }}>{newLevel}</span>
                            </motion.h2>

                            <motion.p
                                className="text-sm font-bold mt-1"
                                style={{ color: rankData.tier.color }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                            >
                                {rankData.fullName}
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
