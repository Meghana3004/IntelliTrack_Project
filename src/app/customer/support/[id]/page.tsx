import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketThread } from "@/components/tickets/ticket-thread";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export default async function CustomerTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket || ticket.customerId !== session!.user.id) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
        <p className="text-sm text-foreground/60">Status: {STATUS_LABEL[ticket.status] ?? ticket.status}</p>
      </div>

      <TicketThread
        ticketId={ticket.id}
        viewerRole="CUSTOMER"
        initialMessages={ticket.messages.map((m) => ({
          id: m.id,
          senderRole: m.senderRole,
          senderId: m.senderId,
          message: m.message,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
