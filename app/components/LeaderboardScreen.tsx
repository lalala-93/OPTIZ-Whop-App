"use client";

import { motion } from "framer-motion";
import { getRankForLevel, MOCK_LEADERBOARD } from "./rankSystem";
import { useState } from "react";

interface LeaderboardScreenProps {
    userXp: number;
    userLevel: number;
    userName?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.3 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
};

export function LeaderboardScreen({ userXp, userLevel, userName = "You" }: LeaderboardScreenProps) {
    const [timeFilter, setTimeFilter] = useState<"today" | "weekly" | "all">("all");

    // Merge user into leaderboard
    const allEntries = [
        ...MOCK_LEADERBOARD,
        { rank: 0, name: userName, xp: userXp, level: userLevel, emoji: "⚡", isMe: true },
    ]
        .sort((a, b) => b.xp - a.xp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const top3 = allEntries.slice(0, 3);
    const rest = allEntries.slice(3);
    const podiumOrder = [1, 0, 2]; // #2, #1, #3 for visual layout

    return (
        <div className="pb-8">
            {/* Header + filter */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mb-5"
            >
                <h2 className="text-xl font-bold text-gray-12 mb-3">Leaderboard</h2>
                <div className="flex gap-1.5 p-1 bg-gray-3 rounded-xl border border-gray-5">
                    {(["today", "weekly", "all"] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${timeFilter === filter
                                ? "bg-gray-1 text-gray-12 shadow-sm border border-gray-5"
                                : "text-gray-9 hover:text-gray-11"
                                }`}
                        >
                            {filter === "all" ? "All Time" : filter === "weekly" ? "This Week" : "Today"}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ── Podium ── */}
            <motion.div
                className="flex items-end justify-center gap-3 mb-6 px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
            >
                {podiumOrder.map((podiumIdx, visualIdx) => {
                    const user = top3[podiumIdx];
                    if (!user) return null;
                    const rank = podiumIdx + 1;
                    const isMe = "isMe" in user && user.isMe;
                    const rankInfo = getRankForLevel(user.level);
                    const heights = [88, 110, 72]; // #2, #1, #3
                    const sizes = ["w-14 h-14", "w-[70px] h-[70px]", "w-12 h-12"];

                    return (
                        <motion.div
                            key={user.name}
                            className="flex flex-col items-center flex-1"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + visualIdx * 0.08, type: "spring", stiffness: 250, damping: 20 }}
                        >
                            {/* Crown for #1 */}
                            {rank === 1 && (
                                <motion.span
                                    className="text-xl mb-1"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    👑
                                </motion.span>
                            )}

                            {/* Avatar circle */}
                            <div
                                className={`${sizes[visualIdx]} rounded-full flex items-center justify-center text-xl font-bold mb-2 ${isMe
                                    ? "bg-[#E80000]/15 border-2 border-[#E80000] shadow-[0_0_15px_rgba(232,0,0,0.25)]"
                                    : "bg-gray-3 border-2 border-gray-5"
                                    }`}
                            >
                                {user.emoji}
                            </div>

                            {/* Name */}
                            <p className={`text-xs font-bold truncate max-w-full ${isMe ? "optiz-gradient-text" : "text-gray-12"
                                }`}>
                                {user.name}
                            </p>

                            {/* XP */}
                            <p className="text-[10px] text-gray-8 font-medium tabular-nums mt-0.5">
                                {(user.xp / 1000).toFixed(1)}k XP
                            </p>

                            {/* Rank */}
                            <p className="text-[9px] font-semibold mt-0.5" style={{ color: rankInfo.tier.color }}>
                                {rankInfo.fullName}
                            </p>

                            {/* Podium bar */}
                            <motion.div
                                className={`w-full mt-2 rounded-t-xl ${rank === 1
                                    ? "optiz-gradient-bg"
                                    : rank === 2
                                        ? "bg-gray-4"
                                        : "bg-gray-3"
                                    }`}
                                initial={{ height: 0 }}
                                animate={{ height: heights[visualIdx] }}
                                transition={{ delay: 0.3 + visualIdx * 0.08, duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
                            >
                                <div className="flex items-start justify-center pt-3">
                                    <span className={`text-sm font-black ${rank === 1 ? "text-white" : "text-gray-10"
                                        }`}>
                                        #{rank}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* ── Rank list ── */}
            <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {rest.map((user) => {
                    const isMe = "isMe" in user && user.isMe;
                    const rankInfo = getRankForLevel(user.level);

                    return (
                        <motion.div
                            key={user.name}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isMe
                                ? "bg-gray-3/50 border border-[var(--optiz-border-active)] shadow-[0_0_16px_rgba(232,0,0,0.08)]"
                                : "bg-gray-3/30 border border-gray-5/50"
                                }`}
                            variants={itemVariants}
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank number */}
                                <div className="w-7 h-7 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-10">{user.rank}</span>
                                </div>
                                {/* Emoji */}
                                <span className="text-lg">{user.emoji}</span>
                                {/* Info */}
                                <div>
                                    <p className={`text-sm font-semibold ${isMe ? "optiz-gradient-text" : "text-gray-12"
                                        }`}>
                                        {user.name}
                                    </p>
                                    <p className="text-[10px] font-medium" style={{ color: rankInfo.tier.color }}>
                                        Lvl {user.level} • {rankInfo.fullName}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold tabular-nums text-gray-11">
                                {user.xp.toLocaleString()} <span className="text-gray-8 text-xs">XP</span>
                            </span>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
