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
} from "lucide-react";
import Image from "next/image";
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

// ── Types ──

interface TrainingHubScreenProps {
  userId: string;
  onAwardXpEvent: (source: string, referenceId: string, xpAmount: number) => Promise<void>;
  initialCompletionsToday?: { programId: string; sessionId: string }[];
}

interface SessionSetLog { load: number; reps: number; rpe: number; }
interface ExerciseLog { exerciseId: string; exerciseName: string; sets: SessionSetLog[]; }

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

interface DraftSet { load: string; reps: string; done: boolean; }

type MainView =
  | { mode: "library" }
  | { mode: "program-detail"; program: ProgramTemplate }
  | { mode: "freestyle-builder" };

// ── Helpers ──

function sessionKey(pid: string, sid: string) { return `${pid}:${sid}`; }

function parseNum(raw: string, fb: number) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fb;
}

function fmtDate(iso: string, loc: "en" | "fr") {
  return new Date(iso).toLocaleDateString(loc === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function isImproved(cur: SessionSetLog, prev?: SessionSetLog) {
  if (!prev) return false;
  return cur.reps > prev.reps || (cur.reps === prev.reps && cur.load > prev.load);
}

function buildSets(session: ProgramSessionTemplate, prev: SessionArchive | null): Record<string, DraftSet[]> {
  const m: Record<string, DraftSet[]> = {};
  session.exercises.forEach((ex) => {
    const ps = prev?.exercises.find((e) => e.exerciseId === ex.id)?.sets || [];
    m[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
      load: ps[i] ? String(ps[i].load) : "",
      reps: ps[i] ? String(ps[i].reps) : String(ex.reps),
      done: false,
    }));
  });
  return m;
}

// ══════════════════════════════════════════
// WorkoutFunnel — clean iOS exercise-by-exercise
// ══════════════════════════════════════════

function WorkoutFunnel({
  programId, programTitle, session, previousArchive, onBack, onSave,
}: {
  programId: string;
  programTitle: string;
  session: ProgramSessionTemplate;
  previousArchive: SessionArchive | null;
  onBack: () => void;
  onSave: (a: SessionArchive) => void;
}) {
  const { t } = useI18n();
  const [exIdx, setExIdx] = useState(0);
  const [sets, setSets] = useState(() => buildSets(session, previousArchive));
  const [prKeys, setPrKeys] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<SessionArchive | null>(null);
  const t0 = useRef(Date.now());

  useEffect(() => {
    if (done) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [done]);

  const ex = session.exercises[exIdx];
  const rows = ex ? sets[ex.id] || [] : [];
  const prevRows = ex ? previousArchive?.exercises.find((e) => e.exerciseId === ex.id)?.sets || [] : [];
  const allDone = rows.length > 0 && rows.every((r) => r.done);
  const isLast = exIdx === session.exercises.length - 1;

  const upd = (eid: string, i: number, p: Partial<DraftSet>) => {
    setSets((prev) => ({
      ...prev,
      [eid]: (prev[eid] || []).map((r, idx) => (idx === i ? { ...r, ...p } : r)),
    }));
  };

  const check = (i: number) => {
    if (!ex) return;
    const r = rows[i];
    if (!r) return;
    const next = !r.done;
    upd(ex.id, i, { done: next });
    if (!next) return;
    if (soundOn) playCompleteSound();
    const cur: SessionSetLog = { load: parseNum(r.load, 0), reps: parseNum(r.reps, ex.reps), rpe: 8 };
    const k = `${ex.id}-${i}`;
    if (!prKeys.includes(k) && isImproved(cur, prevRows[i])) setPrKeys((p) => [...p, k]);
  };

  const finish = () => {
    const logs: ExerciseLog[] = session.exercises.map((e) => ({
      exerciseId: e.id,
      exerciseName: e.name,
      sets: (sets[e.id] || []).map((r) => ({ load: parseNum(r.load, 0), reps: parseNum(r.reps, e.reps), rpe: 8 })),
    }));
    const vol = logs.reduce((s, el) => s + el.sets.reduce((a, r) => a + r.load * r.reps, 0), 0);
    if (soundOn) playWorkoutCompleteSound();
    setDone(true);
    setResult({
      id: `${session.id}-${Date.now()}`,
      programId, programTitle,
      sessionId: session.id, sessionName: session.name,
      completedAt: new Date().toISOString(),
      exercises: logs, totalVolume: vol, improvedSets: prKeys.length, xpEarned: 100,
    });
  };

  const next = () => {
    if (!allDone) return;
    if (isLast) finish();
    else setExIdx((p) => p + 1);
  };

  // ── Completion ──
  if (done && result) {
    return (
      <motion.div className="pb-8 flex flex-col items-center pt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[#E80000]/12 border border-[#E80000]/25 flex items-center justify-center mb-5"
        >
          <Trophy size={28} className="text-[#FF6D6D]" />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-xl font-bold text-gray-12">
          {t("trainingCongrats")}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-[13px] text-gray-8 mt-1">
          {t("trainingCongratsSubtitle")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full mt-6 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 p-3 text-center">
            <Clock size={15} className="text-gray-7 mx-auto mb-1" />
            <p className="text-[15px] font-bold text-gray-12 tabular-nums">{fmtTimer(elapsed)}</p>
            <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingDuration")}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 p-3 text-center">
            <Dumbbell size={15} className="text-gray-7 mx-auto mb-1" />
            <p className="text-[15px] font-bold text-gray-12 tabular-nums">{result.totalVolume.toLocaleString()}</p>
            <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingKg")}</p>
          </div>
          <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 p-3 text-center">
            <Sparkles size={15} className="text-[#FFD700] mx-auto mb-1" />
            <p className="text-[15px] font-bold text-gray-12 tabular-nums">{result.improvedSets}</p>
            <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingRecordsLabel")}</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => onSave(result)}
          className="w-full mt-7 h-12 rounded-2xl optiz-gradient-bg text-white font-semibold text-[15px] active:scale-[0.97] transition-transform"
        >
          {t("trainingClaimXp", { xp: "100" })}
        </motion.button>
      </motion.div>
    );
  }

  // ── Exercise screen ──
  return (
    <div className="pb-[100px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-5/30 bg-gray-3/30 text-gray-9 flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-gray-3/40 border border-gray-5/25">
            <Clock size={11} className="text-gray-7" />
            <span className="text-[13px] font-medium text-gray-11 tabular-nums">{fmtTimer(elapsed)}</span>
          </div>
          <button
            onClick={() => { const n = !soundOn; setSoundOn(n); setSoundEnabled(n); }}
            className="w-10 h-10 rounded-full border border-gray-5/30 bg-gray-3/30 text-gray-8 flex items-center justify-center"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 mb-3">
        {session.exercises.map((_, i) => (
          <div key={i} className={`h-[3px] rounded-full flex-1 transition-all duration-300 ${
            i < exIdx ? "bg-[#E80000]" : i === exIdx ? "bg-[#FF6D6D]" : "bg-gray-5/30"
          }`} />
        ))}
      </div>

      {/* Exercise counter */}
      <p className="text-[11px] text-gray-7 uppercase tracking-widest mb-2">
        {t("trainingExerciseOf", { current: String(exIdx + 1), total: String(session.exercises.length) })}
      </p>

      {ex && (
        <motion.div key={ex.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          {/* Exercise info */}
          <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 p-3.5 mb-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold text-gray-12 leading-snug">{ex.name}</h3>
                <p className="text-[12px] text-gray-8 mt-0.5">{ex.muscles}</p>
              </div>
              <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#E80000]/8 border border-[#E80000]/20 flex items-center justify-center shrink-0">
                <Play size={16} className="text-[#FF6D6D] ml-0.5" />
              </a>
            </div>
          </div>

          {/* Set table — clean Everfit style */}
          <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] px-3 py-2 border-b border-gray-5/20">
              <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderSet")}</span>
              <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderKg")}</span>
              <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderReps")}</span>
              <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-5/15">
              {rows.map((row, i) => {
                const isPr = prKeys.includes(`${ex.id}-${i}`);
                return (
                  <div key={i} className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center px-3 py-1.5 transition-colors ${row.done ? "bg-[#E80000]/5" : ""}`}>
                    <div className="flex items-center justify-center">
                      <span className={`text-[13px] font-medium ${row.done ? "text-[#FF6D6D]" : "text-gray-8"}`}>{i + 1}</span>
                      {isPr && <Sparkles size={10} className="text-[#FFD700] ml-0.5" />}
                    </div>

                    <div className="flex justify-center px-1">
                      <input
                        type="number"
                        value={row.load}
                        inputMode="decimal"
                        onChange={(e) => upd(ex.id, i, { load: e.target.value })}
                        disabled={row.done}
                        placeholder="-"
                        className="w-full max-w-[5rem] h-9 rounded-lg bg-transparent text-center text-[14px] text-gray-12 placeholder:text-gray-6 disabled:opacity-50 focus:bg-gray-3/30 transition-colors outline-none"
                      />
                    </div>

                    <div className="flex justify-center px-1">
                      <input
                        type="number"
                        value={row.reps}
                        inputMode="numeric"
                        onChange={(e) => upd(ex.id, i, { reps: e.target.value })}
                        disabled={row.done}
                        placeholder={String(ex.reps)}
                        className="w-full max-w-[5rem] h-9 rounded-lg bg-transparent text-center text-[14px] text-gray-12 placeholder:text-gray-6 disabled:opacity-50 focus:bg-gray-3/30 transition-colors outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => check(i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all mx-auto ${
                        row.done
                          ? "bg-[#E80000] text-white"
                          : "border border-gray-5/40 text-gray-6"
                      }`}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 sm:px-6 pb-[calc(var(--safe-bottom)+10px)] bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          <button
            onClick={next}
            disabled={!allDone}
            className={`w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-1.5 transition-all ${
              allDone
                ? "optiz-gradient-bg text-white active:scale-[0.97]"
                : "bg-gray-3 border border-gray-5/35 text-gray-7"
            }`}
          >
            {isLast ? t("trainingValidateSession") : t("trainingNextExercise")}
            {!isLast && allDone && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ProgramDetailView
// ══════════════════════════════════════════

function ProgramDetailView({
  program, completed, lastArchive, onBack, onLaunch,
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

  return (
    <div className="pb-8">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-gray-8 mb-3">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      {/* Hero image */}
      <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[2/1]">
        <Image src={program.image} alt={program.title} fill className={`object-cover ${program.id === "optiz-start" ? "object-[center_25%]" : "object-[center_70%]"}`} sizes="(max-width: 768px) 100vw, 600px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[11px] uppercase tracking-widest text-[#FF6D6D] font-semibold mb-0.5">
            {program.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate")}
          </p>
          <h2 className="text-[22px] font-bold text-white leading-tight">{program.title}</h2>
          <p className="text-[13px] text-white/70 mt-0.5">{program.subtitle}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-xl border border-gray-5/25 bg-gray-2/60 py-2 text-center">
          <p className="text-[14px] font-semibold text-gray-12">{session.exercises.length}</p>
          <p className="text-[10px] text-gray-7">{t("exercises")}</p>
        </div>
        <div className="flex-1 rounded-xl border border-gray-5/25 bg-gray-2/60 py-2 text-center">
          <p className="text-[14px] font-semibold text-gray-12">{setsCount}</p>
          <p className="text-[10px] text-gray-7">{t("sets")}</p>
        </div>
        <div className="flex-1 rounded-xl border border-gray-5/25 bg-gray-2/60 py-2 text-center">
          <p className="text-[14px] font-semibold text-gray-12">~{session.durationMin}</p>
          <p className="text-[10px] text-gray-7">{t("minutesShort")}</p>
        </div>
        <div className="flex-1 rounded-xl border border-[#E80000]/20 bg-[#E80000]/6 py-2 text-center">
          <p className="text-[14px] font-semibold text-[#FF6D6D]">+100</p>
          <p className="text-[10px] text-gray-7">XP</p>
        </div>
      </div>

      {/* Last session */}
      {lastArchive && (
        <div className="rounded-xl border border-gray-5/20 bg-gray-3/15 px-3 py-2 mb-4">
          <p className="text-[11px] text-gray-7">
            {t("trainingLastPerf")} {fmtDate(lastArchive.completedAt, locale)} · {t("trainingVolumeLabel")} {lastArchive.totalVolume.toFixed(0)}
          </p>
        </div>
      )}

      {/* Exercise list */}
      <div className="rounded-2xl border border-gray-5/25 bg-gray-2/60 overflow-hidden mb-6">
        <div className="px-3 py-2 border-b border-gray-5/15">
          <p className="text-[12px] font-semibold text-gray-10 uppercase tracking-wider">{t("trainingExerciseList")}</p>
        </div>
        <div className="divide-y divide-gray-5/12">
          {session.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="w-5 h-5 rounded-md bg-gray-4/40 flex items-center justify-center shrink-0 text-[11px] font-medium text-gray-8">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-gray-12 truncate">{ex.name}</p>
                <p className="text-[11px] text-gray-7">{ex.muscles} · {ex.sets}x{ex.reps}</p>
              </div>
              <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-7 shrink-0">
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Launch */}
      <button
        onClick={onLaunch}
        disabled={completed}
        className={`w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-1.5 transition-all ${
          completed ? "bg-gray-3 border border-gray-5/35 text-gray-7" : "optiz-gradient-bg text-white active:scale-[0.97]"
        }`}
      >
        {completed ? t("trainingDoneReopens") : <><Play size={16} /> {t("trainingStartSession")}</>}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════
// TrainingHubScreen
// ══════════════════════════════════════════

export function TrainingHubScreen({ userId, onAwardXpEvent, initialCompletionsToday }: TrainingHubScreenProps) {
  const { t, locale } = useI18n();
  const [view, setView] = useState<MainView>({ mode: "library" });
  const [tracker, setTracker] = useState<{ programId: string; programTitle: string; session: ProgramSessionTemplate } | null>(null);
  const [archives, setArchives] = useState<SessionArchive[]>([]);
  const [freestyle, setFreestyle] = useState<FreestyleTemplate[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(() => {
    const s = new Set<string>();
    (initialCompletionsToday || []).forEach((c) => s.add(sessionKey(c.programId, c.sessionId)));
    return s;
  });
  const [flash, setFlash] = useState("");
  const [histExp, setHistExp] = useState(false);
  const [bName, setBName] = useState(() => t("trainingFreestyleDefaultName"));
  const [bRows, setBRows] = useState<Array<{ exerciseId: string; sets: number; reps: number }>>([
    { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 },
  ]);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [h, f] = await Promise.all([getWorkoutHistory(userId, 20), getFreestyleTemplates(userId)]);
        if (off) return;
        setArchives((h || []).map((w: Record<string, unknown>) => ({
          id: w.id as string, programId: w.program_id as string, programTitle: w.program_title as string,
          sessionId: w.session_id as string, sessionName: w.session_name as string, completedAt: w.completed_at as string,
          totalVolume: Number(w.total_volume ?? 0), improvedSets: (w.improved_sets as number) ?? 0, xpEarned: (w.xp_earned as number) ?? 0,
          exercises: ((w.workout_set_logs as Record<string, unknown>[]) || []).reduce<ExerciseLog[]>((acc, s) => {
            const eid = s.exercise_id as string;
            let e = acc.find((x) => x.exerciseId === eid);
            if (!e) { e = { exerciseId: eid, exerciseName: s.exercise_name as string, sets: [] }; acc.push(e); }
            e.sets.push({ load: Number(s.load ?? 0), reps: Number(s.reps ?? 0), rpe: Number(s.rpe ?? 8) });
            return acc;
          }, []),
        })));
        setFreestyle(f || []);
      } catch (err) { console.error("[OPTIZ] Load training data", err); }
    })();
    return () => { off = true; };
  }, [userId]);

  const lastArchive = (pid: string, sid: string) => archives.find((a) => a.programId === pid && a.sessionId === sid) || null;
  const isDone = (pid: string, sid: string) => completions.has(sessionKey(pid, sid));

  const launch = (p: ProgramTemplate) => {
    const s = p.sessions[0];
    if (!s || isDone(p.id, s.id)) return;
    setTracker({ programId: p.id, programTitle: p.title, session: s });
    setView({ mode: "library" });
  };

  const launchFS = (tid: string) => {
    const tpl = freestyle.find((x) => x.id === tid);
    if (!tpl) return;
    const exs: ProgramExerciseTemplate[] = tpl.rows.map((r) => {
      const b = EXERCISE_LIBRARY.find((x) => x.id === r.exerciseId);
      if (!b) return null;
      return { id: `${b.id}-${r.sets}x${r.reps}`, name: b.name, sets: r.sets, reps: r.reps, muscles: b.muscles, videoUrl: b.videoUrl };
    }).filter((x): x is ProgramExerciseTemplate => x !== null);
    if (!exs.length) return;
    setTracker({ programId: `freestyle-${tpl.id}`, programTitle: t("trainingBuilderTitle"), session: { id: `fs-${tpl.id}`, name: tpl.name, focus: t("trainingFreestyleSession"), durationMin: Math.max(20, exs.length * 8), exercises: exs } });
  };

  const saveFS = async () => {
    const rows = bRows.filter((r) => EXERCISE_LIBRARY.some((x) => x.id === r.exerciseId)).map((r) => ({ ...r, sets: Math.max(1, r.sets), reps: Math.max(1, r.reps) }));
    if (!rows.length) return;
    try {
      const res = await serverSaveFreestyleTemplate(userId, bName.trim() || t("trainingFreestyleDefaultName"), rows);
      setFreestyle((p) => [{ id: res.id, name: bName.trim() || t("trainingFreestyleDefaultName"), createdAt: new Date().toISOString(), rows }, ...p]);
      setBName(t("trainingFreestyleDefaultName")); setBRows([{ exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }]); setView({ mode: "library" });
    } catch (err) { console.error("[OPTIZ] Save freestyle", err); }
  };

  const delFS = async (id: string) => {
    setFreestyle((p) => p.filter((x) => x.id !== id));
    try { await deleteFreestyleTemplateAction(userId, id); } catch {}
  };

  const onSaved = async (a: SessionArchive) => {
    setArchives((p) => [a, ...p].slice(0, 160));
    if (!a.programId.startsWith("freestyle-")) setCompletions((p) => new Set([...p, sessionKey(a.programId, a.sessionId)]));
    try {
      const payload: WorkoutLogPayload = {
        programId: a.programId, programTitle: a.programTitle, sessionId: a.sessionId, sessionName: a.sessionName,
        totalVolume: a.totalVolume, improvedSets: a.improvedSets, xpEarned: a.xpEarned,
        exercises: a.exercises.map((e) => ({ exerciseId: e.exerciseId, exerciseName: e.exerciseName, sets: e.sets.map((s) => ({ load: s.load, reps: s.reps, rpe: s.rpe })) })),
      };
      await saveWorkoutLog(userId, payload);
    } catch (err) { console.error("[OPTIZ] Save workout", err); }
    const today = new Date().toISOString().split("T")[0];
    await onAwardXpEvent("workout_complete", `workout-${a.programId}-${a.sessionId}-${today}`, a.xpEarned);
    setFlash(a.improvedSets > 0 ? t("trainingSessionValidatedRecords", { xp: String(a.xpEarned), records: String(a.improvedSets) }) : t("trainingSessionValidated", { xp: String(a.xpEarned) }));
    setTimeout(() => setFlash(""), 2600);
    setTracker(null);
  };

  // ── Workout funnel ──
  if (tracker) {
    return (
      <WorkoutFunnel
        key={`${tracker.programId}:${tracker.session.id}`}
        programId={tracker.programId} programTitle={tracker.programTitle}
        session={tracker.session} previousArchive={lastArchive(tracker.programId, tracker.session.id)}
        onBack={() => { setTracker(null); }}
        onSave={onSaved}
      />
    );
  }

  // ── Program detail ──
  if (view.mode === "program-detail") {
    const p = view.program; const s = p.sessions[0];
    return (
      <ProgramDetailView
        program={p} completed={isDone(p.id, s.id)} lastArchive={lastArchive(p.id, s.id)}
        onBack={() => setView({ mode: "library" })} onLaunch={() => launch(p)}
      />
    );
  }

  // ── Freestyle builder ──
  if (view.mode === "freestyle-builder") {
    return (
      <div className="pb-8">
        <button onClick={() => setView({ mode: "library" })} className="inline-flex items-center gap-1 text-[13px] text-gray-8 mb-3">
          <ArrowLeft size={14} /> {t("back")}
        </button>

        <div className="rounded-2xl border border-gray-5/30 bg-gray-2/70 p-3.5 mb-4">
          <h3 className="text-[15px] font-semibold text-gray-12 mb-0.5">{t("trainingBuilderTitle")}</h3>
          <p className="text-[12px] text-gray-8 mb-3">{t("trainingFreestyleDesc")}</p>
          <input value={bName} onChange={(e) => setBName(e.target.value)} className="w-full h-10 rounded-xl bg-gray-3/40 border border-gray-5/30 px-3 text-[13px] text-gray-12" placeholder={t("trainingSessionName")} />
        </div>

        <div className="space-y-2 mb-3">
          {bRows.map((row, i) => (
            <div key={i} className="rounded-xl border border-gray-5/25 bg-gray-3/15 p-2.5">
              <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_2.5rem] gap-1.5 items-center">
                <div className="relative">
                  <select value={row.exerciseId} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, exerciseId: e.target.value } : x))} className="w-full h-10 rounded-lg bg-gray-2 border border-gray-5/30 px-2 text-[12px] text-gray-12 appearance-none">
                    {EXERCISE_LIBRARY.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-3.5 text-gray-7 pointer-events-none" />
                </div>
                <input type="number" min={1} value={row.sets} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, sets: Math.max(1, Number(e.target.value || 1)) } : x))} className="h-10 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-[12px] text-gray-12" />
                <input type="number" min={1} value={row.reps} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, reps: Math.max(1, Number(e.target.value || 1)) } : x))} className="h-10 rounded-lg bg-gray-2 border border-gray-5/30 text-center text-[12px] text-gray-12" />
                <button onClick={() => setBRows((p) => p.filter((_, idx) => idx !== i))} className="h-10 w-10 rounded-lg border border-gray-5/30 bg-gray-2 text-gray-7 flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setBRows((p) => [...p, { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }])} className="w-full h-10 rounded-xl border border-gray-5/30 bg-gray-3/20 text-[12px] text-gray-10 font-medium inline-flex items-center justify-center gap-1 mb-3">
          <Plus size={12} /> {t("trainingAddExercise")}
        </button>

        <button onClick={saveFS} className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold text-[14px] active:scale-[0.97]">
          {t("trainingSaveFreestyle")}
        </button>
      </div>
    );
  }

  // ── Library ──
  const hLim = histExp ? 20 : 5;

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-12">{t("trainingTitle")}</h2>
        <p className="text-[13px] text-gray-8 mt-0.5">{t("trainingSubtitle")}</p>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-[#E80000]/30 bg-[#E80000]/8 text-[#FF6D6D] text-[13px] px-3 py-2 mb-3">
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program cards with images */}
      <div className="space-y-3 mb-5">
        {MASS_PROGRAMS.map((prog, i) => {
          const s = prog.sessions[0];
          const comp = isDone(prog.id, s.id);

          return (
            <motion.button
              key={prog.id}
              type="button"
              onClick={() => setView({ mode: "program-detail", program: prog })}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.98] ${
                comp ? "border-gray-5/15 opacity-45" : "border-gray-5/30"
              }`}
            >
              {/* Image */}
              <div className="relative h-36">
                <Image src={prog.image} alt={prog.title} fill className={`object-cover ${prog.id === "optiz-start" ? "object-[center_25%]" : "object-[center_70%]"}`} sizes="(max-width: 768px) 100vw, 600px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[18px] font-bold text-white leading-tight">{prog.title}</p>
                      <p className="text-[12px] text-white/65 mt-0.5">{prog.subtitle}</p>
                    </div>
                    <span className="text-[14px] font-bold text-[#FF6D6D] shrink-0">+100 XP</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <span className="rounded-full px-2 py-0.5 bg-white/10 backdrop-blur-sm text-[10px] text-white/80">
                      {s.exercises.length} {t("exercises")}
                    </span>
                    <span className="rounded-full px-2 py-0.5 bg-white/10 backdrop-blur-sm text-[10px] text-white/80">
                      ~{s.durationMin} {t("minutesShort")}
                    </span>
                    <span className="rounded-full px-2 py-0.5 bg-white/10 backdrop-blur-sm text-[10px] text-white/80">
                      {prog.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className={`px-3.5 py-2 flex items-center justify-between ${comp ? "bg-gray-3/30" : "bg-gray-2/70"}`}>
                {comp ? (
                  <p className="text-[11px] text-gray-7 inline-flex items-center gap-1"><Check size={12} /> {t("trainingDoneReopens")}</p>
                ) : (
                  <p className="text-[12px] font-medium text-gray-11 inline-flex items-center gap-0.5">{t("trainingLaunch")} <ChevronRight size={14} /></p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Freestyle */}
      <div className="rounded-2xl border border-gray-5/25 bg-gray-2/60 p-3.5 mb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-[13px] font-semibold text-gray-12">{t("trainingFreestyleSaved")}</h3>
          <button onClick={() => setView({ mode: "freestyle-builder" })} className="h-9 px-3 rounded-lg border border-[#E80000]/25 bg-[#E80000]/8 text-[#FF6D6D] text-[11px] font-semibold inline-flex items-center gap-1">
            <Plus size={12} /> {t("trainingNew")}
          </button>
        </div>
        {freestyle.length === 0 ? (
          <p className="text-[11px] text-gray-7">{t("trainingNoFreestyle")}</p>
        ) : (
          <div className="space-y-1.5">
            {freestyle.map((tpl) => (
              <div key={tpl.id} className="rounded-xl border border-gray-5/20 bg-gray-3/15 px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-12 truncate">{tpl.name}</p>
                  <p className="text-[10px] text-gray-7">{tpl.rows.length} {t("exercises")} · {fmtDate(tpl.createdAt, locale)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => launchFS(tpl.id)} className="h-9 px-3 rounded-lg border border-gray-5/30 bg-gray-2 text-[11px] text-gray-11 font-medium">{t("trainingLaunch")}</button>
                  <button onClick={() => delFS(tpl.id)} className="w-9 h-9 rounded-lg border border-gray-5/30 bg-gray-2 text-gray-7 flex items-center justify-center"><X size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-5/25 bg-gray-3/12 p-3.5">
        <h3 className="text-[13px] font-semibold text-gray-12 mb-2">{t("trainingHistory")}</h3>
        {archives.length === 0 ? (
          <p className="text-[11px] text-gray-7">{t("trainingNoArchive")}</p>
        ) : (
          <div className="space-y-1.5">
            {archives.slice(0, hLim).map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-5/20 bg-gray-2/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-gray-12 truncate">{a.programTitle}</p>
                  <span className="text-[11px] text-[#FF6D6D] font-semibold">+{a.xpEarned} XP</span>
                </div>
                <p className="text-[10px] text-gray-7 mt-0.5">
                  {fmtDate(a.completedAt, locale)} · {t("trainingVolumeLabel")} {a.totalVolume.toFixed(0)}
                  {a.improvedSets > 0 && <> · <Sparkles size={9} className="inline" /> {a.improvedSets}</>}
                </p>
              </div>
            ))}
            {archives.length > 5 && (
              <button onClick={() => setHistExp((p) => !p)} className="w-full h-9 rounded-lg border border-gray-5/20 bg-gray-3/10 text-[11px] text-gray-7 font-medium flex items-center justify-center gap-1">
                {histExp ? t("homeShowLess") : t("homeShowMore")}
                <ChevronDown size={12} className={`transition-transform ${histExp ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
