import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscribeTicketMessages } from "@/lib/tickets-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return new Response("Not found", { status: 404 });
  }
  const isOwner = session.user.role === "CUSTOMER" && ticket.customerId === session.user.id;
  const isStaff = session.user.role === "CUSTOMER_SERVICE";
  if (!isOwner && !isStaff) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeTicketMessages(ticketId, (message) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      });
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  req.signal.addEventListener("abort", () => {
    unsubscribe?.();
    if (heartbeat) clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
