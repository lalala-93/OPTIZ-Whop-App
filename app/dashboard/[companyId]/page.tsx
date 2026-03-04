import { headers } from "next/headers";
import { verifyUser, checkDashboardAccess } from "@/lib/authentication";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await verifyUser(await headers());

  const access = await checkDashboardAccess(companyId, userId);

  if (!access.has_access || access.access_level !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-gray-500">
            This dashboard is only available to company admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">OPTIZ Dashboard</h1>
          <p className="text-gray-500">
            Manage app settings and basic analytics.
          </p>
        </header>

        {/* Stats Overview */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6 space-y-2">
            <p className="text-sm text-gray-500">Active Members</p>
            <p className="text-3xl font-bold">—</p>
          </div>
          <div className="rounded-xl border p-6 space-y-2">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-3xl font-bold">—</p>
          </div>
          <div className="rounded-xl border p-6 space-y-2">
            <p className="text-sm text-gray-500">Engagement</p>
            <p className="text-3xl font-bold">—</p>
          </div>
        </section>

        {/* Management Section */}
        <section className="rounded-xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">App Settings</h2>
          <p className="text-gray-500">
            Configure workouts, content, and member settings.
          </p>
        </section>

        {/* Debug Info (remove in production) */}
        <footer className="text-xs text-gray-400 space-y-1">
          <p>Company: {companyId}</p>
          <p>Admin: {userId}</p>
        </footer>
      </div>
    </div>
  );
}
