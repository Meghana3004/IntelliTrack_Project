import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExceptionForm } from "./exception-form";
import type { DeliveryOption } from "./types";

export default async function NewExceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ deliveryId?: string }>;
}) {
  const { deliveryId } = await searchParams;
  const session = await getServerSession(authOptions);
  const driver = await prisma.driver.findUnique({
    where: { userId: session!.user.id },
  });

  const [deliveries, warehouses] = await Promise.all([
    driver
      ? prisma.delivery.findMany({
          where: { driverId: driver.id, status: "IN_TRANSIT" },
          orderBy: { scheduledEta: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.warehouse.findMany(),
  ]);

  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  const deliveryOptions: DeliveryOption[] = deliveries.map((d) => {
    const origin = warehouseById.get(d.originWarehouseId);
    const dest = warehouseById.get(d.destWarehouseId);
    return {
      id: d.id,
      qrCode: d.qrCode,
      scheduledEta: d.scheduledEta.toISOString(),
      origin: origin ? { id: origin.id, name: origin.name, lat: origin.lat, lng: origin.lng } : null,
      dest: dest ? { id: dest.id, name: dest.name, lat: dest.lat, lng: dest.lng } : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 pb-20">
      <h1 className="mb-5 text-xl font-semibold text-foreground">Report an Exception</h1>
      <ExceptionForm deliveries={deliveryOptions} initialDeliveryId={deliveryId} />
    </div>
  );
}
