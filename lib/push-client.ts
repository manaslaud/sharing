"use client";

import { savePushSubscriptionAction } from "@/lib/actions/notifications";

const PUSH_WANTED_KEY = "sharing.push-wanted";

export function markPushWanted() {
  try {
    localStorage.setItem(PUSH_WANTED_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearPushWanted() {
  try {
    localStorage.removeItem(PUSH_WANTED_KEY);
  } catch {
    /* private mode */
  }
}

function isPushWanted() {
  try {
    return localStorage.getItem(PUSH_WANTED_KEY) === "1";
  } catch {
    return false;
  }
}

export async function registerAppServiceWorker() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

async function getAppServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    await navigator.serviceWorker.register("/sw.js");
  }
  return navigator.serviceWorker.ready;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dhKey = subscription.getKey("p256dh");
  const authKey = subscription.getKey("auth");
  const p256dh =
    json.keys?.p256dh ?? (p256dhKey ? arrayBufferToBase64Url(p256dhKey) : "");
  const auth = json.keys?.auth ?? (authKey ? arrayBufferToBase64Url(authKey) : "");
  return {
    endpoint: json.endpoint || subscription.endpoint,
    keys: { p256dh, auth },
  };
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function ensurePushSubscription() {
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return false;
  }
  if (Notification.permission !== "granted") return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return false;

  const registration = await getAppServiceWorker();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    if (!isPushWanted()) return false;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const payload = subscriptionPayload(subscription);
  if (!payload.endpoint || !payload.keys.p256dh || !payload.keys.auth) {
    return false;
  }
  const result = await savePushSubscriptionAction(payload);
  if (result.ok) markPushWanted();
  return result.ok;
}
