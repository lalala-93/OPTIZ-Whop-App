"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, Quote, RefreshCw, User, ArrowRight } from "lucide-react";
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

/* Trophy icon — red */
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 9H3.5C3.5 9 3 9 3 9.5C3 12 4.5 13.5 6 14" stroke="#E80000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 9H20.5C20.5 9 21 9 21 9.5C21 12 19.5 13.5 18 14" stroke="#E80000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 4H18V11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11V4Z" fill="#E80000" fillOpacity="0.15" stroke="#E80000" strokeWidth="1.5" />
      <path d="M10 20H14" stroke="#E80000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17V20" stroke="#E80000" strokeWidth="1.5" />
    </svg>
  );
}

/* Podium slot for top 3 — premium gamified */
function PodiumSlot({
  entry,
  position,
  barHeight,
  crown,
}: {
  entry: LeaderboardRow;
  position: number;
  barHeight: number;
  crown?: boolean;
}) {
  const xp = entry.total_xp ?? 0;
  const avatarSize = position === 1 ? "h-[72px] w-[72px]" : position === 2 ? "h-[60px] w-[60px]" : "h-[56px] w-[56px]";
  const badgeColor =
    position === 1 ? "#E80000" : position === 2 ? "#9CA3AF" : "#B45309";
  const rankFontSize =
    position === 1 ? "text-[56px]" : position === 2 ? "text-[44px]" : "text-[38px]";

  return (
    <div className="flex-1 flex flex-col items-center max-w-[115px]">
      {/* Crown for #1 */}
      <div className="h-5 mb-1 flex items-center justify-center">
        {crown && (
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <path
              d="M3 6 L8 12 L13 2 L18 12 L23 6 L21 18 L5 18 Z"
              fill="#FFD700"
              stroke="#B45309"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <circle cx="5" cy="6" r="1.5" fill="#FFF5CC" />
            <circle cx="13" cy="2" r="1.8" fill="#FFF5CC" />
            <circle cx="21" cy="6" r="1.5" fill="#FFF5CC" />
          </svg>
        )}
      </div>

      {/* Avatar */}
      <div className="relative mb-2">
        <Avatar className={cn(avatarSize, "border-2 border-white/[0.14] bg-white/[0.04]")}>
          <AvatarImage src={entry.avatar_url || undefined} alt="" />
          <AvatarFallback className="bg-white/[0.04]">
            <User size={position === 1 ? 28 : 22} className="text-gray-7" />
          </AvatarFallback>
        </Avatar>
        {/* Position medal */}
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white border-[3px] border-gray-1 shadow-md"
          style={{ background: badgeColor }}
        >
          {position}
        </div>
      </div>

      {/* Name */}
      <p className={cn(
        "font-semibold text-gray-12 truncate max-w-full text-center mt-1.5 leading-tight",
        position === 1 ? "text-[13px]" : "text-[12px]"
      )}>
        {entry.display_name || "..."}
      </p>

      {/* XP */}
      <p className={cn(
        "font-bold tabular-nums text-[#FF6D6D] leading-none mt-0.5 mb-2",
        position === 1 ? "text-[12px]" : "text-[11px]"
      )}>
        {formatNumber(xp)} XP
      </p>

      {/* Bar — gradient with depth + shine + rank number */}
      <div
        className="w-full rounded-t-lg relative overflow-hidden border-t border-x border-white/[0.08]"
        style={{
          height: `${barHeight}px`,
          background: "linear-gradient(to top, #7F1D1D 0%, #B91818 30%, #E80000 70%, #FF2D2D 100%)",
        }}
      >
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/[0.18] to-transparent" />
        {/* Left edge highlight */}
        <div className="absolute top-0 left-0 w-px h-full bg-white/[0.14]" />
        {/* Right edge shadow */}
        <div className="absolute top-0 right-0 w-px h-full bg-black/[0.3]" />
        {/* Rank number inside bar (subtle) — shown for all 3 positions */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-black text-black/[0.18] leading-none",
            rankFontSize
          )}>
            {position}
          </span>
        </div>
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
      {/* ── Contest label — compact ── */}
      <div className="flex justify-center animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E80000]/25 bg-[#E80000]/10 px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6D6D] animate-pulse" />
          <span className="text-[10px] font-bold text-[#FF6D6D] uppercase tracking-wider">
            Concours hebdo · Top 3 récompensés
          </span>
        </div>
      </div>

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

      {/* Optiz Store promo — compact card */}
      <a
        href="https://optiz.store/"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-white/[0.06] relative group active:scale-[0.98] transition-transform"
      >
        <div className="relative h-[88px] w-full">
          <Image
            src="/images/optiz-store.jpeg"
            alt="Optiz Store"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 px-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-[#FF6D6D] uppercase tracking-widest mb-0.5">
                Optiz Store
              </p>
              <h3 className="text-[15px] font-bold text-white leading-tight truncate">
                Rituels naturels, effets réels
              </h3>
              <p className="text-[11px] text-white/55 truncate">
                Siwak, mastic de Chios, packs rituels
              </p>
            </div>
            <div className="shrink-0 w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.15] flex items-center justify-center group-hover:bg-white/[0.15] transition-colors">
              <ArrowRight size={15} className="text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </a>

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
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {([
                { value: "week" as const, label: "Semaine" },
                { value: "month" as const, label: "Mois" },
                { value: "all" as const, label: "Global" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    "h-8 rounded-md text-[11px] font-semibold transition-colors text-center",
                    period === opt.value
                      ? "bg-[#E80000] text-white"
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
                  <div className="flex items-end justify-center gap-2.5 mb-6 pt-4 px-1">
                    <PodiumSlot entry={entries[1]} position={2} barHeight={64} />
                    <PodiumSlot entry={entries[0]} position={1} barHeight={92} crown />
                    <PodiumSlot entry={entries[2]} position={3} barHeight={48} />
                  </div>
                )}

                {/* Rest from #4 onwards — ALL users, no limit */}
                <div className="space-y-1.5">
                  {(entries.length >= 3 ? entries.slice(3) : entries).map((entry) => {
                    const xp = entry.total_xp ?? 0;
                    return (
                      <div
                        key={entry.whop_user_id}
                        className={cn(
                          "rounded-xl px-3 py-2.5 flex items-center gap-2.5",
                          entry.isMe
                            ? "bg-[#E80000]/10 border border-[#E80000]/25"
                            : "bg-white/[0.02] border border-white/[0.04]"
                        )}
                      >
                        <span className={cn(
                          "w-6 text-[11px] font-bold tabular-nums shrink-0 text-center",
                          entry.isMe ? "text-[#FF6D6D]" : "text-gray-8"
                        )}>
                          {entry.position}
                        </span>
                        <Avatar className="h-8 w-8 border border-white/[0.08] shrink-0">
                          <AvatarImage src={entry.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-white/[0.04]">
                            <User size={14} className="text-gray-7" />
                          </AvatarFallback>
                        </Avatar>
                        <p className={cn(
                          "flex-1 min-w-0 text-[12px] font-semibold truncate",
                          entry.isMe ? "text-[#FF6D6D]" : "text-gray-11"
                        )}>
                          {entry.display_name || t("anonymousUser")}
                        </p>
                        <div className="flex items-baseline gap-0.5 shrink-0">
                          <p className="text-[12px] font-bold tabular-nums text-gray-11">
                            {formatNumber(xp)}
                          </p>
                          <span className="text-[8px] font-extrabold text-[#FF6D6D]">XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
