"use client";

import { motion } from "framer-motion";
import { RankBadge } from "./RankBadge";
import { useState, useCallback } from "react";
import type { RankTier } from "./rankSystem";

interface XPRingProps {
    progressPercent: number;
    currentXp: number;
    xpForNextLevel: number;
    tier: RankTier;
    rankColors: [string, string];
    size?: number;
    onClick?: () => void;
}

export function XPRing({
    progressPercent,
    currentXp,
    xpForNextLevel,
    tier,
    rankColors,
    size = 200,
    onClick,
}: XPRingProps) {
    const strokeWidth = 8;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    const gradientId = `xp-ring-${tier.name}-${size}`;

    // Cursor-following reflection — constrained within the ring
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        // Only update if within the circular boundary
        const dx = x - 0.5;
        const dy = y - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 0.5) {
            setMousePos({ x, y });
            setIsHovered(true);
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setMousePos({ x: 0.5, y: 0.5 });
        setIsHovered(false);
    }, []);

    return (
        <div
            className={`relative flex items-center justify-center ${onClick ? "cursor-pointer" : ""}`}
            style={{ width: size, height: size }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {/* Specular reflection — clipped to circle, stays within ring */}
            <div
                className="absolute rounded-full pointer-events-none z-10 transition-opacity duration-500"
                style={{
                    width: size - 4,
                    height: size - 4,
                    background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.06) 0%, transparent 35%)`,
                    opacity: isHovered ? 1 : 0,
                    overflow: "hidden",
                }}
            />

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
                {progressPercent > 3 && (
                    <circle
                        cx={100 + radius * Math.cos(((progressPercent / 100) * 2 * Math.PI) - Math.PI / 2)}
                        cy={100 + radius * Math.sin(((progressPercent / 100) * 2 * Math.PI) - Math.PI / 2)}
                        r="3.5"
                        fill={rankColors[1]}
                        opacity="0.8"
                    />
                )}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RankBadge
                    colors={rankColors}
                    glowColor={tier.glowColor}
                    tierName={tier.name}
                    size={size * 0.4}
                    mousePosition={mousePos}
                />
                <motion.p
                    className="text-[11px] font-semibold tabular-nums mt-0.5"
                    style={{ color: rankColors[1] }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {currentXp}/{xpForNextLevel}
                    <span className="ml-0.5 text-[9px] opacity-60">XP</span>
                </motion.p>
            </div>
        </div>
    );
}
