"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitExceptionAction, type ExceptionFormState } from "./actions";
import { simulateDeliveryGps } from "@/lib/simulated-gps";
import type { DeliveryOption } from "./types";

const EXCEPTION_TYPES = [
  { value: "DELAYED", label: "Delayed" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "REJECTED", label: "Rejected" },
] as const;

const initialState: ExceptionFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Submitting..." : "Submit Exception"}
    </button>
  );
}

export function ExceptionForm({
  deliveries,
  initialDeliveryId,
}: {
  deliveries: DeliveryOption[];
  initialDeliveryId?: string;
}) {
  const [state, formAction] = useActionState(submitExceptionAction, initialState);
  const [deliveryId, setDeliveryId] = useState(
    initialDeliveryId && deliveries.some((d) => d.id === initialDeliveryId)
      ? initialDeliveryId
      : (deliveries[0]?.id ?? ""),
  );
  const [type, setType] = useState<(typeof EXCEPTION_TYPES)[number]["value"]>("DELAYED");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const selectedDelivery = deliveries.find((d) => d.id === deliveryId);

  const gps = useMemo(() => {
    if (!selectedDelivery?.origin || !selectedDelivery?.dest) return null;
    return simulateDeliveryGps(selectedDelivery.id, selectedDelivery.origin, selectedDelivery.dest);
  }, [selectedDelivery]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotoPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  if (deliveries.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        No deliveries assigned to you yet — check back later.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="deliveryId" className="text-sm font-medium text-foreground">
          Delivery
        </label>
        <select
          id="deliveryId"
          name="deliveryId"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          required
          className="min-h-11 rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        >
          {deliveries.map((d) => (
            <option key={d.id} value={d.id}>
              {d.qrCode} — {d.origin?.name ?? "?"} → {d.dest?.name ?? "?"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-foreground">
          Exception Type
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          required
          className="min-h-11 rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        >
          {EXCEPTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          placeholder="What happened?"
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="photos" className="text-sm font-medium text-foreground">
          Photo(s) {type === "DAMAGED" && "— used for AI severity classification"}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="text-sm text-foreground/70"
        />
        {photoPreviews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {photoPreviews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
              <img key={i} src={src} alt="Upload preview" className="h-20 w-20 rounded-md object-cover" />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="etaUpdate" className="text-sm font-medium text-foreground">
          Updated ETA (optional)
        </label>
        <input
          id="etaUpdate"
          name="etaUpdate"
          type="datetime-local"
          className="min-h-11 rounded-md border border-dark-slate/20 bg-app-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="rounded-md border border-dark-slate/10 bg-app-bg px-3 py-2 text-xs text-foreground/60">
        <p className="font-medium text-foreground/80">Simulated GPS (auto-captured)</p>
        {gps ? (
          <p>
            Lat {gps.lat.toFixed(4)}, Lng {gps.lng.toFixed(4)}
          </p>
        ) : (
          <p>No route data available for this delivery.</p>
        )}
        <input type="hidden" name="gpsLat" value={gps?.lat ?? ""} />
        <input type="hidden" name="gpsLng" value={gps?.lng ?? ""} />
      </div>

      {state.error && <p className="text-sm text-severity-severe">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
