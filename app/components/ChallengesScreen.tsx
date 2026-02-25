"use client";

import { motion } from "framer-motion";
import { ArrowRight, CircleCheckBig, Dumbbell } from "lucide-react";
import { useI18n } from "./i18n";

export type WorkoutVariant = "push" | "pull" | "legs" | "upper";

export interface WorkoutCardItem {
  id: string;
  title: string;
  subtitle: string;
  focus: string;
  xpReward: number;
  exerciseCount: number;
  roundCount: number;
  estimatedMinutes: number;
  completed: boolean;
  variant: WorkoutVariant;
}

interface ChallengesScreenProps {
  workouts: WorkoutCardItem[];
  onOpenWorkout: (workoutId: string) => void;
}

function WorkoutGlyph({ completed }: { completed: boolean }) {
  return <Dumbbell size={20} strokeWidth={2.1} className={completed ? "text-gray-7" : "text-[#FF5353]"} />;
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
              className={`group relative overflow-hidden w-full text-left rounded-3xl border p-4 transition-all ${
                isCompleted
                  ? "bg-gray-3/18 border-gray-5/24 opacity-80 cursor-not-allowed"
                  : "bg-gray-2/82 border-gray-5/45 hover:border-[#E80000]/35 active:scale-[0.995]"
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.12 + i * 0.05 }}
              whileHover={isCompleted ? undefined : { y: -2 }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border ${
                    isCompleted
                      ? "bg-gray-4/25 border-gray-5/35"
                      : "bg-[#E80000]/10 border-[#E80000]/30 group-hover:bg-[#E80000]/14"
                  }`}
                >
                  <WorkoutGlyph completed={isCompleted} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[19px] leading-tight font-semibold text-gray-12 truncate">{workout.title}</h3>
                      <p className="text-[12px] text-gray-8 mt-1.5 truncate">{workout.focus}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className={`text-[19px] font-semibold tabular-nums ${isCompleted ? "text-gray-8" : "text-[#FF4747]"}`}>
                        +100 XP
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[12px] text-gray-8 tabular-nums">
                    {workout.exerciseCount} {t("exercises")} · {workout.roundCount} {t("series")} · {workout.estimatedMinutes}{" "}
                    {t("minutesShort")}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-7">
                      {isCompleted ? t("workoutLockedUntilTomorrow") : t("openWorkoutHint")}
                    </p>

                    {!isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-12">
                        {t("startWorkout")} <ArrowRight size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-7">
                        <CircleCheckBig size={14} /> {t("doneToday")}
                      </span>
                    )}
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
