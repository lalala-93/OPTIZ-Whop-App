export default function DiscoverPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        {/* Hero */}
        <header className="space-y-4 py-12">
          <h1 className="text-4xl font-bold">⚡ OPTIZ</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Workouts, progress, and leaderboard in one app.
          </p>
        </header>

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3 text-left">
          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">💪 Structured Workouts</h3>
            <p className="text-gray-500">
              Clear sessions you can follow every day.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">📊 Track What Matters</h3>
            <p className="text-gray-500">
              See XP, streaks, steps, and nutrition in one place.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">🏆 Competitive Momentum</h3>
            <p className="text-gray-500">
              Compare your rank with other members.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
