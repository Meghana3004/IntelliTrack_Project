"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CustomerActionState {
  error?: string;
  success?: boolean;
}

export async function submitFeedbackAction(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") return { error: "Unauthorized" };

  const deliveryId = String(formData.get("deliveryId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  if (!deliveryId || rating < 1 || rating > 5) return { error: "Please select a rating." };

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.customerId !== session.user.id) return { error: "Delivery not found." };

  await prisma.customerFeedback.create({
    data: { deliveryId, rating, comment: comment || null },
  });

  revalidatePath("/customer");
  return { success: true };
}

export async function requestCallbackAction(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") return { error: "Unauthorized" };

  const phone = String(formData.get("phone") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!phone || !reason) return { error: "Phone and reason are required." };

  await prisma.callbackRequest.create({
    data: { customerId: session.user.id, phone, reason, status: "PENDING" },
  });

  revalidatePath("/customer");
  return { success: true };
}
