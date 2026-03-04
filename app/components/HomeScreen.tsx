"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Crown, Quote, RefreshCw, Trophy } from "lucide-react";
import { XPRing } from "./XPRing";
import type { RankTier } from "./rankSystem";
import { MOTIVATIONAL_QUOTES, getLevelProgress, getRankForLevel, getRankNameKey, formatNumber } from "./rankSystem";
import { RankBadge } from "./RankBadge";
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

/* ── Inline Rank Icon (real tier badge, small) ── */
function InlineRankIcon({ level, size = 20 }: { level: number; size?: number }) {
  const rank = getRankForLevel(level);
  return (
    <RankBadge
      colors={rank.tier.gradient}
      glowColor={rank.tier.glowColor}
      tierName={rank.tier.name}
      size={size}
    />
  );
}

/* ── Streak Calendar ── */
function StreakCalendar({
  streakDays,
  weeklyProgress,
}: {
  streakDays: number;
  weeklyProgress: boolean[];
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split("T")[0];

  const monthNames = useMemo(() => t("homeMonths").split(","), [t]);
  const dayLabels = useMemo(
    () => [
      t("dayShortMon"),
      t("dayShortTue"),
      t("dayShortWed"),
      t("dayShortThu"),
      t("dayShortFri"),
      t("dayShortSat"),
      t("dayShortSun"),
    ],
    [t],
  );

  // Compute streak active dates (consecutive days ending today or yesterday)
  const streakDates = useMemo(() => {
    const dates = new Set<string>();
    if (streakDays <= 0) return dates;
    const d = new Date(today);
    for (let i = 0; i < streakDays; i++) {
      dates.add(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() - 1);
    }
    return dates;
  }, [streakDays, today]);

  // Compact 3-day view
  const compactDays = useMemo(() => {
    const days: { date: Date; label: string; isToday: boolean; active: boolean }[] = [];
    for (let i = -2; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      days.push({
        date: d,
        label: i === 0 ? t("homeToday") : dayLabels[dayIdx],
        isToday: i === 0,
        active: streakDates.has(dateStr),
      });
    }
    return days;
  }, [today, streakDates, dayLabels, t]);

  // Full month calendar
  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cells: { day: number; dateStr: string; inMonth: boolean; isToday: boolean; active: boolean }[] = [];

    // Fill leading empties
    for (let i = 0; i < startDow; i++) {
      cells.push({ day: 0, dateStr: "", inMonth: false, isToday: false, active: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        dateStr,
        inMonth: true,
        isToday: dateStr === todayStr,
        active: streakDates.has(dateStr),
      });
    }

    return cells;
  }, [viewDate, todayStr, streakDates]);

  const monthLabel = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const navigateMonth = useCallback(
    (delta: number) => {
      setViewDate((prev) => {
        const next = new Date(prev);
        next.setMonth(next.getMonth() + delta);
        return next;
      });
    },
    [],
  );

  return (
    <motion.section
      className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#E80000]/12 border border-[#E80000]/20 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF6666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-12">{t("homeActivity")}</span>
          <span className="text-[12px] font-bold text-[#FF6D6D] tabular-nums">{streakDays}d</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-gray-8" />
        </motion.div>
      </button>

      {/* Compact 3-day view */}
      {!expanded && (
        <div className="flex items-center justify-center gap-4">
          {compactDays.map((day) => (
            <div key={day.date.toISOString()} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] font-semibold ${day.isToday ? "text-gray-12" : "text-gray-8"}`}>
                {day.label}
              </span>
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  day.active
                    ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.35)]"
                    : day.isToday
                      ? "border-2 border-[#E80000]/50 bg-[#E80000]/10 text-gray-11"
                      : "bg-gray-4 text-gray-7 border border-gray-5"
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {day.active ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  day.date.getDate()
                )}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded full calendar */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-lg bg-gray-4/50 flex items-center justify-center text-gray-9 hover:text-gray-12">
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-semibold text-gray-12">{monthLabel}</span>
              <button type="button" onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-lg bg-gray-4/50 flex items-center justify-center text-gray-9 hover:text-gray-12">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayLabels.map((d) => (
                <span key={d} className="text-[9px] font-semibold text-gray-7 text-center uppercase">
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((cell, i) => (
                <div
                  key={`${cell.dateStr || i}`}
                  className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium ${
                    !cell.inMonth
                      ? ""
                      : cell.active
                        ? "bg-[#E80000] text-white font-bold shadow-[0_0_8px_rgba(232,0,0,0.3)]"
                        : cell.isToday
                          ? "border border-[#E80000]/40 bg-[#E80000]/8 text-gray-12"
                          : "text-gray-9"
                  }`}
                >
                  {cell.inMonth ? cell.day : ""}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-8">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E80000]" />
                <span>{t("homeStreak")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-[#E80000]/40 bg-[#E80000]/8" />
                <span>{t("homeToday")}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ── Leaderboard Wings SVG for top 3 ── */
function WingDecoration({ position }: { position: number }) {
  if (position > 3) return null;
  const colors: Record<number, string> = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  };
  const color = colors[position] ?? "#9CA3AF";
  return (
    <div className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 flex justify-between">
      <svg width="22" height="32" viewBox="0 0 22 32" fill="none">
        <path d="M22 16C22 16 14 4 2 0C2 0 6 12 0 32C0 32 14 28 22 16Z" fill={color} />
      </svg>
      <svg width="22" height="32" viewBox="0 0 22 32" fill="none" className="scale-x-[-1]">
        <path d="M22 16C22 16 14 4 2 0C2 0 6 12 0 32C0 32 14 28 22 16Z" fill={color} />
      </svg>
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const colors: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: "bg-[#FFD700]/15", text: "text-[#FFD700]", border: "border-[#FFD700]/30" },
    2: { bg: "bg-[#C0C0C0]/15", text: "text-[#C0C0C0]", border: "border-[#C0C0C0]/30" },
    3: { bg: "bg-[#CD7F32]/15", text: "text-[#CD7F32]", border: "border-[#CD7F32]/30" },
  };
  const style = colors[position];
  if (style) {
    return (
      <span className={`w-7 h-7 rounded-full ${style.bg} border ${style.border} flex items-center justify-center text-[11px] font-bold ${style.text}`}>
        {position}
      </span>
    );
  }
  return (
    <span className="w-7 text-[12px] text-gray-8 font-semibold tabular-nums text-center">
      {position}
    </span>
  );
}

/* ── Main HomeScreen ── */
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

        rows.sort((a, b) => (b.total_xp ?? 0) - (a.total_xp ?? 0));
        rows.forEach((row, idx) => {
          row.position = idx + 1;
        });

        setEntries(rows.slice(0, 10));
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
  const translatedRank = t(getRankNameKey(tier.name) as Parameters<typeof t>[0]);

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Section 1: Rank Ring (subtle entrance animation) ── */}
      <motion.div
        className="flex flex-col items-center pt-1"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
        </motion.div>

        <div className="text-center mt-2.5">
          <h2 className="text-[30px] font-semibold text-gray-12 tracking-tight">
            {t("level")} <span style={{ color: rankColors[1] }}>{level}</span>
          </h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: rankColors[0] }}>
            {translatedRank}
          </p>
        </div>
      </motion.div>

      {/* ── Section 2: Streak Calendar ── */}
      <StreakCalendar streakDays={streakDays} weeklyProgress={weeklyProgress} />

      {/* ── Section 3: Leaderboard ── */}
      <motion.section
        className="rounded-2xl border border-gray-5/40 bg-gray-3/22 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
            <Trophy size={16} className="text-[#FFD700]" /> {t("homeLeaderboard")}
          </h3>
          <span className="text-[11px] text-gray-8">{t("homeGlobalRanking")}</span>
        </div>

        {loadingLeaderboard ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-4/30 border border-gray-5/25 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const xp = entry.total_xp ?? 0;
              const entryLevel = getLevelProgress(xp).level;
              const isTop3 = entry.position <= 3;

              return (
                <motion.div
                  key={entry.whop_user_id}
                  className={`relative rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-all ${
                    entry.isMe
                      ? "border-[#E80000]/45 bg-[#E80000]/8"
                      : isTop3
                        ? "border-gray-5/40 bg-gray-3/40"
                        : "border-gray-5/25 bg-gray-2/55"
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.position * 0.04 }}
                >
                  {isTop3 && <WingDecoration position={entry.position} />}

                  <PositionBadge position={entry.position} />

                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-5/35 bg-gray-4/35 flex items-center justify-center shrink-0">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-8">?</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className={`text-[13px] font-semibold truncate ${entry.isMe ? "text-[#FF6D6D]" : "text-gray-12"}`}>
                      {entry.display_name || t("anonymousUser")}
                    </p>
                    <InlineRankIcon level={entryLevel} size={18} />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <p className="text-[13px] font-bold text-gray-11 tabular-nums">{formatNumber(xp)}</p>
                    <span className="text-[9px] font-extrabold text-[#E80000]">XP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* ── Section 4: Quote ── */}
      <motion.div
        className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[15px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
            <Quote size={14} /> {t("homeQuote")}
          </p>
          <motion.button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
            className="w-8 h-8 rounded-full bg-gray-4/50 border border-gray-5/30 flex items-center justify-center text-gray-8 hover:text-gray-12 transition-all"
            whileTap={{ scale: 0.85, rotate: 180 }}
          >
            <RefreshCw size={13} />
          </motion.button>
        </div>
        <p className="text-[13px] text-gray-11 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
        <p className="text-[10px] text-gray-7 mt-1.5">{quote.author}</p>
      </motion.div>
    </div>
  );
}
