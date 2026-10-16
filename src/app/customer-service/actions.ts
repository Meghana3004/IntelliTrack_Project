"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CsActionState {
  error?: string;
}

export async function completeCallbackAction(
  _prevState: CsActionState,
  formData: FormData,
): Promise<CsActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER_SERVICE") {
    return { error: "Unauthorized" };
  }

  const callbackId = String(formData.get("callbackId") ?? "");
  if (!callbackId) return { error: "Missing callback id." };

  await prisma.callbackRequest.update({ where: { id: callbackId }, data: { status: "COMPLETED" } });

  revalidatePath("/customer-service");
  return {};
}
