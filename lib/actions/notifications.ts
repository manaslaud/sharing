"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSpaceContext, requireUser } from "@/lib/session";
import {
  notificationPrefsSchema,
  pushSubscriptionSchema,
} from "@/lib/validations/settings";

export async function markNotificationReadAction(id: string) {
  const ctx = await getSpaceContext();
  await prisma.notification.updateMany({
    where: { id, userId: ctx.userId },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const ctx = await getSpaceContext();
  await prisma.notification.updateMany({
    where: { userId: ctx.userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function updateNotificationPrefsAction(input: unknown) {
  const parsed = notificationPrefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function savePushSubscriptionAction(input: unknown) {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: {
      userId: user.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    create: {
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: { pushEnabled: true },
    create: { userId: user.id, pushEnabled: true },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function deletePushSubscriptionAction(endpoint: string) {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({
    where: { userId: user.id, endpoint },
  });
  const remaining = await prisma.pushSubscription.count({
    where: { userId: user.id },
  });
  if (!remaining) {
    await prisma.notificationPreference.updateMany({
      where: { userId: user.id },
      data: { pushEnabled: false },
    });
  }
  revalidatePath("/settings");
  return { ok: true };
}
