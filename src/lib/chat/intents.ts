export type ChatIntent =
  | "exception_count"
  | "sla_breach"
  | "carrier_scorecard"
  | "patterns"
  | "kpi_summary";

/**
 * Deterministic keyword-based intent classification (no AI) — this is what
 * decides which scoped Prisma query runs, so it must never depend on
 * anything an LLM could be tricked into producing.
 */
export function classifyIntent(message: string): ChatIntent {
  const m = message.toLowerCase();
  if (/carrier/.test(m)) return "carrier_scorecard";
  if (/pattern|repeat|recurring/.test(m)) return "patterns";
  if (/sla|breach/.test(m)) return "sla_breach";
  if (/exception/.test(m)) return "exception_count";
  return "kpi_summary";
}
