import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { ResolveTicketForm } from "@/components/tickets/resolve-ticket-form";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export default async function CustomerServiceTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();

  const customer = await prisma.user.findUnique({ where: { id: ticket.customerId } });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
        <p className="text-sm text-foreground/60">
          {customer?.name ?? "Unknown customer"} · Status: {STATUS_LABEL[ticket.status] ?? ticket.status}
        </p>
      </div>

      <TicketThread
        ticketId={ticket.id}
        viewerRole="CUSTOMER_SERVICE"
        initialMessages={ticket.messages.map((m) => ({
          id: m.id,
          senderRole: m.senderRole,
          senderId: m.senderId,
          message: m.message,
          createdAt: m.createdAt.toISOString(),
        }))}
      />

      {ticket.status !== "RESOLVED" && <ResolveTicketForm ticketId={ticket.id} />}
    </div>
  );
}
