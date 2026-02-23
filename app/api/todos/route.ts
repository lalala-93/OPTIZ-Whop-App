import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * GET /api/todos
 * List all todos for the current user.
 */
export async function GET() {
    try {
        const { userId } = await verifyUser(await headers());
        const db = createServerSupabase();

        const { data, error } = await db
            .from("todos")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ todos: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}

/**
 * POST /api/todos
 * Create a new personal todo.
 * Body: { text: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await verifyUser(await headers());
        const { text } = await request.json();
        const db = createServerSupabase();

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return NextResponse.json({ error: "Todo text is required" }, { status: 400 });
        }

        const { data, error } = await db
            .from("todos")
            .insert({ user_id: userId, text: text.trim() })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ todo: data }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
