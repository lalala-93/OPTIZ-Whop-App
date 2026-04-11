"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Quote, RefreshCw, User } from "lucide-react";
import { XPRing } from "./XPRing";
import type { RankTier } from "./rankSystem";
import { MOTIVATIONAL_QUOTES, getRankNameKey, formatNumber } from "./rankSystem";
import { getLeaderboard, getLeaderboardPeriod } from "@/lib/actions";
import { useI18n } from "./i18n";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="animate-fade-in">
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
            <div className="transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown size={18} className="text-gray-7" />
            </div>
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
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                        day.active
                          ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.3)]"
                          : day.isToday
                            ? "ring-2 ring-[#E80000]/40 bg-[#E80000]/8 text-gray-11"
                            : "bg-gray-3 border border-gray-5/30 text-gray-7"
                      )}
                    >
                      {day.active ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        day.dayNum
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Expanded: full month calendar ── */}
          {expanded && (
              <div
                className="overflow-hidden animate-fade-in"
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
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Section 3 — Leaderboard
   ══════════════════════════════════════════════════ */

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

/* Podium slot for top 3 */
function PodiumSlot({
  entry,
  position,
  barHeight,
  crown,
}: {
  entry: LeaderboardRow;
  position: number;
  barHeight: number; // pixel height of the red bar
  crown?: boolean;
}) {
  const xp = entry.total_xp ?? 0;
  const shade = position === 1 ? "#E80000" : position === 2 ? "#C41818" : "#991818";
  const glow = position === 1 ? "0 0 20px rgba(232,0,0,0.5)" : "0 0 12px rgba(232,0,0,0.25)";

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[110px]">
      {/* Crown for #1 */}
      {crown && (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" className="-mb-0.5">
          <path d="M2 4 L6 8 L11 2 L16 8 L20 4 L18 14 L4 14 Z" fill="#FFD700" stroke="#FF8C00" strokeWidth="0.8" strokeLinejoin="round"/>
          <circle cx="4" cy="4" r="1.2" fill="#FFD700"/>
          <circle cx="11" cy="2" r="1.2" fill="#FFD700"/>
          <circle cx="18" cy="4" r="1.2" fill="#FFD700"/>
        </svg>
      )}

      {/* Avatar with red ring */}
      <div className="relative">
        <div
          className="rounded-full p-[2px]"
          style={{
            background: `linear-gradient(135deg, ${shade}, ${shade}99)`,
            boxShadow: glow,
          }}
        >
          <Avatar className={cn(
            "border border-black/20",
            position === 1 ? "h-14 w-14" : "h-12 w-12"
          )}>
            <AvatarImage src={entry.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-white/[0.04]">
              <User size={18} className="text-gray-7" />
            </AvatarFallback>
          </Avatar>
        </div>
        {/* Position badge */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white border-2 border-gray-1"
          style={{ background: shade, boxShadow: glow }}
        >
          {position}
        </div>
      </div>

      {/* Name */}
      <p className="text-[11px] font-semibold text-gray-12 truncate max-w-full mt-1 text-center">
        {entry.display_name || "..."}
      </p>

      {/* XP text */}
      <p className="text-[10px] font-bold tabular-nums text-[#FF6D6D] -mb-0.5">
        {formatNumber(xp)} XP
      </p>

      {/* Red bar — gradient from dark red at bottom to bright red at top */}
      <div
        className="w-full rounded-t-lg relative overflow-hidden"
        style={{
          height: `${barHeight}px`,
          background: `linear-gradient(to top, ${shade}, #FF2D2D)`,
          borderTop: `2px solid #FF5252`,
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.3), ${glow}`,
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />
        {/* Vertical shine line */}
        <div className="absolute left-1/4 inset-y-0 w-px bg-white/10" />
      </div>
    </div>
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
  const [period, setPeriod] = useState<"week" | "month" | "all">("all");

  useEffect(() => {
    let cancelled = false;
    setLoadingLeaderboard(true);

    const fetcher =
      period === "all"
        ? getLeaderboard(userId)
        : getLeaderboardPeriod(userId, period, 50);

    fetcher
      .then((data) => {
        if (cancelled) return;

        const rows: LeaderboardRow[] = (data.leaderboard || []).map((item) => ({
          whop_user_id: item.whop_user_id,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
          total_xp: item.total_xp,
          position: item.position,
          isMe: item.whop_user_id === userId,
        }));

        if (period === "all" && !rows.some((row) => row.whop_user_id === userId)) {
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
      })
      .catch((error) => {
        console.error("Failed to load leaderboard preview", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingLeaderboard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [totalXp, userId, userName, userPhoto, period]);

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
        <Card className="border-white/[0.06] bg-white/[0.03]">
          <CardHeader className="flex flex-col gap-3 p-4 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-12 inline-flex items-center gap-2">
                <TrophyIcon />
                {t("homeLeaderboard")}
              </h3>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {([
                { value: "week" as const, label: "Semaine" },
                { value: "month" as const, label: "Mois" },
                { value: "all" as const, label: "Global" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    "flex-1 h-8 rounded-md text-[11px] font-semibold transition-all",
                    period === opt.value
                      ? "bg-[#E80000] text-white shadow-[0_2px_8px_rgba(232,0,0,0.3)]"
                      : "text-gray-8 hover:text-gray-12"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-1">
            {loadingLeaderboard ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[52px] rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <TrophyIcon />
                </div>
                <p className="text-[13px] font-semibold text-gray-11">Pas encore de classement</p>
                <p className="text-[11px] text-gray-7 text-center">Sois le premier à gagner de l&apos;XP cette {period === "week" ? "semaine" : period === "month" ? "mois" : "période"}</p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {entries.length >= 3 && (
                  <div className="flex items-end justify-center gap-2 mb-5 pt-4 px-2">
                    {/* 2nd place — left, medium bar */}
                    <PodiumSlot
                      entry={entries[1]}
                      position={2}
                      barHeight={70}
                    />
                    {/* 1st place — center, tallest bar + crown */}
                    <PodiumSlot
                      entry={entries[0]}
                      position={1}
                      barHeight={100}
                      crown
                    />
                    {/* 3rd place — right, shortest bar */}
                    <PodiumSlot
                      entry={entries[2]}
                      position={3}
                      barHeight={50}
                    />
                  </div>
                )}

                {/* Rest 4-10 */}
                <div className="space-y-1.5">
                  {entries.slice(3, 10).map((entry) => {
                    const xp = entry.total_xp ?? 0;
                    const leaderXp = entries[0]?.total_xp ?? 1;
                    const xpPct = Math.max(5, (xp / leaderXp) * 100);
                    return (
                      <div
                        key={entry.whop_user_id}
                        className={cn(
                          "relative rounded-xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden",
                          entry.isMe
                            ? "bg-[#E80000]/8 border border-[#E80000]/20"
                            : "bg-white/[0.02] border border-white/[0.04]"
                        )}
                      >
                        {/* XP progress bar background */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/[0.02]"
                          style={{ width: `${xpPct}%` }}
                        />
                        <span className="relative w-5 text-[11px] font-bold text-gray-8 tabular-nums shrink-0">
                          {entry.position}
                        </span>
                        <Avatar className="relative h-7 w-7 border border-white/[0.06] shrink-0">
                          <AvatarImage src={entry.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-white/[0.04]">
                            <User size={14} className="text-gray-7" />
                          </AvatarFallback>
                        </Avatar>
                        <p className={cn(
                          "relative flex-1 min-w-0 text-[12px] font-semibold truncate",
                          entry.isMe ? "text-[#FF6D6D]" : "text-gray-11"
                        )}>
                          {entry.display_name || t("anonymousUser")}
                        </p>
                        <div className="relative flex items-baseline gap-0.5 shrink-0">
                          <p className="text-[12px] font-bold tabular-nums text-gray-11">
                            {formatNumber(xp)}
                          </p>
                          <span className="text-[8px] font-extrabold text-[#FF6D6D]">XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* "You are here" — outside top 10 */}
                {entries.length > 10 && !entries.slice(0, 10).some((e) => e.isMe) && entries.some((e) => e.isMe) && (() => {
                  const me = entries.find((e) => e.isMe)!;
                  return (
                    <>
                      <div className="text-center text-[10px] text-gray-7 my-2">•  •  •</div>
                      <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 bg-[#E80000]/8 border border-[#E80000]/20">
                        <span className="w-5 text-[11px] font-bold text-[#FF6D6D] tabular-nums shrink-0">
                          {me.position}
                        </span>
                        <Avatar className="h-7 w-7 border border-[#E80000]/30">
                          <AvatarImage src={me.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-[#E80000]/10">
                            <User size={14} className="text-[#FF6D6D]" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="flex-1 min-w-0 text-[12px] font-semibold truncate text-[#FF6D6D]">
                          {me.display_name || t("anonymousUser")}
                        </p>
                        <div className="flex items-baseline gap-0.5 shrink-0">
                          <p className="text-[12px] font-bold tabular-nums text-[#FF6D6D]">
                            {formatNumber(me.total_xp ?? 0)}
                          </p>
                          <span className="text-[8px] font-extrabold text-[#FF6D6D]">XP</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
