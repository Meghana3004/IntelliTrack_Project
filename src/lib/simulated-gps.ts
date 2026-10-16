export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Simulates a driver's in-transit GPS position along a delivery's route,
 * deterministically derived from the delivery id — never real device
 * geolocation, per project GPS-simulation constraint.
 */
export function simulateDeliveryGps(deliveryId: string, origin: GeoPoint, dest: GeoPoint): GeoPoint {
  let hash = 0;
  for (let i = 0; i < deliveryId.length; i++) {
    hash = (hash * 31 + deliveryId.charCodeAt(i)) | 0;
  }
  const t = 0.4 + (Math.abs(hash) % 50) / 100; // 40%-89% of the way along the route

  return {
    lat: origin.lat + (dest.lat - origin.lat) * t,
    lng: origin.lng + (dest.lng - origin.lng) * t,
  };
}

/**
 * Deterministically scatters a point around a center (e.g. a warehouse) so
 * markers without real GPS data (most seeded exceptions) don't all stack on
 * the same pixel on the heatmap.
 */
export function jitterAroundPoint(seed: string, center: GeoPoint, spread = 0.2): GeoPoint {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const magnitude = Math.abs(hash);
  const angle = (magnitude % 360) * (Math.PI / 180);
  const radius = ((magnitude >> 9) % 100) / 100 * spread;

  return {
    lat: center.lat + Math.cos(angle) * radius,
    lng: center.lng + Math.sin(angle) * radius,
  };
}
