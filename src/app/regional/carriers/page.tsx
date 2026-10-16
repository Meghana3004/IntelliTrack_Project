import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCarrierScorecard, sortCarrierRows, type CarrierSortKey } from "@/lib/queries/carriers";
import { CarrierScorecardTable } from "@/components/regional/carrier-scorecard-table";
import { CarrierSortControls } from "@/components/regional/carrier-sort-controls";

const SORT_KEYS = new Set<CarrierSortKey>(["exceptionRate", "exceptionCount", "avgResolutionHours"]);

export default async function RegionalCarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; direction?: string }>;
}) {
  const { sort: sortParam, direction: directionParam } = await searchParams;
  const sort = SORT_KEYS.has(sortParam as CarrierSortKey) ? (sortParam as CarrierSortKey) : "exceptionRate";
  const direction = directionParam === "asc" ? "asc" : "desc";

  const session = await getServerSession(authOptions);
  const regionId = session?.user.regionId;
  if (!regionId) {
    return (
      <p className="px-6 py-8 text-sm text-foreground/60">
        Your account isn&apos;t assigned to a region yet.
      </p>
    );
  }

  const rows = await getCarrierScorecard({ regionId });
  const sorted = sortCarrierRows(rows, sort, direction);
  const visibleRows = sorted.slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Carrier Scorecard</h1>
        <CarrierSortControls sort={sort} direction={direction} />
      </div>
      {sorted.length > visibleRows.length && (
        <p className="text-xs text-foreground/50">
          Showing {visibleRows.length} of {sorted.length} carriers.
        </p>
      )}
      <CarrierScorecardTable rows={visibleRows} />
    </div>
  );
}
