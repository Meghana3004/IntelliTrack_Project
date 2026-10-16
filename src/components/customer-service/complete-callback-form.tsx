"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeCallbackAction, type CsActionState } from "@/app/customer-service/actions";

const initialState: CsActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-dark-slate/20 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-accent hover:text-accent disabled:opacity-60"
    >
      {pending ? "Saving..." : "Mark Completed"}
    </button>
  );
}

export function CompleteCallbackForm({ callbackId }: { callbackId: string }) {
  const [state, formAction] = useActionState(completeCallbackAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="callbackId" value={callbackId} />
      <SubmitButton />
      {state.error && <p className="text-xs text-severity-severe">{state.error}</p>}
    </form>
  );
}
