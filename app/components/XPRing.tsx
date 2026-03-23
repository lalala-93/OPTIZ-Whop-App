"use client";

import { RankBadge } from "./RankBadge";
import type { RankTier } from "./rankSystem";

interface XPRingProps {
    progressPercent: number;
    currentXp: number;
    xpForNextLevel: number;
    totalXp: number;
    tier: RankTier;
    rankColors: [string, string];
    size?: number;
    onClick?: () => void;
}

export function XPRing({
    progressPercent,
    totalXp,
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

    return (
        <div
            className={`relative flex items-center justify-center ${onClick ? "cursor-pointer" : ""}`}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={rankColors[0]} />
                        <stop offset="100%" stopColor={rankColors[1]} />
                    </linearGradient>
                </defs>

                {/* Background ring */}
                <circle cx="100" cy="100" r={radius} fill="none" stroke={tier.ringBg} strokeWidth={strokeWidth} />

                {/* Progress ring — CSS transition, no Framer Motion */}
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RankBadge
                    colors={rankColors}
                    glowColor={tier.glowColor}
                    tierName={tier.name}
                    size={size * 0.4}
                />
                <p
                    className="text-[11px] font-semibold tabular-nums mt-0.5"
                    style={{ color: rankColors[1] }}
                >
                    {totalXp}
                    <span className="ml-0.5 text-[9px] opacity-60">XP</span>
                </p>
            </div>
        </div>
    );
}
