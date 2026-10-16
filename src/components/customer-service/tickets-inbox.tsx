"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface TicketRow {
  id: string;
  subject: string;
  type: string;
  status: string;
  createdAt: string;
  customerName?: string;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export function TicketsInbox({ initialTickets }: { initialTickets: TicketRow[] }) {
  const [tickets, setTickets] = useState(initialTickets);

  useEffect(() => {
    const source = new EventSource("/api/tickets/stream");
    source.onmessage = (event) => {
      const ticket: TicketRow = JSON.parse(event.data);
      setTickets((current) =>
        current.some((t) => t.id === ticket.id) ? current : [ticket, ...current].slice(0, 5),
      );
    };
    return () => source.close();
  }, []);

  if (tickets.length === 0) {
    return <p className="text-sm text-foreground/60">No tickets yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/customer-service/tickets/${t.id}`}
            className="flex items-center justify-between rounded-lg border border-dark-slate/10 bg-app-surface p-3 text-sm transition hover:border-accent/40"
          >
            <div>
              <p className="font-medium text-foreground">{t.subject}</p>
              <p className="text-xs text-foreground/50">
                {t.customerName ?? "Customer"} · {t.type.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
            <span className="text-xs text-foreground/50">{STATUS_LABEL[t.status] ?? t.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
