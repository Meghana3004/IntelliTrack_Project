import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReasonForm } from "./reason-form";

export default async function DelayReasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const driver = await prisma.driver.findUnique({ where: { userId: session!.user.id } });
  const exception = await prisma.exception.findUnique({
    where: { id },
    include: { delivery: true },
  });

  if (!exception || !driver || exception.delivery.driverId !== driver.id) notFound();

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Report Delay Reason</h1>
      <p className="mb-1 text-sm text-foreground/60">
        Delivery {exception.delivery.qrCode} was auto-flagged as delayed. Let the warehouse know
        what happened.
      </p>
      <p className="mb-6 whitespace-pre-line rounded-md border border-dark-slate/10 bg-app-surface p-3 text-xs text-foreground/60">
        {exception.description}
      </p>
      <ReasonForm exceptionId={exception.id} />
    </div>
  );
}
