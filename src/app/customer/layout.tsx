import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShellLayout role="CUSTOMER">{children}</RoleShellLayout>;
}
