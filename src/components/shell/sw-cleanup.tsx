"use client";

import { useEffect } from "react";

/**
 * One-time cleanup: an earlier build registered public/sw.js without an
 * explicit `scope`, which defaults to "/" (site-wide) rather than "/driver"
 * — so once installed it silently cache-first-served stale HTML for every
 * role, which looked exactly like "switching roles errors, refresh fixes
 * it." The service worker has been removed, but a browser that already
 * installed it keeps running the old cached copy indefinitely until
 * something explicitly unregisters it — so every page mounts this once to
 * unregister any lingering registration and clear its cache.
 */
export function SwCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .catch(() => {});

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith("intellitrack-")).map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }, []);

  return null;
}
