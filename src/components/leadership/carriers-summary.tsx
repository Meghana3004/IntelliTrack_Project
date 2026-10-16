import type { CarrierScorecardRow } from "@/lib/queries/carriers";

/**
 * Leadership-level view: top-line figures only, no per-carrier sortable
 * table. Row-level detail is Regional Manager's job (CarrierScorecardTable).
 */
export function CarriersSummary({ rows }: { rows: CarrierScorecardRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-foreground/60">No carrier activity company-wide in this window.</p>;
  }

  const totalDeliveries = rows.reduce((sum, r) => sum + r.deliveryCount, 0);
  const totalExceptions = rows.reduce((sum, r) => sum + r.exceptionCount, 0);
  const overallRate = totalDeliveries ? Math.round((totalExceptions / totalDeliveries) * 1000) / 10 : 0;

  const best = [...rows].sort((a, b) => a.exceptionRate - b.exceptionRate)[0];
  const worst = [...rows].sort((a, b) => b.exceptionRate - a.exceptionRate)[0];

  const cards = [
    { label: "Carriers", value: rows.length.toLocaleString(), sub: "active this window" },
    { label: "Overall Exception Rate", value: `${overallRate}%`, sub: "across all carriers" },
    { label: "Best Performer", value: best.name, sub: `${best.exceptionRate}% exception rate` },
    { label: "Worst Performer", value: worst.name, sub: `${worst.exceptionRate}% exception rate` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
