import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShellLayout role="DRIVER">{children}</RoleShellLayout>;
}
