import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getExceptionPatterns } from "@/lib/queries/patterns";
import { PatternsList } from "@/components/regional/patterns-list";
import { WindowSelect } from "@/components/regional/window-select";

const WINDOW_OPTIONS = new Set([7, 14, 30, 60, 90]);

export default async function RegionalPatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ windowDays?: string }>;
}) {
  const { windowDays: windowDaysParam } = await searchParams;
  const windowDays = WINDOW_OPTIONS.has(Number(windowDaysParam)) ? Number(windowDaysParam) : 30;

  const session = await getServerSession(authOptions);
  const regionId = session?.user.regionId;
  if (!regionId) {
    return (
      <p className="px-6 py-8 text-sm text-foreground/60">
        Your account isn&apos;t assigned to a region yet.
      </p>
    );
  }

  const groups = await getExceptionPatterns({ regionId }, { windowDays });
  const visibleGroups = groups.slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Exception Patterns</h1>
        <WindowSelect windowDays={windowDays} />
      </div>
      {groups.length > visibleGroups.length && (
        <p className="text-xs text-foreground/50">
          Showing {visibleGroups.length} of {groups.length} patterns.
        </p>
      )}
      <PatternsList groups={visibleGroups} windowDays={windowDays} />
    </div>
  );
}
