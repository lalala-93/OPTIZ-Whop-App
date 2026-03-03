"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Crown, Flame, Quote, Trophy } from "lucide-react";
import { XPRing } from "./XPRing";
import type { RankTier } from "./rankSystem";
import { MOTIVATIONAL_QUOTES, getLevelProgress, getRankForLevel } from "./rankSystem";
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

function RankIcon({ level }: { level: number }) {
  const rank = getRankForLevel(level);
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full border"
      style={{
        borderColor: `${rank.tier.color}66`,
        background: `${rank.tier.color}22`,
        color: rank.tier.color,
      }}
      aria-label={rank.fullName}
      title={rank.fullName}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
      </svg>
    </span>
  );
}

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
  onXpRingClick,
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

        setEntries(merged.slice(0, 10));
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
  const podium = entries.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <motion.div className="flex flex-col items-center pt-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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

      <motion.section
        className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Flame size={15} className="text-[#FF6D6D]" /> Streak
          </p>
          <p className="text-[12px] text-gray-8">Momentum actif</p>
        </div>
        <p className="mt-2 text-[28px] leading-none font-semibold text-gray-12 tabular-nums">{streakDays} jour{streakDays > 1 ? "s" : ""}</p>
        <p className="mt-1 text-[12px] text-gray-8">Continue a valider au moins une action utile chaque jour.</p>
      </motion.section>

      <motion.section
        className="rounded-2xl border border-gray-5/40 bg-gray-3/22 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Trophy size={16} /> Leaderboard
          </h3>
          <span className="text-[11px] text-gray-8">Classement global</span>
        </div>

        {loadingLeaderboard ? (
          <div className="h-16 rounded-xl bg-gray-4/30 border border-gray-5/25 animate-pulse" />
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2.5">
              {podium.map((entry) => {
                const xp = entry.total_xp ?? 0;
                const entryLevel = getLevelProgress(xp).level;
                return (
                  <div
                    key={`podium-${entry.whop_user_id}`}
                    className={`min-w-[140px] rounded-full border px-2.5 py-1.5 inline-flex items-center gap-2 ${
                      entry.position === 1
                        ? "border-[#E80000]/40 bg-[#E80000]/12"
                        : "border-gray-5/30 bg-gray-2/55"
                    }`}
                  >
                    <span className="w-5 text-[11px] font-semibold text-gray-8">#{entry.position}</span>
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-5/35 bg-gray-4/35 flex items-center justify-center">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-gray-8">?</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-gray-12 font-semibold truncate">{entry.display_name || "User"}</p>
                      <p className="text-[10px] text-gray-8">Lvl {entryLevel}</p>
                    </div>
                    {entry.position === 1 ? <Crown size={13} className="text-[#FF6666] shrink-0" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              {entries.map((entry) => {
                const xp = entry.total_xp ?? 0;
                const entryLevel = getLevelProgress(xp).level;
                return (
                  <div
                    key={entry.whop_user_id}
                    className={`rounded-full border px-3 py-2 flex items-center gap-2.5 ${
                      entry.isMe ? "border-[#E80000]/45 bg-[#E80000]/12" : "border-gray-5/25 bg-gray-2/55"
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
                      <p className={`text-[13px] font-semibold truncate inline-flex items-center gap-1.5 ${entry.isMe ? "text-[#FF6D6D]" : "text-gray-12"}`}>
                        <RankIcon level={entryLevel} />
                        {entry.display_name || "User"}
                      </p>
                      <p className="text-[10px] text-gray-8">Lvl {entryLevel}</p>
                    </div>

                    <p className="text-[12px] font-semibold text-gray-10 tabular-nums">{xp}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.section>

      <motion.div
        className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <p className="text-[15px] text-gray-12 font-semibold inline-flex items-center gap-1.5 mb-2">
          <Quote size={14} /> Citation
        </p>
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
