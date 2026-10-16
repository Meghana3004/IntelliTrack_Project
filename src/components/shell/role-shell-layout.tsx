import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/roles";
import { AppShell } from "@/components/shell/app-shell";

export async function RoleShellLayout({
  role,
  children,
}: {
  role: AppRole;
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== role) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.email ?? "User"}
      initialNotifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        relatedExceptionId: n.relatedExceptionId,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))}
    >
      {children}
    </AppShell>
  );
}
