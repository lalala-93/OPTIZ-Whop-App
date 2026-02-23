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

// Tier-specific badge configuration — each tier is visually distinct and increasingly prestigious
function getTierConfig(tierName?: string) {
    switch (tierName?.toLowerCase()) {
        case "iron":
            return {
                outerStroke: 1.5, gems: 0, hasWreaths: false, hasCrown: false, hasWings: false,
                innerSymbol: "diamond", innerGlow: 0, orbits: 0,
                accent: "#9CA3AF", shimmer: "rgba(156,163,175,0.15)",
            };
        case "bronze":
            return {
                outerStroke: 1.8, gems: 2, hasWreaths: false, hasCrown: false, hasWings: false,
                innerSymbol: "star5", innerGlow: 0.15, orbits: 0,
                accent: "#CD7F32", shimmer: "rgba(205,127,50,0.2)",
            };
        case "silver":
            return {
                outerStroke: 2, gems: 3, hasWreaths: true, hasCrown: false, hasWings: false,
                innerSymbol: "star6", innerGlow: 0.2, orbits: 0,
                accent: "#C0C0C0", shimmer: "rgba(192,192,192,0.25)",
            };
        case "gold":
            return {
                outerStroke: 2.2, gems: 4, hasWreaths: true, hasCrown: true, hasWings: false,
                innerSymbol: "star6", innerGlow: 0.3, orbits: 0,
                accent: "#FFD700", shimmer: "rgba(255,215,0,0.25)",
            };
        case "platinum":
            return {
                outerStroke: 2.5, gems: 4, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "starburst", innerGlow: 0.35, orbits: 1,
                accent: "#40E0D0", shimmer: "rgba(64,224,208,0.3)",
            };
        case "diamond":
            return {
                outerStroke: 2.8, gems: 6, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "crystal", innerGlow: 0.4, orbits: 2,
                accent: "#4FC3F7", shimmer: "rgba(79,195,247,0.35)",
            };
        case "master":
            return {
                outerStroke: 3, gems: 6, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "radiant", innerGlow: 0.45, orbits: 2,
                accent: "#AB47BC", shimmer: "rgba(171,71,188,0.35)",
            };
        case "grandmaster":
            return {
                outerStroke: 3.2, gems: 8, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "radiant", innerGlow: 0.5, orbits: 3,
                accent: "#FF5252", shimmer: "rgba(255,82,82,0.35)",
            };
        case "champion":
            return {
                outerStroke: 3.5, gems: 8, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "phoenix", innerGlow: 0.6, orbits: 3,
                accent: "#FF6D00", shimmer: "rgba(255,109,0,0.4)",
            };
        case "legend":
            return {
                outerStroke: 4, gems: 10, hasWreaths: true, hasCrown: true, hasWings: true,
                innerSymbol: "phoenix", innerGlow: 0.7, orbits: 4,
                accent: "#FFD700", shimmer: "rgba(255,215,0,0.5)",
            };
        default:
            return {
                outerStroke: 1.5, gems: 0, hasWreaths: false, hasCrown: false, hasWings: false,
                innerSymbol: "diamond", innerGlow: 0, orbits: 0,
                accent: "#9CA3AF", shimmer: "rgba(156,163,175,0.15)",
            };
    }
}

function getInnerSymbolPath(symbol: string): string {
    switch (symbol) {
        case "diamond":
            return "M50 38 L56 50 L50 62 L44 50 Z";
        case "star5":
            return "M50 36 L53 46 L63 46 L55 52 L58 62 L50 56 L42 62 L45 52 L37 46 L47 46 Z";
        case "star6":
            return "M50 34 L54 44 L64 44 L57 51 L60 62 L50 55 L40 62 L43 51 L36 44 L46 44 Z";
        case "starburst":
            return "M50 32 L53 44 L64 38 L57 49 L68 50 L57 53 L64 63 L53 57 L50 68 L47 57 L36 63 L43 53 L32 50 L43 49 L36 38 L47 44 Z";
        case "crystal":
            return "M50 30 L60 44 L60 58 L50 70 L40 58 L40 44 Z";
        case "radiant":
            return "M50 28 L55 42 L68 38 L59 50 L68 62 L55 58 L50 72 L45 58 L32 62 L41 50 L32 38 L45 42 Z";
        case "phoenix":
            return "M50 26 L56 40 L70 34 L60 48 L72 52 L60 56 L70 68 L56 60 L50 74 L44 60 L30 68 L40 56 L28 52 L40 48 L30 34 L44 40 Z";
        default:
            return "M50 38 L56 50 L50 62 L44 50 Z";
    }
}

export function RankBadge({ colors, glowColor, tierName, size = 80, className = "", mousePosition }: RankBadgeProps) {
    const id = `rb-${(tierName || "def").slice(0, 4)}-${size}`;
    const cfg = getTierConfig(tierName);

    return (
        <motion.div
            className={`relative ${className}`}
            style={{ width: size, height: size }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
            {/* Animated glow backdrop for higher tiers */}
            {cfg.innerGlow > 0.2 && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${glowColor}${Math.round(cfg.innerGlow * 80).toString(16).padStart(2, "0")} 0%, transparent 60%)`,
                        filter: `blur(${Math.max(4, cfg.innerGlow * 12)}px)`,
                    }}
                    animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            {/* Cursor-following reflection */}
            {mousePosition && (
                <div
                    className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
                    style={{ clipPath: "polygon(50% 2%, 93% 18%, 88% 78%, 50% 98%, 12% 78%, 7% 18%)" }}
                >
                    <motion.div
                        className="w-full h-full"
                        style={{
                            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.2) 0%, transparent 35%)`,
                        }}
                        animate={{ opacity: mousePosition.x === 0.5 && mousePosition.y === 0.5 ? 0 : 1 }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colors[0]} />
                        <stop offset="100%" stopColor={colors[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                        <stop offset="35%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                    </linearGradient>
                    <radialGradient id={`${id}-glow`} cx="50%" cy="40%" r="45%">
                        <stop offset="0%" stopColor={cfg.shimmer} />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <filter id={`${id}-blur`}>
                        <feGaussianBlur stdDeviation="1.5" />
                    </filter>
                </defs>

                {/* Wings for Platinum+ */}
                {cfg.hasWings && (
                    <g opacity="0.35">
                        <motion.path
                            d="M14 50 Q6 35 18 22 Q24 32 20 45 Z"
                            fill={cfg.accent}
                            animate={{
                                d: [
                                    "M14 50 Q6 35 18 22 Q24 32 20 45 Z",
                                    "M12 50 Q4 33 16 20 Q22 30 18 44 Z",
                                    "M14 50 Q6 35 18 22 Q24 32 20 45 Z",
                                ]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M86 50 Q94 35 82 22 Q76 32 80 45 Z"
                            fill={cfg.accent}
                            animate={{
                                d: [
                                    "M86 50 Q94 35 82 22 Q76 32 80 45 Z",
                                    "M88 50 Q96 33 84 20 Q78 30 82 44 Z",
                                    "M86 50 Q94 35 82 22 Q76 32 80 45 Z",
                                ]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </g>
                )}

                {/* Outer shield */}
                <path
                    d="M50 4 L91 20 L86 78 L50 97 L14 78 L9 20 Z"
                    fill={`url(#${id}-g)`}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={cfg.outerStroke}
                />

                {/* Inner border with inset */}
                <path
                    d="M50 10 L85 24 L81 74 L50 91 L19 74 L15 24 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.8"
                />

                {/* Shine overlay */}
                <path
                    d="M50 4 L91 20 L86 78 L50 97 L14 78 L9 20 Z"
                    fill={`url(#${id}-sh)`}
                    opacity="0.7"
                />

                {/* Inner glow */}
                <circle cx="50" cy="48" r="22" fill={`url(#${id}-glow)`} opacity={cfg.innerGlow * 2} />

                {/* Dark center */}
                <circle cx="50" cy="49" r="18" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

                {/* Inner symbol — animated shimmer */}
                <motion.path
                    d={getInnerSymbolPath(cfg.innerSymbol)}
                    fill="rgba(255,255,255,0.85)"
                    animate={{ opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Gem accents */}
                {cfg.gems >= 2 && (
                    <>
                        <circle cx="30" cy="38" r="2" fill={cfg.accent} opacity="0.7" />
                        <circle cx="70" cy="38" r="2" fill={cfg.accent} opacity="0.7" />
                    </>
                )}
                {cfg.gems >= 4 && (
                    <>
                        <circle cx="24" cy="55" r="1.5" fill={cfg.accent} opacity="0.5" />
                        <circle cx="76" cy="55" r="1.5" fill={cfg.accent} opacity="0.5" />
                    </>
                )}
                {cfg.gems >= 6 && (
                    <>
                        <circle cx="50" cy="86" r="2" fill={cfg.accent} opacity="0.6" />
                        <circle cx="50" cy="12" r="1.5" fill={cfg.accent} opacity="0.5" />
                    </>
                )}

                {/* Wreaths for Silver+ */}
                {cfg.hasWreaths && (
                    <g opacity="0.25">
                        <path d="M18 30 Q10 45 18 65" fill="none" stroke={cfg.accent} strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M82 30 Q90 45 82 65" fill="none" stroke={cfg.accent} strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                )}

                {/* Crown for Gold+ */}
                {cfg.hasCrown && (
                    <motion.g
                        animate={{ y: [0, -1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <path
                            d="M37 8 L41 1 L50 5 L59 1 L63 8"
                            fill="none"
                            stroke={cfg.accent}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.7"
                        />
                        <circle cx="41" cy="1" r="1.2" fill={cfg.accent} opacity="0.6" />
                        <circle cx="50" cy="5" r="1.5" fill={cfg.accent} opacity="0.8" />
                        <circle cx="59" cy="1" r="1.2" fill={cfg.accent} opacity="0.6" />
                    </motion.g>
                )}

                {/* Orbiting particles for Platinum+ */}
                {cfg.orbits > 0 && (
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "50px 49px" }}
                    >
                        {Array.from({ length: cfg.orbits }).map((_, i) => (
                            <circle
                                key={i}
                                cx={50 + 25 * Math.cos((i / cfg.orbits) * Math.PI * 2)}
                                cy={49 + 25 * Math.sin((i / cfg.orbits) * Math.PI * 2)}
                                r="1"
                                fill="white"
                                opacity="0.5"
                            />
                        ))}
                    </motion.g>
                )}
            </svg>
        </motion.div>
    );
}
