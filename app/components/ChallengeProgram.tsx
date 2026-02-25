"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChallengeTask, Exercise } from "./rankSystem";
import { useI18n } from "./i18n";
import {
  DumbbellIcon,
  PullUpIcon,
  DipIcon,
  PushUpIcon,
  SquatIcon,
  LungeIcon,
  DeadliftIcon,
  PlankIcon,
  TimerIcon,
  PlayIcon,
  PauseIcon,
  SkipIcon,
  ResetIcon,
} from "./SportIcons";
import {
  isSoundEnabled,
  playBeepSound,
  playCompleteSound,
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

interface EditableExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  muscles: string;
  youtubeUrl: string;
}

interface ExerciseInfoSheetProps {
  exercise: EditableExercise | null;
  isOpen: boolean;
  onClose: () => void;
}

function getExerciseIcon(name: string, size = 18, className = "") {
  const n = name.toLowerCase();
  if (n.includes("dip")) return <DipIcon size={size} className={className} />;
  if (n.includes("pull") || n.includes("chin") || n.includes("row")) return <PullUpIcon size={size} className={className} />;
  if (n.includes("push") || n.includes("press") || n.includes("chest")) return <PushUpIcon size={size} className={className} />;
  if (n.includes("squat") || n.includes("split squat")) return <SquatIcon size={size} className={className} />;
  if (n.includes("lunge")) return <LungeIcon size={size} className={className} />;
  if (n.includes("deadlift") || n.includes("thrust") || n.includes("hinge")) return <DeadliftIcon size={size} className={className} />;
  if (n.includes("plank") || n.includes("hang") || n.includes("hold") || n.includes("core")) return <PlankIcon size={size} className={className} />;
  if (n.includes("emom") || n.includes("timer")) return <TimerIcon size={size} className={className} />;
  return <DumbbellIcon size={size} className={className} />;
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function parsePrescription(raw: string): { sets: number; reps: string } {
  const compact = raw.replace(/\s+/g, " ").trim();
  const emomMatch = compact.match(/emom\s*(\d+)/i);
  if (emomMatch) {
    return { sets: Number(emomMatch[1]), reps: "EMOM" };
  }

  const setRepMatch = compact.match(/^(\d+)\s*(?:x|×)\s*(.+)$/i);
  if (setRepMatch) {
    return {
      sets: Math.max(1, Number(setRepMatch[1])),
      reps: setRepMatch[2].replace(/reps?/i, "").trim() || "8-12",
    };
  }

  const seriesMatch = compact.match(/^(\d+)\s*(?:sets?|séries?)/i);
  if (seriesMatch) {
    return { sets: Math.max(1, Number(seriesMatch[1])), reps: "8-12" };
  }

  return { sets: 3, reps: compact || "8-12" };
}

function toEditableExercise(exercise: Exercise, index: number): EditableExercise {
  const prescription = parsePrescription(exercise.sets);
  return {
    id: `${index}-${exercise.name}`,
    name: exercise.name,
    sets: prescription.sets,
    reps: prescription.reps,
    restSec: 60,
    muscles: exercise.muscles,
    youtubeUrl: exercise.youtubeUrl,
  };
}

function ExerciseInfoSheet({ exercise, isOpen, onClose }: ExerciseInfoSheetProps) {
  const { t } = useI18n();

  if (!exercise) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-gray-4 bg-gray-2 overflow-hidden"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-12">{exercise.name}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-gray-3/50 border border-gray-5/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-7 font-bold mb-1">{t("targetMuscles")}</p>
                  <p className="text-sm text-gray-12">{exercise.muscles}</p>
                </div>
                <div className="rounded-xl bg-gray-3/50 border border-gray-5/35 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-7 font-bold mb-1">{t("workoutPrescription")}</p>
                  <p className="text-sm text-gray-12">{exercise.sets} {t("sets")} · {exercise.reps} {t("reps")}</p>
                </div>
                <a
                  href={exercise.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#E80000]/10 border border-[#E80000]/30 p-3 flex items-center justify-between text-[#FF5A5A]"
                >
                  <span className="text-sm font-semibold">{t("watchDemo")}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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

  const defaultExercises = useMemo(() => {
    return (workoutTask.exercises || []).map(toEditableExercise);
  }, [workoutTask.exercises]);

  const [isEditing, setIsEditing] = useState(true);
  const [roundDuration, setRoundDuration] = useState(60);
  const [exercises, setExercises] = useState<EditableExercise[]>(defaultExercises);
  const [infoExercise, setInfoExercise] = useState<EditableExercise | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [checkedBlocks, setCheckedBlocks] = useState<Set<number>>(new Set());
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBeepRef = useRef<number>(-1);

  const blocks = useMemo(() => {
    return exercises.flatMap((exercise) =>
      Array.from({ length: Math.max(1, exercise.sets) }, (_, setIndex) => ({
        exercise,
        setIndex: setIndex + 1,
      }))
    );
  }, [exercises]);

  const totalDuration = blocks.length * roundDuration;
  const currentBlockIndex = Math.min(Math.floor(elapsedSeconds / roundDuration), Math.max(0, blocks.length - 1));
  const currentBlock = blocks[currentBlockIndex];
  const secondsIntoCurrentBlock = elapsedSeconds % roundDuration;
  const secondsLeftInCurrentBlock = Math.max(0, roundDuration - secondsIntoCurrentBlock);
  const workoutDoneByTimer = elapsedSeconds >= totalDuration && totalDuration > 0;
  const allChecked = checkedBlocks.size === blocks.length && blocks.length > 0;

  useEffect(() => {
    if (!isRunning || workoutDoneByTimer) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          setIsRunning(false);
          playFinishSound();
        }
        return Math.min(next, totalDuration);
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, workoutDoneByTimer, totalDuration]);

  useEffect(() => {
    if (!isRunning || !soundOn || workoutDoneByTimer || blocks.length === 0) return;

    if (secondsLeftInCurrentBlock <= 3 && secondsLeftInCurrentBlock > 0 && lastBeepRef.current !== elapsedSeconds) {
      lastBeepRef.current = elapsedSeconds;
      playBeepSound();
    }

    if (secondsIntoCurrentBlock === 0 && elapsedSeconds > 0) {
      playStartSound();
    }
  }, [
    elapsedSeconds,
    isRunning,
    soundOn,
    workoutDoneByTimer,
    secondsIntoCurrentBlock,
    secondsLeftInCurrentBlock,
    blocks.length,
  ]);

  const estimatedMinutes = Math.max(1, Math.round(totalDuration / 60));

  const updateExercise = (id: string, update: Partial<EditableExercise>) => {
    setExercises((prev) => prev.map((exercise) => (exercise.id === id ? { ...exercise, ...update } : exercise)));
  };

  const handleStart = () => {
    setIsEditing(false);
    setIsRunning(true);
    playStartSound();
  };

  const handlePause = () => setIsRunning(false);
  const handleResume = () => {
    setIsRunning(true);
    playStartSound();
  };

  const handleResetWorkout = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setCheckedBlocks(new Set());
    setIsEditing(true);
  };

  const handleSkipBlock = () => {
    if (blocks.length === 0) return;
    const nextStart = (currentBlockIndex + 1) * roundDuration;
    setElapsedSeconds(Math.min(nextStart, totalDuration));
    playStartSound();
  };

  const handleToggleBlock = (index: number) => {
    setCheckedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        playCompleteSound();
      }
      return next;
    });
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleFinishWorkout = () => {
    if (workoutTask.completed || completingTaskId === workoutTask.id) return;
    onCompleteTask(workoutTask.id);
  };

  if (workoutTask.completed) {
    return (
      <div className="pb-8">
        <motion.button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-5"
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t("back")}
        </motion.button>

        <div className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-5 text-center">
          <h2 className="text-lg font-bold text-gray-12 mb-1">{t("doneToday")}</h2>
          <p className="text-sm text-gray-8 mb-2">{workoutDisplayName || workoutTask.name}</p>
          <p className="text-xs text-gray-7">{t("dailyResetHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <motion.button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-5"
        whileTap={{ scale: 0.95 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t("back")}
      </motion.button>

      <motion.div
        className="rounded-3xl border border-gray-5/40 bg-gradient-to-br from-gray-2 via-gray-2 to-[#140808] p-5 mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-7 font-semibold mb-1">{challengeTitle}</p>
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 tracking-tight mb-1.5">{workoutDisplayName || workoutTask.name}</h2>
        {workoutFocus ? <p className="text-sm text-gray-8 mb-2">{workoutFocus}</p> : null}
        <p className="text-xs text-gray-8 mb-3 leading-relaxed">{t("dailyResetHint")}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-8 font-medium">
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30">+{workoutTask.xpReward} XP</span>
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30">{blocks.length} {t("totalSets")}</span>
          <span className="rounded-full px-2.5 py-1 bg-gray-4/45 border border-gray-5/30">~{estimatedMinutes} {t("minutesShort")}</span>
        </div>
      </motion.div>

      {isEditing ? (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl border border-gray-5/35 bg-gray-3/25 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-11">{t("roundDuration")}</p>
              <p className="text-xs font-semibold text-gray-8 tabular-nums">{roundDuration}s</p>
            </div>
            <input
              type="range"
              min={40}
              max={90}
              step={5}
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              className="w-full accent-[#E80000]"
            />
            <p className="text-[10px] text-gray-7 mt-2">{t("roundDurationHint")}</p>
          </div>

          <div className="space-y-2.5">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-4/55 border border-gray-5/30 text-gray-11 flex items-center justify-center">
                    {getExerciseIcon(exercise.name, 15)}
                  </div>
                  <input
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                    className="flex-1 bg-gray-4/35 border border-gray-5/35 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-gray-12 focus:outline-none focus:border-[#E80000]/50"
                    placeholder={t("exerciseName")}
                  />
                  <button
                    onClick={() => setInfoExercise(exercise)}
                    className="w-8 h-8 rounded-lg bg-gray-4/35 border border-gray-5/35 text-gray-8"
                  >
                    i
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-gray-4/30 border border-gray-5/35 p-2.5">
                    <p className="text-[10px] text-gray-7 uppercase tracking-wider font-bold mb-1.5">{t("sets")}</p>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => updateExercise(exercise.id, { sets: Math.max(1, exercise.sets - 1) })}
                        className="w-7 h-7 rounded-md bg-gray-4/60 text-gray-11 font-bold"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-gray-12 tabular-nums">{exercise.sets}</span>
                      <button
                        onClick={() => updateExercise(exercise.id, { sets: Math.min(8, exercise.sets + 1) })}
                        className="w-7 h-7 rounded-md bg-gray-4/60 text-gray-11 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-4/30 border border-gray-5/35 p-2.5">
                    <p className="text-[10px] text-gray-7 uppercase tracking-wider font-bold mb-1.5">{t("reps")}</p>
                    <input
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, { reps: e.target.value })}
                      className="w-full bg-gray-4/60 border border-gray-5/35 rounded-md px-2 py-1.5 text-xs font-semibold text-gray-12 text-center focus:outline-none focus:border-[#E80000]/50"
                      placeholder="8-12"
                    />
                  </div>

                  <div className="rounded-xl bg-gray-4/30 border border-gray-5/35 p-2.5">
                    <p className="text-[10px] text-gray-7 uppercase tracking-wider font-bold mb-1.5">{t("rest")}</p>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => updateExercise(exercise.id, { restSec: Math.max(20, exercise.restSec - 10) })}
                        className="w-7 h-7 rounded-md bg-gray-4/60 text-gray-11 font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-gray-12 tabular-nums">{exercise.restSec}s</span>
                      <button
                        onClick={() => updateExercise(exercise.id, { restSec: Math.min(180, exercise.restSec + 10) })}
                        className="w-7 h-7 rounded-md bg-gray-4/60 text-gray-11 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-7 mt-2">#{index + 1} · {exercise.muscles}</p>
              </div>
            ))}
          </div>

          <motion.button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white optiz-gradient-bg"
            whileTap={{ scale: 0.98 }}
          >
            {t("startWorkout")}
          </motion.button>
        </motion.div>
      ) : (
        <div className="-mx-4 sm:-mx-6 pb-24">
          <div className="sticky top-0 z-20 bg-gray-1/95 backdrop-blur-xl border-b border-gray-5/30 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <button onClick={handleResetWorkout} className="text-sm text-gray-8 hover:text-gray-12">{t("reset")}</button>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-8 tabular-nums">{currentBlockIndex + 1}/{Math.max(1, blocks.length)}</span>
                <button
                  onClick={handleToggleSound}
                  className="w-9 h-9 rounded-full bg-gray-3/70 border border-gray-5/35 text-gray-9 flex items-center justify-center"
                  aria-label={t("sound")}
                >
                  {soundOn ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                      <path d="M19 9a4 4 0 0 1 0 6" />
                      <path d="M22 7a7 7 0 0 1 0 10" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-gray-4/45 overflow-hidden mt-2.5">
              <motion.div
                className="h-full optiz-gradient-bg"
                animate={{ width: `${totalDuration === 0 ? 0 : (elapsedSeconds / totalDuration) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 pt-6">
            {currentBlock ? (
              <div className="text-center mb-5">
                <p className="text-[11px] uppercase tracking-wider text-gray-7 font-semibold mb-1">{t("currentExercise")}</p>
                <h3 className="text-lg font-bold text-gray-12">{currentBlock.exercise.name}</h3>
                <p className="text-xs text-gray-8 mt-1">
                  {t("setLabel", { current: currentBlock.setIndex, total: currentBlock.exercise.sets })} · {currentBlock.exercise.reps} {t("reps")}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-5 text-center mb-5">
              <p className="text-5xl font-black text-gray-12 tabular-nums tracking-tight">{formatSeconds(secondsLeftInCurrentBlock)}</p>
              <p className="text-xs text-gray-7 mt-1">{t("timeLeftInRound")}</p>

              <div className="flex items-center justify-center gap-3 mt-4">
                <motion.button
                  onClick={handleResetWorkout}
                  className="w-12 h-12 rounded-full bg-gray-3/70 border border-gray-5/35 text-gray-10 flex items-center justify-center"
                  whileTap={{ scale: 0.88 }}
                >
                  <ResetIcon size={16} />
                </motion.button>

                <motion.button
                  onClick={isRunning ? handlePause : handleResume}
                  className="w-16 h-16 rounded-full optiz-gradient-bg text-white flex items-center justify-center shadow-[0_10px_30px_rgba(232,0,0,0.24)]"
                  whileTap={{ scale: 0.9 }}
                >
                  {isRunning ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
                </motion.button>

                <motion.button
                  onClick={handleSkipBlock}
                  className="w-12 h-12 rounded-full bg-gray-3/70 border border-gray-5/35 text-gray-10 flex items-center justify-center"
                  whileTap={{ scale: 0.88 }}
                >
                  <SkipIcon size={16} />
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              {blocks.map((block, blockIndex) => {
                const isChecked = checkedBlocks.has(blockIndex);
                const isCurrent = blockIndex === currentBlockIndex && !workoutDoneByTimer;

                return (
                  <motion.button
                    key={`${block.exercise.id}-${blockIndex}`}
                    onClick={() => handleToggleBlock(blockIndex)}
                    className={`w-full rounded-2xl border px-3.5 py-3 flex items-center gap-2.5 text-left transition-all ${
                      isChecked
                        ? "bg-[#E80000]/10 border-[#E80000]/28"
                        : isCurrent
                        ? "bg-gray-3/55 border-gray-5/45"
                        : "bg-gray-3/20 border-gray-5/25"
                    }`}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isChecked ? "bg-[#E80000]" : "bg-gray-4/65"
                      }`}
                    >
                      {isChecked ? "✓" : blockIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isChecked ? "text-[#FF6F6F]" : "text-gray-12"}`}>
                        {block.exercise.name}
                      </p>
                      <p className="text-[11px] text-gray-8">
                        {t("setLabel", { current: block.setIndex, total: block.exercise.sets })} · {block.exercise.reps} {t("reps")}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
            <motion.button
              onClick={handleFinishWorkout}
              disabled={completingTaskId === workoutTask.id || (!workoutDoneByTimer && !allChecked)}
              className={`pointer-events-auto w-full max-w-sm mx-auto py-3.5 rounded-xl font-bold text-sm ${
                workoutDoneByTimer || allChecked
                  ? "optiz-gradient-bg text-white"
                  : "bg-gray-3 border border-gray-5/40 text-gray-7 opacity-70"
              } ${completingTaskId === workoutTask.id ? "opacity-60 cursor-not-allowed" : ""}`}
              whileTap={workoutDoneByTimer || allChecked ? { scale: 0.98 } : {}}
            >
              {completingTaskId === workoutTask.id
                ? t("savingWorkout")
                : workoutDoneByTimer || allChecked
                ? `${t("completeWorkoutCta")} · +${workoutTask.xpReward} XP`
                : t("completeWorkoutProgress", { done: checkedBlocks.size, total: blocks.length })}
            </motion.button>
          </div>
        </div>
      )}

      <ExerciseInfoSheet exercise={infoExercise} isOpen={!!infoExercise} onClose={() => setInfoExercise(null)} />
    </div>
  );
}
