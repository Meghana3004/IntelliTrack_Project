import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateExceptionCost, sumAcceptedCompensation } from "@/lib/rules/cost";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";
import { ExceptionDetailView } from "@/components/regional/exception-detail-view";

export default async function RegionalExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const regionId = session?.user.regionId;
  if (!regionId) notFound();

  const exception = await prisma.exception.findUnique({
    where: { id },
    include: { delivery: true, recommendations: true },
  });
  if (!exception) notFound();

  const originWarehouse = await prisma.warehouse.findUnique({
    where: { id: exception.delivery.originWarehouseId },
  });
  if (!originWarehouse || originWarehouse.regionId !== regionId) notFound();

  const [destWarehouse, driver, assignedUser] = await Promise.all([
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
      originWarehouseName={originWarehouse.name}
      destWarehouseName={destWarehouse?.name ?? "Unknown"}
      driverName={driverUser?.name ?? "Unassigned"}
      assignedToName={assignedUser?.name ?? null}
      modeledCost={modeledCost}
      recommendations={exception.recommendations}
    />
  );
}
