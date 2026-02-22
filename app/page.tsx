export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold">⚡ OPTIZ</h1>
        <p className="text-lg text-gray-500">
          1% better every day.
        </p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>This app runs inside the Whop iframe.</p>
          <p>
            Install it on your Whop to see the Experience, Dashboard, and
            Discover views.
          </p>
        </div>
      </div>
    </div>
  );
}
