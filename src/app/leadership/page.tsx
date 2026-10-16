import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCards } from "@/components/regional/kpi-cards";
import { ExceptionHeatmap } from "@/components/regional/exception-heatmap";
import { RegionFilter } from "@/components/leadership/region-filter";

export default async function LeadershipHome({
  searchParams,
}: {
  searchParams: Promise<{ regionId?: string }>;
}) {
  const { regionId: regionIdParam } = await searchParams;

  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const regionId = regions.some((r) => r.id === regionIdParam) ? regionIdParam : undefined;

  const scope = regionId ? { regionId } : {};
  const data = await getDashboardData(scope);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Company Overview</h1>
        <RegionFilter regions={regions} regionId={regionId} />
      </div>
      <KpiCards kpis={data.kpis} />
      <ExceptionHeatmap
        heatPoints={data.heatPoints}
        incidents={data.incidents}
        exceptionLinkBase="/leadership/exception"
      />
    </div>
  );
}
