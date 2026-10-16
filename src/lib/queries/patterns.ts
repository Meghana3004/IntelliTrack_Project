import { prisma } from "@/lib/prisma";
import { phraseInsight } from "@/lib/ai/provider";
import { scopedWarehouses, type DashboardScope } from "./dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PatternDimension = "driver" | "carrier" | "route" | "warehouse";

export interface PatternGroup {
  dimension: PatternDimension;
  key: string;
  label: string;
  count: number;
  topType: string;
  exceptionIds: string[];
  insight: string;
}

interface Bucket {
  count: number;
  ids: string[];
  types: Record<string, number>;
}

/**
 * Groups Exceptions by driver/carrier/route/warehouse over a window and
 * surfaces groups meeting a threshold as a repeated pattern. Grouping and
 * thresholding is pure rule logic — only the final insight sentence is
 * phrased by Gemini (with a deterministic fallback).
 */
export async function getExceptionPatterns(
  scope: DashboardScope,
  { windowDays = 30, threshold = 3 }: { windowDays?: number; threshold?: number } = {},
): Promise<PatternGroup[]> {
  const warehouses = await scopedWarehouses(scope);
  const warehouseIds = warehouses.map((w) => w.id);
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  const windowStart = new Date(Date.now() - windowDays * DAY_MS);
  const exceptions = await prisma.exception.findMany({
    where: {
      delivery: { originWarehouseId: { in: warehouseIds } },
      createdAt: { gte: windowStart },
    },
    include: { delivery: true },
  });

  const buckets: Record<PatternDimension, Map<string, Bucket>> = {
    driver: new Map(),
    carrier: new Map(),
    route: new Map(),
    warehouse: new Map(),
  };

  function addTo(dimension: PatternDimension, key: string | null, exceptionId: string, type: string) {
    if (!key) return;
    const map = buckets[dimension];
    const bucket = map.get(key) ?? { count: 0, ids: [], types: {} };
    bucket.count += 1;
    bucket.ids.push(exceptionId);
    bucket.types[type] = (bucket.types[type] ?? 0) + 1;
    map.set(key, bucket);
  }

  for (const exception of exceptions) {
    addTo("driver", exception.delivery.driverId, exception.id, exception.type);
    addTo("carrier", exception.delivery.carrierId, exception.id, exception.type);
    addTo("route", exception.delivery.routeId, exception.id, exception.type);
    addTo("warehouse", exception.delivery.originWarehouseId, exception.id, exception.type);
  }

  const driverIds = [...buckets.driver.keys()];
  const carrierIds = [...buckets.carrier.keys()];
  const routeIds = [...buckets.route.keys()];

  const [drivers, carriers, routes] = await Promise.all([
    driverIds.length ? prisma.driver.findMany({ where: { id: { in: driverIds } } }) : Promise.resolve([]),
    carrierIds.length ? prisma.carrier.findMany({ where: { id: { in: carrierIds } } }) : Promise.resolve([]),
    routeIds.length ? prisma.route.findMany({ where: { id: { in: routeIds } } }) : Promise.resolve([]),
  ]);
  const driverUserIds = drivers.map((d) => d.userId);
  const driverUsers = driverUserIds.length
    ? await prisma.user.findMany({ where: { id: { in: driverUserIds } } })
    : [];
  const driverUserById = new Map(driverUsers.map((u) => [u.id, u]));
  const driverNameById = new Map(
    drivers.map((d) => [d.id, driverUserById.get(d.userId)?.name ?? "Unknown driver"]),
  );
  const carrierNameById = new Map(carriers.map((c) => [c.id, c.name]));
  const routeNameById = new Map(routes.map((r) => [r.id, r.name]));

  function labelFor(dimension: PatternDimension, key: string): string {
    if (dimension === "driver") return driverNameById.get(key) ?? "Unknown driver";
    if (dimension === "carrier") return carrierNameById.get(key) ?? "Unknown carrier";
    if (dimension === "route") return routeNameById.get(key) ?? "Unknown route";
    return warehouseById.get(key)?.name ?? "Unknown warehouse";
  }

  const groups: PatternGroup[] = [];
  for (const dimension of ["driver", "carrier", "route", "warehouse"] as const) {
    for (const [key, bucket] of buckets[dimension]) {
      if (bucket.count < threshold) continue;
      const topType = Object.entries(bucket.types).sort((a, b) => b[1] - a[1])[0][0];
      groups.push({
        dimension,
        key,
        label: labelFor(dimension, key),
        count: bucket.count,
        topType,
        exceptionIds: bucket.ids,
        insight: "",
      });
    }
  }

  groups.sort((a, b) => b.count - a.count);

  await Promise.all(
    groups.map(async (group) => {
      group.insight = await phraseInsight({
        dimension: group.dimension,
        label: group.label,
        count: group.count,
        windowDays,
        topType: group.topType,
      });
    }),
  );

  return groups;
}
