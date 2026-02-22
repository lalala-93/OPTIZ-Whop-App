import { headers } from "next/headers";
import { verifyUser, checkExperienceAccess } from "@/lib/authentication";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500">
            You don&apos;t have access to this experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">⚡ OPTIZ</h1>
          <p className="text-gray-500">
            1% better every day
          </p>
        </header>

        {/* Main Content Area */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-6 space-y-3">
            <h2 className="text-xl font-semibold">Today&apos;s Workout</h2>
            <p className="text-gray-500">
              Your personalized workout plan will appear here.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h2 className="text-xl font-semibold">Progress</h2>
            <p className="text-gray-500">
              Track your fitness journey and stats.
            </p>
          </div>
        </section>

        {/* Debug Info (remove in production) */}
        <footer className="text-xs text-gray-400 space-y-1">
          <p>Experience: {experienceId}</p>
          <p>User: {userId}</p>
          <p>Access Level: {access.access_level}</p>
        </footer>
      </div>
    </div>
  );
}

