const SEVERITY_LABEL: Record<string, string> = {
  NONE: "None",
  MINOR: "Minor",
  MODERATE: "Moderate",
  SEVERE: "Severe",
};

const SEVERITY_CLASS: Record<string, string> = {
  NONE: "bg-severity-none/15 text-severity-none",
  MINOR: "bg-severity-minor/20 text-severity-minor",
  MODERATE: "bg-severity-moderate/15 text-severity-moderate",
  SEVERE: "bg-severity-severe/15 text-severity-severe",
};

export function SeverityBadge({ severity }: { severity?: string | null }) {
  const key = severity ?? "NONE";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        SEVERITY_CLASS[key] ?? SEVERITY_CLASS.NONE
      }`}
    >
      {SEVERITY_LABEL[key] ?? key}
    </span>
  );
}

export function SlaBadge({ status }: { status: string }) {
  const breached = status === "BREACHED";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        breached ? "bg-severity-severe/15 text-severity-severe" : "bg-accent/10 text-accent"
      }`}
    >
      {breached ? "SLA Breached" : "Within SLA"}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
};

const STATUS_CLASS: Record<string, string> = {
  OPEN: "bg-dark-slate/10 text-foreground/80",
  IN_REVIEW: "bg-severity-minor/20 text-severity-moderate",
  ESCALATED: "bg-severity-severe/15 text-severity-severe",
  RESOLVED: "bg-accent/10 text-accent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASS[status] ?? STATUS_CLASS.OPEN
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
