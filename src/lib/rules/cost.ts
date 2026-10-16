import type { ExceptionType } from "./sla";

const SEVERITY_COST: Record<string, number> = {
  NONE: 0,
  MINOR: 50,
  MODERATE: 250,
  SEVERE: 800,
};

const REJECTED_SURCHARGE = 100;
const DELAYED_HOURLY_SURCHARGE = 40;
const DELAYED_SURCHARGE_CAP_HOURS = 12;

export interface CostEstimateInput {
  type: ExceptionType;
  severity?: string | null;
  slaStatus: "WITHIN_SLA" | "BREACHED";
  scheduledEta: Date;
  reportedAt: Date;
  acceptedCompensationTotal?: number;
}

/**
 * Deterministic modeled dollar-cost estimate for an exception (no AI): a
 * severity-based base cost, type surcharges, and any accepted AIRecommendation
 * compensation. Always label this as a "modeled estimate" in the UI.
 */
export function estimateExceptionCost({
  type,
  severity,
  slaStatus,
  scheduledEta,
  reportedAt,
  acceptedCompensationTotal = 0,
}: CostEstimateInput): number {
  let cost = SEVERITY_COST[severity ?? "NONE"] ?? 0;

  if (type === "REJECTED") {
    cost += REJECTED_SURCHARGE;
  }

  if (type === "DELAYED" && slaStatus === "BREACHED") {
    const hoursLate = Math.max(0, (reportedAt.getTime() - scheduledEta.getTime()) / (1000 * 60 * 60));
    cost += Math.min(hoursLate, DELAYED_SURCHARGE_CAP_HOURS) * DELAYED_HOURLY_SURCHARGE;
  }

  cost += acceptedCompensationTotal;

  return Math.round(cost);
}

interface AcceptedRecommendation {
  type: string;
  accepted: boolean;
  details: string;
}

/**
 * Extracts a dollar figure from an accepted COMPENSATION recommendation's
 * free-text `details` (e.g. "$150 credit" -> 150). Returns 0 if none accepted
 * or no dollar figure is present.
 */
export function sumAcceptedCompensation(recommendations: AcceptedRecommendation[]): number {
  return recommendations
    .filter((r) => r.accepted && r.type === "COMPENSATION")
    .reduce((total, r) => {
      const match = /\$\s*(\d+(?:\.\d+)?)/.exec(r.details);
      return total + (match ? Number(match[1]) : 0);
    }, 0);
}
