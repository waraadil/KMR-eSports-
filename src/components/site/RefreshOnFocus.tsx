"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Self-healing pages: when the user returns to a tab that has been sitting
 * open (demo data purged elsewhere, results published, a slot filled…),
 * re-fetch the current route's server payload instead of leaving a stale
 * render on screen until a manual reload.
 *
 * Throttled to one refresh per 10s so rapid alt-tabbing doesn't spam.
 * Client component state (open forms, typed input) survives router.refresh().
 */
export default function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    let lastRefresh = Date.now();

    function maybeRefresh() {
      if (Date.now() - lastRefresh < 10_000) return;
      lastRefresh = Date.now();
      router.refresh();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") maybeRefresh();
    }

    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
