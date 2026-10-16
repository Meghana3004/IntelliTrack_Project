import { prisma } from "@/lib/prisma";
import { getCarrierScorecard } from "@/lib/queries/carriers";
import { CarriersSummary } from "@/components/leadership/carriers-summary";
import { RegionFilter } from "@/components/leadership/region-filter";

export default async function LeadershipCarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ regionId?: string }>;
}) {
  const { regionId: regionIdParam } = await searchParams;

  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const regionId = regions.some((r) => r.id === regionIdParam) ? regionIdParam : undefined;

  const scope = regionId ? { regionId } : {};
  const rows = await getCarrierScorecard(scope);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Carrier Scorecard</h1>
        <RegionFilter regions={regions} regionId={regionId} />
      </div>
      <CarriersSummary rows={rows} />
    </div>
  );
}
