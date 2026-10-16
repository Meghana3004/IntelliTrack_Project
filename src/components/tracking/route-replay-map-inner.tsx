"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

// Leaflet needs literal color strings (can't use Tailwind classes), so read
// the same CSS custom properties the token config defines in globals.css
// rather than hardcoding hex values that could drift out of sync.
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function RouteReplayMap({ points }: { points: GpsPoint[] }) {
  const [index, setIndex] = useState(Math.max(0, points.length - 1));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || index >= points.length - 1) return;
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, points.length - 1)), 800);
    return () => clearTimeout(timer);
  }, [playing, index, points.length]);

  if (points.length === 0) {
    return <p className="text-sm text-foreground/60">No GPS history available for this delivery yet.</p>;
  }

  const path: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const current = points[Math.min(index, points.length - 1)];
  const center = path[Math.min(index, path.length - 1)];
  const accentColor = cssVar("--color-accent", "#3dcd58");
  const markerColor = cssVar("--color-dark-slate", "#1b1f26");

  return (
    <div className="flex flex-col gap-3">
      <div className="h-80 w-full overflow-hidden rounded-lg border border-dark-slate/10">
        <MapContainer center={center} zoom={6} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={path} pathOptions={{ color: accentColor, weight: 3 }} />
          <CircleMarker
            center={center}
            radius={8}
            pathOptions={{ color: markerColor, fillColor: accentColor, fillOpacity: 1 }}
          />
        </MapContainer>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (index >= points.length - 1) setIndex(0);
            setPlaying((p) => !p);
          }}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          className="flex-1"
        />
        <span className="whitespace-nowrap text-xs text-foreground/60">
          {new Date(current.timestamp).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
