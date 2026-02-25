"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ChallengeTask, Exercise } from "./rankSystem";
import { useI18n } from "./i18n";
import {
  isSoundEnabled,
  playBeepSound,
  playFinishSound,
  playStartSound,
  setSoundEnabled,
} from "./sounds";

interface ChallengeProgramProps {
  challengeTitle: string;
  workoutTask: ChallengeTask;
  workoutDisplayName?: string;
  workoutFocus?: string;
  onCompleteTask: (taskId: string) => void;
  onBack: () => void;
  completingTaskId: string | null;
}

interface WorkoutExercise {
  name: string;
  target: string;
  muscles: string;
  youtubeUrl: string;
}

interface WorkoutMinute {
  index: number;
  minute: number;
  round: number;
  exerciseIndex: number;
  exercise: WorkoutExercise;
}

interface ExerciseSheetProps {
  exercise: WorkoutExercise | null;
  isOpen: boolean;
  onClose: () => void;
}

const MINUTE_SECONDS = 60;

function toTargetLabel(raw: string): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return "8 reps";
  const compact = clean.replace(/^\d+\s*(?:x|×)\s*/i, "");
  return compact;
}

function toWorkoutExercise(exercise: Exercise): WorkoutExercise {
  return {
    name: exercise.name,
    target: toTargetLabel(exercise.sets),
    muscles: exercise.muscles,
    youtubeUrl: exercise.youtubeUrl,
  };
}

function buildMinutes(exercises: WorkoutExercise[], rounds: number): WorkoutMinute[] {
  const minutes: WorkoutMinute[] = [];
  let minute = 1;

  for (let round = 1; round <= rounds; round++) {
    exercises.forEach((exercise, exerciseIndex) => {
      minutes.push({
        index: minutes.length,
        minute,
        round,
        exerciseIndex,
        exercise,
      });
      minute += 1;
    });
  }

  return minutes;
}

function CircularMinuteTimer({ secondsLeft, isRunning }: { secondsLeft: number; isRunning: boolean }) {
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsLeft / MINUTE_SECONDS));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto w-[234px] h-[234px]">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(55% 55% at 50% 50%, rgba(232,0,0,0.18) 0%, rgba(232,0,0,0.08) 50%, rgba(232,0,0,0) 100%)",
        }}
        animate={isRunning ? { opacity: [0.3, 0.55, 0.3], scale: [0.98, 1.02, 0.98] } : { opacity: 0.3, scale: 1 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg width="234" height="234" className="-rotate-90 relative z-10">
        <circle cx="117" cy="117" r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="12" />
        <motion.circle
          cx="117"
          cy="117"
          r={radius}
          fill="none"
          stroke="#E80000"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transition={{ duration: 0.25, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[56px] leading-none tabular-nums font-semibold text-gray-12">{secondsLeft}</span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.26em] text-gray-7">sec</span>
      </div>
    </div>
  );
}

function ExerciseSheet({ exercise, isOpen, onClose }: ExerciseSheetProps) {
  const { t } = useI18n();
  if (!exercise) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-gray-5/45 bg-gray-2 p-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-12">{exercise.name}</h3>
                <p className="text-sm text-gray-8 mt-1">{exercise.target}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-gray-5/40 bg-gray-3/40 text-gray-9"
                aria-label={t("closeCta")}
              >
                ×
              </button>
            </div>

            <div className="rounded-xl border border-gray-5/30 bg-gray-3/25 p-3 mb-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-7 font-semibold mb-1">{t("targetMuscles")}</p>
              <p className="text-sm text-gray-11">{exercise.muscles}</p>
            </div>

            <a
              href={exercise.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#E80000]/35 bg-[#E80000]/12 px-3 py-2.5 text-[#FF6D6D]"
            >
              <span className="text-sm font-semibold">{t("watchDemo")}</span>
              <ExternalLink size={15} />
            </a>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function ChallengeProgram({
  challengeTitle,
  workoutTask,
  workoutDisplayName,
  workoutFocus,
  onCompleteTask,
  onBack,
  completingTaskId,
}: ChallengeProgramProps) {
  const { t } = useI18n();

  const rounds = workoutTask.rounds ?? 4;
  const exercises = useMemo(() => (workoutTask.exercises || []).map(toWorkoutExercise), [workoutTask.exercises]);
  const minutes = useMemo(() => buildMinutes(exercises, rounds), [exercises, rounds]);

  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [sheetExercise, setSheetExercise] = useState<WorkoutExercise | null>(null);

  const lastBeepSecondRef = useRef(-1);
  const totalSeconds = minutes.length * MINUTE_SECONDS;
  const isFinished = hasStarted && totalSeconds > 0 && elapsedSeconds >= totalSeconds;
  const currentMinuteIndex = Math.min(Math.floor(elapsedSeconds / MINUTE_SECONDS), Math.max(0, minutes.length - 1));
  const currentMinute = minutes[currentMinuteIndex];
  const secondInMinute = elapsedSeconds % MINUTE_SECONDS;
  const secondsLeft = isFinished ? 0 : Math.max(1, MINUTE_SECONDS - secondInMinute);
  const totalMinutes = minutes.length;
  const progressPercent = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;

  useEffect(() => {
    if (!hasStarted || !isRunning || isFinished) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setIsRunning(false);
          playFinishSound();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isRunning, isFinished, totalSeconds]);

  useEffect(() => {
    if (!hasStarted || !isRunning || !soundOn || isFinished) return;

    if (secondsLeft <= 3 && secondsLeft > 0 && lastBeepSecondRef.current !== elapsedSeconds) {
      lastBeepSecondRef.current = elapsedSeconds;
      playBeepSound();
    }

    if (elapsedSeconds > 0 && secondInMinute === 0) {
      playStartSound();
    }
  }, [hasStarted, isRunning, soundOn, isFinished, secondsLeft, elapsedSeconds, secondInMinute]);

  const startWorkout = () => {
    if (!minutes.length) return;
    setHasStarted(true);
    setIsRunning(true);
    setElapsedSeconds(0);
    playStartSound();
  };

  const togglePlay = () => {
    if (isFinished) return;
    if (!hasStarted) {
      startWorkout();
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const restartWorkout = () => {
    setHasStarted(false);
    setIsRunning(false);
    setElapsedSeconds(0);
    lastBeepSecondRef.current = -1;
  };

  const skipMinute = () => {
    if (!hasStarted || isFinished) return;
    const next = Math.min(totalSeconds, (currentMinuteIndex + 1) * MINUTE_SECONDS);
    setElapsedSeconds(next);
    if (soundOn) playStartSound();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  const completeWorkout = () => {
    if (workoutTask.completed || completingTaskId === workoutTask.id || !isFinished) return;
    onCompleteTask(workoutTask.id);
  };

  if (workoutTask.completed) {
    return (
      <div className="pb-8">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-5">
          <ArrowLeft size={16} /> {t("back")}
        </button>

        <div className="rounded-3xl border border-gray-5/35 bg-gray-3/20 p-5 text-center">
          <CheckCircle2 size={26} className="mx-auto text-gray-7 mb-2" />
          <h2 className="text-lg font-semibold text-gray-11 mb-1">{t("doneToday")}</h2>
          <p className="text-sm text-gray-8 mb-1">{workoutDisplayName || workoutTask.name}</p>
          <p className="text-xs text-gray-7">{t("workoutLockedUntilTomorrow")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-5">
        <ArrowLeft size={16} /> {t("back")}
      </button>

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-gray-5/45 bg-gradient-to-br from-gray-2 via-gray-2 to-[#130909] p-5 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="absolute -inset-14 pointer-events-none"
          style={{
            background:
              "radial-gradient(40% 45% at 75% 80%, rgba(232,0,0,0.18) 0%, rgba(232,0,0,0) 68%)",
          }}
          animate={{ opacity: [0.28, 0.5, 0.28] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <p className="relative text-[10px] uppercase tracking-[0.18em] text-gray-7 font-semibold mb-1">{challengeTitle}</p>
        <h2 className="relative text-[28px] font-semibold leading-tight text-gray-12 mb-1">{workoutDisplayName || workoutTask.name}</h2>
        {workoutFocus ? <p className="relative text-sm text-gray-8 mb-2">{workoutFocus}</p> : null}

        <div className="relative flex flex-wrap gap-2 mt-3 text-[11px]">
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/35 text-gray-10">{exercises.length} {t("exercises")}</span>
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/35 text-gray-10">{rounds} {t("series")}</span>
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/35 text-gray-10">{totalMinutes} {t("minutesShort")}</span>
          <span className="rounded-full px-2.5 py-1 bg-[#E80000]/15 border border-[#E80000]/35 text-[#FF6666]">+{workoutTask.xpReward} XP</span>
        </div>
      </motion.div>

      {!hasStarted ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl border border-gray-5/38 bg-gray-3/18 p-3.5 mb-4">
            <p className="text-[11px] text-gray-9 leading-relaxed">{t("emomRuleIntro")}</p>
          </div>

          <div className="space-y-2.5 mb-5">
            {exercises.map((exercise, index) => (
              <motion.div
                key={`${exercise.name}-${index}`}
                className="rounded-2xl border border-gray-5/35 bg-gray-3/20 px-3.5 py-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-7 font-semibold mb-1">
                      {t("minuteLabel", { n: index + 1 })}
                    </p>
                    <h3 className="text-[16px] font-semibold leading-tight text-gray-12 truncate">{exercise.name}</h3>
                    <p className="text-[12px] text-gray-8 mt-1 truncate">{exercise.target} · {exercise.muscles}</p>
                  </div>
                  <button
                    onClick={() => setSheetExercise(exercise)}
                    className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/40 text-gray-8 shrink-0"
                    aria-label={t("workoutPrescription")}
                  >
                    <ExternalLink size={13} className="mx-auto" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={startWorkout}
            className="w-full py-4 rounded-2xl optiz-gradient-bg text-white text-[17px] font-semibold"
            whileTap={{ scale: 0.985 }}
          >
            {t("startWorkout")}
          </motion.button>
        </motion.div>
      ) : (
        <div className="-mx-4 sm:-mx-6 pb-24">
          <div className="sticky top-0 z-20 bg-gray-1/95 backdrop-blur-xl border-b border-gray-5/35 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-gray-8 tabular-nums">{currentMinuteIndex + 1}/{minutes.length}</div>
              <div className="text-[11px] text-gray-8 tabular-nums">{t("roundLabel", { current: currentMinute?.round ?? rounds, total: rounds })}</div>
              <button
                onClick={toggleSound}
                className="w-8 h-8 rounded-full border border-gray-5/35 bg-gray-3/50 text-gray-9 flex items-center justify-center"
                aria-label={t("sound")}
              >
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
            <div className="h-1.5 mt-2 rounded-full overflow-hidden bg-gray-4/50">
              <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="px-4 sm:px-6 pt-5">
            <div className="mb-4">
              <CircularMinuteTimer secondsLeft={secondsLeft} isRunning={isRunning} />
            </div>

            <motion.div
              className="rounded-2xl border border-[#E80000]/35 bg-[#E80000]/10 p-4 mb-3"
              animate={{ borderColor: isRunning ? "rgba(232,0,0,0.45)" : "rgba(232,0,0,0.3)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#FF8F8F] font-semibold mb-1">{t("currentExercise")}</p>
              <h3 className="text-[22px] font-semibold leading-tight text-gray-12">{currentMinute?.exercise.name}</h3>
              <p className="text-sm text-gray-8 mt-1">{currentMinute?.exercise.target} · {currentMinute?.exercise.muscles}</p>
            </motion.div>

            <div className="flex items-center justify-center gap-2.5 mb-4">
              <motion.button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full optiz-gradient-bg text-white flex items-center justify-center shadow-[0_12px_30px_rgba(232,0,0,0.24)]"
                whileTap={{ scale: 0.92 }}
              >
                {isRunning ? <Pause size={24} /> : <Play size={24} />}
              </motion.button>

              <motion.button
                onClick={skipMinute}
                className="w-11 h-11 rounded-full border border-gray-5/40 bg-gray-3/55 text-gray-10 flex items-center justify-center"
                whileTap={{ scale: 0.92 }}
              >
                <SkipForward size={17} />
              </motion.button>

              <motion.button
                onClick={restartWorkout}
                className="w-11 h-11 rounded-full border border-gray-5/40 bg-gray-3/55 text-gray-10 flex items-center justify-center"
                whileTap={{ scale: 0.92 }}
              >
                <RotateCcw size={17} />
              </motion.button>
            </div>

            <div className="space-y-2.5">
              {minutes.map((minute) => {
                const isCurrent = minute.index === currentMinuteIndex && !isFinished;
                const isDone = minute.index < currentMinuteIndex || isFinished;

                return (
                  <motion.div
                    key={`${minute.round}-${minute.exerciseIndex}`}
                    className={`rounded-2xl border px-3.5 py-3 transition-all ${
                      isCurrent
                        ? "bg-[#E80000]/12 border-[#E80000]/35"
                        : isDone
                        ? "bg-gray-3/18 border-gray-5/26"
                        : "bg-gray-3/22 border-gray-5/30"
                    }`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.01 * minute.index }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-gray-7 font-semibold mb-1">
                          {t("roundShort", { n: minute.round })} · {t("minuteLabel", { n: minute.exerciseIndex + 1 })}
                        </p>
                        <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#FF7777]" : "text-gray-12"}`}>
                          {minute.exercise.name}
                        </p>
                        <p className="text-[11px] text-gray-8 truncate">{minute.exercise.target}</p>
                      </div>

                      <button
                        onClick={() => setSheetExercise(minute.exercise)}
                        className={`w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center ${
                          isCurrent
                            ? "border-[#E80000]/35 bg-[#E80000]/15 text-[#FF7070]"
                            : "border-gray-5/35 bg-gray-4/40 text-gray-8"
                        }`}
                      >
                        <Clock3 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
            <motion.button
              onClick={completeWorkout}
              disabled={completingTaskId === workoutTask.id || !isFinished}
              className={`pointer-events-auto w-full max-w-sm mx-auto py-3.5 rounded-xl font-semibold text-sm ${
                isFinished ? "optiz-gradient-bg text-white" : "bg-gray-3 border border-gray-5/40 text-gray-7"
              } ${completingTaskId === workoutTask.id ? "opacity-60 cursor-not-allowed" : ""}`}
              whileTap={isFinished ? { scale: 0.985 } : {}}
            >
              {completingTaskId === workoutTask.id
                ? t("savingWorkout")
                : isFinished
                ? `${t("completeWorkoutCta")} · +${workoutTask.xpReward} XP`
                : t("finishWhenDone")}
            </motion.button>
          </div>
        </div>
      )}

      <ExerciseSheet exercise={sheetExercise} isOpen={!!sheetExercise} onClose={() => setSheetExercise(null)} />
    </div>
  );
}
