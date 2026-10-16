import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function RegionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShellLayout role="REGIONAL_MANAGER">{children}</RoleShellLayout>
  );
}
