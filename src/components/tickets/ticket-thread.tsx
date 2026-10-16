"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { replyToTicketAction, type TicketActionState } from "./ticket-actions";

export interface TicketMessageItem {
  id: string;
  senderRole: string;
  senderId: string;
  message: string;
  createdAt: string;
}

const initialState: TicketActionState = {};

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Sending..." : "Send"}
    </button>
  );
}

export function TicketThread({
  ticketId,
  initialMessages,
  viewerRole,
}: {
  ticketId: string;
  initialMessages: TicketMessageItem[];
  viewerRole: "CUSTOMER" | "CUSTOMER_SERVICE";
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction] = useActionState(replyToTicketAction, initialState);

  useEffect(() => {
    const source = new EventSource(`/api/tickets/${ticketId}/messages/stream`);
    source.onmessage = (event) => {
      const message: TicketMessageItem = JSON.parse(event.data);
      setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
    };
    return () => source.close();
  }, [ticketId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-dark-slate/10 bg-app-surface p-3">
        {messages.length === 0 && <p className="text-sm text-foreground/50">No messages yet.</p>}
        {messages.map((m) => {
          const isMine = m.senderRole === viewerRole;
          return (
            <div key={m.id} className={isMine ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm ${
                  isMine ? "bg-accent text-white" : "bg-app-bg text-foreground"
                }`}
              >
                {m.message}
              </span>
              <p className="mt-0.5 text-[10px] text-foreground/40">
                {new Date(m.createdAt).toLocaleString("en-US")}
              </p>
            </div>
          );
        })}
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <input
          name="message"
          placeholder="Type a message…"
          required
          className="flex-1 rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
        <SendButton />
      </form>
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </div>
  );
}
