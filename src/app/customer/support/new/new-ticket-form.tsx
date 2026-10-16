"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTicketAction, type NewTicketState } from "./actions";

const TYPES = [
  { value: "DAMAGE_COMPLAINT", label: "Damage complaint" },
  { value: "REJECTION", label: "Rejection" },
  { value: "RETURN_REQUEST", label: "Return request" },
  { value: "GENERAL_SUPPORT", label: "General support" },
];

const initialState: NewTicketState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

export function NewTicketForm({ deliveries }: { deliveries: { id: string; qrCode: string }[] }) {
  const [state, formAction] = useActionState(createTicketAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-foreground">
          Type
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue="GENERAL_SUPPORT"
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {deliveries.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="deliveryId" className="text-sm font-medium text-foreground">
            Related delivery (optional)
          </label>
          <select
            id="deliveryId"
            name="deliveryId"
            defaultValue=""
            className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">None</option>
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.qrCode}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
