"use client";

import { motion } from "framer-motion";
import { getRankForLevel, MOCK_LEADERBOARD } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useState } from "react";

interface LeaderboardScreenProps {
    userXp: number;
    userLevel: number;
    userName?: string;
    userPhoto?: string | null;
}

export function LeaderboardScreen({ userXp, userLevel, userName = "You", userPhoto }: LeaderboardScreenProps) {
    const [timeFilter, setTimeFilter] = useState<"today" | "weekly" | "all">("all");

    const allEntries = [
        ...MOCK_LEADERBOARD,
        { rank: 0, name: userName, xp: userXp, level: userLevel, emoji: "⚡", isMe: true },
    ]
        .sort((a, b) => b.xp - a.xp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const top3 = allEntries.slice(0, 3);
    const rest = allEntries.slice(3);
    const podiumOrder = [1, 0, 2]; // #2, #1, #3

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
                <div className="flex gap-1 p-1 bg-gray-3/50 rounded-xl border border-gray-5/30">
                    {(["today", "weekly", "all"] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${timeFilter === filter
                                    ? "bg-gray-1 text-gray-12 shadow-sm border border-gray-5/50"
                                    : "text-gray-8 hover:text-gray-11"
                                }`}
                        >
                            {filter === "all" ? "All Time" : filter === "weekly" ? "Week" : "Today"}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Podium */}
            <motion.div
                className="flex items-end justify-center gap-3 mb-6 px-2"
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
                    const heights = [80, 100, 65];
                    const avatarSizes = ["w-12 h-12", "w-14 h-14", "w-10 h-10"];
                    const badgeSizes = [20, 22, 18];

                    return (
                        <motion.div
                            key={user.name}
                            className="flex flex-col items-center flex-1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + visualIdx * 0.1, duration: 0.5, ease: "easeOut" }}
                        >
                            {rank === 1 && (
                                <motion.span
                                    className="text-lg mb-1"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.3 }}
                                >
                                    👑
                                </motion.span>
                            )}

                            {/* Avatar — profile icon or user photo */}
                            <div
                                className={`${avatarSizes[visualIdx]} rounded-full flex items-center justify-center mb-1.5 ${isMe
                                        ? "bg-gray-3 border-2 border-[#E80000]/40"
                                        : "bg-gray-3 border-[1.5px] border-gray-5"
                                    }`}
                            >
                                {isMe && userPhoto ? (
                                    <img src={userPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </div>

                            <p className={`text-[11px] font-bold truncate max-w-full ${isMe ? "text-gray-12" : "text-gray-11"}`}>
                                {user.name}
                            </p>

                            <div className="flex items-center gap-1 mt-0.5">
                                <RankBadge
                                    colors={rankInfo.tier.gradient}
                                    glowColor={rankInfo.tier.glowColor}
                                    tierName={rankInfo.tier.name}
                                    size={badgeSizes[visualIdx]}
                                />
                                <span className="text-[9px] text-gray-7 font-medium tabular-nums">
                                    {(user.xp / 1000).toFixed(1)}k
                                </span>
                            </div>

                            {/* Podium bar — simple reveal */}
                            <motion.div
                                className={`w-full mt-2 rounded-t-xl ${rank === 1
                                        ? "optiz-gradient-bg"
                                        : rank === 2
                                            ? "bg-gray-4/80"
                                            : "bg-gray-3/80"
                                    }`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: heights[visualIdx], opacity: 1 }}
                                transition={{ delay: 0.35 + visualIdx * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <div className="flex items-start justify-center pt-2.5">
                                    <span className={`text-xs font-black ${rank === 1 ? "text-white" : "text-gray-9"}`}>
                                        #{rank}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Rank list */}
            <div className="space-y-1.5">
                {rest.map((user, idx) => {
                    const isMe = "isMe" in user && user.isMe;
                    const rankInfo = getRankForLevel(user.level);

                    return (
                        <motion.div
                            key={user.name}
                            className={`flex items-center justify-between p-3 rounded-xl ${isMe
                                    ? "bg-gray-3/40 border border-gray-5/50"
                                    : "bg-gray-3/20 border border-gray-5/25"
                                }`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + idx * 0.05, duration: 0.35, ease: "easeOut" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-[11px] font-bold text-gray-8 w-5 text-center tabular-nums">
                                    {user.rank}
                                </span>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? "bg-gray-3 border border-[#E80000]/30" : "bg-gray-4/50 border border-gray-5/30"
                                    }`}>
                                    {isMe && userPhoto ? (
                                        <img src={userPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                </div>

                                <div>
                                    <p className={`text-[12px] font-semibold ${isMe ? "text-gray-12" : "text-gray-11"}`}>
                                        {user.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <RankBadge
                                            colors={rankInfo.tier.gradient}
                                            glowColor={rankInfo.tier.glowColor}
                                            tierName={rankInfo.tier.name}
                                            size={14}
                                        />
                                        <p className="text-[9px] font-medium" style={{ color: rankInfo.tier.color }}>
                                            Lvl {user.level}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <span className="text-[11px] font-bold tabular-nums text-gray-10">
                                {user.xp.toLocaleString()} <span className="text-gray-7 text-[9px]">XP</span>
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
