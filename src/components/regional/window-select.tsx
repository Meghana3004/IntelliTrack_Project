"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const WINDOW_OPTIONS = [7, 14, 30, 60, 90] as const;

export function WindowSelect({ windowDays }: { windowDays: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
      Window
      <select
        value={windowDays}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("windowDays", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-sm text-foreground"
      >
        {WINDOW_OPTIONS.map((d) => (
          <option key={d} value={d}>
            Last {d} days
          </option>
        ))}
      </select>
    </label>
  );
}
