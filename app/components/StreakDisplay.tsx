"use client";

import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakDisplayProps {
    streakDays: number;
    weeklyProgress: boolean[];
}

export function StreakDisplay({ streakDays, weeklyProgress }: StreakDisplayProps) {
    const { t } = useI18n();
    const dayLabels = [
        t("dayShortMon"),
        t("dayShortTue"),
        t("dayShortWed"),
        t("dayShortThu"),
        t("dayShortFri"),
        t("dayShortSat"),
        t("dayShortSun"),
    ];
    const day = new Date().getDay();
    const todayIndex = day === 0 ? 6 : day - 1;

    return (
        <div
            className="rounded-2xl p-4 bg-gray-3/30 border border-gray-5/40 animate-fade-in"
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center justify-center w-7 h-7">
                    <AnimatedFireIcon size={22} />
                </div>
                <p className="text-sm font-bold text-gray-12">
                    {t("dayStreak", { n: streakDays })}
                </p>
                <span className="text-[10px] text-gray-7 font-medium">
                    · {t("streakSubtitle")}
                </span>
                {streakDays >= 7 && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/12 text-orange-400 border border-orange-500/15 uppercase tracking-wider">
                        {t("onFire")}
                    </span>
                )}
            </div>

            {/* Weekly dots */}
            <div className="flex items-center justify-between gap-1">
                {dayLabels.map((day, i) => {
                    const isDone = weeklyProgress[i];
                    const isToday = i === todayIndex;

                    return (
                        <div key={`${day}-${i}`} className="flex flex-col items-center gap-1.5 flex-1">
                            <span className={`text-[9px] font-semibold ${isToday ? "text-gray-12" : "text-gray-7"
                                }`}>
                                {day}
                            </span>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone
                                    ? "bg-[#E80000] text-white"
                                    : isToday
                                        ? "border-[1.5px] border-[#E80000]/40 bg-[#E80000]/8 text-gray-10"
                                        : "bg-gray-4/60 text-gray-6 border border-gray-5/40"
                                    }`}
                            >
                                {isDone && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
