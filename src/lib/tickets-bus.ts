import { EventEmitter } from "node:events";

export interface TicketMessagePayload {
  id: string;
  ticketId: string;
  senderRole: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export interface TicketSummaryPayload {
  id: string;
  customerId: string;
  type: string;
  subject: string;
  status: string;
  createdAt: string;
}

// Module-scoped singleton (see src/lib/prisma.ts / notifications-bus.ts for
// why this survives Next.js dev-mode module reloads).
const globalForBus = globalThis as unknown as {
  ticketsBus: EventEmitter | undefined;
};

const bus = globalForBus.ticketsBus ?? new EventEmitter();
bus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") globalForBus.ticketsBus = bus;

const NEW_TICKET_EVENT = "ticket:new";
const messageEvent = (ticketId: string) => `ticket-message:${ticketId}`;

/** Broadcasts a newly created ticket to every subscribed Customer Service inbox. */
export function publishNewTicket(ticket: TicketSummaryPayload) {
  bus.emit(NEW_TICKET_EVENT, ticket);
}

export function subscribeNewTickets(listener: (ticket: TicketSummaryPayload) => void) {
  bus.on(NEW_TICKET_EVENT, listener);
  return () => bus.off(NEW_TICKET_EVENT, listener);
}

export function publishTicketMessage(message: TicketMessagePayload) {
  bus.emit(messageEvent(message.ticketId), message);
}

export function subscribeTicketMessages(
  ticketId: string,
  listener: (message: TicketMessagePayload) => void,
) {
  const event = messageEvent(ticketId);
  bus.on(event, listener);
  return () => bus.off(event, listener);
}
