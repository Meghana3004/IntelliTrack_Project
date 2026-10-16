import type { CarrierScorecardRow } from "@/lib/queries/carriers";

function SeverityBar({ mix }: { mix: CarrierScorecardRow["severityMix"] }) {
  const total = mix.NONE + mix.MINOR + mix.MODERATE + mix.SEVERE;
  if (total === 0) return <span className="text-xs text-foreground/40">No data</span>;

  const segments = [
    { key: "SEVERE", value: mix.SEVERE, className: "bg-severity-severe" },
    { key: "MODERATE", value: mix.MODERATE, className: "bg-severity-moderate" },
    { key: "MINOR", value: mix.MINOR, className: "bg-severity-minor" },
    { key: "NONE", value: mix.NONE, className: "bg-severity-none" },
  ];

  return (
    <div className="flex h-2 w-32 overflow-hidden rounded-full bg-dark-slate/10">
      {segments.map(
        (s) =>
          s.value > 0 && (
            <div
              key={s.key}
              className={s.className}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.key}: ${s.value}`}
            />
          ),
      )}
    </div>
  );
}

export function CarrierScorecardTable({ rows }: { rows: CarrierScorecardRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-foreground/60">No carrier activity in this window.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-dark-slate/10 bg-app-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-dark-slate/10 text-left text-xs font-medium text-foreground/60">
            <th className="px-4 py-3">Carrier</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Deliveries</th>
            <th className="px-4 py-3">Exceptions</th>
            <th className="px-4 py-3">Exception Rate</th>
            <th className="px-4 py-3">Avg Resolution</th>
            <th className="px-4 py-3">Severity Mix</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.carrierId} className="border-b border-dark-slate/5 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-3 text-foreground/70">
                {row.type === "INTERNAL" ? "Internal" : "Third-party"}
              </td>
              <td className="px-4 py-3 text-foreground/70">{row.deliveryCount}</td>
              <td className="px-4 py-3 text-foreground/70">{row.exceptionCount}</td>
              <td className="px-4 py-3 text-foreground/70">{row.exceptionRate}%</td>
              <td className="px-4 py-3 text-foreground/70">
                {row.avgResolutionHours != null ? `${row.avgResolutionHours}h` : "—"}
              </td>
              <td className="px-4 py-3">
                <SeverityBar mix={row.severityMix} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
