import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * GET /api/challenges
 * List all active challenges with participant count and user join status.
 */
export async function GET() {
    try {
        const { userId } = await verifyUser(await headers());
        const db = createServerSupabase();

        // Get all active challenges
        const { data: challenges, error } = await db
            .from("challenges")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Get tasks for all challenges
        const challengeIds = (challenges || []).map(c => c.id);
        const { data: allTasks } = await db
            .from("challenge_tasks")
            .select("*")
            .in("challenge_id", challengeIds)
            .order("sort_order", { ascending: true });

        // Get user's joined challenge IDs
        const { data: joined } = await db
            .from("user_challenges")
            .select("challenge_id")
            .eq("user_id", userId);

        const joinedIds = new Set((joined || []).map(j => j.challenge_id));

        // Get participant count per challenge
        const { data: participants } = await db
            .from("user_challenges")
            .select("challenge_id");

        const participantCounts: Record<string, number> = {};
        (participants || []).forEach(p => {
            participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
        });

        // Get today's completions for this user
        const today = new Date().toISOString().split("T")[0];
        const { data: completions } = await db
            .from("task_completions")
            .select("task_id")
            .eq("user_id", userId)
            .eq("completed_date", today);

        const completedTaskIds = new Set((completions || []).map(c => c.task_id));

        // Assemble response
        const result = (challenges || []).map(c => {
            const tasks = (allTasks || []).filter(t => t.challenge_id === c.id);
            return {
                id: c.id,
                title: c.title,
                description: c.description,
                longDescription: c.long_desc,
                emoji: c.emoji,
                difficulty: c.difficulty,
                durationDays: c.duration_days,
                imageUrl: c.image_url,
                totalXp: c.total_xp,
                participantCount: participantCounts[c.id] || 0,
                joined: joinedIds.has(c.id),
                tasks: tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    emoji: t.emoji || "⚡",
                    xpReward: t.xp_reward ?? 10,
                    completed: completedTaskIds.has(t.id),
                })),
            };
        });

        return NextResponse.json({ challenges: result });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
