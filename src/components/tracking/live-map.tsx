"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`/`document` at module load time, which breaks
// server rendering — load the actual map only on the client.
const LiveMapInner = dynamic(() => import("./live-map-inner").then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-lg border border-dark-slate/10 bg-app-surface text-sm text-foreground/50">
      Loading map…
    </div>
  ),
});

export function LiveMap() {
  return <LiveMapInner />;
}
