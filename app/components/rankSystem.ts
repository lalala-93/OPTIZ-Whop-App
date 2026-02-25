// ═══════════════════════════════════════════════
// OPTIZ Rank System — Inspired by CoD / LoL tiers
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
    { name: "Initiate", minLevel: 1, maxLevel: 10, color: "#9CA3AF", colorLight: "#E5E7EB", gradient: ["#374151", "#9CA3AF"], glowColor: "rgba(156,163,175,0.3)", ringBg: "rgba(156,163,175,0.15)" },
    { name: "Grinder", minLevel: 11, maxLevel: 20, color: "#D97706", colorLight: "#FBBF24", gradient: ["#92400E", "#FBBF24"], glowColor: "rgba(217,119,6,0.3)", ringBg: "rgba(217,119,6,0.15)" },
    { name: "Elite", minLevel: 21, maxLevel: 30, color: "#E80000", colorLight: "#FF5252", gradient: ["#7F1D1D", "#FF5252"], glowColor: "rgba(232,0,0,0.4)", ringBg: "rgba(232,0,0,0.2)" },
    { name: "Apex", minLevel: 31, maxLevel: 999, color: "#FFD700", colorLight: "#FEF08A", gradient: ["#B45309", "#FEF08A"], glowColor: "rgba(255,215,0,0.5)", ringBg: "rgba(255,215,0,0.25)" },
];

// ── XP Calculation ──
export function getXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.08, level - 1));
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

export interface ChallengeTask {
    id: string;
    name: string;
    emoji: string;
    xpReward: number;
    completed: boolean;
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
    "t1": { benefit: "Cardio boosts heart health, torches calories, and releases endorphins that elevate your mood for the entire day.", tips: "Start slow and build up pace. Listen to music or a podcast to make it enjoyable." },
    "t2": { benefit: "Push-ups build upper body strength, core stability, and muscular endurance. A full-body compound movement.", tips: "Break into sets of 20-25. Maintain proper form — chest to floor, back straight." },
    "t3": { benefit: "Yoga improves flexibility, reduces stress hormones, and enhances mind-body connection for better recovery.", tips: "Focus on deep breathing. Hold each pose for 30s minimum. Don't rush." },
    "t4": { benefit: "Proper hydration improves energy levels, brain function, skin health, and supports muscle recovery.", tips: "Carry a water bottle everywhere. Set reminders every hour. Add lemon for taste." },
    "t5": { benefit: "Clean nutrition fuels performance, supports muscle growth, and reduces inflammation throughout your body.", tips: "Prep meals in advance. Focus on whole foods — lean protein, vegetables, complex carbs." },
    "t6": { benefit: "Cold showers boost circulation, reduce muscle soreness, strengthen immunity, and build mental toughness.", tips: "Start with 30 seconds cold at the end of a warm shower. Gradually increase duration." },
    "t7": { benefit: "Sit-ups strengthen your core, improve posture, and support better performance in every other exercise.", tips: "Break into sets of 40-50. Keep your core engaged. Don't pull on your neck." },
    "t8": { benefit: "Meditation reduces stress, improves focus, and enhances emotional regulation for better decision-making.", tips: "Find a quiet spot. Focus on your breath. Start with guided meditations if new." },
    "t9": { benefit: "Reading expands knowledge, improves focus, reduces stress, and stimulates creative thinking.", tips: "Read before bed instead of scrolling. Choose topics that inspire you." },
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
    description: "30-day elite fitness program — push your limits.",
    longDescription: "The ultimate 30-day transformation challenge. Complete daily tasks across cardio, strength, flexibility, and nutrition to earn XP, level up your rank, and compete on the global leaderboard. Designed for those who refuse to settle.",
    emoji: "🔥",
    difficulty: "Hard",
    durationDays: 30,
    participantCount: 847,
    taskCount: 8,
    totalXp: 380,
    joined: false,
    tasks: [
        { id: "t1", name: "Morning Run — 5km", emoji: "🏃‍♂️", xpReward: 50, completed: false },
        { id: "t2", name: "100 Push-ups", emoji: "💪", xpReward: 50, completed: false },
        { id: "t3", name: "Yoga Session — 20min", emoji: "🧘‍♀️", xpReward: 30, completed: false },
        { id: "t4", name: "Drink 3L Water", emoji: "💧", xpReward: 20, completed: false },
        { id: "t5", name: "Eat Clean — No Junk", emoji: "🥗", xpReward: 40, completed: false },
        { id: "t6", name: "Cold Shower", emoji: "🥶", xpReward: 50, completed: false },
        { id: "t7", name: "200 Sit-ups", emoji: "🔥", xpReward: 50, completed: false },
        { id: "t8", name: "10min Meditation", emoji: "🧠", xpReward: 40, completed: false },
        { id: "t9", name: "Read 30 Pages", emoji: "📖", xpReward: 50, completed: false },
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
