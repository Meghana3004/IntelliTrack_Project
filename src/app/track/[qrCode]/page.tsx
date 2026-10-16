import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RouteReplayMap } from "@/components/tracking/route-replay-map";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception reported",
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  const { qrCode } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { qrCode },
    include: { gpsPings: { orderBy: { timestamp: "asc" } } },
  });
  if (!delivery) notFound();

  const [originWarehouse, destWarehouse] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id: delivery.originWarehouseId } }),
    prisma.warehouse.findUnique({ where: { id: delivery.destWarehouseId } }),
  ]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm font-medium text-accent">IntelliTrack</p>
        <h1 className="text-2xl font-semibold text-foreground">{delivery.qrCode}</h1>
        <p className="text-sm text-foreground/60">
          {originWarehouse?.name ?? "Unknown"} → {destWarehouse?.name ?? "Unknown"}
        </p>
      </div>

      <div className="rounded-lg border border-dark-slate/10 bg-app-surface p-4 text-sm">
        <p>
          Status:{" "}
          <span className="font-medium text-foreground">
            {STATUS_LABEL[delivery.status] ?? delivery.status}
          </span>
        </p>
        <p className="mt-1 text-foreground/60">Scheduled {delivery.scheduledEta.toLocaleString()}</p>
        {delivery.actualEta && (
          <p className="text-foreground/60">Delivered {delivery.actualEta.toLocaleString()}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Route history</p>
        <RouteReplayMap
          points={delivery.gpsPings.map((p) => ({
            lat: p.lat,
            lng: p.lng,
            timestamp: p.timestamp.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
