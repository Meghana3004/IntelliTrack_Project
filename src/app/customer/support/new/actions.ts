"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/tickets";

export interface NewTicketState {
  error?: string;
}

const TICKET_TYPES = ["DAMAGE_COMPLAINT", "REJECTION", "RETURN_REQUEST", "GENERAL_SUPPORT"];

export async function createTicketAction(
  _prevState: NewTicketState,
  formData: FormData,
): Promise<NewTicketState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return { error: "Unauthorized" };
  }

  const type = String(formData.get("type") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const deliveryId = String(formData.get("deliveryId") ?? "") || null;

  if (!TICKET_TYPES.includes(type) || !subject || !message) {
    return { error: "Please fill in all required fields." };
  }

  let exceptionId: string | null = null;
  if (deliveryId) {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.customerId !== session.user.id) {
      return { error: "Delivery not found." };
    }
    const latestException = await prisma.exception.findFirst({
      where: { deliveryId },
      orderBy: { createdAt: "desc" },
    });
    exceptionId = latestException?.id ?? null;
  }

  const ticket = await createSupportTicket({
    customerId: session.user.id,
    deliveryId,
    exceptionId,
    type,
    subject,
    message,
  });

  redirect(`/customer/support/${ticket.id}`);
}
