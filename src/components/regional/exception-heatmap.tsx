"use client";

import dynamic from "next/dynamic";
import type { HeatPoint, Incident } from "@/lib/queries/dashboard";

// Leaflet touches `window`/`document` at module load time, which breaks
// server rendering — load the actual map only on the client.
const ExceptionHeatmapInner = dynamic(
  () => import("./exception-heatmap-inner").then((mod) => mod.ExceptionHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-dark-slate/10 bg-app-surface text-sm text-foreground/50">
        Loading map…
      </div>
    ),
  },
);

export function ExceptionHeatmap(props: {
  heatPoints: HeatPoint[];
  incidents: Incident[];
  exceptionLinkBase: string;
}) {
  return <ExceptionHeatmapInner {...props} />;
}

