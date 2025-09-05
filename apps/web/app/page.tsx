export default async function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  let status = "unknown";
  try {
    const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
    const data = await res.json();
    status = data.status ?? "unknown";
  } catch {
    status = "api_not_reachable";
  }
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-xl w-full space-y-4">
        <h1 className="text-3xl font-semibold">AllerLens — MVP</h1>
        <p className="text-sm text-gray-600">Next.js frontend talking to FastAPI backend.</p>
        <div className="rounded-lg border p-4">
          <div className="text-sm">API health:</div>
          <div className="text-lg font-mono">{status}</div>
        </div>
      </div>
    </main>
  );
}
