import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompletionForm } from "./signature-form";

export default async function CompleteDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const driver = await prisma.driver.findUnique({ where: { userId: session!.user.id } });
  const delivery = driver ? await prisma.delivery.findUnique({ where: { id } }) : null;

  if (!delivery || delivery.driverId !== driver?.id) notFound();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 pb-20">
      <h1 className="mb-2 text-xl font-semibold text-foreground">Complete Delivery</h1>
      <p className="mb-5 text-sm text-foreground/60">
        {delivery.qrCode} — capture the recipient&apos;s signature to confirm delivery.
      </p>
      <CompletionForm deliveryId={delivery.id} />
    </div>
  );
}
