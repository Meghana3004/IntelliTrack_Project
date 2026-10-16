"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";
import type { HeatPoint, Incident } from "@/lib/queries/dashboard";

const SEVERITY_CSS_VAR: Record<string, string> = {
  NONE: "--color-severity-none",
  MINOR: "--color-severity-minor",
  MODERATE: "--color-severity-moderate",
  SEVERE: "--color-severity-severe",
};

// Leaflet needs literal color strings (can't use Tailwind classes), so read
// the same CSS custom properties the token config defines in globals.css
// rather than hand-copying hex values that could drift out of sync.
function severityColor(severity: string | null): string {
  const key = severity ?? "NONE";
  if (typeof window === "undefined") return "#9ca3af";
  return getComputedStyle(document.documentElement).getPropertyValue(SEVERITY_CSS_VAR[key]).trim() || "#9ca3af";
}

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0 || points.every((p) => p.weight === 0)) return;
    const maxWeight = Math.max(...points.map((p) => p.weight), 1);
    const layer = L.heatLayer(
      points.map((p) => [p.lat, p.lng, p.weight / maxWeight]),
      { radius: 45, blur: 35, maxZoom: 10 },
    );
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, points]);

  return null;
}

export function ExceptionHeatmap({
  heatPoints,
  incidents,
  exceptionLinkBase,
}: {
  heatPoints: HeatPoint[];
  incidents: Incident[];
  exceptionLinkBase: string;
}) {
  const center: [number, number] = heatPoints.length
    ? [
        heatPoints.reduce((sum, p) => sum + p.lat, 0) / heatPoints.length,
        heatPoints.reduce((sum, p) => sum + p.lng, 0) / heatPoints.length,
      ]
    : [39.8, -98.6];

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-lg border border-dark-slate/10">
      <MapContainer center={center} zoom={4} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={heatPoints} />
        {incidents.map((incident) => (
          <CircleMarker
            key={incident.id}
            center={[incident.lat, incident.lng]}
            radius={6}
            pathOptions={{
              color: severityColor(incident.severity),
              fillColor: severityColor(incident.severity),
              fillOpacity: 0.8,
            }}
            eventHandlers={{
              mouseover: (e: L.LeafletMouseEvent) => e.target.openPopup(),
              mouseout: (e: L.LeafletMouseEvent) => e.target.closePopup(),
            }}
          >
            <Popup>
              <div className="flex flex-col gap-1 text-xs">
                <p className="font-semibold">
                  {incident.qrCode} — {incident.type}
                </p>
                <p>{incident.warehouseName}</p>
                <p>
                  Severity: {incident.severity ?? "None"} ·{" "}
                  {incident.slaStatus === "BREACHED" ? "SLA Breached" : "Within SLA"}
                </p>
                <Link href={`${exceptionLinkBase}/${incident.id}`} className="font-medium text-accent underline">
                  View details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
