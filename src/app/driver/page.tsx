import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryQr } from "@/components/tracking/delivery-qr";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};

export default async function DriverHome({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; delivered?: string }>;
}) {
  const { submitted, delivered } = await searchParams;
  const session = await getServerSession(authOptions);
  const driver = await prisma.driver.findUnique({
    where: { userId: session!.user.id },
  });

  const [deliveries, warehouses, driverExceptions] = await Promise.all([
    driver
      ? prisma.delivery.findMany({
          where: { driverId: driver.id },
          orderBy: { scheduledEta: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.warehouse.findMany(),
    driver
      ? prisma.exception.findMany({
          where: { delivery: { driverId: driver.id } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name ?? "Unknown";

  // Most recent exception per delivery (ordered desc above, so first wins).
  const latestExceptionByDeliveryId = new Map<string, (typeof driverExceptions)[number]>();
  for (const exception of driverExceptions) {
    if (!latestExceptionByDeliveryId.has(exception.deliveryId)) {
      latestExceptionByDeliveryId.set(exception.deliveryId, exception);
    }
  }

  const autoDelayByDeliveryId = new Map(
    driverExceptions
      .filter((exception) => exception.status === "OPEN" && exception.description.startsWith("Auto-detected: "))
      .map((exception) => [exception.deliveryId, exception]),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 pb-20">
      <h1 className="text-xl font-semibold text-foreground">My Deliveries</h1>

      {submitted && (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
          Exception reported successfully.
        </p>
      )}

      {delivered && (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
          Delivery marked as delivered.
        </p>
      )}

      {deliveries.length === 0 ? (
        <p className="text-sm text-foreground/60">No deliveries assigned yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {deliveries.map((delivery) => {
            const autoDelayException = autoDelayByDeliveryId.get(delivery.id);
            const latestException = latestExceptionByDeliveryId.get(delivery.id);
            return (
              <li
                key={delivery.id}
                className="flex flex-col gap-3 rounded-lg border border-dark-slate/10 bg-app-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{delivery.qrCode}</p>
                    <p className="text-sm text-foreground/60">
                      {warehouseName(delivery.originWarehouseId)} → {warehouseName(delivery.destWarehouseId)}
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">
                      Scheduled {delivery.scheduledEta.toLocaleString()} ·{" "}
                      {STATUS_LABEL[delivery.status] ?? delivery.status}
                    </p>
                  </div>
                  {delivery.status !== "DELIVERED" && <DeliveryQr qrCode={delivery.qrCode} size={56} />}
                </div>
                <div className="flex flex-col gap-2">
                  {delivery.status !== "DELIVERED" && (
                    <Link
                      href={`/driver/delivery/${delivery.id}/complete`}
                      className="flex min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-medium text-accent transition hover:bg-accent/10"
                    >
                      Mark Delivered
                    </Link>
                  )}
                  {delivery.status === "IN_TRANSIT" && (
                    <Link
                      href={`/driver/exception/new?deliveryId=${delivery.id}`}
                      className="flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Report Exception
                    </Link>
                  )}
                  {latestException && (
                    <Link
                      href={`/driver/exception/${latestException.id}`}
                      className="flex min-h-11 items-center justify-center rounded-md border border-dark-slate/15 px-4 text-sm font-medium text-foreground/70 transition hover:border-accent hover:text-accent"
                    >
                      View Exception
                    </Link>
                  )}
                </div>
                {autoDelayException && (
                  <Link
                    href={`/driver/exception/${autoDelayException.id}/reason`}
                    className="flex min-h-11 items-center rounded-md border border-severity-severe/30 bg-severity-severe/10 px-3 text-sm font-medium text-severity-severe transition hover:bg-severity-severe/20"
                  >
                    Delivery {delivery.qrCode} is delayed — please report a reason
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
