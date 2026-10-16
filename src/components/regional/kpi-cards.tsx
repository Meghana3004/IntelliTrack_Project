import type { DashboardKpis } from "@/lib/queries/dashboard";

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const cards = [
    {
      label: "Deliveries",
      value: kpis.totalDeliveries.toLocaleString(),
      sub: `last ${kpis.windowDays} days`,
    },
    {
      label: "Active Exceptions",
      value: kpis.activeExceptions.toLocaleString(),
      sub: `${kpis.totalExceptions} total in window`,
    },
    {
      label: "SLA Breach Rate",
      value: `${kpis.slaBreachRate}%`,
      sub: `last ${kpis.windowDays} days`,
    },
    {
      label: "Avg Resolution Time",
      value: kpis.avgResolutionHours != null ? `${kpis.avgResolutionHours}h` : "—",
      sub: "resolved exceptions",
    },
    {
      label: "Modeled Cost Impact",
      value: `$${kpis.modeledCostImpact.toLocaleString()}`,
      sub: "modeled estimate, not actual spend",
    },
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
