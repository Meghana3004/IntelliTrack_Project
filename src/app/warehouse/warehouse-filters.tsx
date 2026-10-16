"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SEVERITY_OPTIONS = [
  { value: "ALL", label: "All severities" },
  { value: "SEVERE", label: "Severe" },
  { value: "MODERATE", label: "Moderate" },
  { value: "MINOR", label: "Minor" },
  { value: "NONE", label: "None" },
] as const;

const SLA_OPTIONS = [
  { value: "ALL", label: "All SLA statuses" },
  { value: "BREACHED", label: "Breached" },
  { value: "WITHIN_SLA", label: "Within SLA" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active (not resolved)" },
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ALL", label: "All statuses" },
] as const;

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "severity", label: "Severity" },
] as const;

function FilterSelect({
  label,
  paramKey,
  options,
  value,
}: {
  label: string;
  paramKey: string;
  options: readonly { value: string; label: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
      {label}
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(paramKey, e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WarehouseFilters({
  severity,
  slaStatus,
  status,
  sort,
}: {
  severity: string;
  slaStatus: string;
  status: string;
  sort: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect label="Severity" paramKey="severity" options={SEVERITY_OPTIONS} value={severity} />
      <FilterSelect label="SLA" paramKey="slaStatus" options={SLA_OPTIONS} value={slaStatus} />
      <FilterSelect label="Status" paramKey="status" options={STATUS_OPTIONS} value={status} />
      <FilterSelect label="Sort by" paramKey="sort" options={SORT_OPTIONS} value={sort} />
    </div>
  );
}
