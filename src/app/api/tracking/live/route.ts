import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopedWarehouses, type DashboardScope } from "@/lib/queries/dashboard";
import { simulateDeliveryGps } from "@/lib/simulated-gps";
import { isOffRoute } from "@/lib/rules/geofence";

const ALLOWED_ROLES = new Set(["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "LEADERSHIP"]);

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Scope is derived strictly from the session, same pattern as
  // app/api/chat/route.ts.
  let scope: DashboardScope;
  if (session.user.role === "WAREHOUSE_MANAGER") {
    if (!session.user.warehouseId) {
      return NextResponse.json({ error: "No warehouse assigned to your account." }, { status: 403 });
    }
    scope = { warehouseId: session.user.warehouseId };
  } else if (session.user.role === "REGIONAL_MANAGER") {
    if (!session.user.regionId) {
      return NextResponse.json({ error: "No region assigned to your account." }, { status: 403 });
    }
    scope = { regionId: session.user.regionId };
  } else {
    scope = {};
  }

  const warehouses = await scopedWarehouses(scope);
  const warehouseIds = warehouses.map((w) => w.id);
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  const deliveries = await prisma.delivery.findMany({
    where: { status: "IN_TRANSIT", originWarehouseId: { in: warehouseIds } },
    include: { gpsPings: { orderBy: { timestamp: "desc" }, take: 1 } },
  });

  // Destination warehouses may fall outside the origin-scoped set (e.g. a
  // regional manager's delivery heading to another region), so fetch any
  // missing ones by id.
  const destIds = deliveries.map((d) => d.destWarehouseId).filter((id) => !warehouseById.has(id));
  if (destIds.length) {
    const destWarehouses = await prisma.warehouse.findMany({ where: { id: { in: destIds } } });
    for (const w of destWarehouses) warehouseById.set(w.id, w);
  }

  const positions: LiveDeliveryPosition[] = [];

  for (const delivery of deliveries) {
    const origin = warehouseById.get(delivery.originWarehouseId);
    const dest = warehouseById.get(delivery.destWarehouseId);
    if (!origin || !dest) continue;

    const latestPing = delivery.gpsPings[0];
    const position = latestPing
      ? { lat: latestPing.lat, lng: latestPing.lng }
      : simulateDeliveryGps(delivery.id, origin, dest);
    const timestamp = latestPing ? latestPing.timestamp.toISOString() : new Date().toISOString();

    positions.push({
      deliveryId: delivery.id,
      qrCode: delivery.qrCode,
      lat: position.lat,
      lng: position.lng,
      timestamp,
      originName: origin.name,
      destName: dest.name,
      offRoute: isOffRoute(position, origin, dest),
    });
  }

  return NextResponse.json({ positions });
}
