"use client";

import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
  updateNotificationPrefsAction,
} from "@/lib/actions/notifications";
import {
  clearPushWanted,
  markPushWanted,
  registerAppServiceWorker,
  subscriptionPayload,
  urlBase64ToUint8Array,
} from "@/lib/push-client";
import { toast } from "sonner";
import { usePendingAction } from "@/lib/use-pending-action";

type Prefs = {
  sharedContent: boolean;
  reminders: boolean;
  events: boolean;
  pushEnabled: boolean;
};

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

export function NotificationSettings({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [pushSupported, setPushSupported] = useState(true);
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pushLock = useRef(false);
  const { pending: prefsPending, run: runPrefs } = usePendingAction();
  const controlsBusy = busy || prefsPending;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => setDeviceSubscribed(Boolean(subscription)))
      .catch(() => setDeviceSubscribed(false));
  }, []);

  function save(next: Prefs) {
    if (prefsPending) return;
    setPrefs(next);
    runPrefs(() => updateNotificationPrefsAction(next));
  }

  async function enablePush() {
    if (pushLock.current) return;
    pushLock.current = true;
    setBusy(true);
    try {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setPushSupported(false);
        toast.error("Push notifications aren't available in this browser.");
        return;
      }
      if (isIos() && !isStandalone()) {
        toast.error(
          "On iPhone, add this site to the Home Screen, open it from there, then enable push.",
        );
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were not enabled.");
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error(
          "Push is not configured on the server. Redeploy after setting VAPID keys.",
        );
        return;
      }
      const registration = await registerAppServiceWorker();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const payload = subscriptionPayload(subscription);
      if (!payload.endpoint || !payload.keys.p256dh || !payload.keys.auth) {
        toast.error("This browser didn't return a valid push subscription.");
        return;
      }
      const result = await savePushSubscriptionAction(payload);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't save this device for push.");
        return;
      }
      markPushWanted();
      setPrefs((current) => ({ ...current, pushEnabled: true }));
      setDeviceSubscribed(true);
      toast.success("This device will get reminder alerts.");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't enable push notifications.");
    } finally {
      pushLock.current = false;
      setBusy(false);
    }
  }

  async function disablePush() {
    if (pushLock.current) return;
    pushLock.current = true;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      clearPushWanted();
      setDeviceSubscribed(false);
      await save({ ...prefs, pushEnabled: false });
    } finally {
      pushLock.current = false;
      setBusy(false);
    }
  }

  const needsDeviceSetup = !deviceSubscribed;

  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="font-serif text-xl">Notifications</h2>
      <div className="mt-4 grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Label>Push notifications</Label>
            <p className="text-xs text-muted-foreground">
              {!pushSupported
                ? "This browser doesn't support Web Push."
                : needsDeviceSetup
                  ? "This device isn't subscribed yet. Enable here on the live site in Chrome."
                  : "This device will get reminder alerts when the app is closed."}
            </p>
          </div>
          {needsDeviceSetup ? (
            <Button
              size="sm"
              className="shrink-0"
              loading={busy}
              disabled={!pushSupported || controlsBusy}
              onClick={enablePush}
            >
              {busy ? "Enabling…" : "Enable"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="shrink-0"
              variant="secondary"
              loading={busy}
              disabled={controlsBusy}
              onClick={disablePush}
            >
              {busy ? "Disabling…" : "Disable"}
            </Button>
          )}
        </div>
        <Toggle
          label="Shared notes"
          checked={prefs.sharedContent}
          disabled={controlsBusy}
          onChange={(sharedContent) => save({ ...prefs, sharedContent })}
        />
        <Toggle
          label="Reminders"
          checked={prefs.reminders}
          disabled={controlsBusy}
          onChange={(reminders) => save({ ...prefs, reminders })}
        />
        <Toggle
          label="Events"
          checked={prefs.events}
          disabled={controlsBusy}
          onChange={(events) => save({ ...prefs, events })}
        />
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
