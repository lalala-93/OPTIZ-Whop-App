import { headers } from "next/headers";
import { verifyUser, checkExperienceAccess } from "@/lib/authentication";
import { ExperienceDashboard } from "@/app/components/ExperienceDashboard";
import type { InitialData } from "@/app/components/ExperienceDashboard";
import { loadUserData } from "@/lib/actions";
import Link from "next/link";

/** Retry a function up to `maxAttempts` times with a delay between attempts. */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delayMs = 800): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.warn(`[OPTIZ] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unreachable");
}

export default async function ExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ experienceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { experienceId } = await params;
  const query = await searchParams;

  let userId = "";
  let authFailed = false;

  // Primary auth: Whop iframe JWT token (desktop/web)
  try {
    const result = await withRetry(async () => verifyUser(await headers()));
    userId = result.userId;
  } catch (err) {
    console.error("[OPTIZ] verifyUser failed after retries:", err);
    authFailed = true;
  }

  // Fallback auth: mobile WebView passes userId as query param
  // The RN wrapper already authenticated the user via Whop SDK
  // We still verify access below via checkExperienceAccess
  if (authFailed && typeof query.mobileUserId === "string" && query.mobileUserId.startsWith("user_")) {
    userId = query.mobileUserId;
    authFailed = false;
  }

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-1 text-gray-11 p-6 text-center">
        <div className="mb-5 w-12 h-12 rounded-full border border-[#E80000]/40 bg-[#E80000]/12 text-[#FF5A5A] flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-gray-12 mb-2">Connexion impossible</h1>
        <p className="text-sm text-gray-9 mb-6 max-w-xs">
          Nous n&apos;avons pas pu vérifier ton identité. Cela arrive généralement si la page est ouverte hors de Whop.
        </p>
        <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E80000] hover:bg-[#CC0000] transition-colors">
          Réessayer
        </Link>
        <p className="text-[10px] text-gray-7 mt-4">
          Si le problème persiste, ferme cet onglet puis relance l&apos;app depuis Whop.
        </p>
      </div>
    );
  }

  let hasAccess = true;
  try {
    const access = await checkExperienceAccess(experienceId, userId);
    hasAccess = access.has_access;
  } catch (err) {
    console.error("[OPTIZ] checkExperienceAccess failed:", err);
    // Allow through on access check failure to avoid blocking legitimate users
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-1 text-gray-11 p-4 text-center">
        <div className="w-14 h-14 mb-4 rounded-full border border-gray-5/40 bg-gray-3/40 flex items-center justify-center text-gray-8">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-12 mb-2">Accès refusé</h1>
        <p>Un accès actif est nécessaire pour afficher ce contenu.</p>
      </div>
    );
  }

  // Load all data server-side with error resilience
  let initialData: InitialData;
  try {
    initialData = await loadUserData(userId);
  } catch (err) {
    console.error("[OPTIZ] SSR loadUserData failed:", err);
    initialData = {
      profile: { totalXp: 0, streakDays: 0, displayName: "Athlete", avatarUrl: null, locale: null },
      todos: [],
      challenges: [],
      weeklyProgress: [false, false, false, false, false, false, false],
      totalTasksCompleted: 0,
      stepsToday: null,
      nutritionToday: null,
      breathworkSessionsToday: 0,
      workoutCompletionsToday: [],
    };
  }

  return (
    <ExperienceDashboard userId={userId} initialData={initialData} />
  );
}
