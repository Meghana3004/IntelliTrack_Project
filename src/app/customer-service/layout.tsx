import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShellLayout role="CUSTOMER_SERVICE">{children}</RoleShellLayout>
  );
}
