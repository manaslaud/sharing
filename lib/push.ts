import webpush from "web-push";
import { prisma } from "@/lib/db";
import {
  notifyEventSoon,
  notifyReminderDue,
} from "@/lib/notifications";

function configurePush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:shared-space@localhost";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendPush(
  userId: string,
  payload: { title: string; body?: string; url?: string },
) {
  if (!configurePush()) return;
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (pref && !pref.pushEnabled) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const status =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }),
  );
}

export async function dispatchDueNotifications() {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000);

  const reminders = await prisma.reminder.findMany({
    where: {
      deletedAt: null,
      completedAt: null,
      dueAt: { lte: now },
      lastNotifiedAt: null,
    },
    include: {
      sharedSpace: { include: { members: true } },
    },
  });

  for (const reminder of reminders) {
    const userIds = reminder.sharedSpaceId
      ? reminder.assignedToId
        ? [reminder.assignedToId]
        : reminder.sharedSpace?.members.map((member) => member.userId) ?? [
            reminder.creatorId,
          ]
      : [reminder.assignedToId ?? reminder.creatorId];

    await notifyReminderDue({
      userIds,
      title: reminder.title,
      reminderId: reminder.id,
    });

    for (const userId of userIds) {
      await sendPush(userId, {
        title: "Reminder",
        body: reminder.title,
        url: "/",
      });
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { lastNotifiedAt: now },
    });
  }

  const events = await prisma.event.findMany({
    where: {
      lastNotifiedAt: null,
      startAt: { gt: now, lte: soon },
    },
    include: {
      sharedSpace: { include: { members: true } },
    },
  });

  for (const event of events) {
    const userIds = event.sharedSpace.members.map((member) => member.userId);
    await notifyEventSoon({
      userIds,
      title: event.title,
      eventId: event.id,
    });
    for (const userId of userIds) {
      await sendPush(userId, {
        title: "Upcoming event",
        body: `${event.title} starts in 30 minutes`,
        url: "/calendar",
      });
    }
    await prisma.event.update({
      where: { id: event.id },
      data: { lastNotifiedAt: now },
    });
  }

  return { reminders: reminders.length, events: events.length };
}
