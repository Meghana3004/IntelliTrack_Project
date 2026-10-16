import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { subscribeNewTickets } from "@/lib/tickets-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER_SERVICE") {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeNewTickets((ticket) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ticket)}\n\n`));
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
