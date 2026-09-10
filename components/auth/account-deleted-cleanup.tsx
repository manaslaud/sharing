"use client";

import { useEffect } from "react";
import { clearAllOfflineData } from "@/lib/offline";

export function AccountDeletedCleanup() {
  useEffect(() => {
    void (async () => {
      try {
        await clearAllOfflineData();
        if (!("serviceWorker" in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
      } catch {
        /* best-effort local cleanup */
      }
    })();
  }, []);

  return null;
}
