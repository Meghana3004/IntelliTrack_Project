export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-app-bg px-6 text-center">
      <h1 className="text-3xl font-semibold text-foreground">IntelliTrack</h1>
      <p className="max-w-md text-foreground/70">
        Delivery Exception Tracker — scaffolding in progress. Phase 1 adds
        auth, seed data, and the shared app shell.
      </p>
      <span className="rounded-full bg-accent/10 px-4 py-1 text-sm font-medium text-accent">
        Phase 0 — project skeleton
      </span>
    </main>
  );
}
