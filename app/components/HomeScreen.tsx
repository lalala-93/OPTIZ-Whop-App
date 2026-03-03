"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { XPRing } from "./XPRing";
import { StreakDisplay } from "./StreakDisplay";
import type { RankTier } from "./rankSystem";
import { MOTIVATIONAL_QUOTES, getLevelProgress } from "./rankSystem";
import { getLeaderboard } from "@/lib/actions";
import { useI18n } from "./i18n";

interface HomeScreenProps {
  userId: string;
  userName: string;
  userPhoto: string | null;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
  tier: RankTier;
  rankFullName: string;
  rankColors: [string, string];
  streakDays: number;
  weeklyProgress: boolean[];
  onXpRingClick?: () => void;
  onOpenLeaderboard: () => void;
}

interface LeaderboardRow {
  whop_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number | null;
  position: number;
  isMe?: boolean;
}

const BOT_ROWS: LeaderboardRow[] = [
  { whop_user_id: "bot-hakim", display_name: "Hakim Zwar", avatar_url: "/HakimProfil.jpg", total_xp: 4200, position: 0 },
  { whop_user_id: "bot-amen", display_name: "Amen", avatar_url: "/AmenProfil.jpg", total_xp: 2800, position: 0 },
  { whop_user_id: "bot-isaac", display_name: "Isaac", avatar_url: "/Isaac.jpg", total_xp: 900, position: 0 },
];

export function HomeScreen({
  userId,
  userName,
  userPhoto,
  level,
  totalXp,
  currentLevelXp,
  xpForNextLevel,
  progressPercent,
  tier,
  rankFullName,
  rankColors,
  streakDays,
  weeklyProgress,
  onXpRingClick,
  onOpenLeaderboard,
}: HomeScreenProps) {
  const { t } = useI18n();
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length);
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let canceled = false;

    startTransition(async () => {
      try {
        const data = await getLeaderboard(userId);
        if (canceled) return;

        const rows: LeaderboardRow[] = (data.leaderboard || []).map((item) => ({
          whop_user_id: item.whop_user_id,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
          total_xp: item.total_xp,
          position: item.position,
          isMe: item.whop_user_id === userId,
        }));

        if (!rows.some((row) => row.whop_user_id === userId) && totalXp > 0) {
          rows.push({
            whop_user_id: userId,
            display_name: userName,
            avatar_url: userPhoto,
            total_xp: totalXp,
            position: rows.length + 1,
            isMe: true,
          });
        }

        const merged = [...rows, ...BOT_ROWS];
        merged.sort((a, b) => (b.total_xp ?? 0) - (a.total_xp ?? 0));
        merged.forEach((row, idx) => {
          row.position = idx + 1;
        });

        setEntries(merged.slice(0, 5));
      } catch (error) {
        console.error("Failed to load leaderboard preview", error);
      } finally {
        if (!canceled) setLoadingLeaderboard(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, [totalXp, userId, userName, userPhoto, startTransition]);

  const quote = useMemo(() => MOTIVATIONAL_QUOTES[quoteIndex], [quoteIndex]);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <motion.div
        className="flex flex-col items-center pt-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <XPRing
          progressPercent={progressPercent}
          currentXp={currentLevelXp}
          xpForNextLevel={xpForNextLevel}
          tier={tier}
          rankColors={rankColors}
          size={182}
          onClick={onXpRingClick}
        />
        <div className="text-center mt-2.5">
          <h2 className="text-[30px] font-semibold text-gray-12 tracking-tight">
            {t("level")} <span style={{ color: rankColors[1] }}>{level}</span>
          </h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: rankColors[0] }}>
            {rankFullName}
          </p>
        </div>
      </motion.div>

      <StreakDisplay streakDays={streakDays} weeklyProgress={weeklyProgress} />

      <motion.div
        className="rounded-2xl border border-gray-5/40 bg-gray-3/22 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Trophy size={16} /> {t("leaderboardSnapshot")}
          </h3>
          <button
            onClick={onOpenLeaderboard}
            className="text-[12px] font-semibold text-[#FF6666] hover:text-[#FF7E7E]"
          >
            {t("openCta")}
          </button>
        </div>

        {loadingLeaderboard ? (
          <div className="h-16 rounded-xl bg-gray-4/30 border border-gray-5/25 animate-pulse" />
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry) => {
              const xp = entry.total_xp ?? 0;
              const entryLevel = getLevelProgress(xp).level;
              return (
                <div
                  key={entry.whop_user_id}
                  className={`rounded-xl border px-3 py-2 flex items-center gap-2.5 ${
                    entry.isMe ? "border-[#E80000]/35 bg-[#E80000]/10" : "border-gray-5/25 bg-gray-2/55"
                  }`}
                >
                  <span className="w-6 text-[12px] text-gray-8 font-semibold tabular-nums">{entry.position}</span>

                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-5/35 bg-gray-4/35 flex items-center justify-center">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-8">?</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${entry.isMe ? "text-[#FF6D6D]" : "text-gray-12"}`}>
                      {entry.display_name || "User"}
                    </p>
                    <p className="text-[10px] text-gray-8">Lvl {entryLevel}</p>
                  </div>

                  {entry.position === 1 ? <Crown size={14} className="text-[#FF6767]" /> : null}

                  <p className="text-[12px] font-semibold text-gray-10 tabular-nums">{xp}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div
        className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <p className="text-[13px] text-gray-11 italic leading-relaxed">"{quote.text}"</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-gray-7">{quote.author}</p>
          <button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
            className="text-[11px] font-semibold text-gray-8 hover:text-gray-12"
          >
            {t("newQuote")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
