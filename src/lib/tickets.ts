import { prisma } from "@/lib/prisma";
import { publishNewTicket, publishTicketMessage } from "@/lib/tickets-bus";
import { notifyUser } from "@/lib/notifications";

interface CreateTicketInput {
  customerId: string;
  deliveryId?: string | null;
  exceptionId?: string | null;
  type: string;
  subject: string;
  message: string;
}

/** Creates a SupportTicket + its first message, and pushes both live. */
export async function createSupportTicket(input: CreateTicketInput) {
  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: input.customerId,
      deliveryId: input.deliveryId ?? null,
      exceptionId: input.exceptionId ?? null,
      type: input.type,
      subject: input.subject,
      status: "OPEN",
    },
  });

  const firstMessage = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderRole: "CUSTOMER",
      senderId: input.customerId,
      message: input.message,
    },
  });

  publishNewTicket({
    id: ticket.id,
    customerId: ticket.customerId,
    type: ticket.type,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  });
  publishTicketMessage({
    id: firstMessage.id,
    ticketId: ticket.id,
    senderRole: firstMessage.senderRole,
    senderId: firstMessage.senderId,
    message: firstMessage.message,
    createdAt: firstMessage.createdAt.toISOString(),
  });

  const csStaff = await prisma.user.findMany({ where: { role: "CUSTOMER_SERVICE" } });
  await Promise.all(
    csStaff.map((staff) =>
      notifyUser({
        userId: staff.id,
        type: "TICKET_CREATED",
        message: `New support ticket: ${ticket.subject}`,
        relatedExceptionId: ticket.exceptionId,
      }),
    ),
  );

  return ticket;
}

interface PostMessageInput {
  ticketId: string;
  senderRole: "CUSTOMER" | "CUSTOMER_SERVICE";
  senderId: string;
  message: string;
}

/** Creates a TicketMessage and pushes it live to that ticket's chat thread. */
export async function postTicketMessage(input: PostMessageInput) {
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: input.ticketId,
      senderRole: input.senderRole,
      senderId: input.senderId,
      message: input.message,
    },
  });

  publishTicketMessage({
    id: message.id,
    ticketId: message.ticketId,
    senderRole: message.senderRole,
    senderId: message.senderId,
    message: message.message,
    createdAt: message.createdAt.toISOString(),
  });

  return message;
}
