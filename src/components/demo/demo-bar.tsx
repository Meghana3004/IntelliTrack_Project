"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { ROLES, ROLE_HOME, ROLE_LABEL, type AppRole } from "@/lib/roles";
import { useViewMode } from "@/lib/stores/view-mode";

const SWITCHABLE_ROLES = ROLES.filter((role) => role !== "CUSTOMER");

export function DemoBar({ currentRole }: { currentRole: AppRole | null }) {
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);
  const mode = useViewMode((s) => s.mode);
  const setMode = useViewMode((s) => s.setMode);
  const hydrate = useViewMode((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function switchTo(role: AppRole) {
    if (role === currentRole || pendingRole) return;
    setPendingRole(role);
    await signIn("demo", { role, redirect: false });
    // A full hard navigation, not router.push — every server component on the
    // destination route (nav links, notifications, role-scoped queries) needs
    // to re-read the freshly-set session cookie from scratch. A client-side
    // push/refresh was occasionally landing on stale pre-switch data (looked
    // like "an error that a manual refresh fixes").
    window.location.assign(ROLE_HOME[role]);
  }

  const showViewToggle = currentRole !== null && currentRole !== "DRIVER";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-slate/15 bg-dark-slate px-4 py-1.5 text-xs print:hidden">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 shrink-0 font-semibold uppercase tracking-wide text-app-bg/50">
          Demo · view as
        </span>
        <div role="radiogroup" aria-label="Switch demo role" className="flex flex-wrap gap-1">
          {SWITCHABLE_ROLES.map((role) => {
            const active = role === currentRole;
            return (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={pendingRole !== null}
                onClick={() => switchTo(role)}
                className={`rounded-full px-2.5 py-1 font-medium transition disabled:opacity-50 ${
                  active
                    ? "bg-accent text-white"
                    : "bg-app-bg/10 text-app-bg hover:bg-app-bg/20"
                }`}
              >
                {pendingRole === role ? "Switching…" : ROLE_LABEL[role]}
              </button>
            );
          })}
        </div>
        <span className="ml-1 hidden text-app-bg/40 md:inline">
          Customers normally arrive via a delivery&apos;s QR/track link, not this switcher.
        </span>
      </div>

      {showViewToggle && (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-app-bg/10 p-0.5">
          {(["web", "mobile"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-full px-2.5 py-1 font-medium capitalize transition ${
                mode === option ? "bg-accent text-white" : "text-app-bg/70 hover:text-app-bg"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
