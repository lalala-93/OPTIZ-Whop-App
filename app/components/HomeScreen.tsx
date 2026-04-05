"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Quote, RefreshCw, User } from "lucide-react";
import { XPRing } from "./XPRing";
import type { RankTier } from "./rankSystem";
import { MOTIVATIONAL_QUOTES, getLevelProgress, getRankForLevel, getRankNameKey, formatNumber } from "./rankSystem";
import { RankBadge } from "./RankBadge";
import { getLeaderboard } from "@/lib/actions";
import { useI18n } from "./i18n";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
  onStartTraining?: () => void;
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-gray-5/50 bg-gray-2/80">
        <CardHeader className="p-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 pt-4 pb-3"
          >
            <div className="flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#E80000" fillOpacity="0.15" />
              </svg>
              <span className="text-[15px] font-semibold text-gray-12">{t("homeActivity")}</span>
              <Badge variant="destructive" className="px-1.5 py-0 text-[11px] font-bold tabular-nums bg-[#E80000]/15 text-[#FF6D6D] border-[#E80000]/20 hover:bg-[#E80000]/15">
                {streakDays}d
              </Badge>
            </div>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} className="text-gray-7" />
            </motion.div>
          </button>
        </CardHeader>

        <CardContent className="p-0">
          {/* ── Compact: last 7 days ── */}
          {!expanded && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {compactDays.map((day, i) => (
                  <div key={day.date.toISOString()} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      day.isToday ? "text-gray-12" : "text-gray-7"
                    )}>
                      {day.label}
                    </span>
                    <motion.div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                        day.active
                          ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.3)]"
                          : day.isToday
                            ? "ring-2 ring-[#E80000]/40 bg-[#E80000]/8 text-gray-11"
                            : "bg-gray-3 border border-gray-5/30 text-gray-7"
                      )}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {day.active ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth(-1)}
                      className="h-8 w-8 rounded-full text-gray-8 hover:text-gray-12"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-[14px] font-semibold text-gray-12">{monthLabel}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth(1)}
                      className="h-8 w-8 rounded-full text-gray-8 hover:text-gray-12"
                    >
                      <ChevronRight size={16} />
                    </Button>
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
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium transition-all",
                              cell.active
                                ? "bg-[#E80000] text-white font-bold"
                                : cell.isToday
                                  ? "ring-2 ring-[#E80000]/35 bg-[#E80000]/6 text-gray-12 font-semibold"
                                  : "text-gray-8"
                            )}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   Section 3 — Leaderboard
   ══════════════════════════════════════════════════ */

const PODIUM_COLORS = {
  1: { accent: "#FFD700", bg: "rgba(255,215,0,0.06)", border: "rgba(255,215,0,0.15)" },
  2: { accent: "#B0B0B0", bg: "rgba(176,176,176,0.04)", border: "rgba(176,176,176,0.12)" },
  3: { accent: "#CD7F32", bg: "rgba(205,127,50,0.04)", border: "rgba(205,127,50,0.12)" },
} as const;

/* Position number badge — using shadcn Badge */
function PositionBadge({ position }: { position: number }) {
  const theme = PODIUM_COLORS[position as 1 | 2 | 3];
  if (theme) {
    return (
      <Badge
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 px-0 py-0 border-0"
        style={{ background: theme.accent, color: position === 1 ? "#1A1000" : "#FFF" }}
      >
        {position}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 px-0 py-0 bg-gray-4/50 text-gray-8 border-0 tabular-nums"
    >
      {position}
    </Badge>
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
  onStartTraining,
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
      <div className="flex flex-col items-center pt-1 animate-fade-in">
        <div>
          <XPRing
            progressPercent={progressPercent}
            currentXp={currentLevelXp}
            xpForNextLevel={xpForNextLevel}
            totalXp={totalXp}
            tier={tier}
            rankColors={rankColors}
            size={182}
            onClick={onXpRingClick}
          />
        </div>

        <div className="text-center mt-2">
          <h2 className="text-[28px] font-semibold text-gray-12 tracking-tight leading-tight">
            {t("level")} <span style={{ color: rankColors[1] }}>{level}</span>
          </h2>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: rankColors[0] }}>
            {translatedRank}
          </p>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-2">
        <button
          type="button"
          onClick={() => onStartTraining?.()}
          className="w-full h-11 rounded-xl bg-[#E80000] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {t("homeStartTraining") || "Start Training"}
        </button>
      </div>

      {/* ── Section 2: Streak Calendar ── */}
      <StreakCalendar streakDays={streakDays} />

      {/* ── Section 4: Quote ── */}
      <div className="animate-fade-in">
        <Card className="border-gray-5/50 bg-gray-2/80 border-l-[3px] border-l-gray-6">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2.5">
            <p className="text-[15px] text-gray-12 font-semibold inline-flex items-center gap-1.5">
              <Quote size={15} className="text-gray-8" />
              {t("homeQuote")}
            </p>
            <button
              type="button"
              onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
              className="h-8 w-8 rounded-full text-gray-7 hover:text-gray-12 inline-flex items-center justify-center active:scale-90 transition-transform"
            >
              <RefreshCw size={13} />
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-[13px] text-gray-11 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
            <p className="text-[10px] text-gray-7 mt-1.5">{quote.author}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3: Leaderboard ── */}
      <div className="animate-fade-in">
        <Card className="border-gray-5/50 bg-gray-2/80">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
            <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-1.5">
              <TrophyIcon />
              {t("homeLeaderboard")}
            </h3>
            <span className="text-[11px] text-gray-7">{t("homeGlobalRanking")}</span>
          </CardHeader>

          <CardContent className="p-4 pt-4">
            {loadingLeaderboard ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[52px] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {entries.map((entry) => {
                  const xp = entry.total_xp ?? 0;
                  const entryLevel = getLevelProgress(xp).level;
                  const isTop3 = entry.position <= 3;
                  const showSeparator = entry.position === 4 && entries.some((e) => e.position <= 3);

                  const podiumColor = PODIUM_COLORS[entry.position as 1 | 2 | 3];

                  return (
                    <div key={entry.whop_user_id}>
                      {showSeparator && <Separator className="my-2 bg-gray-5/20" />}
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-gray-3/40",
                          entry.isMe
                            ? "bg-gray-3/60 border border-gray-5/40"
                            : isTop3
                              ? "border border-transparent"
                              : "border border-transparent"
                        )}
                        style={isTop3 && !entry.isMe ? { background: podiumColor?.bg } : undefined}
                      >
                        <PositionBadge position={entry.position} />

                        <Avatar className="h-8 w-8 border border-gray-5/20">
                          <AvatarImage src={entry.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-gray-4/40">
                            <User size={16} className="text-gray-7" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          <p className={cn(
                            "text-[13px] font-semibold truncate",
                            entry.isMe ? "text-gray-12" : "text-gray-11"
                          )}>
                            {entry.display_name || t("anonymousUser")}
                          </p>
                          <InlineRankIcon level={entryLevel} size={16} />
                        </div>

                        <div className="flex items-baseline gap-0.5 shrink-0">
                          <p className="text-[13px] font-bold tabular-nums text-gray-11">
                            {formatNumber(xp)}
                          </p>
                          <Badge variant="outline" className="px-1 py-0 text-[9px] font-extrabold bg-[#E80000]/12 text-[#FF6666] border-[#E80000]/20 hover:bg-[#E80000]/12">
                            XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
