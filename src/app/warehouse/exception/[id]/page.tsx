import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SeverityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { RecommendationList } from "@/components/regional/recommendation-list";
import {
  AssignForm,
  EscalateForm,
  ResolveForm,
  GenerateRecommendationForm,
  RecommendationActions,
} from "./exception-actions";

export default async function ExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const warehouseId = session?.user.warehouseId;
  if (!warehouseId) notFound();

  const exception = await prisma.exception.findUnique({
    where: { id },
    include: { delivery: true, recommendations: true },
  });
  if (!exception || exception.delivery.originWarehouseId !== warehouseId) {
    notFound();
  }

  const [warehouseStaff, assignedUser, driver, originWarehouse, destWarehouse] = await Promise.all([
    prisma.user.findMany({ where: { role: "WAREHOUSE_MANAGER", warehouseId } }),
    exception.assignedTo ? prisma.user.findUnique({ where: { id: exception.assignedTo } }) : null,
    exception.delivery.driverId
      ? prisma.driver.findUnique({ where: { id: exception.delivery.driverId } })
      : null,
    prisma.warehouse.findUnique({ where: { id: exception.delivery.originWarehouseId } }),
    prisma.warehouse.findUnique({ where: { id: exception.delivery.destWarehouseId } }),
  ]);

  const driverUser = driver ? await prisma.user.findUnique({ where: { id: driver.userId } }) : null;
  const photos: string[] = JSON.parse(exception.photoUrls || "[]");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {exception.delivery.qrCode} — {exception.type}
          </h1>
          <SeverityBadge severity={exception.severity} />
          <SlaBadge status={exception.slaStatus} />
          <StatusBadge status={exception.status} />
        </div>
        <p className="text-sm text-foreground/60">
          {originWarehouse?.name ?? "Unknown"} → {destWarehouse?.name ?? "Unknown"} · Driver{" "}
          {driverUser?.name ?? "Unassigned"} · Reported {exception.createdAt.toLocaleString()}
        </p>
      </div>

      {exception.aiSummary && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          <p className="font-medium text-accent">AI Summary</p>
          <p className="mt-1">{exception.aiSummary}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
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
                className="h-32 w-32 rounded-md border border-dark-slate/10 object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {(exception.gpsLat || exception.gpsLng) && (
        <p className="text-xs text-foreground/50">
          Reported near {exception.gpsLat?.toFixed(4)}, {exception.gpsLng?.toFixed(4)}
        </p>
      )}

      <div className="flex flex-col gap-1 text-sm text-foreground/70">
        <p>
          Assigned to: <span className="text-foreground">{assignedUser?.name ?? "Unassigned"}</span>
        </p>
      </div>

      {exception.status === "RESOLVED" ? (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <p className="font-medium text-accent">Resolved</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground/80">{exception.resolutionNotes}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 rounded-lg border border-dark-slate/10 bg-app-surface p-4">
          <AssignForm
            key={exception.assignedTo ?? "unassigned"}
            exceptionId={exception.id}
            assignees={warehouseStaff.map((u) => ({ id: u.id, name: u.name }))}
            currentAssigneeId={exception.assignedTo}
          />
          <EscalateForm exceptionId={exception.id} />
          <ResolveForm exceptionId={exception.id} />
        </div>
      )}

      {exception.recommendations.length === 0 ? (
        <GenerateRecommendationForm exceptionId={exception.id} />
      ) : (
        <RecommendationList
          recommendations={exception.recommendations}
          actions={(rec) => (
            <RecommendationActions exceptionId={exception.id} recommendationId={rec.id} accepted={rec.accepted} />
          )}
        />
      )}
    </div>
  );
}
