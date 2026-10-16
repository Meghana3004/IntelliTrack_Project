"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

interface LiveDeliveryPosition {
  deliveryId: string;
  qrCode: string;
  lat: number;
  lng: number;
  timestamp: string;
  originName: string;
  destName: string;
  offRoute: boolean;
}

const POLL_INTERVAL_MS = 15_000;
const DEFAULT_CENTER: [number, number] = [39.5, -98.35]; // continental US fallback

// Leaflet needs literal color strings (can't use Tailwind classes), so read
// the same CSS custom properties the token config defines in globals.css
// rather than hardcoding hex values that could drift out of sync.
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function LiveMap() {
  const [positions, setPositions] = useState<LiveDeliveryPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/tracking/live");
        if (!res.ok) throw new Error("Failed to load live tracking data.");
        const data = await res.json();
        if (!cancelled) {
          setPositions(data.positions ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Unable to load live tracking data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const accentColor = cssVar("--color-accent", "#3dcd58");
  const offRouteColor = cssVar("--color-severity-severe", "#dc2626");
  const center: [number, number] = positions.length
    ? [positions[0].lat, positions[0].lng]
    : DEFAULT_CENTER;

  if (loading && positions.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-lg border border-dark-slate/10 bg-app-surface text-sm text-foreground/50">
        Loading live positions…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-96 w-full overflow-hidden rounded-lg border border-dark-slate/10">
        <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.map((p) => (
            <CircleMarker
              key={p.deliveryId}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{
                color: p.offRoute ? offRouteColor : accentColor,
                fillColor: p.offRoute ? offRouteColor : accentColor,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{p.qrCode}</span>
                  <span>
                    {p.originName} → {p.destName}
                  </span>
                  {p.offRoute && (
                    <span className="w-fit rounded-full bg-severity-severe px-2 py-0.5 text-xs font-medium text-white">
                      Off expected route
                    </span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="text-xs text-foreground/60">
        {error
          ? error
          : `Tracking ${positions.length} in-transit ${positions.length === 1 ? "delivery" : "deliveries"} — updates every 15s.`}
      </p>
    </div>
  );
}
