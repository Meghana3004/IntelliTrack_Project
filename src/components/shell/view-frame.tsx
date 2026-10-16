"use client";

import { useEffect } from "react";
import { useViewMode } from "@/lib/stores/view-mode";

/**
 * Demo-only "view as mobile" wrapper for non-driver roles — a cosmetic phone
 * frame around the real (responsive) page, not a separate mobile build.
 * Driver never uses this; it has its own native mobile-first layout.
 */
export function ViewFrame({ children }: { children: React.ReactNode }) {
  const mode = useViewMode((s) => s.mode);
  const hydrate = useViewMode((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (mode !== "mobile") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 justify-center bg-dark-slate/[0.03] py-6 print:bg-transparent print:py-0">
      <div className="flex w-[390px] max-w-full flex-col overflow-hidden rounded-[2rem] border-4 border-dark-slate/15 bg-app-bg shadow-2xl print:w-full print:rounded-none print:border-0 print:shadow-none">
        {children}
      </div>
    </div>
  );
}
