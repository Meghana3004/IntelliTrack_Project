import { prisma } from "@/lib/prisma";
import { getExceptionPatterns } from "@/lib/queries/patterns";
import { PatternsSummary } from "@/components/leadership/patterns-summary";
import { WindowSelect } from "@/components/regional/window-select";
import { RegionFilter } from "@/components/leadership/region-filter";

const WINDOW_OPTIONS = new Set([7, 14, 30, 60, 90]);

export default async function LeadershipPatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ windowDays?: string; regionId?: string }>;
}) {
  const { windowDays: windowDaysParam, regionId: regionIdParam } = await searchParams;
  const windowDays = WINDOW_OPTIONS.has(Number(windowDaysParam)) ? Number(windowDaysParam) : 30;

  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const regionId = regions.some((r) => r.id === regionIdParam) ? regionIdParam : undefined;

  const scope = regionId ? { regionId } : {};
  const groups = await getExceptionPatterns(scope, { windowDays });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Exception Patterns</h1>
        <div className="flex flex-wrap gap-3">
          <RegionFilter regions={regions} regionId={regionId} />
          <WindowSelect windowDays={windowDays} />
        </div>
      </div>
      <PatternsSummary groups={groups} windowDays={windowDays} />
    </div>
  );
}
