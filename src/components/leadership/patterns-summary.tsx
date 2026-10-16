import type { PatternGroup } from "@/lib/queries/patterns";

const DIMENSION_LABEL: Record<PatternGroup["dimension"], string> = {
  driver: "Driver patterns",
  carrier: "Carrier patterns",
  route: "Route patterns",
  warehouse: "Warehouse patterns",
};

const DIMENSION_ORDER: PatternGroup["dimension"][] = ["driver", "carrier", "route", "warehouse"];

/**
 * Leadership-level view: high-level counts only, no group labels/insights/
 * exception ids. Row-level drill-down is Regional Manager's job (PatternsList).
 */
export function PatternsSummary({ groups, windowDays }: { groups: PatternGroup[]; windowDays: number }) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        No repeated patterns company-wide in the last {windowDays} days at the current threshold.
      </p>
    );
  }

  const countByDimension = new Map<PatternGroup["dimension"], number>();
  for (const group of groups) {
    countByDimension.set(group.dimension, (countByDimension.get(group.dimension) ?? 0) + 1);
  }

  const cards = [
    { label: "Total Pattern Groups", value: groups.length.toLocaleString(), sub: `last ${windowDays} days` },
    ...DIMENSION_ORDER.map((dimension) => ({
      label: DIMENSION_LABEL[dimension],
      value: (countByDimension.get(dimension) ?? 0).toLocaleString(),
      sub: `last ${windowDays} days`,
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-dark-slate/10 bg-app-surface p-4">
          <p className="text-xs font-medium text-foreground/60">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{card.value}</p>
          <p className="mt-1 text-xs text-foreground/50">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
