"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import SignatureCanvas from "react-signature-canvas";
import { completeDeliveryAction, type CompleteDeliveryState } from "./actions";

const initialState: CompleteDeliveryState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Submitting..." : "Mark Delivered"}
    </button>
  );
}

export function CompletionForm({ deliveryId }: { deliveryId: string }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [state, formAction] = useActionState(completeDeliveryAction, initialState);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      e.preventDefault();
      setValidationError("Please capture a signature before submitting.");
      return;
    }
    setValidationError(null);
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    if (hiddenInputRef.current) hiddenInputRef.current.value = dataUrl;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="signatureDataUrl" ref={hiddenInputRef} />

      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Recipient signature</p>
        <div className="rounded-md border border-dark-slate/20 bg-white">
          <SignatureCanvas ref={sigRef} canvasProps={{ className: "h-48 w-full" }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => sigRef.current?.clear()}
          className="flex min-h-11 items-center justify-center rounded-md border border-dark-slate/20 px-4 text-sm text-foreground/70 transition hover:border-accent hover:text-accent"
        >
          Clear
        </button>
        <div className="flex-1">
          <SubmitButton />
        </div>
      </div>

      {(validationError || state.error) && (
        <p className="text-sm text-severity-severe">{validationError ?? state.error}</p>
      )}
    </form>
  );
}
