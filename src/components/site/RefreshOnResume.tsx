"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresh server-rendered data when a backgrounded or bfcache-restored page returns. */
export default function RefreshOnResume() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshAt = 0;

    function refreshIfCurrent() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;

      // pageshow and visibilitychange can fire together after a bfcache restore.
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      router.refresh();
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) refreshIfCurrent();
    }

    document.addEventListener("visibilitychange", refreshIfCurrent);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", refreshIfCurrent);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfCurrent);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", refreshIfCurrent);
    };
  }, [router]);

  return null;
}
