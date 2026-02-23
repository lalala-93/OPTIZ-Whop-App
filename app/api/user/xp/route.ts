import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * POST /api/user/xp
 * Award XP to the current user. Handles streak logging + leaderboard refresh.
 * Body: { xp: number, source: "todo" | "challenge", taskId?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await verifyUser(await headers());
        const { xp, source, taskId } = await request.json();
        const db = createServerSupabase();

        if (!xp || typeof xp !== "number" || xp <= 0) {
            return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 });
        }

        // 1. Update user total XP
        const { data: profile, error: profileErr } = await db
            .from("user_profiles")
            .select("total_xp, streak_days, last_task_at")
            .eq("whop_user_id", userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const newTotalXp = (profile.total_xp ?? 0) + xp;
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        // 2. Streak check — did user already log activity today?
        const { data: existingStreak } = await db
            .from("streak_log")
            .select("id")
            .eq("user_id", userId)
            .eq("streak_date", today)
            .single();

        let newStreakDays = profile.streak_days ?? 0;
        let streakBonusXp = 0;
        let streakEarned = false;

        if (!existingStreak) {
            // First task of the day — log streak
            await db.from("streak_log").insert({ user_id: userId, streak_date: today });

            // Check if yesterday was logged (streak continuity)
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            const { data: yesterdayStreak } = await db
                .from("streak_log")
                .select("id")
                .eq("user_id", userId)
                .eq("streak_date", yesterdayStr)
                .single();

            if (yesterdayStreak || (profile.streak_days ?? 0) === 0) {
                newStreakDays = (profile.streak_days ?? 0) + 1;
                streakBonusXp = 50; // Streak bonus
                streakEarned = true;
            } else {
                // Streak broken — reset to 1
                newStreakDays = 1;
            }
        }

        // 3. Update profile
        await db
            .from("user_profiles")
            .update({
                total_xp: newTotalXp + streakBonusXp,
                streak_days: newStreakDays,
                last_task_at: now.toISOString(),
                updated_at: now.toISOString(),
            })
            .eq("whop_user_id", userId);

        // 4. If challenge task — log completion
        if (source === "challenge" && taskId) {
            await db.from("task_completions").insert({
                user_id: userId,
                task_id: taskId,
                xp_earned: xp,
                completed_date: today,
            }).then(() => { }); // Ignore duplicate errors (unique constraint)
        }

        // 5. Refresh leaderboard (async, non-blocking)
        db.rpc("refresh_leaderboard").then(() => { });

        return NextResponse.json({
            totalXp: newTotalXp + streakBonusXp,
            streakDays: newStreakDays,
            streakBonusXp,
            streakEarned,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
