import { prisma } from "@/lib/prisma";
import { TicketsInbox } from "@/components/customer-service/tickets-inbox";
import { CompleteCallbackForm } from "@/components/customer-service/complete-callback-form";

export default async function CustomerServiceHome() {
  const [tickets, customers, affectedDeliveries, callbacks] = await Promise.all([
    prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.user.findMany({ where: { role: "CUSTOMER" } }),
    prisma.delivery.findMany({ where: { status: "EXCEPTION" }, orderBy: { scheduledEta: "desc" }, take: 5 }),
    prisma.callbackRequest.findMany({ where: { status: "PENDING" }, orderBy: { requestedAt: "asc" }, take: 5 }),
  ]);

  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Support Inbox</h1>
        <TicketsInbox
          initialTickets={tickets.map((t) => ({
            id: t.id,
            subject: t.subject,
            type: t.type,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
            customerName: customerNameById.get(t.customerId),
          }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Affected Deliveries</h2>
        {affectedDeliveries.length === 0 ? (
          <p className="text-sm text-foreground/60">No deliveries currently affected by exceptions.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {affectedDeliveries.map((d) => (
              <li key={d.id} className="rounded-lg border border-dark-slate/10 bg-app-surface p-3 text-sm">
                <p className="font-medium text-foreground">{d.qrCode}</p>
                <p className="text-xs text-foreground/50">
                  Customer: {customerNameById.get(d.customerId) ?? "Unknown"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Callback Queue</h2>
        {callbacks.length === 0 ? (
          <p className="text-sm text-foreground/60">No pending callback requests.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {callbacks.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-dark-slate/10 bg-app-surface p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{c.phone}</p>
                  <p className="text-xs text-foreground/50">{c.reason}</p>
                </div>
                <CompleteCallbackForm callbackId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
