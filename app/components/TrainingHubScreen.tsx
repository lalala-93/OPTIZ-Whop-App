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

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface DraftSet { load: string; reps: string; rpe: string; done: boolean; }

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
    const rowCount = Math.max(ex.sets, ps.length);
    m[ex.id] = Array.from({ length: rowCount }).map((_, idx) => {
      const p = ps[idx];
      const targetReps = ex.perSetReps?.[idx] ?? ex.reps;
      const defaultLoadStr = ex.defaultLoad ? String(ex.defaultLoad) : "";
      return {
        load: p ? String(p.load) : defaultLoadStr,
        reps: p ? String(p.reps) : String(targetReps > 0 ? targetReps : 5),
        rpe: "",
        done: false,
      };
    });
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
    const cur: SessionSetLog = { load: parseNum(r.load, 0), reps: parseNum(r.reps, ex.reps), rpe: parseNum(r.rpe, 8) };
    const k = `${ex.id}-${i}`;
    if (!prKeys.includes(k) && isImproved(cur, prevRows[i])) setPrKeys((p) => [...p, k]);
  };

  const finish = () => {
    const logs: ExerciseLog[] = session.exercises.map((e) => ({
      exerciseId: e.id,
      exerciseName: e.name,
      sets: (sets[e.id] || []).map((r) => ({ load: parseNum(r.load, 0), reps: parseNum(r.reps, e.reps), rpe: parseNum(r.rpe, 8) })),
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
      <motion.div className="pb-8 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Session complete image — compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full rounded-2xl overflow-hidden mb-6 relative"
          style={{ aspectRatio: "16/10" }}
        >
          <Image
            src="/images/session-complete.png"
            alt="Session Complete"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full grid grid-cols-3 gap-2.5 mb-6">
          <Card className="border-white/[0.06] bg-white/[0.03]">
            <CardContent className="p-3 text-center">
              <Clock size={14} className="text-gray-7 mx-auto mb-1" />
              <p className="text-[15px] font-bold text-gray-12 tabular-nums">{fmtTimer(elapsed)}</p>
              <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingDuration")}</p>
            </CardContent>
          </Card>
          <Card className="border-white/[0.06] bg-white/[0.03]">
            <CardContent className="p-3 text-center">
              <Dumbbell size={14} className="text-gray-7 mx-auto mb-1" />
              <p className="text-[15px] font-bold text-gray-12 tabular-nums">{result.totalVolume.toLocaleString()}</p>
              <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingKg")}</p>
            </CardContent>
          </Card>
          <Card className="border-white/[0.06] bg-white/[0.03]">
            <CardContent className="p-3 text-center">
              <Sparkles size={14} className="text-[#FFD700] mx-auto mb-1" />
              <p className="text-[15px] font-bold text-gray-12 tabular-nums">{result.improvedSets}</p>
              <p className="text-[10px] text-gray-7 mt-0.5">{t("trainingRecordsLabel")}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full"
        >
          <Button
            onClick={() => onSave(result)}
            className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0 hover:opacity-90"
          >
            {t("trainingClaimXp", { xp: "100" })}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Exercise screen ──
  const progressPercent = session.exercises.length > 0 ? ((exIdx) / session.exercises.length) * 100 : 0;

  return (
    <div className="pb-[160px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 rounded-full border-gray-5/30 bg-gray-3/30 text-gray-9"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-gray-3/40 border border-gray-5/25">
            <Clock size={11} className="text-gray-7" />
            <span className="text-[13px] font-medium text-gray-11 tabular-nums">{fmtTimer(elapsed)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { const n = !soundOn; setSoundOn(n); setSoundEnabled(n); }}
            className="w-10 h-10 rounded-full border-gray-5/30 bg-gray-3/30 text-gray-8"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </Button>
        </div>
      </div>

      {/* Exercise counter — step dots */}
      <div className="flex items-center gap-1.5 mb-3">
        {session.exercises.map((_, i) => (
          <div key={i} className={cn(
            "h-1 rounded-full flex-1 transition-all duration-300",
            i < exIdx ? "bg-[#E80000]" : i === exIdx ? "bg-[#FF6D6D]" : "bg-white/[0.06]"
          )} />
        ))}
      </div>
      <p className="text-[11px] text-gray-7 uppercase tracking-widest mb-2">
        {t("trainingExerciseOf", { current: String(exIdx + 1), total: String(session.exercises.length) })}
      </p>

      {ex && (
        <motion.div key={ex.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          {/* Exercise info */}
          <Card className="border-gray-5/30 bg-gray-2/70 mb-2.5">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-semibold text-gray-12 leading-snug">{ex.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[10px] bg-gray-4/40 text-gray-8 border-0 px-1.5 py-0">
                      {ex.muscles}
                    </Badge>
                  </div>
                </div>
                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[#E80000]/8 border border-[#E80000]/20 flex items-center justify-center shrink-0">
                  <Play size={16} className="text-[#FF6D6D] ml-0.5" />
                </a>
              </div>
              {/* Exercise note (superset, rest, instructions) */}
              {ex.note && (
                <p className="text-[11px] text-gray-8 mt-2 leading-relaxed border-t border-white/[0.04] pt-2">
                  {ex.note}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Set table */}
          <Card className="border-gray-5/30 bg-gray-2/70 overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="grid grid-cols-[2.2rem_1fr_1fr_3rem_2.5rem] px-3 py-2 border-b border-gray-5/20">
                <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderSet")}</span>
                <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderKg")}</span>
                <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">{t("trainingHeaderReps")}</span>
                <span className="text-[11px] uppercase tracking-wider text-gray-7 text-center">RPE</span>
                <span />
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-5/15">
                {rows.map((row, i) => {
                  const isPr = prKeys.includes(`${ex.id}-${i}`);
                  return (
                    <div key={i} className={cn(
                      "grid grid-cols-[2.2rem_1fr_1fr_3rem_2.5rem] items-center px-3 py-1.5 transition-colors",
                      row.done && "bg-[#E80000]/5"
                    )}>
                      <div className="flex items-center justify-center gap-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 w-5 p-0 flex items-center justify-center rounded-md text-[11px] font-medium border-0",
                            row.done ? "bg-[#E80000]/10 text-[#FF6D6D]" : "bg-gray-4/30 text-gray-8"
                          )}
                        >
                          {i + 1}
                        </Badge>
                        {isPr && (
                          <Badge className="h-4 px-1 bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 text-[8px]">
                            <Sparkles size={8} className="mr-0.5" />PR
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-center px-1">
                        <Input
                          type="number"
                          value={row.load}
                          inputMode="decimal"
                          onChange={(e) => upd(ex.id, i, { load: e.target.value })}
                          disabled={row.done}
                          placeholder="-"
                          className="w-full max-w-[5rem] h-9 rounded-lg bg-transparent text-center text-[14px] text-gray-12 placeholder:text-gray-6 disabled:opacity-50 border-0 focus:bg-gray-3/30 transition-colors"
                        />
                      </div>

                      <div className="flex justify-center px-1">
                        <Input
                          type="number"
                          value={row.reps}
                          inputMode="numeric"
                          onChange={(e) => upd(ex.id, i, { reps: e.target.value })}
                          disabled={row.done}
                          placeholder={String(ex.perSetReps?.[i] ?? (ex.reps > 0 ? ex.reps : 5))}
                          className="w-full max-w-[5rem] h-9 rounded-lg bg-transparent text-center text-[14px] text-gray-12 placeholder:text-gray-6 disabled:opacity-50 border-0 focus:bg-gray-3/30 transition-colors"
                        />
                      </div>

                      <div className="flex justify-center">
                        <select
                          value={row.rpe || ""}
                          onChange={(e) => upd(ex.id, i, { rpe: e.target.value })}
                          disabled={row.done}
                          className="h-9 w-full max-w-[3rem] rounded-lg bg-transparent text-center text-[13px] text-gray-12 disabled:opacity-50 border-0 focus:bg-gray-3/30 transition-colors appearance-none"
                        >
                          <option value="">-</option>
                          {[6, 7, 8, 9, 10].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => check(i)}
                        className={cn(
                          "w-8 h-8 rounded-full mx-auto transition-all",
                          row.done
                            ? "bg-[#E80000] text-white hover:bg-[#E80000]/90"
                            : "border border-gray-5/40 text-gray-6 hover:bg-gray-3/30"
                        )}
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+70px)] bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          <Button
            onClick={next}
            disabled={!allDone}
            className={cn(
              "w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-1.5 transition-all",
              allDone
                ? "optiz-gradient-bg text-white active:scale-[0.97] border-0 hover:opacity-90"
                : "bg-gray-3 border border-gray-5/35 text-gray-7 hover:bg-gray-3"
            )}
          >
            {isLast ? t("trainingValidateSession") : t("trainingNextExercise")}
            {!isLast && allDone && <ChevronRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ProgramDetailView
// ══════════════════════════════════════════

function ProgramDetailView({
  program, isSessionDone, getLastArchive, onBack, onLaunchSession,
}: {
  program: ProgramTemplate;
  isSessionDone: (sessionId: string) => boolean;
  getLastArchive: (sessionId: string) => SessionArchive | null;
  onBack: () => void;
  onLaunchSession: (session: ProgramSessionTemplate) => void;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="pb-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] text-gray-8 mb-3 px-2 hover:bg-gray-3/30"
      >
        <ArrowLeft size={14} /> {t("back")}
      </Button>

      {/* Header */}
      <div className="mb-5">
        <Badge className="bg-[#E80000]/12 text-[#FF6D6D] border-[#E80000]/20 mb-2 text-[9px] uppercase tracking-widest font-semibold hover:bg-[#E80000]/12">
          {program.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate")} · {program.sessions.length} séances
        </Badge>
        <h2 className="text-xl font-bold text-gray-12 leading-tight">{program.title}</h2>
        <p className="text-[13px] text-gray-8 mt-0.5">{program.subtitle}</p>
      </div>

      {/* Session cards */}
      <div className="space-y-3">
        {program.sessions.map((session, sIdx) => {
          const done = isSessionDone(session.id);
          const archive = getLastArchive(session.id);

          return (
            <Card key={session.id} className={cn("border-white/[0.06] bg-white/[0.03] overflow-hidden", done && "opacity-50")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-gray-12">{session.name}</p>
                    <p className="text-[11px] text-gray-8 mt-0.5">{session.focus} · ~{session.durationMin} min</p>
                    {archive && (
                      <p className="text-[10px] text-gray-7 mt-1">
                        {t("trainingLastPerf")} {fmtDate(archive.completedAt, locale)}
                      </p>
                    )}
                  </div>
                  <Badge className="shrink-0 bg-[#E80000]/10 text-[#FF6D6D] border-[#E80000]/15 text-[11px] font-semibold hover:bg-[#E80000]/10">
                    +100 XP
                  </Badge>
                </div>

                {/* Exercise preview */}
                <div className="space-y-1 mb-3">
                  {session.exercises.map((exercise, i) => (
                    <div key={exercise.id} className="flex items-baseline gap-2 text-[11px]">
                      <span className="text-gray-7 w-4 text-right shrink-0">{i + 1}.</span>
                      <span className="text-gray-11 truncate">{exercise.name}</span>
                      <span className="text-gray-7 shrink-0 ml-auto">
                        {exercise.repsLabel || `${exercise.sets}x${exercise.reps}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Launch button */}
                <Button
                  onClick={() => onLaunchSession(session)}
                  disabled={done}
                  size="sm"
                  className={cn(
                    "w-full h-10 rounded-xl text-[13px] font-semibold",
                    done
                      ? "bg-gray-3 border border-gray-5/30 text-gray-7 hover:bg-gray-3"
                      : "optiz-gradient-bg text-white border-0 hover:opacity-90 active:scale-[0.97]"
                  )}
                >
                  {done ? t("trainingDoneReopens") : t("trainingLaunch")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
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

  const launch = (p: ProgramTemplate, session?: ProgramSessionTemplate) => {
    const s = session || p.sessions[0];
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
    const p = view.program;
    return (
      <ProgramDetailView
        program={p}
        isSessionDone={(sid) => isDone(p.id, sid)}
        getLastArchive={(sid) => lastArchive(p.id, sid)}
        onBack={() => setView({ mode: "library" })}
        onLaunchSession={(session) => launch(p, session)}
      />
    );
  }

  // ── Freestyle builder ──
  if (view.mode === "freestyle-builder") {
    return (
      <div className="pb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView({ mode: "library" })}
          className="inline-flex items-center gap-1 text-[13px] text-gray-8 mb-3 px-2 hover:bg-gray-3/30"
        >
          <ArrowLeft size={14} /> {t("back")}
        </Button>

        <Card className="border-gray-5/30 bg-gray-2/70 mb-4">
          <CardContent className="p-3.5">
            <h3 className="text-[15px] font-semibold text-gray-12 mb-0.5">{t("trainingBuilderTitle")}</h3>
            <p className="text-[12px] text-gray-8 mb-3">{t("trainingFreestyleDesc")}</p>
            <Input
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              className="w-full h-10 rounded-xl bg-gray-3/40 border-gray-5/30 px-3 text-[13px] text-gray-12"
              placeholder={t("trainingSessionName")}
            />
          </CardContent>
        </Card>

        <div className="space-y-2 mb-3">
          {bRows.map((row, i) => (
            <Card key={i} className="border-gray-5/25 bg-gray-3/15">
              <CardContent className="p-2.5">
                <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_2.5rem] gap-1.5 items-center">
                  <div className="relative">
                    <select value={row.exerciseId} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, exerciseId: e.target.value } : x))} className="w-full h-10 rounded-lg bg-gray-2 border border-gray-5/30 px-2 text-[12px] text-gray-12 appearance-none">
                      {EXERCISE_LIBRARY.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-3.5 text-gray-7 pointer-events-none" />
                  </div>
                  <Input type="number" min={1} value={row.sets} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, sets: Math.max(1, Number(e.target.value || 1)) } : x))} className="h-10 rounded-lg bg-gray-2 border-gray-5/30 text-center text-[12px] text-gray-12" />
                  <Input type="number" min={1} value={row.reps} onChange={(e) => setBRows((p) => p.map((x, idx) => idx === i ? { ...x, reps: Math.max(1, Number(e.target.value || 1)) } : x))} className="h-10 rounded-lg bg-gray-2 border-gray-5/30 text-center text-[12px] text-gray-12" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBRows((p) => p.filter((_, idx) => idx !== i))}
                    className="h-10 w-10 rounded-lg border-gray-5/30 bg-gray-2 text-gray-7"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => setBRows((p) => [...p, { exerciseId: EXERCISE_LIBRARY[0].id, sets: 3, reps: 10 }])}
          className="w-full h-10 rounded-xl border-gray-5/30 bg-gray-3/20 text-[12px] text-gray-10 font-medium inline-flex items-center justify-center gap-1 mb-3"
        >
          <Plus size={12} /> {t("trainingAddExercise")}
        </Button>

        <Button
          onClick={saveFS}
          className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold text-[14px] active:scale-[0.97] border-0 hover:opacity-90"
        >
          {t("trainingSaveFreestyle")}
        </Button>
      </div>
    );
  }

  // ── Library ──
  const hLim = histExp ? 20 : 5;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-5">
        <Dumbbell size={16} className="text-gray-7" />
        <h2 className="text-base font-semibold text-gray-12">{t("trainingTitle")}</h2>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-[#E80000]/30 bg-[#E80000]/8 text-[#FF6D6D] text-[13px] px-3 py-2 mb-3">
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program cards */}
      <div className="space-y-3 mb-5">
        {MASS_PROGRAMS.map((prog) => {
          const doneCount = prog.sessions.filter((s) => isDone(prog.id, s.id)).length;
          const allDone = doneCount === prog.sessions.length;

          return (
            <button
              key={prog.id}
              type="button"
              onClick={() => setView({ mode: "program-detail", program: prog })}
              className={cn(
                "w-full text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.98]",
                allDone ? "border-white/[0.04] opacity-50" : "border-white/[0.06] hover:border-white/[0.12]"
              )}
            >
              {/* Image header */}
              <div className="relative h-32">
                <Image
                  src={prog.image}
                  alt={prog.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[18px] font-bold text-white leading-tight">{prog.title}</p>
                      <p className="text-[11px] text-white/60 mt-0.5">{prog.subtitle}</p>
                    </div>
                    <Badge className="shrink-0 bg-white/10 text-[11px] text-white/80 border-0 hover:bg-white/10 tabular-nums">
                      {doneCount}/{prog.sessions.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Separator className="my-5 bg-gray-5/20" />

      {/* Freestyle */}
      <Card className="border-gray-5/25 bg-gray-2/60 mb-3">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="text-[13px] font-semibold text-gray-12">{t("trainingFreestyleSaved")}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ mode: "freestyle-builder" })}
              className="h-9 px-3 rounded-lg border-[#E80000]/25 bg-[#E80000]/8 text-[#FF6D6D] text-[11px] font-semibold hover:bg-[#E80000]/12"
            >
              <Plus size={12} className="mr-1" /> {t("trainingNew")}
            </Button>
          </div>
          {freestyle.length === 0 ? (
            <p className="text-[11px] text-gray-7">{t("trainingNoFreestyle")}</p>
          ) : (
            <div className="space-y-1.5">
              {freestyle.map((tpl) => (
                <Card key={tpl.id} className="border-gray-5/20 bg-gray-3/15">
                  <CardContent className="px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-12 truncate">{tpl.name}</p>
                      <p className="text-[10px] text-gray-7">{tpl.rows.length} {t("exercises")} · {fmtDate(tpl.createdAt, locale)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => launchFS(tpl.id)}
                        className="h-9 px-3 rounded-lg border-gray-5/30 bg-gray-2 text-[11px] text-gray-11 font-medium"
                      >
                        {t("trainingLaunch")}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => delFS(tpl.id)}
                        className="w-9 h-9 rounded-lg border-gray-5/30 bg-gray-2 text-gray-7"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-5 bg-gray-5/20" />

      {/* History */}
      <Card className="border-gray-5/25 bg-gray-3/12">
        <CardContent className="p-3.5">
          <h3 className="text-[13px] font-semibold text-gray-12 mb-2">{t("trainingHistory")}</h3>
          {archives.length === 0 ? (
            <p className="text-[11px] text-gray-7">{t("trainingNoArchive")}</p>
          ) : (
            <ScrollArea className={cn(histExp && "max-h-[400px]")}>
              <div className="space-y-1.5">
                {archives.slice(0, hLim).map((a) => (
                  <Card key={a.id} className="border-gray-5/20 bg-gray-2/50">
                    <CardContent className="px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium text-gray-12 truncate">{a.programTitle}</p>
                        <Badge className="bg-[#E80000]/10 text-[#FF6D6D] border-[#E80000]/20 text-[11px] font-semibold">
                          +{a.xpEarned} XP
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-7 mt-0.5">
                        {fmtDate(a.completedAt, locale)} · {t("trainingVolumeLabel")} {a.totalVolume.toFixed(0)}
                        {a.improvedSets > 0 && <> · <Sparkles size={9} className="inline" /> {a.improvedSets}</>}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {archives.length > 5 && (
                  <Button
                    variant="outline"
                    onClick={() => setHistExp((p) => !p)}
                    className="w-full h-9 rounded-lg border-gray-5/20 bg-gray-3/10 text-[11px] text-gray-7 font-medium"
                  >
                    {histExp ? t("homeShowLess") : t("homeShowMore")}
                    <ChevronDown size={12} className={cn("ml-1 transition-transform", histExp && "rotate-180")} />
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
