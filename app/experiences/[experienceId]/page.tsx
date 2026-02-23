import { headers } from "next/headers";
import { verifyUser, checkExperienceAccess } from "@/lib/authentication";
import { ExperienceDashboard } from "@/app/components/ExperienceDashboard";
import type { InitialData } from "@/app/components/ExperienceDashboard";
import { loadUserData } from "@/lib/actions";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await verifyUser(await headers());

  const access = await checkExperienceAccess(experienceId, userId);

  if (!access.has_access) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[--color-optiz-dark] text-[--color-optiz-muted] p-4 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p>You need an active plan to view this experience.</p>
      </div>
    );
  }

  // Load all data server-side with error resilience
  let initialData: InitialData;
  try {
    initialData = await loadUserData(userId);
  } catch (err) {
    console.error("[OPTIZ] SSR loadUserData failed:", err);
    // Provide safe defaults so the page still renders
    initialData = {
      profile: { totalXp: 0, streakDays: 0, displayName: "User", avatarUrl: null, locale: null },
      todos: [],
      challenges: [],
      weeklyProgress: [false, false, false, false, false, false, false],
      totalTasksCompleted: 0,
    };
  }

  return (
    <ExperienceDashboard userId={userId} initialData={initialData} />
  );
}
