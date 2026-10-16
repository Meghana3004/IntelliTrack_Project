export interface DeliveryOption {
  id: string;
  qrCode: string;
  scheduledEta: string;
  origin: { id: string; name: string; lat: number; lng: number } | null;
  dest: { id: string; name: string; lat: number; lng: number } | null;
}
