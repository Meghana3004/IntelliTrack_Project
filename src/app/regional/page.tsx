import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCards } from "@/components/regional/kpi-cards";
import { ExceptionHeatmap } from "@/components/regional/exception-heatmap";

export default async function RegionalHome() {
  const session = await getServerSession(authOptions);
  const regionId = session?.user.regionId;

  if (!regionId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Regional Overview</h1>
        <p className="max-w-md text-sm text-foreground/60">
          Your account isn&apos;t assigned to a region yet.
        </p>
      </div>
    );
  }

  const data = await getDashboardData({ regionId });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Regional Overview</h1>
      <KpiCards kpis={data.kpis} />
      <ExceptionHeatmap
        heatPoints={data.heatPoints}
        incidents={data.incidents}
        exceptionLinkBase="/regional/exception"
      />
    </div>
  );
}
