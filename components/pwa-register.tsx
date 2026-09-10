"use client";

import { useEffect } from "react";
import { registerAppServiceWorker } from "@/lib/push-client";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      if ("caches" in window) {
        void caches.keys().then((keys) =>
          Promise.all(keys.map((key) => caches.delete(key))),
        );
      }
      return;
    }

    let cancelled = false;
    let interval: number | undefined;
    const controller = new AbortController();

    async function start() {
      try {
        const registration = await registerAppServiceWorker();
        if (cancelled) return;

        const update = () => {
          void registration.update().catch(() => undefined);
        };

        document.addEventListener(
          "visibilitychange",
          () => {
            if (document.visibilityState === "visible") update();
          },
          { signal: controller.signal },
        );
        window.addEventListener("focus", update, { signal: controller.signal });
        interval = window.setInterval(update, 60 * 60 * 1000);
      } catch {
        /* unsupported or blocked */
      }
    }

    void start();

    return () => {
      cancelled = true;
      controller.abort();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
