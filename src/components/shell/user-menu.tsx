"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function UserMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-slate text-xs font-semibold text-white"
        aria-label="User menu"
      >
        {userName.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close user menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-dark-slate/10 bg-app-surface p-2 shadow-lg">
            <p className="truncate px-2 py-1 text-sm font-medium text-foreground">
              {userName}
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground/70 transition hover:bg-severity-severe/10 hover:text-severity-severe"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
