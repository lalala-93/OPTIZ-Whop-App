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

interface TrainingHubScreenProps {
  userId: string;
  onAwardXp: (xp: number) => Promise<void>;
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
type SessionCompletions = Record<string, string>;

function historyKey(userId: string) {
  return `optiz-training-history-v4-${userId}`;
}

function freestyleKey(userId: string) {
  return `optiz-freestyle-templates-v4-${userId}`;
}

function completionKey(userId: string) {
  return `optiz-training-completions-v2-${userId}`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sessionKey(programId: string, sessionId: string) {
  return `${programId}:${sessionId}`;
}

function parsePositiveInt(raw: string, fallback: number) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.round(num);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
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

function SessionTracker({
  programId,
  programTitle,
  session,
  previousArchive,
  onBack,
  onSave,
}: SessionTrackerProps) {
  const [setsState, setSetsState] = useState<Record<string, DraftSet[]>>({});
  const [improvedKeys, setImprovedKeys] = useState<string[]>([]);
  const [flash, setFlash] = useState("");
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());

  useEffect(() => {
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

    setSetsState(initial);
    setImprovedKeys([]);
    setFlash("");
    setRestLeft(null);
    if (soundOn) playStartSound();
  }, [session, previousArchive, soundOn]);

  useEffect(() => {
    if (restLeft === null) return;

    if (restLeft <= 0) {
      setRestLeft(null);
      if (soundOn) playRoundStartSound();
      return;
    }

    const timer = setTimeout(() => {
      const next = restLeft - 1;
      if (soundOn && next <= 3 && next > 0) {
        playTickSound();
      }
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
      setFlash("Record battu");
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
          <ArrowLeft size={16} /> Retour
        </button>

        <button
          onClick={toggleSound}
          className="w-9 h-9 rounded-full border border-gray-5/35 bg-gray-3/35 text-gray-9 flex items-center justify-center"
          aria-label="Sound"
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
            {session.exercises.length} exos
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-gray-9 text-center">
            {totalSets} sets
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-gray-9 text-center">
            {session.durationMin} min
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2 py-2 text-[#FF6666] text-center font-semibold">
            +100 XP
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-gray-8 tabular-nums">{completedSets}/{totalSets} sets valides</p>
      </motion.div>

      <AnimatePresence>
        {restLeft !== null ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-[#E80000]/30 bg-[#E80000]/10 px-3 py-2 mb-3 flex items-center justify-between"
          >
            <p className="text-[12px] text-[#FF7D7D] font-semibold">Repos {restLeft}s</p>
            <button
              type="button"
              onClick={() => setRestLeft(null)}
              className="w-7 h-7 rounded-lg border border-[#E80000]/35 bg-[#E80000]/12 text-[#FF8080] flex items-center justify-center"
              aria-label="Skip rest"
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
                    aria-label="Video"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => addSet(exercise)}
                    className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/35 text-gray-8 flex items-center justify-center"
                    aria-label="Add set"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[2rem_2rem_minmax(0,1fr)_3.8rem_3.8rem_3.8rem_2.6rem] md:grid-cols-[2.4rem_2.2rem_minmax(0,1fr)_4.6rem_4.6rem_4.6rem_2.8rem] gap-1.5 px-1 pb-1 text-[10px] uppercase tracking-[0.1em] text-gray-7">
                <span className="text-center">Set</span>
                <span className="text-center">Type</span>
                <span className="text-center">Prev</span>
                <span className="text-center">Kg</span>
                <span className="text-center">Reps</span>
                <span className="text-center">RPE</span>
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
            Valider ma seance
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrainingHubScreen({ userId, onAwardXp }: TrainingHubScreenProps) {
  const [mainView, setMainView] = useState<MainView>({ mode: "library" });
  const [activeTracker, setActiveTracker] = useState<{
    programId: string;
    programTitle: string;
    session: ProgramSessionTemplate;
  } | null>(null);

  const [archives, setArchives] = useState<SessionArchive[]>([]);
  const [freestyleTemplates, setFreestyleTemplates] = useState<FreestyleTemplate[]>([]);
  const [completions, setCompletions] = useState<SessionCompletions>({});
  const [flash, setFlash] = useState("");

  const [builderName, setBuilderName] = useState("Freestyle");
  const [builderRows, setBuilderRows] = useState<Array<{ exerciseId: string; sets: number; reps: number }>>([
    { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 },
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHistory = localStorage.getItem(historyKey(userId));
    if (rawHistory) {
      try {
        setArchives(JSON.parse(rawHistory) as SessionArchive[]);
      } catch (error) {
        console.error("Failed to parse training history", error);
      }
    }

    const rawTemplates = localStorage.getItem(freestyleKey(userId));
    if (rawTemplates) {
      try {
        setFreestyleTemplates(JSON.parse(rawTemplates) as FreestyleTemplate[]);
      } catch (error) {
        console.error("Failed to parse freestyle templates", error);
      }
    }

    const rawCompletions = localStorage.getItem(completionKey(userId));
    if (rawCompletions) {
      try {
        setCompletions(JSON.parse(rawCompletions) as SessionCompletions);
      } catch (error) {
        console.error("Failed to parse training completions", error);
      }
    }
  }, [userId]);

  const saveArchives = (next: SessionArchive[]) => {
    setArchives(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(historyKey(userId), JSON.stringify(next));
    }
  };

  const saveTemplates = (next: FreestyleTemplate[]) => {
    setFreestyleTemplates(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(freestyleKey(userId), JSON.stringify(next));
    }
  };

  const saveCompletions = (next: SessionCompletions) => {
    setCompletions(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(completionKey(userId), JSON.stringify(next));
    }
  };

  const getLastArchive = (programId: string, sessionId: string) => {
    return archives.find((archive) => archive.programId === programId && archive.sessionId === sessionId) || null;
  };

  const isCompletedToday = (programId: string, sessionId: string) => {
    return completions[sessionKey(programId, sessionId)] === todayKey();
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
      programTitle: "Freestyle",
      session: {
        id: `freestyle-session-${template.id}`,
        name: template.name,
        focus: "Seance personnalisee",
        durationMin: Math.max(20, exercises.length * 8),
        exercises,
      },
    });
  };

  const saveFreestyleTemplate = () => {
    const rows = builderRows
      .map((row) => ({
        exerciseId: row.exerciseId,
        sets: Math.max(1, row.sets),
        reps: Math.max(1, row.reps),
      }))
      .filter((row) => !!EXERCISE_LIBRARY.find((item) => item.id === row.exerciseId));

    if (!rows.length) return;

    const template: FreestyleTemplate = {
      id: `tpl-${Date.now()}`,
      name: builderName.trim() || "Freestyle",
      createdAt: new Date().toISOString(),
      rows,
    };

    saveTemplates([template, ...freestyleTemplates]);
    setFlash("Seance freestyle sauvegardee");
    setTimeout(() => setFlash(""), 1800);

    setBuilderName("Freestyle");
    setBuilderRows([{ exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }]);
    setMainView({ mode: "library" });
  };

  const deleteFreestyleTemplate = (templateId: string) => {
    const next = freestyleTemplates.filter((item) => item.id !== templateId);
    saveTemplates(next);
  };

  const handleSessionSaved = async (archive: SessionArchive) => {
    const nextArchives = [archive, ...archives].slice(0, 160);
    saveArchives(nextArchives);

    if (!archive.programId.startsWith("freestyle-")) {
      const nextCompletions = {
        ...completions,
        [sessionKey(archive.programId, archive.sessionId)]: todayKey(),
      };
      saveCompletions(nextCompletions);
    }

    await onAwardXp(archive.xpEarned);

    setFlash(
      archive.improvedSets > 0
        ? `Seance validee: +100 XP, ${archive.improvedSets} records battus.`
        : "Seance validee: +100 XP.",
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
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="rounded-3xl border border-gray-5/42 bg-gray-2/82 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-12">Freestyle</h3>
          <p className="text-sm text-gray-8 mt-1">Cree une seance perso et sauvegarde-la dans Training.</p>
          <input
            value={builderName}
            onChange={(event) => setBuilderName(event.target.value)}
            className="mt-3 w-full h-10 rounded-xl bg-gray-3/45 border border-gray-5/35 px-3 text-sm text-gray-12"
            placeholder="Nom de la seance"
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
                  aria-label="Sets"
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
                  aria-label="Reps"
                />

                <button
                  onClick={() => setBuilderRows((prev) => prev.filter((_, idx) => idx !== index))}
                  className="h-10 rounded-xl border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
                  aria-label="Delete"
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
          <Plus size={14} /> Ajouter un exercice
        </button>

        <button onClick={saveFreestyleTemplate} className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold">
          Sauvegarder la seance freestyle
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-5">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Training</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Choisis ton type de workout, ouvre directement la seance et valide +100 XP.
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
            <motion.button
              key={program.id}
              type="button"
              disabled={completed}
              onClick={() => launchProgram(program.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`w-full text-left rounded-3xl border p-4 transition-all ${
                completed
                  ? "bg-gray-4/18 border-gray-5/20 cursor-not-allowed"
                  : "bg-gray-2/82 border-gray-5/35 hover:border-[#E80000]/35"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[20px] font-semibold text-gray-12 leading-tight">{program.title}</p>
                  <p className="text-[12px] text-gray-8 mt-1">{program.subtitle}</p>
                </div>
                <span className={`text-[18px] font-semibold ${completed ? "text-gray-8" : "text-[#FF5C5C]"}`}>
                  +100 XP
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                  {session.exercises.length} exercices
                </span>
                <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                  {setsCount} sets
                </span>
                <span className="rounded-full px-2.5 py-1 bg-gray-4/40 border border-gray-5/30 text-gray-9">
                  {session.durationMin} min
                </span>
              </div>

              <p className="mt-3 text-[11px] text-gray-7">
                {completed
                  ? "Fait aujourdhui. Reouverture demain."
                  : previous
                    ? `Derniere perf: ${formatDate(previous.completedAt)} · volume ${previous.totalVolume.toFixed(0)}`
                    : "Aucune perf archivee"}
              </p>

              {!completed ? (
                <p className="mt-2 text-[13px] font-semibold text-gray-11 inline-flex items-center gap-1">
                  Lancer <Play size={13} />
                </p>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-2/75 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-12">Freestyle sauvegarde</h3>
          <button
            onClick={() => setMainView({ mode: "freestyle-builder" })}
            className="h-8 px-3 rounded-lg border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6666] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> Nouveau
          </button>
        </div>

        {freestyleTemplates.length === 0 ? (
          <p className="text-[12px] text-gray-8">Aucune seance freestyle sauvegardee.</p>
        ) : (
          <div className="space-y-2">
            {freestyleTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-gray-5/25 bg-gray-3/20 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-12">{template.name}</p>
                    <p className="text-[11px] text-gray-8 mt-0.5">
                      {template.rows.length} exercices · cree le {formatDate(template.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => launchFreestyleTemplate(template.id)}
                      className="h-8 px-2.5 rounded-md border border-gray-5/35 bg-gray-2 text-gray-11 text-[11px] font-semibold"
                    >
                      Lancer
                    </button>
                    <button
                      onClick={() => deleteFreestyleTemplate(template.id)}
                      className="w-8 h-8 rounded-md border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
                      aria-label="Delete"
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
        <h3 className="text-sm font-semibold text-gray-12 mb-2">Historique activite</h3>
        {archives.length === 0 ? (
          <p className="text-[12px] text-gray-8">Aucune seance archivee.</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {archives.slice(0, 20).map((archive) => (
              <div key={archive.id} className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-12 truncate">{archive.programTitle}</p>
                  <span className="text-[11px] text-[#FF6666] font-semibold">+{archive.xpEarned} XP</span>
                </div>
                <p className="text-[11px] text-gray-8 mt-1">
                  {formatDate(archive.completedAt)} · volume {archive.totalVolume.toFixed(0)}
                </p>
                <p className="text-[10px] text-gray-7 mt-1 inline-flex items-center gap-1">
                  <Sparkles size={11} /> {archive.improvedSets} records
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
