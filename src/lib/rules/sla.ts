export type ExceptionType = "DELAYED" | "DAMAGED" | "REJECTED";
export type SlaStatus = "WITHIN_SLA" | "BREACHED";

interface ComputeSlaStatusInput {
  type: ExceptionType;
  severity?: string | null;
  scheduledEta: Date;
  reportedAt?: Date;
}

/**
 * Deterministic SLA rule (no AI): DELAYED breaches once reported well past the
 * scheduled ETA; DAMAGED/REJECTED breach on moderate-or-worse severity.
 */
export function computeSlaStatus({
  type,
  severity,
  scheduledEta,
  reportedAt = new Date(),
}: ComputeSlaStatusInput): SlaStatus {
  if (type === "DELAYED") {
    const hoursLate = (reportedAt.getTime() - scheduledEta.getTime()) / (1000 * 60 * 60);
    return hoursLate > 4 ? "BREACHED" : "WITHIN_SLA";
  }

  if (severity === "SEVERE" || severity === "MODERATE") {
    return "BREACHED";
  }

  return "WITHIN_SLA";
}

const TYPE_WEIGHT: Record<ExceptionType, number> = {
  DAMAGED: 30,
  REJECTED: 25,
  DELAYED: 15,
};

const SEVERITY_WEIGHT: Record<string, number> = {
  SEVERE: 40,
  MODERATE: 25,
  MINOR: 10,
  NONE: 0,
};

interface ComputePriorityScoreInput {
  type: ExceptionType;
  severity?: string | null;
  slaStatus: SlaStatus;
  reportedAt: Date;
  now?: Date;
}

/**
 * Deterministic triage priority (no AI): weights exception type, severity,
 * SLA breach, and how long the exception has sat unresolved. Higher = more
 * urgent. Used to default-sort the warehouse queue.
 */
export function computePriorityScore({
  type,
  severity,
  slaStatus,
  reportedAt,
  now = new Date(),
}: ComputePriorityScoreInput): number {
  const hoursSinceReported = Math.max(0, (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60));
  const typeScore = TYPE_WEIGHT[type] ?? 10;
  const severityScore = severity ? (SEVERITY_WEIGHT[severity] ?? 0) : 0;
  const ageScore = Math.min(30, hoursSinceReported * 2);
  const slaScore = slaStatus === "BREACHED" ? 20 : 0;

  return Math.round(typeScore + severityScore + ageScore + slaScore);
}
