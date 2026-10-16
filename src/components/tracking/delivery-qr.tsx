import { headers } from "next/headers";
import { QrModalButton } from "./qr-modal-button";

/** Renders a QR code encoding this delivery's public tracking URL — tap to enlarge. */
export async function DeliveryQr({ qrCode, size = 96 }: { qrCode: string; size?: number }) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const trackUrl = `${proto}://${host}/track/${qrCode}`;

  return <QrModalButton trackUrl={trackUrl} qrCode={qrCode} size={size} />;
}
