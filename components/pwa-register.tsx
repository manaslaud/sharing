"use client";

import { useEffect } from "react";
import { registerAppServiceWorker } from "@/lib/push-client";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

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

    async function start() {
      try {
        const registration = await registerAppServiceWorker();
        if (cancelled) return;
        interval = window.setInterval(() => {
          void registration.update().catch(() => undefined);
        }, UPDATE_INTERVAL_MS);
      } catch {
        /* unsupported or blocked */
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
