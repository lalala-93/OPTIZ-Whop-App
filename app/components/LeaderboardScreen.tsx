"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getRankForLevel, MOCK_LEADERBOARD } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useState } from "react";

interface LeaderboardScreenProps {
    userXp: number;
    userLevel: number;
    userName?: string;
    userPhoto?: string | null;
}

const FILTERS = [
    { key: "today", label: "Today" },
    { key: "weekly", label: "Week" },
    { key: "all", label: "All Time" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

export function LeaderboardScreen({ userXp, userLevel, userName = "You", userPhoto }: LeaderboardScreenProps) {
    const [timeFilter, setTimeFilter] = useState<FilterKey>("all");

    const allEntries = [
        ...MOCK_LEADERBOARD,
        { rank: 0, name: userName, xp: userXp, level: userLevel, emoji: "⚡", isMe: true },
    ]
        .sort((a, b) => b.xp - a.xp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const top3 = allEntries.slice(0, 3);
    const rest = allEntries.slice(3);
    const podiumOrder = [1, 0, 2];

    return (
        <div className="pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-5"
            >
                <h2 className="text-xl font-bold text-gray-12 mb-3">Leaderboard</h2>

                {/* Fixed filter buttons — proper controlled state */}
                <div className="relative flex p-1 bg-gray-3/50 rounded-xl border border-gray-5/30">
                    {/* Active indicator pill */}
                    <motion.div
                        className="absolute top-1 bottom-1 rounded-lg bg-gray-1 border border-gray-5/50 shadow-sm"
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        style={{
                            width: `${100 / FILTERS.length}%`,
                            left: `${(FILTERS.findIndex(f => f.key === timeFilter) / FILTERS.length) * 100}%`,
                        }}
                    />
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setTimeFilter(filter.key)}
                            className={`relative z-10 flex-1 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${timeFilter === filter.key ? "text-gray-12" : "text-gray-8 hover:text-gray-10"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Podium */}
            <motion.div
                className="flex items-end justify-center gap-2.5 mb-6 px-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
            >
                {podiumOrder.map((podiumIdx, visualIdx) => {
                    const user = top3[podiumIdx];
                    if (!user) return null;
                    const rank = podiumIdx + 1;
                    const isMe = "isMe" in user && user.isMe;
                    const rankInfo = getRankForLevel(user.level);
                    const heights = [85, 110, 70];
                    const avatarSize = rank === 1 ? 52 : rank === 2 ? 44 : 40;

                    return (
                        <motion.div
                            key={user.name}
                            className="flex flex-col items-center flex-1"
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + visualIdx * 0.1, duration: 0.5, ease: "easeOut" }}
                        >
                            {/* Crown for #1 */}
                            {rank === 1 && (
                                <motion.span
                                    className="text-xl mb-1"
                                    initial={{ opacity: 0, y: -10, scale: 0.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                                >
                                    👑
                                </motion.span>
                            )}

                            {/* Avatar — properly clipped circle */}
                            <div
                                className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    background: "var(--gray-3)",
                                    border: isMe
                                        ? "2px solid rgba(232,0,0,0.25)"
                                        : "1.5px solid var(--gray-5)",
                                }}
                            >
                                {isMe && userPhoto ? (
                                    <img src={userPhoto} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                ) : (
                                    <svg width={avatarSize * 0.4} height={avatarSize * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </div>

                            {/* Name */}
                            <p className={`text-[11px] font-bold truncate max-w-full mt-1.5 ${isMe ? "text-[#FF2D2D]" : "text-gray-11"
                                }`}>
                                {user.name}
                            </p>

                            {/* XP + level under name */}
                            <div className="flex items-center gap-1 mt-0.5">
                                <RankBadge
                                    colors={rankInfo.tier.gradient}
                                    glowColor={rankInfo.tier.glowColor}
                                    tierName={rankInfo.tier.name}
                                    size={16}
                                />
                                <span className="text-[9px] text-gray-8 font-medium tabular-nums">
                                    {(user.xp / 1000).toFixed(1)}k
                                </span>
                            </div>

                            {/* Podium bar */}
                            <motion.div
                                className={`w-full mt-2 rounded-t-xl flex items-start justify-center pt-3 ${rank === 1
                                        ? "optiz-gradient-bg"
                                        : "bg-gray-4/70"
                                    }`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: heights[visualIdx], opacity: 1 }}
                                transition={{ delay: 0.35 + visualIdx * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <span className={`text-sm font-black ${rank === 1 ? "text-white" : "text-gray-9"}`}>
                                    #{rank}
                                </span>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Rank list — clean like reference design */}
            <div className="space-y-1">
                {rest.map((user, idx) => {
                    const isMe = "isMe" in user && user.isMe;
                    const rankInfo = getRankForLevel(user.level);

                    return (
                        <motion.div
                            key={user.name}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl ${isMe
                                    ? "bg-gray-3/50 border border-gray-5/40"
                                    : "bg-gray-3/15 border border-gray-5/20 hover:bg-gray-3/30"
                                } transition-colors`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.04, duration: 0.3, ease: "easeOut" }}
                            whileHover={{ scale: 1.005 }}
                        >
                            {/* Rank number */}
                            <span className="text-[12px] font-bold text-gray-7 w-5 text-center tabular-nums">
                                {user.rank}
                            </span>

                            {/* Avatar — properly circular */}
                            <div
                                className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                style={{
                                    background: "var(--gray-4)",
                                    border: isMe
                                        ? "1.5px solid rgba(232,0,0,0.2)"
                                        : "1px solid var(--gray-5)",
                                }}
                            >
                                {isMe && userPhoto ? (
                                    <img src={userPhoto} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </div>

                            {/* Name + level */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold truncate ${isMe ? "text-[#FF2D2D]" : "text-gray-12"
                                    }`}>
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <RankBadge
                                        colors={rankInfo.tier.gradient}
                                        glowColor={rankInfo.tier.glowColor}
                                        tierName={rankInfo.tier.name}
                                        size={12}
                                    />
                                    <span className="text-[9px] font-medium" style={{ color: rankInfo.tier.color }}>
                                        Lvl {user.level}
                                    </span>
                                </div>
                            </div>

                            {/* XP — more visible */}
                            <div className="text-right shrink-0">
                                <span className="text-[12px] font-bold tabular-nums text-gray-11">
                                    {user.xp.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-extrabold text-[#E80000] ml-1">XP</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
