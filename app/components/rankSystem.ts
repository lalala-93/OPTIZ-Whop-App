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
    { name: "Initiate", minLevel: 1, maxLevel: 5, color: "#9CA3AF", colorLight: "#E5E7EB", gradient: ["#374151", "#9CA3AF"], glowColor: "rgba(156,163,175,0.3)", ringBg: "rgba(156,163,175,0.15)" },
    { name: "Grinder", minLevel: 6, maxLevel: 10, color: "#D97706", colorLight: "#FBBF24", gradient: ["#92400E", "#FBBF24"], glowColor: "rgba(217,119,6,0.3)", ringBg: "rgba(217,119,6,0.15)" },
    { name: "Elite", minLevel: 11, maxLevel: 15, color: "#E80000", colorLight: "#FF5252", gradient: ["#7F1D1D", "#FF5252"], glowColor: "rgba(232,0,0,0.4)", ringBg: "rgba(232,0,0,0.2)" },
    { name: "Apex", minLevel: 16, maxLevel: 999, color: "#FFD700", colorLight: "#FEF08A", gradient: ["#B45309", "#FEF08A"], glowColor: "rgba(255,215,0,0.5)", ringBg: "rgba(255,215,0,0.25)" },
];

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
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
    { text: "Be stronger than your excuses.", author: "Unknown" },
    { text: "1% better every day.", author: "OPTIZ" },
    { text: "Champions are made when nobody's watching.", author: "Unknown" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
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
                { name: "Dips (force)", sets: "6-8 reps", muscles: "Pectoraux, triceps, épaules", youtubeUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q" },
                { name: "Développé militaire haltères", sets: "8 reps", muscles: "Épaules, triceps", youtubeUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
                { name: "Écarté couché haltères", sets: "10 reps", muscles: "Pectoraux", youtubeUrl: "https://youtube.com/shorts/tekqcBETXyQ?si=qDHuJiPKkg8skkJx" },
                { name: "Skull crushers haltères", sets: "10 reps", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/IfNBr2zw6rw?si=Mpu7DkQ3HPq15qQf" },
                { name: "Pompes", sets: "AMRAP 40s", muscles: "Pectoraux, triceps, gainage", youtubeUrl: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF" },
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
                { name: "Tractions pronation", sets: "4-8 reps", muscles: "Dos, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Rowing unilatéral haltère", sets: "8 reps / bras", muscles: "Dos, biceps", youtubeUrl: "https://www.youtube.com/watch?v=qdoquGndifw" },
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
                { name: "Fentes bulgares", sets: "8 reps / jambe", muscles: "Quadriceps, fessiers", youtubeUrl: "https://www.youtube.com/watch?v=D3-FltbX0-s" },
                { name: "Romanian Deadlift haltères", sets: "10 reps", muscles: "Ischios, fessiers", youtubeUrl: "https://www.youtube.com/watch?v=MSvRmkiGP4s" },
                { name: "Hip Thrust unilatéral", sets: "10 reps / jambe", muscles: "Fessiers, ischios", youtubeUrl: "https://www.youtube.com/watch?v=zGxR8AmuOm4" },
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
                { name: "Dead Hang", sets: "35-45 sec", muscles: "Grip, épaules", youtubeUrl: "https://www.youtube.com/shorts/dombLZaQIz0" },
            ],
        },
    ],
};

export const MOCK_LEADERBOARD = [
    { rank: 1, name: "Alex F.", xp: 12500, level: 18, emoji: "" },
    { rank: 2, name: "Sarah M.", xp: 11200, level: 16, emoji: "" },
    { rank: 3, name: "John D.", xp: 8400, level: 13, emoji: "" },
    { rank: 4, name: "Emma L.", xp: 6200, level: 10, emoji: "" },
    { rank: 5, name: "Mike R.", xp: 5100, level: 9, emoji: "" },
    { rank: 6, name: "Lisa K.", xp: 4300, level: 8, emoji: "" },
    { rank: 7, name: "Tom B.", xp: 3800, level: 7, emoji: "" },
    { rank: 8, name: "Nina W.", xp: 2900, level: 6, emoji: "" },
];
