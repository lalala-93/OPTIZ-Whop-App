"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Quote, RefreshCw } from "lucide-react";
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

/* ── Inline Rank Icon ── */
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

/* ══════════════════════════════════════════════════
   Section 2 — Streak Calendar
   ══════════════════════════════════════════════════ */
function StreakCalendar({
  streakDays,
}: {
  streakDays: number;
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

  // Streak active dates — consecutive days ending at today
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

  // Compact 7-day view (last 7 days)
  const compactDays = useMemo(() => {
    const days: { date: Date; label: string; dayNum: number; isToday: boolean; active: boolean }[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      days.push({
        date: d,
        label: dayLabels[dayIdx],
        dayNum: d.getDate(),
        isToday: i === 0,
        active: streakDates.has(dateStr),
      });
    }
    return days;
  }, [today, streakDates, dayLabels]);

  // Full month calendar
  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cells: { day: number; dateStr: string; inMonth: boolean; isToday: boolean; active: boolean }[] = [];
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

  const navigateMonth = useCallback((delta: number) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }, []);

  return (
    <motion.section
      className="rounded-2xl border border-gray-5/50 bg-gray-2/80 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 pt-4 pb-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E80000]/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF6666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-12">{t("homeActivity")}</span>
          <span className="text-[13px] font-bold text-[#FF6D6D] tabular-nums">{streakDays}d</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-gray-7" />
        </motion.div>
      </button>

      {/* ── Compact: last 7 days ── */}
      {!expanded && (
        <div className="px-3 pb-4">
          <div className="flex items-center justify-between">
            {compactDays.map((day, i) => (
              <div key={day.date.toISOString()} className="flex flex-col items-center gap-1.5 flex-1">
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${day.isToday ? "text-gray-12" : "text-gray-7"}`}>
                  {day.label}
                </span>
                <motion.div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    day.active
                      ? "bg-[#E80000] text-white"
                      : day.isToday
                        ? "ring-2 ring-[#E80000]/40 bg-[#E80000]/8 text-gray-11"
                        : "bg-gray-4/40 text-gray-7"
                  }`}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 20 }}
                >
                  {day.active ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    day.dayNum
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expanded: full month calendar ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="w-8 h-8 rounded-full bg-gray-4/40 flex items-center justify-center text-gray-8 hover:text-gray-12 active:scale-90 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[14px] font-semibold text-gray-12">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="w-8 h-8 rounded-full bg-gray-4/40 flex items-center justify-center text-gray-8 hover:text-gray-12 active:scale-90 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day column headers */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {dayLabels.map((d) => (
                  <span key={d} className="text-[9px] font-semibold text-gray-6 text-center uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar grid — rounded circles */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarGrid.map((cell, i) => (
                  <div key={`${cell.dateStr || `e${i}`}`} className="flex items-center justify-center py-1">
                    {cell.inMonth ? (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium transition-all ${
                          cell.active
                            ? "bg-[#E80000] text-white font-bold"
                            : cell.isToday
                              ? "ring-2 ring-[#E80000]/35 bg-[#E80000]/6 text-gray-12 font-semibold"
                              : "text-gray-8"
                        }`}
                      >
                        {cell.day}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-gray-7">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E80000]" />
                  <span>{t("homeStreak")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-1.5 ring-[#E80000]/35 bg-[#E80000]/6" />
                  <span>{t("homeToday")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════
   Section 3 — Leaderboard
   ══════════════════════════════════════════════════ */

const PODIUM_THEMES = {
  1: {
    accent: "#FFD700",
    accentLight: "#FFF1B8",
    gradientFrom: "rgba(255,215,0,0.12)",
    gradientTo: "rgba(255,215,0,0.02)",
    border: "rgba(255,215,0,0.35)",
    glow: "0 0 20px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,215,0,0.1)",
    badgeBg: "linear-gradient(135deg, #D4A017 0%, #FFD700 50%, #D4A017 100%)",
    badgeShadow: "0 2px 8px rgba(255,215,0,0.3)",
    wingColor: "#D4A017",
    wingHighlight: "#FFD700",
  },
  2: {
    accent: "#B0B0B0",
    accentLight: "#E0E0E0",
    gradientFrom: "rgba(176,176,176,0.08)",
    gradientTo: "rgba(176,176,176,0.01)",
    border: "rgba(176,176,176,0.25)",
    glow: "0 0 16px rgba(176,176,176,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
    badgeBg: "linear-gradient(135deg, #7A7A7A 0%, #B0B0B0 50%, #8A8A8A 100%)",
    badgeShadow: "0 2px 6px rgba(176,176,176,0.2)",
    wingColor: "#8A8A8A",
    wingHighlight: "#C0C0C0",
  },
  3: {
    accent: "#CD7F32",
    accentLight: "#E8B87A",
    gradientFrom: "rgba(205,127,50,0.08)",
    gradientTo: "rgba(205,127,50,0.01)",
    border: "rgba(205,127,50,0.25)",
    glow: "0 0 16px rgba(205,127,50,0.05), inset 0 1px 0 rgba(205,127,50,0.08)",
    badgeBg: "linear-gradient(135deg, #8B5E3C 0%, #CD7F32 50%, #8B5E3C 100%)",
    badgeShadow: "0 2px 6px rgba(205,127,50,0.2)",
    wingColor: "#8B5E3C",
    wingHighlight: "#CD7F32",
  },
} as const;

/* Multi-feather wing SVG — detailed and elegant */
function PodiumWing({ color, highlight, side }: { color: string; highlight: string; side: "left" | "right" }) {
  const flip = side === "right";
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${side === "left" ? "-left-2.5" : "-right-2.5"}`}
      style={{ transform: `translateY(-50%) ${flip ? "scaleX(-1)" : ""}` }}
    >
      <svg width="28" height="48" viewBox="0 0 28 48" fill="none">
        {/* Outer feather */}
        <path
          d="M28 24C28 24 24 10 14 3C14 3 18 14 8 24C18 34 14 45 14 45C24 38 28 24 28 24Z"
          fill={color}
          opacity="0.35"
        />
        {/* Inner feather */}
        <path
          d="M28 24C28 24 25 14 18 8C18 8 20 16 14 24C20 32 18 40 18 40C25 34 28 24 28 24Z"
          fill={highlight}
          opacity="0.25"
        />
        {/* Center vein */}
        <path
          d="M28 24C26 18 22 12 18 8"
          stroke={highlight}
          strokeWidth="0.6"
          opacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M28 24C26 30 22 36 18 40"
          stroke={highlight}
          strokeWidth="0.6"
          opacity="0.4"
          strokeLinecap="round"
        />
        {/* Feather detail lines */}
        <path d="M22 14L16 20" stroke={highlight} strokeWidth="0.3" opacity="0.3" />
        <path d="M22 34L16 28" stroke={highlight} strokeWidth="0.3" opacity="0.3" />
      </svg>
    </div>
  );
}

/* Position number badge with metallic gradient */
function PositionBadge({ position }: { position: number }) {
  const theme = PODIUM_THEMES[position as 1 | 2 | 3];
  if (theme) {
    return (
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
        style={{
          background: theme.badgeBg,
          boxShadow: theme.badgeShadow,
          color: position === 1 ? "#1A1000" : "#FFF",
          border: `1px solid ${theme.accent}40`,
        }}
      >
        {position}
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full bg-gray-4/40 border border-gray-5/30 flex items-center justify-center text-[11px] font-semibold text-gray-8 shrink-0 tabular-nums">
      {position}
    </span>
  );
}

/* Podium card wrapper — handles gradient border, glow, shimmer for top 3 */
function PodiumCard({
  position,
  isMe,
  children,
}: {
  position: number;
  isMe: boolean;
  children: React.ReactNode;
}) {
  const theme = PODIUM_THEMES[position as 1 | 2 | 3];
  if (!theme) {
    return (
      <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 ${
        isMe ? "bg-gray-3/50 border border-gray-5/40" : "border border-transparent hover:bg-gray-3/20"
      }`}>
        {children}
      </div>
    );
  }

  const isMePodium = isMe && position <= 3;

  return (
    <div className="relative">
      {/* Wings */}
      <PodiumWing color={theme.wingColor} highlight={theme.wingHighlight} side="left" />
      <PodiumWing color={theme.wingColor} highlight={theme.wingHighlight} side="right" />

      {/* Card with gradient border via wrapper technique */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          padding: "1px",
          background: isMePodium
            ? `linear-gradient(135deg, ${theme.accent}90, ${theme.accent}30, ${theme.accent}60)`
            : `linear-gradient(135deg, ${theme.border}, transparent, ${theme.border})`,
        }}
      >
        {/* Inner card */}
        <div
          className="relative rounded-[11px] px-3 py-2.5 flex items-center gap-2.5 overflow-hidden"
          style={{
            background: isMePodium
              ? `linear-gradient(135deg, ${theme.gradientFrom.replace(/[\d.]+\)$/, "0.18)")}, rgba(20,20,20,0.95))`
              : `linear-gradient(135deg, ${theme.gradientFrom}, rgba(20,20,20,0.95))`,
            boxShadow: theme.glow,
          }}
        >
          {/* Top edge highlight — simulates metallic rim light */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}30, transparent)` }}
          />

          {/* Shimmer sweep for #1 only */}
          {position === 1 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.06) 45%, rgba(255,215,0,0.1) 50%, rgba(255,215,0,0.06) 55%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

/* Trophy icon */
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 9H3.5C3.5 9 3 9 3 9.5C3 12 4.5 13.5 6 14" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 9H20.5C20.5 9 21 9 21 9.5C21 12 19.5 13.5 18 14" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 4H18V11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11V4Z" fill="#FFD700" fillOpacity="0.15" stroke="#FFD700" strokeWidth="1.5" />
      <path d="M10 20H14" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17V20" stroke="#FFD700" strokeWidth="1.5" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   Main HomeScreen
   ══════════════════════════════════════════════════ */
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

        if (!rows.some((row) => row.whop_user_id === userId)) {
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

        setEntries(rows);
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
    <div className="flex flex-col gap-4 pb-8">
      {/* ── Section 1: Rank Ring ── */}
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

        <div className="text-center mt-2">
          <h2 className="text-[28px] font-semibold text-gray-12 tracking-tight leading-tight">
            {t("level")} <span style={{ color: rankColors[1] }}>{level}</span>
          </h2>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: rankColors[0] }}>
            {translatedRank}
          </p>
        </div>
      </motion.div>

      {/* ── Section 2: Streak Calendar ── */}
      <StreakCalendar streakDays={streakDays} />

      {/* ── Section 4: Quote ── */}
      <motion.section
        className="rounded-2xl border border-gray-5/50 bg-gray-2/80 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[15px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
            <Quote size={14} className="text-gray-8" /> {t("homeQuote")}
          </p>
          <motion.button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
            className="w-8 h-8 rounded-full bg-gray-4/40 flex items-center justify-center text-gray-7 hover:text-gray-12 active:scale-90 transition-all"
            whileTap={{ scale: 0.85, rotate: 180 }}
          >
            <RefreshCw size={13} />
          </motion.button>
        </div>
        <p className="text-[13px] text-gray-11 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
        <p className="text-[10px] text-gray-7 mt-1.5">{quote.author}</p>
      </motion.section>

      {/* ── Section 3: Leaderboard ── */}
      <motion.section
        className="rounded-2xl border border-gray-5/50 bg-gray-2/80 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-2">
            <TrophyIcon /> {t("homeLeaderboard")}
          </h3>
          <span className="text-[11px] text-gray-7">{t("homeGlobalRanking")}</span>
        </div>

        {loadingLeaderboard ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] rounded-xl bg-gray-4/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry) => {
              const xp = entry.total_xp ?? 0;
              const entryLevel = getLevelProgress(xp).level;
              const isTop3 = entry.position <= 3;

              const cardContent = (
                <>
                  <PositionBadge position={entry.position} />

                  <div
                    className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
                      isTop3 ? "border-2" : "border border-gray-5/30 bg-gray-4/40"
                    }`}
                    style={isTop3 ? {
                      borderColor: PODIUM_THEMES[entry.position as 1 | 2 | 3]?.accent + "40",
                      background: `${PODIUM_THEMES[entry.position as 1 | 2 | 3]?.gradientFrom}`,
                    } : undefined}
                  >
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isTop3 ? PODIUM_THEMES[entry.position as 1 | 2 | 3]?.accent : "currentColor"} className={isTop3 ? undefined : "text-gray-7"}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className={`text-[13px] font-semibold truncate ${
                      entry.isMe && isTop3 ? "text-[#FF8A8A]" : entry.isMe ? "text-gray-12" : "text-gray-12"
                    }`}>
                      {entry.display_name || t("anonymousUser")}
                    </p>
                    <InlineRankIcon level={entryLevel} size={18} />
                  </div>

                  <div className="flex items-baseline gap-0.5 shrink-0">
                    <p className={`text-[13px] font-bold tabular-nums ${isTop3 ? "text-gray-12" : "text-gray-10"}`}>
                      {formatNumber(xp)}
                    </p>
                    <span className="text-[9px] font-extrabold text-[#E80000]">XP</span>
                  </div>
                </>
              );

              return (
                <motion.div
                  key={entry.whop_user_id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.position * 0.035 }}
                >
                  <PodiumCard position={entry.position} isMe={!!entry.isMe}>
                    {cardContent}
                  </PodiumCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

    </div>
  );
}
