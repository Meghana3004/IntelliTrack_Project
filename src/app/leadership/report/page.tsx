import { getDashboardData } from "@/lib/queries/dashboard";
import { getExceptionPatterns } from "@/lib/queries/patterns";
import { getCarrierScorecard, sortCarrierRows } from "@/lib/queries/carriers";
import { MonthlyReport } from "@/components/regional/monthly-report";

const WINDOW_DAYS = 30;
const TOP_N = 5;

export default async function LeadershipReportPage() {
  const [dashboard, patterns, carrierRows] = await Promise.all([
    getDashboardData({}),
    getExceptionPatterns({}, { windowDays: WINDOW_DAYS }),
    getCarrierScorecard({}, WINDOW_DAYS),
  ]);

  return (
    <MonthlyReport
      title="Monthly Company Report"
      scopeLabel="Company-wide"
      generatedAt={new Date().toLocaleString()}
      windowDays={WINDOW_DAYS}
      kpis={dashboard.kpis}
      patterns={patterns.slice(0, TOP_N)}
      carrierRows={sortCarrierRows(carrierRows, "exceptionRate", "desc").slice(0, TOP_N)}
    />
  );
}
