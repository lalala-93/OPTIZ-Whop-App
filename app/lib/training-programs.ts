// ═══════════════════════════════════════════════════════
// OPTIZ Training Programs — Exercise Library + Programs
// ═══════════════════════════════════════════════════════

export interface ProgramExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: number;
  /** Display label for reps (e.g. "Max", "30s", "30m") — overrides numeric reps in UI */
  repsLabel?: string;
  /** Per-set rep targets e.g. [20, 15, 10, 10] — overrides uniform `reps` per set */
  perSetReps?: number[];
  /** Note shown below exercise (e.g. "45s-1min récup", "EMOM 10min") */
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
  exercises: ProgramExerciseTemplate[];
}

export interface ProgramTemplate {
  id: string;
  title: string;
  subtitle: string;
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
// Exercise Library
// ═══════════════════════════════════════════════════════

const BASE_LIBRARY: ExerciseLibraryItem[] = [
  // ── Pectoraux / Poussée ──
  { id: "push-up", name: "Pompes", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { id: "push-up-elevated", name: "Pompes pieds surélevés", muscles: "Pectoraux supérieurs, triceps", videoUrl: "https://www.youtube.com/watch?v=4dF1DOWzf20" },
  { id: "push-up-close", name: "Pompes serrées", muscles: "Triceps, pectoraux", videoUrl: "https://www.youtube.com/watch?v=5L3gZ2UCLWE" },
  { id: "dips", name: "Dips", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As" },
  { id: "db-pullover", name: "Pull over haltère sur banc", muscles: "Haut de pec, dorsaux", videoUrl: "https://www.youtube.com/watch?v=FK4rHfWKEac" },
  { id: "db-military-press", name: "Développé militaire barre", muscles: "Épaules, triceps", videoUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
  { id: "db-incline-fly", name: "Écarté couché incliné haltères", muscles: "Pectoraux supérieurs", videoUrl: "https://www.youtube.com/watch?v=DbFgADa2PL8" },
  { id: "squeeze-press", name: "Squeeze press", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=gXmhw3hRfVg" },
  { id: "high-chest-raise", name: "Élévation haut de pec haltères", muscles: "Pectoraux supérieurs, épaules", videoUrl: "https://www.youtube.com/watch?v=VCB4gvMVSZY" },

  // ── Dos / Tirage ──
  { id: "pull-up-prona", name: "Tractions pronation", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id: "chin-up", name: "Tractions supination", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=brhRXlOhsAM" },
  { id: "australian-row", name: "Australienne prise large", muscles: "Dos, arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=OYUxXMGVuuU" },
  { id: "inverted-deadlift", name: "Deadlift inversé (hold)", muscles: "Ischios, fessiers, gainage", videoUrl: "https://www.youtube.com/watch?v=oFxEDkxbPKs" },
  { id: "band-uni-row", name: "Tirage uni élastique coude ouvert", muscles: "Dos, arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=xQNrFHEMhI4" },
  { id: "lat-pulldown", name: "Tirage vertical", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc" },
  { id: "upright-row", name: "Tirage menton haut à la barre", muscles: "Épaules, trapèzes", videoUrl: "https://www.youtube.com/watch?v=amCU-ziHITM" },
  { id: "rack-pull", name: "Rack pulls", muscles: "Dos, trapèzes, ischios", videoUrl: "https://www.youtube.com/watch?v=V6JzmVlRnXY" },

  // ── Épaules ──
  { id: "band-rear-delt", name: "Arrière d'épaule élastique", muscles: "Arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=HSoiEB7eSRs" },
  { id: "band-rear-delt-uni", name: "Arrière d'épaule élastique unilatéral", muscles: "Arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=6vFwbjh88Uw" },
  { id: "rear-delt-fly", name: "Oiseau haltères", muscles: "Arrière d'épaules", videoUrl: "https://www.youtube.com/watch?v=EA7u4Q_8HQ0" },
  { id: "lateral-raise-mid", name: "Élévation latérale mi-amplitude", muscles: "Épaules", videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id: "barbell-shrug", name: "Shrug barre", muscles: "Trapèzes", videoUrl: "https://www.youtube.com/watch?v=cJRVVxmytaM" },

  // ── Triceps ──
  { id: "band-triceps-ext", name: "Extension triceps élastique haut→bas", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=nBuFkrhOcUE" },
  { id: "skull-crusher", name: "Skull crushers", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=d_KZxkY_0cM" },
  { id: "overhead-triceps", name: "Extension triceps nuque haltère", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=_gsUck-7M74" },

  // ── Biceps ──
  { id: "hammer-curl", name: "Curl marteau haltère", muscles: "Biceps, avant-bras", videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4" },
  { id: "band-hammer-curl", name: "Curl marteau élastique", muscles: "Biceps, avant-bras", videoUrl: "https://www.youtube.com/watch?v=ac9e4qddrh4" },

  // ── Jambes ──
  { id: "jump-lunge", name: "Fentes sautées alternées", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=QE_3dMFOzBk" },
  { id: "wall-sit", name: "Chaise contre le mur", muscles: "Quadriceps", videoUrl: "https://www.youtube.com/watch?v=y-wV4Lk_LIo" },
  { id: "sissy-squat", name: "Sissy squat", muscles: "Quadriceps", videoUrl: "https://www.youtube.com/watch?v=1PHEC_-F9b0" },
  { id: "duck-walk", name: "Marche en canard", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=u4f0NUQK2T4" },
  { id: "walking-lunge", name: "Fentes marchées haltères", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=L8fvypPHRoc" },
  { id: "walking-lunge-tempo", name: "Fentes marchées tempo lent", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=L8fvypPHRoc" },
  { id: "squat-jump", name: "Squats sautés", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0" },
  { id: "step-up", name: "Step up banc haltère", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=dQqApCGd5Ag" },
  { id: "goblet-squat-elevated", name: "Goblet squat talons surélevés", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=6xwGFn-J_Qg" },
  { id: "romanian-deadlift-db", name: "Romanian deadlift haltère", muscles: "Ischios, fessiers", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" },
  { id: "goblet-squat", name: "Goblet squat haltère", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=6xwGFn-J_Qg" },
  { id: "farmer-walk", name: "Marche du fermier", muscles: "Grip, trapèzes, gainage", videoUrl: "https://www.youtube.com/watch?v=Fkzk_RqlYig" },

  // ── Beginner gym additions ──
  { id: "db-bench-press", name: "Développé couché haltères", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=VmB1G1K7v94" },
  { id: "db-incline-press", name: "Développé incliné haltères", muscles: "Pectoraux supérieurs, triceps", videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
  { id: "db-flat-fly", name: "Écartés couchés haltères", muscles: "Pectoraux", videoUrl: "https://www.youtube.com/watch?v=eozdVDA78K0" },
  { id: "face-pull", name: "Face pull", muscles: "Arrière d'épaules, haut du dos", videoUrl: "https://www.youtube.com/watch?v=rep-qVOkqgk" },
  { id: "cable-triceps-ext", name: "Extension triceps poulie", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU" },
  { id: "cable-curl-bar", name: "Biceps curl barre poulie basse", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=NFzTWp2qpiE" },
  { id: "bulgarian-split-squat", name: "Fentes bulgares haltères", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
  { id: "leg-extension", name: "Leg extension", muscles: "Quadriceps", videoUrl: "https://www.youtube.com/watch?v=YyvSfVjQeL0" },
  { id: "leg-curl", name: "Leg curl", muscles: "Ischios", videoUrl: "https://www.youtube.com/watch?v=1Tq3QdYUuHs" },
  { id: "dead-hang", name: "Suspension passive à la barre", muscles: "Grip, épaules, colonne", videoUrl: "https://www.youtube.com/watch?v=E_ZTIhJjdBU" },
  { id: "lat-pulldown-neutral", name: "Tirage vertical prise neutre", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=lueEJGjTuPQ" },
  { id: "seated-row-close", name: "Tirage horizontal prise serrée", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=sPC3EDqTjxw" },
  { id: "chest-press-machine", name: "Chest press machine", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=sqNwDkUU_Ps" },
  { id: "db-row-bent-over", name: "Rowing haltères buste penché", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8" },
  { id: "db-curl", name: "Biceps curl haltères", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=av7-8igSXTs" },
  { id: "rope-triceps-ext", name: "Extension triceps corde", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=kiuVA0gs3EI" },
  { id: "negative-pull-up", name: "Tractions négatives", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=gbPURTSxQLY" },
  { id: "scapular-pull-up", name: "Tractions scapulaires", muscles: "Ceinture scapulaire, dos", videoUrl: "https://www.youtube.com/watch?v=AK8Lr8f0fUk" },
  { id: "pec-deck", name: "Pec deck", muscles: "Pectoraux", videoUrl: "https://www.youtube.com/watch?v=QENKPHhQVi4" },
  { id: "barbell-bent-over-row", name: "Rowing barre buste penché", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=vT2GjY_Umpw" },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = BASE_LIBRARY;

// ═══════════════════════════════════════════════════════
// Helper: build exercise from library
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
    id: `${id}-${sets}x${reps}`,
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

// ═══════════════════════════════════════════════════════
// Program 1: Street Workout
// Chaise romaine + 2 élastiques (résistance - et +)
// 45s à 1min récup sauf EMOMs
// ═══════════════════════════════════════════════════════

const STREET_PARK: ProgramTemplate = {
  id: "street-park",
  title: "Street Workout",
  subtitle: "Chaise romaine + élastiques. Zéro salle, zéro excuse.",
  level: "intermediate",
  location: "outdoor",
  image: "/images/street-park.jpeg",
  sessions: [
    {
      id: "street-park-s1",
      name: "Séance 1",
      focus: "Tractions, jambes, pompes",
      durationMin: 50,
      exercises: [
        ex("pull-up-prona", 1, 0, { repsLabel: "EMOM 10 min", note: "1 série par minute pendant 10 minutes. Pas de récup imposée." }),
        ex("australian-row", 4, 20, { note: "Ou focus arrière d'épaule élastique. 45s-1min récup" }),
        ex("inverted-deadlift", 4, 0, { repsLabel: "Max reps hold", note: "Commencer jambes pliées, déplier progressivement. 45s-1min récup" }),
        ex("jump-lunge", 4, 20, { note: "⚡ Superset avec chaise mur 30s. 45s-1min récup" }),
        ex("wall-sit", 4, 0, { repsLabel: "30s", note: "⚡ Superset avec fentes sautées" }),
        ex("push-up-elevated", 3, 0, { repsLabel: "Max reps", note: "45s-1min récup" }),
      ],
    },
    {
      id: "street-park-s2",
      name: "Séance 2",
      focus: "Pompes, dips, tirage, jambes",
      durationMin: 50,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "Max reps", note: "45s-1min récup" }),
        ex("band-rear-delt-uni", 4, 15, { note: "⚡ Superset avec extension triceps. 45s-1min récup" }),
        ex("band-triceps-ext", 4, 20, { note: "⚡ Superset avec arrière d'épaule" }),
        ex("dips", 1, 0, { repsLabel: "EMOM 10 min", note: "1 série par minute pendant 10 minutes" }),
        ex("band-uni-row", 4, 20, { note: "Coude ouvert, perpendiculaire au corps. 45s-1min récup" }),
        ex("sissy-squat", 4, 10, { note: "⚡ Superset avec marche en canard 30m. 45s-1min récup" }),
        ex("duck-walk", 4, 0, { repsLabel: "30m", note: "⚡ Superset avec sissy squat" }),
      ],
    },
    {
      id: "street-park-s3",
      name: "Séance 3",
      focus: "Tractions supi, pompes EMOM, bras, jambes",
      durationMin: 50,
      exercises: [
        ex("chin-up", 3, 0, { repsLabel: "Max reps", note: "45s-1min récup" }),
        ex("push-up-elevated", 1, 0, { repsLabel: "EMOM 10 min", note: "20s effort / 40s repos" }),
        ex("band-hammer-curl", 4, 20, { note: "⚡ Superset avec extension triceps. 45s-1min récup" }),
        ex("band-triceps-ext", 4, 20, { note: "⚡ Superset avec curl marteau" }),
        ex("walking-lunge-tempo", 4, 30, { note: "⚡ Superset avec squats sautés. Tempo lent. 45s-1min récup" }),
        ex("squat-jump", 4, 15, { note: "⚡ Superset avec fentes marchées" }),
      ],
    },
    {
      id: "street-park-s4",
      name: "Séance 4",
      focus: "EMOM 20 min + jambes",
      durationMin: 45,
      exercises: [
        ex("pull-up-prona", 1, 0, { repsLabel: "EMOM 20 min", note: "40s effort / 20s repos. Min 1: tractions prona. Min 2: pompes serrées. Min 3: tractions prona. Boucle." }),
        ex("step-up", 4, 10, { note: "⚡ Superset avec goblet squat. 45s-1min récup" }),
        ex("goblet-squat", 4, 15, { note: "⚡ Superset avec step up" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Program 2: Salle de sport
// Haltères + barre + banc
// 45s à 1min récup pour tous les exos
// ═══════════════════════════════════════════════════════

const SALLE: ProgramTemplate = {
  id: "salle",
  title: "Salle de sport",
  subtitle: "Haltères, barre, banc. Le programme complet.",
  level: "intermediate",
  location: "gym",
  image: "/images/salle.jpeg",
  sessions: [
    {
      id: "salle-s1",
      name: "Séance 1 — Push",
      focus: "Pectoraux, épaules, triceps",
      durationMin: 55,
      exercises: [
        ex("push-up", 3, 0, { repsLabel: "Max reps", note: "Échauffement. 45s-1min récup" }),
        ex("db-pullover", 4, 20, { defaultLoad: 12, note: "Focus haut de pec. 45s-1min récup" }),
        ex("db-military-press", 4, 15, { defaultLoad: 14, note: "⚡ Superset avec élévation haut de pec. 45s-1min récup" }),
        ex("high-chest-raise", 4, 15, { defaultLoad: 6, note: "⚡ Superset avec développé militaire" }),
        ex("db-incline-fly", 4, 20, { defaultLoad: 8, perSetReps: [20, 15, 10, 10], note: "⚡ Superset avec squeeze press. 45s-1min récup" }),
        ex("squeeze-press", 4, 20, { defaultLoad: 8, perSetReps: [20, 15, 10, 10], note: "⚡ Superset avec écarté incliné" }),
        ex("skull-crusher", 4, 20, { defaultLoad: 8, note: "45s-1min récup" }),
        ex("dips", 1, 0, { repsLabel: "5 min", note: "Pratiquer dips pendant 5 minutes en continu" }),
      ],
    },
    {
      id: "salle-s2",
      name: "Séance 2 — Pull",
      focus: "Dos, trapèzes, biceps",
      durationMin: 55,
      exercises: [
        ex("pull-up-prona", 1, 0, { repsLabel: "EMOM 10 min", note: "Ou 4 séries tirage vertical 30/20/15/15" }),
        ex("upright-row", 4, 30, { defaultLoad: 30, perSetReps: [30, 20, 20, 15], note: "45s-1min récup" }),
        ex("barbell-shrug", 4, 40, { defaultLoad: 40, perSetReps: [40, 30, 20, 20], note: "⚡ Superset avec oiseau haltères. 45s-1min récup" }),
        ex("rear-delt-fly", 4, 20, { defaultLoad: 4, perSetReps: [20, 20, 15, 15], note: "⚡ Superset avec shrug barre" }),
        ex("band-rear-delt", 4, 20, { note: "⚡ Superset avec rack pulls. Récup active. 45s-1min récup" }),
        ex("rack-pull", 4, 15, { defaultLoad: 40, note: "⚡ Superset avec arrière d'épaule élastique" }),
        ex("hammer-curl", 3, 15, { defaultLoad: 10, note: "45s-1min récup" }),
      ],
    },
    {
      id: "salle-s3",
      name: "Séance 3 — Legs",
      focus: "Quadriceps, ischios, fessiers",
      durationMin: 55,
      exercises: [
        ex("walking-lunge", 4, 40, { defaultLoad: 10, perSetReps: [40, 30, 20, 20], note: "45s-1min récup" }),
        ex("goblet-squat-elevated", 4, 15, { defaultLoad: 16, note: "45s-1min récup" }),
        ex("step-up", 4, 10, { defaultLoad: 10, note: "⚡ Superset avec élévation latérale. 45s-1min récup" }),
        ex("lateral-raise-mid", 4, 20, { defaultLoad: 4, note: "⚡ Superset avec step up. Départ mi-amplitude" }),
        ex("romanian-deadlift-db", 4, 20, { defaultLoad: 14, perSetReps: [20, 20, 15, 15], note: "45s-1min récup" }),
        ex("push-up", 3, 0, { repsLabel: "Max reps", note: "Finisher. 45s-1min récup" }),
      ],
    },
    {
      id: "salle-s4",
      name: "Séance 4 — Upper + Legs",
      focus: "Dips, triceps, tractions, jambes",
      durationMin: 50,
      exercises: [
        ex("dips", 1, 0, { repsLabel: "EMOM 10 min", note: "1 série par minute pendant 10 minutes" }),
        ex("overhead-triceps", 4, 15, { defaultLoad: 10, note: "Debout avec un haltère. 45s-1min récup" }),
        ex("chin-up", 4, 0, { repsLabel: "Max reps", note: "45s-1min récup" }),
        ex("hammer-curl", 3, 15, { defaultLoad: 10, note: "45s-1min récup" }),
        ex("walking-lunge", 3, 30, { defaultLoad: 10, note: "⚡ Superset avec marche du fermier. 45s-1min récup" }),
        ex("farmer-walk", 3, 0, { defaultLoad: 16, repsLabel: "Échec grip", note: "⚡ Superset avec fentes marchées" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Program 3: Salle Débutant (sans dips / sans tractions)
// 5 séances — idéal pour démarrer en salle
// ═══════════════════════════════════════════════════════

const SALLE_DEBUTANT: ProgramTemplate = {
  id: "salle-debutant",
  title: "Salle Débutant",
  subtitle: "5 séances sans dips ni tractions. Pose tes bases en salle.",
  level: "beginner",
  location: "gym",
  image: "/images/salle.jpeg",
  sessions: [
    {
      id: "salle-deb-s1",
      name: "Séance 1 — Upper",
      focus: "Pectoraux, dos, bras",
      durationMin: 50,
      exercises: [
        ex("db-bench-press", 3, 10, { defaultLoad: 12, note: "3 séries 8 à 12 reps. Échec musculaire. Repos 2-3 min" }),
        ex("lat-pulldown", 3, 10, { perSetReps: [8, 10, 12], note: "Reps croissantes, charge décroissante. Repos 2-3 min" }),
        ex("db-flat-fly", 3, 12, { defaultLoad: 8, note: "3 séries 10 à 15 reps. Contrôle la descente. Repos 2-3 min" }),
        ex("face-pull", 3, 13, { defaultLoad: 15, note: "3 séries 12 à 15 reps. Repos 2-3 min" }),
        ex("cable-triceps-ext", 3, 10, { defaultLoad: 15, perSetReps: [9, 11, 13], note: "Reps croissantes. Repos 2-3 min" }),
        ex("cable-curl-bar", 3, 10, { defaultLoad: 15, perSetReps: [9, 11, 13], note: "Reps croissantes. Repos 2-3 min" }),
      ],
    },
    {
      id: "salle-deb-s2",
      name: "Séance 2 — Lower",
      focus: "Jambes",
      durationMin: 50,
      exercises: [
        ex("bulgarian-split-squat", 3, 16, { defaultLoad: 10, note: "16 reps (8 par jambe). +2 reps par semaine, puis augmente la charge. Repos 2-3 min" }),
        ex("romanian-deadlift-db", 3, 10, { defaultLoad: 14, note: "3 séries 8 à 12 reps. Passe à la barre quand tu gères. Repos 2-3 min" }),
        ex("leg-extension", 3, 10, { defaultLoad: 25, perSetReps: [8, 11, 13], note: "Reps croissantes. Repos 2-3 min" }),
        ex("leg-curl", 3, 10, { defaultLoad: 25, perSetReps: [8, 11, 13], note: "Reps croissantes. Repos 2-3 min" }),
        ex("dead-hang", 3, 0, { repsLabel: "Max", note: "Suspension passive à la barre. Prépare tes tractions futures" }),
      ],
    },
    {
      id: "salle-deb-s3",
      name: "Séance 3 — Pull & Push",
      focus: "Dos, épaules, bras, pectoraux",
      durationMin: 55,
      exercises: [
        ex("lat-pulldown-neutral", 3, 10, { defaultLoad: 30, perSetReps: [9, 11, 13], note: "Prise neutre. Reps croissantes. Repos 2-3 min" }),
        ex("db-military-press", 3, 10, { defaultLoad: 12, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("seated-row-close", 3, 10, { defaultLoad: 30, perSetReps: [8, 11, 13], note: "Prise serrée. Reps croissantes. Repos 2-3 min" }),
        ex("chest-press-machine", 3, 10, { defaultLoad: 30, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("lateral-raise-mid", 3, 13, { defaultLoad: 5, note: "3 séries 11 à 15 reps. Repos 2-3 min" }),
        ex("db-curl", 3, 10, { defaultLoad: 8, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("skull-crusher", 3, 10, { defaultLoad: 8, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
      ],
    },
    {
      id: "salle-deb-s4",
      name: "Séance 4 — Full Body",
      focus: "Corps complet",
      durationMin: 55,
      exercises: [
        ex("db-incline-press", 3, 10, { defaultLoad: 12, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("db-row-bent-over", 3, 10, { defaultLoad: 14, note: "Rowing buste penché. Ou à la barre. Repos 2-3 min" }),
        ex("goblet-squat", 3, 10, { defaultLoad: 16, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("hammer-curl", 3, 10, { defaultLoad: 8, note: "3 séries 8 à 12 reps. Repos 2-3 min" }),
        ex("rope-triceps-ext", 3, 10, { defaultLoad: 15, note: "Extension triceps corde. Repos 2-3 min" }),
        ex("pull-up-prona", 1, 0, { repsLabel: "Max reps", note: "Max reps ou suspension passive / négative selon niveau. Repos 2-3 min" }),
      ],
    },
    {
      id: "salle-deb-s5",
      name: "Séance 5 — Dips & Tractions",
      focus: "Transition vers dips et tractions",
      durationMin: 55,
      exercises: [
        ex("negative-pull-up", 3, 0, { repsLabel: "Max", note: "Descente contrôlée jusqu'à l'échec. Avec élastique si besoin. Repos 2-3 min" }),
        ex("dips", 3, 0, { repsLabel: "Max", note: "Assistés sur machine ou négatives si besoin. Repos 2-3 min" }),
        ex("lat-pulldown", 3, 10, { defaultLoad: 30, perSetReps: [9, 11, 13], note: "Supination, assis, poulie basse. Reps croissantes. Repos 2-3 min" }),
        ex("pull-up-prona", 1, 10, { repsLabel: "EMOM 10 min", note: "EMOM : 1 série par minute pendant 10 minutes" }),
        ex("scapular-pull-up", 3, 0, { repsLabel: "Max", note: "3 séries max reps. Repos 2-3 min" }),
        ex("face-pull", 3, 13, { defaultLoad: 15, note: "3 séries 12 à 15 reps. Repos 2-3 min" }),
        ex("pec-deck", 3, 13, { defaultLoad: 30, note: "3 séries 12 à 15 reps. Repos 2-3 min" }),
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════

export const MASS_PROGRAMS: ProgramTemplate[] = [STREET_PARK, SALLE_DEBUTANT, SALLE];
