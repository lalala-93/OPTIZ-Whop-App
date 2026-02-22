export default function DiscoverPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        {/* Hero */}
        <header className="space-y-4 py-12">
          <h1 className="text-4xl font-bold">⚡ OPTIZ</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            1% better every day. Personalized workouts, progress
            tracking, and community motivation — all in one place.
          </p>
        </header>

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3 text-left">
          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">💪 Custom Workouts</h3>
            <p className="text-gray-500">
              Personalized workout plans tailored to your fitness goals.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">📊 Track Progress</h3>
            <p className="text-gray-500">
              Monitor your gains with detailed stats and visual charts.
            </p>
          </div>

          <div className="rounded-xl border p-6 space-y-3">
            <h3 className="text-lg font-semibold">🏆 Community</h3>
            <p className="text-gray-500">
              Connect with fellow fitness enthusiasts and stay motivated.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

