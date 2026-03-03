export interface ProgramExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: number;
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
  location: "gym" | "home" | "bodyweight";
  sessions: ProgramSessionTemplate[];
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscles: string;
  videoUrl: string;
}

const BASE_LIBRARY: ExerciseLibraryItem[] = [
  { id: "db-bench-press", name: "Developpe couche halteres", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=VmB1G1K7v94" },
  { id: "db-incline-press", name: "Developpe incline halteres", muscles: "Pectoraux superieurs, triceps", videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
  { id: "db-floor-press", name: "Developpe couche au sol", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=uUGDRwge4F8" },
  { id: "machine-chest-press", name: "Chest press machine", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=sqNwDkUU_Ps" },
  { id: "pec-deck", name: "Pec deck", muscles: "Pectoraux", videoUrl: "https://www.youtube.com/watch?v=QENKPHhQVi4" },
  { id: "overhead-press", name: "Developpe militaire", muscles: "Epaules, triceps", videoUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
  { id: "lateral-raise", name: "Elevations laterales", muscles: "Epaules", videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id: "rear-delt-fly", name: "Oiseau halteres", muscles: "Arriere d'epaules", videoUrl: "https://www.youtube.com/watch?v=EA7u4Q_8HQ0" },
  { id: "triceps-pushdown", name: "Extension triceps poulie", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU" },
  { id: "skull-crusher", name: "Skull crusher halteres", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=d_KZxkY_0cM" },
  { id: "overhead-triceps", name: "Extension triceps nuque", muscles: "Triceps", videoUrl: "https://www.youtube.com/watch?v=_gsUck-7M74" },

  { id: "lat-pulldown", name: "Tirage vertical", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc" },
  { id: "barbell-row", name: "Rowing barre", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=vT2GjY_Umpw" },
  { id: "db-row", name: "Rowing unilateral haltere", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8" },
  { id: "face-pull", name: "Face pull", muscles: "Arriere d'epaules, haut du dos", videoUrl: "https://www.youtube.com/watch?v=rep-qVOkqgk" },
  { id: "pull-up", name: "Tractions pronation", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id: "chin-up", name: "Tractions supination", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=brhRXlOhsAM" },
  { id: "negative-pull-up", name: "Tractions negatives", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=gbPURTSxQLY" },
  { id: "scapular-pull-up", name: "Tractions scapulaires", muscles: "Ceinture scapulaire, dos", videoUrl: "https://www.youtube.com/watch?v=AK8Lr8f0fUk" },
  { id: "hammer-curl", name: "Curl marteau", muscles: "Biceps, avant-bras", videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4" },
  { id: "incline-curl", name: "Curl incline assis", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=soxrZlIl35U" },
  { id: "cable-curl", name: "Curl poulie basse", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=NFzTWp2qpiE" },

  { id: "leg-press", name: "Presse a jambes", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ" },
  { id: "goblet-squat", name: "Goblet squat", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=6xwGFn-J_Qg" },
  { id: "bodyweight-squat", name: "Squat poids du corps", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U" },
  { id: "bulgarian-split-squat", name: "Fentes bulgares", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
  { id: "reverse-lunge", name: "Fentes arriere", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { id: "romanian-deadlift", name: "Souleve de terre roumain", muscles: "Ischios, fessiers", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" },
  { id: "leg-extension", name: "Leg extension", muscles: "Quadriceps", videoUrl: "https://www.youtube.com/watch?v=YyvSfVjQeL0" },
  { id: "leg-curl", name: "Leg curl", muscles: "Ischios", videoUrl: "https://www.youtube.com/watch?v=1Tq3QdYUuHs" },
  { id: "hip-thrust", name: "Hip thrust", muscles: "Fessiers", videoUrl: "https://www.youtube.com/watch?v=SEdqd1n0cvg" },
  { id: "glute-bridge", name: "Glute bridge", muscles: "Fessiers, ischios", videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8" },
  { id: "calf-raise", name: "Mollets debout", muscles: "Mollets", videoUrl: "https://www.youtube.com/watch?v=-M4-G8p8fmc" },

  { id: "dips", name: "Dips", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As" },
  { id: "negative-dips", name: "Dips negatifs", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=4sA0fR2v6i0" },
  { id: "push-up", name: "Pompes", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { id: "incline-push-up", name: "Pompes inclinees", muscles: "Pectoraux, triceps", videoUrl: "https://www.youtube.com/watch?v=cfns5VDVVvk" },
  { id: "scapular-push-up", name: "Pompes scapulaires", muscles: "Ceinture scapulaire", videoUrl: "https://www.youtube.com/watch?v=9eOfgPrQ6xA" },
  { id: "crunch", name: "Crunch", muscles: "Abdominaux", videoUrl: "https://www.youtube.com/watch?v=Xyd_fa5zoEU" },
  { id: "knee-raise", name: "Releve de genoux", muscles: "Abdominaux, gainage", videoUrl: "https://www.youtube.com/watch?v=JB2oyawG9KI" },
];

const s = (
  id: string,
  name: string,
  focus: string,
  durationMin: number,
  exercises: ProgramExerciseTemplate[],
): ProgramSessionTemplate => ({
  id,
  name,
  focus,
  durationMin,
  exercises,
});

const e = (id: string, sets: number, reps: number): ProgramExerciseTemplate => {
  const base = BASE_LIBRARY.find((item) => item.id === id);
  if (!base) {
    throw new Error(`Missing exercise library item: ${id}`);
  }

  return {
    id: `${id}-${sets}x${reps}`,
    name: base.name,
    sets,
    reps,
    muscles: base.muscles,
    videoUrl: base.videoUrl,
  };
};

export const MASS_PROGRAMS: ProgramTemplate[] = [
  {
    id: "mass-gym-beginner",
    title: "Debutant salle",
    subtitle: "5 seances sans dips ni tractions",
    level: "beginner",
    location: "gym",
    sessions: [
      s("gym-beg-s1", "Push base", "Pectoraux, epaules, triceps", 55, [
        e("db-bench-press", 4, 10),
        e("db-incline-press", 3, 10),
        e("pec-deck", 3, 12),
        e("triceps-pushdown", 3, 12),
        e("lateral-raise", 3, 15),
      ]),
      s("gym-beg-s2", "Jambes base", "Quadriceps, fessiers, ischios", 55, [
        e("leg-press", 4, 10),
        e("romanian-deadlift", 3, 10),
        e("leg-extension", 3, 12),
        e("leg-curl", 3, 12),
        e("calf-raise", 3, 15),
      ]),
      s("gym-beg-s3", "Pull base", "Dos, biceps, arriere d'epaules", 55, [
        e("lat-pulldown", 4, 10),
        e("db-row", 3, 10),
        e("face-pull", 3, 15),
        e("cable-curl", 3, 12),
        e("rear-delt-fly", 3, 12),
      ]),
      s("gym-beg-s4", "Full body", "Corps complet", 55, [
        e("goblet-squat", 4, 10),
        e("machine-chest-press", 3, 10),
        e("lat-pulldown", 3, 10),
        e("hip-thrust", 3, 10),
        e("crunch", 3, 15),
      ]),
      s("gym-beg-s5", "Preparation dips traction", "Grip, epaules, bras", 50, [
        e("negative-pull-up", 3, 5),
        e("scapular-pull-up", 3, 10),
        e("push-up", 3, 12),
        e("overhead-press", 3, 10),
        e("hammer-curl", 3, 12),
      ]),
    ],
  },
  {
    id: "mass-gym-intermediate",
    title: "Intermediaire salle",
    subtitle: "5 seances avec dips et tractions",
    level: "intermediate",
    location: "gym",
    sessions: [
      s("gym-int-s1", "Push force", "Force de poussee", 60, [
        e("dips", 4, 6),
        e("db-bench-press", 4, 8),
        e("overhead-press", 3, 8),
        e("skull-crusher", 3, 10),
        e("lateral-raise", 3, 12),
      ]),
      s("gym-int-s2", "Pull force", "Force de tirage", 60, [
        e("pull-up", 4, 6),
        e("barbell-row", 4, 8),
        e("chin-up", 3, 6),
        e("hammer-curl", 3, 10),
        e("face-pull", 3, 15),
      ]),
      s("gym-int-s3", "Jambes force", "Jambes et chaine posterieure", 55, [
        e("leg-press", 4, 8),
        e("bulgarian-split-squat", 3, 8),
        e("romanian-deadlift", 4, 8),
        e("leg-curl", 3, 10),
        e("calf-raise", 3, 15),
      ]),
      s("gym-int-s4", "Upper volume", "Volume haut du corps", 55, [
        e("db-incline-press", 3, 10),
        e("lat-pulldown", 3, 10),
        e("db-row", 3, 10),
        e("cable-curl", 3, 12),
        e("triceps-pushdown", 3, 12),
      ]),
      s("gym-int-s5", "Focus dips tractions", "Performance dips et tractions", 50, [
        e("dips", 5, 5),
        e("pull-up", 5, 5),
        e("push-up", 3, 15),
        e("scapular-pull-up", 3, 10),
        e("knee-raise", 3, 12),
      ]),
    ],
  },
  {
    id: "mass-home-beginner",
    title: "Debutant maison",
    subtitle: "5 seances halteres + progression traction/dips",
    level: "beginner",
    location: "home",
    sessions: [
      s("home-beg-s1", "Upper debutant", "Pectoraux, dos, bras", 50, [
        e("db-floor-press", 4, 10),
        e("db-row", 4, 10),
        e("overhead-press", 3, 10),
        e("hammer-curl", 3, 12),
        e("overhead-triceps", 3, 12),
      ]),
      s("home-beg-s2", "Lower + core", "Jambes, fessiers, gainage", 50, [
        e("goblet-squat", 4, 12),
        e("reverse-lunge", 3, 10),
        e("romanian-deadlift", 3, 10),
        e("glute-bridge", 3, 15),
        e("crunch", 3, 15),
      ]),
      s("home-beg-s3", "Preparation traction", "Dos, grip, epaules", 45, [
        e("negative-pull-up", 4, 5),
        e("scapular-pull-up", 3, 10),
        e("incline-push-up", 4, 12),
        e("rear-delt-fly", 3, 12),
        e("hammer-curl", 3, 12),
      ]),
      s("home-beg-s4", "Full body", "Corps complet", 50, [
        e("goblet-squat", 3, 12),
        e("db-floor-press", 3, 10),
        e("db-row", 3, 10),
        e("overhead-triceps", 3, 12),
        e("crunch", 3, 20),
      ]),
      s("home-beg-s5", "Epaules bras", "Epaules et bras", 45, [
        e("overhead-press", 4, 8),
        e("lateral-raise", 4, 12),
        e("incline-curl", 3, 12),
        e("skull-crusher", 3, 12),
        e("push-up", 3, 12),
      ]),
    ],
  },
  {
    id: "mass-home-intermediate",
    title: "Intermediaire maison",
    subtitle: "4 seances halteres, dips, tractions",
    level: "intermediate",
    location: "home",
    sessions: [
      s("home-int-s1", "Push strength", "Pectoraux, epaules, triceps", 55, [
        e("dips", 4, 6),
        e("db-floor-press", 4, 8),
        e("overhead-press", 3, 8),
        e("lateral-raise", 3, 12),
        e("skull-crusher", 3, 10),
      ]),
      s("home-int-s2", "Pull strength", "Dos, biceps", 55, [
        e("pull-up", 4, 6),
        e("db-row", 4, 8),
        e("chin-up", 3, 6),
        e("hammer-curl", 3, 10),
        e("rear-delt-fly", 3, 12),
      ]),
      s("home-int-s3", "Legs and core", "Jambes, fessiers, core", 50, [
        e("goblet-squat", 4, 10),
        e("bulgarian-split-squat", 4, 8),
        e("romanian-deadlift", 4, 8),
        e("hip-thrust", 3, 10),
        e("crunch", 4, 15),
      ]),
      s("home-int-s4", "Upper density", "Densite haut du corps", 55, [
        e("dips", 3, 8),
        e("pull-up", 3, 8),
        e("db-floor-press", 3, 10),
        e("db-row", 3, 10),
        e("overhead-triceps", 3, 12),
      ]),
    ],
  },
  {
    id: "mass-home-bodyweight",
    title: "0 materiel maison",
    subtitle: "Full body debutant poids du corps",
    level: "beginner",
    location: "bodyweight",
    sessions: [
      s("bw-s1", "Full body A", "Push, jambes, core", 35, [
        e("incline-push-up", 4, 10),
        e("bodyweight-squat", 4, 15),
        e("reverse-lunge", 3, 10),
        e("glute-bridge", 3, 15),
        e("crunch", 3, 20),
      ]),
      s("bw-s2", "Full body B", "Push, jambes, gainage", 35, [
        e("push-up", 4, 8),
        e("bodyweight-squat", 4, 15),
        e("scapular-push-up", 3, 12),
        e("reverse-lunge", 3, 12),
        e("knee-raise", 3, 12),
      ]),
      s("bw-s3", "Legs core", "Jambes et gainage", 35, [
        e("bodyweight-squat", 5, 15),
        e("reverse-lunge", 4, 10),
        e("glute-bridge", 4, 15),
        e("crunch", 4, 20),
        e("knee-raise", 3, 12),
      ]),
      s("bw-s4", "Full body C", "Progression generale", 35, [
        e("push-up", 4, 10),
        e("bodyweight-squat", 4, 20),
        e("scapular-push-up", 3, 12),
        e("reverse-lunge", 3, 12),
        e("crunch", 3, 20),
      ]),
    ],
  },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = BASE_LIBRARY;
