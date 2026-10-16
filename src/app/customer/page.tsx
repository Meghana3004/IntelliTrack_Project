import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryQr } from "@/components/tracking/delivery-qr";
import { FeedbackForm } from "./feedback-form";
import { CallbackForm } from "./callback-form";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export default async function CustomerHome() {
  const session = await getServerSession(authOptions);
  const customerId = session!.user.id;

  const [deliveries, warehouses, tickets, feedback] = await Promise.all([
    prisma.delivery.findMany({ where: { customerId }, orderBy: { scheduledEta: "desc" }, take: 5 }),
    prisma.warehouse.findMany(),
    prisma.supportTicket.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.customerFeedback.findMany({ where: { delivery: { customerId } } }),
  ]);

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "Unknown";
  const feedbackDeliveryIds = new Set(feedback.map((f) => f.deliveryId));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">My Deliveries</h1>
          <Link
            href="/customer/support/new"
            className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Raise a Concern
          </Link>
        </div>

        {deliveries.length === 0 ? (
          <p className="text-sm text-foreground/60">No deliveries yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deliveries.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 rounded-lg border border-dark-slate/10 bg-app-surface p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <DeliveryQr qrCode={d.qrCode} size={56} />
                  <div>
                    <p className="font-medium text-foreground">{d.qrCode}</p>
                    <p className="text-sm text-foreground/60">
                      {warehouseName(d.originWarehouseId)} → {warehouseName(d.destWarehouseId)}
                    </p>
                    <p className="text-xs text-foreground/50">
                      Scheduled {d.scheduledEta.toLocaleString()} · {STATUS_LABEL[d.status] ?? d.status}
                    </p>
                    <Link
                      href={`/track/${d.qrCode}`}
                      target="_blank"
                      className="text-xs font-medium text-accent underline"
                    >
                      Track shipment
                    </Link>
                  </div>
                </div>
                {d.status === "DELIVERED" && !feedbackDeliveryIds.has(d.id) && <FeedbackForm deliveryId={d.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">My Support Tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-foreground/60">No tickets yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/customer/support/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-dark-slate/10 bg-app-surface p-3 text-sm transition hover:border-accent/40"
                >
                  <span className="font-medium text-foreground">{t.subject}</span>
                  <span className="text-xs text-foreground/50">{TICKET_STATUS_LABEL[t.status] ?? t.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-dark-slate/10 bg-app-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Need to talk to someone?</h2>
        <a
          href="tel:+18005551234"
          className="block rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 sm:hidden"
        >
          Call Support
        </a>
        <div className="hidden sm:block">
          <CallbackForm />
        </div>
      </div>
    </div>
  );
}
