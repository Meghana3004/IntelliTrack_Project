import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { classifyIntent } from "@/lib/chat/intents";
import { getDashboardData, type DashboardScope } from "@/lib/queries/dashboard";
import { getCarrierScorecard, sortCarrierRows } from "@/lib/queries/carriers";
import { getExceptionPatterns } from "@/lib/queries/patterns";
import { answerChatQuery } from "@/lib/ai/provider";

const ALLOWED_ROLES = new Set(["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "LEADERSHIP"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scope is derived strictly from the session, never from user input — the
  // chat message can only pick which canned, already-scoped query runs.
  let scope: DashboardScope;
  if (session.user.role === "WAREHOUSE_MANAGER") {
    if (!session.user.warehouseId) {
      return NextResponse.json({ error: "No warehouse assigned to your account." }, { status: 403 });
    }
    scope = { warehouseId: session.user.warehouseId };
  } else if (session.user.role === "REGIONAL_MANAGER") {
    if (!session.user.regionId) {
      return NextResponse.json({ error: "No region assigned to your account." }, { status: 403 });
    }
    scope = { regionId: session.user.regionId };
  } else {
    scope = {};
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const intent = classifyIntent(message);
  let data: unknown;

  switch (intent) {
    case "carrier_scorecard": {
      const rows = await getCarrierScorecard(scope);
      data = sortCarrierRows(rows, "exceptionRate", "desc").slice(0, 5);
      break;
    }
    case "patterns": {
      data = await getExceptionPatterns(scope, { windowDays: 30, threshold: 3 });
      break;
    }
    case "sla_breach": {
      const { kpis } = await getDashboardData(scope);
      data = { slaBreachRate: kpis.slaBreachRate, activeExceptions: kpis.activeExceptions, windowDays: kpis.windowDays };
      break;
    }
    case "exception_count": {
      const { kpis } = await getDashboardData(scope);
      data = {
        totalExceptions: kpis.totalExceptions,
        activeExceptions: kpis.activeExceptions,
        windowDays: kpis.windowDays,
      };
      break;
    }
    case "kpi_summary":
    default: {
      const dashboard = await getDashboardData(scope);
      data = dashboard.kpis;
    }
  }

  const answer = await answerChatQuery(message, data);
  return NextResponse.json({ answer, intent });
}
