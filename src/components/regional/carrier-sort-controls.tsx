"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "exceptionRate", label: "Exception rate" },
  { value: "exceptionCount", label: "Exception count" },
  { value: "avgResolutionHours", label: "Avg resolution time" },
] as const;

const DIRECTION_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
] as const;

export function CarrierSortControls({ sort, direction }: { sort: string; direction: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
        Sort by
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
        Direction
        <select
          value={direction}
          onChange={(e) => update("direction", e.target.value)}
          className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-sm text-foreground"
        >
          {DIRECTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
