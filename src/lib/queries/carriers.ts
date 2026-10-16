import { prisma } from "@/lib/prisma";
import { scopedWarehouses, type DashboardScope } from "./dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SeverityMix {
  NONE: number;
  MINOR: number;
  MODERATE: number;
  SEVERE: number;
}

export type CarrierSortKey = "exceptionRate" | "exceptionCount" | "avgResolutionHours";

export interface CarrierScorecardRow {
  carrierId: string;
  name: string;
  type: string;
  deliveryCount: number;
  exceptionCount: number;
  exceptionRate: number;
  avgResolutionHours: number | null;
  severityMix: SeverityMix;
}

/** Carrier exception-rate scorecard, scoped to a region or company-wide. */
export async function getCarrierScorecard(
  scope: DashboardScope,
  windowDays = 30,
): Promise<CarrierScorecardRow[]> {
  const warehouses = await scopedWarehouses(scope);
  const warehouseIds = warehouses.map((w) => w.id);
  const windowStart = new Date(Date.now() - windowDays * DAY_MS);

  const [deliveries, exceptions] = await Promise.all([
    prisma.delivery.findMany({
      where: { originWarehouseId: { in: warehouseIds }, scheduledEta: { gte: windowStart } },
      select: { id: true, carrierId: true },
    }),
    prisma.exception.findMany({
      where: {
        delivery: { originWarehouseId: { in: warehouseIds } },
        createdAt: { gte: windowStart },
      },
      include: { delivery: { select: { carrierId: true } } },
    }),
  ]);

  // Scope the carrier list itself to carriers actually active in-scope,
  // rather than listing every carrier in the company for a regional view.
  const carrierIds = new Set<string>(deliveries.map((d) => d.carrierId));
  for (const e of exceptions) carrierIds.add(e.delivery.carrierId);
  const carriers = await prisma.carrier.findMany({ where: { id: { in: [...carrierIds] } } });

  const resolvedIds = exceptions.filter((e) => e.status === "RESOLVED").map((e) => e.id);
  const resolutionNotifications = resolvedIds.length
    ? await prisma.notification.findMany({
        where: { type: "EXCEPTION_RESOLVED", relatedExceptionId: { in: resolvedIds } },
      })
    : [];
  const resolvedAtByExceptionId = new Map(
    resolutionNotifications.map((n) => [n.relatedExceptionId as string, n.createdAt]),
  );

  const deliveryCountByCarrier = new Map<string, number>();
  for (const d of deliveries) {
    deliveryCountByCarrier.set(d.carrierId, (deliveryCountByCarrier.get(d.carrierId) ?? 0) + 1);
  }

  const exceptionCountByCarrier = new Map<string, number>();
  const severityByCarrier = new Map<string, SeverityMix>();
  const resolutionHoursByCarrier = new Map<string, number[]>();

  for (const e of exceptions) {
    const carrierId = e.delivery.carrierId;
    exceptionCountByCarrier.set(carrierId, (exceptionCountByCarrier.get(carrierId) ?? 0) + 1);

    const mix = severityByCarrier.get(carrierId) ?? { NONE: 0, MINOR: 0, MODERATE: 0, SEVERE: 0 };
    const key = (e.severity ?? "NONE") as keyof SeverityMix;
    mix[key] += 1;
    severityByCarrier.set(carrierId, mix);

    const resolvedAt = resolvedAtByExceptionId.get(e.id);
    if (resolvedAt) {
      const hours = resolutionHoursByCarrier.get(carrierId) ?? [];
      hours.push((resolvedAt.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60));
      resolutionHoursByCarrier.set(carrierId, hours);
    }
  }

  return carriers.map((carrier) => {
    const deliveryCount = deliveryCountByCarrier.get(carrier.id) ?? 0;
    const exceptionCount = exceptionCountByCarrier.get(carrier.id) ?? 0;
    const hours = resolutionHoursByCarrier.get(carrier.id) ?? [];

    return {
      carrierId: carrier.id,
      name: carrier.name,
      type: carrier.type,
      deliveryCount,
      exceptionCount,
      exceptionRate: deliveryCount ? Math.round((exceptionCount / deliveryCount) * 1000) / 10 : 0,
      avgResolutionHours: hours.length
        ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
        : null,
      severityMix: severityByCarrier.get(carrier.id) ?? { NONE: 0, MINOR: 0, MODERATE: 0, SEVERE: 0 },
    };
  });
}

export function sortCarrierRows(
  rows: CarrierScorecardRow[],
  sort: CarrierSortKey,
  direction: "asc" | "desc",
): CarrierScorecardRow[] {
  return [...rows].sort((a, b) => {
    const aValue = a[sort] ?? -1;
    const bValue = b[sort] ?? -1;
    return direction === "asc" ? aValue - bValue : bValue - aValue;
  });
}
