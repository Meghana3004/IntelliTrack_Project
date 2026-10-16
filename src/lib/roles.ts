export const ROLES = [
  "DRIVER",
  "WAREHOUSE_MANAGER",
  "REGIONAL_MANAGER",
  "CUSTOMER_SERVICE",
  "LEADERSHIP",
  "CUSTOMER",
] as const;

export type AppRole = (typeof ROLES)[number];

export const ROLE_HOME: Record<AppRole, string> = {
  DRIVER: "/driver",
  WAREHOUSE_MANAGER: "/warehouse",
  REGIONAL_MANAGER: "/regional",
  CUSTOMER_SERVICE: "/customer-service",
  LEADERSHIP: "/leadership",
  CUSTOMER: "/customer",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  DRIVER: "Driver",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  REGIONAL_MANAGER: "Regional Manager",
  CUSTOMER_SERVICE: "Customer Service",
  LEADERSHIP: "Leadership",
  CUSTOMER: "Customer",
};

export function isAppRole(value: string): value is AppRole {
  return (ROLES as readonly string[]).includes(value);
}
