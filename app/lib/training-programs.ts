// ═══════════════════════════════════════════════════════
// OPTIZ — Shred Academy by Hakim
// Catalogue complet des 4 programmes · mis à jour 2026-04-22
// ═══════════════════════════════════════════════════════

export interface ProgramExerciseTemplate {
  /** Composite id unique au sein d'une session — `${libraryId}-${sets}x${reps}…`.
   *  Sert pour les clés React et le tracking des sets. */
  id: string;
  /** Id de référence dans `BASE_LIBRARY` — utiliser pour résoudre la vidéo,
   *  pas `id` (qui est suffixé par sets/reps et ne match aucun mapping vidéo). */
  libraryId: string;
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

/**
 * Construit une URL de recherche YouTube déterministe à partir du nom + d'un
 * qualificatif (ex. "démonstration exercice musculation"). Garantit :
 *  - Cohérence : même requête = même page de résultats à chaque fois
 *  - Pas de lien mort (contrairement à une vidéo spécifique supprimée)
 *  - Pertinence : la 1ʳᵉ vidéo de la SERP correspond toujours à l'exercice
 */
const ytSearch = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${name} démonstration musculation`,
  )}`;

type LibRow = Omit<ExerciseLibraryItem, "videoUrl"> & { searchTerm?: string };

const LIBRARY_ROWS: LibRow[] = [
  // ── Cardio / Conditionnement ──
  { id: "jump-rope", name: "Corde à sauter", muscles: "Cardio, mollets" },
  { id: "lymphatic-hops", name: "Lymphatic hops", muscles: "Cardio léger, circulation", searchTerm: "lymphatic hops drainage exercise" },
  { id: "bike-cardio", name: "Vélo", muscles: "Cardio, jambes", searchTerm: "vélo cardio salle de sport" },
  { id: "step-bench-continuous", name: "Montées de banc continues", muscles: "Cardio, jambes", searchTerm: "step up banc continu cardio" },

  // ── Pectoraux / Poussée ──
  { id: "push-up", name: "Pompes", muscles: "Pectoraux, triceps" },
  { id: "push-up-knees", name: "Pompes sur les genoux", muscles: "Pectoraux, triceps" },
  { id: "push-up-diamond", name: "Pompes diamant", muscles: "Triceps, pectoraux internes" },
  { id: "bb-incline-press", name: "Développé incliné à la barre", muscles: "Pectoraux supérieurs, triceps" },
  { id: "db-incline-press", name: "Développé incliné haltères", muscles: "Pectoraux supérieurs, triceps" },
  { id: "db-incline-fly", name: "Écartés inclinés haltères", muscles: "Pectoraux supérieurs" },
  { id: "incline-center-press", name: "Incline center press", muscles: "Pectoraux, triceps", searchTerm: "incline dumbbell svend press chest" },
  { id: "chest-raise", name: "Chest raises (haltères)", muscles: "Pectoraux supérieurs, épaules", searchTerm: "chest raise haltère front raise pectoraux" },
  { id: "db-pullover", name: "Pull over haltère", muscles: "Grand dorsal, pectoraux" },

  // ── Dos / Tirage ──
  { id: "pull-up", name: "Tractions", muscles: "Dos, biceps" },
  { id: "australian-row", name: "Tractions australiennes", muscles: "Dos, arrière d'épaules", searchTerm: "tractions australiennes inverted row" },
  { id: "bb-supinated-row", name: "Rowing supination à la barre", muscles: "Dos, biceps", searchTerm: "rowing barre prise supination Yates row" },
  { id: "db-incline-row", name: "Rowing incliné haltères", muscles: "Dos, arrière d'épaules", searchTerm: "rowing incliné haltères chest supported" },
  { id: "high-pull", name: "High pull à la barre", muscles: "Trapèzes, arrière d'épaules", searchTerm: "high pull barre trapèzes" },
  { id: "trap-bar-deadlift", name: "Soulevé de terre trap bar", muscles: "Dos, ischios, fessiers" },

  // ── Épaules / Trapèzes ──
  { id: "power-clean-push-press", name: "Power clean + Push press", muscles: "Corps complet, épaules", searchTerm: "power clean push press complex" },
  { id: "bb-shoulder-press", name: "Développé militaire à la barre", muscles: "Épaules, triceps" },
  { id: "lateral-raise-full", name: "Élévations latérales amplitude complète", muscles: "Épaules", searchTerm: "élévations latérales amplitude complète haltères" },
  { id: "mid-up-raise", name: "Middle up raises", muscles: "Épaules, trapèzes", searchTerm: "middle up raise haltères épaules" },
  { id: "mid-high-raise", name: "Élévations mid / high (haltères)", muscles: "Épaules, trapèzes", searchTerm: "élévations mid high dumbbell combo" },
  { id: "full-amplitude-raise", name: "Élévations amplitude complète (haltères)", muscles: "Épaules", searchTerm: "élévations amplitude complète haltères shoulders" },
  { id: "rear-delt-fly", name: "Élévations arrière (haltères)", muscles: "Arrière d'épaules", searchTerm: "élévations arrière haltères rear delt fly" },
  { id: "band-reverse-fly", name: "Écarté inversé avec élastique", muscles: "Arrière d'épaules, haut du dos", searchTerm: "écarté inversé élastique band reverse fly" },
  { id: "bb-shrug", name: "Shrugs à la barre", muscles: "Trapèzes", searchTerm: "shrugs barre trapèzes barbell shrug" },

  // ── Biceps ──
  { id: "hammer-curl", name: "Curl marteau", muscles: "Biceps, avant-bras", searchTerm: "curl marteau haltères hammer curl" },
  { id: "db-curl", name: "Curl biceps haltères", muscles: "Biceps", searchTerm: "curl biceps haltères dumbbell curl" },
  { id: "bb-curl", name: "Curl biceps à la barre", muscles: "Biceps", searchTerm: "curl biceps barre barbell curl" },
  { id: "reverse-curl", name: "Curl inversé", muscles: "Avant-bras, biceps", searchTerm: "curl inversé barre reverse curl avant-bras" },

  // ── Triceps ──
  { id: "bench-triceps-ext", name: "Extensions triceps sur banc", muscles: "Triceps", searchTerm: "extensions triceps allongé banc skull crusher" },
  { id: "standing-triceps-ext", name: "Extensions triceps debout (haltère)", muscles: "Triceps", searchTerm: "extensions triceps debout haltère overhead" },

  // ── Jambes ──
  { id: "bw-sumo-squat", name: "Squat sumo poids du corps", muscles: "Quadriceps, fessiers, adducteurs", searchTerm: "squat sumo poids du corps bodyweight" },
  { id: "full-squat", name: "Squat amplitude complète", muscles: "Quadriceps, fessiers", searchTerm: "squat amplitude complète full squat" },
  { id: "goblet-squat-bb", name: "Goblet squat à la barre", muscles: "Quadriceps, fessiers", searchTerm: "goblet squat barre zercher front squat" },
  { id: "goblet-squat", name: "Goblet squat haltère", muscles: "Quadriceps, fessiers", searchTerm: "goblet squat haltère démonstration" },
  { id: "sit-squats", name: "Sit squats", muscles: "Quadriceps, fessiers", searchTerm: "sit squat box squat chaise" },
  { id: "bulgarian-split-squat", name: "Fentes bulgares", muscles: "Quadriceps, fessiers", searchTerm: "fentes bulgares split squat" },
  { id: "bw-lunge", name: "Fentes poids du corps", muscles: "Quadriceps, fessiers", searchTerm: "fentes poids du corps bodyweight lunge" },
  { id: "walking-lunge", name: "Fentes marchées (haltères)", muscles: "Quadriceps, fessiers", searchTerm: "fentes marchées haltères walking lunge" },
  { id: "static-lunge", name: "Fentes statiques", muscles: "Quadriceps, fessiers", searchTerm: "fentes statiques split stance lunge" },
  { id: "stationary-lunge", name: "Fentes sur place", muscles: "Quadriceps, fessiers", searchTerm: "fentes sur place stationary lunge" },
  { id: "step-up", name: "Step-ups sur banc", muscles: "Quadriceps, fessiers", searchTerm: "step up banc haltères" },
  { id: "romanian-deadlift-db", name: "Soulevé de terre roumain (haltères)", muscles: "Ischios, fessiers", searchTerm: "soulevé de terre roumain haltères RDL" },
  { id: "wall-sit", name: "Chaise contre un mur", muscles: "Quadriceps", searchTerm: "chaise contre un mur wall sit" },

  // ── Gainage / Abdos ──
  { id: "front-plank", name: "Gainage facial", muscles: "Gainage, abdominaux", searchTerm: "gainage facial plank" },
  { id: "plank", name: "Gainage", muscles: "Gainage, abdominaux", searchTerm: "gainage plank abdominaux" },
  { id: "hanging-leg-raise", name: "Relevés de jambes suspendu", muscles: "Abdominaux, gainage", searchTerm: "relevés de jambes suspendu hanging leg raise" },
  { id: "crunch-controlled", name: "Crunch contrôlé", muscles: "Abdominaux", searchTerm: "crunch contrôlé abdominaux" },

  // ── Spécifique Hakim ──
  { id: "farmer-walk", name: "Marche du fermier", muscles: "Grip, trapèzes, gainage", searchTerm: "marche du fermier farmer walk" },

  // ── Mobilité ──
  { id: "mob-hips-squat-hold", name: "Mobilité hanches + squat hold", muscles: "Mobilité hanches", searchTerm: "mobilité hanches squat hold warm up" },
  { id: "mob-hips-glutes-rot", name: "Mobilité hanches + fessiers + rotation", muscles: "Mobilité hanches, fessiers", searchTerm: "mobilité hanches fessiers rotation warm up" },
  { id: "mob-hips-adductors-ankles", name: "Mobilité hanches + adducteurs + chevilles", muscles: "Mobilité générale", searchTerm: "mobilité hanches adducteurs chevilles warm up" },
];

const BASE_LIBRARY: ExerciseLibraryItem[] = LIBRARY_ROWS.map((row) => ({
  id: row.id,
  name: row.name,
  muscles: row.muscles,
  videoUrl: ytSearch(row.searchTerm ?? row.name),
}));

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
    libraryId: id,
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
// Conditioning · Fat loss · Build muscle
// ═══════════════════════════════════════════════════════

const TRANSFORMATION: ProgramTemplate = {
  id: "shred-transformation",
  title: "Transformation",
  subtitle: "4 séances · Débutant · Les fondations du physique.",
  objective: "Conditioning · Fat loss · Build muscle",
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
      name: "General Conditioning",
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
      name: "Legs & Arms",
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
        ex("step-up", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 10, note: "10 reps par jambe" }),
        ex("bench-triceps-ext", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 10 }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Programme 02 — Spécialisation Push (Pecs & Biceps)
// Pour ceux qui veulent rattraper pectoraux et biceps
// Athletic look · Build muscle · Correction des faiblesses
// ═══════════════════════════════════════════════════════

const PECS_BICEPS: ProgramTemplate = {
  id: "shred-pecs-biceps",
  title: "Spécialisation Push — Pecs & Biceps",
  subtitle: "4 séances · Intermédiaire · Rattrape tes pectoraux et tes biceps.",
  objective: "Athletic look · Build muscle · Correction des faiblesses",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-pecs-biceps.jpeg",
  sessions: [
    {
      id: "shred-pb-s1",
      name: "Functional Full Body",
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
      name: "Upper 1",
      focus: "Tirage lourd, épaules, bras",
      durationMin: 60,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "3× Max", note: "Échauffement poussée" }),
        ex("trap-bar-deadlift", 4, 10, { perSetReps: [20, 15, 10, 10], defaultLoad: 60, note: REST("1 min · 4 tours") }),
        ex("bb-supinated-row", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: REST("1 min · 4 tours") }),
        ex("bb-shrug", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 40, note: PL_PR + " · superset écarté inversé · " + REST("1 min · 4 tours") }),
        ex("band-reverse-fly", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 4, note: "Superset shrugs · élastique tendu" }),
        ex("high-pull", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 20, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("lateral-raise-full", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 5, note: "Superset curl marteau · amplitude complète · " + REST("1 min · 4 tours") }),
        ex("hammer-curl", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: "Superset élévations latérales" }),
      ],
    },
    {
      id: "shred-pb-s3",
      name: "Upper 2",
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
      name: "Legs & Arms",
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
// Programme 03 — Spécialisation Pull (Dos & Triceps)
// Pour ceux qui veulent rattraper dos et triceps
// Athletic look · Build muscle · Correction des faiblesses
// ═══════════════════════════════════════════════════════

const DOS_TRICEPS: ProgramTemplate = {
  id: "shred-dos-triceps",
  title: "Spécialisation Pull — Dos & Triceps",
  subtitle: "4 séances · Intermédiaire · Rattrape ton dos et tes triceps.",
  objective: "Athletic look · Build muscle · Correction des faiblesses",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-dos-triceps.jpeg",
  sessions: [
    {
      id: "shred-dt-s1",
      name: "Functional Full Body",
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
      name: "Upper 1",
      focus: "Tirage lourd + triceps",
      durationMin: 60,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "3× Max" }),
        ex("trap-bar-deadlift", 4, 10, { perSetReps: [20, 15, 10, 10], defaultLoad: 60, note: REST("1 min · 4 tours") }),
        ex("bb-supinated-row", 4, 15, { perSetReps: [15, 15, 15, 15], defaultLoad: 30, note: REST("1 min · 4 tours") }),
        ex("bb-shrug", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 40, note: PL_PR + " · superset écarté inversé · " + REST("1 min · 4 tours") }),
        ex("band-reverse-fly", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 4, note: "Superset shrugs · élastique tendu" }),
        ex("high-pull", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 20, note: PL_PR + " · " + REST("1 min · 4 tours") }),
        ex("lateral-raise-full", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 5, note: "Superset extensions triceps debout · amplitude complète · " + REST("1 min · 4 tours") }),
        ex("standing-triceps-ext", 4, 20, { perSetReps: [20, 20, 20, 20], defaultLoad: 10, note: "Superset élévations latérales" }),
      ],
    },
    {
      id: "shred-dt-s3",
      name: "Upper 2",
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
      name: "Legs & Arms",
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
// Programme 04 — Performance Athlétique
// Pour ceux qui ont déjà un sport principal
// Maintien performance · Coordination · Mobilité
// ═══════════════════════════════════════════════════════

const COMPLEMENT: ProgramTemplate = {
  id: "shred-complement",
  title: "Performance Athlétique",
  subtitle: "3 séances · Intermédiaire · Complément pour athlètes avec un sport principal.",
  objective: "Maintien performance · Coordination · Mobilité",
  level: "intermediate",
  location: "gym",
  image: "/images/shred-complement.jpeg",
  sessions: [
    {
      id: "shred-cs-s1",
      name: "Full Body (Control)",
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
      name: "Full Body (Power Posture)",
      focus: "Puissance, chaîne postérieure, posture",
      durationMin: 55,
      exercises: [
        ex("mob-hips-glutes-rot", 1, 0, { repsLabel: "5–8 min", note: "Échauffement hanches + rotation" }),
        ex("trap-bar-deadlift", 3, 8, { perSetReps: [12, 10, 8], defaultLoad: 60, note: "Superset pompes · " + REST("1 min 30 · 3 tours") }),
        ex("push-up", 3, 0, { repsLabel: "Max −3", note: "Superset trap bar" }),
        ex("bb-shrug", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 40, note: "Superset écarté inversé · " + REST("1 min · 3 tours") }),
        ex("band-reverse-fly", 3, 15, { perSetReps: [15, 15, 15], defaultLoad: 4, note: "Superset shrugs · élastique tendu" }),
        ex("high-pull", 3, 12, { perSetReps: [12, 12, 12], defaultLoad: 20, note: "Superset step-ups · " + REST("1 min · 3 tours") }),
        ex("step-up", 3, 10, { perSetReps: [10, 10, 10], defaultLoad: 10, note: PL_PR + " · superset high pull" }),
        ex("hammer-curl", 2, 15, { perSetReps: [15, 15], defaultLoad: 8, note: "Superset extensions triceps" }),
        ex("standing-triceps-ext", 2, 15, { perSetReps: [15, 15], defaultLoad: 10, note: "Superset curl marteau" }),
        ex("step-bench-continuous", 1, 0, { repsLabel: "5–8 min", note: "Continu, rythme soutenu" }),
      ],
    },
    {
      id: "shred-cs-s3",
      name: "Full Body (Athletic + Flow)",
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

// Ordre WhatsApp Hakim (2026-04-21) : P2 = Pectoraux & Biceps, P3 = Dos & Triceps
export const MASS_PROGRAMS: ProgramTemplate[] = [
  TRANSFORMATION,
  PECS_BICEPS,
  DOS_TRICEPS,
  COMPLEMENT,
];
