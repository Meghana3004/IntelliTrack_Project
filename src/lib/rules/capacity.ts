// Warehouse capacity isn't a real seeded field (frozen schema) — deterministically
// simulate a stable 0-100 utilization value per warehouse, same hash approach as
// simulated GPS elsewhere, so it's consistent across restarts and demo runs.
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Simulated warehouse utilization, 0 (idle) - 100 (at capacity). */
export function simulateWarehouseUtilization(warehouseId: string): number {
  return hashString(`capacity:${warehouseId}`) % 101;
}

/** Simulated available capacity, 0 (full) - 100 (wide open). */
export function simulateWarehouseAvailability(warehouseId: string): number {
  return 100 - simulateWarehouseUtilization(warehouseId);
}
