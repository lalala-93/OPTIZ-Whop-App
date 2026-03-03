"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  MASS_PROGRAMS,
  type ProgramExerciseTemplate,
  type ProgramSessionTemplate,
} from "@/app/lib/training-programs";
import {
  playCompleteSound,
  playRoundStartSound,
  playStartSound,
  playWorkoutCompleteSound,
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

interface DraftSet {
  load: string;
  reps: string;
  rpe: string;
  done: boolean;
}

type MainView =
  | { mode: "library" }
  | { mode: "freestyle-builder" };

type SessionCompletions = Record<string, string>;

function historyKey(userId: string) {
  return `optiz-training-history-v3-${userId}`;
}

function freestyleKey(userId: string) {
  return `optiz-freestyle-templates-v3-${userId}`;
}

function completionKey(userId: string) {
  return `optiz-training-completions-v1-${userId}`;
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

  useEffect(() => {
    const initial: Record<string, DraftSet[]> = {};

    session.exercises.forEach((exercise) => {
      const previousRows = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];
      initial[exercise.id] = Array.from({ length: exercise.sets }).map((_, idx) => {
        const prev = previousRows[idx];
        return {
          load: prev ? String(prev.load) : "",
          reps: prev ? String(prev.reps) : String(exercise.reps),
          rpe: prev ? String(prev.rpe) : "8",
          done: false,
        };
      });
    });

    setSetsState(initial);
    setImprovedKeys([]);
    setFlash("");
    playStartSound();
  }, [session, previousArchive]);

  const totalSets = useMemo(
    () => session.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    [session.exercises],
  );

  const completedSets = useMemo(
    () => Object.values(setsState).flat().filter((row) => row.done).length,
    [setsState],
  );

  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DraftSet>) => {
    setSetsState((prev) => {
      const rows = prev[exerciseId] || [];
      return {
        ...prev,
        [exerciseId]: rows.map((row, idx) => (idx === setIndex ? { ...row, ...patch } : row)),
      };
    });
  };

  const toggleDone = (exercise: ProgramExerciseTemplate, setIndex: number) => {
    const row = setsState[exercise.id]?.[setIndex];
    if (!row) return;

    const nextDone = !row.done;
    updateSet(exercise.id, setIndex, { done: nextDone });

    if (!nextDone) return;

    playCompleteSound();

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
      setFlash("Record battu sur cette serie");
      setTimeout(() => setFlash(""), 1700);
    }

    const nextRows = (setsState[exercise.id] || []).map((item, idx) =>
      idx === setIndex ? { ...item, done: true } : item,
    );
    const exerciseFullyDone = nextRows.every((item) => item.done);
    if (exerciseFullyDone) {
      playRoundStartSound();
    }
  };

  const handleValidateSession = () => {
    if (completedSets !== totalSets) return;

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
      (sum, exercise) =>
        sum + exercise.sets.reduce((local, setRow) => local + setRow.load * setRow.reps, 0),
      0,
    );

    playWorkoutCompleteSound();

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

  return (
    <div className="pb-[120px]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <motion.div
        className="rounded-3xl border border-gray-5/42 bg-gray-2/82 p-4 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-7 font-semibold mb-1">
          {programTitle}
        </p>
        <h3 className="text-[24px] font-semibold text-gray-12 leading-tight">{session.name}</h3>
        <p className="text-[12px] text-gray-8 mt-1">{session.focus}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2.5 py-2 text-gray-9 text-center">
            {session.exercises.length} exercices
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2.5 py-2 text-gray-9 text-center">
            {totalSets} series
          </div>
          <div className="rounded-xl border border-gray-5/30 bg-gray-3/22 px-2.5 py-2 text-[#FF6666] text-center font-semibold">
            +100 XP
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-gray-8 tabular-nums">
          {completedSets}/{totalSets} series validees
        </p>
      </motion.div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-3/18 p-3 mb-4 text-[11px] text-gray-9 leading-relaxed">
        <p>
          <span className="font-semibold text-gray-12">Exercice:</span> le mouvement realise (ex: pompes).
        </p>
        <p>
          <span className="font-semibold text-gray-12">Rep:</span> le nombre de repetitions du geste (ex: 10 pompes).
        </p>
        <p>
          <span className="font-semibold text-gray-12">Serie:</span> en musculation classique, repetitions dun exercice avant repos.
        </p>
        <p>
          <span className="font-semibold text-gray-12">Serie (EMOM):</span> un tour complet de tous les exercices du bloc.
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

      <div className="space-y-3">
        {session.exercises.map((exercise, exIdx) => {
          const rows = setsState[exercise.id] || [];
          const previousRows =
            previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];

          return (
            <motion.div
              key={exercise.id}
              className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: exIdx * 0.03 }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-gray-12 truncate">{exercise.name}</p>
                  <p className="text-[11px] text-gray-8 truncate">{exercise.muscles}</p>
                </div>
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/40 text-gray-8 flex items-center justify-center shrink-0"
                  aria-label="Video"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_3.5rem_3.5rem_2.6rem] md:grid-cols-[2.4rem_minmax(0,1fr)_4.4rem_4.4rem_4.4rem_2.8rem] gap-1.5 px-1 pb-1 text-[10px] uppercase tracking-[0.1em] text-gray-7">
                <span className="text-center">Set</span>
                <span className="text-center">Derniere</span>
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
                      <div
                        className={`grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_3.5rem_3.5rem_2.6rem] md:grid-cols-[2.4rem_minmax(0,1fr)_4.4rem_4.4rem_4.4rem_2.8rem] items-center gap-1.5 p-1.5 rounded-xl border ${
                          row.done
                            ? "bg-gray-4/30 border-[#E80000]/20"
                            : "bg-gray-3/23 border-gray-5/25"
                        }`}
                      >
                        <span className="text-[11px] text-gray-8 font-semibold text-center">S{rowIdx + 1}</span>

                        <span className="text-[10px] text-gray-7 text-center truncate px-1">
                          {previous ? `${previous.load}kg x ${previous.reps} RPE${previous.rpe}` : "-"}
                        </span>

                        <input
                          type="number"
                          value={row.load}
                          inputMode="numeric"
                          onChange={(event) => updateSet(exercise.id, rowIdx, { load: event.target.value })}
                          disabled={row.done}
                          placeholder="0"
                          className="h-9 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
                        />

                        <input
                          type="number"
                          value={row.reps}
                          inputMode="numeric"
                          onChange={(event) => updateSet(exercise.id, rowIdx, { reps: event.target.value })}
                          disabled={row.done}
                          placeholder={String(exercise.reps)}
                          className="h-9 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
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
                          className="h-9 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-55"
                        />

                        <button
                          type="button"
                          onClick={() => toggleDone(exercise, rowIdx)}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                            row.done
                              ? "border-[#E80000]/35 bg-[#E80000]/16 text-[#FF6D6D]"
                              : "border-gray-5/35 bg-gray-2 text-gray-8"
                          }`}
                        >
                          {row.done ? <Check size={14} /> : "OK"}
                        </button>
                      </div>

                      {isImproved ? (
                        <p className="mt-1 text-[10px] text-[#FF6D6D] font-semibold text-right inline-flex items-center justify-end gap-1 w-full">
                          <Sparkles size={11} /> record
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
            disabled={completedSets !== totalSets}
            className={`w-full h-[52px] rounded-2xl font-semibold text-sm ${
              completedSets === totalSets
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
  const [builderRows, setBuilderRows] = useState<
    Array<{ exerciseId: string; sets: number; reps: number }>
  >([{ exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }]);

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

  const isCompletedToday = (programId: string, sessionId: string) => {
    const key = sessionKey(programId, sessionId);
    return completions[key] === todayKey();
  };

  const getLastArchive = (programId: string, sessionId: string) => {
    return archives.find((archive) => archive.programId === programId && archive.sessionId === sessionId) || null;
  };

  const launchProgramSession = (programId: string, sessionId: string) => {
    if (isCompletedToday(programId, sessionId)) return;

    const program = MASS_PROGRAMS.find((item) => item.id === programId);
    const session = program?.sessions.find((item) => item.id === sessionId);
    if (!program || !session) return;

    setActiveTracker({
      programId,
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
          <p className="text-sm text-gray-8 mt-1">
            Cree une seance perso, sauvegarde-la dans Training, puis lance-la quand tu veux.
          </p>
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
                      setBuilderRows((prev) =>
                        prev.map((item, idx) => (idx === index ? { ...item, exerciseId: next } : item)),
                      );
                    }}
                    className="w-full h-10 rounded-xl bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12 appearance-none"
                  >
                    {EXERCISE_LIBRARY.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-3 text-gray-7 pointer-events-none"
                  />
                </div>

                <input
                  type="number"
                  min={1}
                  value={row.sets}
                  onChange={(event) => {
                    const value = Math.max(1, Number(event.target.value || "1"));
                    setBuilderRows((prev) =>
                      prev.map((item, idx) => (idx === index ? { ...item, sets: value } : item)),
                    );
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
                    setBuilderRows((prev) =>
                      prev.map((item, idx) => (idx === index ? { ...item, reps: value } : item)),
                    );
                  }}
                  className="h-10 rounded-xl bg-gray-2 border border-gray-5/35 text-center text-sm text-gray-12"
                  aria-label="Reps"
                />

                <button
                  onClick={() => setBuilderRows((prev) => prev.filter((_, idx) => idx !== index))}
                  className="h-10 rounded-xl border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setBuilderRows((prev) => [...prev, { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }])
          }
          className="w-full h-10 rounded-xl border border-gray-5/35 bg-gray-3/25 text-sm text-gray-11 font-semibold inline-flex items-center justify-center gap-1.5 mb-3"
        >
          <Plus size={14} /> Ajouter un exercice
        </button>

        <button
          onClick={saveFreestyleTemplate}
          className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold"
        >
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
          Programmes pre-remplis efficaces, suivi set par set, historique et progression reelle.
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

      <div className="rounded-2xl border border-gray-5/34 bg-gray-3/18 p-3 mb-4 text-[11px] text-gray-9 leading-relaxed">
        <p>
          <span className="font-semibold text-gray-12">Exercice:</span> nom du mouvement.
        </p>
        <p>
          <span className="font-semibold text-gray-12">Rep:</span> nombre de repetitions dun geste.
        </p>
        <p>
          <span className="font-semibold text-gray-12">Serie:</span> bloc de repetitions valide dun exercice.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {MASS_PROGRAMS.map((program, index) => (
          <motion.section
            key={program.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-3xl border border-gray-5/34 bg-gray-2/78 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[20px] font-semibold text-gray-12">{program.title}</h3>
                <p className="text-[12px] text-gray-8 mt-1">{program.subtitle}</p>
              </div>
              <span className="text-[11px] text-[#FF6666] font-semibold uppercase tracking-[0.12em]">
                {program.sessions.length} seances
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {program.sessions.map((session) => {
                const previous = getLastArchive(program.id, session.id);
                const completed = isCompletedToday(program.id, session.id);

                return (
                  <button
                    key={session.id}
                    type="button"
                    disabled={completed}
                    onClick={() => launchProgramSession(program.id, session.id)}
                    className={`w-full text-left rounded-2xl border px-3.5 py-3 transition-all ${
                      completed
                        ? "bg-gray-4/18 border-gray-5/20 cursor-not-allowed"
                        : "bg-gray-3/20 border-gray-5/30 hover:border-[#E80000]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-gray-12 truncate">{session.name}</p>
                        <p className="text-[11px] text-gray-8 mt-0.5 truncate">{session.focus}</p>
                      </div>
                      <span className={`text-[15px] font-semibold ${completed ? "text-gray-8" : "text-[#FF5C5C]"}`}>
                        +100
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-gray-8">
                      {session.exercises.length} exos · {session.durationMin} min
                    </p>

                    <p className="mt-1 text-[10px] text-gray-7 truncate">
                      {completed
                        ? "Fait aujourdhui. Reset demain."
                        : previous
                          ? `Derniere: ${formatDate(previous.completedAt)} · volume ${previous.totalVolume.toFixed(0)}`
                          : "Aucune perf archivee"}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-2/75 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-12">Seances freestyle sauvegardees</h3>
          <button
            onClick={() => setMainView({ mode: "freestyle-builder" })}
            className="h-8 px-3 rounded-lg border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6666] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> Nouvelle
          </button>
        </div>

        {freestyleTemplates.length === 0 ? (
          <p className="text-[12px] text-gray-8">Aucune seance freestyle sauvegardee.</p>
        ) : (
          <div className="space-y-2">
            {freestyleTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-gray-5/25 bg-gray-3/20 px-3 py-2.5"
              >
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
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-5/34 bg-gray-3/18 p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-2">Activity history</h3>
        {archives.length === 0 ? (
          <p className="text-[12px] text-gray-8">Aucune seance archivee.</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {archives.slice(0, 25).map((archive) => (
              <div
                key={archive.id}
                className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-12 truncate">{archive.sessionName}</p>
                  <span className="text-[11px] text-[#FF6666] font-semibold">+{archive.xpEarned} XP</span>
                </div>
                <p className="text-[11px] text-gray-8 mt-1">
                  {archive.programTitle} · {formatDate(archive.completedAt)} · volume {archive.totalVolume.toFixed(0)}
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
