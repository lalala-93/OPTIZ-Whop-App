"use client";

import { motion } from "framer-motion";
import { RankBadge } from "./RankBadge";
import type { RankTier } from "./rankSystem";

interface XPRingProps {
    progressPercent: number;
    currentXp: number;
    xpForNextLevel: number;
    tier: RankTier;
    rankColors: [string, string];
    size?: number;
}

export function XPRing({
    progressPercent,
    currentXp,
    xpForNextLevel,
    tier,
    rankColors,
    size = 200,
}: XPRingProps) {
    const strokeWidth = 8;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    const gradientId = `xp-ring-${tier.name}`;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={rankColors[0]} />
                        <stop offset="100%" stopColor={rankColors[1]} />
                    </linearGradient>
                </defs>

                {/* Background ring */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={tier.ringBg}
                    strokeWidth={strokeWidth}
                />

                {/* Progress ring */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Glow dot at progress tip */}
                {progressPercent > 2 && (
                    <motion.circle
                        cx={100 + radius * Math.cos(((progressPercent / 100) * 2 * Math.PI) - Math.PI / 2)}
                        cy={100 + radius * Math.sin(((progressPercent / 100) * 2 * Math.PI) - Math.PI / 2)}
                        r="4"
                        fill={rankColors[1]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <RankBadge
                    colors={rankColors}
                    glowColor={tier.glowColor}
                    size={size * 0.42}
                />
                <motion.p
                    className="text-xs font-semibold tabular-nums mt-1"
                    style={{ color: rankColors[1] }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {currentXp.toLocaleString()}/{xpForNextLevel.toLocaleString()}
                    <span className="ml-0.5 text-[10px] opacity-70">XP</span>
                </motion.p>
            </div>
        </div>
    );
}
