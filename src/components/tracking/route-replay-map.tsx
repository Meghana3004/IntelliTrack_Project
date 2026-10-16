"use client";

import dynamic from "next/dynamic";
import type { GpsPoint } from "./route-replay-map-inner";

// Leaflet touches `window`/`document` at module load time, which breaks
// server rendering — load the actual map only on the client.
const RouteReplayMapInner = dynamic(
  () => import("./route-replay-map-inner").then((mod) => mod.RouteReplayMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full items-center justify-center rounded-lg border border-dark-slate/10 bg-app-surface text-sm text-foreground/50">
        Loading map…
      </div>
    ),
  },
);

export function RouteReplayMap({ points }: { points: GpsPoint[] }) {
  return <RouteReplayMapInner points={points} />;
}
