export default function DiscoverPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        {/* Hero */}
        <header className="space-y-4 py-12">
          <h1 className="text-4xl font-bold">⚡ OPTIZ</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Build real consistency with guided workouts, visible progress, and a leaderboard that keeps you accountable.
          </p>
        </header>

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3 text-left">
          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">💪 Structured Workouts</h3>
            <p className="text-gray-500">
              Follow clear training sessions with practical progression built in.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">📊 Track What Matters</h3>
            <p className="text-gray-500">
              Monitor XP, streaks, steps, and nutrition in one focused dashboard.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">🏆 Competitive Momentum</h3>
            <p className="text-gray-500">
              Stay consistent through ranking, milestones, and daily validation loops.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
