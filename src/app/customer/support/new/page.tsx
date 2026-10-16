import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewSupportTicketPage() {
  const session = await getServerSession(authOptions);
  const deliveries = await prisma.delivery.findMany({
    where: { customerId: session!.user.id },
    orderBy: { scheduledEta: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Raise a Concern</h1>
      <NewTicketForm deliveries={deliveries.map((d) => ({ id: d.id, qrCode: d.qrCode }))} />
    </div>
  );
}
