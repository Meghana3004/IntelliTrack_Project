"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

/**
 * Small QR thumbnail that's actually tappable — opens a full-size modal (plus
 * a direct link to the tracking page). Previously the thumbnail was static
 * with no way to see it larger, which made it useless for someone to
 * actually scan off a small phone screen.
 */
export function QrModalButton({
  trackUrl,
  qrCode,
  size = 96,
}: {
  trackUrl: string;
  qrCode: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const trackPath = (() => {
    try {
      return new URL(trackUrl).pathname;
    } catch {
      return trackUrl;
    }
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md border border-dark-slate/10 bg-white p-1 transition hover:border-accent"
        aria-label={`Enlarge QR code for delivery ${qrCode}`}
      >
        <QRCodeSVG value={trackUrl} size={size} bgColor="#ffffff" fgColor="#1b1f26" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          {/*
            Deliberately hardcoded white/black here, not the theme tokens — a
            QR code needs to stay high-contrast and scannable regardless of
            light/dark mode, same reasoning as the signature pad.
          */}
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG value={trackUrl} size={240} bgColor="#ffffff" fgColor="#1b1f26" />
            <p className="text-sm font-medium text-[#1b1f26]">{qrCode}</p>
            <div className="flex gap-2">
              <Link
                href={trackPath}
                onClick={() => setOpen(false)}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open tracking page
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#1b1f26]/20 px-4 py-2 text-sm font-medium text-[#1b1f26]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
