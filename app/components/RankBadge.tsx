"use client";

import { motion } from "framer-motion";

interface RankBadgeProps {
    colors: [string, string];
    glowColor: string;
    tierName?: string;
    size?: number;
    className?: string;
    mousePosition?: { x: number; y: number };
}

// Each tier has a completely different, increasingly imposing emblem
function getEmblemPath(tierName?: string): { inner: string; detail?: string; complexity: number } {
    switch (tierName?.toLowerCase()) {
        case "iron":
            // Simple circle dot
            return { inner: "M50 44 L54 52 L50 60 L46 52 Z", complexity: 1 };
        case "bronze":
            // Small star
            return { inner: "M50 40 L52.5 47 L60 47 L54 52 L56.5 59 L50 55 L43.5 59 L46 52 L40 47 L47.5 47 Z", complexity: 2 };
        case "silver":
            // Double layered star
            return {
                inner: "M50 37 L53 46 L62 46 L55 52 L58 61 L50 56 L42 61 L45 52 L38 46 L47 46 Z",
                detail: "M50 42 L51.5 47 L56.5 47 L52.5 50.5 L54 55.5 L50 52.5 L46 55.5 L47.5 50.5 L43.5 47 L48.5 47 Z",
                complexity: 3,
            };
        case "gold":
            // Crown + star
            return {
                inner: "M50 35 L54 45 L64 45 L56 52 L59 62 L50 56 L41 62 L44 52 L36 45 L46 45 Z",
                detail: "M38 30 L42 24 L50 28 L58 24 L62 30",
                complexity: 4,
            };
        case "platinum":
            // Winged star
            return {
                inner: "M50 34 L54 44 L65 44 L57 51 L60 62 L50 55 L40 62 L43 51 L35 44 L46 44 Z",
                detail: "M30 42 Q38 35 46 44 M54 44 Q62 35 70 42",
                complexity: 5,
            };
        case "diamond":
            // Diamond crystal
            return {
                inner: "M50 30 L62 48 L50 66 L38 48 Z",
                detail: "M50 30 L50 66 M38 48 L62 48 M44 39 L56 57 M56 39 L44 57",
                complexity: 6,
            };
        case "master":
            // Ornate shield with cross
            return {
                inner: "M50 32 L55 43 L66 43 L58 51 L61 63 L50 56 L39 63 L42 51 L34 43 L45 43 Z",
                detail: "M50 38 L50 58 M42 48 L58 48 M36 28 L42 22 L50 26 L58 22 L64 28",
                complexity: 7,
            };
        case "grandmaster":
            // Dragon-like multi-pointed star
            return {
                inner: "M50 28 L55 42 L68 38 L60 50 L68 62 L55 58 L50 72 L45 58 L32 62 L40 50 L32 38 L45 42 Z",
                complexity: 8,
            };
        case "champion":
            // Radiant sun with elaborate rays
            return {
                inner: "M50 30 L54 43 L67 40 L58 50 L67 60 L54 57 L50 70 L46 57 L33 60 L42 50 L33 40 L46 43 Z",
                detail: "M50 36 L52 44 L60 42 L55 50 L60 58 L52 56 L50 64 L48 56 L40 58 L45 50 L40 42 L48 44 Z",
                complexity: 9,
            };
        case "legend":
            // Ultimate: layered phoenix-like emblem
            return {
                inner: "M50 26 L56 41 L70 36 L60 50 L70 64 L56 59 L50 74 L44 59 L30 64 L40 50 L30 36 L44 41 Z",
                detail: "M50 34 L53 44 L63 41 L57 50 L63 59 L53 56 L50 66 L47 56 L37 59 L43 50 L37 41 L47 44 Z",
                complexity: 10,
            };
        default:
            return { inner: "M50 40 L52.5 47 L60 47 L54 52 L56.5 59 L50 55 L43.5 59 L46 52 L40 47 L47.5 47 Z", complexity: 2 };
    }
}

export function RankBadge({ colors, glowColor, tierName, size = 80, className = "", mousePosition }: RankBadgeProps) {
    const id = `badge-${colors[0].replace("#", "")}-${size}`;
    const emblem = getEmblemPath(tierName);
    const shieldScale = Math.min(1 + emblem.complexity * 0.02, 1.15);

    return (
        <motion.div
            className={`relative ${className}`}
            style={{ width: size, height: size }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
            {/* Cursor-following reflection — clipped to badge */}
            {mousePosition && (
                <div
                    className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
                    style={{ clipPath: "polygon(50% 4%, 92% 20%, 86% 75%, 50% 95%, 14% 75%, 8% 20%)" }}
                >
                    <div
                        className="w-full h-full transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.15) 0%, transparent 40%)`,
                            opacity: mousePosition.x === 0.5 && mousePosition.y === 0.5 ? 0 : 1,
                        }}
                    />
                </div>
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 2px 6px ${glowColor}40)` }}>
                <defs>
                    <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colors[0]} />
                        <stop offset="100%" stopColor={colors[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                        <stop offset="40%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                    </linearGradient>
                </defs>

                {/* Outer shield — scales with tier */}
                <g transform={`translate(50,50) scale(${shieldScale}) translate(-50,-50)`}>
                    <path
                        d="M50 4 L90 22 L85 78 L50 98 L15 78 L10 22 Z"
                        fill={`url(#${id}-grad)`}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.2"
                    />

                    {/* Inner border */}
                    <path
                        d="M50 11 L83 26 L79 74 L50 91 L21 74 L17 26 Z"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.8"
                    />

                    {/* Shine overlay */}
                    <path
                        d="M50 4 L90 22 L85 78 L50 98 L15 78 L10 22 Z"
                        fill={`url(#${id}-shine)`}
                        opacity="0.6"
                    />

                    {/* Dark inner area */}
                    <circle cx="50" cy="50" r={16 + emblem.complexity * 0.5} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

                    {/* Main emblem */}
                    <path d={emblem.inner} fill="rgba(255,255,255,0.85)" />

                    {/* Detail layer (for higher tiers) */}
                    {emblem.detail && (
                        <path
                            d={emblem.detail}
                            fill={emblem.complexity >= 6 ? "none" : "rgba(255,255,255,0.5)"}
                            stroke={emblem.complexity >= 6 ? "rgba(255,255,255,0.6)" : "none"}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                        />
                    )}

                    {/* Crown accent for Gold+ */}
                    {emblem.complexity >= 4 && (
                        <path
                            d="M38 8 L43 2 L50 6 L57 2 L62 8"
                            fill="none"
                            stroke={colors[1]}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            opacity="0.7"
                        />
                    )}

                    {/* Extra rays for Champion+ */}
                    {emblem.complexity >= 9 && (
                        <>
                            <line x1="50" y1="18" x2="50" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
                            <line x1="30" y1="30" x2="24" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                            <line x1="70" y1="30" x2="76" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
                        </>
                    )}
                </g>
            </svg>
        </motion.div>
    );
}
