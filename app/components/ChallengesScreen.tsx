"use client";

import { motion } from "framer-motion";
import { useI18n } from "./i18n";

export type WorkoutVariant = "push" | "pull" | "legs" | "upper";

export interface WorkoutCardItem {
  id: string;
  title: string;
  subtitle: string;
  focus: string;
  xpReward: number;
  exerciseCount: number;
  estimatedMinutes: number;
  completed: boolean;
  variant: WorkoutVariant;
}

interface ChallengesScreenProps {
  workouts: WorkoutCardItem[];
  onOpenWorkout: (workoutId: string) => void;
}

function WorkoutGlyph({ variant, completed }: { variant: WorkoutVariant; completed: boolean }) {
  const stroke = completed ? "#6B7280" : "#E80000";

  if (variant === "push") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 14h16" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 18v-4m10 4v-4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 10l3-4 3 4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "pull") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 6v4a5 5 0 0 0 10 0V6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="14" r="1.6" fill={stroke} />
      </svg>
    );
  }

  if (variant === "legs") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 5v6l-2 7" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 5v6l2 7" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 11h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12M7.5 12h9M9 16h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4" y="5" width="16" height="14" rx="4" stroke={stroke} strokeWidth="1.4" />
    </svg>
  );
}

export function ChallengesScreen({ workouts, onOpenWorkout }: ChallengesScreenProps) {
  const { t } = useI18n();

  return (
    <div className="pb-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-5"
      >
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("workoutsTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("workoutsSub")}</p>
      </motion.div>

      <motion.div
        className="mb-5 rounded-2xl border border-gray-5/45 bg-gray-3/20 p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
      >
        <p className="text-[12px] text-gray-9 leading-relaxed">{t("dailyResetHint")}</p>
      </motion.div>

      <div className="space-y-3.5">
        {workouts.map((workout, i) => {
          const isCompleted = workout.completed;

          return (
            <motion.button
              key={workout.id}
              type="button"
              disabled={isCompleted}
              onClick={isCompleted ? undefined : () => onOpenWorkout(workout.id)}
              className={`w-full text-left rounded-3xl border p-4 transition-all ${
                isCompleted
                  ? "bg-gray-3/15 border-gray-5/20 opacity-70 cursor-not-allowed"
                  : "bg-gray-2/70 border-gray-5/45 hover:border-[#E80000]/35 active:scale-[0.995]"
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.12 + i * 0.05 }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border ${
                    isCompleted
                      ? "bg-gray-4/30 border-gray-5/35"
                      : "bg-[#E80000]/8 border-[#E80000]/25"
                  }`}
                >
                  <WorkoutGlyph variant={workout.variant} completed={isCompleted} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-7 font-semibold mb-1">
                        {workout.subtitle}
                      </p>
                      <h3 className="text-[19px] leading-tight font-semibold text-gray-12 truncate">{workout.title}</h3>
                      <p className="text-[12px] text-gray-8 mt-1.5 truncate">{workout.focus}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-gray-7 font-semibold mb-1">{t("reward")}</p>
                      <p className={`text-[18px] font-semibold tabular-nums ${isCompleted ? "text-gray-8" : "text-[#FF4747]"}`}>
                        +{workout.xpReward}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-gray-8">
                      <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30 tabular-nums">
                        {workout.exerciseCount} {t("exercises")}
                      </span>
                      <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30 tabular-nums">
                        {workout.estimatedMinutes} {t("minutesShort")}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 border text-[10px] font-semibold uppercase tracking-wider ${
                        isCompleted
                          ? "bg-gray-4/35 text-gray-7 border-gray-5/35"
                          : "bg-[#E80000]/12 text-[#FF5A5A] border-[#E80000]/30"
                      }`}
                    >
                      {isCompleted ? t("doneToday") : t("ready")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-gray-7">
                      {isCompleted ? t("workoutLockedUntilTomorrow") : t("openWorkoutHint")}
                    </p>

                    {!isCompleted ? (
                      <span className="text-[13px] font-semibold text-gray-12">{t("startWorkout")} →</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
