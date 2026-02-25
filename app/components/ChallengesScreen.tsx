"use client";

import { motion } from "framer-motion";
import { useI18n } from "./i18n";

export interface WorkoutCardItem {
  id: string;
  title: string;
  subtitle: string;
  focus: string;
  xpReward: number;
  exerciseCount: number;
  estimatedMinutes: number;
  completed: boolean;
  accent: string;
}

interface ChallengesScreenProps {
  workouts: WorkoutCardItem[];
  onOpenWorkout: (workoutId: string) => void;
}

export function ChallengesScreen({ workouts, onOpenWorkout }: ChallengesScreenProps) {
  const { t } = useI18n();

  return (
    <div className="pb-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-5"
      >
        <h2 className="text-xl font-bold text-gray-12 mb-1.5">{t("workoutsTitle")}</h2>
        <p className="text-sm text-gray-8">{t("workoutsSub")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="mb-5 rounded-2xl border border-[#E80000]/25 bg-gradient-to-br from-[#1A0B0B] via-gray-2 to-gray-2 p-4"
      >
        <p className="text-[11px] font-semibold text-gray-10 leading-relaxed">
          {t("dailyResetHint")}
        </p>
      </motion.div>

      <div className="space-y-3.5">
        {workouts.map((workout, i) => {
          const actionLabel = workout.completed ? t("reviewWorkout") : t("startWorkout");

          return (
            <motion.button
              key={workout.id}
              onClick={() => onOpenWorkout(workout.id)}
              className="group w-full text-left rounded-2xl overflow-hidden border border-gray-5/35 bg-gray-3/25 hover:border-gray-5/65 transition-all"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.14 + i * 0.07 }}
              whileTap={{ scale: 0.985 }}
            >
              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${workout.accent}, #E80000)`,
                  opacity: workout.completed ? 0.45 : 0.95,
                }}
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-7 font-semibold mb-1">
                      {workout.subtitle}
                    </p>
                    <h3 className="text-[17px] font-black text-gray-12 tracking-tight leading-tight truncate">
                      {workout.title}
                    </h3>
                    <p className="text-[11px] text-gray-8 mt-1 truncate">{workout.focus}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-7 uppercase tracking-wider font-semibold">{t("reward")}</p>
                    <p className="text-sm font-bold text-[#FF4242] tabular-nums">+{workout.xpReward} XP</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-[10px] font-medium text-gray-8">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30">
                      {workout.exerciseCount} {t("exercises")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30 tabular-nums">
                      ~{workout.estimatedMinutes} {t("minutesShort")}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider ${
                      workout.completed
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                        : "bg-[#E80000]/10 text-[#FF5A5A] border-[#E80000]/30"
                    }`}
                  >
                    {workout.completed ? t("doneToday") : t("ready")}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-between">
                  <p className="text-[10px] text-gray-7 font-medium">
                    {workout.completed ? t("resetsTomorrow") : t("openWorkoutHint")}
                  </p>
                  <span className="text-[11px] font-bold text-gray-12 group-hover:text-white transition-colors">
                    {actionLabel} →
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
