export interface RecommendationData {
  id: string;
  type: string;
  details: string;
  justification: string;
  accepted: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  REDISPATCH: "Redispatch",
  ALT_WAREHOUSE: "Alternate Warehouse",
  ALT_DRIVER: "Alternate Driver",
  COMPENSATION: "Compensation",
};

/** Read-only recommendation display, shared across Warehouse/Regional/Leadership. */
export function RecommendationList({
  recommendations,
  actions,
}: {
  recommendations: RecommendationData[];
  actions?: (recommendation: RecommendationData) => React.ReactNode;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">AI Recommendations</p>
      {recommendations.map((rec) => (
        <div key={rec.id} className="rounded-md border border-dark-slate/10 bg-app-surface p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {TYPE_LABEL[rec.type] ?? rec.type}
            </span>
            {rec.accepted && (
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                Accepted
              </span>
            )}
          </div>
          <p className="mt-1 text-foreground/80">{rec.details}</p>
          <p className="mt-1 text-xs italic text-foreground/50">{rec.justification}</p>
          {actions?.(rec)}
        </div>
      ))}
    </div>
  );
}
