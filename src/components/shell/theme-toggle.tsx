"use client";

import { useSyncExternalStore } from "react";
import { toggleTheme, type Theme } from "@/lib/theme";

// data-theme on <html> is external state (set by the inline anti-flash
// script in layout.tsx, and by toggleTheme() below) — useSyncExternalStore
// is the primitive built for exactly this: a getServerSnapshot that matches
// what SSR always renders ("light", since the server has no DOM/localStorage)
// and a getSnapshot that reads the real client value, with no risk of a
// hydration mismatch and no manual useState/useEffect synchronization.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => toggleTheme(theme)}
      className="flex items-center gap-1.5 rounded-full border border-dark-slate/15 bg-app-bg px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-accent hover:text-accent"
      aria-label="Toggle light/dark theme"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-6.66 1.42-1.42M4.92 19.08l1.42-1.42M19.08 19.08l-1.42-1.42M4.92 4.92 6.34 6.34M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
        </svg>
      )}
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
