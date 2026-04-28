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
  Dumbbell,
  Pause,
  Play,
  Plus,
  Sparkles,
  Timer,
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
import { getExerciseVideo } from "@/app/lib/training-videos";
import { SyncedExerciseVideo, type VideoPhase } from "./SyncedExerciseVideo";
import { SetRow } from "./SetRow";
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
  const [rest, setRest] = useState<{ secondsLeft: number; total: number; quote: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const t0 = useRef(Date.now());
  const pausedAcc = useRef(0); // total ms paused so far
  const pausedAt = useRef<number | null>(null);

  const REST_DEFAULT = 45;
  // Citations Hakim — voix directe, FR, no-nonsense, tough-love motivante.
  const HAKIM_QUOTES = [
    "Respire. Tu te reconstruis là, maintenant.",
    "La récup' fait la perf. Pas l'inverse.",
    "Chaque série te rapproche. Reste là.",
    "Visualise la suivante. Tu sais ce que tu fais.",
    "La constance bat l'intensité. Toujours.",
    "Hydrate. Pose. Concentre.",
    "Plus fort qu'à la série d'avant. C'est ça la règle.",
    "Discipline d'abord. La motivation suit.",
    "Une série de plus, une excuse de moins.",
    "Contracte le core. Prépare la prochaine.",
    "On est pas là pour rigoler. Mais on est là.",
    "Le mental se construit dans le repos. Tiens-le.",
    "Tu vises pas le confort. Tu vises la transformation.",
    "Le corps s'adapte. À toi de pousser le curseur.",
    "Pas de raccourci. Que de la rigueur.",
    "Tu paies maintenant ce que tu kiffes après.",
    "Souffle long. Reste calme. Reste prêt.",
    "C'est dans ces 45 secondes que ça se joue.",
  ];
  const pickQuote = () => HAKIM_QUOTES[Math.floor(Math.random() * HAKIM_QUOTES.length)];

  // Elapsed timer — pauses when `paused`
  useEffect(() => {
    if (done) return;
    if (paused) return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0.current - pausedAcc.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [done, paused]);

  const togglePause = () => {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        pausedAt.current = Date.now();
      } else if (pausedAt.current != null) {
        pausedAcc.current += Date.now() - pausedAt.current;
        pausedAt.current = null;
      }
      return next;
    });
  };

  // Rest countdown — also halts while paused
  useEffect(() => {
    if (!rest || paused) return;
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
  }, [rest, soundOn, paused]);

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
      setRest({ secondsLeft: REST_DEFAULT, total: REST_DEFAULT, quote: pickQuote() });
    }
  };

  const skipRest = () => setRest(null);
  const addRest = (extra: number) => setRest((r) => r ? { ...r, secondsLeft: r.secondsLeft + extra, total: r.total + extra } : r);

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
    const hasRecord = result.improvedSets > 0;
    return (
      <div className="pb-8 flex flex-col items-center">
        {/* Session complete image — taille raisonnable, plus carré qu'avant */}
        <div
          className="w-full max-w-[280px] rounded-2xl overflow-hidden mb-5 relative"
          style={{ aspectRatio: "1/1" }}
        >
          <Image
            src="/images/session-complete.png"
            alt="Session Complete"
            fill
            sizes="280px"
            className="object-cover"
            priority
          />
        </div>

        {/* Stats row — 3 cards, records mis en valeur si > 0 */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
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
          <Card
            className={cn(
              "border-white/[0.06] bg-white/[0.03]",
              hasRecord && "border-[#FFD700]/30 bg-[#FFD700]/[0.04]",
            )}
          >
            <CardContent className="p-3 text-center">
              <Sparkles
                size={14}
                className={cn(
                  "mx-auto mb-1",
                  hasRecord ? "text-[#FFD700]" : "text-gray-7",
                )}
              />
              <p
                className={cn(
                  "text-[15px] font-bold tabular-nums",
                  hasRecord ? "text-[#FFD700]" : "text-gray-12",
                )}
              >
                {result.improvedSets}
              </p>
              <p className="text-[10px] text-gray-7 mt-0.5">
                {t("trainingRecordsLabel")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Button
          onClick={() => onSave(result)}
          className="w-full h-12 rounded-2xl optiz-gradient-bg text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0 hover:opacity-90"
        >
          {t("trainingClaimXp", { xp: "100" })}
        </Button>
      </div>
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

  return (
    <div className="pb-[100px]">
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
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 h-9 rounded-full border backdrop-blur-sm transition-colors",
              paused
                ? "bg-[#E80000]/[0.08] border-[#E80000]/25"
                : "bg-white/[0.04] border-white/[0.08]"
            )}
          >
            <Clock size={11} className={paused ? "text-[#FF6D6D]/70" : "text-[#FF6D6D]"} />
            <span className={cn(
              "text-[13px] font-semibold tabular-nums tracking-tight",
              paused ? "text-gray-10" : "text-gray-12"
            )}>
              {fmtTimer(elapsed)}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePause}
            aria-label={paused ? "Reprendre" : "Pause"}
            className={cn(
              "w-10 h-10 rounded-full transition-colors",
              paused
                ? "border-[#E80000]/30 bg-[#E80000]/[0.08] text-[#FF6D6D] hover:bg-[#E80000]/[0.12]"
                : "border-white/10 bg-white/[0.03] text-gray-9 hover:bg-white/[0.06]"
            )}
          >
            {paused ? <Play size={14} className="ml-0.5" fill="currentColor" /> : <Pause size={14} />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { const n = !soundOn; setSoundOn(n); setSoundEnabled(n); }}
            aria-label={soundOn ? "Muet" : "Son"}
            className="w-10 h-10 rounded-full border-white/10 bg-white/[0.03] text-gray-9 hover:bg-white/[0.06]"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </Button>
        </div>
      </div>

      {/* Paused fullscreen overlay — blurred backdrop, modal carte centrée */}
      <AnimatePresence>
        {paused && (
          <motion.div
            key="paused-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
            onClick={togglePause}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0F0F10]/95 p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#E80000]/[0.12] border border-[#E80000]/30 flex items-center justify-center">
                  <Pause size={22} className="text-[#FF6D6D]" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#FF6D6D] font-semibold mb-1">
                    Séance en pause
                  </div>
                  <div className="text-[15px] text-gray-11">
                    Le chrono est gelé. Reprends quand t'es prêt.
                  </div>
                </div>
                <Button
                  onClick={togglePause}
                  className="w-full h-11 rounded-xl bg-gradient-to-b from-[#FF1414] to-[#C40000] text-white font-semibold tracking-[0.04em] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                >
                  <Play size={14} className="mr-1.5" fill="currentColor" /> Reprendre
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single-line progress — segmented bar with inline label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-gray-8 font-semibold shrink-0">
          {t("trainingExerciseOf", { current: String(exIdx + 1), total: String(session.exercises.length) })}
        </span>
        <div className="flex items-center gap-[3px] flex-1 min-w-0">
          {session.exercises.map((_, i) => (
            <div key={i} className="h-[3px] rounded-full flex-1 bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full bg-[#E80000] rounded-full origin-left"
                initial={false}
                animate={{
                  scaleX: i < exIdx ? 1 : i === exIdx ? (totalSetsInEx ? doneCount / totalSetsInEx : 0) : 0,
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          ))}
        </div>
        <span className="text-[10.5px] text-gray-8 tabular-nums font-medium shrink-0 w-9 text-right">
          {Math.round(globalProgress)}%
        </span>
      </div>

      {ex && (
        <div key={ex.id} className="mt-4">
          {/* Exercise hero card — vidéo Hakim synchronisée + meta + phases */}
          {(() => {
            // ⚠️ Utiliser `libraryId`, pas `id`. `id` est composite
            // (`mid-high-raise-4x15`) et ne match jamais EXERCISE_VIDEOS,
            // ce qui faisait tomber 100% des exos sur le warmup-full fallback.
            const video = getExerciseVideo(ex.libraryId);
            // Dérive la phase vidéo depuis l'état du funnel.
            const videoPhase: VideoPhase = resting
              ? "rest"
              : doneCount === 0
              ? "preview"
              : allDone
              ? "set_done"
              : "set_active";

            return (
              <Card className="relative border-white/[0.05] bg-white/[0.02] mb-3 overflow-hidden">
                {/* Hero video Hakim + gradient soft pour fondre dans la card */}
                <div className="relative">
                  <SyncedExerciseVideo
                    src={video?.src ?? null}
                    poster={video?.poster ?? null}
                    start={video?.start}
                    phase={videoPhase}
                  />
                  {/* Vignette bas — ancre visuellement le titre sous la vidéo.
                      Inutile (et un peu sale) sur le placeholder "indispo". */}
                  {video && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent"
                    />
                  )}
                </div>

                <CardContent className="p-4 pt-3.5">
                  <h3 className="text-[18px] font-semibold text-gray-12 leading-[1.15] tracking-tight [text-wrap:balance]">
                    {ex.name}
                  </h3>
                  {/* Meta line scannable — muscles • sets×reps en pill */}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[11.5px] text-gray-8 leading-none">
                      {ex.muscles}
                    </span>
                    <span className="inline-flex items-center h-[18px] px-1.5 rounded-md bg-white/[0.05] border border-white/[0.06] text-[10.5px] font-semibold tabular-nums text-gray-10 tracking-tight">
                      {totalSetsInEx}×{ex.repsLabel ?? ex.reps}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Set tracker — RPE post-set, check button explicite */}
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
            {/* Header 4 cols */}
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-x-2 px-3 py-2.5 border-b border-white/[0.05]">
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-7 font-semibold text-center whitespace-nowrap">N°</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-7 font-semibold text-center whitespace-nowrap">Poids · kg</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-7 font-semibold text-center whitespace-nowrap">Reps</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-7 font-semibold text-center whitespace-nowrap">Fait</span>
            </div>

            {/* Rows */}
            <div>
              {rows.map((row, i) => {
                const isPr = prKeys.includes(`${ex.id}-${i}`);
                const isActive = i === activeSetIdx && !row.done;
                const targetReps = ex.perSetReps?.[i] ?? ex.reps;
                return (
                  <SetRow
                    key={i}
                    row={row}
                    idx={i}
                    isPr={isPr}
                    isActive={isActive}
                    isFirst={i === 0}
                    targetReps={targetReps}
                    defaultLoad={ex.defaultLoad}
                    onUpdate={(patch) => upd(ex.id, i, patch)}
                    onValidate={() => check(i)}
                    onUndo={() => check(i)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rest popup — fullscreen blur backdrop + carte élargie avec contexte. */}
      <AnimatePresence>
        {rest && ex && (() => {
          const progressPct = 1 - rest.secondsLeft / rest.total;
          const RADIUS = 32;
          const CIRC = 2 * Math.PI * RADIUS;
          const minutes = Math.floor(rest.secondsLeft / 60);
          const seconds = rest.secondsLeft % 60;
          const timeStr =
            minutes > 0
              ? `${minutes}:${String(seconds).padStart(2, "0")}`
              : String(seconds);
          return (
            <motion.div
              key="rest-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0E0E0F]"
              >
                <div className="px-7 pt-8 pb-6 flex flex-col items-center text-center gap-7">
                  {/* Timer — grand, centré, propre. SEC ancré en absolu pour
                      ne pas décaler le digit hors-axe. */}
                  <div className="relative w-[156px] h-[156px]">
                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r={RADIUS}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={RADIUS}
                        fill="none"
                        stroke="#E80000"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC * progressPct}
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[52px] font-semibold text-gray-12 tabular-nums leading-none tracking-[-0.04em]">
                        {timeStr}
                      </span>
                    </div>
                    <span className="absolute left-1/2 bottom-[30px] -translate-x-1/2 text-[9px] text-gray-7 uppercase tracking-[0.22em] font-semibold">
                      sec
                    </span>
                  </div>

                  {/* Motivation — citation Hakim qui rotate */}
                  <motion.p
                    key={rest.quote}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-[15px] text-gray-11 leading-snug max-w-[280px] tracking-tight [text-wrap:balance]"
                  >
                    &ldquo;{rest.quote}&rdquo;
                  </motion.p>

                  {/* Actions — flat shadcn, pas de glow */}
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => addRest(15)}
                      className="h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-11 text-[13px] font-semibold hover:bg-white/[0.07] active:scale-95 transition-all whitespace-nowrap"
                    >
                      +15 s
                    </button>
                    <button
                      type="button"
                      onClick={skipRest}
                      className="flex-1 h-11 rounded-xl bg-[#E80000] text-white text-[13.5px] font-semibold hover:bg-[#FF1414] active:scale-[0.98] transition-colors"
                    >
                      {t("trainingRestSkip")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Bottom CTA — fond opaque pour ne pas laisser passer le tracker derrière */}
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        {/* Soft fade au-dessus pour adoucir la jonction sans laisser bleeding */}
        <div className="h-6 bg-gradient-to-t from-[var(--gray-1)] to-transparent" />
        <div className="px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-[var(--gray-1)] pointer-events-auto">
          <div className="mx-auto max-w-4xl">
            <Button
              onClick={next}
              disabled={!allDone || resting}
              className={cn(
                "w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-1.5 transition-all",
                allDone && !resting
                  ? "optiz-gradient-bg text-white active:scale-[0.97] border-0 hover:opacity-90"
                  : "bg-white/[0.04] border border-white/[0.08] text-gray-8 hover:bg-white/[0.04] cursor-not-allowed"
              )}
            >
              {isLast ? t("trainingValidateSession") : t("trainingNextExercise")}
              {!isLast && allDone && !resting && <ChevronRight size={16} />}
            </Button>
          </div>
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

      {/* Hero — clean, no glow */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[24px] overflow-hidden mb-6 border border-white/[0.06] bg-[#0B0B0C]"
      >
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={program.image}
            alt={program.title}
            fill
            className="object-cover object-center"
            priority
          />
          {/* Crisp dark gradient — no red glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/70 to-[#0B0B0C]/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Top meta row */}
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between">
            <span className="px-2.5 h-6 inline-flex items-center rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[9.5px] uppercase tracking-[0.18em] font-semibold text-white">
              {program.level === "beginner" ? t("trainingLevelBeginner") : t("trainingLevelIntermediate")}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
              <span className="text-[10.5px] text-white/90 font-semibold tabular-nums">{program.sessions.length}</span>
              <span className="text-[9.5px] uppercase tracking-[0.14em] text-white/60 font-semibold">séances</span>
            </div>
          </div>

          {/* Title block */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-[26px] font-semibold text-white leading-[1.05] tracking-[-0.02em]">{program.title}</h2>
            <p className="text-[12.5px] text-white/65 mt-1.5 max-w-[36ch] leading-relaxed">{program.subtitle}</p>
          </div>
        </div>

        {/* Stats strip — outside image, flat */}
        <div className="flex items-center divide-x divide-white/[0.06] border-t border-white/[0.06]">
          <div className="flex-1 flex items-center justify-center gap-1.5 py-3">
            <Timer size={12} className="text-gray-7" />
            <span className="text-[11.5px] text-gray-10 tabular-nums font-medium">~{totalMin} min</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-3">
            <Dumbbell size={12} className="text-gray-7" />
            <span className="text-[11.5px] text-gray-10 tabular-nums font-medium">
              {program.sessions.reduce((s, x) => s + x.exercises.length, 0)} exercices
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-3">
            <Zap size={12} className="text-[#FFD700]/80" />
            <span className="text-[11.5px] text-gray-10 tabular-nums font-medium">+{program.sessions.length * 100} XP</span>
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

      {/* Session cards — minimalist */}
      <div className="space-y-2.5">
        {program.sessions.map((session, sIdx) => {
          const done = isSessionDone(session.id);
          const archive = getLastArchive(session.id);
          const num = String(sIdx + 1).padStart(2, "0");

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: sIdx * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={cn(
                  "relative border-white/[0.05] bg-white/[0.02] overflow-hidden transition-colors",
                  !done && "hover:bg-white/[0.03] hover:border-white/[0.08]",
                  done && "opacity-50"
                )}
              >
                {/* Big watermark number — bottom-right, behind content */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none select-none absolute -right-3 -bottom-6 font-black leading-none tracking-[-0.08em] tabular-nums text-[150px]",
                    done ? "text-white/[0.02]" : "text-white/[0.035]"
                  )}
                >
                  {num}
                </span>

                <CardContent className="relative p-4">
                  {/* Header row — iconic dumbbell + title + focus; XP inline */}
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-colors",
                        done
                          ? "bg-white/[0.02] border-white/[0.05]"
                          : "bg-white/[0.04] border-white/[0.08]"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.icons8.com/?id=pMT9uH2RtEWp&format=png&size=64"
                        alt=""
                        width={16}
                        height={16}
                        className={cn(
                          "w-4 h-4 object-contain transition-opacity",
                          done ? "opacity-45 [filter:invert(1)_brightness(0.6)]" : "opacity-90 [filter:invert(1)_brightness(0.95)]"
                        )}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-gray-12 leading-tight tracking-tight">
                        {session.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-8">
                        <span className="truncate">{session.focus}</span>
                        <span className="text-gray-6">·</span>
                        <span className="tabular-nums whitespace-nowrap">~{session.durationMin} min</span>
                        <span className="text-gray-6">·</span>
                        <span className="tabular-nums text-gray-7 whitespace-nowrap">+100 XP</span>
                      </div>
                    </div>
                  </div>

                  {archive && (
                    <p className="text-[10px] text-gray-7 mb-2.5">
                      {t("trainingLastPerf")} {fmtDate(archive.completedAt, locale)}
                    </p>
                  )}

                  {/* Exercise list — minimal */}
                  <ul className="mb-3.5 space-y-[3px]">
                    {session.exercises.map((exercise, i) => (
                      <li
                        key={exercise.id}
                        className="flex items-baseline gap-2.5 text-[12px] leading-tight"
                      >
                        <span className="text-gray-6 w-4 text-right shrink-0 tabular-nums text-[10.5px]">
                          {i + 1}
                        </span>
                        <span className="text-gray-10 truncate flex-1">{exercise.name}</span>
                        <span className="text-gray-7 shrink-0 tabular-nums text-[11px]">
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
                      "w-full h-11 rounded-xl text-[13.5px] font-semibold gap-2",
                      done
                        ? "bg-emerald-500/[0.08] border border-emerald-400/25 text-emerald-300/85 hover:bg-emerald-500/[0.08] cursor-default"
                        : "optiz-gradient-bg text-white border-0 hover:opacity-95 active:scale-[0.98] transition-transform"
                    )}
                  >
                    {done ? (
                      <>
                        <Check size={14} /> {t("trainingDoneReopens")}
                      </>
                    ) : (
                      <>
                        {t("trainingLaunch")}
                        <ArrowRight size={14} />
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
