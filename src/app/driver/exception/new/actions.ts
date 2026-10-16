"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyDamage, summarize } from "@/lib/ai/provider";
import { computeSlaStatus, type ExceptionType, type SlaStatus } from "@/lib/rules/sla";
import { notifyUser } from "@/lib/notifications";
import { generateRecommendation } from "@/lib/recommendations";

const EXCEPTION_TYPES: readonly string[] = ["DELAYED", "DAMAGED", "REJECTED"];

export interface ExceptionFormState {
  error?: string;
}

export async function submitExceptionAction(
  _prevState: ExceptionFormState,
  formData: FormData,
): Promise<ExceptionFormState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DRIVER") {
    return { error: "Unauthorized" };
  }

  try {
    const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
    if (!driver) {
      return { error: "Driver profile not found" };
    }

    const deliveryId = String(formData.get("deliveryId") ?? "");
    const type = String(formData.get("type") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const gpsLat = formData.get("gpsLat");
    const gpsLng = formData.get("gpsLng");
    const etaUpdate = formData.get("etaUpdate");

    if (!deliveryId || !EXCEPTION_TYPES.includes(type) || !description) {
      return { error: "Please fill in all required fields." };
    }

    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.driverId !== driver.id) {
      return { error: "Delivery not found for this driver." };
    }
    if (delivery.status !== "IN_TRANSIT") {
      return { error: "Exceptions can only be reported for deliveries that are in transit." };
    }

    const photoFiles = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const photoDataUrls: string[] = [];
    for (const file of photoFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      photoDataUrls.push(`data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`);
    }

    let severity: string | null = null;
    let aiSeverityScore: number | null = null;
    let aiSummary: string | null = null;

    if (type === "DAMAGED" && photoDataUrls.length > 0) {
      const classification = await classifyDamage(photoDataUrls[0]);
      severity = classification.severity;
      aiSeverityScore = classification.confidence;
      aiSummary = classification.notes;
    } else {
      aiSummary = await summarize({ type, description, severity });
    }

    const slaStatus = computeSlaStatus({
      type: type as ExceptionType,
      severity,
      scheduledEta: delivery.scheduledEta,
    });

    const exception = await prisma.exception.create({
      data: {
        deliveryId: delivery.id,
        type,
        description: notes ? `${description}\n\nNotes: ${notes}` : description,
        severity,
        slaStatus,
        photoUrls: JSON.stringify(photoDataUrls),
        gpsLat: gpsLat ? Number(gpsLat) : null,
        gpsLng: gpsLng ? Number(gpsLng) : null,
        status: "OPEN",
        aiSummary,
        aiSeverityScore,
      },
    });

    const deliveryUpdate: { status: string; actualEta?: Date } = { status: "EXCEPTION" };
    if (etaUpdate) {
      const parsedEta = new Date(String(etaUpdate));
      if (!Number.isNaN(parsedEta.getTime())) deliveryUpdate.actualEta = parsedEta;
    }
    await prisma.delivery.update({ where: { id: delivery.id }, data: deliveryUpdate });

    await generateRecommendation({
      exceptionId: exception.id,
      type: type as ExceptionType,
      severity,
      slaStatus: slaStatus as SlaStatus,
      scheduledEta: delivery.scheduledEta,
      reportedAt: exception.createdAt,
      originWarehouseId: delivery.originWarehouseId,
      destWarehouseId: delivery.destWarehouseId,
      hasDriver: Boolean(delivery.driverId),
    });

    const warehouseManager = await prisma.user.findFirst({
      where: { role: "WAREHOUSE_MANAGER", warehouseId: delivery.originWarehouseId },
    });
    if (warehouseManager) {
      await notifyUser({
        userId: warehouseManager.id,
        type: "EXCEPTION_CREATED",
        message: `New ${type.toLowerCase()} exception reported for delivery ${delivery.qrCode}.`,
        relatedExceptionId: exception.id,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath("/driver");
  redirect("/driver?submitted=1");
}
