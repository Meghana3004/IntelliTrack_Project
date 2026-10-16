import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShellLayout role="WAREHOUSE_MANAGER">{children}</RoleShellLayout>
  );
}
