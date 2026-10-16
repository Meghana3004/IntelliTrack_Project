import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getExceptionPatterns } from "@/lib/queries/patterns";
import { getCarrierScorecard, sortCarrierRows } from "@/lib/queries/carriers";
import { MonthlyReport } from "@/components/regional/monthly-report";

const WINDOW_DAYS = 30;
const TOP_N = 5;

export default async function RegionalReportPage() {
  const session = await getServerSession(authOptions);
  const regionId = session?.user.regionId;

  if (!regionId) {
    return (
      <p className="px-6 py-8 text-sm text-foreground/60">
        Your account isn&apos;t assigned to a region yet.
      </p>
    );
  }

  const [region, dashboard, patterns, carrierRows] = await Promise.all([
    prisma.region.findUnique({ where: { id: regionId } }),
    getDashboardData({ regionId }),
    getExceptionPatterns({ regionId }, { windowDays: WINDOW_DAYS }),
    getCarrierScorecard({ regionId }, WINDOW_DAYS),
  ]);

  return (
    <MonthlyReport
      title="Monthly Regional Report"
      scopeLabel={region?.name ?? "Region"}
      generatedAt={new Date().toLocaleString()}
      windowDays={WINDOW_DAYS}
      kpis={dashboard.kpis}
      patterns={patterns.slice(0, TOP_N)}
      carrierRows={sortCarrierRows(carrierRows, "exceptionRate", "desc").slice(0, TOP_N)}
    />
  );
}
