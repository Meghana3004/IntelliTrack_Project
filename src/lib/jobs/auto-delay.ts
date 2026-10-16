import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { computeSlaStatus } from "@/lib/rules/sla";

/** Minutes past a delivery's scheduledEta before it's auto-flagged as delayed. */
export const DELAY_THRESHOLD_MINUTES = 30;

/**
 * Finds IN_TRANSIT deliveries whose scheduledEta is more than
 * DELAY_THRESHOLD_MINUTES in the past and that don't already have a DELAYED
 * exception, auto-creates one for each (deterministic, no AI), and notifies the
 * assigned driver (to report a reason) and every WAREHOUSE_MANAGER at the
 * delivery's origin warehouse.
 *
 * Runs outside a request (see src/instrumentation.ts) — there's no session to
 * check and no route to revalidatePath.
 */
export async function runAutoDelayCheck(): Promise<{ flagged: number }> {
  const threshold = new Date(Date.now() - DELAY_THRESHOLD_MINUTES * 60 * 1000);

  const overdueDeliveries = await prisma.delivery.findMany({
    where: {
      status: "IN_TRANSIT",
      scheduledEta: { lt: threshold },
      exceptions: { none: { type: "DELAYED" } },
    },
  });

  let flagged = 0;

  for (const delivery of overdueDeliveries) {
    const reportedAt = new Date();
    const slaStatus = computeSlaStatus({
      type: "DELAYED",
      scheduledEta: delivery.scheduledEta,
      reportedAt,
    });

    const exception = await prisma.exception.create({
      data: {
        deliveryId: delivery.id,
        type: "DELAYED",
        description: `Auto-detected: delivery has not arrived within ${DELAY_THRESHOLD_MINUTES} minutes of its scheduled ETA. Please report a reason.`,
        severity: null,
        slaStatus,
        photoUrls: "[]",
        status: "OPEN",
      },
    });

    const driver = delivery.driverId
      ? await prisma.driver.findUnique({ where: { id: delivery.driverId } })
      : null;
    if (driver) {
      await notifyUser({
        userId: driver.userId,
        type: "AUTO_DELAY_FLAGGED",
        message: `Delivery ${delivery.qrCode} is running late — please report a reason for the delay.`,
        relatedExceptionId: exception.id,
      });
    }

    const warehouseManagers = await prisma.user.findMany({
      where: { role: "WAREHOUSE_MANAGER", warehouseId: delivery.originWarehouseId },
    });
    for (const manager of warehouseManagers) {
      await notifyUser({
        userId: manager.id,
        type: "AUTO_DELAY_FLAGGED",
        message: `Delivery ${delivery.qrCode} was auto-flagged as delayed; the driver has been asked to report a reason.`,
        relatedExceptionId: exception.id,
      });
    }

    flagged += 1;
  }

  return { flagged };
}
