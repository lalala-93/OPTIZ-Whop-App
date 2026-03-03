"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ExternalLink,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  MASS_PROGRAMS,
  type ProgramSessionTemplate,
} from "@/app/lib/training-programs";

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

interface SessionTrackerProps {
  programTitle: string;
  session: ProgramSessionTemplate;
  previousArchive: SessionArchive | null;
  onBack: () => void;
  onSave: (archive: SessionArchive) => void;
}

interface DraftSetState {
  load: string;
  reps: string;
  rpe: string;
  done: boolean;
}

type ViewState =
  | { mode: "programs" }
  | { mode: "sessions"; programId: string }
  | { mode: "tracker"; programId: string; sessionId: string }
  | { mode: "freestyle" };

function getHistoryKey(userId: string) {
  return `optiz-training-history-v1-${userId}`;
}

function getNotificationsKey(userId: string) {
  return `optiz-training-notifs-v1-${userId}`;
}

function getDateLabel(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function maybeNotify(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body });
}

function compareSet(current: SessionSetLog, previous?: SessionSetLog) {
  if (!previous) return false;
  if (current.reps > previous.reps) return true;
  if (current.reps === previous.reps && current.load > previous.load) return true;
  return false;
}

function SessionTracker({ programTitle, session, previousArchive, onBack, onSave }: SessionTrackerProps) {
  const [states, setStates] = useState<Record<string, DraftSetState[]>>({});
  const [flash, setFlash] = useState<string>("");
  const [improvedKeys, setImprovedKeys] = useState<string[]>([]);

  useEffect(() => {
    const initial: Record<string, DraftSetState[]> = {};
    session.exercises.forEach((exercise) => {
      const previousExercise = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id);
      initial[exercise.id] = Array.from({ length: exercise.sets }).map((_, idx) => {
        const prev = previousExercise?.sets[idx];
        return {
          load: prev ? String(prev.load) : "",
          reps: prev ? String(prev.reps) : String(exercise.reps),
          rpe: prev ? String(prev.rpe) : "8",
          done: false,
        };
      });
    });
    setStates(initial);
  }, [session, previousArchive]);

  const totalSets = useMemo(
    () => session.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    [session.exercises],
  );

  const completedSets = useMemo(() => {
    return Object.values(states).flat().filter((setRow) => setRow.done).length;
  }, [states]);

  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const updateSet = (exerciseId: string, index: number, patch: Partial<DraftSetState>) => {
    setStates((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((row, rowIdx) => (rowIdx === index ? { ...row, ...patch } : row)),
    }));
  };

  const toggleDone = (exerciseId: string, index: number) => {
    const row = states[exerciseId]?.[index];
    if (!row) return;

    const nextDone = !row.done;
    updateSet(exerciseId, index, { done: nextDone });

    if (!nextDone) return;

    const current: SessionSetLog = {
      load: Number(row.load || "0"),
      reps: Number(row.reps || "0"),
      rpe: Number(row.rpe || "0"),
    };

    const previous = previousArchive?.exercises
      .find((exercise) => exercise.exerciseId === exerciseId)
      ?.sets[index];

    const key = `${exerciseId}-${index}`;
    const alreadyMarked = improvedKeys.includes(key);
    if (!alreadyMarked && compareSet(current, previous)) {
      setImprovedKeys((prev) => [...prev, key]);
      setFlash("Nouveau record valide sur cette serie");
      setTimeout(() => setFlash(""), 2000);
      maybeNotify("OPTIZ", "Nouveau record valide pendant la seance");
    }
  };

  const handleSave = () => {
    if (completedSets !== totalSets) return;

    const logs: ExerciseLog[] = session.exercises.map((exercise) => {
      const setRows = states[exercise.id] || [];
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: setRows.map((row) => ({
          load: Number(row.load || "0"),
          reps: Number(row.reps || "0"),
          rpe: Number(row.rpe || "0"),
        })),
      };
    });

    const totalVolume = logs.reduce((sum, exercise) => {
      const exerciseVolume = exercise.sets.reduce((local, row) => local + row.load * row.reps, 0);
      return sum + exerciseVolume;
    }, 0);

    const archive: SessionArchive = {
      id: `${session.id}-${Date.now()}`,
      programId: programTitle,
      programTitle,
      sessionId: session.id,
      sessionName: session.name,
      completedAt: new Date().toISOString(),
      exercises: logs,
      totalVolume,
      improvedSets: improvedKeys.length,
      xpEarned: 100,
    };

    maybeNotify("OPTIZ", `Seance validee: +100 XP. ${improvedKeys.length > 0 ? "Records battus." : "Continue."}`);
    onSave(archive);
  };

  return (
    <div className="pb-24">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="rounded-3xl border border-gray-5/45 bg-gray-2/80 p-4 mb-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-7 font-semibold mb-1">{programTitle}</p>
        <h3 className="text-xl font-semibold text-gray-12">{session.name}</h3>
        <p className="text-sm text-gray-8 mt-1">{session.focus}</p>
        <div className="mt-3 h-1.5 rounded-full bg-gray-4/45 overflow-hidden">
          <motion.div className="h-full optiz-gradient-bg" animate={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-gray-8 tabular-nums">{completedSets}/{totalSets} series validees</div>
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
        {session.exercises.map((exercise) => {
          const rows = states[exercise.id] || [];
          const previousRows = previousArchive?.exercises.find((item) => item.exerciseId === exercise.id)?.sets || [];

          return (
            <div key={exercise.id} className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-12">{exercise.name}</p>
                  <p className="text-[11px] text-gray-8">{exercise.muscles}</p>
                </div>
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-gray-5/35 bg-gray-4/40 text-gray-8 flex items-center justify-center"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="space-y-1.5">
                {rows.map((row, index) => {
                  const previous = previousRows[index];
                  const key = `${exercise.id}-${index}`;
                  const isImproved = improvedKeys.includes(key);

                  return (
                    <div key={key} className={`grid grid-cols-[2.5rem_minmax(0,1fr)_4.1rem_4.1rem_3.8rem_2.5rem] items-center gap-1.5 p-1.5 rounded-lg ${row.done ? "bg-gray-4/35" : "bg-gray-3/25"}`}>
                      <span className="text-[11px] text-gray-8 font-semibold text-center">S{index + 1}</span>
                      <span className="text-[10px] text-gray-7 text-center truncate">
                        {previous ? `${previous.load}kg x ${previous.reps} RPE${previous.rpe}` : "-"}
                      </span>

                      <input
                        type="number"
                        value={row.load}
                        onChange={(event) => updateSet(exercise.id, index, { load: event.target.value })}
                        disabled={row.done}
                        placeholder="kg"
                        className="h-8 rounded-md bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-50"
                      />

                      <input
                        type="number"
                        value={row.reps}
                        onChange={(event) => updateSet(exercise.id, index, { reps: event.target.value })}
                        disabled={row.done}
                        placeholder="reps"
                        className="h-8 rounded-md bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-50"
                      />

                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={row.rpe}
                        onChange={(event) => updateSet(exercise.id, index, { rpe: event.target.value })}
                        disabled={row.done}
                        placeholder="rpe"
                        className="h-8 rounded-md bg-gray-2 border border-gray-5/30 text-center text-xs text-gray-12 disabled:opacity-50"
                      />

                      <button
                        onClick={() => toggleDone(exercise.id, index)}
                        className={`w-8 h-8 rounded-md border text-xs font-bold ${row.done ? "border-[#E80000]/35 bg-[#E80000]/16 text-[#FF6D6D]" : "border-gray-5/35 bg-gray-2 text-gray-8"}`}
                      >
                        OK
                      </button>

                      {isImproved ? (
                        <span className="col-span-full text-[10px] text-[#FF6D6D] font-semibold text-right">record</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <button
          onClick={handleSave}
          disabled={completedSets !== totalSets}
          className={`pointer-events-auto w-full max-w-[560px] mx-auto h-12 rounded-xl font-semibold text-sm ${
            completedSets === totalSets ? "optiz-gradient-bg text-white" : "bg-gray-3 border border-gray-5/40 text-gray-7"
          }`}
        >
          Valider la seance
        </button>
      </div>
    </div>
  );
}

export function TrainingHubScreen({ userId, onAwardXp }: TrainingHubScreenProps) {
  const [view, setView] = useState<ViewState>({ mode: "programs" });
  const [archives, setArchives] = useState<SessionArchive[]>([]);
  const [flash, setFlash] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [customName, setCustomName] = useState("Freestyle");
  const [customRows, setCustomRows] = useState<Array<{ exerciseId: string; sets: number; reps: number }>>([
    { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 },
  ]);
  const [customSession, setCustomSession] = useState<ProgramSessionTemplate | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHistory = localStorage.getItem(getHistoryKey(userId));
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as SessionArchive[];
        setArchives(parsed);
      } catch (error) {
        console.error("Failed to parse training history", error);
      }
    }

    const rawNotifications = localStorage.getItem(getNotificationsKey(userId));
    if (rawNotifications) {
      setNotificationsEnabled(rawNotifications === "true");
    }
  }, [userId]);

  const saveArchives = (next: SessionArchive[]) => {
    setArchives(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(getHistoryKey(userId), JSON.stringify(next));
    }
  };

  const saveNotificationsFlag = (value: boolean) => {
    setNotificationsEnabled(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(getNotificationsKey(userId), String(value));
    }
  };

  const selectedProgram = useMemo(() => {
    if (view.mode !== "sessions" && view.mode !== "tracker") return null;
    return MASS_PROGRAMS.find((program) => program.id === view.programId) || null;
  }, [view]);

  const selectedSession = useMemo(() => {
    if (view.mode !== "tracker") return null;
    if (view.programId === "freestyle-custom") return customSession;

    const program = MASS_PROGRAMS.find((item) => item.id === view.programId);
    return program?.sessions.find((session) => session.id === view.sessionId) || null;
  }, [view, customSession]);

  const getLastArchive = (programId: string, sessionId: string) => {
    return archives.find((archive) => archive.programId === programId && archive.sessionId === sessionId) || null;
  };

  const askNotificationsPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    saveNotificationsFlag(enabled);

    if (enabled) {
      maybeNotify("OPTIZ", "Notifications activees pour tes progres");
    }
  };

  const handleArchiveSave = async (archive: SessionArchive) => {
    const next = [archive, ...archives].slice(0, 100);
    saveArchives(next);

    await onAwardXp(archive.xpEarned);

    setFlash(
      archive.improvedSets > 0
        ? `Seance validee. +100 XP. ${archive.improvedSets} records battus.`
        : "Seance validee. +100 XP.",
    );
    setTimeout(() => setFlash(""), 3000);

    setView(archive.programId === "freestyle-custom" ? { mode: "programs" } : { mode: "sessions", programId: archive.programId });
  };

  if (view.mode === "tracker" && selectedSession) {
    return (
      <SessionTracker
        programTitle={selectedProgram?.title || "Freestyle"}
        session={selectedSession}
        previousArchive={getLastArchive(view.programId, selectedSession.id)}
        onBack={() => setView(view.programId === "freestyle-custom" ? { mode: "freestyle" } : { mode: "sessions", programId: view.programId })}
        onSave={handleArchiveSave}
      />
    );
  }

  if (view.mode === "freestyle") {
    return (
      <div className="pb-8">
        <button onClick={() => setView({ mode: "programs" })} className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="rounded-3xl border border-gray-5/45 bg-gray-2/80 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-12">Freestyle builder</h3>
          <p className="text-sm text-gray-8 mt-1">Cree ta seance, puis valide chaque serie avec charge, reps et RPE.</p>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            className="mt-3 w-full h-10 rounded-lg bg-gray-3/45 border border-gray-5/35 px-3 text-sm text-gray-12"
            placeholder="Nom de ta seance"
          />
        </div>

        <div className="space-y-2 mb-4">
          {customRows.map((row, index) => (
            <div key={`custom-row-${index}`} className="rounded-xl border border-gray-5/35 bg-gray-3/20 p-3">
              <div className="grid grid-cols-[1fr_5rem_5rem_2.6rem] gap-2">
                <div className="relative">
                  <select
                    value={row.exerciseId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCustomRows((prev) => prev.map((item, itemIdx) => (itemIdx === index ? { ...item, exerciseId: value } : item)));
                    }}
                    className="w-full h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-3 text-sm text-gray-12 appearance-none"
                  >
                    {EXERCISE_LIBRARY.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
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
                    setCustomRows((prev) => prev.map((item, itemIdx) => (itemIdx === index ? { ...item, sets: value } : item)));
                  }}
                  className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-2 text-sm text-gray-12 text-center"
                  placeholder="sets"
                />

                <input
                  type="number"
                  min={1}
                  value={row.reps}
                  onChange={(event) => {
                    const value = Math.max(1, Number(event.target.value || "1"));
                    setCustomRows((prev) => prev.map((item, itemIdx) => (itemIdx === index ? { ...item, reps: value } : item)));
                  }}
                  className="h-10 rounded-lg bg-gray-2 border border-gray-5/35 px-2 text-sm text-gray-12 text-center"
                  placeholder="reps"
                />

                <button
                  onClick={() => setCustomRows((prev) => prev.filter((_, itemIdx) => itemIdx !== index))}
                  className="h-10 rounded-lg border border-gray-5/35 bg-gray-2 text-gray-8 flex items-center justify-center"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setCustomRows((prev) => [...prev, { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }])
          }
          className="w-full h-10 rounded-lg border border-gray-5/35 bg-gray-3/25 text-sm text-gray-11 font-semibold mb-4 inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Ajouter un exercice
        </button>

        <button
          onClick={() => {
            const exercises = customRows
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
              .filter((item): item is NonNullable<typeof item> => item !== null);

            if (!exercises.length) return;

            const session: ProgramSessionTemplate = {
              id: `freestyle-${Date.now()}`,
              name: customName.trim() || "Freestyle",
              focus: "Session personnalisee",
              durationMin: Math.max(20, exercises.length * 8),
              exercises,
            };

            setCustomSession(session);
            setView({ mode: "tracker", programId: "freestyle-custom", sessionId: session.id });
          }}
          className="w-full h-12 rounded-xl optiz-gradient-bg text-white font-semibold"
        >
          Lancer la seance freestyle
        </button>
      </div>
    );
  }

  if (view.mode === "sessions" && selectedProgram) {
    return (
      <div className="pb-8">
        <button onClick={() => setView({ mode: "programs" })} className="inline-flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 mb-4">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="rounded-3xl border border-gray-5/45 bg-gray-2/80 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-12">{selectedProgram.title}</h3>
          <p className="text-sm text-gray-8 mt-1">{selectedProgram.subtitle}</p>
        </div>

        <div className="space-y-3">
          {selectedProgram.sessions.map((session, index) => {
            const previous = getLastArchive(selectedProgram.id, session.id);
            return (
              <motion.button
                key={session.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => setView({ mode: "tracker", programId: selectedProgram.id, sessionId: session.id })}
                className="w-full text-left rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4 hover:border-[#E80000]/35 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-7 font-semibold mb-1">Seance {index + 1}</p>
                    <h4 className="text-lg font-semibold text-gray-12">{session.name}</h4>
                    <p className="text-[12px] text-gray-8 mt-1">{session.focus}</p>
                  </div>
                  <div className="text-right text-[12px] text-gray-8 tabular-nums">
                    <p>{session.exercises.length} exos</p>
                    <p>{session.durationMin} min</p>
                  </div>
                </div>
                {previous ? (
                  <p className="mt-2 text-[11px] text-gray-7">
                    Derniere: {getDateLabel(previous.completedAt)} · volume {previous.totalVolume.toFixed(0)} · {previous.improvedSets} records
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-gray-7">Aucune seance archivee pour le moment</p>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-5">
        <h2 className="text-[26px] leading-tight font-semibold text-gray-12 mb-1.5">Pilier masse musculaire</h2>
        <p className="text-sm text-gray-8 leading-relaxed">
          Lance une seance, saisis charge/reps/RPE, valide chaque serie, archive et compare tes performances.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-gray-5/40 bg-gray-3/18 p-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-12">Notifications progression</p>
          <p className="text-[11px] text-gray-8">Recoit des rappels et des messages quand tu bats un record.</p>
        </div>
        <button
          onClick={askNotificationsPermission}
          className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 ${
            notificationsEnabled
              ? "border-[#E80000]/35 bg-[#E80000]/12 text-[#FF6666]"
              : "border-gray-5/35 bg-gray-3/30 text-gray-10"
          }`}
        >
          <Bell size={13} /> {notificationsEnabled ? "Active" : "Activer"}
        </button>
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

      <div className="space-y-3 mb-4">
        {MASS_PROGRAMS.map((program, index) => (
          <motion.button
            key={program.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => setView({ mode: "sessions", programId: program.id })}
            className="w-full text-left rounded-2xl border border-gray-5/35 bg-gray-2/78 p-4 hover:border-[#E80000]/35 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[19px] font-semibold text-gray-12">{program.title}</h3>
                <p className="text-[12px] text-gray-8 mt-1">{program.subtitle}</p>
              </div>
              <span className="text-[12px] text-[#FF6666] font-semibold">{program.sessions.length} seances</span>
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => setView({ mode: "freestyle" })}
        className="w-full h-12 rounded-xl border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6D6D] font-semibold inline-flex items-center justify-center gap-2 mb-6"
      >
        <Plus size={16} /> Freestyle: creer ma seance
      </button>

      <div className="rounded-2xl border border-gray-5/35 bg-gray-3/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-12">Activity history</h3>
          <span className="text-[11px] text-gray-8 tabular-nums">{archives.length} seances</span>
        </div>

        {archives.length === 0 ? (
          <p className="text-[12px] text-gray-8">Aucune seance archivee pour le moment.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {archives.slice(0, 20).map((archive) => (
              <div key={archive.id} className="rounded-xl border border-gray-5/25 bg-gray-2/55 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-12 truncate">{archive.sessionName}</p>
                  <span className="text-[11px] text-[#FF6666] font-semibold">+{archive.xpEarned} XP</span>
                </div>
                <p className="text-[11px] text-gray-8 mt-1">
                  {archive.programTitle} · {getDateLabel(archive.completedAt)} · volume {archive.totalVolume.toFixed(0)}
                </p>
                <div className="mt-1 text-[10px] text-gray-7 inline-flex items-center gap-1.5">
                  <Sparkles size={11} /> {archive.improvedSets} records battus
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
