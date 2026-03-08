"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  ExternalLink,
  Play,
  Plus,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  MASS_PROGRAMS,
  type ProgramExerciseTemplate,
  type ProgramSessionTemplate,
  type ProgramTemplate,
} from "@/app/lib/training-programs";
import {
  isSoundEnabled,
  playCompleteSound,
  playRoundStartSound,
  playStartSound,
  playTickSound,
  playWorkoutCompleteSound,
  setSoundEnabled,
} from "./sounds";
import {
  saveWorkoutLog,
  getWorkoutHistory,
  getFreestyleTemplates,
  saveFreestyleTemplate as serverSaveFreestyleTemplate,
  deleteFreestyleTemplateAction,
  type WorkoutLogPayload,
} from "@/lib/actions";
import { useI18n } from "./i18n";

// ── Interfaces ──

interface TrainingHubScreenProps {
  userId: string;
  onAwardXpEvent: (source: string, referenceId: string, xpAmount: number) => Promise<void>;
  initialCompletionsToday?: { programId: string; sessionId: string }[];
}

interface SessionSetLog {
  load: number;
  reps: number;
  rpe: number;
}

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SessionSetLog[];
}

interface SessionArchive {
  id: string;
  programId: string;
  programTitle: string;
  sessionId: string;
  sessionName: string;
  completedAt: string;
  exercises: ExerciseLog[];
  totalVolume: number;
  improvedSets: number;
  xpEarned: number;
}

interface FreestyleTemplate {
  id: string;
  name: string;
  createdAt: string;
  rows: Array<{ exerciseId: string; sets: number; reps: number }>;
}

type SetType = "N" | "W" | "D";

interface DraftSet {
  load: string;
  reps: string;
  rpe: string;
  done: boolean;
  type: SetType;
}

type MainView =
  | { mode: "library" }
  | { mode: "program-detail"; program: ProgramTemplate }
  | { mode: "freestyle-builder" };

// ── Helpers ──

function sessionKey(programId: string, sessionId: string) {
  return `${programId}:${sessionId}`;
}

function parsePositiveInt(raw: string, fallback: number) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.round(num);
}

function formatDate(iso: string, locale: "en" | "fr") {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function compareProgress(current: SessionSetLog, previous?: SessionSetLog) {
  if (!previous) return false;
  if (current.reps > previous.reps) return true;
  if (current.reps === previous.reps && current.load > previous.load) return true;
  return false;
}

function nextSetType(type: SetType): SetType {
  if (type === "N") return "W";
  if (type === "W") return "D";
  return "N";
}

function buildInitialSets(
  session: ProgramSessionTemplate,
  previousArchive: SessionArchive | null,
): Record<string, DraftSet[]> {
  const initial: Record<string, DraftSet[]> = {};

  session.exercises.forEach((exercise) => {
    const previousSets = previousArchive?.exercises.find((e) => e.exerciseId === exercise.id)?.sets || [];
    initial[exercise.id] = Array.from({ length: exercise.sets }, (_, i) => ({
      load: previousSets[i] ? String(previousSets[i].load) : "",
      reps: previousSets[i] ? String(previousSets[i].reps) : String(exercise.reps),
      rpe: previousSets[i] ? String(previousSets[i].rpe) : "8",
      done: false,
      type: "N" as SetType,
    }));
  });

  return initial;
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const GRADIENTS: string[] = [
  "from-[#E80000]/20 to-[#E80000]/5",
  "from-[#C62828]/20 to-[#7F1D1D]/5",
  "from-[#A61B1B]/20 to-[#4A0E0E]/5",
  "from-[#7F1D1D]/20 to-[#3B0D0D]/5",
  "from-[#E80000]/15 to-[#C62828]/5",
];

// ══════════════════════════════════════════
// WorkoutFunnel — Everfit-style exercise-by-exercise flow
// ══════════════════════════════════════════

interface WorkoutFunnelProps {
  programId: string;
  programTitle: string;
  session: ProgramSessionTemplate;
  previousArchive: SessionArchive | null;
  onBack: () => void;
  onSave: (archive: SessionArchive) => void;
}

function WorkoutFunnel({
  programId,
  programTitle,
  session,
  previousArchive,
  onBack,
  onSave,
}: WorkoutFunnelProps) {
  const { t } = useI18n();
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [setsState, setSetsState] = useState<Record<string, DraftSet[]>>(() =>
    buildInitialSets(session, previousArchive),
  );
  const [improvedKeys, setImprovedKeys] = useState<string[]>([]);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [flash, setFlash] = useState("");

  const startTimeRef = useRef(Date.now());

  // Duration timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [completed]);

  // Start sound
  useEffect(() => {
    if (soundOn) playStartSound();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rest timer countdown
  useEffect(() => {
    if (restLeft === null) return;
    const timer = setTimeout(() => {
      const next = restLeft - 1;
      if (next <= 0) {
        if (soundOn) playRoundStartSound();
        setRestLeft(null);
        return;
      }
      if (soundOn && next <= 3) playTickSound();
      setRestLeft(next);
    }, 1000);
    return () => clearTimeout(timer);
  }, [restLeft, soundOn]);

  const exercise = session.exercises[currentExIdx];
  const rows = exercise ? setsState[exercise.id] || [] : [];
  const previousRows = exercise
    ? previousArchive?.exercises.find((e) => e.exerciseId === exercise.id)?.sets || []
    : [];
  const allCurrentDone = rows.every((r) => r.done);
  const isLastExercise = currentExIdx === session.exercises.length - 1;

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DraftSet>) => {
    setSetsState((prev) => {
      const r = prev[exerciseId] || [];
      return { ...prev, [exerciseId]: r.map((row, i) => (i === setIndex ? { ...row, ...patch } : row)) };
    });
  };

  const addSet = () => {
    if (!exercise) return;
    setSetsState((prev) => ({
      ...prev,
      [exercise.id]: [...(prev[exercise.id] || []), { load: "", reps: String(exercise.reps), rpe: "8", done: false, type: "N" }],
    }));
  };

  const toggleDone = (setIndex: number) => {
    if (!exercise) return;
    const row = rows[setIndex];
    if (!row) return;
    const nextDone = !row.done;
    updateSet(exercise.id, setIndex, { done: nextDone });

    if (!nextDone) return;
    if (soundOn) playCompleteSound();
    setRestLeft(75);

    const previous = previousRows[setIndex];
    const current: SessionSetLog = {
      load: parsePositiveInt(row.load, 0),
      reps: parsePositiveInt(row.reps, exercise.reps),
      rpe: parsePositiveInt(row.rpe, 8),
    };
    const key = `${exercise.id}-${setIndex}`;
    if (!improvedKeys.includes(key) && compareProgress(current, previous)) {
      setImprovedKeys((prev) => [...prev, key]);
      setFlash(t("trainingRecordBeaten"));
      setTimeout(() => setFlash(""), 1300);
    }
  };

  const markAllDone = () => {
    if (!exercise) return;
    setSetsState((prev) => ({
      ...prev,
      [exercise.id]: (prev[exercise.id] || []).map((row) => ({ ...row, done: true })),
    }));
    if (soundOn) playCompleteSound();
  };

  const goToNextExercise = () => {
    if (!allCurrentDone) return;
    setRestLeft(null);
    if (isLastExercise) {
      finishWorkout();
    } else {
      setCurrentExIdx((prev) => prev + 1);
      setRestLeft(90); // rest between exercises
    }
  };

  const finishWorkout = () => {
    const logs: ExerciseLog[] = session.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: (setsState[ex.id] || []).map((row) => ({
        load: parsePositiveInt(row.load, 0),
        reps: parsePositiveInt(row.reps, ex.reps),
        rpe: parsePositiveInt(row.rpe, 8),
      })),
    }));

    const totalVolume = logs.reduce(
      (sum, exLog) => sum + exLog.sets.reduce((s, row) => s + row.load * row.reps, 0),
      0,
    );

    if (soundOn) playWorkoutCompleteSound();
    setCompleted(true);

    // We'll call onSave from the completion screen's claim button
    setCompletionData({
      id: `${session.id}-${Date.now()}`,
      programId,
      programTitle,
      sessionId: session.id,
      sessionName: session.name,
      completedAt: new Date().toISOString(),
      exercises: logs,
      totalVolume,
      improvedSets: improvedKeys.length,
      xpEarned: 100,
    });
  };

  const [completionData, setCompletionData] = useState<SessionArchive | null>(null);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  // ── Completion Screen ──
  if (completed && completionData) {
    return (
      <motion.div
        className="pb-8 flex flex-col items-center justify-center min-h-[70vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Confetti-like particles */}
        <div className="relative w-full flex justify-center mb-6">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ["#E80000", "#FF6D6D", "#FFD700", "#FF5C5C", "#FBBF24"][i % 5],
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-[#E80000]/15 border-2 border-[#E80000]/30 flex items-center justify-center"
          >
            <Trophy size={36} className="text-[#FF6D6D]" />
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[28px] font-bold text-gray-12 text-center"
        >
          {t("trainingCongrats")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-8 mt-1 text-center"
        >
          {t("trainingCongratsSubtitle")}
        </motion.p>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full mt-6 grid grid-cols-3 gap-3"
        >
          <div className="rounded-2xl border border-gray-5/35 bg-gray-2/82 p-4 text-center">
            <Clock size={18} className="text-gray-8 mx-auto mb-1.5" />
            <p className="text-[20px] font-bold text-gray-12 tabular-nums">{formatTimer(elapsedSeconds)}</p>
            <p className="text-[11px] text-gray-7 mt-0.5">{t("trainingDuration")}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/35 bg-gray-2/82 p-4 text-center">
            <Dumbbell size={18} className="text-gray-8 mx-auto mb-1.5" />
            <p className="text-[20px] font-bold text-gray-12 tabular-nums">{completionData.totalVolume.toLocaleString()}</p>
            <p className="text-[11px] text-gray-7 mt-0.5">{t("trainingKg")}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/35 bg-gray-2/82 p-4 text-center">
            <Sparkles size={18} className="text-[#FFD700] mx-auto mb-1.5" />
            <p className="text-[20px] font-bold text-gray-12 tabular-nums">{completionData.improvedSets}</p>
            <p className="text-[11px] text-gray-7 mt-0.5">{t("trainingRecordsLabel")}</p>
          </div>
        </motion.div>

        {/* Claim XP Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => onSave(completionData)}
          className="w-full mt-8 h-14 rounded-2xl optiz-gradient-bg text-white font-bold text-base active:scale-[0.97] transition-transform"
        >
          {t("trainingClaimXp", { xp: "100" })}
        </motion.button>
      </motion.div>
    );
  }

  // ── Active Exercise Screen ──
  return (
    <div className="pb-[126px]">
      {/* Top bar: back, timer, sound */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full border border-gray-5/35 bg-gray-3/35 text-gray-9 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-gray-3/45 border border-gray-5/30">
            <Clock size={13} className="text-gray-8" />
            <span className="text-sm font-semibold text-gray-12 tabular-nums">{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={toggleSound}
            className="w-11 h-11 rounded-full border border-gray-5/35 bg-gray-3/35 text-gray-9 flex items-center justify-center"
            aria-label={t("sound")}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4 px-1">
        {session.exercises.map((_, i) => {
          const exRows = setsState[session.exercises[i].id] || [];
          const exDone = exRows.every((r) => r.done);
          return (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                i < currentExIdx || exDone
                  ? "bg-[#E80000]"
                  : i === currentExIdx
                    ? "bg-[#FF6D6D]"
                    : "bg-gray-5/40"
              }`}
            />
          );
        })}
      </div>

      {/* Exercise counter */}
      <p className="text-xs text-gray-7 uppercase tracking-[0.16em] font-semibold mb-1 px-1">
        {t("trainingExerciseOf", { current: String(currentExIdx + 1), total: String(session.exercises.length) })}
      </p>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {restLeft !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl border-2 border-[#E80000]/40 bg-[#E80000]/8 p-6 mb-4 flex flex-col items-center"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#FF6D6D] font-semibold mb-2">{t("trainingRest")}</p>
            <p className="text-[56px] font-bold text-[#FF6D6D] tabular-nums leading-none">{restLeft}s</p>
            <button
              type="button"
              onClick={() => setRestLeft(null)}
              className="mt-4 h-11 px-8 rounded-xl border border-[#E80000]/35 bg-[#E80000]/12 text-[#FF6D6D] text-sm font-semibold active:scale-[0.97]"
            >
              {t("trainingSkipRestAria")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash (PR beaten) */}
      <AnimatePresence>
        {flash ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700] text-sm font-semibold px-3 py-2 mb-3 inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} /> {flash}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {exercise && (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Exercise header card */}
          <div className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4 mb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-[22px] font-bold text-gray-12 leading-tight">{exercise.name}</h3>
                <p className="text-sm text-gray-8 mt-1">{exercise.muscles}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-7 bg-gray-4/40 border border-gray-5/30 rounded-full px-2.5 py-1">
                    {exercise.sets} {t("sets")} x {exercise.reps} {t("reps")}
                  </span>
                </div>
              </div>

              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-[#E80000]/10 border border-[#E80000]/25 flex items-center justify-center shrink-0"
                aria-label={t("trainingVideoAria")}
              >
                <Play size={20} className="text-[#FF6D6D] ml-0.5" />
              </a>
            </div>
          </div>

          {/* Set table */}
          <div className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_3rem] gap-1.5 px-1 pb-2 text-xs uppercase tracking-[0.1em] text-gray-7">
              <span className="text-center">#</span>
              <span className="text-center">{t("trainingHeaderPrev")}</span>
              <span className="text-center">{t("trainingHeaderKg")}</span>
              <span className="text-center">{t("trainingHeaderReps")}</span>
              <span />
            </div>

            <div className="space-y-2">
              {rows.map((row, rowIdx) => {
                const key = `${exercise.id}-${rowIdx}`;
                const previous = previousRows[rowIdx];
                const isImproved = improvedKeys.includes(key);

                return (
                  <div key={key}>
                    <div
                      className={`grid grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_3rem] items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                        row.done
                          ? "bg-[#E80000]/8 border-[#E80000]/20"
                          : "bg-gray-3/23 border-gray-5/25"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => updateSet(exercise.id, rowIdx, { type: nextSetType(row.type) })}
                        disabled={row.done}
                        className="flex flex-col items-center justify-center disabled:opacity-50"
                      >
                        <span className="text-xs text-gray-8 font-semibold">{rowIdx + 1}</span>
                        {row.type !== "N" && (
                          <span
                            className={`text-[10px] font-bold mt-0.5 px-1 rounded ${
                              row.type === "W" ? "text-yellow-500 bg-yellow-500/15" : "text-red-400 bg-red-400/15"
                            }`}
                          >
                            {row.type}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!previous || row.done) return;
                          updateSet(exercise.id, rowIdx, {
                            load: String(previous.load),
                            reps: String(previous.reps),
                            rpe: String(previous.rpe),
                          });
                        }}
                        className="text-xs text-gray-7 text-center truncate rounded-lg border border-transparent hover:border-gray-5/20 px-1 h-11"
                      >
                        {previous ? `${previous.load}x${previous.reps}` : "-"}
                      </button>

                      <input
                        type="number"
                        value={row.load}
                        inputMode="numeric"
                        onChange={(e) => updateSet(exercise.id, rowIdx, { load: e.target.value })}
                        disabled={row.done}
                        placeholder="0"
                        className="h-11 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-sm text-gray-12 disabled:opacity-55"
                      />

                      <input
                        type="number"
                        value={row.reps}
                        inputMode="numeric"
                        onChange={(e) => updateSet(exercise.id, rowIdx, { reps: e.target.value })}
                        disabled={row.done}
                        placeholder={String(exercise.reps)}
                        className="h-11 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-sm text-gray-12 disabled:opacity-55"
                      />

                      <button
                        type="button"
                        onClick={() => toggleDone(rowIdx)}
                        className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
                          row.done
                            ? "border-[#E80000]/35 bg-[#E80000]/16 text-[#FF6D6D]"
                            : "border-gray-5/35 bg-gray-2 text-gray-8"
                        }`}
                      >
                        {row.done ? <Check size={16} /> : <Check size={16} className="opacity-30" />}
                      </button>
                    </div>

                    {isImproved && (
                      <motion.p
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-1 text-xs font-bold text-[#FFD700] text-right inline-flex items-center justify-end gap-1 w-full"
                      >
                        <Sparkles size={13} /> PR
                      </motion.p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={addSet}
                className="h-11 px-3 rounded-xl border border-gray-5/30 bg-gray-3/30 text-xs text-gray-9 font-semibold inline-flex items-center gap-1"
              >
                <Plus size={12} /> {t("trainingAddSetAria")}
              </button>
              {!allCurrentDone && (
                <button
                  type="button"
                  onClick={markAllDone}
                  className="h-11 px-3 rounded-xl border border-[#E80000]/25 bg-[#E80000]/8 text-xs text-[#FF6D6D] font-semibold"
                >
                  {t("trainingMarkAll")}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 sm:px-6 pb-[calc(var(--safe-bottom)+12px)] bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          <button
            onClick={goToNextExercise}
            disabled={!allCurrentDone}
            className={`w-full h-[52px] rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              allCurrentDone
                ? "optiz-gradient-bg text-white active:scale-[0.97]"
                : "bg-gray-3 border border-gray-5/40 text-gray-7"
            }`}
          >
            {isLastExercise ? t("trainingValidateSession") : t("trainingNextExercise")}
            {!isLastExercise && allCurrentDone && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ProgramDetailView — shows exercises, description, launch button
// ══════════════════════════════════════════

function ProgramDetailView({
  program,
  completed,
  lastArchive,
  onBack,
  onLaunch,
}: {
  program: ProgramTemplate;
  completed: boolean;
  lastArchive: SessionArchive | null;
  onBack: () => void;
  onLaunch: () => void;
}) {
  const { t, locale } = useI18n();
  const session = program.sessions[0];
  const setsCount = session.exercises.reduce((s, ex) => s + ex.sets, 0);

  const equipmentLabel =
    program.location === "gym"
      ? t("trainingEquipmentGym")
      : program.location === "home"
        ? t("trainingEquipmentHome")
        : t("trainingEquipmentBodyweight");

  const levelLabel = program.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate");

  return (
    <div className="pb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4"
      >
        <ArrowLeft size={16} /> {t("back")}
      </button>

      {/* Hero gradient card */}
      <div className={`rounded-3xl bg-gradient-to-br ${GRADIENTS[MASS_PROGRAMS.indexOf(program) % GRADIENTS.length]} border border-gray-5/35 p-6 mb-4`}>
        <p className="text-xs uppercase tracking-[0.16em] text-[#FF6D6D] font-semibold mb-1">{program.subtitle}</p>
        <h2 className="text-[28px] font-bold text-gray-12 leading-tight">{program.title}</h2>
        <p className="text-sm text-gray-8 mt-2">{session.focus}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-xs text-gray-9">
            {session.exercises.length} {t("exercises")}
          </span>
          <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-xs text-gray-9">
            {setsCount} {t("sets")}
          </span>
          <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-xs text-gray-9">
            ~{session.durationMin} {t("minutesShort")}
          </span>
          <span className="rounded-full px-3 py-1.5 bg-[#E80000]/12 border border-[#E80000]/25 text-xs text-[#FF6D6D] font-semibold">
            +100 XP
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="rounded-full px-3 py-1.5 bg-gray-3/45 border border-gray-5/30 text-xs text-gray-9 inline-flex items-center gap-1">
          <Dumbbell size={12} /> {equipmentLabel}
        </span>
        <span className="rounded-full px-3 py-1.5 bg-gray-3/45 border border-gray-5/30 text-xs text-gray-9 inline-flex items-center gap-1">
          <Zap size={12} /> {levelLabel}
        </span>
      </div>

      {/* Last performance */}
      {lastArchive && (
        <div className="rounded-2xl border border-gray-5/30 bg-gray-3/18 p-3 mb-4">
          <p className="text-xs text-gray-7">
            {t("trainingLastPerf")} {formatDate(lastArchive.completedAt, locale)} &middot; {t("trainingVolumeLabel")} {lastArchive.totalVolume.toFixed(0)}
            {lastArchive.improvedSets > 0 && (
              <> &middot; {lastArchive.improvedSets} {t("trainingRecordsLabel")}</>
            )}
          </p>
        </div>
      )}

      {/* Exercise preview list — only names and muscles, no spoiler of weights */}
      <div className="rounded-3xl border border-gray-5/35 bg-gray-2/82 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-12 mb-3">{t("trainingExerciseList")}</h3>
        <div className="space-y-2.5">
          {session.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-4/50 border border-gray-5/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-gray-8">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-12 truncate">{ex.name}</p>
                <p className="text-xs text-gray-7 truncate">{ex.muscles} &middot; {ex.sets}x{ex.reps}</p>
              </div>
              <a
                href={ex.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-gray-5/25 bg-gray-3/30 flex items-center justify-center shrink-0 text-gray-8"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={onLaunch}
        disabled={completed}
        className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
          completed
            ? "bg-gray-3 border border-gray-5/40 text-gray-7 cursor-not-allowed"
            : "optiz-gradient-bg text-white active:scale-[0.97]"
        }`}
      >
        {completed ? t("trainingDoneReopens") : (
          <>
            <Play size={18} /> {t("trainingStartSession")}
          </>
        )}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════
// TrainingHubScreen — Main component
// ══════════════════════════════════════════

export function TrainingHubScreen({ userId, onAwardXpEvent, initialCompletionsToday }: TrainingHubScreenProps) {
  const { t, locale } = useI18n();
  const [mainView, setMainView] = useState<MainView>({ mode: "library" });
  const [activeTracker, setActiveTracker] = useState<{
    programId: string;
    programTitle: string;
    session: ProgramSessionTemplate;
  } | null>(null);

  const [archives, setArchives] = useState<SessionArchive[]>([]);
  const [freestyleTemplates, setFreestyleTemplates] = useState<FreestyleTemplate[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(() => {
    const set = new Set<string>();
    (initialCompletionsToday || []).forEach((c) => set.add(sessionKey(c.programId, c.sessionId)));
    return set;
  });
  const [flash, setFlash] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const [builderName, setBuilderName] = useState(() => t("trainingFreestyleDefaultName"));
  const [builderRows, setBuilderRows] = useState<Array<{ exerciseId: string; sets: number; reps: number }>>([
    { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 },
  ]);

  // Load history and freestyle templates from server
  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const [historyData, templatesData] = await Promise.all([
          getWorkoutHistory(userId, 160),
          getFreestyleTemplates(userId),
        ]);

        if (canceled) return;

        const serverArchives: SessionArchive[] = (historyData || []).map((w: Record<string, unknown>) => ({
          id: w.id as string,
          programId: w.program_id as string,
          programTitle: w.program_title as string,
          sessionId: w.session_id as string,
          sessionName: w.session_name as string,
          completedAt: w.completed_at as string,
          totalVolume: Number(w.total_volume ?? 0),
          improvedSets: (w.improved_sets as number) ?? 0,
          xpEarned: (w.xp_earned as number) ?? 0,
          exercises: ((w.workout_set_logs as Record<string, unknown>[]) || []).reduce<ExerciseLog[]>((acc, s) => {
            const exId = s.exercise_id as string;
            let existing = acc.find((e) => e.exerciseId === exId);
            if (!existing) {
              existing = { exerciseId: exId, exerciseName: s.exercise_name as string, sets: [] };
              acc.push(existing);
            }
            existing.sets.push({
              load: Number(s.load ?? 0),
              reps: Number(s.reps ?? 0),
              rpe: Number(s.rpe ?? 8),
            });
            return acc;
          }, []),
        }));

        setArchives(serverArchives);
        setFreestyleTemplates(templatesData || []);
      } catch (err) {
        console.error("[OPTIZ] Failed to load training data", err);
      }
    }

    load();
    return () => { canceled = true; };
  }, [userId]);

  const getLastArchive = (programId: string, sid: string) => {
    return archives.find((a) => a.programId === programId && a.sessionId === sid) || null;
  };

  const isCompletedToday = (programId: string, sid: string) => {
    return completions.has(sessionKey(programId, sid));
  };

  const launchProgram = (program: ProgramTemplate) => {
    const session = program.sessions[0];
    if (!session || isCompletedToday(program.id, session.id)) return;

    setActiveTracker({
      programId: program.id,
      programTitle: program.title,
      session,
    });
    setMainView({ mode: "library" });
  };

  const launchFreestyleTemplate = (templateId: string) => {
    const template = freestyleTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const exercises: ProgramExerciseTemplate[] = template.rows
      .map((row) => {
        const base = EXERCISE_LIBRARY.find((item) => item.id === row.exerciseId);
        if (!base) return null;
        return {
          id: `${base.id}-${row.sets}x${row.reps}`,
          name: base.name,
          sets: row.sets,
          reps: row.reps,
          muscles: base.muscles,
          videoUrl: base.videoUrl,
        };
      })
      .filter((item): item is ProgramExerciseTemplate => item !== null);

    if (!exercises.length) return;

    setActiveTracker({
      programId: `freestyle-${template.id}`,
      programTitle: t("trainingBuilderTitle"),
      session: {
        id: `freestyle-session-${template.id}`,
        name: template.name,
        focus: t("trainingFreestyleSession"),
        durationMin: Math.max(20, exercises.length * 8),
        exercises,
      },
    });
  };

  const handleSaveFreestyle = async () => {
    const rows = builderRows
      .map((row) => ({
        exerciseId: row.exerciseId,
        sets: Math.max(1, row.sets),
        reps: Math.max(1, row.reps),
      }))
      .filter((row) => !!EXERCISE_LIBRARY.find((item) => item.id === row.exerciseId));

    if (!rows.length) return;

    try {
      const result = await serverSaveFreestyleTemplate(userId, builderName.trim() || t("trainingFreestyleDefaultName"), rows);
      setFreestyleTemplates((prev) => [
        { id: result.id, name: builderName.trim() || t("trainingFreestyleDefaultName"), createdAt: new Date().toISOString(), rows },
        ...prev,
      ]);
      setFlash(t("trainingFreestyleSaved"));
      setTimeout(() => setFlash(""), 1800);

      setBuilderName(t("trainingFreestyleDefaultName"));
      setBuilderRows([{ exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }]);
      setMainView({ mode: "library" });
    } catch (err) {
      console.error("[OPTIZ] Failed to save freestyle template", err);
      setFlash(t("trainingErrorSaving"));
      setTimeout(() => setFlash(""), 1800);
    }
  };

  const handleDeleteFreestyle = async (templateId: string) => {
    setFreestyleTemplates((prev) => prev.filter((item) => item.id !== templateId));
    try {
      await deleteFreestyleTemplateAction(userId, templateId);
    } catch (err) {
      console.error("[OPTIZ] Failed to delete freestyle template", err);
    }
  };

  const handleSessionSaved = async (archive: SessionArchive) => {
    setArchives((prev) => [archive, ...prev].slice(0, 160));

    if (!archive.programId.startsWith("freestyle-")) {
      setCompletions((prev) => new Set([...prev, sessionKey(archive.programId, archive.sessionId)]));
    }

    try {
      const payload: WorkoutLogPayload = {
        programId: archive.programId,
        programTitle: archive.programTitle,
        sessionId: archive.sessionId,
        sessionName: archive.sessionName,
        totalVolume: archive.totalVolume,
        improvedSets: archive.improvedSets,
        xpEarned: archive.xpEarned,
        exercises: archive.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((s) => ({ load: s.load, reps: s.reps, rpe: s.rpe })),
        })),
      };

      await saveWorkoutLog(userId, payload);
    } catch (err) {
      console.error("[OPTIZ] Failed to save workout log", err);
    }

    const today = new Date().toISOString().split("T")[0];
    await onAwardXpEvent(
      "workout_complete",
      `workout-${archive.programId}-${archive.sessionId}-${today}`,
      archive.xpEarned,
    );

    setFlash(
      archive.improvedSets > 0
        ? t("trainingSessionValidatedRecords", { xp: String(archive.xpEarned), records: String(archive.improvedSets) })
        : t("trainingSessionValidated", { xp: String(archive.xpEarned) }),
    );
    setTimeout(() => setFlash(""), 2600);

    setActiveTracker(null);
    if (archive.programId.startsWith("freestyle-")) {
      setMainView({ mode: "library" });
    }
  };

  // ── Active workout funnel ──
  if (activeTracker) {
    return (
      <WorkoutFunnel
        key={`${activeTracker.programId}:${activeTracker.session.id}`}
        programId={activeTracker.programId}
        programTitle={activeTracker.programTitle}
        session={activeTracker.session}
        previousArchive={getLastArchive(activeTracker.programId, activeTracker.session.id)}
        onBack={() => {
          setActiveTracker(null);
          if (activeTracker.programId.startsWith("freestyle-")) {
            setMainView({ mode: "library" });
          }
        }}
        onSave={handleSessionSaved}
      />
    );
  }

  // ── Program detail view ──
  if (mainView.mode === "program-detail") {
    const program = mainView.program;
    const session = program.sessions[0];
    const completed = isCompletedToday(program.id, session.id);

    return (
      <ProgramDetailView
        program={program}
        completed={completed}
        lastArchive={getLastArchive(program.id, session.id)}
        onBack={() => setMainView({ mode: "library" })}
        onLaunch={() => launchProgram(program)}
      />
    );
  }

  // ── Freestyle builder ──
  if (mainView.mode === "freestyle-builder") {
    return (
      <div className="pb-8">
        <button
          onClick={() => setMainView({ mode: "library" })}
          className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4"
        >
          <ArrowLeft size={16} /> {t("back")}
        </button>

        <div className="rounded-3xl border border-gray-5/42 bg-gray-2/82 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-12">{t("trainingBuilderTitle")}</h3>
          <p className="text-sm text-gray-8 mt-1">{t("trainingFreestyleDesc")}</p>
          <input
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
            className="mt-3 w-full h-12 rounded-xl bg-gray-3/45 border border-gray-5/35 px-3 text-sm text-gray-12"
            placeholder={t("trainingSessionName")}
          />
        </div>

        <div className="space-y-2.5 mb-4">
          {builderRows.map((row, index) => (
            <div key={`builder-${index}`} className="rounded-2xl border border-gray-5/34 bg-gray-3/20 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_4.6rem_4.6rem_3rem] gap-2 items-center">
                <div className="relative">
                  <select
                    value={row.exerciseId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, exerciseId: next } : item)));
                    }}
                    className="w-full h-12 rounded-xl bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12 appearance-none"
                  >
                    {EXERCISE_LIBRARY.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-4 text-gray-7 pointer-events-none" />
                </div>

                <input
                  type="number"
                  min={1}
                  value={row.sets}
                  onChange={(e) => {
                    const value = Math.max(1, Number(e.target.value || "1"));
                    setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, sets: value } : item)));
                  }}
                  className="h-12 rounded-xl bg-gray-2 border border-gray-5/35 text-center text-sm text-gray-12"
                  aria-label={t("trainingAriaSets")}
                />

                <input
                  type="number"
                  min={1}
                  value={row.reps}
                  onChange={(e) => {
                    const value = Math.max(1, Number(e.target.value || "1"));
                    setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, reps: value } : item)));
                  }}
                  className="h-12 rounded-xl bg-gray-2 border border-gray-5/35 text-center text-sm text-gray-12"
                  aria-label={t("trainingAriaReps")}
                />

                <button
                  onClick={() => setBuilderRows((prev) => prev.filter((_, idx) => idx !== index))}
                  className="h-12 w-12 rounded-xl border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center active:scale-[0.98]"
                  aria-label={t("trainingAriaDelete")}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setBuilderRows((prev) => [...prev, { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }])}
          className="w-full h-12 rounded-xl border border-gray-5/35 bg-gray-3/25 text-sm text-gray-11 font-semibold inline-flex items-center justify-center gap-1.5 mb-3 active:scale-[0.98]"
        >
          <Plus size={14} /> {t("trainingAddExercise")}
        </button>

        <button onClick={handleSaveFreestyle} className="w-full h-14 rounded-2xl optiz-gradient-bg text-white font-semibold active:scale-[0.98]">
          {t("trainingSaveFreestyle")}
        </button>
      </div>
    );
  }

  // ── Library view ──
  const historyLimit = historyExpanded ? 20 : 5;

  return (
    <div className="pb-8">
      <div className="mb-5">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("trainingTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">{t("trainingSubtitle")}</p>
      </div>

      <AnimatePresence>
        {flash ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6D6D] text-sm px-3 py-2 mb-4"
          >
            {flash}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Program cards */}
      <div className="space-y-3 mb-5">
        {MASS_PROGRAMS.map((program, index) => {
          const session = program.sessions[0];
          const completed = isCompletedToday(program.id, session.id);
          const setsCount = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);

          return (
            <motion.button
              key={program.id}
              type="button"
              onClick={() => setMainView({ mode: "program-detail", program })}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`w-full text-left rounded-3xl border p-5 transition-all active:scale-[0.98] ${
                completed
                  ? "bg-gray-3/20 border-gray-5/15 opacity-50"
                  : `bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} border-gray-5/35 hover:border-[#E80000]/35`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-[20px] font-bold leading-tight ${completed ? "text-gray-10" : "text-gray-12"}`}>
                    {program.title}
                  </p>
                  <p className="text-sm text-gray-8 mt-0.5">{session.focus}</p>
                </div>
                <span className={`text-[18px] font-bold ${completed ? "text-gray-8" : "text-[#FF5C5C]"}`}>
                  +100 XP
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-gray-9">
                  {session.exercises.length} {t("exercises")}
                </span>
                <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-gray-9">
                  {setsCount} {t("sets")}
                </span>
                <span className="rounded-full px-3 py-1.5 bg-gray-4/50 border border-gray-5/30 text-gray-9">
                  ~{session.durationMin} {t("minutesShort")}
                </span>
              </div>

              {completed ? (
                <p className="mt-3 text-xs text-gray-7 inline-flex items-center gap-1">
                  <Check size={13} /> {t("trainingDoneReopens")}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-gray-11 inline-flex items-center gap-1">
                  {t("trainingLaunch")} <ChevronRight size={16} />
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Freestyle templates */}
      <div className="rounded-2xl border border-gray-5/34 bg-gray-2/75 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-12">{t("trainingFreestyleSaved")}</h3>
          <button
            onClick={() => setMainView({ mode: "freestyle-builder" })}
            className="h-11 px-4 rounded-lg border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF5C5C] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> {t("trainingNew")}
          </button>
        </div>

        {freestyleTemplates.length === 0 ? (
          <p className="text-xs text-gray-8">{t("trainingNoFreestyle")}</p>
        ) : (
          <div className="space-y-2">
            {freestyleTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-gray-5/25 bg-gray-3/20 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-12">{template.name}</p>
                    <p className="text-xs text-gray-8 mt-0.5">
                      {template.rows.length} {t("exercises")} &middot; {t("trainingCreatedOn")} {formatDate(template.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => launchFreestyleTemplate(template.id)}
                      className="h-11 px-4 rounded-md border border-gray-5/35 bg-gray-2 text-gray-11 text-xs font-semibold active:scale-[0.98]"
                    >
                      {t("trainingLaunch")}
                    </button>
                    <button
                      onClick={() => handleDeleteFreestyle(template.id)}
                      className="w-11 h-11 rounded-md border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center active:scale-[0.98]"
                      aria-label={t("trainingAriaDelete")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-5/34 bg-gray-3/18 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">{t("trainingHistory")}</h3>
        {archives.length === 0 ? (
          <p className="text-xs text-gray-8">{t("trainingNoArchive")}</p>
        ) : (
          <div className="space-y-2">
            {archives.slice(0, historyLimit).map((archive) => (
              <div key={archive.id} className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-12 truncate">{archive.programTitle}</p>
                  <span className="text-xs text-[#FF5C5C] font-semibold">+{archive.xpEarned} XP</span>
                </div>
                <p className="text-xs text-gray-8 mt-1">
                  {formatDate(archive.completedAt, locale)} &middot; {t("trainingVolumeLabel")} {archive.totalVolume.toFixed(0)}
                </p>
                {archive.improvedSets > 0 && (
                  <p className="text-xs text-gray-7 mt-1 inline-flex items-center gap-1">
                    <Sparkles size={12} /> {archive.improvedSets} {t("trainingRecordsLabel")}
                  </p>
                )}
              </div>
            ))}
            {archives.length > 5 && (
              <button
                type="button"
                onClick={() => setHistoryExpanded((prev) => !prev)}
                className="w-full h-11 rounded-lg border border-gray-5/25 bg-gray-3/15 text-xs text-gray-8 font-semibold flex items-center justify-center gap-1"
              >
                {historyExpanded ? t("homeShowLess") : t("homeShowMore")}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${historyExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
