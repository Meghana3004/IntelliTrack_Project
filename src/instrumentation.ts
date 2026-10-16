import { PHASE_PRODUCTION_BUILD } from "next/constants";

const CHECK_INTERVAL_MS = 60_000;

declare global {
  // `var` is required here — `let`/`const` don't merge into the ambient
  // `globalThis` type declaration the way `var` does.
  var __autoDelayJobStarted: boolean | undefined;
}

/**
 * Starts the auto-delay background job once per server instance: an immediate
 * check, then every CHECK_INTERVAL_MS. Only runs in the Node.js server
 * runtime (never edge, never during `next build`), and only once even across
 * dev hot-reloads.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;
  if (globalThis.__autoDelayJobStarted) return;
  globalThis.__autoDelayJobStarted = true;

  const { runAutoDelayCheck } = await import("@/lib/jobs/auto-delay");

  runAutoDelayCheck().catch((err) => {
    console.error("[auto-delay] initial check failed:", err);
  });

  setInterval(() => {
    runAutoDelayCheck().catch((err) => {
      console.error("[auto-delay] check failed:", err);
    });
  }, CHECK_INTERVAL_MS);
}
