import path from "node:path";
import { PrismaClient, Role, CarrierType } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

// See src/lib/prisma.ts for why this is an explicit absolute path.
const dbPath = path.join(process.cwd(), "prisma", "local.db");
const prisma = new PrismaClient({ datasourceUrl: `file:${dbPath}` });

const DEMO_PASSWORD = "demo1234";
const DAY_MS = 24 * 60 * 60 * 1000;

// Deterministic PRNG so re-running the seed produces the same demo data.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

async function clearDatabase() {
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.callbackRequest.deleteMany();
  await prisma.customerFeedback.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.gpsPing.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.carrier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.region.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  // Force rollback-journal (non-WAL) mode so the committed local.db has no
  // -shm/-wal sidecar files judges would need to copy alongside it.
  // PRAGMA journal_mode returns the resulting mode as a row, which SQLite
  // rejects from $executeRawUnsafe ("Execute returned results") — needs
  // $queryRawUnsafe instead, even though we don't use the returned value.
  await prisma.$queryRawUnsafe("PRAGMA journal_mode=DELETE;");
  await clearDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Regions ---
  const regionDefs = [
    { name: "Northeast Region" },
    { name: "Central Region" },
    { name: "West Region" },
  ];
  const regions = [];
  for (const def of regionDefs) {
    regions.push(await prisma.region.create({ data: def }));
  }

  // --- Warehouses ---
  const warehouseDefs = [
    { name: "Newark DC", regionIdx: 0, lat: 40.7357, lng: -74.1724 },
    { name: "Boston DC", regionIdx: 0, lat: 42.3601, lng: -71.0589 },
    { name: "Chicago DC", regionIdx: 1, lat: 41.8781, lng: -87.6298 },
    { name: "Dallas DC", regionIdx: 1, lat: 32.7767, lng: -96.797 },
    { name: "Los Angeles DC", regionIdx: 2, lat: 34.0522, lng: -118.2437 },
  ];
  const warehouses = [];
  for (const def of warehouseDefs) {
    warehouses.push(
      await prisma.warehouse.create({
        data: {
          name: def.name,
          regionId: regions[def.regionIdx].id,
          lat: def.lat,
          lng: def.lng,
        },
      }),
    );
  }
  const CHICAGO_IDX = 2;

  // --- Carriers ---
  const internalCarrier = await prisma.carrier.create({
    data: { name: "IntelliTrack Fleet", type: CarrierType.INTERNAL },
  });
  const swiftHaul = await prisma.carrier.create({
    data: { name: "SwiftHaul Logistics", type: CarrierType.THIRD_PARTY },
  });
  const metroLine = await prisma.carrier.create({
    data: { name: "MetroLine Carriers", type: CarrierType.THIRD_PARTY },
  });
  const carriers = [internalCarrier, swiftHaul, metroLine];

  // --- Routes ---
  const routeDefs = [
    { name: "Newark <> Boston", o: 0, d: 1 },
    { name: "Chicago <> Dallas Express", o: 2, d: 3 },
    { name: "Dallas <> LA", o: 3, d: 4 },
    { name: "Newark <> Chicago", o: 0, d: 2 },
    { name: "Boston <> Chicago", o: 1, d: 2 },
    { name: "LA <> Chicago", o: 4, d: 2 },
    { name: "Newark <> Dallas", o: 0, d: 3 },
    { name: "Boston <> LA", o: 1, d: 4 },
  ];
  const routes = [];
  for (const def of routeDefs) {
    const origin = warehouses[def.o];
    const dest = warehouses[def.d];
    routes.push(
      await prisma.route.create({
        data: {
          name: def.name,
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: dest.lat,
          destLng: dest.lng,
          waypoints: JSON.stringify([
            { lat: origin.lat, lng: origin.lng },
            { lat: dest.lat, lng: dest.lng },
          ]),
        },
      }),
    );
  }
  const patternRoute = routes[1]; // Chicago <> Dallas Express

  // --- Demo login users (one per role) + 15 Drivers ---
  const driverFirstNames = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Drew",
    "Cameron", "Skyler", "Reese", "Quinn", "Rowan", "Sawyer", "Emerson",
  ];

  // Drivers #3 and #7 (0-indexed 2 and 6) are deliberately concentrated on
  // SwiftHaul so the driver-level pattern also reads as a carrier-level one.
  const patternDriverIdxs = [2, 6];

  const drivers: { userId: string; driverId: string; carrierId: string }[] =
    [];
  for (let i = 0; i < 15; i++) {
    const idx = i + 1;
    const carrier = patternDriverIdxs.includes(i)
      ? swiftHaul
      : pick(carriers);
    const user = await prisma.user.create({
      data: {
        name: `${driverFirstNames[i]} Driver`,
        email: `driver${idx}@demo.com`,
        passwordHash,
        role: Role.DRIVER,
      },
    });
    const driver = await prisma.driver.create({
      data: { userId: user.id, carrierId: carrier.id },
    });
    drivers.push({
      userId: user.id,
      driverId: driver.id,
      carrierId: carrier.id,
    });
  }

  const warehouseManager = await prisma.user.create({
    data: {
      name: "Warehouse Manager One",
      email: "warehouse1@demo.com",
      passwordHash,
      role: Role.WAREHOUSE_MANAGER,
      warehouseId: warehouses[CHICAGO_IDX].id, // Chicago DC — the hotspot warehouse
    },
  });

  await prisma.user.create({
    data: {
      name: "Regional Manager One",
      email: "regional1@demo.com",
      passwordHash,
      role: Role.REGIONAL_MANAGER,
      regionId: regions[1].id, // Central Region (owns Chicago + Dallas)
    },
  });

  await prisma.user.create({
    data: {
      name: "Customer Service One",
      email: "customerservice1@demo.com",
      passwordHash,
      role: Role.CUSTOMER_SERVICE,
    },
  });

  await prisma.user.create({
    data: {
      name: "Leadership One",
      email: "leadership1@demo.com",
      passwordHash,
      role: Role.LEADERSHIP,
    },
  });

  const customerUsers = [];
  for (let i = 1; i <= 5; i++) {
    customerUsers.push(
      await prisma.user.create({
        data: {
          name: `Customer ${i}`,
          email: `customer${i}@demo.com`,
          passwordHash,
          role: Role.CUSTOMER,
        },
      }),
    );
  }

  // --- Deliveries (~200 over the last 30 days) ---
  const now = Date.now();
  const deliveries: {
    id: string;
    status: string;
    driverIdx: number | null;
  }[] = [];

  const DELIVERY_COUNT = 200;
  for (let i = 0; i < DELIVERY_COUNT; i++) {
    const daysAgo = randInt(0, 30);
    const scheduledEta = new Date(
      now - daysAgo * DAY_MS + randInt(-6, 6) * 60 * 60 * 1000,
    );

    // Chicago DC is weighted as the busiest origin warehouse (heatmap hotspot).
    const originIdx = rand() < 0.35 ? CHICAGO_IDX : randInt(0, warehouses.length - 1);
    let destIdx = randInt(0, warehouses.length - 1);
    if (destIdx === originIdx) destIdx = (destIdx + 1) % warehouses.length;

    // Driver #1 (driver1@demo.com, the demo login) is excluded from this
    // random pool — they get a small, hand-picked set of deliveries below
    // instead, so the demo login always has a predictable, reasonably sized
    // list with a guaranteed in-transit delivery to raise an exception on.
    const useDriver = daysAgo > 0 || rand() < 0.7;
    const driverIdx = useDriver ? randInt(1, drivers.length - 1) : null;
    const driverPick = driverIdx === null ? null : drivers[driverIdx];
    const carrierId = driverPick ? driverPick.carrierId : pick(carriers).id;

    // Occasionally route this delivery along the pattern route.
    const routeForDelivery = rand() < 0.08 ? patternRoute : pick(routes);

    let status: string;
    let actualEta: Date | null = null;
    if (daysAgo === 0) {
      status = rand() < 0.5 ? "SCHEDULED" : "IN_TRANSIT";
    } else {
      status = "DELIVERED";
      actualEta = new Date(
        scheduledEta.getTime() + randInt(-2, 4) * 60 * 60 * 1000,
      );
    }

    const delivery = await prisma.delivery.create({
      data: {
        qrCode: `ITK-${String(i + 1).padStart(5, "0")}`,
        customerId: pick(customerUsers).id,
        originWarehouseId: warehouses[originIdx].id,
        destWarehouseId: warehouses[destIdx].id,
        driverId: driverPick?.driverId ?? null,
        carrierId,
        routeId: routeForDelivery.id,
        status,
        scheduledEta,
        actualEta,
      },
    });

    deliveries.push({ id: delivery.id, status, driverIdx });
  }

  // --- Driver #1's own deliveries (driver1@demo.com, the demo login): a
  //     small, fixed set of 5 rather than whatever the random pool above
  //     happened to assign, with a guaranteed mix of statuses so the demo
  //     login always has an IN_TRANSIT delivery to raise a new exception on
  //     (only IN_TRANSIT deliveries show "Report Exception"). ---
  const demoDriver = drivers[0];
  const demoDriverDeliveryDefs = [
    { status: "IN_TRANSIT", hoursFromNow: -2, originIdx: CHICAGO_IDX },
    { status: "IN_TRANSIT", hoursFromNow: 5, originIdx: null },
    { status: "SCHEDULED", hoursFromNow: 9, originIdx: null },
    { status: "DELIVERED", hoursFromNow: -30, originIdx: null },
    { status: "DELIVERED", hoursFromNow: -60, originIdx: null },
  ] as const;

  for (let i = 0; i < demoDriverDeliveryDefs.length; i++) {
    const def = demoDriverDeliveryDefs[i];
    const scheduledEta = new Date(now + def.hoursFromNow * 60 * 60 * 1000);
    const originIdx = def.originIdx ?? randInt(0, warehouses.length - 1);
    let destIdx = randInt(0, warehouses.length - 1);
    if (destIdx === originIdx) destIdx = (destIdx + 1) % warehouses.length;

    await prisma.delivery.create({
      data: {
        qrCode: `ITK-${String(DELIVERY_COUNT + i + 1).padStart(5, "0")}`,
        customerId: pick(customerUsers).id,
        originWarehouseId: warehouses[originIdx].id,
        destWarehouseId: warehouses[destIdx].id,
        driverId: demoDriver.driverId,
        carrierId: demoDriver.carrierId,
        routeId: pick(routes).id,
        status: def.status,
        scheduledEta,
        actualEta:
          def.status === "DELIVERED"
            ? new Date(scheduledEta.getTime() + randInt(1, 3) * 60 * 60 * 1000)
            : null,
      },
    });
  }

  // --- Simulated GPS pings for trackable (non-SCHEDULED) deliveries, so
  //     /track can replay a route ---
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const trackableDeliveries = await prisma.delivery.findMany({
    where: { status: { not: "SCHEDULED" } },
    select: {
      id: true,
      originWarehouseId: true,
      destWarehouseId: true,
      scheduledEta: true,
      actualEta: true,
    },
  });
  const PING_COUNT = 6;
  for (const d of trackableDeliveries) {
    const origin = warehouseById.get(d.originWarehouseId);
    const dest = warehouseById.get(d.destWarehouseId);
    if (!origin || !dest) continue;

    const startTime = d.scheduledEta.getTime() - 10 * 60 * 60 * 1000;
    const endTime = d.actualEta
      ? d.actualEta.getTime()
      : Math.min(now, d.scheduledEta.getTime() + 2 * 60 * 60 * 1000);

    for (let i = 0; i < PING_COUNT; i++) {
      const t = i / (PING_COUNT - 1);
      const jitterLat = (rand() - 0.5) * 0.1;
      const jitterLng = (rand() - 0.5) * 0.1;
      await prisma.gpsPing.create({
        data: {
          deliveryId: d.id,
          lat: origin.lat + (dest.lat - origin.lat) * t + jitterLat,
          lng: origin.lng + (dest.lng - origin.lng) * t + jitterLng,
          timestamp: new Date(startTime + (endTime - startTime) * t),
        },
      });
    }
  }

  // --- Exceptions (~30, weighted so drivers #3 & #7 / SwiftHaul / the
  //     Chicago<>Dallas route show an obvious repeated pattern) ---
  const EXCEPTION_TYPES = ["DELAYED", "DAMAGED", "REJECTED"] as const;
  const SEVERITIES = ["MINOR", "MODERATE", "SEVERE"] as const;
  const STATUSES = ["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED"] as const;

  const eligibleDeliveries = deliveries.filter((d) => d.status !== "SCHEDULED");
  const usedDeliveryIds = new Set<string>();
  let exceptionCount = 0;

  async function createExceptionFor(deliveryId: string) {
    const type = pick(EXCEPTION_TYPES);
    const isDamaged = type === "DAMAGED";
    const createdAt = new Date(now - randInt(0, 30) * DAY_MS);
    const slaStatus = rand() < 0.4 ? "BREACHED" : "WITHIN_SLA";

    await prisma.exception.create({
      data: {
        deliveryId,
        type,
        description: `${type} reported for delivery ${deliveryId}`,
        severity: isDamaged ? pick(SEVERITIES) : null,
        slaStatus,
        photoUrls: isDamaged
          ? JSON.stringify(["/uploads/placeholder-damage.jpg"])
          : "[]",
        status: pick(STATUSES),
        createdAt,
      },
    });
    usedDeliveryIds.add(deliveryId);
    exceptionCount++;
  }

  // Driver-level + carrier-level pattern: 4-5 exceptions each for the two
  // SwiftHaul pattern drivers.
  for (const idx of patternDriverIdxs) {
    const candidates = eligibleDeliveries.filter(
      (d) => d.driverIdx === idx && !usedDeliveryIds.has(d.id),
    );
    for (const d of candidates.slice(0, randInt(4, 5))) {
      await createExceptionFor(d.id);
    }
  }

  // Route-level pattern: 4 exceptions on the Chicago<>Dallas Express route.
  const routeDeliveries = await prisma.delivery.findMany({
    where: { routeId: patternRoute.id, status: { not: "SCHEDULED" } },
  });
  for (const d of routeDeliveries.slice(0, 4)) {
    if (usedDeliveryIds.has(d.id)) continue;
    await createExceptionFor(d.id);
  }

  // Remaining exceptions spread thinly across other deliveries (max 1 each).
  const TARGET_EXCEPTIONS = 30;
  const remainingPool = eligibleDeliveries.filter(
    (d) => !usedDeliveryIds.has(d.id),
  );
  while (exceptionCount < TARGET_EXCEPTIONS && remainingPool.length > 0) {
    const idx = randInt(0, remainingPool.length - 1);
    const [d] = remainingPool.splice(idx, 1);
    await createExceptionFor(d.id);
  }

  // Reflect open exceptions back onto their delivery's status.
  const openExceptions = await prisma.exception.findMany({
    where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
    select: { id: true, deliveryId: true, type: true },
  });
  for (const ex of openExceptions) {
    await prisma.delivery.update({
      where: { id: ex.deliveryId },
      data: { status: "EXCEPTION" },
    });
  }

  // --- Notifications for the warehouse manager for open exceptions at Chicago DC ---
  const chicagoOpenExceptions = await prisma.exception.findMany({
    where: {
      status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] },
      delivery: { originWarehouseId: warehouses[CHICAGO_IDX].id },
    },
  });
  for (const ex of chicagoOpenExceptions) {
    await prisma.notification.create({
      data: {
        userId: warehouseManager.id,
        type: "EXCEPTION_CREATED",
        message: `New ${ex.type.toLowerCase()} exception reported.`,
        relatedExceptionId: ex.id,
      },
    });
  }

  // Backfill an EXCEPTION_RESOLVED notification (read, so it doesn't clutter
  // anyone's unread bell) with a realistic resolved-at timestamp for every
  // RESOLVED exception — the same signal the app's real resolve action
  // produces, used by the Regional/Leadership dashboards to compute avg
  // resolution time.
  const allDrivers = await prisma.driver.findMany();
  const driverUserIdByDriverId = new Map(allDrivers.map((d) => [d.id, d.userId]));

  const resolvedExceptions = await prisma.exception.findMany({
    where: { status: "RESOLVED" },
    include: { delivery: true },
  });
  for (const ex of resolvedExceptions) {
    const resolvedAt = new Date(ex.createdAt.getTime() + randInt(2, 72) * 60 * 60 * 1000);
    const driverUserId = ex.delivery.driverId
      ? driverUserIdByDriverId.get(ex.delivery.driverId)
      : undefined;
    await prisma.notification.create({
      data: {
        userId: driverUserId ?? warehouseManager.id,
        type: "EXCEPTION_RESOLVED",
        message: `Your reported exception for delivery ${ex.delivery.qrCode} was resolved.`,
        relatedExceptionId: ex.id,
        read: true,
        createdAt: resolvedAt,
      },
    });
  }

  console.log(
    `Seeded ${regions.length} regions, ${warehouses.length} warehouses, ` +
      `${carriers.length} carriers, ${drivers.length} drivers, ` +
      `${DELIVERY_COUNT + demoDriverDeliveryDefs.length} deliveries, ${exceptionCount} exceptions.`,
  );
  console.log(
    "  driver1@demo.com has 5 deliveries: 2 in transit (can raise an exception), " +
      "1 scheduled, 2 delivered.",
  );
  console.log("Demo logins (password: demo1234):");
  console.log(
    "  driver1@demo.com, warehouse1@demo.com, regional1@demo.com,",
  );
  console.log(
    "  customerservice1@demo.com, leadership1@demo.com, customer1@demo.com",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
