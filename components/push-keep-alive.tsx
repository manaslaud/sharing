"use client";

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/push-client";

export function PushKeepAlive() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;
    let lastSync = 0;

    async function sync() {
      if (cancelled) return;
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastSync < 30_000) return;
      lastSync = Date.now();
      try {
        await ensurePushSubscription();
      } catch {
        /* keep-alive is best-effort */
      }
    }

    void sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return null;
}
