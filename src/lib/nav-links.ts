import type { AppRole } from "@/lib/roles";

export const NAV_LINKS: Record<AppRole, { href: string; label: string }[]> = {
  DRIVER: [
    { href: "/driver", label: "My Deliveries" },
    { href: "/driver/exception/new", label: "Report Exception" },
    { href: "/driver/scan", label: "Scan QR" },
  ],
  WAREHOUSE_MANAGER: [
    { href: "/warehouse", label: "Exception Queue" },
    { href: "/warehouse/scan", label: "Scan QR" },
    { href: "/warehouse/live", label: "Live Tracking" },
  ],
  REGIONAL_MANAGER: [
    { href: "/regional", label: "Overview" },
    { href: "/regional/patterns", label: "Patterns" },
    { href: "/regional/carriers", label: "Carriers" },
    { href: "/regional/report", label: "Monthly Report" },
    { href: "/regional/live", label: "Live Tracking" },
  ],
  CUSTOMER_SERVICE: [{ href: "/customer-service", label: "Tickets" }],
  LEADERSHIP: [
    { href: "/leadership", label: "Company Overview" },
    { href: "/leadership/carriers", label: "Carriers" },
    { href: "/leadership/report", label: "Monthly Report" },
  ],
  CUSTOMER: [
    { href: "/customer", label: "My Deliveries" },
    { href: "/customer/support/new", label: "Raise a Concern" },
  ],
};
