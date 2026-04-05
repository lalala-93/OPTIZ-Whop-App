// ═══════════════════════════════════════════════
// OPTIZ Rank System — 4 Tiers, 20 Levels
// ═══════════════════════════════════════════════

export interface RankTier {
    name: string;
    minLevel: number;
    maxLevel: number;
    color: string;
    colorLight: string;
    gradient: [string, string];
    glowColor: string;
    ringBg: string;
}

export const RANK_TIERS: RankTier[] = [
    { name: "Recruit", minLevel: 1, maxLevel: 5, color: "#7F1D1D", colorLight: "#991B1B", gradient: ["#450A0A", "#991B1B"], glowColor: "rgba(127,29,29,0.3)", ringBg: "rgba(127,29,29,0.12)" },
    { name: "Soldier", minLevel: 6, maxLevel: 10, color: "#DC2626", colorLight: "#FF5252", gradient: ["#7F1D1D", "#DC2626"], glowColor: "rgba(220,38,38,0.3)", ringBg: "rgba(220,38,38,0.15)" },
    { name: "Veteran", minLevel: 11, maxLevel: 15, color: "#E80000", colorLight: "#FF5252", gradient: ["#991B1B", "#FF5252"], glowColor: "rgba(232,0,0,0.4)", ringBg: "rgba(232,0,0,0.2)" },
    { name: "Prestige", minLevel: 16, maxLevel: 999, color: "#FF5252", colorLight: "#FFD700", gradient: ["#E80000", "#FFD700"], glowColor: "rgba(255,82,82,0.4)", ringBg: "rgba(255,82,82,0.2)" },
];

// Map tier internal name → i18n key
export function getRankNameKey(tierName: string): string {
    const map: Record<string, string> = {
        Recruit: "rankRecruit",
        Soldier: "rankSoldier",
        Veteran: "rankVeteran",
        Prestige: "rankPrestige",
    };
    return map[tierName] ?? "rankRecruit";
}

// ── XP Calculation ── (uncapped — users can go beyond level 20)
export function getXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.12, level - 1));
}

export function getLevelProgress(totalXp: number) {
    let level = 1;
    let remaining = totalXp;

    while (true) {
        const needed = getXpForLevel(level);
        if (remaining < needed) {
            return {
                level,
                currentLevelXp: remaining,
                xpForNextLevel: needed,
                progressPercent: Math.min((remaining / needed) * 100, 100),
                totalXp,
            };
        }
        remaining -= needed;
        level++;
    }
}

// ── Rank Lookup ──
export function getRankForLevel(level: number) {
    const tier = RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel)
        || RANK_TIERS[RANK_TIERS.length - 1];
    return {
        tier,
        fullName: tier.name,
    };
}

// ── Types ──
export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Exercise {
    name: string;
    sets: string;
    muscles: string;
    youtubeUrl: string;
}

export interface ChallengeTask {
    id: string;
    name: string;
    emoji: string;
    xpReward: number;
    completed: boolean;
    rounds?: number;
    exercises?: Exercise[];
    youtubeUrl?: string;
    color?: string;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    emoji: string;
    difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
    durationDays: number;
    participantCount: number;
    taskCount: number;
    totalXp: number;
    tasks: ChallengeTask[];
    joined: boolean;
}

// ── Task Descriptions (for TaskInfoModal) ──
export const TASK_DESCRIPTIONS: Record<string, { benefit: string; tips: string }> = {
    "push1": { benefit: "Développe la force de poussée. Cible les pectoraux, épaules et triceps.", tips: "Contrôle chaque rep. En RIR1 (1 rep en réserve)." },
    "pull1": { benefit: "Renforce le dos et les biceps. Développe le V-shape et le grip.", tips: "Tire vers la poitrine pour les tractions. Contracte bien le dos en haut." },
    "legs1": { benefit: "Renforcement global des jambes, fessiers et gainage.", tips: "Garde le dos droit. Descends le plus bas possible en squat." },
    "upper1": { benefit: "Rappel global haut du corps avec focus poussée/tirage.", tips: "Maintiens le même nombre de reps dans les EMOM. Note tes temps de Dead Hang." },
};

// ── Stable number formatting (avoids hydration mismatch) ──
export function formatNumber(n: number): string {
    if (n < 1000) return String(n);
    const parts: string[] = [];
    let remaining = n;
    while (remaining >= 1000) {
        parts.unshift(String(remaining % 1000).padStart(3, "0"));
        remaining = Math.floor(remaining / 1000);
    }
    parts.unshift(String(remaining));
    return parts.join(",");
}

// ── Mock Data ──
export const MOTIVATIONAL_QUOTES = [
    { text: "Le seul mauvais entraînement, c'est celui que tu n'as pas fait.", author: "OPTIZ" },
    { text: "La discipline, c'est choisir entre ce que tu veux maintenant et ce que tu veux vraiment.", author: "Abraham Lincoln" },
    { text: "1% meilleur chaque jour.", author: "OPTIZ" },
    { text: "Les champions se construisent quand personne ne regarde.", author: "OPTIZ" },
    { text: "Ton corps peut encaisser presque tout. C'est ton mental qu'il faut convaincre.", author: "OPTIZ" },
    { text: "Sois plus fort que tes excuses.", author: "OPTIZ" },
    { text: "La douleur d'aujourd'hui sera ta force de demain.", author: "OPTIZ" },
    { text: "N'arrête pas quand t'es fatigué. Arrête quand t'as fini.", author: "OPTIZ" },
];

export const OPTIZ_MAX_CHALLENGE: Challenge = {
    id: "optiz-max",
    title: "OPTIZ Max",
    description: "4 fixed EMOM workouts for daily execution.",
    longDescription: "Each workout follows strict EMOM logic: 1 minute = 1 exercise. One series is the full pack of exercises. Repeat the pack for the prescribed number of series, then validate and earn XP.",
    emoji: "",
    difficulty: "Hard",
    durationDays: 30,
    participantCount: 847,
    taskCount: 4,
    totalXp: 400,
    joined: false,
    tasks: [
        {
            id: "push1",
            name: "Push Strength",
            emoji: "",
            xpReward: 100,
            completed: false,
            rounds: 4,
            color: "#E80000",
            exercises: [
                { name: "Dips lourds", sets: "6 reps", muscles: "Pectoraux, triceps, épaules", youtubeUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q" },
                { name: "Développé militaire haltères", sets: "8 reps", muscles: "Épaules, triceps", youtubeUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
                { name: "Écarté couché haltères", sets: "10 reps", muscles: "Pectoraux", youtubeUrl: "https://youtube.com/shorts/tekqcBETXyQ?si=qDHuJiPKkg8skkJx" },
                { name: "Skull crushers haltères", sets: "10 reps", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/IfNBr2zw6rw?si=Mpu7DkQ3HPq15qQf" },
                { name: "Pompes", sets: "12 reps", muscles: "Pectoraux, triceps, gainage", youtubeUrl: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF" },
            ],
        },
        {
            id: "pull1",
            name: "Pull Strength",
            emoji: "",
            xpReward: 100,
            completed: false,
            rounds: 4,
            color: "#C62828",
            exercises: [
                { name: "Tractions pronation", sets: "6 reps", muscles: "Dos, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Rowing unilatéral haltère", sets: "8 reps", muscles: "Dos, biceps", youtubeUrl: "https://www.youtube.com/watch?v=qdoquGndifw" },
                { name: "Chin Up", sets: "6 reps", muscles: "Biceps, dorsaux", youtubeUrl: "https://youtube.com/shorts/Oi3bW9nQmGI?si=Ock9i-K6Z11rGZNZ" },
                { name: "Élévations latérales", sets: "12 reps", muscles: "Épaules", youtubeUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
                { name: "Curl marteau", sets: "10 reps", muscles: "Biceps, avant-bras", youtubeUrl: "https://www.youtube.com/watch?v=XtruE8T-19Q" },
            ],
        },
        {
            id: "legs1",
            name: "Legs & Core",
            emoji: "",
            xpReward: 100,
            completed: false,
            rounds: 4,
            color: "#A61B1B",
            exercises: [
                { name: "Goblet Squat", sets: "10 reps", muscles: "Quadriceps, gainage", youtubeUrl: "https://www.youtube.com/watch?v=LuIm4IHyXIk" },
                { name: "Fentes bulgares", sets: "8 reps", muscles: "Quadriceps, fessiers", youtubeUrl: "https://www.youtube.com/watch?v=D3-FltbX0-s" },
                { name: "Romanian Deadlift haltères", sets: "10 reps", muscles: "Ischios, fessiers", youtubeUrl: "https://www.youtube.com/watch?v=MSvRmkiGP4s" },
                { name: "Hip Thrust unilatéral", sets: "10 reps", muscles: "Fessiers, ischios", youtubeUrl: "https://www.youtube.com/watch?v=zGxR8AmuOm4" },
                { name: "Relevé de genoux suspendu", sets: "10 reps", muscles: "Abdos, gainage", youtubeUrl: "https://youtube.com/shorts/qPXgrgUrIsg?si=8QIQKuoAU1rSp_la" },
            ],
        },
        {
            id: "upper1",
            name: "Upper Density",
            emoji: "",
            xpReward: 100,
            completed: false,
            rounds: 3,
            color: "#7F1D1D",
            exercises: [
                { name: "Tractions pronation", sets: "8 reps", muscles: "Dos, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Dips", sets: "8 reps", muscles: "Pectoraux, triceps", youtubeUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=67g_BXKXxYrNOBjs" },
                { name: "Extension triceps nuque", sets: "10 reps", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/AsUqyuzZBJA?si=fLbGMC-JQmZ_5xJ8" },
                { name: "Curl biceps haltères", sets: "10 reps", muscles: "Biceps", youtubeUrl: "https://www.youtube.com/watch?v=MzNKcgL1lVU" },
                { name: "Tractions scapulaires", sets: "8 reps", muscles: "Grip, épaules", youtubeUrl: "https://www.youtube.com/shorts/dombLZaQIz0" },
            ],
        },
    ],
};


