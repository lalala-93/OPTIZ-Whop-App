/**
 * Native exercise video sources hosted on Supabase Storage (public bucket).
 *
 * Coverage: 38 exercices Hakim + 1 vidéo d'échauffement (warmup-full).
 * Format: 720p H.264, CRF 30, AAC mono 64k, +faststart (mp4 simple — pas de HLS).
 * Tailles moyennes : ~460 KB / vidéo, posters ~45 KB.
 *
 * Les exercices non listés ici tomberont en fallback sur leur `videoUrl`
 * YouTube (déjà présent dans `training-programs.ts`).
 */

const BASE =
  "https://ywektjcahxrgvjutmfsa.supabase.co/storage/v1/object/public/exercise-videos";

export type ExerciseVideo = {
  /** Vidéo MP4 720p, +faststart, boucle-friendly */
  src: string;
  /** Poster JPEG 720w, frame à t=1s */
  poster: string;
};

/**
 * Map exerciseId → ressources vidéo natives.
 * Les clés correspondent aux IDs utilisés dans `training-programs.ts`.
 */
export const EXERCISE_VIDEOS: Record<string, ExerciseVideo> = Object.fromEntries(
  [
    "australian-row",
    "band-reverse-fly",
    "bb-curl",
    "bb-incline-press",
    "bb-shrug",
    "bb-supinated-row",
    "bench-triceps-ext",
    "bulgarian-split-squat",
    "bw-sumo-squat",
    "chest-raise",
    "crunch-controlled",
    "db-curl",
    "db-incline-fly",
    "db-incline-press",
    "db-incline-row",
    "db-pullover",
    "farmer-walk",
    "front-plank",
    "full-squat",
    "goblet-squat-bb",
    "hammer-curl",
    "hanging-leg-raise",
    "high-pull",
    "incline-center-press",
    "jump-rope",
    "lateral-raise-full",
    "lymphatic-hops",
    "mid-up-raise",
    "power-clean-push-press",
    "pull-up",
    "push-up-knees",
    "romanian-deadlift-db",
    "sit-squats",
    "static-lunge",
    "step-up",
    "trap-bar-deadlift",
    "walking-lunge",
    "wall-sit",
    "warmup-full",
  ].map((id) => [
    id,
    {
      src: `${BASE}/videos/${id}.mp4`,
      poster: `${BASE}/posters/${id}.jpg`,
    } satisfies ExerciseVideo,
  ]),
);

/** Renvoie la vidéo native si dispo, sinon `null` (utiliser le fallback YouTube). */
export function getExerciseVideo(exerciseId: string): ExerciseVideo | null {
  return EXERCISE_VIDEOS[exerciseId] ?? null;
}

/** True si l'exercice a une vidéo native (utile pour conditionner l'UI). */
export function hasNativeVideo(exerciseId: string): boolean {
  return exerciseId in EXERCISE_VIDEOS;
}
