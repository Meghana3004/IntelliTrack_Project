import type { PatternGroup } from "@/lib/queries/patterns";

const DIMENSION_LABEL: Record<PatternGroup["dimension"], string> = {
  driver: "Driver",
  carrier: "Carrier",
  route: "Route",
  warehouse: "Warehouse",
};

export function PatternsList({ groups, windowDays }: { groups: PatternGroup[]; windowDays: number }) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        No repeated patterns in the last {windowDays} days at the current threshold.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group) => (
        <li
          key={`${group.dimension}:${group.key}`}
          className="rounded-lg border border-dark-slate/10 bg-app-surface p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {DIMENSION_LABEL[group.dimension]}
            </span>
            <span className="font-medium text-foreground">{group.label}</span>
            <span className="text-xs text-foreground/50">
              {group.count} exceptions · mostly {group.topType.toLowerCase()}
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground/80">{group.insight}</p>
        </li>
      ))}
    </ul>
  );
}
