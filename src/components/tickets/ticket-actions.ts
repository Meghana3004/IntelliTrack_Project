"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postTicketMessage } from "@/lib/tickets";

export interface TicketActionState {
  error?: string;
}

async function requireTicketAccess(ticketId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found.");

  const isOwner = session.user.role === "CUSTOMER" && ticket.customerId === session.user.id;
  const isStaff = session.user.role === "CUSTOMER_SERVICE";
  if (!isOwner && !isStaff) throw new Error("Unauthorized");

  return { session, ticket };
}

export async function replyToTicketAction(
  _prevState: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Message cannot be empty." };

  try {
    const { session } = await requireTicketAccess(ticketId);
    await postTicketMessage({
      ticketId,
      senderRole: session.user.role === "CUSTOMER" ? "CUSTOMER" : "CUSTOMER_SERVICE",
      senderId: session.user.id,
      message,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath(`/customer/support/${ticketId}`);
  revalidatePath(`/customer-service/tickets/${ticketId}`);
  return {};
}

export async function resolveTicketAction(
  _prevState: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const ticketId = String(formData.get("ticketId") ?? "");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "CUSTOMER_SERVICE") {
      throw new Error("Unauthorized");
    }
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "RESOLVED" } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidatePath(`/customer-service/tickets/${ticketId}`);
  revalidatePath("/customer-service");
  return {};
}
