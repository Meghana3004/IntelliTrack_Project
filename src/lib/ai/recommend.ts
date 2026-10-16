import { simulateWarehouseAvailability } from "@/lib/rules/capacity";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";

export type RecommendationType = "REDISPATCH" | "ALT_WAREHOUSE" | "ALT_DRIVER" | "COMPENSATION";

export interface RecommendInput {
  type: ExceptionType;
  severity?: string | null;
  slaStatus: SlaStatus;
  originWarehouseId: string;
  destWarehouseId: string;
  hasDriver: boolean;
  suggestedCompensation: number;
}

export interface Recommendation {
  type: RecommendationType;
  details: string;
}

const SEVERITY_RANK: Record<string, number> = { NONE: 0, MINOR: 1, MODERATE: 2, SEVERE: 3 };

/**
 * Deterministic rule engine (no AI): scores each recommendation type from the
 * exception's type/severity/SLA status plus simulated warehouse capacity, and
 * picks the highest-scoring one. Gemini only writes the justification
 * sentence afterward — it never chooses the type.
 */
export function recommendAction(input: RecommendInput): Recommendation {
  const severityRank = SEVERITY_RANK[input.severity ?? "NONE"] ?? 0;
  const destAvailability = simulateWarehouseAvailability(input.destWarehouseId);
  const originAvailability = simulateWarehouseAvailability(input.originWarehouseId);

  const scores: Record<RecommendationType, number> = {
    REDISPATCH: 0,
    ALT_WAREHOUSE: 0,
    ALT_DRIVER: 0,
    COMPENSATION: 0,
  };

  if (input.type === "DAMAGED") {
    scores.COMPENSATION += 35 + severityRank * 20;
    scores.REDISPATCH += 20 + destAvailability * 0.3;
  } else if (input.type === "DELAYED") {
    scores.ALT_DRIVER += input.hasDriver ? 35 : 5;
    scores.REDISPATCH += 15 + originAvailability * 0.25;
    scores.COMPENSATION += 10;
  } else {
    scores.ALT_WAREHOUSE += 30 + destAvailability * 0.3;
    scores.COMPENSATION += 25;
  }

  if (input.slaStatus === "BREACHED") {
    scores.COMPENSATION += 15;
    scores.REDISPATCH += 5;
  }

  if (severityRank === 3) {
    // Severe issues shouldn't be resolved by simply swapping the driver.
    scores.ALT_DRIVER = Math.max(0, scores.ALT_DRIVER - 25);
    scores.COMPENSATION += 15;
  }

  const [bestType] = (Object.entries(scores) as [RecommendationType, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return { type: bestType, details: detailsFor(bestType, input, destAvailability) };
}

function detailsFor(type: RecommendationType, input: RecommendInput, destAvailability: number): string {
  const severityLabel = (input.severity ?? "reported").toLowerCase();
  switch (type) {
    case "REDISPATCH":
      return `Redispatch the shipment now — destination warehouse has ${destAvailability}% capacity available.`;
    case "ALT_WAREHOUSE":
      return `Reroute to an alternate warehouse — current destination is at ${100 - destAvailability}% utilization.`;
    case "ALT_DRIVER":
      return "Reassign to another available driver to recover the schedule.";
    case "COMPENSATION":
      return `Offer $${input.suggestedCompensation} customer compensation for the ${severityLabel} issue.`;
  }
}
