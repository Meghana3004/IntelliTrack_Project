"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitDelayReasonAction, type DelayReasonState } from "./actions";

const initialState: DelayReasonState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Submitting..." : "Submit Reason"}
    </button>
  );
}

export function ReasonForm({ exceptionId }: { exceptionId: string }) {
  const [state, formAction] = useActionState(submitDelayReasonAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="exceptionId" value={exceptionId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className="text-sm font-medium text-foreground">
          Reason for the delay
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          required
          placeholder="What's holding up this delivery?"
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
