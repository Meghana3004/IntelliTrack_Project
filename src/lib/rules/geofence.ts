import type { GeoPoint } from "@/lib/simulated-gps";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in kilometers (haversine formula). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

/**
 * Shortest distance from a point to a line segment, in kilometers. Treats
 * lat/lng as a flat plane (fine at the short segment lengths this app deals
 * with), projecting the point onto the segment and clamping to its ends
 * before measuring the real (haversine) distance back to the point.
 */
export function distanceToSegmentKm(point: GeoPoint, segStart: GeoPoint, segEnd: GeoPoint): number {
  const dx = segEnd.lng - segStart.lng;
  const dy = segEnd.lat - segStart.lat;

  if (dx === 0 && dy === 0) {
    return distanceKm(point, segStart);
  }

  const t =
    ((point.lng - segStart.lng) * dx + (point.lat - segStart.lat) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));

  const closest: GeoPoint = {
    lat: segStart.lat + clampedT * dy,
    lng: segStart.lng + clampedT * dx,
  };

  return distanceKm(point, closest);
}

/**
 * Flags a delivery as off-route when its current position has drifted more
 * than `thresholdKm` from the expected straight-line path between origin and
 * destination.
 */
export function isOffRoute(point: GeoPoint, origin: GeoPoint, dest: GeoPoint, thresholdKm = 5): boolean {
  return distanceToSegmentKm(point, origin, dest) > thresholdKm;
}
