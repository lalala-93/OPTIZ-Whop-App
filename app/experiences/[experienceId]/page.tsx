import { headers } from "next/headers";
import { verifyUser, checkExperienceAccess } from "@/lib/authentication";
import { ExperienceDashboard } from "@/app/components/ExperienceDashboard";

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
        <p className="text-sm mt-4 italic opacity-50">Debug: userId {userId}</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen font-sans">
      <ExperienceDashboard userId={userId} />
    </div>
  );
}
