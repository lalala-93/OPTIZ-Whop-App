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
  { id: "dips", name: "Dips", muscles: "Pectoraux, triceps", videoUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q" },
  { id: "pull-up", name: "Tractions pronation", muscles: "Dos, biceps", videoUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
  { id: "chin-up", name: "Chin Up", muscles: "Dos, biceps", videoUrl: "https://youtube.com/shorts/Oi3bW9nQmGI?si=Ock9i-K6Z11rGZNZ" },
  { id: "db-press", name: "Developpe militaire halteres", muscles: "Epaules, triceps", videoUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
  { id: "db-row", name: "Rowing unilateral haltere", muscles: "Dos, biceps", videoUrl: "https://www.youtube.com/watch?v=qdoquGndifw" },
  { id: "goblet-squat", name: "Goblet squat", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=LuIm4IHyXIk" },
  { id: "bulgarian-split", name: "Fentes bulgares", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=D3-FltbX0-s" },
  { id: "rdl", name: "Romanian deadlift", muscles: "Ischios, fessiers", videoUrl: "https://www.youtube.com/watch?v=MSvRmkiGP4s" },
  { id: "push-up", name: "Pompes", muscles: "Pectoraux, triceps", videoUrl: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF" },
  { id: "lateral-raise", name: "Elevations laterales", muscles: "Epaules", videoUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
  { id: "hammer-curl", name: "Curl marteau", muscles: "Biceps", videoUrl: "https://www.youtube.com/watch?v=XtruE8T-19Q" },
  { id: "triceps-overhead", name: "Extension triceps nuque", muscles: "Triceps", videoUrl: "https://youtube.com/shorts/AsUqyuzZBJA?si=fLbGMC-JQmZ_5xJ8" },
  { id: "crunch", name: "Crunch", muscles: "Abdos", videoUrl: "https://www.youtube.com/watch?v=5ER5Of4MOPI" },
  { id: "lunges", name: "Fentes", muscles: "Quadriceps, fessiers", videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { id: "mountain-climber", name: "Mountain climber", muscles: "Cardio, core", videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM" },
];

const s = (id: string, name: string, focus: string, durationMin: number, exercises: ProgramExerciseTemplate[]): ProgramSessionTemplate => ({
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
      s("gym-beg-s1", "Seance 1 Push", "Pectoraux, epaules, triceps", 55, [e("db-press", 3, 10), e("push-up", 3, 12), e("lateral-raise", 3, 12), e("triceps-overhead", 3, 10)]),
      s("gym-beg-s2", "Seance 2 Pull", "Dos, biceps", 55, [e("db-row", 4, 10), e("hammer-curl", 3, 10), e("lateral-raise", 3, 12), e("crunch", 3, 15)]),
      s("gym-beg-s3", "Seance 3 Legs", "Jambes, gainage", 50, [e("goblet-squat", 4, 10), e("lunges", 3, 10), e("rdl", 3, 10), e("crunch", 3, 15)]),
      s("gym-beg-s4", "Seance 4 Full upper", "Haut du corps complet", 55, [e("db-press", 3, 8), e("db-row", 3, 10), e("hammer-curl", 3, 10), e("triceps-overhead", 3, 10)]),
      s("gym-beg-s5", "Seance 5 Pump", "Bras, epaules, core", 45, [e("lateral-raise", 3, 15), e("hammer-curl", 3, 12), e("triceps-overhead", 3, 12), e("crunch", 4, 15)]),
    ],
  },
  {
    id: "mass-gym-intermediate",
    title: "Intermediaire salle",
    subtitle: "5 seances avec dips et tractions",
    level: "intermediate",
    location: "gym",
    sessions: [
      s("gym-int-s1", "Seance 1 Push", "Force de poussee", 60, [e("dips", 4, 6), e("db-press", 4, 8), e("push-up", 3, 12), e("triceps-overhead", 3, 10)]),
      s("gym-int-s2", "Seance 2 Pull", "Dos et biceps", 60, [e("pull-up", 4, 6), e("db-row", 4, 8), e("chin-up", 3, 6), e("hammer-curl", 3, 10)]),
      s("gym-int-s3", "Seance 3 Legs", "Jambes et gainage", 55, [e("goblet-squat", 4, 10), e("bulgarian-split", 3, 8), e("rdl", 4, 8), e("crunch", 3, 15)]),
      s("gym-int-s4", "Seance 4 Upper", "Densite haut du corps", 55, [e("pull-up", 3, 8), e("dips", 3, 8), e("db-row", 3, 10), e("db-press", 3, 8)]),
      s("gym-int-s5", "Seance 5 Arms", "Bras et epaules", 45, [e("hammer-curl", 4, 10), e("triceps-overhead", 4, 10), e("lateral-raise", 4, 12), e("push-up", 2, 15)]),
    ],
  },
  {
    id: "mass-home-beginner",
    title: "Debutant maison",
    subtitle: "5 seances halteres et chaise romaine",
    level: "beginner",
    location: "home",
    sessions: [
      s("home-beg-s1", "Seance 1 Push", "Pectoraux, epaules", 50, [e("db-press", 4, 10), e("push-up", 3, 12), e("triceps-overhead", 3, 10), e("lateral-raise", 3, 12)]),
      s("home-beg-s2", "Seance 2 Pull", "Dos, biceps", 50, [e("db-row", 4, 10), e("chin-up", 3, 5), e("hammer-curl", 3, 10), e("crunch", 3, 15)]),
      s("home-beg-s3", "Seance 3 Legs", "Bas du corps", 50, [e("goblet-squat", 4, 10), e("bulgarian-split", 3, 8), e("rdl", 3, 10), e("crunch", 3, 15)]),
      s("home-beg-s4", "Seance 4 Full", "Full body", 55, [e("push-up", 3, 12), e("db-row", 3, 10), e("goblet-squat", 3, 10), e("mountain-climber", 3, 20)]),
      s("home-beg-s5", "Seance 5 Bras", "Bras et epaules", 45, [e("hammer-curl", 4, 10), e("triceps-overhead", 4, 10), e("lateral-raise", 3, 12), e("push-up", 2, 15)]),
    ],
  },
  {
    id: "mass-home-intermediate",
    title: "Intermediaire maison",
    subtitle: "4 seances halteres, dips, tractions",
    level: "intermediate",
    location: "home",
    sessions: [
      s("home-int-s1", "Push force", "Pectoraux, epaules, triceps", 55, [e("dips", 4, 6), e("db-press", 4, 8), e("push-up", 3, 12), e("triceps-overhead", 3, 10)]),
      s("home-int-s2", "Pull force", "Dos, biceps", 55, [e("pull-up", 4, 6), e("db-row", 4, 8), e("chin-up", 3, 6), e("hammer-curl", 3, 10)]),
      s("home-int-s3", "Legs", "Jambes et core", 50, [e("goblet-squat", 4, 10), e("bulgarian-split", 4, 8), e("rdl", 4, 8), e("crunch", 3, 15)]),
      s("home-int-s4", "Upper density", "Haut du corps", 55, [e("pull-up", 3, 8), e("dips", 3, 8), e("db-press", 3, 8), e("db-row", 3, 8)]),
    ],
  },
  {
    id: "mass-home-bodyweight",
    title: "0 materiel maison",
    subtitle: "Full body debutant poids du corps",
    level: "beginner",
    location: "bodyweight",
    sessions: [
      s("bw-s1", "Full body A", "Push, legs, core", 40, [e("push-up", 4, 10), e("lunges", 4, 10), e("crunch", 4, 15), e("mountain-climber", 3, 20)]),
      s("bw-s2", "Full body B", "Dos, jambes, core", 40, [e("pull-up", 3, 4), e("goblet-squat", 3, 10), e("crunch", 4, 15), e("mountain-climber", 3, 20)]),
      s("bw-s3", "Conditioning", "Cardio et gainage", 35, [e("mountain-climber", 5, 20), e("push-up", 4, 8), e("lunges", 4, 10), e("crunch", 4, 15)]),
      s("bw-s4", "Full body C", "Progression generale", 40, [e("push-up", 4, 12), e("lunges", 4, 12), e("crunch", 4, 15), e("mountain-climber", 4, 20)]),
    ],
  },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = BASE_LIBRARY;
