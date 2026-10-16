"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface RegionOption {
  id: string;
  name: string;
}

export function RegionFilter({ regions, regionId }: { regions: RegionOption[]; regionId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
      Region
      <select
        value={regionId ?? ""}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) {
            params.set("regionId", e.target.value);
          } else {
            params.delete("regionId");
          }
          const query = params.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
        className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-sm text-foreground"
      >
        <option value="">All regions</option>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
    </label>
  );
}
