"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CompleteDeliveryState {
  error?: string;
}

export async function completeDeliveryAction(
  _prevState: CompleteDeliveryState,
  formData: FormData,
): Promise<CompleteDeliveryState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DRIVER") {
    return { error: "Unauthorized" };
  }

  const deliveryId = String(formData.get("deliveryId") ?? "");
  const signatureDataUrl = String(formData.get("signatureDataUrl") ?? "");
  if (!deliveryId || !signatureDataUrl) {
    return { error: "A signature is required." };
  }

  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) return { error: "Driver profile not found." };

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.driverId !== driver.id) {
    return { error: "Delivery not found for this driver." };
  }
  if (delivery.status === "DELIVERED") {
    return { error: "This delivery is already marked delivered." };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: "DELIVERED", actualEta: new Date() },
  });

  await prisma.signature.upsert({
    where: { deliveryId },
    create: { deliveryId, dataUrl: signatureDataUrl },
    update: { dataUrl: signatureDataUrl, signedAt: new Date() },
  });

  revalidatePath("/driver");
  redirect("/driver?delivered=1");
}
