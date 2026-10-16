"use client";

import { useEffect, useRef } from "react";

const REGION_ID = "qr-scanner-region";

export function QrScanner({ onScan }: { onScan: (decodedText: string) => void }) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      scanner = new Html5Qrcode(REGION_ID);
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => onScanRef.current(decodedText),
          () => {
            // Per-frame "no QR found" callback — expected constantly, ignore.
          },
        )
        .catch(() => {
          // Camera unavailable/denied — the region stays empty, no crash.
        });
    });

    return () => {
      cancelled = true;
      scanner
        ?.stop()
        .then(() => scanner?.clear())
        .catch(() => {});
    };
  }, []);

  return <div id={REGION_ID} className="mx-auto w-full max-w-sm overflow-hidden rounded-lg" />;
}
