import type { DashboardKpis } from "@/lib/queries/dashboard";
import type { PatternGroup } from "@/lib/queries/patterns";
import type { CarrierScorecardRow } from "@/lib/queries/carriers";
import { KpiCards } from "@/components/regional/kpi-cards";
import { PatternsList } from "@/components/regional/patterns-list";
import { CarrierScorecardTable } from "@/components/regional/carrier-scorecard-table";
import { PrintReportButton } from "@/components/regional/print-report-button";

// Reused as-is by Leadership at company-wide scope — thin composition, not a rebuild.
export function MonthlyReport({
  title,
  scopeLabel,
  generatedAt,
  windowDays,
  kpis,
  patterns,
  carrierRows,
}: {
  title: string;
  scopeLabel: string;
  generatedAt: string;
  windowDays: number;
  kpis: DashboardKpis;
  patterns: PatternGroup[];
  carrierRows: CarrierScorecardRow[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8 print:max-w-none print:gap-4 print:px-0 print:py-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {scopeLabel} · last {windowDays} days · generated {generatedAt}
          </p>
        </div>
        <PrintReportButton />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Key Metrics
        </h2>
        <KpiCards kpis={kpis} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Top Repeated Patterns
        </h2>
        <PatternsList groups={patterns} windowDays={windowDays} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Carrier Scorecard Snapshot
        </h2>
        <CarrierScorecardTable rows={carrierRows} />
      </section>

      <p className="text-xs text-foreground/40">
        Cost figures are a modeled estimate, not actual spend.
      </p>
    </div>
  );
}
