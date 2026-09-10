"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
  updateNotificationPrefsAction,
} from "@/lib/actions/notifications";
import { toast } from "sonner";

type Prefs = {
  sharedContent: boolean;
  reminders: boolean;
  events: boolean;
  pushEnabled: boolean;
};

export function NotificationSettings({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [pushSupported, setPushSupported] = useState(true);
  const [busy, setBusy] = useState(false);

  async function save(next: Prefs) {
    setPrefs(next);
    await updateNotificationPrefsAction(next);
  }

  async function enablePush() {
    setBusy(true);
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushSupported(false);
        toast.error("Push notifications aren't available in this browser.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were not enabled.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Push is not configured on the server.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: json.keys,
      });
      await save({ ...prefs, pushEnabled: true });
      toast.success("Push notifications enabled");
    } catch {
      setPushSupported(false);
      toast.error("Couldn't enable push notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      await save({ ...prefs, pushEnabled: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="font-serif text-xl">Notifications</h2>
      <div className="mt-4 grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Push notifications</Label>
            <p className="text-xs text-muted-foreground">
              {pushSupported
                ? "Get reminders even when the app is closed."
                : "This browser doesn't support Web Push."}
            </p>
          </div>
          {prefs.pushEnabled ? (
            <Button size="sm" variant="secondary" disabled={busy} onClick={disablePush}>
              Disable
            </Button>
          ) : (
            <Button size="sm" disabled={busy || !pushSupported} onClick={enablePush}>
              {busy ? "Enabling…" : "Enable"}
            </Button>
          )}
        </div>
        <Toggle
          label="Shared notes"
          checked={prefs.sharedContent}
          onChange={(sharedContent) => save({ ...prefs, sharedContent })}
        />
        <Toggle
          label="Reminders"
          checked={prefs.reminders}
          onChange={(reminders) => save({ ...prefs, reminders })}
        />
        <Toggle
          label="Events"
          checked={prefs.events}
          onChange={(events) => save({ ...prefs, events })}
        />
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
