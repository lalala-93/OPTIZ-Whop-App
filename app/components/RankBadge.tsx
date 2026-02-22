"use client";

import { motion } from "framer-motion";

interface RankBadgeProps {
    colors: [string, string];
    glowColor: string;
    size?: number;
    className?: string;
}

export function RankBadge({ colors, glowColor, size = 80, className = "" }: RankBadgeProps) {
    const id = `badge-${colors[0].replace("#", "")}`;

    return (
        <motion.div
            className={`relative ${className}`}
            style={{ width: size, height: size, "--tier-glow": glowColor } as React.CSSProperties}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
            <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-lg animate-glow-pulse">
                <defs>
                    <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colors[0]} />
                        <stop offset="100%" stopColor={colors[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                    </linearGradient>
                    <filter id={`${id}-glow`}>
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Outer shield */}
                <path
                    d="M50 4 L92 22 L86 82 L50 104 L14 82 L8 22 Z"
                    fill={`url(#${id}-grad)`}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                    filter={`url(#${id}-glow)`}
                />

                {/* Inner border */}
                <path
                    d="M50 12 L85 27 L80 78 L50 96 L20 78 L15 27 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                />

                {/* Shine overlay */}
                <path
                    d="M50 4 L92 22 L86 82 L50 104 L14 82 L8 22 Z"
                    fill={`url(#${id}-shine)`}
                    opacity="0.5"
                />

                {/* Center dark circle */}
                <circle cx="50" cy="52" r="18" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

                {/* Star emblem */}
                <path
                    d="M50 38 L53.1 47.5 L63 47.5 L55 53.5 L58 63 L50 57.5 L42 63 L45 53.5 L37 47.5 L46.9 47.5 Z"
                    fill="rgba(255,255,255,0.85)"
                />

                {/* Top crown accent */}
                <path
                    d="M40 8 L44 2 L50 6 L56 2 L60 8"
                    fill="none"
                    stroke={colors[1]}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.6"
                />
            </svg>
        </motion.div>
    );
}
