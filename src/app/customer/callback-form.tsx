"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestCallbackAction, type CustomerActionState } from "./actions";

const initialState: CustomerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Requesting..." : "Request a Callback"}
    </button>
  );
}

export function CallbackForm() {
  const [state, formAction] = useActionState(requestCallbackAction, initialState);

  if (state.success) {
    return <p className="text-sm text-accent">Callback requested — we&apos;ll be in touch soon.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        name="phone"
        required
        placeholder="Phone number"
        className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
      />
      <textarea
        name="reason"
        required
        rows={2}
        placeholder="What's this about?"
        className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
      />
      <div>
        <SubmitButton />
      </div>
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}
