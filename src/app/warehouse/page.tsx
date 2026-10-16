import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePriorityScore } from "@/lib/rules/sla";
import { SeverityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { WarehouseFilters } from "./warehouse-filters";

const SEVERITY_VALUES = new Set(["NONE", "MINOR", "MODERATE", "SEVERE"]);
const SLA_VALUES = new Set(["WITHIN_SLA", "BREACHED"]);
const STATUS_VALUES = new Set(["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED"]);
const SORT_VALUES = new Set(["priority", "newest", "severity"]);

const SEVERITY_RANK: Record<string, number> = { SEVERE: 3, MODERATE: 2, MINOR: 1, NONE: 0 };

export default async function WarehouseHome({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; slaStatus?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const severity = SEVERITY_VALUES.has(params.severity ?? "") ? params.severity! : "ALL";
  const slaStatus = SLA_VALUES.has(params.slaStatus ?? "") ? params.slaStatus! : "ALL";
  const status =
    params.status === "ALL" || STATUS_VALUES.has(params.status ?? "") ? (params.status ?? "ALL") : "ACTIVE";
  const sort = SORT_VALUES.has(params.sort ?? "") ? params.sort! : "priority";

  const session = await getServerSession(authOptions);
  const warehouseId = session?.user.warehouseId;

  if (!warehouseId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Warehouse Triage</h1>
        <p className="max-w-md text-sm text-foreground/60">
          Your account isn&apos;t assigned to a warehouse yet.
        </p>
      </div>
    );
  }

  const where = {
    delivery: { originWarehouseId: warehouseId },
    ...(severity !== "ALL" ? { severity } : {}),
    ...(slaStatus !== "ALL" ? { slaStatus } : {}),
    ...(status === "ACTIVE" ? { status: { not: "RESOLVED" } } : status !== "ALL" ? { status } : {}),
  };

  const exceptions = await prisma.exception.findMany({
    where,
    include: { delivery: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = exceptions.map((exception) => ({
    exception,
    priority: computePriorityScore({
      type: exception.type as "DELAYED" | "DAMAGED" | "REJECTED",
      severity: exception.severity,
      slaStatus: exception.slaStatus as "WITHIN_SLA" | "BREACHED",
      reportedAt: exception.createdAt,
    }),
  }));

  if (sort === "priority") {
    rows.sort((a, b) => b.priority - a.priority);
  } else if (sort === "severity") {
    rows.sort(
      (a, b) =>
        (SEVERITY_RANK[b.exception.severity ?? "NONE"] ?? 0) -
        (SEVERITY_RANK[a.exception.severity ?? "NONE"] ?? 0),
    );
  }
  // "newest" matches the default createdAt desc ordering already applied.

  const totalMatching = rows.length;
  const visibleRows = rows.slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Exception Queue</h1>
      </div>

      <WarehouseFilters severity={severity} slaStatus={slaStatus} status={status} sort={sort} />

      {totalMatching > visibleRows.length && (
        <p className="text-xs text-foreground/50">
          Showing {visibleRows.length} of {totalMatching} matching exceptions.
        </p>
      )}

      {visibleRows.length === 0 ? (
        <p className="text-sm text-foreground/60">No exceptions match these filters.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleRows.map(({ exception }) => (
            <li key={exception.id}>
              <Link
                href={`/warehouse/exception/${exception.id}`}
                className="flex flex-col gap-2 rounded-lg border border-dark-slate/10 bg-app-surface p-4 transition hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{exception.delivery.qrCode}</span>
                    <span className="text-xs uppercase tracking-wide text-foreground/50">
                      {exception.type}
                    </span>
                    <SeverityBadge severity={exception.severity} />
                    <SlaBadge status={exception.slaStatus} />
                    <StatusBadge status={exception.status} />
                  </div>
                  {exception.aiSummary && (
                    <p className="text-sm text-foreground/70">{exception.aiSummary}</p>
                  )}
                  <p className="text-xs text-foreground/50">
                    Reported {exception.createdAt.toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

