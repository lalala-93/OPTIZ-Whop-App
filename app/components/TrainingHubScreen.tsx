"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Dumbbell,
  ExternalLink,
  Flame,
  Minus,
  Play,
  Plus,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
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
  const [rest, setRest] = useState<{ secondsLeft: number; total: number } | null>(null);
  const t0 = useRef(Date.now());

  const REST_DEFAULT = 45;

  useEffect(() => {
    if (done) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [done]);

  // Rest countdown
  useEffect(() => {
    if (!rest) return;
    const iv = setInterval(() => {
      setRest((r) => {
        if (!r) return null;
        if (r.secondsLeft <= 1) {
          if (soundOn) playCompleteSound();
          return null;
        }
        return { ...r, secondsLeft: r.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [rest, soundOn]);

  const ex = session.exercises[exIdx];
  const rows = ex ? sets[ex.id] || [] : [];
  const prevRows = ex ? previousArchive?.exercises.find((e) => e.exerciseId === ex.id)?.sets || [] : [];
  const allDone = rows.length > 0 && rows.every((r) => r.done);
  const isLast = exIdx === session.exercises.length - 1;
  const resting = rest !== null;

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

    // Auto-trigger 45s rest after a set is validated.
    // Skip if this is the very last set of the last exercise (no more effort coming).
    const isLastSetOfEx = i === rows.length - 1;
    if (!(isLastSetOfEx && isLast)) {
      setRest({ secondsLeft: REST_DEFAULT, total: REST_DEFAULT });
    }
  };

  const skipRest = () => setRest(null);
  const addRest = (extra: number) => setRest((r) => r ? { secondsLeft: r.secondsLeft + extra, total: r.total + extra } : r);

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
  const doneCount = rows.filter((r) => r.done).length;
  const firstPending = rows.findIndex((r) => !r.done);
  const activeSetIdx = firstPending === -1 ? rows.length - 1 : firstPending;
  const totalSetsInEx = rows.length;
  const globalProgress = session.exercises.length > 0
    ? ((exIdx + (totalSetsInEx ? doneCount / totalSetsInEx : 0)) / session.exercises.length) * 100
    : 0;

  const copyFromPrev = (i: number) => {
    if (!ex) return;
    const p = prevRows[i];
    if (!p) return;
    upd(ex.id, i, { load: String(p.load), reps: String(p.reps) });
  };

  return (
    <div className="pb-[160px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 rounded-full border-white/10 bg-white/[0.03] text-gray-10 hover:bg-white/[0.06]"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <Clock size={11} className="text-[#FF6D6D]" />
            <span className="text-[13px] font-semibold text-gray-12 tabular-nums tracking-tight">{fmtTimer(elapsed)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { const n = !soundOn; setSoundOn(n); setSoundEnabled(n); }}
            className="w-10 h-10 rounded-full border-white/10 bg-white/[0.03] text-gray-9 hover:bg-white/[0.06]"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </Button>
        </div>
      </div>

      {/* Global progress bar with % */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-7 font-semibold">
            {t("trainingExerciseOf", { current: String(exIdx + 1), total: String(session.exercises.length) })}
          </span>
          <span className="text-[10px] text-gray-8 tabular-nums font-medium">{Math.round(globalProgress)}%</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF5A3C] via-[#E80000] to-[#9E1912]"
            initial={false}
            animate={{ width: `${globalProgress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {/* Exercise step dots */}
        <div className="flex items-center gap-1 mt-2">
          {session.exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-[3px] rounded-full flex-1 transition-all duration-300",
                i < exIdx
                  ? "bg-[#E80000]/80"
                  : i === exIdx
                  ? "bg-[#FF6D6D]"
                  : "bg-white/[0.05]"
              )}
            />
          ))}
        </div>
      </div>

      {ex && (
        <motion.div
          key={ex.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="mt-4"
        >
          {/* Exercise hero card */}
          <Card className="relative border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.01] mb-3 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#FF5A3C] via-[#E80000] to-[#7A0E0E]" />
            <CardContent className="p-4 pl-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[19px] font-bold text-gray-12 leading-[1.1] tracking-tight">{ex.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge className="bg-white/[0.05] text-gray-9 border-white/[0.08] text-[10px] font-medium hover:bg-white/[0.05] px-2 py-0.5">
                      {ex.muscles}
                    </Badge>
                    <Badge className="bg-[#E80000]/10 text-[#FF8A8A] border-[#E80000]/20 text-[10px] font-medium hover:bg-[#E80000]/10 px-2 py-0.5 tabular-nums">
                      {totalSetsInEx}×{ex.repsLabel ?? ex.reps}
                    </Badge>
                  </div>
                </div>
                <a
                  href={ex.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("trainingVideoAria")}
                  className="w-12 h-12 rounded-2xl bg-[#E80000]/12 border border-[#E80000]/25 flex items-center justify-center shrink-0 hover:bg-[#E80000]/20 active:scale-95 transition-all shadow-[0_6px_16px_-6px_rgba(232,0,0,0.45)]"
                >
                  <Play size={18} className="text-[#FF6D6D] ml-0.5" fill="currentColor" />
                </a>
              </div>
              {ex.note && (
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-start gap-2">
                  <Timer size={12} className="text-gray-7 mt-0.5 shrink-0" />
                  <p className="text-[11.5px] text-gray-9 leading-relaxed">{ex.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Set cards */}
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-7 font-semibold">
              {totalSetsInEx} {t("trainingHeaderSet")}{totalSetsInEx > 1 ? "s" : ""}
            </span>
            <span className="text-[10px] text-gray-8 tabular-nums">
              {doneCount} / {totalSetsInEx}
            </span>
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => {
              const isPr = prKeys.includes(`${ex.id}-${i}`);
              const isActive = i === activeSetIdx && !row.done;
              const targetReps = ex.perSetReps?.[i] ?? ex.reps;
              const prevSet = prevRows[i];

              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className={cn(
                    "relative rounded-2xl border overflow-hidden transition-all",
                    row.done
                      ? "border-[#E80000]/20 bg-[#E80000]/[0.04]"
                      : isActive
                      ? "border-[#E80000]/40 bg-gradient-to-b from-[#E80000]/[0.08] to-[#E80000]/[0.02] shadow-[0_8px_24px_-12px_rgba(232,0,0,0.45)]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  )}
                >
                  {/* Active set pulse accent */}
                  {isActive && (
                    <motion.span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E80000]"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  <div className="p-3 pl-4">
                    {/* Top row: set #, PR, prev, check */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg w-7 h-7 text-[12.5px] font-bold tabular-nums shrink-0",
                          row.done
                            ? "bg-[#E80000] text-white"
                            : isActive
                            ? "bg-[#E80000]/15 text-[#FF6D6D] border border-[#E80000]/25"
                            : "bg-white/[0.05] text-gray-8 border border-white/[0.06]"
                        )}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-[10.5px] uppercase tracking-[0.14em] font-semibold",
                          row.done ? "text-[#FF8A8A]" : isActive ? "text-[#FF6D6D]" : "text-gray-7"
                        )}
                      >
                        {row.done ? "Validée" : isActive ? "En cours" : "À venir"}
                      </span>

                      {isPr && (
                        <Badge className="h-5 px-1.5 bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 text-[9.5px] font-semibold hover:bg-[#FFD700]/15">
                          <Sparkles size={9} className="mr-0.5" />PR
                        </Badge>
                      )}

                      {prevSet && !row.done && (
                        <button
                          type="button"
                          onClick={() => copyFromPrev(i)}
                          className="ml-auto inline-flex items-center gap-1 px-2 h-6 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-8 hover:text-gray-11 hover:bg-white/[0.06] transition-colors"
                          aria-label={t("trainingCopyPrev")}
                        >
                          <Copy size={10} />
                          <span className="tabular-nums">{prevSet.load > 0 ? `${prevSet.load} kg` : ""} × {prevSet.reps}</span>
                        </button>
                      )}

                      <Button
                        type="button"
                        size="icon"
                        onClick={() => check(i)}
                        className={cn(
                          "shrink-0 rounded-full transition-all ml-auto",
                          row.done
                            ? "w-9 h-9 bg-[#E80000] text-white hover:bg-[#E80000]/90 shadow-[0_4px_14px_-4px_rgba(232,0,0,0.65)]"
                            : isActive
                            ? "w-10 h-10 bg-[#E80000] text-white hover:bg-[#E80000]/90 shadow-[0_6px_18px_-4px_rgba(232,0,0,0.7)] active:scale-95"
                            : "w-9 h-9 bg-white/[0.04] border border-white/[0.08] text-gray-7 hover:bg-white/[0.08]",
                          prevSet && !row.done && "!ml-2"
                        )}
                      >
                        <Check size={isActive ? 16 : 14} strokeWidth={2.75} />
                      </Button>
                    </div>

                    {/* Controls grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Weight */}
                      <label className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[9.5px] uppercase tracking-[0.14em] text-gray-7 font-semibold pl-2">
                          {t("trainingHeaderKg")}
                        </span>
                        <Input
                          type="number"
                          value={row.load}
                          inputMode="decimal"
                          step="0.5"
                          onChange={(e) => upd(ex.id, i, { load: e.target.value })}
                          disabled={row.done}
                          placeholder="0"
                          className={cn(
                            "h-11 rounded-xl text-center text-[16px] font-semibold text-gray-12 placeholder:text-gray-6 disabled:opacity-60 tabular-nums transition-colors",
                            row.done
                              ? "bg-white/[0.02] border-white/[0.05]"
                              : "bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.07] focus:border-[#E80000]/40"
                          )}
                        />
                      </label>

                      {/* Reps stepper */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[9.5px] uppercase tracking-[0.14em] text-gray-7 font-semibold pl-2">
                          {t("trainingHeaderReps")}
                        </span>
                        <div className={cn(
                          "flex items-center h-11 rounded-xl overflow-hidden border",
                          row.done ? "bg-white/[0.02] border-white/[0.05] opacity-60" : "bg-white/[0.04] border-white/[0.08]"
                        )}>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseNum(row.reps, targetReps);
                              upd(ex.id, i, { reps: String(Math.max(0, cur - 1)) });
                            }}
                            disabled={row.done}
                            className="flex items-center justify-center w-8 h-full text-gray-8 hover:text-gray-11 hover:bg-white/[0.04] active:bg-white/[0.08] disabled:opacity-50 transition-colors"
                            aria-label="−1"
                          >
                            <Minus size={13} />
                          </button>
                          <Input
                            type="number"
                            value={row.reps}
                            inputMode="numeric"
                            onChange={(e) => upd(ex.id, i, { reps: e.target.value })}
                            disabled={row.done}
                            placeholder={String(targetReps > 0 ? targetReps : 5)}
                            className="flex-1 h-full border-0 bg-transparent text-center text-[16px] font-bold text-gray-12 placeholder:text-gray-6 tabular-nums p-0 min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseNum(row.reps, targetReps);
                              upd(ex.id, i, { reps: String(cur + 1) });
                            }}
                            disabled={row.done}
                            className="flex items-center justify-center w-8 h-full text-gray-8 hover:text-gray-11 hover:bg-white/[0.04] active:bg-white/[0.08] disabled:opacity-50 transition-colors"
                            aria-label="+1"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      {/* RPE chips — compact dropdown trigger */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[9.5px] uppercase tracking-[0.14em] text-gray-7 font-semibold pl-2">
                          RPE
                        </span>
                        <div className="relative h-11">
                          <select
                            value={row.rpe || ""}
                            onChange={(e) => upd(ex.id, i, { rpe: e.target.value })}
                            disabled={row.done}
                            className={cn(
                              "absolute inset-0 w-full h-full rounded-xl text-center text-[16px] font-semibold text-gray-12 disabled:opacity-60 appearance-none pr-5 tabular-nums transition-colors cursor-pointer",
                              row.done
                                ? "bg-white/[0.02] border border-white/[0.05]"
                                : "bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.07] focus:border-[#E80000]/40"
                            )}
                          >
                            <option value="">—</option>
                            {[6, 7, 8, 9, 10].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-7 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Rest overlay */}
      <AnimatePresence>
        {rest && ex && (() => {
          const nextSetIdx = rows.findIndex((r) => !r.done);
          const nextSet = nextSetIdx >= 0 ? rows[nextSetIdx] : null;
          const nextTargetReps = nextSetIdx >= 0 ? (ex.perSetReps?.[nextSetIdx] ?? ex.reps) : 0;
          const isEndingSoon = rest.secondsLeft <= 5;
          const progressPct = 1 - rest.secondsLeft / rest.total;
          const RADIUS = 46;
          const CIRC = 2 * Math.PI * RADIUS;

          return (
            <motion.div
              key="rest-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-4 pb-[calc(env(safe-area-inset-bottom)+90px)] sm:pb-0"
            >
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="relative w-full max-w-md rounded-[28px] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#1a1414] to-[#0a0707] shadow-[0_30px_80px_-20px_rgba(232,0,0,0.4)]"
              >
                {/* Ambient glow */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: isEndingSoon
                      ? "radial-gradient(60% 50% at 50% 10%, rgba(255,58,58,0.45) 0%, transparent 70%)"
                      : "radial-gradient(60% 50% at 50% 10%, rgba(232,0,0,0.28) 0%, transparent 70%)",
                  }}
                  animate={isEndingSoon ? { opacity: [0.25, 0.55, 0.25] } : { opacity: 0.3 }}
                  transition={isEndingSoon ? { duration: 1, repeat: Infinity } : {}}
                />

                {/* Close */}
                <button
                  type="button"
                  onClick={skipRest}
                  aria-label={t("trainingRestSkip")}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-8 hover:text-gray-11 hover:bg-white/[0.08] transition-colors z-10"
                >
                  <X size={14} />
                </button>

                <div className="relative p-7 pt-8">
                  {/* Label */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-[#FF6D6D]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <span className="text-[10.5px] uppercase tracking-[0.24em] text-gray-8 font-semibold">
                      {t("trainingRestTitle")} · récupération
                    </span>
                  </div>

                  {/* Ring */}
                  <div className="flex items-center justify-center mb-5">
                    <motion.div
                      className="relative w-48 h-48"
                      animate={isEndingSoon ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                      transition={isEndingSoon ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        <circle
                          cx="50"
                          cy="50"
                          r={RADIUS}
                          fill="none"
                          stroke={isEndingSoon ? "#FF3B3B" : "url(#restGrad)"}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={CIRC * progressPct}
                          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
                        />
                        <defs>
                          <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FF6D4A" />
                            <stop offset="55%" stopColor="#E80000" />
                            <stop offset="100%" stopColor="#7A0E0E" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[9px] uppercase tracking-[0.28em] text-gray-7 mb-1.5 font-semibold">
                          {t("trainingRestNextSet")}
                        </p>
                        <motion.p
                          key={rest.secondsLeft}
                          initial={{ scale: 0.9, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "text-[60px] font-bold tabular-nums leading-none tracking-tighter",
                            isEndingSoon ? "text-[#FF6D6D]" : "text-gray-12"
                          )}
                        >
                          {rest.secondsLeft}
                        </motion.p>
                        <p className="text-[11px] text-gray-7 font-medium mt-1 uppercase tracking-wider">
                          secondes
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Next-up preview */}
                  {nextSet && (
                    <div className="relative rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-[#E80000]/12 border border-[#E80000]/25 flex items-center justify-center">
                          <span className="text-[13px] font-bold text-[#FF6D6D] tabular-nums">{nextSetIdx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-7 font-semibold leading-none mb-1">
                            Prochaine série
                          </p>
                          <p className="text-[13px] text-gray-11 font-medium truncate">{ex.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] uppercase tracking-wider text-gray-7 leading-none mb-0.5">Objectif</p>
                          <p className="text-[13px] font-bold text-gray-12 tabular-nums">
                            {nextSet.load && parseNum(nextSet.load, 0) > 0 ? `${nextSet.load} kg · ` : ""}
                            {nextTargetReps > 0 ? nextTargetReps : nextSet.reps} reps
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => addRest(15)}
                      variant="outline"
                      className="h-12 flex-1 rounded-2xl bg-white/[0.03] border-white/[0.08] text-gray-11 text-[13.5px] font-semibold hover:bg-white/[0.07] gap-1.5"
                    >
                      <Plus size={13} /> 15 s
                    </Button>
                    <Button
                      type="button"
                      onClick={skipRest}
                      className="h-12 flex-[1.4] rounded-2xl optiz-gradient-bg border-0 text-white text-[13.5px] font-semibold hover:opacity-95 active:scale-[0.97] transition-transform gap-1.5 shadow-[0_10px_24px_-8px_rgba(232,0,0,0.6)]"
                    >
                      {t("trainingRestSkip")} <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+70px)] bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          <Button
            onClick={next}
            disabled={!allDone || resting}
            className={cn(
              "w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-1.5 transition-all",
              allDone && !resting
                ? "optiz-gradient-bg text-white active:scale-[0.97] border-0 hover:opacity-90"
                : "bg-gray-3 border border-gray-5/35 text-gray-7 hover:bg-gray-3"
            )}
          >
            {isLast ? t("trainingValidateSession") : t("trainingNextExercise")}
            {!isLast && allDone && !resting && <ChevronRight size={16} />}
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

  const totalMin = program.sessions.reduce((s, x) => s + x.durationMin, 0);

  return (
    <div className="pb-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] text-gray-8 mb-3 px-2 hover:bg-gray-3/30"
      >
        <ArrowLeft size={14} /> {t("back")}
      </Button>

      {/* Hero — cinematic */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[28px] overflow-hidden mb-6 border border-white/[0.06] shadow-[0_22px_60px_-24px_rgba(232,0,0,0.35)]"
      >
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={program.image}
            alt={program.title}
            fill
            className="object-cover"
            priority
          />
          {/* Layered gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-black/20" />
          {/* Top meta row */}
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between">
            <Badge className="bg-white/10 backdrop-blur-md text-white border-white/15 text-[9px] uppercase tracking-[0.16em] font-semibold hover:bg-white/10 px-2.5 py-1">
              {program.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate")}
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Flame size={11} className="text-[#FF6D6D]" />
              <span className="text-[11px] text-white font-medium tabular-nums">{program.sessions.length} séances</span>
            </div>
          </div>
          {/* Title block */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-[28px] font-bold text-white leading-[1.05] tracking-tight">{program.title}</h2>
            <p className="text-[12.5px] text-white/70 mt-1.5 max-w-[34ch] leading-relaxed">{program.subtitle}</p>
            {/* Stats strip */}
            <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Timer size={12} className="text-white/50" />
                <span className="text-[11px] text-white/70 tabular-nums">~{totalMin} min</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Dumbbell size={12} className="text-white/50" />
                <span className="text-[11px] text-white/70 tabular-nums">
                  {program.sessions.reduce((s, x) => s + x.exercises.length, 0)} exercices
                </span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-[#FFD700]/80" />
                <span className="text-[11px] text-white/70 tabular-nums">+{program.sessions.length * 100} XP</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sessions header */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-8 font-semibold">
          Programme · {program.sessions.length} séances
        </p>
        <p className="text-[10px] text-gray-7 tabular-nums">
          {program.sessions.filter((s) => isSessionDone(s.id)).length} / {program.sessions.length} faites
        </p>
      </div>

      {/* Session cards */}
      <div className="space-y-3.5">
        {program.sessions.map((session, sIdx) => {
          const done = isSessionDone(session.id);
          const archive = getLastArchive(session.id);
          const num = String(sIdx + 1).padStart(2, "0");

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: sIdx * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={cn(
                  "relative border-white/[0.06] bg-gradient-to-b from-white/[0.045] to-white/[0.01] overflow-hidden transition-all",
                  !done && "hover:border-white/[0.12]",
                  done && "opacity-55"
                )}
              >
                {/* Left accent strip — thicker, gradient */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-[4px]",
                    done
                      ? "bg-gray-6/40"
                      : "bg-gradient-to-b from-[#FF5A3C] via-[#E80000] to-[#7A0E0E]"
                  )}
                />
                {/* Watermark number (decorative) */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-4 right-3 font-bold leading-none pointer-events-none select-none tabular-nums",
                    done ? "text-white/[0.02]" : "text-white/[0.035]"
                  )}
                  style={{ fontSize: 140, letterSpacing: "-0.04em" }}
                >
                  {num}
                </span>

                <CardContent className="relative p-4 pl-5">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3.5">
                    <div
                      className={cn(
                        "shrink-0 flex flex-col items-center justify-center rounded-[14px] w-[52px] h-[52px] font-bold",
                        done
                          ? "bg-gray-3/50 text-gray-7 border border-gray-5/25"
                          : "bg-[#E80000]/12 text-[#FF6D6D] border border-[#E80000]/25 shadow-[inset_0_0_0_1px_rgba(255,109,109,0.08)]"
                      )}
                    >
                      <span className="text-[8.5px] uppercase tracking-[0.18em] leading-none opacity-80 mb-1">
                        {t("trainingSessionNumber")}
                      </span>
                      <span className="text-[18px] leading-none tabular-nums tracking-tight">{num}</span>
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[16.5px] font-semibold text-gray-12 leading-tight tracking-tight">
                        {session.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-8 truncate">{session.focus}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-md bg-white/[0.04] border border-white/[0.05] text-[10px] text-gray-9 tabular-nums shrink-0">
                          <Clock size={9.5} />~{session.durationMin} min
                        </span>
                      </div>
                      {archive && (
                        <p className="text-[10px] text-gray-7 mt-1.5">
                          {t("trainingLastPerf")} {fmtDate(archive.completedAt, locale)}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 inline-flex items-center gap-1 px-2 h-6 rounded-full bg-[#E80000]/10 border border-[#E80000]/20">
                      <Zap size={10} className="text-[#FFD700]" fill="currentColor" />
                      <span className="text-[10.5px] font-semibold text-[#FF8A8A] tabular-nums">+100</span>
                    </div>
                  </div>

                  {/* Exercise list — tight, clean, with delicate dividers */}
                  <ul className="mb-4 space-y-0 divide-y divide-white/[0.04] border-y border-white/[0.04]">
                    {session.exercises.map((exercise, i) => (
                      <li
                        key={exercise.id}
                        className="flex items-baseline gap-2.5 py-1.5 text-[12px]"
                      >
                        <span className="text-gray-6 w-4 text-right shrink-0 tabular-nums font-medium text-[10.5px]">
                          {i + 1}
                        </span>
                        <span className="text-gray-11 truncate flex-1">{exercise.name}</span>
                        <span className="text-gray-7 shrink-0 tabular-nums text-[11px] font-medium">
                          {exercise.repsLabel || `${exercise.sets}×${exercise.reps}`}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Launch button */}
                  <Button
                    onClick={() => onLaunchSession(session)}
                    disabled={done}
                    className={cn(
                      "w-full h-12 rounded-2xl text-[14px] font-semibold gap-2 group/btn",
                      done
                        ? "bg-gray-3 border border-gray-5/30 text-gray-7 hover:bg-gray-3"
                        : "optiz-gradient-bg text-white border-0 hover:opacity-95 active:scale-[0.98] transition-transform shadow-[0_10px_24px_-8px_rgba(232,0,0,0.5)]"
                    )}
                  >
                    {done ? (
                      <>
                        <Check size={15} /> {t("trainingDoneReopens")}
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        {t("trainingLaunch")}
                        <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
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
