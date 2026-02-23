import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * POST /api/challenges/[id]/join
 * Join a challenge.
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await verifyUser(await headers());
        const { id } = await params;
        const db = createServerSupabase();

        // Check challenge exists
        const { data: challenge, error: cErr } = await db
            .from("challenges")
            .select("id")
            .eq("id", id)
            .single();

        if (cErr || !challenge) {
            return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
        }

        // Ensure user has a profile
        const { data: profile } = await db
            .from("user_profiles")
            .select("whop_user_id")
            .eq("whop_user_id", userId)
            .single();

        if (!profile) {
            await db.from("user_profiles").insert({ whop_user_id: userId });
        }

        // Join (upsert to handle duplicates)
        const { error } = await db
            .from("user_challenges")
            .upsert({ user_id: userId, challenge_id: id }, { onConflict: "user_id,challenge_id" });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, challengeId: id });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
