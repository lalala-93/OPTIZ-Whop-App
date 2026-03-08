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

export function RankBadge({ colors, glowColor, tierName, size = 80, className = "", mousePosition }: RankBadgeProps) {
    const id = `rb-${(tierName || "def").slice(0, 4)}-${size}`;
    const t = (tierName || "Recruit").toLowerCase();

    // Subtle breathing — CSS only, no JS animation loop
    const breathing = {};

    return (
        <motion.div
            className={`relative flex items-center justify-center pointer-events-none ${className}`}
            style={{
                width: size,
                height: size,
                background: `radial-gradient(circle at 30% 20%, ${colors[0]}18 0%, transparent 62%)`,
                borderRadius: "50%",
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            whileHover={{ scale: 1.05 }}
        >
            {/* Ambient Background Glow for higher tiers */}
            {(t === "veteran" || t === "prestige") && (
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
                        filter: `blur(${size * 0.15}px)`,
                        opacity: t === "prestige" ? 0.7 : 0.4
                    }}
                />
            )}

            {/* Reflection Overlay (Cursor follow) */}
            {mousePosition && (
                <div
                    className="absolute inset-0 z-10 overflow-hidden rounded-full mix-blend-overlay"
                >
                    <motion.div
                        className="w-full h-full"
                        style={{
                            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.4) 0%, transparent 40%)`,
                        }}
                        animate={{ opacity: mousePosition.x === 0.5 && mousePosition.y === 0.5 ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                    />
                </div>
            )}

            <motion.svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-0" animate={breathing}>
                <defs>
                    <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6B7280" />
                        <stop offset="50%" stopColor="#374151" />
                        <stop offset="100%" stopColor="#111827" />
                    </linearGradient>
                    <linearGradient id={`${id}-bronze`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F5A623" />
                        <stop offset="50%" stopColor="#92400E" />
                        <stop offset="100%" stopColor="#451A03" />
                    </linearGradient>
                    <linearGradient id={`${id}-crimson`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF5252" />
                        <stop offset="40%" stopColor="#DC2626" />
                        <stop offset="100%" stopColor="#450A0A" />
                    </linearGradient>
                    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF7B0" />
                        <stop offset="30%" stopColor="#F5A623" />
                        <stop offset="70%" stopColor="#B45309" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <filter id={`${id}-drop`}>
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
                    </filter>
                    <filter id={`${id}-glow-red`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id={`${id}-glow-gold`}>
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Render specific geometry based on rank */}
                {t === "recruit" && <InitiateBadge id={id} />}
                {t === "soldier" && <GrinderBadge id={id} />}
                {t === "veteran" && <EliteBadge id={id} />}
                {t === "prestige" && <ApexBadge id={id} />}
            </motion.svg>
        </motion.div>
    );
}

// ── TIER 1: INITIATE (Raw Steel, Hexagon) ──
function InitiateBadge({ id }: { id: string }) {
    return (
        <g filter={`url(#${id}-drop)`}>
            {/* Heavy Base Hexagon */}
            <path d="M50 10 L85 25 L85 75 L50 90 L15 75 L15 25 Z" fill={`url(#${id}-metal)`} stroke="#4B5563" strokeWidth="2" />

            {/* Inner Dark Cutout */}
            <path d="M50 18 L76 30 L76 70 L50 82 L24 70 L24 30 Z" fill="#111827" stroke="#374151" strokeWidth="1" />

            {/* Center Monolith */}
            <path d="M45 35 L55 35 L50 65 Z" fill="#9CA3AF" />
        </g>
    );
}

// ── TIER 2: GRINDER (Forged Bronze, Heavy Shield) ──
function GrinderBadge({ id }: { id: string }) {
    return (
        <g filter={`url(#${id}-drop)`}>
            {/* Aggressive Wide Shield Base */}
            <path d="M50 5 L95 25 L85 80 L50 95 L15 80 L5 25 Z" fill={`url(#${id}-bronze)`} stroke="#D97706" strokeWidth="2.5" />

            {/* Dark Inner Shield Core */}
            <path d="M50 14 L84 30 L76 74 L50 86 L24 74 L16 30 Z" fill="#18181B" stroke="#78350F" strokeWidth="1.5" />

            {/* Center Geometry */}
            <g>
                <path d="M50 25 L65 50 L50 75 L35 50 Z" fill={`url(#${id}-bronze)`} />
                <path d="M50 35 L58 50 L50 65 L42 50 Z" fill="#FBBF24" opacity="0.8" />
            </g>
        </g>
    );
}

// ── TIER 3: ELITE (OPTIZ Red & Black, Demon Shield) ──
function EliteBadge({ id }: { id: string }) {
    return (
        <g filter={`url(#${id}-drop)`}>
            {/* Winged Demon Base */}
            <path d="M50 5 L95 20 L80 55 L95 65 L50 95 L5 65 L20 55 L5 20 Z" fill={`url(#${id}-crimson)`} stroke="#DC2626" strokeWidth="2" />

            {/* Inner Obsidian Core */}
            <path d="M50 14 L82 26 L70 55 L82 62 L50 85 L18 62 L30 55 L18 26 Z" fill="#000000" />

            {/* Red Core Light */}
            <circle cx="50" cy="50" r="15" fill="#DC2626" filter={`url(#${id}-glow-red)`} opacity="0.6" />

            {/* The "Optiz" Spark/Bolt */}
            <path d="M45 25 L65 25 L55 50 L70 50 L35 80 L45 55 L30 55 Z" fill="#FF5252" filter={`url(#${id}-glow-red)`} opacity="0.9" />
        </g>
    );
}

// ── TIER 4: APEX (Floating Obsidian & Gold, Masterpiece) ──
function ApexBadge({ id }: { id: string }) {
    return (
        <g>
            {/* Gold Back-Arc */}
            <path d="M20 30 Q50 0 80 30" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="4" strokeLinecap="round" filter={`url(#${id}-glow-gold)`} />

            {/* Main Obsidian Shield with Gold Border */}
            <g filter={`url(#${id}-drop)`}>
                <path d="M50 10 L90 35 L75 85 L50 100 L25 85 L10 35 Z" fill="#09090B" stroke={`url(#${id}-gold)`} strokeWidth="3" />

                {/* Gold Inner Carvings */}
                <path d="M50 20 L80 40 L68 80 L50 91 L32 80 L20 40 Z" fill="none" stroke="#F5A623" strokeWidth="1" opacity="0.5" />

                {/* Center Core Gem */}
                <g>
                    <circle cx="50" cy="55" r="18" fill="#FBBF24" filter={`url(#${id}-glow-gold)`} opacity="0.6" />
                    <path d="M50 35 L65 55 L50 75 L35 55 Z" fill={`url(#${id}-gold)`} />
                    <path d="M50 42 L58 55 L50 68 L42 55 Z" fill="#FEF08A" />
                </g>
            </g>

            {/* Static Halo Particles */}
            <g>
                <circle cx="20" cy="50" r="2.5" fill="#FFF7B0" opacity="0.7" />
                <circle cx="80" cy="50" r="2.5" fill="#FFF7B0" opacity="0.7" />
                <circle cx="50" cy="20" r="2.5" fill="#FFF7B0" opacity="0.7" />
                <circle cx="50" cy="80" r="2.5" fill="#FFF7B0" opacity="0.7" />
            </g>
        </g>
    );
}
