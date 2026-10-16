"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  assignExceptionAction,
  escalateExceptionAction,
  resolveExceptionAction,
  generateRecommendationAction,
  acceptRecommendationAction,
  dismissRecommendationAction,
  type ExceptionActionState,
} from "./actions";

const initialState: ExceptionActionState = {};

function ActionButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AssignForm({
  exceptionId,
  assignees,
  currentAssigneeId,
}: {
  exceptionId: string;
  assignees: { id: string; name: string }[];
  currentAssigneeId: string | null;
}) {
  const [state, formAction] = useActionState(assignExceptionAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <label htmlFor="assigneeId" className="text-sm font-medium text-foreground">
        Assign owner
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={currentAssigneeId ?? ""}
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="" disabled>
            Select a warehouse staff member
          </option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <ActionButton label="Assign" pendingLabel="Assigning..." />
      </div>
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}

export function EscalateForm({ exceptionId }: { exceptionId: string }) {
  const [state, formAction] = useActionState(escalateExceptionAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <ActionButton label="Escalate to Regional Manager" pendingLabel="Escalating..." />
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}

export function ResolveForm({ exceptionId }: { exceptionId: string }) {
  const [state, formAction] = useActionState(resolveExceptionAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <label htmlFor="resolutionNotes" className="text-sm font-medium text-foreground">
        Resolution notes
      </label>
      <textarea
        id="resolutionNotes"
        name="resolutionNotes"
        rows={3}
        required
        placeholder="How was this resolved?"
        className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
      />
      <div>
        <ActionButton label="Mark Resolved" pendingLabel="Resolving..." />
      </div>
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}

export function GenerateRecommendationForm({ exceptionId }: { exceptionId: string }) {
  const [state, formAction] = useActionState(generateRecommendationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <ActionButton label="Generate AI Recommendation" pendingLabel="Generating..." />
      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}
    </form>
  );
}

function SmallActionButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-dark-slate/20 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-accent hover:text-accent disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function RecommendationActions({
  exceptionId,
  recommendationId,
  accepted,
}: {
  exceptionId: string;
  recommendationId: string;
  accepted: boolean;
}) {
  const [acceptState, acceptFormAction] = useActionState(acceptRecommendationAction, initialState);
  const [dismissState, dismissFormAction] = useActionState(dismissRecommendationAction, initialState);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {!accepted && (
        <>
          <form action={acceptFormAction}>
            <input type="hidden" name="exceptionId" value={exceptionId} />
            <input type="hidden" name="recommendationId" value={recommendationId} />
            <SmallActionButton label="Accept" pendingLabel="Accepting..." />
          </form>
          <form action={dismissFormAction}>
            <input type="hidden" name="exceptionId" value={exceptionId} />
            <input type="hidden" name="recommendationId" value={recommendationId} />
            <SmallActionButton label="Dismiss" pendingLabel="Dismissing..." />
          </form>
        </>
      )}
      {(acceptState.error || dismissState.error) && (
        <p className="text-sm text-severity-severe">{acceptState.error || dismissState.error}</p>
      )}
    </div>
  );
}
