export interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
    muscleGroups: string;
    videoLink: string;
    notes?: string;
}

export interface WorkoutSession {
    id: string;
    name: string;
    color: string;
    description: string;
    exercises: Exercise[];
}

export const WORKOUT_PROGRAM: WorkoutSession[] = [
    {
        id: "push-1",
        name: "🟥 Push 1",
        color: "#F05030",
        description: "Pecs / Épaules / Triceps - Objectif : force sur les dips + volume épaules et triceps",
        exercises: [
            {
                id: "dips-force",
                name: "Dips (en force)",
                sets: 3,
                reps: "4-8",
                muscleGroups: "Pecs, triceps, épaules avant",
                videoLink: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q",
                notes: "Ajoute du leste si nécessaire",
            },
            {
                id: "dev-militaire",
                name: "Développé militaire (haltères)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Épaules (faisceau antérieur), triceps",
                videoLink: "https://www.youtube.com/watch?v=5pjcqP_nqRA",
            },
            {
                id: "ecarte-couche",
                name: "Écarté couché (haltères)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Pecs",
                videoLink: "https://youtube.com/shorts/tekqcBETXyQ?si=qDHuJiPKkg8skkJx",
            },
            {
                id: "skull-crushers",
                name: "Skull crushers (haltères)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Triceps",
                videoLink: "https://youtube.com/shorts/IfNBr2zw6rw?si=Mpu7DkQ3HPq15qQf",
            },
            {
                id: "pompes-amrap",
                name: "Pompes AMRAP",
                sets: 2,
                reps: "Max",
                muscleGroups: "Pecs, triceps, gainage",
                videoLink: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF",
                notes: "Max reps (AMRAP)",
            },
        ],
    },
    {
        id: "pull-1",
        name: "🟦 Pull 1",
        color: "#3B82F6",
        description: "Dos / Biceps / Épaules - Objectif : tractions lourdes + bras/dos",
        exercises: [
            {
                id: "traction-pro",
                name: "Traction pronation (en force)",
                sets: 3,
                reps: "4-8",
                muscleGroups: "Grand dorsal, trapèzes, biceps",
                videoLink: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ",
            },
            {
                id: "elev-lat",
                name: "Élévations latérales (haltères)",
                sets: 3,
                reps: "10-15",
                muscleGroups: "Épaules (faisceau moyen)",
                videoLink: "https://www.youtube.com/watch?v=67aqcWUYw2I",
            },
            {
                id: "rowing-bucheron",
                name: "Rowing unilatéral 'bucheron'",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Dos, biceps",
                videoLink: "https://www.youtube.com/watch?v=67aqcWUYw2I",
                notes: "3 séries / bras",
            },
            {
                id: "chin-up",
                name: "Chin Up (supination)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Biceps, dorsaux",
                videoLink: "https://youtube.com/shorts/Oi3bW9nQmGI?si=Ock9i-K6Z11rGZNZ",
            },
            {
                id: "curl-marteau",
                name: "Curl marteau (haltères)",
                sets: 3,
                reps: "10-15",
                muscleGroups: "Biceps, avant-bras",
                videoLink: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0",
            },
        ],
    },
    {
        id: "legs-1",
        name: "🟩 Legs",
        color: "#22C55E",
        description: "Renforcement global des jambes + fessiers + gainage",
        exercises: [
            {
                id: "goblet-squat",
                name: "Goblet Squat (haltère)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Quadriceps, fessiers, gainage",
                videoLink: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0",
            },
            {
                id: "fentes-bul",
                name: "Fentes bulgares (haltères)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Quadriceps, fessiers",
                videoLink: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0",
                notes: "3 séries / jambe",
            },
            {
                id: "rdl",
                name: "Romanian Deadlift (tempo lent)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Ischios, fessiers, bas du dos",
                videoLink: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0",
                notes: "Haltères, tempo lent",
            },
            {
                id: "hip-thrust-uni",
                name: "Hip Thrust unilatéral au sol",
                sets: 3,
                reps: "10-15",
                muscleGroups: "Fessiers",
                videoLink: "https://www.youtube.com/watch?v=zGxR8AmuOm4",
                notes: "3 séries / jambe",
            },
            {
                id: "chaise-mur",
                name: "Chaise contre un mur",
                sets: 1,
                reps: "Max",
                muscleGroups: "Quadriceps, gainage isométrique",
                videoLink: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx",
                notes: "Max hold",
            },
        ],
    },
    {
        id: "upper-1",
        name: "🟪 Upper",
        color: "#A855F7",
        description: "Rappel global haut du corps avec focus poussée/tirage",
        exercises: [
            {
                id: "dev-couche-sol",
                name: "Développé couché au sol (haltères)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Pecs, triceps, épaules avant",
                videoLink: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx",
            },
            {
                id: "traction-vol",
                name: "Tractions pronation (volume)",
                sets: 3,
                reps: "8-12",
                muscleGroups: "Grand dorsal, trapèzes, biceps",
                videoLink: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ",
            },
            {
                id: "dips-emom",
                name: "Dips – EMOM 10 mins",
                sets: 10,
                reps: "6",
                muscleGroups: "Pecs, triceps, épaules",
                videoLink: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ",
                notes: "Every Minute On the Minute. Ajuste tes reps si besoin.",
            },
            {
                id: "ext-tri-nuque",
                name: "Extension triceps (nuque)",
                sets: 3,
                reps: "10-15",
                muscleGroups: "Triceps",
                videoLink: "https://youtube.com/shorts/AsUqyuzZBJA?si=WiiIfLjgyhaQmtmV",
            },
            {
                id: "curl-bi",
                name: "Curl biceps (haltères)",
                sets: 3,
                reps: "10-15",
                muscleGroups: "Biceps",
                videoLink: "https://youtu.be/MzNKcgL1lVU?si=WL4TYfS_a1BvMY2Q",
            },
            {
                id: "dead-hang",
                name: "Dead Hang",
                sets: 3,
                reps: "Max",
                muscleGroups: "Grip, avant-bras, épaules, gainage passif",
                videoLink: "https://www.youtube.com/shorts/dombLZaQIz0",
                notes: "Suspends-toi le plus longtemps possible.",
            },
        ],
    },
];
