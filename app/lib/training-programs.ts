// ═══════════════════════════════════════════════════════
// OPTIZ — Shred Academy by Hakim
// Catalogue complet des 4 programmes · mis à jour 2026-04-22
// ═══════════════════════════════════════════════════════

export interface ProgramExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: number;
  /** Display label for reps (e.g. "Max", "30s", "1 min") — overrides numeric reps in UI */
  repsLabel?: string;
  /** Per-set rep targets e.g. [20, 15, 10, 10] — overrides uniform `reps` per set */
  perSetReps?: number[];
  /** Note shown below exercise (rest, superset, PL/PR, instructions) */
  note?: string;
  /** Default load in kg — pre-filled in tracker for gym exercises */
  defaultLoad?: number;
  muscles: string;
  videoUrl: string;
}

export interface ProgramSessionTemplate {
  id: string;
  name: string;
  focus: string;
  durationMin: number;
  /** Optional warm-up items shown before the exercise list */
  warmup?: { label: string; items: string[] };
  exercises: ProgramExerciseTemplate[];
}

export interface ProgramTemplate {
  id: string;
  title: string;
  subtitle: string;
  /** Objectif affiché sur la carte programme (court) */
  objective?: string;
  level: "beginner" | "intermediate";
  location: "gym" | "home" | "bodyweight" | "outdoor";
  image: string;
  sessions: ProgramSessionTemplate[];
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscles: string;
  videoUrl: string;
}

// ═══════════════════════════════════════════════════════
// Bibliothèque d'exercices — couvre les 4 programmes Shred
// ═══════════════════════════════════════════════════════

const BASE_LIBRARY: ExerciseLibraryItem[] = [
  // ── Cardio / Conditionnement ──
  { id: "jump-rope", name: "Corde à sauter", muscles: "Cardio, mollets", videoUrl: "https://www.youtube.com/watch?v=u3zgHI8QnqE" },
  { id: "lymphatic-hops", name: "Lymphatic hops", muscles: "Cardio léger, circulation", videoUrl: "https://www.youtube.com/watch?v=u3zgHI8QnqE" },
  { id: "bike-cardio", name: "Vélo", muscles: "Cardio, jambes", videoUrl: "https://www.youtube.com/watch?v=FEgj-3gHJnQ" },
  { id: "step-bench-continuous", name: "Montées de banc continues", muscles: "Cardio, jambes", videoUrl: "https://www.youtube.com/watch?v=wqzrb67Dwf8" },

  // ── Pectoraux / Poussée ──
  { id: "push-up", name: "Pompes", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { id: "push-up-knees", name: "Pompes sur les genoux", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=jWxvty2KROs" },
  { id: "push-up-diamond", name: "Pompes diamant", muscles: "Triceps, pectoraux internes", videoUrl: "https://www.youtube.com/watch?v=J0DnG1_S92I" },
  { id: "bb-incline-press", name: "Développé incliné à la barre", muscles: "Pectoraux supérieurs, triceps", videoUrl: "https://www.youtube.com/watch?v=SrqOu55lrYU" },
  { id: "db-incline-press", name: "Développé incliné haltères", muscles: "Pectoraux supérieurs, triceps", videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
  { id: "db-incline-fly", name: "Écartés inclinés haltères", muscles: "Pectoraux supérieurs", videoUrl: "https://www.youtube.com/watch?v=DbFgADa2PL8" },
  { id: "incline-center-press", name: "Incline center press", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=gXmhw3hRfVg" },
  { id: "chest-raise", name: "Chest raises (haltères)", muscles: "Pectoraux supérieurs, épaules", videoUrl: "https://www.youtube.com/watch?v=VCB4gvMVSZY" },
  { id: "db-pullover", name: "Pull over haltère", muscles: "Grand dorsal, pectoraux", videoUrl: "https://www.youtube.com/watch?v=FK4rHfWKEac" },

  // ── Dos / Tirage ──
  { id: "pull-up", name: "Tractions", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id: "australian-row", name: "Tractions australiennes", muscles: "Dos, arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=OYUxXMGVuuU" },
  { id: "bb-supinated-row", name: "Rowing supination à la barre", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=vT2GjY_Umpw" },
  { id: "db-incline-row", name: "Rowing incliné haltères", muscles: "Dos, arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8" },
  { id: "high-pull", name: "High pull à la barre", muscles: "Trapèzes, arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=amCU-ziHITM" },
  { id: "trap-bar-deadlift", name: "Soulevé de terre trap bar", muscles: "Dos, ischios, fessiers", videoUrl: "https://www.youtube.com/watch?v=NvPvWCUCvAY" },

  // ── Épaules / Trapèzes ──
  { id: "power-clean-push-press", name: "Power clean + Push press", muscles: "Corps complet, épaules", videoUrl: "https://www.youtube.com/watch?v=KwYJTpQ_x5A" },
  { id: "bb-shoulder-press", name: "Développé militaire à la barre", muscles: "Épaules, triceps", videoUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
  { id: "lateral-raise-full", name: "Élévations latérales amplitude complète", muscles: "Épaules", videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id: "mid-up-raise", name: "Middle up raises", muscles: "Épaules, trapèzes", videoUrl: "https://www.youtube.com/watch?v=Z5FA9aq3L6A" },
  { id: "mid-high-raise", name: "Élévations mid / high (haltères)", muscles: "Épaules, trapèzes", videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id: "full-amplitude-raise", name: "Élévations amplitude complète (haltères)", muscles: "Épaules", videoUrl: "https://www.youtube.com/watch?v=XPPfnSEATJA" },
  { id: "rear-delt-fly", name: "Élévations arrière (haltères)", muscles: "Arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=EA7u4Q_8HQ0" },
  { id: "band-reverse-fly", name: "Écarté inversé avec élastique", muscles: "Arrière d'épaules, haut du dos", videoUrl: "https://www.youtube.com/watch?v=HSoiEB7eSRs" },
  { id: "bb-shrug", name: "Shrugs à la barre", muscles: "Trapèzes", videoUrl: "https://www.youtube.com/watch?v=cJRVVxmytaM" },

  // ── Biceps ──
  { id: "hammer-curl", name: "Curl marteau", muscles: "Biceps, avant-bras", videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4" },
  { id: "db-curl", name: "Curl biceps haltères", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=av7-8igSXTs" },
  { id: "bb-curl", name: "Curl biceps à la barre", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=kwG2ipFRgfo" },
  { id: "reverse-curl", name: "Curl inversé", muscles: "Avant-bras, biceps", videoUrl: "https://www.youtube.com/watch?v=nRgxYX2Ve9w" },

  // ── Triceps ──
  { id: "bench-triceps-ext", name: "Extensions triceps sur banc", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=6kALZikXxLc" },
  { id: "standing-triceps-ext", name: "Extensions triceps debout (haltère)", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=_gsUck-7M74" },

  // ── Jambes ──
  { id: "bw-sumo-squat", name: "Squat sumo poids du corps", muscles: "Quadriceps, fessiers, adducteurs", videoUrl: "https://www.youtube.com/watch?v=b4M5n7aCBxY" },
  { id: "full-squat", name: "Squat amplitude complète", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0" },
  { id: "goblet-squat-bb", name: "Goblet squat à la barre", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=6xwGFn-J_Qg" },
  { id: "goblet-squat", name: "Goblet squat haltère", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=6xwGFn-J_Qg" },
  { id: "sit-squats", name: "Sit squats", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=H3L2PAdLNY4" },
  { id: "bulgarian-split-squat", name: "Fentes bulgares", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
  { id: "bw-lunge", name: "Fentes poids du corps", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { id: "walking-lunge", name: "Fentes marchées (haltères)", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=L8fvypPHRoc" },
  { id: "static-lunge", name: "Fentes statiques", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=Sf8Tphs6VZs" },
  { id: "stationary-lunge", name: "Fentes sur place", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { id: "step-up", name: "Step-ups sur banc", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=dQqApCGd5Ag" },
  { id: "romanian-deadlift-db", name: "Soulevé de terre roumain (haltères)", muscles: "Ischios, fessiers", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" },
  { id: "wall-sit", name: "Chaise contre un mur", muscles: "Quadriceps", videoUrl: "https://www.youtube.com/watch?v=y-wV4Lk_LIo" },

  // ── Gainage / Abdos ──
  { id: "front-plank", name: "Gainage facial", muscles: "Gainage, abdominaux", videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { id: "plank", name: "Gainage", muscles: "Gainage, abdominaux", videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { id: "hanging-leg-raise", name: "Relevés de jambes suspendu", muscles: "Abdominaux, gainage", videoUrl: "https://www.youtube.com/watch?v=Pr1ieGZ5atk" },
  { id: "crunch-controlled", name: "Crunch contrôlé", muscles: "Abdominaux", videoUrl: "https://www.youtube.com/watch?v=Xyd_fa5zoEU" },

  // ── Spécifique Hakim ──
  { id: "farmer-walk", name: "Marche du fermier", muscles: "Grip, trapèzes, gainage", videoUrl: "https://www.youtube.com/watch?v=Fkzk_RqlYig" },

  // ── Mobilité ──
  { id: "mob-hips-squat-hold", name: "Mobilité hanches + squat hold", muscles: "Mobilité hanches", videoUrl: "https://www.youtube.com/watch?v=4BOTvaRaDjI" },
  { id: "mob-hips-glutes-rot", name: "Mobilité hanches + fessiers + rotation", muscles: "Mobilité hanches, fessiers", videoUrl: "https://www.youtube.com/watch?v=4BOTvaRaDjI" },
  { id: "mob-hips-adductors-ankles", name: "Mobilité hanches + adducteurs + chevilles", muscles: "Mobilité générale", videoUrl: "https://www.youtube.com/watch?v=4BOTvaRaDjI" },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = BASE_LIBRARY;

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

function ex(
  id: string,
  sets: number,
  reps: number,
  opts?: { repsLabel?: string; perSetReps?: number[]; note?: string; defaultLoad?: number },
): ProgramExerciseTemplate {
  const base = BASE_LIBRARY.find((e) => e.id === id);
  if (!base) throw new Error(`Missing exercise: ${id}`);
  return {
    id: `${id}-${sets}x${reps}${opts?.repsLabel ? "-" + opts.repsLabel.replace(/\s+/g, "") : ""}`,
    name: base.name,
    sets,
    reps,
    repsLabel: opts?.repsLabel,
    perSetReps: opts?.perSetReps,
    note: opts?.note,
    defaultLoad: opts?.defaultLoad,
    muscles: base.muscles,
    videoUrl: base.videoUrl,
  };
}

// Shortcuts for recurring Hakim notation
const PL_PR = "(PL, PR) — progression linéaire puis reverse";
const REST = (txt: string) => `Repos ${txt}`;

// ═══════════════════════════════════════════════════════
// Programme 01 — Transformation
// (renommé depuis "Spécial Gros" de Hakim)
// Conditionnement · Perte de gras · Prise de muscle
// ═══════════════════════════════════════════════════════

const TRANSFORMATION: ProgramTemplate = {
  id: "shred-transformation",
  title: "Transformation",
  subtitle: "4 séances · Débutant · Les fondations du physique.",
  objective: "Conditionnement · Perte de gras · Prise de muscle",
  level: "beginner",
  location: "gym",
  image: "/images/shred-transformation.jpeg",
  sessions: [
    {
      id: "shred-t-s1",
      name: "Haut du corps 1",
      focus: "Cardio, pompes, volume haut du corps",
      durationMin: 55,
      exercises: [
        ex("jump-rope", 3, 0, { repsLabel: "1 min", note: "Rythme modéré. Récup active entre les séries." }),
        ex("push-up-knees", 3, 0, { repsLabel: "Reps max −3", note: "Laisse 3 reps dans le réservoir à chaque série." }),
        ex("bw-sumo-squat", 3, 15, { perSetReps: [15, 15, 15] }),
        ex("power-clean-push-press", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 20, note: "Mouvement explosif. Barre légère, technique avant tout." }),
        ex("db-incline-fly", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 6 }),
        ex("chest-raise", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 5 }),
        ex("lateral-raise-full", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 5, note: "Amplitude complète, en bas comme en haut." }),
        ex("bench-triceps-ext", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 10 }),
        ex("front-plank", 3, 0, { repsLabel: "1 min", note: "Finisher. Hanches alignées." }),
      ],
    },
    {
      id: "shred-t-s2",
      name: "Haut du corps 2",
      focus: "Tirage, épaules, bras",
      durationMin: 50,
      warmup: {
        label: "Échauffement (× 2)",
        items: ["Full body slaps", "Body waves", "Arm swings", "Dead arms", "Marches"],
      },
      exercises: [
        ex("bb-supinated-row", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 20 }),
        ex("high-pull", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 20 }),
        ex("hammer-curl", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8 }),
        ex("front-plank", 1, 0, { repsLabel: "1 min", note: "Transition active." }),
        ex("bb-shrug", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 30 }),
        ex("db-curl", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 8 }),
      ],
    },
    {
      id: "shred-t-s3",
      name: "Conditionnement général",
      focus: "Circuit cardio + force endurance",
      durationMin: 45,
      exercises: [
        ex("lymphatic-hops", 3, 0, { repsLabel: "1 min", note: "Circuit A · " + REST("2 min entre tours · 3 tours") }),
        ex("push-up-knees", 3, 0, { repsLabel: "Max −3", note: "Circuit A · laisse 3 reps dans le réservoir" }),
        ex("stationary-lunge", 3, 20, { repsLabel: "20 pas", note: "Circuit A · fin du premier circuit" }),
        ex("front-plank", 3, 0, { repsLabel: "45 sec", note: "Circuit B · " + REST("2 min entre tours · 3 tours") }),
        ex("full-squat", 3, 12, { note: "Circuit B · amplitude complète" }),
        ex("db-curl", 3, 12, { defaultLoad: 8, note: "Circuit B · fin du deuxième circuit" }),
        ex("wall-sit", 3, 0, { repsLabel: "1 min", note: "Finisher — isométrique" }),
      ],
    },
    {
      id: "shred-t-s4",
      name: "Jambes & Bras",
      focus: "Volume bas du corps + bras",
      durationMin: 55,
      warmup: {
        label: "Échauffement (× 2)",
        items: ["Facial slaps", "Body waves", "Arm swings crawl", "Dead arms", "Marches"],
      },
      exercises: [
        ex("bw-sumo-squat", 4, 15, { perSetReps: [15, 15, 15, 15] }),
        ex("bw-lunge", 4, 30, { repsLabel: "30 pas", note: "4 tours · tempo contrôlé" }),
        ex("romanian-deadlift-db", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 14, note: "Dos plat, charnière de hanche." }),
        ex("db-curl", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 8 }),
        ex("sit-squats", 4, 15, { perSetReps: [15, 15, 15, 15] }),
        ex("step-up", 3, 10, { defaultLoad: 10, note: "10 reps par jambe" }),
        ex("bench-triceps-ext", 3, 15, { defaultLoad: 10 }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Programme 02 — Pectoraux & Biceps
// Allure athlétique · Prise de muscle · Correction des faiblesses
// ═══════════════════════════════════════════════════════

const PECS_BICEPS: ProgramTemplate = {
  id: "shred-pecs-biceps",
  title: "Pectoraux & Biceps",
  subtitle: "4 séances · Intermédiaire · Volume ciblé, angles variés.",
  objective: "Allure athlétique · Prise de muscle · Correction des faiblesses",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-pecs-biceps.jpeg",
  sessions: [
    {
      id: "shred-pb-s1",
      name: "Corps complet fonctionnel",
      focus: "Pecs, jambes, gainage",
      durationMin: 55,
      exercises: [
        ex("full-amplitude-raise", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 5, note: "Superset pompes · " + REST("1 min 30 · 3 tours") }),
        ex("push-up", 3, 0, { repsLabel: "Max −3", note: "Superset élévations · laisse 3 reps dans le réservoir" }),
        ex("bb-incline-press", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 30, note: PL_PR + " · " + REST("1 min · 3 tours") }),
        ex("incline-center-press", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: REST("1 min · 3 tours") }),
        ex("farmer-walk", 3, 20, { repsLabel: "~20 pas", defaultLoad: 16, note: "Kettlebell ou haltères lourds" }),
        ex("bw-lunge", 3, 20, { repsLabel: "~20 pas" }),
        ex("hanging-leg-raise", 3, 15, { perSetReps: [15, 15, 15], note: "Contrôle, pas de balancier" }),
        ex("hammer-curl", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: "Superset crunch" }),
        ex("crunch-controlled", 3, 20, { perSetReps: [20, 20, 20], note: "Superset curl marteau" }),
      ],
    },
    {
      id: "shred-pb-s2",
      name: "Haut du corps 1",
      focus: "Tirage lourd, épaules, bras",
      durationMin: 60,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "3× Max", note: "Échauffement poussée" }),
        ex("trap-bar-deadlift", 4, 10, { perSetReps: [20, 15, 10, 10], defaultLoad: 60, note: REST("1 min · 4 tours") }),
        ex("bb-supinated-row", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: REST("1 min · 4 tours") }),
        ex("bb-shrug", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 40, note: PL_PR + " · superset élévations arrière · " + REST("1 min · 4 tours") }),
        ex("rear-delt-fly", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 4, note: "Superset shrugs" }),
        ex("high-pull", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 20, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("band-reverse-fly", 4, 20, { perSetReps: [20, 20, 20, 20], note: "Superset curl marteau · " + REST("1 min · 4 tours") }),
        ex("hammer-curl", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: "Superset écarté inversé" }),
      ],
    },
    {
      id: "shred-pb-s3",
      name: "Haut du corps 2",
      focus: "Pecs (angles), épaules, triceps",
      durationMin: 60,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "3× Max" }),
        ex("db-incline-press", 3, 10, { perSetReps: [20, 15, 10], defaultLoad: 16, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("db-pullover", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 14, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("bb-shoulder-press", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 25, note: PL_PR + " · superset chest raises · " + REST("1 min · 3 tours") }),
        ex("chest-raise", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 4, note: "Haltères à 50 % · superset développé militaire" }),
        ex("db-incline-fly", 4, 15, { perSetReps: [20, 20, 15, 15], defaultLoad: 8, note: "Haltères à 30 % · " + PL_PR + " · superset middle up raises" }),
        ex("mid-up-raise", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 5, note: PL_PR + " · superset écartés inclinés" }),
        ex("bench-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: PL_PR + " · " + REST("1 min · 4 tours") }),
      ],
    },
    {
      id: "shred-pb-s4",
      name: "Jambes & Bras",
      focus: "Volume bas + bras",
      durationMin: 55,
      exercises: [
        ex("bulgarian-split-squat", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 10, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("goblet-squat-bb", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("bb-curl", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 20, note: REST("1 min · 3 tours") }),
        ex("step-up", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 10, note: PL_PR + " · superset curl marteau · " + REST("1 min · 3 tours") }),
        ex("hammer-curl", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: "Superset step-ups" }),
        ex("standing-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: PL_PR + " · superset curl inversé · " + REST("1 min · 4 tours") }),
        ex("reverse-curl", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 8, note: PL_PR + " · superset extensions triceps" }),
        ex("push-up-diamond", 3, 0, { repsLabel: "3× Max", note: "Finisher triceps" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Programme 03 — Dos & Triceps
// Allure athlétique · Prise de muscle · Correction des faiblesses
// ═══════════════════════════════════════════════════════

const DOS_TRICEPS: ProgramTemplate = {
  id: "shred-dos-triceps",
  title: "Dos & Triceps",
  subtitle: "4 séances · Intermédiaire · Tractions, tirage lourd, bras.",
  objective: "Allure athlétique · Prise de muscle · Correction des faiblesses",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-dos-triceps.jpeg",
  sessions: [
    {
      id: "shred-dt-s1",
      name: "Corps complet fonctionnel",
      focus: "Tirage, pecs, gainage",
      durationMin: 60,
      exercises: [
        ex("mid-high-raise", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 5, note: "Superset tractions · " + REST("1 min 30 · 4 tours") }),
        ex("pull-up", 4, 0, { repsLabel: "Max −3", note: "Superset élévations · laisse 3 reps dans le réservoir" }),
        ex("db-incline-row", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 16, note: PL_PR + " · " + REST("1 min · 3 tours") }),
        ex("incline-center-press", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: REST("1 min · 3 tours") }),
        ex("farmer-walk", 3, 20, { repsLabel: "~20 pas", defaultLoad: 16 }),
        ex("bw-lunge", 3, 20, { repsLabel: "~20 pas" }),
        ex("hanging-leg-raise", 3, 15, { perSetReps: [15, 15, 15] }),
        ex("hammer-curl", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: "Superset crunch" }),
        ex("crunch-controlled", 3, 20, { perSetReps: [20, 20, 20], note: "Superset curl marteau" }),
      ],
    },
    {
      id: "shred-dt-s2",
      name: "Haut du corps 1",
      focus: "Tirage lourd + triceps",
      durationMin: 60,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "3× Max" }),
        ex("trap-bar-deadlift", 4, 10, { perSetReps: [20, 15, 10, 10], defaultLoad: 60, note: REST("1 min · 4 tours") }),
        ex("bb-supinated-row", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: REST("1 min · 4 tours") }),
        ex("bb-shrug", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 40, note: PL_PR + " · superset élévations arrière · " + REST("1 min · 4 tours") }),
        ex("rear-delt-fly", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 4, note: "Superset shrugs" }),
        ex("high-pull", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 20, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("band-reverse-fly", 4, 20, { perSetReps: [20, 20, 20, 20], note: "Superset extensions triceps debout · " + REST("1 min · 4 tours") }),
        ex("standing-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: "Superset écarté inversé" }),
      ],
    },
    {
      id: "shred-dt-s3",
      name: "Haut du corps 2",
      focus: "Tractions, pecs (angles), triceps",
      durationMin: 60,
      exercises: [
        ex("pull-up", 4, 0, { repsLabel: "Max −3", note: REST("1 min · 4 tours") }),
        ex("db-incline-press", 3, 10, { perSetReps: [20, 15, 10], defaultLoad: 16, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("db-pullover", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 14, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("bb-shoulder-press", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 25, note: PL_PR + " · superset chest raises · " + REST("1 min · 3 tours") }),
        ex("chest-raise", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 4, note: "Haltères à 50 % · superset développé militaire" }),
        ex("db-incline-fly", 4, 15, { perSetReps: [20, 20, 15, 15], defaultLoad: 8, note: "Haltères à 30 % · " + PL_PR + " · superset middle up raises" }),
        ex("mid-up-raise", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 5, note: PL_PR + " · superset écartés inclinés" }),
        ex("bench-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: PL_PR + " · " + REST("1 min · 4 tours") }),
      ],
    },
    {
      id: "shred-dt-s4",
      name: "Jambes & Bras",
      focus: "Volume bas + bras + tractions finisher",
      durationMin: 55,
      exercises: [
        ex("bulgarian-split-squat", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 10, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("goblet-squat-bb", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("bb-curl", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 20, note: REST("1 min · 3 tours") }),
        ex("step-up", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 10, note: PL_PR + " · superset curl marteau · " + REST("1 min · 3 tours") }),
        ex("hammer-curl", 3, 20, { perSetReps: [20, 20, 20], defaultLoad: 8, note: "Superset step-ups" }),
        ex("standing-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: PL_PR + " · superset curl inversé · " + REST("1 min · 4 tours") }),
        ex("reverse-curl", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 8, note: PL_PR + " · superset extensions triceps" }),
        ex("australian-row", 4, 0, { repsLabel: "4× Max", note: "Finisher dos" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Programme 04 — Complément sportif
// Pour ceux qui font déjà du sport à côté
// Maintien performance · Coordination · Mobilité
// ═══════════════════════════════════════════════════════

const COMPLEMENT: ProgramTemplate = {
  id: "shred-complement",
  title: "Complément sportif",
  subtitle: "3 séances · Intermédiaire · Pour ceux qui ont déjà un sport principal.",
  objective: "Maintien performance · Coordination · Mobilité",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-complement.jpeg",
  sessions: [
    {
      id: "shred-cs-s1",
      name: "Full Body Control",
      focus: "Contrôle, mobilité, posture",
      durationMin: 55,
      exercises: [
        ex("mob-hips-squat-hold", 1, 0, { repsLabel: "5–8 min", note: "Échauffement complet hanches" }),
        ex("mid-high-raise", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 5, note: "Superset tractions · " + REST("1 min 30 · 3 tours") }),
        ex("pull-up", 3, 0, { repsLabel: "Max −3", note: "Superset élévations" }),
        ex("bb-shoulder-press", 3, 10, { perSetReps: [12, 10, 10], defaultLoad: 25, note: "Superset fentes marchées · " + REST("1 min · 3 tours") }),
        ex("walking-lunge", 3, 20, { repsLabel: "~20 pas", defaultLoad: 10, note: "Superset développé militaire" }),
        ex("db-incline-row", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 14, note: "Superset marche du fermier · " + REST("1 min · 3 tours") }),
        ex("farmer-walk", 3, 35, { repsLabel: "~30–40 pas", defaultLoad: 20, note: "Superset rowing incliné" }),
        ex("hanging-leg-raise", 3, 15, { perSetReps: [15, 15, 15] }),
        ex("bike-cardio", 1, 0, { repsLabel: "8–10 min", note: "Rythme modéré, cool-down" }),
      ],
    },
    {
      id: "shred-cs-s2",
      name: "Full Body Power & Posture",
      focus: "Puissance, chaîne postérieure, posture",
      durationMin: 55,
      exercises: [
        ex("mob-hips-glutes-rot", 1, 0, { repsLabel: "5–8 min", note: "Échauffement hanches + rotation" }),
        ex("trap-bar-deadlift", 3, 8, { perSetReps: [12, 10, 8], defaultLoad: 60, note: "Superset pompes · " + REST("1 min 30 · 3 tours") }),
        ex("push-up", 3, 0, { repsLabel: "Max −3", note: "Superset trap bar" }),
        ex("bb-shrug", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 40, note: "Superset élévations arrière · " + REST("1 min · 3 tours") }),
        ex("rear-delt-fly", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 4, note: "Superset shrugs" }),
        ex("high-pull", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 20, note: "Superset step-ups · " + REST("1 min · 3 tours") }),
        ex("step-up", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 10, note: PL_PR + " · superset high pull" }),
        ex("hammer-curl", 2, 15, { perSetReps: [15, 15], defaultLoad: 8, note: "Superset extensions triceps" }),
        ex("standing-triceps-ext", 2, 15, { perSetReps: [15, 15], defaultLoad: 10, note: "Superset curl marteau" }),
        ex("step-bench-continuous", 1, 0, { repsLabel: "5–8 min", note: "Continu, rythme soutenu" }),
      ],
    },
    {
      id: "shred-cs-s3",
      name: "Full Body Athletic Flow",
      focus: "Athlétique, fluidité, cardio léger",
      durationMin: 50,
      exercises: [
        ex("mob-hips-adductors-ankles", 1, 0, { repsLabel: "5–8 min", note: "Échauffement complet" }),
        ex("australian-row", 3, 0, { repsLabel: "Max −4", note: "Superset pull over · " + REST("1 min · 3 tours") }),
        ex("db-pullover", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 14, note: "Superset australiennes" }),
        ex("db-incline-press", 3, 10, { perSetReps: [12, 10, 10], defaultLoad: 14, note: "Superset middle/up raises · " + REST("1 min · 3 tours") }),
        ex("mid-up-raise", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 5, note: "Superset incline chest press" }),
        ex("goblet-squat", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 16, note: "Ou à la barre · superset fentes statiques · " + REST("1 min · 3 tours") }),
        ex("static-lunge", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 10, note: PL_PR + " · superset goblet squat" }),
        ex("crunch-controlled", 2, 20, { perSetReps: [20, 20] }),
        ex("plank", 2, 0, { repsLabel: "45 sec" }),
        ex("bike-cardio", 1, 0, { repsLabel: "10 min", note: "Léger, finition cardio douce" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════

export const MASS_PROGRAMS: ProgramTemplate[] = [
  TRANSFORMATION,
  PECS_BICEPS,
  DOS_TRICEPS,
  COMPLEMENT,
];
