"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Play,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  MASS_PROGRAMS,
  type ProgramExerciseTemplate,
  type ProgramSessionTemplate,
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

interface SessionTrackerProps {
  programId: string;
  programTitle: string;
  session: ProgramSessionTemplate;
  previousArchive: SessionArchive | null;
  onBack: () => void;
  onSave: (archive: SessionArchive) => void;
}

type SetType = "N" | "W" | "D";

interface DraftSet {
  load: string;
  reps: string;
  rpe: string;
  done: boolean;
  type: SetType;
}

type MainView = { mode: "library" } | { mode: "freestyle-builder" };

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
    const previousRows = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];
    const rowCount = Math.max(exercise.sets, previousRows.length);
    initial[exercise.id] = Array.from({ length: rowCount }).map((_, idx) => {
      const prev = previousRows[idx];
      return {
        load: prev ? String(prev.load) : "",
        reps: prev ? String(prev.reps) : String(exercise.reps),
        rpe: prev ? String(prev.rpe) : "8",
        done: false,
        type: "N",
      };
    });
  });

  return initial;
}

function SessionTracker({
  programId,
  programTitle,
  session,
  previousArchive,
  onBack,
  onSave,
}: SessionTrackerProps) {
  const { t } = useI18n();
  const [setsState, setSetsState] = useState<Record<string, DraftSet[]>>(() =>
    buildInitialSets(session, previousArchive),
  );
  const [improvedKeys, setImprovedKeys] = useState<string[]>([]);
  const [flash, setFlash] = useState("");
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());

  useEffect(() => {
    if (soundOn) playStartSound();
  }, [soundOn]);

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

  const totalSets = useMemo(
    () => Object.values(setsState).reduce((sum, rows) => sum + rows.length, 0),
    [setsState],
  );

  const completedSets = useMemo(
    () => Object.values(setsState).flat().filter((row) => row.done).length,
    [setsState],
  );

  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const nextExerciseId = useMemo(() => {
    for (const exercise of session.exercises) {
      const rows = setsState[exercise.id] || [];
      if (rows.some((row) => !row.done)) {
        return exercise.id;
      }
    }
    return null;
  }, [session.exercises, setsState]);

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DraftSet>) => {
    setSetsState((prev) => {
      const rows = prev[exerciseId] || [];
      return {
        ...prev,
        [exerciseId]: rows.map((row, idx) => (idx === setIndex ? { ...row, ...patch } : row)),
      };
    });
  };

  const addSet = (exercise: ProgramExerciseTemplate) => {
    setSetsState((prev) => {
      const rows = prev[exercise.id] || [];
      return {
        ...prev,
        [exercise.id]: [
          ...rows,
          { load: "", reps: String(exercise.reps), rpe: "8", done: false, type: "N" },
        ],
      };
    });
  };

  const applyPreviousToAllSets = (exercise: ProgramExerciseTemplate) => {
    const previousRows = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];
    if (!previousRows.length) return;

    setSetsState((prev) => {
      const rows = prev[exercise.id] || [];
      return {
        ...prev,
        [exercise.id]: rows.map((row, idx) => {
          if (row.done) return row;
          const previous = previousRows[idx];
          if (!previous) return row;
          return {
            ...row,
            load: String(previous.load),
            reps: String(previous.reps),
            rpe: String(previous.rpe),
          };
        }),
      };
    });
  };

  const applyDeltaToExercise = (
    exercise: ProgramExerciseTemplate,
    target: "reps" | "load",
    delta: number,
  ) => {
    setSetsState((prev) => {
      const rows = prev[exercise.id] || [];
      return {
        ...prev,
        [exercise.id]: rows.map((row) => {
          if (row.done) return row;
          const base = Number(target === "reps" ? row.reps : row.load) || 0;
          const next = Math.max(0, base + delta);
          if (target === "reps") return { ...row, reps: String(Math.round(next)) };
          return { ...row, load: String(Math.round(next * 10) / 10) };
        }),
      };
    });
  };

  const toggleDone = (exercise: ProgramExerciseTemplate, setIndex: number) => {
    const row = setsState[exercise.id]?.[setIndex];
    if (!row) return;

    const nextDone = !row.done;
    updateSet(exercise.id, setIndex, { done: nextDone });

    if (!nextDone) return;

    if (soundOn) playCompleteSound();
    setRestLeft(75);

    const previous = previousArchive?.exercises
      .find((item) => item.exerciseId === exercise.id)
      ?.sets[setIndex];

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

  const handleValidateSession = () => {
    if (completedSets !== totalSets || totalSets === 0) return;

    const logs: ExerciseLog[] = session.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: (setsState[exercise.id] || []).map((row) => ({
        load: parsePositiveInt(row.load, 0),
        reps: parsePositiveInt(row.reps, exercise.reps),
        rpe: parsePositiveInt(row.rpe, 8),
      })),
    }));

    const totalVolume = logs.reduce(
      (sum, exerciseLog) =>
        sum + exerciseLog.sets.reduce((local, setRow) => local + setRow.load * setRow.reps, 0),
      0,
    );

    if (soundOn) playWorkoutCompleteSound();

    onSave({
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

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  };

  return (
    <div className="pb-[126px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12"
        >
          <ArrowLeft size={16} /> {t("back")}
        </button>

        <button
          onClick={toggleSound}
          className="w-9 h-9 rounded-full border border-gray-5/35 bg-gray-3/35 text-gray-9 flex items-center justify-center"
          aria-label={t("sound")}
        >
          {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      <motion.div
        className="rounded-3xl border border-gray-5/42 bg-gray-2/82 p-4 mb-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-7 font-semibold mb-1">{programTitle}</p>
        <h3 className="text-[24px] font-semibold text-gray-12 leading-tight">{session.name}</h3>
        <p className="text-[12px] text-gray-8 mt-1">{session.focus}</p>

        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-gray-9 text-center">
            {session.exercises.length} {t("exercises")}
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-gray-9 text-center">
            {totalSets} {t("sets")}
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-gray-9 text-center">
            {session.durationMin} {t("minutesShort")}
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-[#FF6666] text-center font-semibold">
            +100 XP
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-gray-8 tabular-nums">{completedSets}/{totalSets} {t("trainingValidSets")}</p>
      </motion.div>

      <AnimatePresence>
        {restLeft !== null ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-[#E80000]/30 bg-[#E80000]/10 px-3 py-2 mb-3 flex items-center justify-between"
          >
            <p className="text-[12px] text-[#FF7D7D] font-semibold">{t("trainingRest")} {restLeft}s</p>
            <button
              type="button"
              onClick={() => setRestLeft(null)}
              className="w-7 h-7 rounded-lg border border-[#E80000]/35 bg-[#E80000]/12 text-[#FF8080] flex items-center justify-center"
              aria-label={t("trainingSkipRestAria")}
            >
              <X size={13} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {flash ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6D6D] text-sm px-3 py-2 mb-3"
          >
            {flash}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-3">
        {session.exercises.map((exercise, exIdx) => {
          const rows = setsState[exercise.id] || [];
          const previousRows = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];
          const isCurrent = nextExerciseId === exercise.id;

          return (
            <motion.div
              key={exercise.id}
              className={`rounded-2xl border p-3 ${
                isCurrent ? "border-[#E80000]/35 bg-[#170A0A]" : "border-gray-5/30 bg-gray-3/18"
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: exIdx * 0.03 }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className={`text-[17px] font-semibold truncate ${isCurrent ? "text-[#FF6D6D]" : "text-gray-12"}`}>
                    {exercise.name}
                  </p>
                  <p className="text-[11px] text-gray-8 truncate">{exercise.muscles}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/35 text-gray-8 flex items-center justify-center"
                    aria-label={t("trainingVideoAria")}
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => addSet(exercise)}
                    className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/35 text-gray-8 flex items-center justify-center"
                    aria-label={t("trainingAddSetAria")}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => applyPreviousToAllSets(exercise)}
                  className="h-7 px-2.5 rounded-lg border border-gray-5/30 bg-gray-2 text-[10px] text-gray-9 font-semibold"
                >
                  {t("trainingCopyPrev")}
                </button>
                <button
                  type="button"
                  onClick={() => applyDeltaToExercise(exercise, "reps", 1)}
                  className="h-7 px-2.5 rounded-lg border border-gray-5/30 bg-gray-2 text-[10px] text-gray-9 font-semibold"
                >
                  {t("trainingPlusOneRep")}
                </button>
                <button
                  type="button"
                  onClick={() => applyDeltaToExercise(exercise, "load", 2.5)}
                  className="h-7 px-2.5 rounded-lg border border-gray-5/30 bg-gray-2 text-[10px] text-gray-9 font-semibold"
                >
                  {t("trainingPlusTwoPointFiveKg")}
                </button>
              </div>

              <div className="grid grid-cols-[2rem_2rem_minmax(0,1fr)_3.8rem_3.8rem_3.8rem_2.6rem] md:grid-cols-[2.4rem_2.2rem_minmax(0,1fr)_4.6rem_4.6rem_4.6rem_2.8rem] gap-1.5 px-1 pb-1 text-[10px] uppercase tracking-[0.1em] text-gray-7">
                    <span className="text-center">{t("trainingHeaderSet")}</span>
                    <span className="text-center">{t("trainingHeaderType")}</span>
                    <span className="text-center">{t("trainingHeaderPrev")}</span>
                    <span className="text-center">{t("trainingHeaderKg")}</span>
                    <span className="text-center">{t("trainingHeaderReps")}</span>
                    <span className="text-center">{t("trainingHeaderRpe")}</span>
                    <span />
                  </div>

              <div className="space-y-1.5">
                {rows.map((row, rowIdx) => {
                  const key = `${exercise.id}-${rowIdx}`;
                  const previous = previousRows[rowIdx];
                  const isImproved = improvedKeys.includes(key);

                  return (
                    <div key={key}>
                      <div className={`grid grid-cols-[2rem_2rem_minmax(0,1fr)_3.8rem_3.8rem_3.8rem_2.6rem] md:grid-cols-[2.4rem_2.2rem_minmax(0,1fr)_4.6rem_4.6rem_4.6rem_2.8rem] items-center gap-1.5 p-1.5 rounded-xl border ${row.done ? "bg-gray-4/28 border-[#E80000]/20" : "bg-gray-3/23 border-gray-5/25"}`}>
                        <span className="text-[11px] text-gray-8 font-semibold text-center">{rowIdx + 1}</span>

                        <button
                          type="button"
                          onClick={() => updateSet(exercise.id, rowIdx, { type: nextSetType(row.type) })}
                          disabled={row.done}
                          className="h-8 rounded-lg border border-gray-5/30 bg-gray-2 text-[10px] text-gray-9 font-semibold disabled:opacity-50"
                        >
                          {row.type}
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
                          className="text-[10px] text-gray-7 text-center truncate rounded-lg border border-transparent hover:border-gray-5/20 px-1 h-8"
                        >
                          {previous ? `${previous.load}x${previous.reps}` : "-"}
                        </button>

                        <input
                          type="number"
                          value={row.load}
                          inputMode="numeric"
                          onChange={(event) => updateSet(exercise.id, rowIdx, { load: event.target.value })}
                          disabled={row.done}
                          placeholder="0"
                          className="h-8 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
                        />

                        <input
                          type="number"
                          value={row.reps}
                          inputMode="numeric"
                          onChange={(event) => updateSet(exercise.id, rowIdx, { reps: event.target.value })}
                          disabled={row.done}
                          placeholder={String(exercise.reps)}
                          className="h-8 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
                        />

                        <input
                          type="number"
                          value={row.rpe}
                          inputMode="numeric"
                          min={1}
                          max={10}
                          onChange={(event) => updateSet(exercise.id, rowIdx, { rpe: event.target.value })}
                          disabled={row.done}
                          placeholder="8"
                          className="h-8 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
                        />

                        <button
                          type="button"
                          onClick={() => toggleDone(exercise, rowIdx)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                            row.done
                              ? "border-[#E80000]/35 bg-[#E80000]/16 text-[#FF6D6D]"
                              : "border-gray-5/35 bg-gray-2 text-gray-8"
                          }`}
                        >
                          {row.done ? <Check size={13} /> : "OK"}
                        </button>
                      </div>

                      {isImproved ? (
                        <p className="mt-1 text-[10px] text-[#FF6D6D] font-semibold text-right inline-flex items-center justify-end gap-1 w-full">
                          <Sparkles size={11} /> PR
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-4 sm:px-6 pb-[calc(var(--safe-bottom)+12px)] bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          <button
            onClick={handleValidateSession}
            disabled={completedSets !== totalSets || totalSets === 0}
            className={`w-full h-[52px] rounded-2xl font-semibold text-sm ${
              completedSets === totalSets && totalSets > 0
                ? "optiz-gradient-bg text-white"
                : "bg-gray-3 border border-gray-5/40 text-gray-7"
            }`}
          >
            {t("trainingValidateSession")}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    return archives.find((archive) => archive.programId === programId && archive.sessionId === sid) || null;
  };

  const isCompletedToday = (programId: string, sid: string) => {
    return completions.has(sessionKey(programId, sid));
  };

  const launchProgram = (programId: string) => {
    const program = MASS_PROGRAMS.find((item) => item.id === programId);
    const session = program?.sessions[0];
    if (!program || !session) return;
    if (isCompletedToday(program.id, session.id)) return;

    setActiveTracker({
      programId: program.id,
      programTitle: program.title,
      session,
    });
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
    // Optimistic local update
    setArchives((prev) => [archive, ...prev].slice(0, 160));

    if (!archive.programId.startsWith("freestyle-")) {
      setCompletions((prev) => new Set([...prev, sessionKey(archive.programId, archive.sessionId)]));
    }

    // Persist to server
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

    // Award XP via centralized idempotent event system
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

  if (activeTracker) {
    return (
      <SessionTracker
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
            onChange={(event) => setBuilderName(event.target.value)}
            className="mt-3 w-full h-10 rounded-xl bg-gray-3/45 border border-gray-5/35 px-3 text-sm text-gray-12"
            placeholder={t("trainingSessionName")}
          />
        </div>

        <div className="space-y-2.5 mb-4">
          {builderRows.map((row, index) => (
            <div key={`builder-${index}`} className="rounded-2xl border border-gray-5/34 bg-gray-3/20 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_4.6rem_4.6rem_2.6rem] gap-2 items-center">
                <div className="relative">
                  <select
                    value={row.exerciseId}
                    onChange={(event) => {
                      const next = event.target.value;
                      setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, exerciseId: next } : item)));
                    }}
                    className="w-full h-10 rounded-xl bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12 appearance-none"
                  >
                    {EXERCISE_LIBRARY.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-7 pointer-events-none" />
                </div>

                <input
                  type="number"
                  min={1}
                  value={row.sets}
                  onChange={(event) => {
                    const value = Math.max(1, Number(event.target.value || "1"));
                    setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, sets: value } : item)));
                  }}
                  className="h-10 rounded-xl bg-gray-2 border border-gray-5/35 text-center text-sm text-gray-12"
                  aria-label={t("trainingAriaSets")}
                />

                <input
                  type="number"
                  min={1}
                  value={row.reps}
                  onChange={(event) => {
                    const value = Math.max(1, Number(event.target.value || "1"));
                    setBuilderRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, reps: value } : item)));
                  }}
                  className="h-10 rounded-xl bg-gray-2 border border-gray-5/35 text-center text-sm text-gray-12"
                  aria-label={t("trainingAriaReps")}
                />

                <button
                  onClick={() => setBuilderRows((prev) => prev.filter((_, idx) => idx !== index))}
                  className="h-10 rounded-xl border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
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
          className="w-full h-10 rounded-xl border border-gray-5/35 bg-gray-3/25 text-sm text-gray-11 font-semibold inline-flex items-center justify-center gap-1.5 mb-3"
        >
          <Plus size={14} /> {t("trainingAddExercise")}
        </button>

        <button onClick={handleSaveFreestyle} className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold">
          {t("trainingSaveFreestyle")}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-5">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">{t("trainingTitle")}</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          {t("trainingSubtitle")}
        </p>
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

      <div className="space-y-3 mb-5">
        {MASS_PROGRAMS.map((program, index) => {
          const session = program.sessions[0];
          const completed = isCompletedToday(program.id, session.id);
          const previous = getLastArchive(program.id, session.id);
          const setsCount = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);

          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`w-full text-left rounded-3xl border transition-all ${
                completed
                  ? "bg-gray-4/10 border-green-500/20 p-3 opacity-60"
                  : "bg-gray-2/82 border-gray-5/35 hover:border-[#E80000]/35 p-4"
              }`}
            >
              {completed ? (
                /* Collapsed completed state — locked out */
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-gray-10 leading-tight">{program.title}</p>
                      <p className="text-[11px] text-gray-7">{t("trainingDoneReopens")}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-green-500/70">+100 XP</span>
                </div>
              ) : (
                /* Active state — launchable */
                <button type="button" onClick={() => launchProgram(program.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[20px] font-semibold text-gray-12 leading-tight">{program.title}</p>
                      <p className="text-[12px] text-gray-8 mt-1">{program.subtitle}</p>
                    </div>
                    <span className="text-[18px] font-semibold text-[#FF5C5C]">+100 XP</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                      {session.exercises.length} {t("exercises")}
                    </span>
                    <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                      {setsCount} {t("sets")}
                    </span>
                    <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                      {session.durationMin} {t("minutesShort")}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] text-gray-7">
                    {previous
                      ? `${t("trainingLastPerf")} ${formatDate(previous.completedAt, locale)} · ${t("trainingVolumeLabel")} ${previous.totalVolume.toFixed(0)}`
                      : t("trainingNoArchive")}
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-gray-11 inline-flex items-center gap-1">
                    {t("trainingLaunch")} <Play size={13} />
                  </p>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-2/75 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-12">{t("trainingFreestyleSaved")}</h3>
          <button
            onClick={() => setMainView({ mode: "freestyle-builder" })}
            className="h-8 px-3 rounded-lg border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6666] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> {t("trainingNew")}
          </button>
        </div>

        {freestyleTemplates.length === 0 ? (
          <p className="text-[12px] text-gray-8">{t("trainingNoFreestyle")}</p>
        ) : (
          <div className="space-y-2">
            {freestyleTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-gray-5/25 bg-gray-3/20 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-12">{template.name}</p>
                    <p className="text-[11px] text-gray-8 mt-0.5">
                      {template.rows.length} {t("exercises")} · {t("trainingCreatedOn")} {formatDate(template.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => launchFreestyleTemplate(template.id)}
                      className="h-8 px-2.5 rounded-md border border-gray-5/35 bg-gray-2 text-gray-11 text-[11px] font-semibold"
                    >
                      {t("trainingLaunch")}
                    </button>
                    <button
                      onClick={() => handleDeleteFreestyle(template.id)}
                      className="w-8 h-8 rounded-md border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
                      aria-label={t("trainingAriaDelete")}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-3/18 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">{t("trainingHistory")}</h3>
        {archives.length === 0 ? (
          <p className="text-[12px] text-gray-8">{t("trainingNoArchive")}</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {archives.slice(0, 20).map((archive) => (
              <div key={archive.id} className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-12 truncate">{archive.programTitle}</p>
                  <span className="text-[11px] text-[#FF6666] font-semibold">+{archive.xpEarned} XP</span>
                </div>
                <p className="text-[11px] text-gray-8 mt-1">
                  {formatDate(archive.completedAt, locale)} · {t("trainingVolumeLabel")} {archive.totalVolume.toFixed(0)}
                </p>
                <p className="text-[10px] text-gray-7 mt-1 inline-flex items-center gap-1">
                  <Sparkles size={11} /> {archive.improvedSets} {t("trainingRecordsLabel")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
