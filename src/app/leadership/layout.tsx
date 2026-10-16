import { RoleShellLayout } from "@/components/shell/role-shell-layout";

export default async function LeadershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShellLayout role="LEADERSHIP">{children}</RoleShellLayout>;
}
