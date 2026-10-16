"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

export interface DelayReasonState {
  error?: string;
}

async function requireOwnDelayException(exceptionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DRIVER") {
    throw new Error("Unauthorized");
  }

  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) {
    throw new Error("Driver profile not found.");
  }

  const exception = await prisma.exception.findUnique({
    where: { id: exceptionId },
    include: { delivery: true },
  });
  if (!exception || exception.delivery.driverId !== driver.id) {
    throw new Error("Exception not found for this driver.");
  }

  return { exception };
}

export async function submitDelayReasonAction(
  _prevState: DelayReasonState,
  formData: FormData,
): Promise<DelayReasonState> {
  const exceptionId = String(formData.get("exceptionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Please provide a reason for the delay." };

  try {
    const { exception } = await requireOwnDelayException(exceptionId);

    await prisma.exception.update({
      where: { id: exceptionId },
      data: {
        description: `${exception.description}\n\nDriver response: ${reason}`,
        status: "IN_REVIEW",
      },
    });

    const warehouseManagers = await prisma.user.findMany({
      where: { role: "WAREHOUSE_MANAGER", warehouseId: exception.delivery.originWarehouseId },
    });
    for (const manager of warehouseManagers) {
      await notifyUser({
        userId: manager.id,
        type: "AUTO_DELAY_RESPONDED",
        message: `Driver reported a reason for the delayed delivery ${exception.delivery.qrCode}.`,
        relatedExceptionId: exceptionId,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/driver");
  redirect("/driver?reasonSubmitted=1");
}
