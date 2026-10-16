"use client";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-md border border-dark-slate/15 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-accent hover:text-accent"
    >
      Print / Save as PDF
    </button>
  );
}
