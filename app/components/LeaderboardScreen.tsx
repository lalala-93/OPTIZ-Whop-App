"use client";

import { motion } from "framer-motion";
import { getLevelProgress, getRankForLevel } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { useState, useEffect } from "react";
import { useI18n } from "./i18n";

interface LeaderboardEntry {
    whop_user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    total_xp: number | null;
    streak_days: number | null;
    position: number;
    isMe?: boolean;
}

interface LeaderboardScreenProps {
    userXp: number;
    userLevel: number;
    userName?: string;
    userPhoto?: string | null;
}

export function LeaderboardScreen({ userXp, userLevel, userName = "You", userPhoto }: LeaderboardScreenProps) {
    const { t } = useI18n();
    const [timeFilter, setTimeFilter] = useState<"today" | "weekly" | "all">("all");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch leaderboard from API
    useEffect(() => {
        let cancelled = false;

        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard");
                if (!res.ok) throw new Error("Failed to fetch leaderboard");
                const data = await res.json();

                if (cancelled) return;

                const lb: LeaderboardEntry[] = (data.leaderboard || []).map((e: LeaderboardEntry) => ({
                    ...e,
                    isMe: false,
                }));

                // Check if user is already in leaderboard
                const userInLb = lb.some(e => e.position === data.userPosition && e.total_xp === userXp);

                if (!userInLb && userXp > 0) {
                    // Add current user
                    lb.push({
                        whop_user_id: "me",
                        display_name: userName,
                        avatar_url: userPhoto || null,
                        total_xp: userXp,
                        streak_days: null,
                        position: data.userPosition || lb.length + 1,
                        isMe: true,
                    });

                    // Re-sort and re-rank
                    lb.sort((a, b) => (b.total_xp ?? 0) - (a.total_xp ?? 0));
                    lb.forEach((e, i) => { e.position = i + 1; });
                } else {
                    // Mark the user in the list
                    lb.forEach(e => {
                        if (e.position === data.userPosition) e.isMe = true;
                    });
                }

                setEntries(lb);
            } catch (err) {
                console.error("[OPTIZ] Leaderboard fetch error:", err);
                // If no DB data, show just the user
                setEntries([{
                    whop_user_id: "me",
                    display_name: userName,
                    avatar_url: userPhoto || null,
                    total_xp: userXp,
                    streak_days: null,
                    position: 1,
                    isMe: true,
                }]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchLeaderboard();
        return () => { cancelled = true; };
    }, [userXp, userName, userPhoto]);

    const FILTERS = [
        { key: "today" as const, label: t("today") },
        { key: "weekly" as const, label: t("week") },
        { key: "all" as const, label: t("allTime") },
    ];

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);
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
                <h2 className="text-xl font-bold text-gray-12 mb-3">{t("leaderboardTitle")}</h2>

                {/* Filter buttons */}
                <div className="relative flex p-1 bg-gray-3/50 rounded-xl border border-gray-5/30">
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

            {/* Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        className="w-6 h-6 rounded-full border-2 border-[#E80000] border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-7">
                    <span className="text-3xl mb-3">🏆</span>
                    <p className="text-sm font-medium">No entries yet</p>
                    <p className="text-xs text-gray-6 mt-1">Complete tasks to appear here!</p>
                </div>
            ) : (
                <>
                    {/* Podium */}
                    {top3.length >= 3 && (
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
                                const isMe = user.isMe;
                                const xp = user.total_xp ?? 0;
                                const level = getLevelProgress(xp).level;
                                const rankInfo = getRankForLevel(level);
                                const heights = [85, 110, 70];
                                const avatarSize = rank === 1 ? 52 : rank === 2 ? 44 : 40;

                                return (
                                    <motion.div
                                        key={user.whop_user_id}
                                        className="flex flex-col items-center flex-1"
                                        initial={{ opacity: 0, y: 25 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + visualIdx * 0.1, duration: 0.5, ease: "easeOut" }}
                                    >
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

                                        <div
                                            className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                            style={{
                                                width: avatarSize,
                                                height: avatarSize,
                                                background: "var(--gray-3)",
                                                border: "1.5px solid var(--gray-5)",
                                            }}
                                        >
                                            {isMe && userPhoto ? (
                                                <img src={userPhoto} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                            ) : user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                            ) : (
                                                <svg width={avatarSize * 0.4} height={avatarSize * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            )}
                                        </div>

                                        <p className={`text-[11px] font-bold truncate max-w-full mt-1.5 ${isMe ? "text-[#FF2D2D]" : "text-gray-11"}`}>
                                            {user.display_name || "User"}
                                        </p>

                                        <div className="flex items-center gap-1 mt-0.5">
                                            <RankBadge colors={rankInfo.tier.gradient} glowColor={rankInfo.tier.glowColor} tierName={rankInfo.tier.name} size={16} />
                                            <span className="text-[9px] text-gray-8 font-medium tabular-nums">
                                                {(xp / 1000).toFixed(1)}k
                                            </span>
                                        </div>

                                        <motion.div
                                            className={`w-full mt-2 rounded-t-xl flex items-start justify-center pt-3 ${rank === 1 ? "optiz-gradient-bg" : "bg-gray-4/70"}`}
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
                    )}

                    {/* List */}
                    <div className="space-y-1">
                        {rest.map((user, idx) => {
                            const isMe = user.isMe;
                            const xp = user.total_xp ?? 0;
                            const level = getLevelProgress(xp).level;
                            const rankInfo = getRankForLevel(level);

                            return (
                                <motion.div
                                    key={user.whop_user_id}
                                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl ${isMe
                                        ? "bg-gray-3/50 border border-gray-5/40"
                                        : "bg-gray-3/15 border border-gray-5/20 hover:bg-gray-3/30"
                                        } transition-colors`}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.04, duration: 0.3, ease: "easeOut" }}
                                    whileHover={{ scale: 1.005 }}
                                >
                                    <span className="text-[12px] font-bold text-gray-7 w-5 text-center tabular-nums">{user.position}</span>

                                    <div
                                        className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                        style={{
                                            background: "var(--gray-4)",
                                            border: "1px solid var(--gray-5)",
                                        }}
                                    >
                                        {isMe && userPhoto ? (
                                            <img src={userPhoto} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                        ) : user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
                                        ) : (
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-7">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-semibold truncate ${isMe ? "text-[#FF2D2D]" : "text-gray-12"}`}>
                                            {user.display_name || "User"}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <RankBadge colors={rankInfo.tier.gradient} glowColor={rankInfo.tier.glowColor} tierName={rankInfo.tier.name} size={12} />
                                            <span className="text-[9px] font-medium" style={{ color: rankInfo.tier.color }}>
                                                {t("lvl")} {level}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-[12px] font-bold tabular-nums text-gray-11">{xp.toLocaleString()}</span>
                                        <span className="text-[9px] font-extrabold text-[#E80000] ml-1">{t("xpLabel")}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
