import { create } from "zustand";

export type ViewMode = "web" | "mobile";

const STORAGE_KEY = "intellitrack-view-mode";

interface ViewModeState {
  mode: ViewMode;
  hydrated: boolean;
  setMode: (mode: ViewMode) => void;
  hydrate: () => void;
}

/**
 * Demo-only "view as mobile" toggle for non-driver roles — purely cosmetic
 * (constrains the layout to a phone-sized frame), never a real device check.
 * Driver ignores this; it always renders its native mobile-first layout.
 */
export const useViewMode = create<ViewModeState>((set) => ({
  mode: "web",
  hydrated: false,
  setMode: (mode) => {
    set({ mode });
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Private browsing / blocked storage — the toggle just won't persist.
    }
  },
  hydrate: () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "mobile" || saved === "web") {
        set({ mode: saved, hydrated: true });
        return;
      }
    } catch {
      // Ignore — default to "web".
    }
    set({ hydrated: true });
  },
}));
