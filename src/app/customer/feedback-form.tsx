"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitFeedbackAction, type CustomerActionState } from "./actions";

const initialState: CustomerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Sending..." : "Submit"}
    </button>
  );
}

export function FeedbackForm({ deliveryId }: { deliveryId: string }) {
  const [rating, setRating] = useState(0);
  const [state, formAction] = useActionState(submitFeedbackAction, initialState);

  if (state.success) {
    return <p className="text-xs text-accent">Thanks for your feedback!</p>;
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 rounded-md border border-dark-slate/10 bg-app-bg p-3 text-xs sm:w-56">
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="font-medium text-foreground">Rate this delivery</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`h-7 w-7 rounded-full border text-sm ${
              rating >= n ? "border-accent bg-accent/10 text-accent" : "border-dark-slate/20 text-foreground/50"
            }`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        placeholder="Optional comment"
        className="rounded-md border border-dark-slate/20 bg-app-surface px-2 py-1.5 text-xs text-foreground"
      />
      <SubmitButton />
      {state.error && <p className="text-severity-severe">{state.error}</p>}
    </form>
  );
}
