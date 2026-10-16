import { SeverityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { RecommendationList, type RecommendationData } from "@/components/regional/recommendation-list";

export interface ExceptionDetailData {
  id: string;
  type: string;
  description: string;
  severity: string | null;
  slaStatus: string;
  status: string;
  photoUrls: string;
  gpsLat: number | null;
  gpsLng: number | null;
  aiSummary: string | null;
  resolutionNotes: string | null;
  createdAt: Date;
}

/**
 * Read-only exception detail view shared by /regional and /leadership —
 * warehouse-level triage actions (assign/escalate/resolve) live only on the
 * Warehouse Manager's detail page.
 */
export function ExceptionDetailView({
  exception,
  qrCode,
  originWarehouseName,
  destWarehouseName,
  driverName,
  assignedToName,
  modeledCost,
  recommendations,
}: {
  exception: ExceptionDetailData;
  qrCode: string;
  originWarehouseName: string;
  destWarehouseName: string;
  driverName: string;
  assignedToName: string | null;
  modeledCost: number;
  recommendations: RecommendationData[];
}) {
  const photos: string[] = JSON.parse(exception.photoUrls || "[]");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {qrCode} — {exception.type}
          </h1>
          <SeverityBadge severity={exception.severity} />
          <SlaBadge status={exception.slaStatus} />
          <StatusBadge status={exception.status} />
        </div>
        <p className="text-sm text-foreground/60">
          {originWarehouseName} → {destWarehouseName} · Driver {driverName} · Reported{" "}
          {exception.createdAt.toLocaleString()}
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

      <div className="flex flex-col gap-1 rounded-md border border-dark-slate/10 bg-app-surface p-4 text-sm">
        <p className="text-foreground/70">
          Assigned to: <span className="text-foreground">{assignedToName ?? "Unassigned"}</span>
        </p>
        <p className="text-foreground/70">
          Modeled cost estimate: <span className="text-foreground">${modeledCost.toLocaleString()}</span>{" "}
          <span className="text-xs text-foreground/50">(modeled estimate, not actual spend)</span>
        </p>
      </div>

      {exception.status === "RESOLVED" && exception.resolutionNotes && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <p className="font-medium text-accent">Resolved</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground/80">{exception.resolutionNotes}</p>
        </div>
      )}

      <RecommendationList recommendations={recommendations} />
    </div>
  );
}
