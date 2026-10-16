export type Theme = "light" | "dark";

const STORAGE_KEY = "intellitrack-theme";

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(
    "data-theme",
    theme === "dark" ? "dark" : "light",
  );
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(current: Theme): Theme {
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
