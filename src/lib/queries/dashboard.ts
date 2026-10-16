import { prisma } from "@/lib/prisma";
import { estimateExceptionCost, sumAcceptedCompensation } from "@/lib/rules/cost";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";
import { jitterAroundPoint } from "@/lib/simulated-gps";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export interface DashboardScope {
  /** Most specific wins: warehouseId > regionId > company-wide (all omitted). */
  warehouseId?: string;
  regionId?: string;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  qrCode: string;
  type: string;
  severity: string | null;
  slaStatus: string;
  status: string;
  warehouseName: string;
  createdAt: string;
}

export interface DashboardKpis {
  totalDeliveries: number;
  totalExceptions: number;
  activeExceptions: number;
  slaBreachRate: number;
  avgResolutionHours: number | null;
  modeledCostImpact: number;
  windowDays: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  heatPoints: HeatPoint[];
  incidents: Incident[];
}

export async function scopedWarehouses(scope: DashboardScope) {
  if (scope.warehouseId) {
    return prisma.warehouse.findMany({ where: { id: scope.warehouseId } });
  }
  return prisma.warehouse.findMany({
    where: scope.regionId ? { regionId: scope.regionId } : undefined,
  });
}

export async function getDashboardData(scope: DashboardScope): Promise<DashboardData> {
  const warehouses = await scopedWarehouses(scope);
  const warehouseIds = warehouses.map((w) => w.id);
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  const windowStart = new Date(Date.now() - WINDOW_DAYS * DAY_MS);

  const [totalDeliveries, exceptions] = await Promise.all([
    prisma.delivery.count({
      where: { originWarehouseId: { in: warehouseIds }, scheduledEta: { gte: windowStart } },
    }),
    prisma.exception.findMany({
      where: {
        delivery: { originWarehouseId: { in: warehouseIds } },
        createdAt: { gte: windowStart },
      },
      include: { delivery: true, recommendations: true },
    }),
  ]);

  const resolvedIds = exceptions.filter((e) => e.status === "RESOLVED").map((e) => e.id);
  const resolutionNotifications = resolvedIds.length
    ? await prisma.notification.findMany({
        where: { type: "EXCEPTION_RESOLVED", relatedExceptionId: { in: resolvedIds } },
      })
    : [];
  const resolvedAtByExceptionId = new Map(
    resolutionNotifications.map((n) => [n.relatedExceptionId as string, n.createdAt]),
  );

  const breachedCount = exceptions.filter((e) => e.slaStatus === "BREACHED").length;
  const activeExceptions = exceptions.filter((e) => e.status !== "RESOLVED").length;

  const resolutionHours: number[] = [];
  let modeledCostImpact = 0;
  const heatCounts = new Map<string, number>();
  const incidents: Incident[] = [];

  for (const exception of exceptions) {
    const warehouse = warehouseById.get(exception.delivery.originWarehouseId);
    if (!warehouse) continue;

    heatCounts.set(warehouse.id, (heatCounts.get(warehouse.id) ?? 0) + 1);

    const resolvedAt = resolvedAtByExceptionId.get(exception.id);
    if (resolvedAt) {
      resolutionHours.push((resolvedAt.getTime() - exception.createdAt.getTime()) / (1000 * 60 * 60));
    }

    modeledCostImpact += estimateExceptionCost({
      type: exception.type as ExceptionType,
      severity: exception.severity,
      slaStatus: exception.slaStatus as SlaStatus,
      scheduledEta: exception.delivery.scheduledEta,
      reportedAt: exception.createdAt,
      acceptedCompensationTotal: sumAcceptedCompensation(exception.recommendations),
    });

    const position = exception.gpsLat != null && exception.gpsLng != null
      ? { lat: exception.gpsLat, lng: exception.gpsLng }
      : jitterAroundPoint(exception.id, { lat: warehouse.lat, lng: warehouse.lng });

    incidents.push({
      id: exception.id,
      lat: position.lat,
      lng: position.lng,
      qrCode: exception.delivery.qrCode,
      type: exception.type,
      severity: exception.severity,
      slaStatus: exception.slaStatus,
      status: exception.status,
      warehouseName: warehouse.name,
      createdAt: exception.createdAt.toISOString(),
    });
  }

  const heatPoints: HeatPoint[] = warehouses.map((w) => ({
    lat: w.lat,
    lng: w.lng,
    weight: heatCounts.get(w.id) ?? 0,
  }));

  return {
    kpis: {
      totalDeliveries,
      totalExceptions: exceptions.length,
      activeExceptions,
      slaBreachRate: exceptions.length ? Math.round((breachedCount / exceptions.length) * 100) : 0,
      avgResolutionHours: resolutionHours.length
        ? Math.round(resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length)
        : null,
      modeledCostImpact,
      windowDays: WINDOW_DAYS,
    },
    heatPoints,
    incidents,
  };
}
