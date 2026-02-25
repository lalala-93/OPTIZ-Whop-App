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
    description: "4 structured workouts focused on strength, control, and progression.",
    longDescription: "Train with a 4-session split: Push, Pull, Legs, Upper. Each workout is designed for daily repeatability with clear set and rep targets. Complete one workout per day, stack XP, and return tomorrow for a fresh reset.",
    emoji: "🏋️",
    difficulty: "Hard",
    durationDays: 30,
    participantCount: 847,
    taskCount: 4,
    totalXp: 200,
    joined: false,
    tasks: [
        {
            id: "push1",
            name: "🟥 Push I — Chest / Shoulders / Triceps",
            emoji: "🟥",
            xpReward: 50,
            completed: false,
            color: "#E80000",
            exercises: [
                { name: "Weighted Dips", sets: "4 × 6-8", muscles: "Chest, triceps, front delts", youtubeUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q" },
                { name: "Dumbbell Shoulder Press", sets: "4 × 8-10", muscles: "Shoulders, triceps", youtubeUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
                { name: "Dumbbell Fly Press", sets: "3 × 10-12", muscles: "Chest", youtubeUrl: "https://youtube.com/shorts/tekqcBETXyQ?si=qDHuJiPKkg8skkJx" },
                { name: "Skull Crushers", sets: "3 × 10-12", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/IfNBr2zw6rw?si=Mpu7DkQ3HPq15qQf" },
                { name: "Push-Ups Finisher", sets: "2 × AMRAP", muscles: "Chest, triceps, core", youtubeUrl: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF" },
            ],
        },
        {
            id: "pull1",
            name: "🟦 Pull I — Back / Biceps / Rear Delts",
            emoji: "🟦",
            xpReward: 50,
            completed: false,
            color: "#3B82F6",
            exercises: [
                { name: "Pull-Ups (Pronated)", sets: "4 × 5-8", muscles: "Lats, upper back, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "One-Arm Dumbbell Row", sets: "4 × 8-10 / side", muscles: "Lats, rhomboids, biceps", youtubeUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
                { name: "Dumbbell Lateral Raise", sets: "3 × 12-15", muscles: "Lateral delts", youtubeUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
                { name: "Chin-Ups (Supinated)", sets: "3 × 6-10", muscles: "Biceps, lats", youtubeUrl: "https://youtube.com/shorts/Oi3bW9nQmGI?si=Ock9i-K6Z11rGZNZ" },
                { name: "Hammer Curls", sets: "3 × 10-12", muscles: "Biceps, brachialis, forearms", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
            ],
        },
        {
            id: "legs1",
            name: "🟩 Legs — Quads / Glutes / Core",
            emoji: "🟩",
            xpReward: 50,
            completed: false,
            color: "#10B981",
            exercises: [
                { name: "Goblet Squat", sets: "4 × 8-12", muscles: "Quads, glutes, core", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Bulgarian Split Squat", sets: "3 × 8-10 / side", muscles: "Quads, glutes", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Dumbbell Romanian Deadlift", sets: "4 × 8-10", muscles: "Hamstrings, glutes, lower back", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Single-Leg Hip Thrust", sets: "3 × 10-12 / side", muscles: "Glutes", youtubeUrl: "https://www.youtube.com/watch?v=zGxR8AmuOm4" },
                { name: "Wall Sit Hold", sets: "2 × 45-75s", muscles: "Quads, core endurance", youtubeUrl: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx" },
            ],
        },
        {
            id: "upper1",
            name: "🟪 Upper — Full Upper Body",
            emoji: "🟪",
            xpReward: 50,
            completed: false,
            color: "#8B5CF6",
            exercises: [
                { name: "Floor Dumbbell Press", sets: "4 × 8-10", muscles: "Chest, triceps, shoulders", youtubeUrl: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx" },
                { name: "Pull-Ups Volume", sets: "4 × 8-12", muscles: "Lats, upper back, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Dip EMOM", sets: "10 × 6-8", muscles: "Chest, triceps, shoulders", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Overhead Triceps Extension", sets: "3 × 10-12", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/AsUqyuzZBJA?si=WiiIfLjgyhaQmtmV" },
                { name: "Dumbbell Biceps Curl", sets: "3 × 10-12", muscles: "Biceps", youtubeUrl: "https://youtu.be/MzNKcgL1lVU?si=WL4TYfS_a1BvMY2Q" },
                { name: "Dead Hang Hold", sets: "3 × 30-60s", muscles: "Grip, forearms, shoulders", youtubeUrl: "https://www.youtube.com/shorts/dombLZaQIz0" },
            ],
        },
    ],
};

export const MOCK_LEADERBOARD = [
    { rank: 1, name: "Alex F.", xp: 12500, level: 18, emoji: "🥇" },
    { rank: 2, name: "Sarah M.", xp: 11200, level: 16, emoji: "🥈" },
    { rank: 3, name: "John D.", xp: 8400, level: 13, emoji: "🥉" },
    { rank: 4, name: "Emma L.", xp: 6200, level: 10, emoji: "💪" },
    { rank: 5, name: "Mike R.", xp: 5100, level: 9, emoji: "⚡" },
    { rank: 6, name: "Lisa K.", xp: 4300, level: 8, emoji: "🔥" },
    { rank: 7, name: "Tom B.", xp: 3800, level: 7, emoji: "🏃" },
    { rank: 8, name: "Nina W.", xp: 2900, level: 6, emoji: "🧘" },
];
