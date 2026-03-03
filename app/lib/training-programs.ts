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

const buildSession = (
  programId: string,
  focus: string,
  durationMin: number,
  exerciseList: Array<{ id: string; sets: number; reps: number }>,
): ProgramSessionTemplate => {
  const exercises: ProgramExerciseTemplate[] = exerciseList.map((item) => {
    const base = BASE_LIBRARY.find((exercise) => exercise.id === item.id);
    if (!base) {
      throw new Error(`Missing exercise library item: ${item.id}`);
    }

    return {
      id: `${item.id}-${item.sets}x${item.reps}`,
      name: base.name,
      sets: item.sets,
      reps: item.reps,
      muscles: base.muscles,
      videoUrl: base.videoUrl,
    };
  });

  return {
    id: `${programId}-session`,
    name: "Seance du jour",
    focus,
    durationMin,
    exercises,
  };
};

export const MASS_PROGRAMS: ProgramTemplate[] = [
  {
    id: "gym-beginner",
    title: "Debutant salle",
    subtitle: "Base masse sans dips/tractions",
    level: "beginner",
    location: "gym",
    sessions: [
      buildSession("gym-beginner", "Corps complet", 60, [
        { id: "db-bench-press", sets: 4, reps: 10 },
        { id: "lat-pulldown", sets: 4, reps: 10 },
        { id: "leg-press", sets: 4, reps: 10 },
        { id: "romanian-deadlift", sets: 3, reps: 10 },
        { id: "overhead-press", sets: 3, reps: 10 },
        { id: "triceps-pushdown", sets: 3, reps: 12 },
      ]),
    ],
  },
  {
    id: "gym-intermediate",
    title: "Intermediaire salle",
    subtitle: "Masse avec dips/tractions",
    level: "intermediate",
    location: "gym",
    sessions: [
      buildSession("gym-intermediate", "Corps complet", 65, [
        { id: "dips", sets: 4, reps: 6 },
        { id: "pull-up", sets: 4, reps: 6 },
        { id: "barbell-row", sets: 4, reps: 8 },
        { id: "leg-press", sets: 4, reps: 8 },
        { id: "romanian-deadlift", sets: 4, reps: 8 },
        { id: "overhead-press", sets: 3, reps: 8 },
      ]),
    ],
  },
  {
    id: "home-beginner",
    title: "Debutant maison",
    subtitle: "Halteres + progression traction/dips",
    level: "beginner",
    location: "home",
    sessions: [
      buildSession("home-beginner", "Corps complet", 55, [
        { id: "db-floor-press", sets: 4, reps: 10 },
        { id: "db-row", sets: 4, reps: 10 },
        { id: "goblet-squat", sets: 4, reps: 12 },
        { id: "romanian-deadlift", sets: 3, reps: 10 },
        { id: "negative-pull-up", sets: 3, reps: 5 },
        { id: "scapular-pull-up", sets: 3, reps: 10 },
      ]),
    ],
  },
  {
    id: "home-intermediate",
    title: "Intermediaire maison",
    subtitle: "Dips, tractions, halteres",
    level: "intermediate",
    location: "home",
    sessions: [
      buildSession("home-intermediate", "Corps complet", 60, [
        { id: "dips", sets: 4, reps: 6 },
        { id: "pull-up", sets: 4, reps: 6 },
        { id: "db-floor-press", sets: 4, reps: 8 },
        { id: "db-row", sets: 4, reps: 8 },
        { id: "goblet-squat", sets: 4, reps: 10 },
        { id: "hip-thrust", sets: 3, reps: 10 },
      ]),
    ],
  },
  {
    id: "home-bodyweight",
    title: "Maison sans materiel",
    subtitle: "Full body poids du corps",
    level: "beginner",
    location: "bodyweight",
    sessions: [
      buildSession("home-bodyweight", "Corps complet", 45, [
        { id: "incline-push-up", sets: 4, reps: 12 },
        { id: "bodyweight-squat", sets: 4, reps: 15 },
        { id: "reverse-lunge", sets: 4, reps: 10 },
        { id: "glute-bridge", sets: 3, reps: 15 },
        { id: "scapular-push-up", sets: 3, reps: 12 },
        { id: "crunch", sets: 3, reps: 20 },
      ]),
    ],
  },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = BASE_LIBRARY;
