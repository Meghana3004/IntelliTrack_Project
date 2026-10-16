"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { generateRecommendation } from "@/lib/recommendations";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";

export interface ExceptionActionState {
  error?: string;
}

async function requireWarehouseException(exceptionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WAREHOUSE_MANAGER" || !session.user.warehouseId) {
    throw new Error("Unauthorized");
  }

  const exception = await prisma.exception.findUnique({
    where: { id: exceptionId },
    include: { delivery: true },
  });
  if (!exception || exception.delivery.originWarehouseId !== session.user.warehouseId) {
    throw new Error("Exception not found for this warehouse.");
  }

  return { exception, warehouseId: session.user.warehouseId };
}

// Assign/escalate are only meaningful before an exception is closed out —
// reachable directly (not just via the hidden UI) since these are server actions.
function assertNotResolved(status: string) {
  if (status === "RESOLVED") {
    throw new Error("This exception is already resolved.");
  }
}

function revalidateExceptionPages(exceptionId: string) {
  revalidatePath(`/warehouse/exception/${exceptionId}`);
  revalidatePath("/warehouse");
}

export async function assignExceptionAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");
  if (!assigneeId) return { error: "Select an assignee." };

  try {
    const { exception, warehouseId } = await requireWarehouseException(exceptionId);
    assertNotResolved(exception.status);

    const assignee = await prisma.user.findFirst({
      where: { id: assigneeId, role: "WAREHOUSE_MANAGER", warehouseId },
    });
    if (!assignee) return { error: "Assignee must be a warehouse manager for this warehouse." };

    await prisma.exception.update({
      where: { id: exceptionId },
      data: {
        assignedTo: assigneeId,
        status: exception.status === "OPEN" ? "IN_REVIEW" : exception.status,
      },
    });

    await notifyUser({
      userId: assigneeId,
      type: "EXCEPTION_ASSIGNED",
      message: `You were assigned to the exception for delivery ${exception.delivery.qrCode}.`,
      relatedExceptionId: exceptionId,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}

export async function escalateExceptionAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");

  try {
    const { exception } = await requireWarehouseException(exceptionId);
    assertNotResolved(exception.status);

    await prisma.exception.update({
      where: { id: exceptionId },
      data: { status: "ESCALATED" },
    });

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: exception.delivery.originWarehouseId },
    });
    const regionalManager = warehouse
      ? await prisma.user.findFirst({
          where: { role: "REGIONAL_MANAGER", regionId: warehouse.regionId },
        })
      : null;

    if (regionalManager) {
      await notifyUser({
        userId: regionalManager.id,
        type: "EXCEPTION_ESCALATED",
        message: `Exception for delivery ${exception.delivery.qrCode} was escalated to you.`,
        relatedExceptionId: exceptionId,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}

export async function resolveExceptionAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const resolutionNotes = String(formData.get("resolutionNotes") ?? "").trim();
  if (!resolutionNotes) return { error: "Resolution notes are required." };

  try {
    const { exception } = await requireWarehouseException(exceptionId);

    await prisma.exception.update({
      where: { id: exceptionId },
      data: { status: "RESOLVED", resolutionNotes },
    });

    const driver = exception.delivery.driverId
      ? await prisma.driver.findUnique({ where: { id: exception.delivery.driverId } })
      : null;

    if (driver) {
      await notifyUser({
        userId: driver.userId,
        type: "EXCEPTION_RESOLVED",
        message: `Your reported exception for delivery ${exception.delivery.qrCode} was resolved.`,
        relatedExceptionId: exceptionId,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}

export async function generateRecommendationAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");

  try {
    const { exception } = await requireWarehouseException(exceptionId);

    await generateRecommendation({
      exceptionId: exception.id,
      type: exception.type as ExceptionType,
      severity: exception.severity,
      slaStatus: exception.slaStatus as SlaStatus,
      scheduledEta: exception.delivery.scheduledEta,
      reportedAt: exception.createdAt,
      originWarehouseId: exception.delivery.originWarehouseId,
      destWarehouseId: exception.delivery.destWarehouseId,
      hasDriver: Boolean(exception.delivery.driverId),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}

export async function acceptRecommendationAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const recommendationId = String(formData.get("recommendationId") ?? "");

  try {
    await requireWarehouseException(exceptionId);

    const recommendation = await prisma.aIRecommendation.findUnique({ where: { id: recommendationId } });
    if (!recommendation || recommendation.exceptionId !== exceptionId) {
      return { error: "Recommendation not found." };
    }

    await prisma.aIRecommendation.update({ where: { id: recommendationId }, data: { accepted: true } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}

export async function dismissRecommendationAction(
  _prevState: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const recommendationId = String(formData.get("recommendationId") ?? "");

  try {
    await requireWarehouseException(exceptionId);

    const recommendation = await prisma.aIRecommendation.findUnique({ where: { id: recommendationId } });
    if (!recommendation || recommendation.exceptionId !== exceptionId) {
      return { error: "Recommendation not found." };
    }
    if (recommendation.accepted) {
      return { error: "An accepted recommendation can't be dismissed." };
    }

    await prisma.aIRecommendation.delete({ where: { id: recommendationId } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateExceptionPages(exceptionId);
  return {};
}
