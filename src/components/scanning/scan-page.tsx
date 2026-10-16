"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "./qr-scanner";

function extractQrCode(text: string): string {
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    const trackIdx = parts.indexOf("track");
    if (trackIdx !== -1 && parts[trackIdx + 1]) return parts[trackIdx + 1];
  } catch {
    // Not a URL — treat the scanned text as a raw delivery QR code.
  }
  return text.trim();
}

export function ScanPage() {
  const router = useRouter();
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScan = useCallback(
    (text: string) => {
      const code = extractQrCode(text);
      setLastScanned(code);
      router.push(`/track/${code}`);
    },
    [router],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Scan Delivery QR</h1>
      <p className="text-sm text-foreground/60">
        Point the camera at a delivery&apos;s QR code to open its tracking page.
      </p>
      <QrScanner onScan={handleScan} />
      {lastScanned && <p className="text-sm text-foreground/60">Last scanned: {lastScanned}</p>}
    </div>
  );
}
