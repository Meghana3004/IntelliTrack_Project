import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estimateExceptionCost, sumAcceptedCompensation } from "@/lib/rules/cost";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";
import { ExceptionDetailView } from "@/components/regional/exception-detail-view";

export default async function LeadershipExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const exception = await prisma.exception.findUnique({
    where: { id },
    include: { delivery: true, recommendations: true },
  });
  if (!exception) notFound();

  const [originWarehouse, destWarehouse, driver, assignedUser] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id: exception.delivery.originWarehouseId } }),
    prisma.warehouse.findUnique({ where: { id: exception.delivery.destWarehouseId } }),
    exception.delivery.driverId
      ? prisma.driver.findUnique({ where: { id: exception.delivery.driverId } })
      : Promise.resolve(null),
    exception.assignedTo ? prisma.user.findUnique({ where: { id: exception.assignedTo } }) : Promise.resolve(null),
  ]);
  const driverUser = driver ? await prisma.user.findUnique({ where: { id: driver.userId } }) : null;

  const modeledCost = estimateExceptionCost({
    type: exception.type as ExceptionType,
    severity: exception.severity,
    slaStatus: exception.slaStatus as SlaStatus,
    scheduledEta: exception.delivery.scheduledEta,
    reportedAt: exception.createdAt,
    acceptedCompensationTotal: sumAcceptedCompensation(exception.recommendations),
  });

  return (
    <ExceptionDetailView
      exception={exception}
      qrCode={exception.delivery.qrCode}
      originWarehouseName={originWarehouse?.name ?? "Unknown"}
      destWarehouseName={destWarehouse?.name ?? "Unknown"}
      driverName={driverUser?.name ?? "Unassigned"}
      assignedToName={assignedUser?.name ?? null}
      modeledCost={modeledCost}
      recommendations={exception.recommendations}
    />
  );
}
