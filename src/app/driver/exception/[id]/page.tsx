import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SeverityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";

export default async function DriverExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const driver = await prisma.driver.findUnique({ where: { userId: session!.user.id } });
  if (!driver) notFound();

  const exception = await prisma.exception.findUnique({
    where: { id },
    include: { delivery: true },
  });
  if (!exception || exception.delivery.driverId !== driver.id) notFound();

  const [originWarehouse, destWarehouse] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id: exception.delivery.originWarehouseId } }),
    prisma.warehouse.findUnique({ where: { id: exception.delivery.destWarehouseId } }),
  ]);

  const photos: string[] = JSON.parse(exception.photoUrls || "[]");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 pb-20">
      <Link href="/driver" className="text-sm font-medium text-accent">
        ← My Deliveries
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            {exception.delivery.qrCode} — {exception.type}
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={exception.severity} />
          <SlaBadge status={exception.slaStatus} />
          <StatusBadge status={exception.status} />
        </div>
        <p className="text-sm text-foreground/60">
          {originWarehouse?.name ?? "Unknown"} → {destWarehouse?.name ?? "Unknown"} · Reported{" "}
          {exception.createdAt.toLocaleString()}
        </p>
      </div>

      {exception.aiSummary && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          <p className="font-medium text-accent">AI Summary</p>
          <p className="mt-1">{exception.aiSummary}</p>
        </div>
      )}

      <div className="flex flex-col gap-1 rounded-lg border border-dark-slate/10 bg-app-surface p-4">
        <p className="text-sm font-medium text-foreground">Description</p>
        <p className="whitespace-pre-wrap text-sm text-foreground/80">{exception.description}</p>
      </div>

      {photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Photos</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- data URLs / local uploads, not optimizable remote assets
              <img
                key={i}
                src={src}
                alt={`Exception photo ${i + 1}`}
                className="h-28 w-28 rounded-md border border-dark-slate/10 object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {exception.status === "RESOLVED" && exception.resolutionNotes && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <p className="font-medium text-accent">Resolved by warehouse</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground/80">{exception.resolutionNotes}</p>
        </div>
      )}

      {exception.status !== "RESOLVED" && (
        <p className="rounded-lg border border-dashed border-dark-slate/15 px-4 py-3 text-sm text-foreground/60">
          The warehouse hasn&apos;t resolved this yet — status: {exception.status.replace("_", " ").toLowerCase()}.
        </p>
      )}
    </div>
  );
}
