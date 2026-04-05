"use client";

import { motion } from "framer-motion";

interface RankBadgeProps {
    colors: [string, string];
    glowColor: string;
    tierName?: string;
    size?: number;
    className?: string;
    mousePosition?: { x: number; y: number };
    /** When true, disables mount animations and heavy SVG filters (use in lists/scrollable areas) */
    static?: boolean;
}

export function RankBadge({ colors, glowColor, tierName, size = 80, className = "", mousePosition, static: isStatic }: RankBadgeProps) {
    const id = `rb-${(tierName || "def").slice(0, 4)}-${size}`;
    const t = (tierName || "Recruit").toLowerCase();

    const Wrapper = isStatic ? "div" : motion.div;
    const SvgWrapper = isStatic ? "svg" : motion.svg;

    const wrapperProps = isStatic
        ? {}
        : {
              initial: { scale: 0.8, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              transition: { type: "spring", stiffness: 250, damping: 20 },
              whileHover: { scale: 1.05 },
          };

    return (
        <Wrapper
            className={`relative flex items-center justify-center pointer-events-none ${className}`}
            style={{
                width: size,
                height: size,
                background: isStatic ? "none" : `radial-gradient(circle at 30% 20%, ${colors[0]}18 0%, transparent 62%)`,
                borderRadius: "50%",
            }}
            {...(wrapperProps as Record<string, unknown>)}
        >
            {/* Ambient Background Glow for higher tiers — skip in static mode */}
            {!isStatic && (t === "veteran" || t === "prestige") && (
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
                        filter: `blur(${size * 0.15}px)`,
                        opacity: t === "prestige" ? 0.7 : 0.4
                    }}
                />
            )}

            {/* Reflection Overlay (Cursor follow) — skip in static mode */}
            {!isStatic && mousePosition && (
                <div className="absolute inset-0 z-10 overflow-hidden rounded-full mix-blend-overlay">
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

            <SvgWrapper viewBox="0 0 100 100" className={`w-full h-full relative z-0 ${isStatic ? "" : "drop-shadow-2xl"}`} {...({} as Record<string, unknown>)}>
                <defs>
                    {/* Tier 1: Dark red — simple */}
                    <linearGradient id={`${id}-t1`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#7F1D1D" />
                        <stop offset="100%" stopColor="#450A0A" />
                    </linearGradient>
                    {/* Tier 2: Medium red — bolder */}
                    <linearGradient id={`${id}-t2`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#DC2626" />
                        <stop offset="50%" stopColor="#991B1B" />
                        <stop offset="100%" stopColor="#450A0A" />
                    </linearGradient>
                    {/* Tier 3: Bright crimson — intense */}
                    <linearGradient id={`${id}-t3`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF5252" />
                        <stop offset="40%" stopColor="#E80000" />
                        <stop offset="100%" stopColor="#7F1D1D" />
                    </linearGradient>
                    {/* Tier 4: Red to gold — legendary */}
                    <linearGradient id={`${id}-t4`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF5252" />
                        <stop offset="50%" stopColor="#E80000" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                    </linearGradient>
                    {/* SVG filters only in non-static mode (heavy on GPU) */}
                    {!isStatic && (
                        <>
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
                        </>
                    )}
                </defs>

                {/* Render specific geometry based on rank */}
                {t === "recruit" && <InitiateBadge id={id} noFilter={isStatic} />}
                {t === "soldier" && <GrinderBadge id={id} noFilter={isStatic} />}
                {t === "veteran" && <EliteBadge id={id} noFilter={isStatic} />}
                {t === "prestige" && <ApexBadge id={id} noFilter={isStatic} />}
            </SvgWrapper>
        </Wrapper>
    );
}

// ── TIER 1: RECRUE — Simple dark red hexagon, minimal detail ──
function InitiateBadge({ id, noFilter }: { id: string; noFilter?: boolean }) {
    return (
        <g filter={noFilter ? undefined : `url(#${id}-drop)`}>
            <path d="M50 12 L82 28 L82 72 L50 88 L18 72 L18 28 Z" fill={`url(#${id}-t1)`} stroke="#991B1B" strokeWidth="2" />
            <path d="M50 22 L72 34 L72 66 L50 78 L28 66 L28 34 Z" fill="#0A0A0A" stroke="#7F1D1D" strokeWidth="1" />
            {/* Simple center diamond */}
            <path d="M50 38 L58 50 L50 62 L42 50 Z" fill="#991B1B" />
        </g>
    );
}

// ── TIER 2: SOLDAT — Bigger shield, red gradient, inner ring ──
function GrinderBadge({ id, noFilter }: { id: string; noFilter?: boolean }) {
    return (
        <g filter={noFilter ? undefined : `url(#${id}-drop)`}>
            <path d="M50 6 L92 26 L82 80 L50 94 L18 80 L8 26 Z" fill={`url(#${id}-t2)`} stroke="#DC2626" strokeWidth="2.5" />
            <path d="M50 16 L80 32 L72 74 L50 84 L28 74 L20 32 Z" fill="#0A0A0A" stroke="#991B1B" strokeWidth="1.5" />
            {/* Center diamond with inner highlight */}
            <path d="M50 28 L66 50 L50 72 L34 50 Z" fill={`url(#${id}-t2)`} />
            <path d="M50 36 L58 50 L50 64 L42 50 Z" fill="#FF5252" opacity="0.7" />
            {/* Corner accents */}
            <circle cx="50" cy="18" r="2" fill="#DC2626" />
        </g>
    );
}

// ── TIER 3: VÉTÉRAN — Winged shield, bolt center, red glow ──
function EliteBadge({ id, noFilter }: { id: string; noFilter?: boolean }) {
    return (
        <g filter={noFilter ? undefined : `url(#${id}-drop)`}>
            {/* Winged shape */}
            <path d="M50 4 L94 20 L78 55 L92 65 L50 96 L8 65 L22 55 L6 20 Z" fill={`url(#${id}-t3)`} stroke="#E80000" strokeWidth="2" />
            <path d="M50 14 L80 26 L68 54 L78 62 L50 85 L22 62 L32 54 L20 26 Z" fill="#0A0A0A" />
            {/* Red core glow */}
            <circle cx="50" cy="48" r="14" fill="#E80000" filter={noFilter ? undefined : `url(#${id}-glow-red)`} opacity="0.5" />
            {/* Lightning bolt */}
            <path d="M46 24 L62 24 L54 46 L66 46 L38 78 L46 52 L34 52 Z" fill="#FF5252" filter={noFilter ? undefined : `url(#${id}-glow-red)`} opacity="0.9" />
            {/* Wing tip accents */}
            <circle cx="8" cy="22" r="2" fill="#FF5252" opacity="0.6" />
            <circle cx="92" cy="22" r="2" fill="#FF5252" opacity="0.6" />
        </g>
    );
}

// ── TIER 4: PRESTIGE — Obsidian + gold crown, red/gold glow, particles ──
function ApexBadge({ id, noFilter }: { id: string; noFilter?: boolean }) {
    return (
        <g>
            {/* Gold crown arc */}
            <path d="M22 28 Q50 2 78 28" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="3.5" strokeLinecap="round" filter={noFilter ? undefined : `url(#${id}-glow-gold)`} />
            {/* Crown points */}
            <circle cx="35" cy="16" r="2.5" fill="#FFD700" opacity="0.8" />
            <circle cx="50" cy="8" r="3" fill="#FFD700" />
            <circle cx="65" cy="16" r="2.5" fill="#FFD700" opacity="0.8" />

            <g filter={noFilter ? undefined : `url(#${id}-drop)`}>
                {/* Main shield */}
                <path d="M50 12 L88 34 L74 84 L50 98 L26 84 L12 34 Z" fill="#0A0A0A" stroke={`url(#${id}-t4)`} strokeWidth="3" />
                {/* Inner carving */}
                <path d="M50 22 L78 38 L66 78 L50 88 L34 78 L22 38 Z" fill="none" stroke="#E80000" strokeWidth="1" opacity="0.4" />
                {/* Red glow center */}
                <circle cx="50" cy="54" r="16" fill="#E80000" filter={noFilter ? undefined : `url(#${id}-glow-red)`} opacity="0.4" />
                {/* Gold gem */}
                <path d="M50 36 L64 54 L50 72 L36 54 Z" fill={`url(#${id}-t4)`} />
                <path d="M50 43 L57 54 L50 65 L43 54 Z" fill="#FFD700" opacity="0.9" />
            </g>

            {/* Halo particles */}
            <circle cx="18" cy="50" r="2" fill="#FF5252" opacity="0.6" />
            <circle cx="82" cy="50" r="2" fill="#FF5252" opacity="0.6" />
            <circle cx="50" cy="100" r="2" fill="#FFD700" opacity="0.5" />
        </g>
    );
}
