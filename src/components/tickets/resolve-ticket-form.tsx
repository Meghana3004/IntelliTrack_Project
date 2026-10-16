"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resolveTicketAction, type TicketActionState } from "./ticket-actions";

const initialState: TicketActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Resolving..." : "Mark Resolved"}
    </button>
  );
}

export function ResolveTicketForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState(resolveTicketAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <SubmitButton />
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}
